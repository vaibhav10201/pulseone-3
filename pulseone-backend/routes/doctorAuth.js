const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Core Collection Models
const Doctor = require('../models/Doctor');
const TriageRequest = require('../models/TriageRequest');
const Appointment = require('../models/Appointment');

const JWT_SECRET_TOKEN = process.env.JWT_SECRET || 'PULSEONE_EMERGENCY_DESK_CORE_KEY_TOKEN';

/* ==========================================================================
   STAGE 1: DOCTOR COMPLIANCE INITIALIZATION ROUTE
   ========================================================================== */
router.post('/register-basic', async (req, res) => {
    try {
        const { 
            ownerName, ownerEmail, ownerTel, 
            superintendentName, superindependentTel, 
            receptionTel, ambulanceTel, clinicTitle, addressVector, password 
        } = req.body;

        const doctorExists = await Doctor.findOne({ ownerEmail: ownerEmail.toLowerCase().trim() });
        if (doctorExists) {
            return res.status(400).json({ success: false, message: 'This clinical practitioner email is already registered.' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDoctor = new Doctor({
            ownerName,
            ownerEmail: ownerEmail.toLowerCase().trim(),
            ownerTel,
            superintendentName,
            superindependentTel,
            receptionTel,
            ambulanceTel,
            clinicTitle,
            addressVector,
            passwordHash: hashedPassword,
            isPartner: false,
            isVerified: false,
            earningsWalletBalance: 0.00,
            services: [] // Starts completely empty per strict uninitialized specs
        });

        await newDoctor.save();
        
        const token = jwt.sign({ id: newDoctor._id, role: 'doctor' }, JWT_SECRET_TOKEN, { expiresIn: '2h' });

        return res.status(201).json({
            success: true,
            message: 'Basic details processed cleanly. Proceed to Step 2.',
            token,
            doctorId: newDoctor._id
        });

    } catch (error) {
        console.error('[DOCTOR REGISTER EXCEPTION] ', error);
        return res.status(500).json({ success: false, message: 'Institutional profiling stream interrupted.' });
    }
});

/* ==========================================================================
   STAGE 2: CONTRACT MUTATION LAYER (EXECUTE STRATEGIC BIND)
   ========================================================================== */
router.post('/execute-contract', async (req, res) => {
    try {
        const { doctorId, attestationSignatureName, signatureImageBase64 } = req.body;

        if (!doctorId || !attestationSignatureName || !signatureImageBase64) {
            return res.status(400).json({ success: false, message: 'Missing binding data vectors or signature frames.' });
        }

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid MongoDB Identifier structure.' });
        }
        const targetObjectId = new mongoose.Types.ObjectId(doctorId);

        const writeOperationResult = await Doctor.collection.updateOne(
            { _id: targetObjectId },
            {
                $set: {
                    isPartner: true,
                    isVerified: true,
                    attestationSignatureName: attestationSignatureName.trim(),
                    signatureImageBase64: signatureImageBase64,
                    contractExecutedAt: new Date()
                }
            }
        );

        if (writeOperationResult.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Target doctor profile node not found.' });
        }

        const updatedDoctor = await Doctor.findById(targetObjectId);
        const productionToken = jwt.sign({ id: updatedDoctor._id, role: 'doctor' }, JWT_SECRET_TOKEN, { expiresIn: '24h' });

        return res.status(200).json({
            success: true,
            message: 'Strategic Agreement Executed. Dashboard infrastructure unlocked.',
            token: productionToken,
            doctor: {
                id: updatedDoctor._id,
                clinicTitle: updatedDoctor.clinicTitle,
                ownerName: updatedDoctor.ownerName,
                ownerEmail: updatedDoctor.ownerEmail,
                addressVector: updatedDoctor.addressVector,
                isPartner: true,
                isVerified: true
            }
        });

    } catch (error) {
        console.error('[CRITICAL CONTRACT DRIVER EXCEPTION] ', error);
        return res.status(500).json({ success: false, message: 'Direct database mutation failed inside core storage layer.' });
    }
});

/* ==========================================================================
   STAGE 3: DOCTORS CORE ACCOUNT ACCESS LOGIN
   ========================================================================== */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing login credentials.' });
        }

        const targetDoctor = await Doctor.findOne({ ownerEmail: email.toLowerCase().trim() });
        if (!targetDoctor) {
            return res.status(401).json({ success: false, message: 'Invalid validation clearance parameters.' });
        }

        const isMatch = await bcrypt.compare(password, targetDoctor.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid validation clearance parameters.' });
        }

        if (!targetDoctor.isPartner) {
            return res.status(403).json({
                success: false,
                requiresContractCompletion: true,
                message: 'Compliance Warning: Your legal master contract remains unsigned.',
                doctorId: targetDoctor._id
            });
        }

        const token = jwt.sign({ id: targetDoctor._id, role: 'doctor' }, JWT_SECRET_TOKEN, { expiresIn: '24h' });

        return res.status(200).json({
            success: true,
            message: 'Practitioner verification cleared.',
            token,
            doctor: {
                id: targetDoctor._id,
                _id: targetDoctor._id,
                clinicTitle: targetDoctor.clinicTitle,
                ownerName: targetDoctor.ownerName,
                ownerEmail: targetDoctor.ownerEmail,
                addressVector: targetDoctor.addressVector,
                isPartner: targetDoctor.isPartner,
                isVerified: targetDoctor.isVerified,
                earningsWalletBalance: targetDoctor.earningsWalletBalance,
                totalConsultationsCount: targetDoctor.totalConsultationsCount,
                services: targetDoctor.services || []
            }
        });

    } catch (error) {
        console.error('[DOCTOR LOGIN EXCEPTION] ', error);
        return res.status(500).json({ success: false, message: 'Verification access terminal handshake failed.' });
    }
});

