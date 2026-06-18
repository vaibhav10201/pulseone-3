const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_SERVER_HOST = IS_PRODUCTION ? 'https://pulseone-3.onrender.com' : 'http://localhost:5000';

const API_DOCTOR_REMOTE_BASE = API_SERVER_HOST + '/api/auth/doctor';
const API_PATIENT_REMOTE_BASE = API_SERVER_HOST + '/api/auth/patient';

// FIXED: Securely passes the dynamic endpoint routing variable into the Socket channel constructor
const socket = io(API_SERVER_HOST);
window.lastSearchResults = []; 
let selectedBookingMetadata = {};

// Instantiates client telemetry components on document rendering complete
document.addEventListener("DOMContentLoaded", () => {
    synchronizePatientStateFromDatabase();
    setupBookingCalendarConstraints();
});

// Production-grade Event intercept loop handles clicks on dynamic elements smoothly
document.addEventListener('click', function(e) {
    const targetBtn = e.target.closest('.btn-fix-appoint');
    
    if (targetBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const doctorId = targetBtn.getAttribute('data-id');
        console.log("[DASHBOARD HUB] Target appointment button captured. Doctor ID:", doctorId);
        
        handleFixAppointmentClick(doctorId);
    }
}, { capture: true });

async function synchronizePatientStateFromDatabase() {
    const activeToken = localStorage.getItem('pulseone_user_token');
    if (!activeToken) return;

    try {
        const tokenBase64 = activeToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(tokenBase64));
        const uId = decodedPayload.id || decodedPayload._id;

        const response = await fetch(`${API_PATIENT_REMOTE_BASE}/profile/${uId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${activeToken}` }
        });
        const resData = await response.json();

        if (resData.success && resData.patient) {
            const dbUser = resData.patient;
            
            const nameTitle = document.querySelector('.user-name-title');
            if (nameTitle) nameTitle.innerText = dbUser.name;
            
            const avatarCircle = document.querySelector('.profile-avatar-circle');
            if (avatarCircle && dbUser.name) avatarCircle.innerText = dbUser.name.charAt(0).toUpperCase();

            const walletBalance = document.getElementById('header-wallet-balance');
            if (walletBalance) walletBalance.innerText = `₹${parseFloat(dbUser.walletBalance || 0).toFixed(2)}`;

            localStorage.setItem('pulseone_patient_data', JSON.stringify(dbUser));
        }
    } catch (err) {
        console.error("Dashboard database synchronization failed:", err);
    }
}

/* ==========================================================================
   VALIDATION ENGINE: ROLLING 1-MONTH CALENDAR & INTRADAY HOUR FILTER
   ========================================================================== */
function setupBookingCalendarConstraints() {
    const dateInput = document.getElementById('booking-target-date');
    const timeSelect = document.getElementById('booking-target-time');
    if (!dateInput || !timeSelect) return;

    // --- STEP 1: RESTRICT CALENDAR TO A 1-MONTH WINDOW ---
    const today = new Date();
    
    const formatDateStr = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const minDateStr = formatDateStr(today);

    // Advance calendar constraint limit to exactly 1 month from today
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 1);
    const maxDateStr = formatDateStr(maxDate);

    dateInput.min = minDateStr;
    dateInput.max = maxDateStr;

    // --- STEP 2: INTRADAY DYNAMIC HOUR FILTER ---
    const updateSelectableTimeSlots = () => {
        const selectedDate = dateInput.value;
        const currentHour = new Date().getHours();

        Array.from(timeSelect.options).forEach(option => {
            if (!option.value) return;

            const targetSlotHour = parseInt(option.getAttribute('data-hour'), 10);

            // If selected date is TODAY, block past timeslots
            if (selectedDate === minDateStr) {
                if (targetSlotHour <= currentHour) {
                    option.disabled = true;
                    option.style.display = 'none';
                } else {
                    option.disabled = false;
                    option.style.display = 'block';
                }
            } else {
                // Future dates maintain all slots fully unblocked
                option.disabled = false;
                option.style.display = 'block';
            }
        });

        // Auto-clear selection if the previously picked choice is now disabled/hidden
        if (timeSelect.selectedOptions[0] && timeSelect.selectedOptions[0].disabled) {
            timeSelect.value = "";
        }
    };

    dateInput.addEventListener('change', updateSelectableTimeSlots);
    
    // Expose reference globally so modal can trigger calculations when opened
    window.refreshTimeSlotValidationMatrix = updateSelectableTimeSlots;
}

async function executeAdvancedFilterSearch() {
    const medicalQuery = document.getElementById("medical-query").value.trim();
    const locationVector = document.getElementById("geo-location").value.trim();
    const activeToken = localStorage.getItem('pulseone_user_token');

    try {
        const response = await fetch(`${API_PATIENT_REMOTE_BASE}/search-directory`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ medicalQuery, locationVector })
        });
        const resData = await response.json();
        
        if (resData && resData.success) {
            window.lastSearchResults = [...(resData.lists.generalDoctors || []), ...(resData.lists.premiumDoctors || [])];
            renderDirectoryGrid(window.lastSearchResults, "doctor-results-grid");
        }
    } catch (err) {
        console.error("Search telemetry drop:", err);
    }
}

