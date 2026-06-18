const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileVector: { type: String, required: true }, // Aligned to verified MongoDB string footprints
    passwordHash: { type: String, required: true },
    isRoyaltyMember: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0.00 },
    
    // EXPLICIT STRUCTURAL HEALTH PROFILE RECORD FIELD DATA FIELDS
    alternateContact: { type: String, default: "" },
    dob: { type: String, default: "1992-08-15" },
    address: { type: String, default: "B-105 Green Residency, Sector 62, Noida, Uttar Pradesh" },
    bloodGroup: { type: String, default: "B+" },
    height: { type: Number, default: 178 }, 
    weight: { type: Number, default: 74 },
    allergies: { type: String, default: "Penicillin" },
    chronicConditions: { type: String, default: "Diabetes Type 2" },
    medications: { type: String, default: "Metformin" },
    organDonor: { type: String, default: "No" },
    insuranceProvider: { type: String, default: "Star Health" }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);