require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const expressApp = express();
expressApp.use(express.json({ limit: '50mb' }));

/* ==========================================================================
   ENVIRONMENT-AWARE DYNAMIC CORS ENGINE
   ========================================================================== */
// Explicitly whitelist your local testing environments and your production deployment domain URL
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // ⚠️ TODO: Replace this placeholder with your exact frontend URL once deployed on Render/Vercel
    'https://pulseone3.netlify.app' 
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy Blocked: Request origin not allowed by PulseOne Network rules.'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
};

expressApp.use(cors(corsOptions));

// Wrap Express with HTTP Server to attach WebSockets
const httpServer = createServer(expressApp);
const io = new Server(httpServer, {
    cors: corsOptions // Shares the exact same security rules matrix
});

// Pass Socket.io instance to Express App Context
expressApp.set('socketio', io);

/* ==========================================================================
   DATABASE TUNNEL PLUMBING (DYNAMIC DEFAULTS)
   ========================================================================== */
// Mongoose connection string falls back cleanly to local instance if MONGO_URI is missing from the environment variables
const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pulseone_core';
console.log(`[SYSTEM] Initializing database handshake loop...`);

mongoose.connect(dbURI)
.then(() => console.log('[SYSTEM] MongoDB Connected to cluster successfully...'))
.catch(err => console.error('MongoDB error:', err));

// Routes
expressApp.use('/api/auth/patient', require('./routes/patientAuth'));
expressApp.use('/api/auth/doctor', require('./routes/doctorAuth'));

// Catch-all 404 handler returning explicit JSON instead of HTML to protect client parsing loops
expressApp.use((req, res) => {
    res.status(404).json({ success: false, message: `Route endpoint context ${req.originalUrl} not resolved.` });
});

/* ==========================================================================
   SOCKET.IO REAL-TIME UNIFIED COUPLING PIPELINE
   ========================================================================== */
io.on('connection', (socket) => {
    console.log(`[SYNAPSE CONNECTED] Real-time loop established: ${socket.id}`);

    // Watch for changes to clinical service listings
    socket.on('doctor_updated_services', (updatedData) => {
        socket.broadcast.emit('patient_receive_live_services', updatedData);
    });

    // Watch for triage booking locks
    socket.on('triage_slot_locked', (bookingDetails) => {
        socket.broadcast.emit('patient_slot_confirmed', bookingDetails);
    });

    // Doctors submit a dynamic real-time bid from their command panels
    socket.on('doctor_submits_live_bid', async (bidPayload) => {
        try {
            io.emit('patient_receive_live_bid', {
                triageId: bidPayload.triageId,
                doctorId: bidPayload.doctorId,
                provider: `${bidPayload.doctorName} (${bidPayload.clinicTitle})`,
                price: bidPayload.quotedPrice,
                eta: bidPayload.etaSynapse,
                rating: 4.9
            });
        } catch (e) { 
            console.error("Bidding engine transmission exception:", e); 
        }
    });

    // Patient selects a bid option, triggering allocation notifications to the provider
    socket.on('patient_accepts_provider_bid', (selectionPayload) => {
        io.emit('doctor_received_bid_acceptance', selectionPayload);
    });

    socket.on('disconnect', () => {
        console.log(`[SYNAPSE DISCONNECTED] Link severed: ${socket.id}`);
    });
});

/* ==========================================================================
   PORT MANAGEMENT TUNING
   ========================================================================== */
// Render assigns an environment PORT dynamically. Locally, it uses 5000.
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[SERVER RUNNING] Operating cleanly over port: ${PORT}`);
    console.log(`[ENVIRONMENT] Active Layer Configuration: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
});