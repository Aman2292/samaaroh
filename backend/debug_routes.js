const express = require('express');
const authRoutes = require('./routes/authRoutes');
const listEndpoints = require('express-list-endpoints');

console.log('--- DEBUGGING AUTH ROUTES ---');
console.log('Type of authRoutes:', typeof authRoutes);
console.log('Is function (Router is a function)?', typeof authRoutes === 'function');

if (authRoutes.stack) {
    console.log('Number of routes in authRoutes:', authRoutes.stack.length);
    authRoutes.stack.forEach((layer, index) => {
        if (layer.route) {
            console.log(`Route ${index}: ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
        }
    });
} else {
    console.log('authRoutes has NO stack. It might not be a Router instance.');
}

const app = express();
try {
    app.use('/api/auth', authRoutes);
    console.log('\nMounted /api/auth. Active Endpoints:');
    console.log(listEndpoints(app));
} catch (error) {
    console.error('Error mounting routes:', error);
}
console.log('--- END DEBUG ---');
