/* ==========================================================================
   PULSEONE CLINICAL OPERATIONS NODE COMMAND PLATFORM CONTROL SYSTEMS
   ========================================================================== */

// Active State Configuration Vault
let providerState = {
    isRoyaltyPartner: false,
    earningsWalletBalance: 24500, 
    revenueMultiplier: 1.0,
    // Live Medical Services Data Array Model
    services: [
        { id: "srv-1", title: "General Consultation", category: "In-Clinic Visit", price: 500 },
        { id: "srv-2", title: "Complete Blood Count (CBC)", category: "Lab Telemetry", price: 299 },
        { id: "srv-3", title: "Minor Surgical Guided Pathway", category: "Surgery Pathway", price: 12500 }
    ]
};

// Initialize current system interface display loops on load
document.addEventListener("DOMContentLoaded", () => {
    refreshWalletInterfaceDisplays();
    renderClinicalServicesStack();
});

/* ==========================================================================
   NOTIFICATION SYSTEM LAYER (LIVE TOAST ENGINE HANDLES)
   ========================================================================== */

function triggerNotificationSynapse(messageText) {
    const banner = document.getElementById('notification-synapse-banner');
    const textTarget = document.getElementById('notification-toast-text');
    
    if (!banner || !textTarget) return;

    textTarget.innerText = messageText;
    banner.classList.add('toast-visible');
    
    setTimeout(() => {
        banner.classList.remove('toast-visible');
    }, 8000);
}

function dismissNotificationBanner() {
    const banner = document.getElementById('notification-synapse-banner');
    if (banner) {
        banner.classList.remove('toast-visible');
    }
}

/* ==========================================================================
   PATIENT TRIAGE QUEUE MANAGEMENT & SCHEDULING LOGIC
   ========================================================================== */

function lockAppointmentAllocation(triageId, patientName) {
    const selectorElement = document.getElementById(`time-allocation-select-${triageId}`);
    const selectedTime = selectorElement.value;
    
    // Dynamically look up current consultation price point from active state configuration array
    const baseConsultationObj = providerState.services.find(s => s.id === "srv-1");
    const activeConsultFee = baseConsultationObj ? baseConsultationObj.price : 500;
    
    const finalizedEarningAmount = activeConsultFee * providerState.revenueMultiplier;
    providerState.earningsWalletBalance += finalizedEarningAmount;
    
    refreshWalletInterfaceDisplays();

    const targetCard = document.getElementById(`triage-node-card-${triageId}`);
    if (targetCard) {
        targetCard.style.opacity = '0';
        targetCard.style.transform = 'scale(0.95)';
        setTimeout(() => {
            targetCard.remove();
            updateTriageCountBadge();
        }, 800);
    }

    triggerNotificationSynapse(`Appointment Confirmed! Slot allocation locked at [${selectedTime}] for patient: ${patientName}. Credited ₹${finalizedEarningAmount} into PulseWallet.`);
}

function updateTriageCountBadge() {
    const currentCount = document.querySelectorAll('#triage-requests-container .doctor-profile-card-node').length;
    const badge = document.getElementById('triage-count-badge');
    if (badge) {
        badge.innerText = currentCount;
        if (currentCount === 0) {
            document.getElementById('triage-requests-container').innerHTML = `
                <div class="empty-arena-placeholder-box">
                    <p>All active clinical patient triage streams completed. Triage queue clear.</p>
                </div>`;
            badge.style.display = 'none';
        }
    }
}

/* ==========================================================================
   DYNAMIC MEDICAL SERVICES ENGINE (ADD, REMOVE, UPDATE PRICE)
   ========================================================================== */

/**
 * Loops across the data array to build out operational nodes with integrated price editors.
 */
function renderClinicalServicesStack() {
    const targetGrid = document.getElementById('live-services-target-grid');
    if (!targetGrid) return;

    targetGrid.innerHTML = ''; // Wipe panel layer clean

    providerState.services.forEach(service => {
        // Map dynamic visual badges matching service type categories
        let symbolMarker = "&#128187;";
        if (service.category.includes("Lab")) symbolMarker = "&#129483;";
        else if (service.category.includes("Surgery")) symbolMarker = "&#129658;";

        const serviceCard = document.createElement('div');
        serviceCard.className = "general-doc-mini-card animation-pop-in";
        serviceCard.id = `service-node-${service.id}`;
        serviceCard.innerHTML = `
            <div class="mini-card-top">
                <div class="services-icon-indicator-box">${symbolMarker}</div>
                <div class="mini-meta">
                    <h4>${service.title}</h4>
                    <p class="service-category-subtitle-tag">${service.category}</p>
                </div>
            </div>
            <div class="mini-card-bottom update-module-row-modifier">
                <div class="inline-price-editor-group">
                    <span class="currency-prefix-fixed">₹</span>
                    <input type="number" class="input-service-price-modifier" value="${service.price}" 
                        onchange="executeServicePriceUpdate('${service.id}', this.value)">
                </div>
                <button class="btn-remove-service-ghost" onclick="executeServiceRemoval('${service.id}')" title="Remove Service">&times; Delete</button>
            </div>
        `;
        targetGrid.appendChild(serviceCard);
    });
}