function renderDirectoryGrid(doctorsList, targetDOMContainerId) {
    const container = document.getElementById(targetDOMContainerId);
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!doctorsList || doctorsList.length === 0) {
        container.innerHTML = `
            <div class="empty-arena-placeholder-box" style="grid-column: 1/-1; text-align:center; padding:48px 24px; background:#FAFCFB; border:1px dashed #CCDAD4; border-radius:16px; color:#64748b;">
                <p style="margin:0; font-family:'Plus Jakarta Sans', sans-serif; font-size:14px;">No matching medical practitioners found within this node cluster.</p>
            </div>`;
        return;
    }
    
    doctorsList.forEach(doc => {
        const dId = doc._id || doc.id;
        const card = document.createElement('div');
        card.className = "doctor-profile-card-node";
        card.style.cssText = "background:#FFFFFF; border:1px solid #E6EEEA; border-radius:16px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 20px rgba(10,41,35,0.02); transition:all 0.3s ease; overflow:hidden; margin-bottom:20px;";
        
        const initialChar = (doc.ownerName || "D").trim().charAt(0).toUpperCase();
        
        card.innerHTML = `
            <div style="padding: 24px; display: flex; gap: 20px; align-items: flex-start;">
                <div style="width: 56px; height: 56px; border-radius: 12px; background: #E2F6EC; color: #0A2923; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 20px; flex-shrink: 0; border: 1px solid #CCDAD4;">
                    ${initialChar}
                </div>
                <div style="flex: 1; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="background: #FEF3C7; color: #92400E; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">⭐ 5.0</span>
                    </div>
                    <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #0A2923; font-size: 18px; font-weight: 700; margin: 0 0 6px 0;">${doc.ownerName}</h4>
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #475569; margin: 0 0 6px 0;">
                        <span>🏥</span> Clinic: <span style="font-weight: 500; color: #0A2923;">${doc.clinicTitle || "PulseOne Affiliate"}</span>
                    </p>
                </div>
            </div>
            <div style="background: #FAFCFB; border-top: 1px solid #E6EEEA; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Consultation Fee</span>
                    <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: #15803D; margin-top: 4px;">₹${doc.baseConsultationFee || 500}</span>
                </div>
                <button type="button" class="btn-fix-appoint" data-id="${dId}" 
                        style="background: #0A2923; color: #FFFFFF; border: none; padding: 12px 24px; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                    Fix Appointment
                </button>
            </div>`;
        container.appendChild(card);
    });
}

function handleFixAppointmentClick(targetDoctorId) {
    const doc = window.lastSearchResults.find(d => ((d._id || d.id) === targetDoctorId));
    if (!doc) return alert("Error: Could not retrieve doctor context.");
    
    selectedBookingMetadata = {
        doctorId: targetDoctorId,
        doctorName: doc.ownerName || "PulseOne Doctor",
        fee: doc.baseConsultationFee || 500,
        clinicTitle: doc.clinicTitle || "PulseOne Center"
    };
    
    const modal = document.getElementById('appointment-calendar-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Form boundary check resets fields safely upon opening
        document.getElementById('booking-target-date').value = "";
        document.getElementById('booking-target-time').value = "";
        if (typeof window.refreshTimeSlotValidationMatrix === 'function') {
            window.refreshTimeSlotValidationMatrix();
        }
    }
}

function closeAppointmentCalendarModal() {
    const modal = document.getElementById('appointment-calendar-modal');
    if (modal) modal.style.display = 'none';
}

async function submitAppointmentBookingRequest(event) {
    event.preventDefault();
    const activeToken = localStorage.getItem('pulseone_user_token');
    if (!activeToken) return;

    const tokenBase64 = activeToken.split('.')[1];
    const decodedPayload = JSON.parse(atob(tokenBase64));
    const realPatientId = decodedPayload.id || decodedPayload._id;

    const body = {
        patientId: realPatientId,
        patientName: document.querySelector('.user-name-title')?.innerText || "PulseOne Patient",
        ...selectedBookingMetadata,
        appointmentDate: document.getElementById('booking-target-date').value,
        appointmentTime: document.getElementById('booking-target-time').value
    };

    try {
        const res = await fetch(`${API_PATIENT_REMOTE_BASE}/book-appointment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            alert("Booking request logged perfectly across PulseOne system tracks!");
            closeAppointmentCalendarModal();
        }
    } catch (err) {
        alert("Server transmission loop handshake interrupted.");
    }
}

function executePlatformSecureLogout() {
    localStorage.clear();
    window.location.href = '../feature-auth/auth.html';
}