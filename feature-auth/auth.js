/* ==========================================================================
   PULSEONE PERSISTENCE ROUTING GUARD - INITIALIZATION CHECK
   ========================================================================== */
(function evaluateActiveSessionPersistence() {
    const activeToken = localStorage.getItem('pulseone_user_token');
    const assignedRole = localStorage.getItem('pulseone_user_role');
    const patientData = localStorage.getItem('pulseone_patient_data');
    const doctorData = localStorage.getItem('pulseone_doctor_data');

    // Prevent loose token routing triggers if local session arrays aren't instantiated yet
    if (activeToken && assignedRole) {
        if (assignedRole === 'doctor' && doctorData) {
            window.location.href = '../feature-doctor/doctor-dashboard.html';
        } else if (assignedRole === 'patient' && patientData) {
            window.location.href = '../feature-patient/patient-dashboard.html';
        }
    }
})();

/* ==========================================================================
   DYNAMIC MULTI-ENVIRONMENT ROUTING ENGINE (LOCAL vs PRODUCTION)
   ========================================================================== */
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_SERVER_HOST = IS_PRODUCTION ? 'https://pulseone-3.onrender.com' : 'http://localhost:5000';

const API_PATIENT_BASE = API_SERVER_HOST + '/api/auth/patient';
const API_DOCTOR_BASE  = API_SERVER_HOST + '/api/auth/doctor';


let onboardingRegistrationData = {
    ownerName: '',
    ownerEmail: '',
    ownerTel: '',
    superintendentName: '',
    superindependentTel: '',
    receptionTel: '',
    ambulanceTel: '',
    clinicTitle: '',
    addressVector: '',
    signatureImageBase64: null,
    attestationSignatureName: '',
    hasDownloadedDraft: false,
    activeServerDoctorId: null
};

/* ==========================================================================
   STATUS BANNER ALERT SUBSYSTEM
   ========================================================================== */
function displayStatusToast(messageString, variantType = 'neutral') {
    const banner = document.getElementById('notification-synapse-banner');
    const pulse = document.getElementById('toast-pulse-indicator');
    const textNode = document.getElementById('notification-toast-text');

    if (!banner || !pulse || !textNode) return;

    textNode.innerText = messageString;
    banner.className = "notification-toast-alert toast-visible";

    if (variantType === 'success') {
        pulse.style.backgroundColor = "var(--p1-emerald)";
    } else if (variantType === 'failed') {
        pulse.style.backgroundColor = "#EF4444";
    } else {
        pulse.style.backgroundColor = "#FEF3C7";
    }

    setTimeout(() => { dismissStatusToast(); }, 6000);
}

function dismissStatusToast() {
    const banner = document.getElementById('notification-synapse-banner');
    if (banner) banner.classList.remove('toast-visible');
}

function switchContext(targetContext) {
    document.querySelectorAll('.context-toggle-row .btn-toggle').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`toggle-${targetContext}`).classList.add('active');

    if (targetContext === 'login') {
        document.getElementById('auth-login-view').classList.add('dynamic-active');
        document.getElementById('auth-signup-view').classList.remove('dynamic-active');
        resetLoginPipeline();
    } else {
        document.getElementById('auth-login-view').classList.remove('dynamic-active');
        document.getElementById('auth-signup-view').classList.add('dynamic-active');
        resetSignupPipeline(); 
    }
}

/* ==========================================================================
   WIZARD PIPELINE DIRECTION DRIVERS
   ========================================================================== */
function advanceLoginPipeline(targetRole) {
    document.getElementById('login-step-tier').classList.remove('active');
    document.getElementById(`login-step-${targetRole}`).classList.add('active');
}

function resetLoginPipeline() {
    document.querySelectorAll('#auth-login-view .signup-pipeline-node').forEach(node => node.classList.remove('active'));
    document.getElementById('login-step-tier').classList.add('active');
}

function advanceSignupPipeline(selectedRole) {
    document.getElementById('signup-step-tier').classList.remove('active');
    document.getElementById(`signup-step-${selectedRole}`).classList.add('active');
}

function resetSignupPipeline() {
    document.querySelectorAll('#auth-signup-view .signup-pipeline-node').forEach(node => node.classList.remove('active'));
    document.getElementById('signup-step-tier').classList.add('active');
}

