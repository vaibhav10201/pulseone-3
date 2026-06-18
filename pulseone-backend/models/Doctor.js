const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    // Basic Details (Step 1 Registration)
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, unique: true },
    ownerTel: { type: String },
    superintendentName: { type: String },
    superindependentTel: { type: String },
    receptionTel: { type: String },
    ambulanceTel: { type: String },
    clinicTitle: { type: String, required: true },
    addressVector: { type: String, required: true },
    passwordHash: { type: String, required: true },
    
    // Contract / Compliance (Step 2 - 4)
    isPartner: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    attestationSignatureName: { type: String },
    signatureImageBase64: { type: String },
    contractExecutedAt: { type: Date },

    // Core Patient Search Taxonomy Binders (Fixed Update Handshake)
    practitionerType: { 
        type: String, 
        enum: ['general-physician', 'dermatologist', 'gynecologist', 'cardiologist', 'dental', 'pediatrician'],
        default: 'general-physician'
    },
    specialitiesList: [{ type: String }], 
    specialitySummary: { type: String, default: "" }, 
    baseConsultationFee: { type: Number, default: 0 },
    supportedModes: [{ type: String }], 
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    experienceYears: { type: Number, default: 0 },

    // Dynamic Services Array
    services: [{
        title: { type: String, required: true },
        category: { type: String, default: "In-Clinic Visit" },
        price: { type: Number, required: true }
    }],
    earningsWalletBalance: { type: Number, default: 0.00 },
    totalConsultationsCount: { type: Number, default: 0 },
    networkRating: { type: Number, default: 5.0 },
    isRoyaltyMember: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);