/**
 * Push new facilities definitions onto database array maps.
 */
function executeServiceIngestion(event) {
    event.preventDefault();

    const titleInput = document.getElementById('add-service-title');
    const catInput = document.getElementById('add-service-category');
    const priceInput = document.getElementById('add-service-price');

    const newService = {
        id: `srv-${Date.now()}`,
        title: titleInput.value.trim(),
        category: catInput.value,
        price: parseInt(priceInput.value)
    };

    providerState.services.push(newService);
    renderClinicalServicesStack();

    // Reset creation fields values
    titleInput.value = '';
    priceInput.value = '';

    triggerNotificationSynapse(`New System Allocation Deployed: "${newService.title}" is now active across consumer directories.`);
}

/**
 * Update rate mappings instantly for the selected identifier token.
 */
function executeServicePriceUpdate(serviceId, newPriceValue) {
    const targetValue = parseInt(newPriceValue);
    if (isNaN(targetValue) || targetValue < 0) {
        alert("Please map a valid structural pricing number parameter.");
        return;
    }

    const targetService = providerState.services.find(s => s.id === serviceId);
    if (targetService) {
        targetService.price = targetValue;
        triggerNotificationSynapse(`Rate parameters adjusted! "${targetService.title}" set to ₹${targetValue}.`);
    }
}

/**
 * Drops targeted service markers from global lookups.
 */
function executeServiceRemoval(serviceId) {
    const targetService = providerState.services.find(s => s.id === serviceId);
    const serviceTitle = targetService ? targetService.title : "Medical Service";

    if (confirm(`Confirm asset extraction protocol? This will remove "${serviceTitle}" from search results.`)) {
        providerState.services = providerState.services.filter(s => s.id !== serviceId);
        renderClinicalServicesStack();
        triggerNotificationSynapse(`Service structural extraction completed: "${serviceTitle}" removed.`);
    }
}

/* ==========================================================================
   PROFILE CONFIGURATION MODIFICATION HANDLES
   ========================================================================== */

function commitProfileModifications(event) {
    event.preventDefault();
    const updatedName = document.getElementById('input-doc-name').value.trim();
    document.getElementById('header-doc-name').innerText = updatedName;
    triggerNotificationSynapse(`Profile configuration tokens updated! Display set to ${updatedName}.`);
}

/* ==========================================================================
   ROYALTY PARTNER UPGRADE SUBSYSTEM OPERATIONS
   ========================================================================== */

function initializeProviderRoyaltyUpgrade(feeCost) {
    if (confirm("Confirm platform authorization to deduct Royalty Partner registration fees from your linked portfolio vectors?")) {
        providerState.isRoyaltyPartner = true;
        providerState.revenueMultiplier = 1.2;
        
        document.getElementById('revenue-multiplier-display').innerText = "1.2x (Premium)";
        
        const statusTag = document.getElementById('provider-profile-status');
        if (statusTag) {
            statusTag.innerText = "Royalty Platinum";
            statusTag.style.background = "rgba(70, 228, 131, 0.15)";
            statusTag.style.color = "#46E483";
        }

        triggerNotificationSynapse("Practice account infrastructure elevated to Royalty Platinum Level! 1.2x Earnings Multiplier applied across all live sessions.");
    }
}

/* ==========================================================================
   PULSEWALLET ACCESSIBILITY UTILITIES
   ========================================================================== */

function revealWalletLedgerModal() {
    document.getElementById('wallet-ledger-modal').classList.add('modal-visible');
}

function closeWalletLedgerModal() {
    document.getElementById('wallet-ledger-modal').classList.remove('modal-visible');
}

function refreshWalletInterfaceDisplays() {
    const targetHeader = document.getElementById('header-wallet-balance');
    const targetModal = document.getElementById('modal-wallet-balance-display');
    const formattedStr = `₹${providerState.earningsWalletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    if (targetHeader) targetHeader.innerText = formattedStr;
    if (targetModal) targetModal.innerText = formattedStr;
}