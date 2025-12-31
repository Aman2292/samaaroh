const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teamRoutes = require('./routes/teamRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const venueRoutes = require('./routes/venueRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const guestRoutes = require('./routes/guestRoutes');
const documentRoutes = require('./routes/documentRoutes');
const translationRoutes = require('./routes/translationRoutes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for mobile testing via ngrok
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const activityLogger = require('./middleware/activityLogger');
app.use(activityLogger);

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/venue', venueRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/translate', translationRoutes);

// Serve static files
app.use('/invoices', express.static('public/invoices'));
app.use('/documents', express.static('public/documents'));

// Serve Frontend Static Files (from login-app/dist)
const path = require('path');
const frontendPath = path.join(__dirname, '../login-app/dist');
app.use(express.static(frontendPath));

// Handle React Routing (fallback to index.html for non-API routes)
app.get('*', (req, res, next) => {
    // If request path starts with /api or /invoices, skip to 404 handler
    if (req.path.startsWith('/api') || req.path.startsWith('/invoices')) {
        return next();
    }
    // Otherwise serve index.html for client-side routing
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const listEndpoints = require('express-list-endpoints');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