/* ==========================================================================
   PATIENT/DOCTOR AUTHENTICATION ROUTINES (UPDATED FOR DYNAMIC CORES)
   ========================================================================== */
async function handleUserAuthentication(event, assignedRole) {
    event.preventDefault();
    const formNode = event.target;
    const emailInput = formNode.querySelectorAll('input')[0].value.trim();
    const passwordInput = formNode.querySelectorAll('input')[1].value;

    const endpointUrl = assignedRole === 'doctor' ? `${API_DOCTOR_BASE}/login` : `${API_PATIENT_BASE}/login`;

    try {
        const responseStream = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput, password: passwordInput })
        });

        const resData = await responseStream.json();

        if (resData.success) {
            localStorage.setItem('pulseone_user_token', resData.token);
            localStorage.setItem('pulseone_user_role', assignedRole);
            
            // --- FIXED: BOTH ROLES MUST CACHE FULL REALTIME METADATA ASSET PACKS ---
            if (assignedRole === 'patient' && resData.patient) {
                // Instantly sync every field from database return array payload down to client engine cache
                localStorage.setItem('pulseone_patient_data', JSON.stringify({
                    id: resData.patient.id || resData.patient._id,
                    _id: resData.patient.id || resData.patient._id,
                    name: resData.patient.name,
                    email: resData.patient.email,
                    mobileNo: resData.patient.mobileNo || resData.patient.mobileVector || "+91 9876543210",
                    alternateContact: resData.patient.alternateContact || "",
                    dob: resData.patient.dob || "",
                    address: resData.patient.address || "",
                    bloodGroup: resData.patient.bloodGroup || "B+",
                    height: resData.patient.height || 178,
                    weight: resData.patient.weight || 74,
                    allergies: resData.patient.allergies || "",
                    chronicConditions: resData.patient.chronicConditions || "",
                    medications: resData.patient.medications || "",
                    organDonor: resData.patient.organDonor || "No",
                    insuranceProvider: resData.patient.insuranceProvider || "",
                    walletBalance: resData.patient.walletBalance || 0.00,
                    isRoyaltyMember: resData.patient.isRoyaltyMember || false
                }));
            } else if (assignedRole === 'doctor' && resData.doctor) {
                localStorage.setItem('pulseone_doctor_data', JSON.stringify({
                    id: resData.doctor.id || resData.doctor._id,
                    ownerName: resData.doctor.ownerName,
                    ownerEmail: resData.doctor.ownerEmail,
                    clinicTitle: resData.doctor.clinicTitle || "PulseOne Practice Node"
                }));
            } else if (assignedRole === 'doctor' && !resData.doctor) {
                localStorage.setItem('pulseone_doctor_data', JSON.stringify({
                    id: resData.doctorId || "Verified Node Account",
                    ownerName: "Verified Provider Node",
                    ownerEmail: emailInput
                }));
            }

            displayStatusToast('Clearance granted. Synchronizing dashboard console...', 'success');
            
            setTimeout(() => {
                window.location.href = assignedRole === 'doctor' 
                    ? '../feature-doctor/doctor-dashboard.html' 
                    : '../feature-patient/patient-dashboard.html';
            }, 1200);
        } else {
            displayStatusToast(`Clearance Rejected: ${resData.message}`, 'failed');
        }
    } catch (err) {
        displayStatusToast('Handshake Interrupted. Backend server offline.', 'failed');
    }
}

