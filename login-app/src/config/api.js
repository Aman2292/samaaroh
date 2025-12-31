// API Configuration
// Automatically selects backend based on where the frontend is loaded from

const getBaseUrl = () => {
    // If running on localhost (dev machine), use local backend port
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'https://samaaroh-1.onrender.com';
    }
    // For Production (Netlify, Mobile, etc.), use the live Render Backend
    return 'https://samaaroh-1.onrender.com';
};

const API_BASE_URL = getBaseUrl();

export default API_BASE_URL;
