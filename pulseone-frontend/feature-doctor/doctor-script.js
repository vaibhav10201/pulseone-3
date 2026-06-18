/* ==========================================================================
   PULSEONE CLINICAL PRACTITIONER INTERFACE CONTROL PLATFORM ENGINE
   ========================================================================== */
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_SERVER_HOST = IS_PRODUCTION ? 'https://your-backend-app-name.onrender.com' : 'http://localhost:5000';

const API_DOCTOR_REMOTE_BASE = API_SERVER_HOST + '/api/auth/doctor';
const API_PATIENT_REMOTE_BASE = API_SERVER_HOST + '/api/auth/patient';

// FIXED: Securely passes the dynamic endpoint routing variable into the Socket channel constructor
const socket = io(API_SERVER_HOST);

let doctorWorkspaceState = {
    doctorId: null,
    walletBalance: 0.00,
    isRoyaltyMember: false,
    offeredServices: []
};

// Start synchronization sequence on DOM load
document.addEventListener("DOMContentLoaded", () => {
    synchronizeDoctorStateFromDatabase();
});

/* ==========================================================================
   1. REAL-TIME DATA WORKSPACE INITIALIZATION & SYNCHRONIZERS
   ========================================================================== */
async function synchronizeDoctorStateFromDatabase() {
    const activeToken = localStorage.getItem('pulseone_user_token');
    const sessionPayload = localStorage.getItem('pulseone_doctor_data');
    
    if (!activeToken || !sessionPayload) {
        console.warn("Doctor credentials missing. Redirecting...");
        window.location.href = '../feature-auth/auth.html';
        return;
    }

    try {
        const cachedDoctor = JSON.parse(sessionPayload);
        const doctorId = cachedDoctor.id || cachedDoctor._id;
        doctorWorkspaceState.doctorId = doctorId;

        console.log(`[WORKSPACE NODE] Fetching clinical updates for ID: ${doctorId}`);
        const responseStream = await fetch(`${API_DOCTOR_REMOTE_BASE}/profile/${doctorId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${activeToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!responseStream.ok) {
            throw new Error(`Profile query failed with status code: ${responseStream.status}`);
        }

        const resData = await responseStream.json();

        if (resData.success && resData.doctor) {
            const docData = resData.doctor;
            
            doctorWorkspaceState.walletBalance = docData.earningsWalletBalance ?? 0.00;
            doctorWorkspaceState.isRoyaltyMember = docData.isRoyaltyMember ?? false;
            doctorWorkspaceState.offeredServices = docData.services || [];

            const titleHeader = document.getElementById('header-clinic-title');
            if (titleHeader) titleHeader.innerText = docData.clinicTitle || "Clinical Workspace Command";
            
            const balanceDisplay = document.getElementById('header-wallet-balance');
            if (balanceDisplay) balanceDisplay.innerText = `₹${parseFloat(doctorWorkspaceState.walletBalance).toFixed(2)}`;
            
            const ratingDisplay = document.getElementById('live-rating-display');
            if (ratingDisplay) ratingDisplay.innerHTML = `⭐ ${docData.networkRating || '5.0'} <small>/ 5.0</small>`;
            
            const multDisplay = document.getElementById('revenue-multiplier-display');
            if (multDisplay) multDisplay.innerText = docData.isRoyaltyMember ? "1.2x" : "1.0x";

            renderOfferedServicesGrid(doctorWorkspaceState.offeredServices);
            fetchIncomingTriageAppointments();
        } else {
            fallbackToLocalCache(cachedDoctor);
        }
    } catch (e) {
        console.error("Database connection fault. Loading local cache...", e);
        if(sessionPayload) fallbackToLocalCache(JSON.parse(sessionPayload));
    }
}

/* ==========================================================================
   2. APPOINTMENTS TRIAGE FETCH & DYNAMIC RENDER PIPELINE
   ========================================================================== */
async function fetchIncomingTriageAppointments() {
    const activeToken = localStorage.getItem('pulseone_user_token');
    const triageContainer = document.getElementById('triage-requests-container');
    if (!triageContainer || !doctorWorkspaceState.doctorId) return;

    try {
        const res = await fetch(`${API_DOCTOR_REMOTE_BASE}/appointments-queue/${doctorWorkspaceState.doctorId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${activeToken}` }
        });
        const resData = await res.json();

        if (res.ok && resData.success && resData.triageQueue) {
            triageContainer.innerHTML = "";
            const appointments = resData.triageQueue;

            if (appointments.length === 0) {
                triageContainer.innerHTML = `<div class="empty-arena-placeholder-box"><p>No pending appointment requests staged inside your triage lane parameters currently.</p></div>`;
                return;
            }

            appointments.forEach(item => {
                const cardId = item._id || item.id;
                triageContainer.innerHTML += `
                    <div id="triage-card-${cardId}" class="doctor-profile-card-node" style="background:#fff; border:1px solid #E6EEEA; border-radius:12px; padding:20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; box-shadow: 0 4px 12px rgba(0,0,0,0.01);">
                        <div>
                            <h4 style="margin:0 0 6px 0; color:#0A2923; font-size:16px;">Patient Name: ${item.patientName}</h4>
                            <p style="margin:0; font-size:13px; color:#475569;">⏰ Requested Slot: <strong>${item.appointmentDate}</strong> at <strong>${item.appointmentTime}</strong></p>
                            <small style="display:inline-block; margin-top:4px; color:#15803D; font-weight:700;">Expected Fee Yield: ₹${item.computedFee || 500}</small>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="processDoctorAppointmentDecision('${cardId}', 'approved')" style="background:#15803D; color:#fff; border:none; padding:10px 16px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;">Approve & Lock Slot</button>
                            <button onclick="processDoctorAppointmentDecision('${cardId}', 'rejected')" style="background:#EF4444; color:#fff; border:none; padding:10px 16px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;">Decline</button>
                        </div>
                    </div>`;
            });
        }
    } catch(err) {
        console.error("Triage queue download interruption:", err);
    }
}

async function processDoctorAppointmentDecision(appointmentId, decisionString) {
    const activeToken = localStorage.getItem('pulseone_user_token');
    if (!activeToken) return;

    const targetCardElement = document.getElementById(`triage-card-${appointmentId}`);
    if (targetCardElement) {
        targetCardElement.style.opacity = '0.3';
        targetCardElement.style.pointerEvents = 'none';
    }

    try {
        const response = await fetch(`${API_DOCTOR_REMOTE_BASE}/respond-to-appointment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId, responseStatus: decisionString })
        });
        
        const resData = await response.json();
        
        if (response.ok && resData.success) {
            if (targetCardElement) targetCardElement.remove();

            const triageContainer = document.getElementById('triage-requests-container');
            if (triageContainer && triageContainer.children.length === 0) {
                triageContainer.innerHTML = `<div class="empty-arena-placeholder-box"><p>No pending appointment requests staged inside your triage parameters currently.</p></div>`;
            }
            synchronizeDoctorStateFromDatabase();
        } else {
            if (targetCardElement) { targetCardElement.style.opacity = '1'; targetCardElement.style.pointerEvents = 'auto'; }
            alert("Error processing allocation request: " + resData.message);
        }
    } catch (e) { 
        console.error(e);
        if (targetCardElement) { targetCardElement.style.opacity = '1'; targetCardElement.style.pointerEvents = 'auto'; }
    }
}

