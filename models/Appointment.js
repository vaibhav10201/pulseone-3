const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    // Changed from ObjectId to String to eliminate casting verification breaks
    patientId: { type: String, required: true, index: true }, 
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    clinicTitle: { type: String, required: true },
    appointmentDate: { type: String, required: true }, // YYYY-MM-DD
    appointmentTime: { type: String, required: true }, // HH:MM AM/PM
    computedFee: { type: Number, required: true, default: 500 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);