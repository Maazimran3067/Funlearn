const BACKEND_URL = 'https://funlearn-o3b9.onrender.com';

export function startKeepAlive() {
  const ping = () => {
    fetch(`${BACKEND_URL}/api/users/health/`, { method: 'GET' })
      .catch(() => {});
  };
  ping();
  setInterval(ping, 4 * 60 * 1000); // every 4 minutes (Render sleeps after 5)
}