/* ==========================================================================
   3. CLINICAL SERVICES INGESTION & GRID RENDER PIPELINES
   ========================================================================== */
async function executeServiceIngestion(event) {
    event.preventDefault();
    const activeToken = localStorage.getItem('pulseone_user_token');
    
    const title = document.getElementById('add-service-title').value.trim();
    const category = document.getElementById('add-service-category').value;
    const price = parseInt(document.getElementById('add-service-price').value) || 500;

    if (!doctorWorkspaceState.doctorId || !activeToken) return;

    try {
        const response = await fetch(`${API_DOCTOR_REMOTE_BASE}/add-service`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doctorId: doctorWorkspaceState.doctorId,
                service: { title: title, category: category, price: Number(price) }
            })
        });

        const resData = await response.json();

        if (response.ok && resData.success) {
            alert("New facility line registered successfully!");
            document.getElementById('add-service-title').value = "";
            document.getElementById('add-service-price').value = "";
            synchronizeDoctorStateFromDatabase();
        } else {
            alert("Registration fault: " + (resData.message || "Unresolved error."));
        }
    } catch (err) { console.error("Services save exception:", err); }
}

function renderOfferedServicesGrid(servicesList) {
    const gridContainer = document.getElementById('live-services-target-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = "";
    if (!servicesList || servicesList.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column:1/-1; color:#64748b; font-size:14px; font-style:italic; padding: 20px; background: #FAFCFB; border: 1px dashed #CCDAD4; border-radius: 12px; text-align: center;">No custom service configurations loaded yet. Use the control form module above to inject catalog nodes.</p>`;
        return;
    }

    servicesList.forEach((srv, index) => {
        // Safe check reads real ObjectIds, otherwise builds a predictable fallback index string
        const srvId = srv._id ? String(srv._id) : (srv.id ? String(srv.id) : `index-${index}`);
        const currentTitle = srv.title ? srv.title.trim() : "";
        const currentCategory = srv.category || 'General Practice Line';
        const currentPrice = srv.price || 500;

        const cardNode = document.createElement('div');
        cardNode.className = "general-doc-mini-card";
        cardNode.style.cssText = "background:#ffffff; border:1px solid #E2E8F0; border-left: 5px solid #46E483; border-radius:12px; padding:22px; display:flex; flex-direction:column; justify-content:space-between; box-shadow: 0 4px 15px rgba(0,0,0,0.02); position: relative;";

        cardNode.innerHTML = `
            <div class="mini-meta">
                <span style="font-size:10px; text-transform:uppercase; background:#E2F6EC; color:#0A2923; padding:4px 10px; border-radius:6px; font-weight:700; width:fit-content; margin-bottom:10px; display:inline-block; letter-spacing: 0.5px;">${currentCategory}</span>
                <h4 class="service-display-title-target" style="margin:0 0 6px 0; color:#0A2923; font-size:17px; font-weight: 700; line-height: 1.4;">${currentTitle}</h4>
            </div>
            <div class="mini-card-bottom" style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #F1F5F9; padding-top:14px;">
                <div style="display:flex; flex-direction:column;">
                    <small style="font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight:600; letter-spacing:0.5px;">Fee Rate</small>
                    <span class="mini-fee" style="font-weight:800; color:#15803D; font-size:18px; margin-top: 2px;">₹${currentPrice}.00</span>
                </div>
                <button type="button" class="btn-evict-service-trigger" 
                        data-id="${srvId}" 
                        data-title="${btoa(encodeURIComponent(currentTitle))}"
                        style="background: #FEF2F2; color: #EF4444; border: 1px solid #FEE2E2; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                    🗑️ Delete
                </button>
            </div>
        `;

        const deleteButton = cardNode.querySelector('.btn-evict-service-trigger');
        deleteButton.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = this.getAttribute('data-id');
            var rawEncTitle = this.getAttribute('data-title');
            var targetTitle = decodeURIComponent(atob(rawEncTitle));
            
            executeServiceEviction(targetId, targetTitle);
        });

        gridContainer.appendChild(cardNode);
    });
}

