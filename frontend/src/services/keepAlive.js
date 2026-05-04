// Pings the backend every 10 minutes to prevent Render cold starts
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export function startKeepAlive() {
  const ping = () => {
    // Ye request bhejega: https://funlearn-o3b9.onrender.com/health/
    fetch(`${BACKEND_URL}/health/`, { method: 'GET' })
      .catch(() => {}); // silently ignore errors
  };
  ping(); // ping immediately on load
  setInterval(ping, 10 * 60 * 1000); // then every 10 minutes
}