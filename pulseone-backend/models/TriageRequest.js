const mongoose = require('mongoose');

const TriageRequestSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    symptomSummary: { type: String, required: true }, // Houses user disease context or test requirements
    protocolType: { type: String, required: true },    // e.g., "Instant Video Consultation Hub"
    selectedTimeSlot: { type: String, default: null },
    status: { 
        type: String, 
        enum: ['pending', 'allocated', 'completed', 'dropped'], 
        default: 'pending' 
    },
    feeTransacted: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('TriageRequest', TriageRequestSchema);