/* ==========================================================================
   SAFEGUARDED PORTFOLIO CATALOG EVICTION BACKEND HANDSHAKE DISPATCHER
   ========================================================================== */
/* ==========================================================================
   SAFEGUARDED PORTFOLIO CATALOG EVICTION BACKEND HANDSHAKE DISPATCHER
   ========================================================================== */
async function executeServiceEviction(serviceId, serviceTitle) {
    // Structural confirmation prompt before executing deletion mechanics
    if (!confirm(`Are you sure you want to delete "${serviceTitle}" from active search indices?`)) return;
    
    const activeToken = localStorage.getItem('pulseone_user_token');
    if (!doctorWorkspaceState.doctorId || !activeToken) {
        alert("Session execution loss error. Re-authenticate account access.");
        return;
    }

    try {
        console.log(`[EVICTION DISPATCH] Purging: ${serviceTitle} (ID Proxy: ${serviceId})`);

        const response = await fetch(`${API_DOCTOR_REMOTE_BASE}/remove-service`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + activeToken, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                doctorId: doctorWorkspaceState.doctorId,
                serviceId: serviceId, // Can safely pass 'index-X' string placeholders now
                serviceTitle: serviceTitle
            })
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
            alert("Service successfully purged from provider network catalogs.");
            synchronizeDoctorStateFromDatabase(); // Hot-reloads card layout views instantly
        } else {
            alert("Eviction dropped: " + (resData.message || "Verification fault."));
        }
    } catch (err) {
        console.error("Purge system exception track trace:", err);
        alert("Communications link error clearing selected service node.");
    }
}
/* ==========================================================================
   4. SYSTEM SOCKET LISTENERS & HANDLERS
   ========================================================================== */
socket.on('doctor_receive_appointment_request', (data) => {
    if (data.doctorId === doctorWorkspaceState.doctorId) {
        synchronizeDoctorStateFromDatabase();
    }
});

function revealWalletLedgerModal() {
    const modal = document.getElementById('wallet-ledger-modal');
    if (modal) {
        document.getElementById('modal-wallet-balance-display').innerText = `₹${parseFloat(doctorWorkspaceState.walletBalance).toFixed(2)}`;
        modal.style.display = 'flex';
    }
}

function closeWalletLedgerModal() {
    const modal = document.getElementById('wallet-ledger-modal');
    if (modal) modal.style.display = 'none';
}

function fallbackToLocalCache(cachedDoctor) {
    if (cachedDoctor && cachedDoctor.services) {
        renderOfferedServicesGrid(cachedDoctor.services);
    }
}

function executePlatformSecureLogout() {
    localStorage.clear();
    window.location.href = '../feature-auth/auth.html';
}