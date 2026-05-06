import socket
import logging
from django.core.mail.backends.smtp import EmailBackend

logger = logging.getLogger('users')


class RobustSMTPEmailBackend(EmailBackend):
    """
    Custom SMTP backend that forces IPv4 DNS resolution.
    Fixes [Errno 101] Network is unreachable on Render (IPv6 issue).
    Also falls back from port 587 → port 465 if TLS fails.
    """

    def open(self):
        if self.connection:
            return False

        # Patch getaddrinfo to force IPv4 for this connection only
        _orig = socket.getaddrinfo

        def _ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
            return _orig(host, port, socket.AF_INET, type, proto, flags)

        socket.getaddrinfo = _ipv4_only
        try:
            logger.info(f"[Email] Connecting to {self.host}:{self.port} (IPv4 forced)")
            result = super().open()
            logger.info("[Email] SMTP connection established successfully")
            return result
        except OSError as e:
            logger.warning(f"[Email] Port {self.port} failed: {e}. Trying port 465/SSL...")
            # Fallback: try port 465 with SSL
            self._try_port_465()
        finally:
            socket.getaddrinfo = _orig

    def _try_port_465(self):
        """Fallback to port 465 with SSL."""
        import smtplib
        import ssl
        from django.core.mail.utils import DNS_NAME
        try:
            ctx = ssl.create_default_context()
            self.connection = smtplib.SMTP_SSL(
                self.host, 465,
                local_hostname=DNS_NAME.get_fqdn(),
                timeout=self.timeout,
                context=ctx,
            )
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            logger.info("[Email] Connected via port 465/SSL fallback")
        except Exception as e2:
            logger.error(f"[Email] Port 465 fallback also failed: {e2}")
            if not self.fail_silently:
                raise
