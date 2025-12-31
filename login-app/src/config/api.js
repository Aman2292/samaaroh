// API Configuration
// Automatically selects backend based on where the frontend is loaded from

const getBaseUrl = () => {
    // If running on localhost (dev machine), use local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5001';
    }
    // If running from ngrok, Netlify, or elsewhere (mobile), use the ngrok URL
    return 'https://21bff23aebe0.ngrok-free.app';
};

const API_BASE_URL = getBaseUrl();

export default API_BASE_URL;