async function finalizeConsumerRegistration(event) {
    event.preventDefault();
    const formNode = event.target;
    const inputs = formNode.querySelectorAll('input');

    const signupName = inputs[0].value.trim();
    const signupEmail = inputs[1].value.trim();
    const signupMobile = inputs[2].value.trim();
    const signupPassword = inputs[3].value;

    try {
        const responseStream = await fetch(`${API_PATIENT_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: signupName,
                email: signupEmail,
                mobileVector: signupMobile,
                password: signupPassword
            })
        });

        const resData = await responseStream.json();
        
        if (resData.success) {
            localStorage.setItem('pulseone_user_token', resData.token);
            localStorage.setItem('pulseone_user_role', 'patient');
            
            // --- FIXED: POPULATE COMPLETELY EXPANDED OBJECT PROPERTIES ON SIGNUP ---
            localStorage.setItem('pulseone_patient_data', JSON.stringify({
                id: resData.patientId || resData.patient?._id || resData.id,
                _id: resData.patientId || resData.patient?._id || resData.id,
                name: signupName,
                email: signupEmail,
                mobileNo: signupMobile,
                alternateContact: "",
                dob: "",
                address: "",
                bloodGroup: "B+",
                height:178,
                weight: 74,
                allergies: "",
                chronicConditions: "",
                medications: "",
                organDonor: "No",
                insuranceProvider: "",
                walletBalance: 0.00,
                isRoyaltyMember: false
            }));

            displayStatusToast('Patient profile established cleanly inside MongoDB.', 'success');
            
            setTimeout(() => { window.location.href = '../feature-patient/patient-dashboard.html'; }, 1500);
        } else {
            displayStatusToast(`Rejection: ${resData.message}`, 'failed');
        }
    } catch (err) {
        displayStatusToast('Network stream failure during signup.', 'failed');
    }
}


/* ==========================================================================
   DOCTOR SYSTEM INTERFACES MECHANICS
   ========================================================================== */
function processProviderRegistryStream(event) {
    if (event && event.preventDefault) event.preventDefault();
    
    try {
        const ownerNameEl = document.getElementById('doc-owner-name');
        const ownerEmailEl = document.getElementById('doc-owner-email');
        const ownerTelEl = document.getElementById('doc-owner-tel');
        const superNameEl = document.getElementById('doc-super-name');
        const superTelEl = document.getElementById('doc-super-tel');
        const receptionTelEl = document.getElementById('doc-reception-tel');
        const ambulanceTelEl = document.getElementById('doc-ambulance-tel');
        const clinicTitleEl = document.getElementById('doc-clinic-title');
        const addressVectorEl = document.getElementById('doc-address');
        const passwordEl = document.getElementById('doc-password');

        if (!ownerNameEl || !ownerEmailEl || !clinicTitleEl || !passwordEl) {
            displayStatusToast("Form layout tracking error. Missing input components.", "failed");
            return false;
        }

        onboardingRegistrationData.ownerName = ownerNameEl.value.trim();
        onboardingRegistrationData.ownerEmail = ownerEmailEl.value.trim();
        onboardingRegistrationData.ownerTel = ownerTelEl.value.trim();
        onboardingRegistrationData.superintendentName = superNameEl.value.trim();
        onboardingRegistrationData.superindependentTel = superTelEl.value.trim();
        onboardingRegistrationData.receptionTel = receptionTelEl.value.trim();
        onboardingRegistrationData.ambulanceTel = ambulanceTelEl.value.trim();
        onboardingRegistrationData.clinicTitle = clinicTitleEl.value.trim();
        onboardingRegistrationData.addressVector = addressVectorEl.value.trim();
        const rawPass = passwordEl.value;

        fetch(`${API_DOCTOR_BASE}/register-basic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ownerName: onboardingRegistrationData.ownerName,
                ownerEmail: onboardingRegistrationData.ownerEmail,
                ownerTel: onboardingRegistrationData.ownerTel,
                superintendentName: onboardingRegistrationData.superintendentName,
                superindependentTel: onboardingRegistrationData.superindependentTel,
                receptionTel: onboardingRegistrationData.receptionTel,
                ambulanceTel: onboardingRegistrationData.ambulanceTel,
                clinicTitle: onboardingRegistrationData.clinicTitle,
                addressVector: onboardingRegistrationData.addressVector,
                password: rawPass
            })
        })
        .then(res => res.json())
        .then(resData => {
            if (resData.success) {
                onboardingRegistrationData.activeServerDoctorId = resData.doctorId;
                displayStatusToast('Profile saved. Registered account instantiated.', 'success');
                
                document.getElementById('signup-step-provider').classList.remove('active');
                document.getElementById('signup-step-agreement').classList.add('active');
            } else {
                displayStatusToast(`Profiling Blocked: ${resData.message}`, 'failed');
            }
        })
        .catch(err => {
            displayStatusToast('Server communication failure during profile write.', 'failed');
        });

    } catch (err) {
        console.error("Exception caught: ", err);
    }
    return false;
}