/* ==========================================================================
   STAGE 4: PERSISTENCE LAYER - ACCESS DIRECT RECS BY USER ID
   ========================================================================== */
router.get('/profile/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid Practitioner ID structure.' });
        }
        
        const doctorDocument = await Doctor.findById(req.params.id);
        if (!doctorDocument) {
            return res.status(404).json({ success: false, message: 'Doctor profile node not found.' });
        }

        return res.status(200).json({ success: true, doctor: doctorDocument });
    } catch (err) {
        console.error("[PROFILE FETCH EXCEPTION]:", err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch doctor document.' });
    }
});

/* ==========================================================================
   STAGE 5: PROFILE UPDATE HANDLERS
   ========================================================================== */
router.post('/update-medical-profile', async (req, res) => {
    try {
        const { 
            doctorId, ownerName, clinicTitle, bioSummary, practitionerType, 
            specialitiesList, baseConsultationFee, supportedModes, gender, experienceYears 
        } = req.body;

        if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing Doctor Document ID link.' });
        }

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            {
                $set: {
                    ownerName: ownerName.trim(),
                    clinicTitle: clinicTitle.trim(),
                    specialitySummary: bioSummary.trim(), 
                    practitionerType,
                    specialitiesList,
                    baseConsultationFee: parseInt(baseConsultationFee) || 0,
                    supportedModes,
                    gender,
                    experienceYears: parseInt(experienceYears) || 0
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: 'Practitioner profile node not found inside cluster.' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Database attributes successfully synchronized across PulseOne.', 
            doctor: updatedDoctor
        });

    } catch (err) {
        console.error("[CRITICAL PROFILE SYNC EXCEPTION]:", err);
        return res.status(500).json({ success: false, message: `Database update execution dropped: ${err.message}` });
    }
});

/* ==========================================================================
   STAGE 6: CLINICAL CATALOG & SERVICE MANAGEMENT
   ========================================================================== */
