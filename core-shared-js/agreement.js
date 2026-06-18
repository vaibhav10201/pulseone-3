/* ==========================================================================
   PULSEONE GATEKEEPER ROUTING CONTROLLER - HIGH ACCURACY A4 COORDINATE ENGINE
   ========================================================================== */

let onboardingRegistrationData = {
    ownerName: '',
    superintendentName: '',
    clinicTitle: '',
    licenseNumber: '',
    emailVector: '',
    mobileVector: '',
    addressVector: '',
    signatureImageBase64: null,
    attestationSignatureName: '',
    hasDownloadedDraft: false
};

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

function advanceLoginPipeline(targetRole) {
    document.getElementById('login-step-tier').classList.remove('active');
    const targetNodeId = `login-step-${targetRole}`;
    const targetNode = document.getElementById(targetNodeId);
    if (targetNode) targetNode.classList.add('active');
}

function resetLoginPipeline() {
    document.querySelectorAll('#auth-login-view .signup-pipeline-node').forEach(node => node.classList.remove('active'));
    document.getElementById('login-step-tier').classList.add('active');
}

function handleUserAuthentication(event, assignedRole) {
    event.preventDefault();
    if (assignedRole === 'doctor') {
        window.location.href = 'doctor-dashboard.html';
    } else {
        window.location.href = 'patient-dashboard.html';
    }
}

function advanceSignupPipeline(selectedRole) {
    document.getElementById('signup-step-tier').classList.remove('active');
    const targetNodeId = `signup-step-${selectedRole}`;
    const targetNode = document.getElementById(targetNodeId);
    if(targetNode) targetNode.classList.add('active');
}

function resetSignupPipeline() {
    document.querySelectorAll('#auth-signup-view .signup-pipeline-node').forEach(node => node.classList.remove('active'));
    document.getElementById('signup-step-tier').classList.add('active');
}

function processProviderRegistryStream(event) {
    event.preventDefault();
    
    onboardingRegistrationData.ownerName = document.getElementById('doc-owner-name').value.trim();
    onboardingRegistrationData.superintendentName = document.getElementById('doc-super-name').value.trim();
    onboardingRegistrationData.clinicTitle = document.getElementById('doc-clinic').value.trim();
    onboardingRegistrationData.licenseNumber = document.getElementById('doc-license').value.trim();
    onboardingRegistrationData.emailVector = document.getElementById('doc-email').value.trim();
    onboardingRegistrationData.mobileVector = document.getElementById('doc-tel').value.trim();
    onboardingRegistrationData.addressVector = document.getElementById('doc-address').value.trim();

    document.getElementById('signup-step-provider').classList.remove('active');
    document.getElementById('signup-step-agreement').classList.add('active');
}

function downloadOriginalDraftCopy() {
    const link = document.createElement('a');
    link.href = 'assets/PulseOne Hospital Agreement.pdf'; 
    link.download = 'PulseOne_Hospital_Strategic_Agreement_Draft.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onboardingRegistrationData.hasDownloadedDraft = true;
    const continueBtn = document.getElementById('btn-agreement-continue-step');
    continueBtn.removeAttribute('disabled');
    continueBtn.classList.remove('disabled-opacity-lock');
}

function advanceFromAgreementToUploads() {
    if (!onboardingRegistrationData.hasDownloadedDraft) {
        alert("Compliance Requirement: Please download the original contract draft copy before continuing[cite: 3].");
        return;
    }
    document.getElementById('signup-step-agreement').classList.remove('active');
    document.getElementById('signup-step-verification').classList.add('active');
}

function updateUploadLabel(inputElement) {
    if(inputElement.files && inputElement.files[0]) {
        const dropzone = inputElement.closest('.upload-dropzone-box');
        dropzone.style.borderColor = "var(--clr-emerald)";
        dropzone.querySelector('strong').innerText = "Document Staged Successfully";
        dropzone.querySelector('span').innerText = inputElement.files[0].name;
    }
}