function downloadOriginalDraftCopy() {
    const link = document.createElement('a');
    link.href = '../assets/PulseOne Hospital Agreement.pdf'; 
    link.download = 'PulseOne_Hospital_Strategic_Agreement_Draft.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onboardingRegistrationData.hasDownloadedDraft = true;
    const continueBtn = document.getElementById('btn-agreement-continue-step');
    if (continueBtn) {
        continueBtn.removeAttribute('disabled');
        continueBtn.classList.remove('disabled-opacity-lock');
    }
}

function advanceFromAgreementToUploads() {
    if (!onboardingRegistrationData.hasDownloadedDraft) {
        alert("Compliance Requirement: Please download the original contract draft copy before continuing.");
        return;
    }
    document.getElementById('signup-step-agreement').classList.remove('active');
    document.getElementById('signup-step-verification').classList.add('active');
}

/* ==========================================================================
   HELPER UTILITY FOR REAL-TIME CARD DATE SUFFIXES
   ========================================================================== */
function getRealtimeOrdinalSuffix(dayNumber) {
    if (dayNumber > 3 && dayNumber < 21) return 'th';
    switch (dayNumber % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}

var updateUploadLabel = function(inputElement) {
    if(inputElement.files && inputElement.files[0]) {
        var dropzone = inputElement.closest('.upload-dropzone-box');
        dropzone.style.borderColor = "var(--p1-emerald)";
        dropzone.querySelector('strong').innerText = "Document Staged Successfully";
        dropzone.querySelector('span').innerText = inputElement.files[0].name;
    }
}

var processHandwrittenSignatureAssetInbound = function(inputElement) {
    if (inputElement.files && inputElement.files[0]) {
        var targetFile = inputElement.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            onboardingRegistrationData.signatureImageBase64 = e.target.result;
            var dz = document.getElementById('dz-sig-capture');
            dz.style.borderColor = "var(--p1-emerald)";
            dz.querySelector('strong').innerText = "Signature Image Captured";
            document.getElementById('sig-upload-caption-tracker').innerText = targetFile.name;
        };
        reader.readAsDataURL(targetFile);
    }
}

function processVerificationMatrixStream(event) {
    event.preventDefault();
    onboardingRegistrationData.attestationSignatureName = document.getElementById('attestation-typed-name').value.trim();

    document.getElementById('rec-fill-clinic').innerText = onboardingRegistrationData.clinicTitle;
    document.getElementById('rec-fill-name').innerText = onboardingRegistrationData.attestationSignatureName;
    document.getElementById('rec-fill-email').innerText = onboardingRegistrationData.ownerEmail;

    const signatureFrame = document.getElementById('rec-fill-signature-frame');
    if (onboardingRegistrationData.signatureImageBase64 && signatureFrame) {
        signatureFrame.innerHTML = `<img src="${onboardingRegistrationData.signatureImageBase64}" style="max-height: 45px; max-width: 100%; object-fit: contain;">`;
    }

    document.getElementById('signup-step-verification').classList.remove('active');
    document.getElementById('signup-step-final-contract').classList.add('active');
}

/* ==========================================================================
   REAL-TIME LOGIC EMBEDDED DYNAMIC PDF GEOMETRY DRAW LOOP
   ========================================================================== */