router.post('/add-service', async (req, res) => {
    try {
        const { doctorId, service } = req.body; 
        
        if (!doctorId || !service || !service.title || !service.price) {
            return res.status(400).json({ success: false, message: 'Structural service attributes trace incomplete inside payload.' });
        }

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid Practitioner Identifier format.' });
        }

        const formattedServiceElement = {
            title: String(service.title).trim(),
            category: service.category ? String(service.category).trim() : "In-Clinic Visit",
            price: Number(service.price) || 500
        };

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { $push: { services: formattedServiceElement } },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: 'Target medical practitioner document node not found.' });
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('patient_receive_live_services', {
                doctorId: updatedDoctor._id,
                clinicTitle: updatedDoctor.clinicTitle,
                services: updatedDoctor.services
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Service recorded successfully.', 
            doctor: updatedDoctor 
        });

    } catch (err) {
        console.error("❌ [ADD SERVICE FAILURE EXCEPTION]:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});


/* ==========================================================================
   ROUTE: PURGE REGISTERED SERVICE (RELIABLE SUB-DOCUMENT OBJECTID TARGETING)
   ========================================================================== */
/* ==========================================================================
   ROUTE: PURGE REGISTERED SERVICE (SOLVES MONGOOSE CAST VALIDATION ERRORS)
   ========================================================================== */
router.post('/remove-service', async (req, res) => {
    try {
        const { doctorId, serviceId, serviceTitle } = req.body;
        
        if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing target doctor identifier reference.' });
        }

        console.log(`[CATALOG MUTATION] Inbound parameters -> ID Proxy: "${serviceId}" | Title: "${serviceTitle}"`);

        let updatedDoctor;

        // TRACK A: If it's a true Mongoose ObjectId, use standard sub-document array removal
        if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
            console.log(`[ROUTE MATCH] Executing clean sub-document $pull matching ObjectId: ${serviceId}`);
            updatedDoctor = await Doctor.findByIdAndUpdate(
                doctorId,
                { $pull: { services: { _id: serviceId } } },
                { new: true }
            );
        } 
        // TRACK B: Legacy Fallback — If it's an index tracking proxy string, search and filter purely by title match
        else if (serviceTitle && String(serviceTitle).trim() !== "") {
            const cleanTitle = String(serviceTitle).trim();
            console.log(`[ROUTE MATCH] Legacy fallback activated. Purging item matching title text: "${cleanTitle}"`);
            
            // To completely prevent Mongoose casting errors on _id, we match the object array entry purely by title string
            updatedDoctor = await Doctor.findByIdAndUpdate(
                doctorId,
                { $pull: { services: { title: cleanTitle } } },
                { new: true }
            );
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Eviction failed: Sub-document has no valid ObjectId, and no Title match was passed.' 
            });
        }

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: 'Target doctor collection node not resolved.' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Service line successfully dropped from system maps.', 
            services: updatedDoctor.services 
        });

    } catch (err) {
        console.error("❌ [REMOVE SERVICE CONTROLLER EXCEPTION]:", err.message);
        return res.status(500).json({ success: false, message: `Server transaction engine fault: ${err.message}` });
    }
});


router.post('/sync-services', async (req, res) => {
    try {
        const { doctorId, servicesArray } = req.body;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid Practitioner ID.' });
        }

        const safeArray = Array.isArray(servicesArray) ? servicesArray : [];

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { $set: { services: safeArray } },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: 'Doctor target node missing.' });
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('patient_receive_live_services', {
                doctorId: updatedDoctor._id,
                clinicTitle: updatedDoctor.clinicTitle,
                services: updatedDoctor.services
            });
        }

        return res.status(200).json({ success: true, services: updatedDoctor.services });
    } catch (error) {
        console.error('[SYNC SERVICES EXCEPTION] ', error);
        return res.status(500).json({ success: false, message: 'Failed to write services schema array to database.' });
    }
});

/* ==========================================================================
   STAGE 7: APPOINTMENTS QUEUE AND TRIAGE RESPONSES
   ========================================================================== */
/* ==========================================================================
   ROUTE: RETRIEVE ALL INCOMING APPOINTMENT ENTRIES FOR A DOCTOR (FIXED)
   ========================================================================== */
