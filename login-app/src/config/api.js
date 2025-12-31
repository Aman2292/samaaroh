// API Configuration
// Automatically selects backend based on where the frontend is loaded from

const getBaseUrl = () => {
    // If running on localhost (dev machine), use local backend port
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5001';
    }
    // For Production (Render, Ngrok, etc.), use the same origin as the page
    // This works because the backend is serving the frontend
    return window.location.origin;
};

const API_BASE_URL = getBaseUrl();

export default API_BASE_URL;
