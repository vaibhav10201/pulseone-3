const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const TriageRequest = require('../models/TriageRequest');
const LiveBid = require('../models/LiveBid');
const Appointment = require('../models/Appointment');

const JWT_SECRET = process.env.JWT_SECRET || 'PULSEONE_EMERGENCY_DESK_CORE_KEY_TOKEN';

/* ==========================================================================
   STAGE 1: PATIENT REGISTRATION (WITH EXPLICIT HEALTH DEFAULTS)
   ========================================================================== */
router.post('/register', async (req, res) => {
    try {
        const { name, email, mobileVector, password } = req.body;

        if (!name || !email || !mobileVector || !password) {
            return res.status(400).json({ success: false, message: 'Missing required signup fields.' });
        }

        const lowerEmail = email.toLowerCase().trim();
        const exists = await Patient.findOne({ email: lowerEmail });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const newPatient = new Patient({
            name: name.trim(),
            email: lowerEmail,
            mobileVector: mobileVector.trim(),
            passwordHash: passwordHash,
            isRoyaltyMember: false,
            walletBalance: 0.00,
            alternateContact: "",
            dob: "1992-08-15",
            address: "B-105 Green Residency, Sector 62, Noida, Uttar Pradesh",
            bloodGroup: "B+",
            height: 178,
            weight: 74,
            allergies: "Penicillin",
            chronicConditions: "Diabetes Type 2",
            medications: "Metformin",
            organDonor: "No",
            insuranceProvider: "Star Health"
        });

        await newPatient.save();
        const token = jwt.sign({ id: newPatient._id, role: 'patient' }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({ success: true, token, patientId: newPatient._id });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials.' });

        const patient = await Patient.findOne({ email: email.toLowerCase().trim() });
        if (!patient || !(await bcrypt.compare(password, patient.passwordHash))) {
            return res.status(401).json({ success: false, message: 'Clearance credentials rejected.' });
        }

        const token = jwt.sign({ id: patient._id, role: 'patient' }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({
            success: true,
            token,
            patient: { id: patient._id, name: patient.name, email: patient.email, walletBalance: patient.walletBalance, isRoyaltyMember: patient.isRoyaltyMember }
        });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

/* ==========================================================================
   STAGE 2: HEALTH DIRECTORY MATRIX FILTRATION
   ========================================================================== */
router.post('/search-directory', async (req, res) => {
    try {
        const { medicalQuery, locationVector, gender, experience, maxFee, rating, consultMode } = req.body;
        let mongoSearchQuery = { isPartner: true };

        if (locationVector && locationVector.trim() !== "") mongoSearchQuery.addressVector = new RegExp(locationVector.trim(), 'i');
        if (medicalQuery && medicalQuery.trim() !== "") {
            const regexSearch = new RegExp(medicalQuery.trim(), 'i');
            mongoSearchQuery.$or = [{ ownerName: regexSearch }, { clinicTitle: regexSearch }, { specialitiesList: { $in: [regexSearch] } }];
        }
        if (gender && gender !== 'all') mongoSearchQuery.gender = gender;
        if (experience && experience !== 'all') mongoSearchQuery.experienceYears = { $gte: parseInt(experience) };
        if (maxFee && maxFee !== 'all') mongoSearchQuery.baseConsultationFee = { $lte: parseInt(maxFee) };
        if (rating && rating !== 'all') mongoSearchQuery.networkRating = { $gte: parseFloat(rating) };
        if (consultMode && consultMode !== 'all') mongoSearchQuery.supportedModes = { $in: [consultMode] };

        const masterResultsList = await Doctor.find(mongoSearchQuery).sort({ networkRating: -1 });
        return res.status(200).json({
            success: true,
            lists: { premiumDoctors: masterResultsList.filter(d => d.isRoyaltyMember), generalDoctors: masterResultsList.filter(d => !d.isRoyaltyMember) }
        });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

/* ==========================================================================
   STAGE 3: TRIAGE DISPATCHING ENGINE
   ========================================================================== */
router.post('/broadcast-triage', async (req, res) => {
    try {
        const { patientName, patientEmail, symptomSummary, targetCategory } = req.body;
        const eligibleDoctors = await Doctor.find({ isPartner: true });
        const io = req.app.get('socketio');

        await Promise.all(eligibleDoctors.map(async (doc) => {
            const triage = new TriageRequest({ doctorId: doc._id, patientName, patientEmail, symptomSummary, protocolType: targetCategory });
            await triage.save();
            if (io) io.emit('patient_broadcast_triage_request', { triageId: triage._id, doctorId: doc._id, patientName, symptomSummary });
        }));
        return res.status(200).json({ success: true, broadcastCount: eligibleDoctors.length });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

/* ==========================================================================
   STAGE 4: VAULT INTERFACE PROFILE UPDATE (REPAIRED DESTRUCTURING SCOPE)
   ========================================================================== */
router.get('/profile/:id', async (req, res) => {
    try {
        const doc = await Patient.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Patient profile not found.' });
        return res.status(200).json({
            success: true,
            patient: {
                id: doc._id, _id: doc._id, name: doc.name, email: doc.email, mobileNo: doc.mobileVector,
                alternateContact: doc.alternateContact || "", dob: doc.dob || "1992-08-15", address: doc.address || "",
                bloodGroup: doc.bloodGroup || "B+", height: doc.height || 178, weight: doc.weight || 74,
                allergies: doc.allergies || "", chronicConditions: doc.chronicConditions || "", medications: doc.medications || "",
                organDonor: doc.organDonor || "No", insuranceProvider: doc.insuranceProvider || "", walletBalance: doc.walletBalance, isRoyaltyMember: doc.isRoyaltyMember
            }
        });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

router.post('/update-health-profile', async (req, res) => {
    try {
        // FIXED: Explicitly extracted height parameter from the request stream payload
        const { 
            patientId, name, mobileNo, alternateContact, dob, address,
            bloodGroup, height, weight, allergies, chronicConditions, medications, organDonor, insuranceProvider 
        } = req.body;

        if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing unique Patient reference target.' });
        }

        let updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (mobileNo !== undefined) updateData.mobileVector = mobileNo.trim();
        if (alternateContact !== undefined) updateData.alternateContact = alternateContact.trim();
        if (dob !== undefined) updateData.dob = dob;
        if (address !== undefined) updateData.address = address.trim();
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup.trim();
        if (height !== undefined) updateData.height = Number(height) || 178;
        if (weight !== undefined) updateData.weight = Number(weight) || 74;
        if (allergies !== undefined) updateData.allergies = allergies.trim();
        if (chronicConditions !== undefined) updateData.chronicConditions = chronicConditions.trim();
        if (medications !== undefined) updateData.medications = medications.trim();
        if (organDonor !== undefined) updateData.organDonor = organDonor;
        if (insuranceProvider !== undefined) updateData.insuranceProvider = insuranceProvider.trim();

        const updatedPatient = await Patient.findByIdAndUpdate(patientId, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedPatient) return res.status(404).json({ success: false, message: 'Target record not resolved.' });

        return res.status(200).json({
            success: true,
            patient: {
                id: updatedPatient._id, name: updatedPatient.name, email: updatedPatient.email, mobileNo: updatedPatient.mobileVector,
                alternateContact: updatedPatient.alternateContact, dob: updatedPatient.dob, address: updatedPatient.address,
                bloodGroup: updatedPatient.bloodGroup, height: updatedPatient.height, weight: updatedPatient.weight,
                allergies: updatedPatient.allergies, chronicConditions: updatedPatient.chronicConditions, medications: updatedPatient.medications,
                organDonor: updatedPatient.organDonor, insuranceProvider: updatedPatient.insuranceProvider, walletBalance: updatedPatient.walletBalance, isRoyaltyMember: updatedPatient.isRoyaltyMember
            }
        });
    } catch (err) { return res.status(500).json({ success: false, message: `Failed to commit updates: ${err.message}` }); }
});

router.post('/book-appointment', async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, clinicTitle, appointmentDate, appointmentTime, computedFee } = req.body;
        const newRequest = new Appointment({ patientId, patientName, doctorId, doctorName, clinicTitle, appointmentDate, appointmentTime, computedFee, status: 'pending' });
        await newRequest.save();
        const io = req.app.get('socketio');
        if (io) io.emit('doctor_receive_appointment_request', newRequest);
        return res.status(200).json({ success: true, appointment: newRequest });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

router.get('/pending-requests/:patientId', async (req, res) => {
    try {
        const requests = await Appointment.find({ patientId: String(req.params.patientId).trim() }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, list: requests });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;