/* ==========================================================================
   ROUTE: RETRIEVE ALL TRIAGE & APPROVED TRACKS FOR A PRACTITIONER (FIXED)
   ========================================================================== */
/* ==========================================================================
   ROUTE: RETRIEVE ONLY PENDING TRIAGE REQUESTS FOR THE DASHBOARD LOGS
   ========================================================================== */
router.get('/appointments-queue/:doctorId', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.doctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid Practitioner ID.' });
        }

        // FIXED: Explicitly filter by status: 'pending' so approved requests clear instantly from the dashboard view
        const pendingRequests = await Appointment.find({ 
            doctorId: req.params.doctorId, 
            status: 'pending' 
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({ success: true, triageQueue: pendingRequests });
    } catch (err) {
        console.error("❌ [DASHBOARD QUEUE CRASH]:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});


/* ==========================================================================
   ROUTE: MANAGE INBOUND APPOINTMENT STATUS CHANGES (STATE TRANSITION FIX)
   ========================================================================== */
/* ==========================================================================
   ROUTE: MANAGE INBOUND APPOINTMENT STATUS CHANGES (WITH SIGNATURE ATTACHMENT)
   ========================================================================== */
router.post('/respond-to-appointment', async (req, res) => {
    try {
        const { appointmentId, responseStatus } = req.body; 

        if (!appointmentId || !responseStatus) {
            return res.status(400).json({ success: false, message: 'Missing processing parameters.' });
        }

        let targetStatus = 'rejected';
        if (responseStatus === 'approved' || responseStatus === 'allocated') {
            targetStatus = 'approved'; 
        }

        // Find the appointment first to identify the managing practitioner link
        const targetAppointment = await Appointment.findById(appointmentId);
        if (!targetAppointment) {
            return res.status(404).json({ success: false, message: 'Target appointment reference not found.' });
        }

        // Look up the doctor's document to pull their stored handwritten signature asset
        const doctorData = await Doctor.findById(targetAppointment.doctorId);
        const signatureAsset = doctorData ? doctorData.signatureImageBase64 : null;

        // Save the approved status along with the verified signature block field
        const updatedAppt = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                $set: { 
                    status: targetStatus,
                    doctorSignatureBase64: signatureAsset // Stored directly on the appointment record
                } 
            },
            { new: true }
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('patient_receive_appointment_status', { appointmentId: updatedAppt._id, status: updatedAppt.status });
        }

        return res.status(200).json({ success: true, message: 'Response synchronized successfully.', appointment: updatedAppt });
    } catch (e) {
        console.error("❌ [RESPOND APPOINTMENT EXCEPTION]:", e.message);
        return res.status(500).json({ success: false, message: 'Status transformation loop dropped.' });
    }
});

/* ==========================================================================
   ROUTE: RETRIEVE ONLY ACCEPTE/APPROVED SCHEDULES FOR DOCTOR VAULT
   ========================================================================== */
/* ==========================================================================
   ROUTE: RETRIEVE ONLY ACCEPTED/APPROVED SCHEDULES FOR DOCTOR VAULT (FIXED GET)
   ========================================================================== */
router.get('/confirmed-schedule/:doctorId', async (req, res) => {
    try {
        const targetDoctorId = req.params.doctorId;

        if (!mongoose.Types.ObjectId.isValid(targetDoctorId)) {
            return res.status(400).json({ success: false, message: 'Invalid Practitioner ID format.' });
        }

        // Pulls historical and real-time records matching this doctor where status is explicitly approved
        const confirmedBookings = await Appointment.find({ 
            doctorId: targetDoctorId,
            status: 'approved'
        }).sort({ appointmentDate: 1, appointmentTime: 1 }); // Chronological timeline sorting
        
        console.log(`[SCHEDULE SYNC] Found confirmed allocations count: ${confirmedBookings.length} for Doctor: ${targetDoctorId}`);

        return res.status(200).json({ 
            success: true, 
            list: confirmedBookings 
        });
    } catch (err) {
        console.error("❌ [CONFIRMED SCHEDULE ROUTE CRASH]:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;