async function generateAndSaveOfficialAgreementPDF() {
    try {
        const existingPdfBytes = await fetch('../assets/PulseOne Hospital Agreement.pdf').then(res => res.arrayBuffer());
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        const pages = pdfDoc.getPages();
        const page1 = pages[0]; const page7 = pages[6]; const page8 = pages[7]; 
        const textColorBlue = rgb(15/255, 34/255, 64/255); const textColorBlack = rgb(30/255, 41/255, 59/255);

        const currentSystemDate = new Date();
        const liveDay = currentSystemDate.getDate();
        const liveYear = currentSystemDate.getFullYear();
        
        const liveMonthName = currentSystemDate.toLocaleString('en-US', { month: 'long' });
        const liveDayOrdinal = `${liveDay}${getRealtimeOrdinalSuffix(liveDay)}`;
        
        const paddedDay = String(liveDay).padStart(2, '0');
        const paddedMonth = String(currentSystemDate.getMonth() + 1).padStart(2, '0');
        const dynamicFormattedNumericDate = `${paddedDay}-${paddedMonth}-${liveYear}`;

        page1.drawText(liveDayOrdinal, { x: 360, y: 675, size: 10, font: boldFont, color: textColorBlue });
        page1.drawText(liveMonthName, { x: 412, y: 675, size: 10, font: boldFont, color: textColorBlue });
        page1.drawText(onboardingRegistrationData.clinicTitle, { x: 62, y: 525, size: 10, font: boldFont, color: textColorBlue });
        page1.drawText(onboardingRegistrationData.addressVector, { x: 260, y: 496, size: 9, font: regularFont, color: textColorBlack });

        page7.drawText(onboardingRegistrationData.clinicTitle, { x: 368, y: 361, size: 10, font: boldFont, color: textColorBlue });
        page7.drawText(onboardingRegistrationData.attestationSignatureName, { x: 395, y: 295, size: 10, font: boldFont, color: textColorBlue });
        page7.drawText('Authorized Representative / Superintendent', { x: 420, y: 265, size: 10, font: regularFont, color: textColorBlack });
        page7.drawText(dynamicFormattedNumericDate, { x: 390, y: 210, size: 10, font: regularFont, color: textColorBlack });
        page7.drawText(dynamicFormattedNumericDate, { x: 90, y: 210, size: 10, font: regularFont, color: textColorBlack });

        if (onboardingRegistrationData.signatureImageBase64) {
            const base64Data = onboardingRegistrationData.signatureImageBase64.split(',')[1];
            const signatureImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            let embeddedSigImage = onboardingRegistrationData.signatureImageBase64.includes('png') ? 
                await pdfDoc.embedPng(signatureImageBytes) : await pdfDoc.embedJpg(signatureImageBytes);
            page7.drawImage(embeddedSigImage, { x: 428, y: 240, width: 92, height: 24 });
        }

        page8.drawText(onboardingRegistrationData.ownerName, { x: 317, y: 650, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.ownerEmail, { x: 317, y: 635, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.ownerTel, { x: 317, y: 621, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.superintendentName, { x: 317, y: 607, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.superindependentTel, { x: 317, y: 593, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.receptionTel, { x: 317, y: 579, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.ambulanceTel, { x: 317, y: 565, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.addressVector, { x: 317, y: 551, size: 9, font: regularFont, color: textColorBlack });

        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `PulseOne_Strategic_Agreement_Signed.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const launchBtn = document.getElementById('btn-final-dashboard-launch');
        if (launchBtn) {
            launchBtn.removeAttribute('disabled');
            launchBtn.classList.remove('disabled-opacity-lock');
        }
    } catch (error) {
        console.error("PDF Geometry Modification Exception: ", error);
    }
}

async function executePartnerOnboardingFinalization() {
    try {
        if (!onboardingRegistrationData.activeServerDoctorId) {
            displayStatusToast("Lifecycle sync loss. Try refreshing.", "failed");
            return;
        }

        displayStatusToast("Securing contract seals with database layer...", "neutral");

        const responseStream = await fetch(`${API_DOCTOR_BASE}/execute-contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctorId: onboardingRegistrationData.activeServerDoctorId,
                attestationSignatureName: onboardingRegistrationData.attestationSignatureName,
                signatureImageBase64: onboardingRegistrationData.signatureImageBase64
            })
        });

        const resData = await responseStream.json();

        if (responseStream.ok && resData.success) {
            localStorage.setItem('pulseone_user_token', resData.token);
            localStorage.setItem('pulseone_user_role', 'doctor');
            localStorage.setItem('pulseone_doctor_data', JSON.stringify(resData.doctor));
            
            displayStatusToast('Strategic Contract Executed! Verified Partner Node Active.', 'success');
            setTimeout(() => { navigateToDoctorDashboard(); }, 2000);
        } else {
            displayStatusToast(`Verification Handshake Failed: ${resData.message || 'Server connection error'}`, 'failed');
        }
    } catch (err) {
        console.error("Transmission stack tracking trace:", err);
        displayStatusToast('Data mutation failure during contract signature execution loop.', 'failed');
    }
}

function navigateToDoctorDashboard() {
    window.location.href = '../feature-doctor/doctor-dashboard.html';
}

function pauseProviderOnboarding() {
    window.location.href = '../feature-landing/index.html';
}