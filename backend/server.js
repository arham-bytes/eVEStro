const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');// Route imports
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');

const app = express();

// Connect to database
// connectDB(); // Removing old non-awaited call

// Middleware
app.use(helmet());
// Allow cross-origin image requests (cloudinary)
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per IP per windowMs. High for testing, should be lower for prod.
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
    'https://evestro.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => origin === allowed) || 
                         origin.endsWith('.vercel.app');

        if (isAllowed) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to ensure DB connection for every request (important for serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Evestro API is running 🚀' });
});

// Error handler
app.use(errorHandler);

// Handle unhandled routes
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start server after DB connection
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`\n🚀 Evestro API running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 URL: http://localhost:${PORT}\n`);
        });
    } catch (error) {
        console.error(`❌ Server Initialization Failed: ${error.message}`);
    }
};

startServer();

module.exports = app;