function processHandwrittenSignatureAssetInbound(inputElement) {
    if (inputElement.files && inputElement.files[0]) {
        const targetFile = inputElement.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            onboardingRegistrationData.signatureImageBase64 = e.target.result;
            const dz = document.getElementById('dz-sig-capture');
            dz.style.borderColor = "var(--clr-emerald)";
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
    document.getElementById('rec-fill-license').innerText = onboardingRegistrationData.licenseNumber;

    const signatureFrame = document.getElementById('rec-fill-signature-frame');
    if (onboardingRegistrationData.signatureImageBase64 && signatureFrame) {
        signatureFrame.innerHTML = `<img src="${onboardingRegistrationData.signatureImageBase64}" style="max-height: 45px; max-width: 100%; object-fit: contain;">`;
    }

    document.getElementById('signup-step-verification').classList.remove('active');
    document.getElementById('signup-step-final-contract').classList.add('active');
}

/**
 * ==========================================================================
 * HIGH-PRECISION A4 COORDINATE WRITER (pdf-lib CORE DRIVERS)
 * ==========================================================================
 */
async function generateAndSaveOfficialAgreementPDF() {
    try {
        // 1. Fetch original binary template file[cite: 3]
        const existingPdfBytes = await fetch('assets/PulseOne Hospital Agreement.pdf').then(res => res.arrayBuffer());

        // 2. Load bytes into processing layout memory
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Core typefaces
        const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        const pages = pdfDoc.getPages();
        const page1 = pages[0]; // Page 1 index[cite: 3]
        const page7 = pages[6]; // Page 7 index (Schedule-A Matrix & Signatures Block)[cite: 3]
        const page8 = pages[7]; // Page 8 index (Hospital Details Manifest Sheet)[cite: 3]

        const textColorBlue = rgb(15/255, 34/255, 64/255);
        const textColorBlack = rgb(30/255, 41/255, 59/255);

        /* ----------------==================================
           PAGE 1 INJECTIONS: TOP CORRIDOR CONTRACT DATA[cite: 3]
           --------------------------------================== */
        // Form Line: "executed on __ day of ____, 2026"[cite: 3]
        page1.drawText('16th', { x: 352, y: 682, size: 10, font: boldFont, color: textColorBlue });
        page1.drawText('June', { x: 405, y: 682, size: 10, font: boldFont, color: textColorBlue });

        // Form Line: "Hospital, having its registered office at ______________"[cite: 3]
        page1.drawText(onboardingRegistrationData.clinicTitle, { x: 58, y: 538, size: 10, font: boldFont, color: textColorBlue });
        page1.drawText(onboardingRegistrationData.addressVector, { x: 255, y: 512, size: 9, font: regularFont, color: textColorBlack });


        /* ----------------==================================
           PAGE 7 INJECTIONS: FOR HOSPITAL REGISTRATION UNDERLINES[cite: 3]
           --------------------------------================== */
        // Hospital Name Row[cite: 3]
        page7.drawText(onboardingRegistrationData.clinicTitle, { x: 348, y: 381, size: 10, font: boldFont, color: textColorBlue });

        // Name Underline[cite: 3]
        page7.drawText(onboardingRegistrationData.attestationSignatureName, { x: 395, y: 319, size: 10, font: boldFont, color: textColorBlue });

        // Designation Underline[cite: 3]
        page7.drawText('Authorized Representative / Superintendent', { x: 415, y: 291, size: 10, font: regularFont, color: textColorBlack });

        // Date Underline[cite: 3]
        page7.drawText('16-06-2026', { x: 386, y: 240, size: 10, font: regularFont, color: textColorBlack });

        // Handwritten Signature Image Layer Placement[cite: 3]
        if (onboardingRegistrationData.signatureImageBase64) {
            const base64Data = onboardingRegistrationData.signatureImageBase64.split(',')[1];
            const signatureImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            let embeddedSigImage;
            if (onboardingRegistrationData.signatureImageBase64.includes('png')) {
                embeddedSigImage = await pdfDoc.embedPng(signatureImageBytes);
            } else {
                embeddedSigImage = await pdfDoc.embedJpg(signatureImageBytes);
            }

            // Meticulously mapped right over the baseline of the original printed 'Signature:' text field[cite: 3]
            page7.drawImage(embeddedSigImage, {
                x: 428,
                y: 269,
                width: 115,
                height: 30
            });
        }


        /* ----------------==================================
           PAGE 8 INJECTIONS: DETAILS SHEET GRID CELL ENTRIES[cite: 3]
           --------------------------------================== */
        // Aligned beautifully to populate the empty right-hand column slots next to labels[cite: 3]
        page8.drawText(onboardingRegistrationData.ownerName, { x: 317, y: 629, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.emailVector, { x: 317, y: 615, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.mobileVector, { x: 317, y: 601, size: 10, font: regularFont, color: textColorBlack });
        page8.drawText(onboardingRegistrationData.superintendentName, { x: 317, y: 587, size: 10, font: regularFont, color: textColorBlack });
        // page8.drawText(onboardingRegistrationData.mobileVector, { x: 317, y: 311, size: 10, font: regularFont, color: textColorBlack });
        // page8.drawText('Primary Helpdesk Desk Node A', { x: 317, y: 290, size: 10, font: regularFont, color: textColorBlack });
        // page8.drawText('+91 8130855300', { x: 317, y: 269, size: 10, font: regularFont, color: textColorBlack });
        // page8.drawText(onboardingRegistrationData.addressVector, { x: 317, y: 248, size: 9, font: regularFont, color: textColorBlack });

        // 6. Output final compilation data buffers
        const modifiedPdfBytes = await pdfDoc.save();

        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `PulseOne_Executed_Strategic_Agreement.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clear dashboard navigation access locks
        const launchBtn = document.getElementById('btn-final-dashboard-launch');
        if (launchBtn) {
            launchBtn.removeAttribute('disabled');
            launchBtn.classList.remove('disabled-opacity-lock');
        }

    } catch (error) {
        console.error("PDF Geometry Modification Exception: ", error);
        alert("Coordinate Mapping Interrupted: Confirm un-signed template file exists under 'assets/PulseOne Hospital Agreement.pdf'.");
    }
}

function navigateToDoctorDashboard() {
    window.location.href = 'doctor-dashboard.html';
}

function pauseProviderOnboarding() {
    window.location.href = 'index.html';
}

function finalizeConsumerRegistration(event) {
    event.preventDefault();
    window.location.href = 'patient-dashboard.html';
}