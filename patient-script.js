/* ==========================================================================
   PULSEONE PATIENT OPERATIONS DESK - REALTIME BIDDING ENGINE CONSOLE
   ========================================================================== */

// Active State Configuration Node Cache Tracking Links
let patientState = {
    isRoyaltyMember: false,
    walletBalance: 0,
    bufferedWalletGift: 0,
    activeBroadcastInterval: null
};

// Mock Inbound Quote Data Stream Repositories Mapped by Requirement Category
const providerBiddingStreams = {
    "fever": [
        { provider: "Dr. Alok Rai (Clinic Node)", rating: "4.8", price: 350, eta: "10 mins" },
        { provider: "Metro Lifeline Hospital", rating: "4.6", price: 450, eta: "Immediate" },
        { provider: "Dr. Sneha Kapoor", rating: "4.9", price: 300, eta: "25 mins" }
    ],
    "skin": [
        { provider: "SkinCare Advanced Clinic", rating: "4.7", price: 550, eta: "15 mins" },
        { provider: "Dr. R. M. Singhania", rating: "4.5", price: 400, eta: "30 mins" }
    ],
    "cbc-test": [
        { provider: "PulseOne Diagnostics Hub Alpha", rating: "4.9", price: 249, eta: "Home Collection 45m" },
        { provider: "Zeencare Labs Local Node", rating: "4.8", price: 199, eta: "Home Collection 1h" },
        { provider: "Apollo Diagnostic Link", rating: "4.7", price: 290, eta: "Home Collection 30m" }
    ],
    "generic": [
        { provider: "City Community Health Port", rating: "4.2", price: 200, eta: "20 mins" },
        { provider: "Dr. Vikas Agrawal", rating: "4.6", price: 350, eta: "12 mins" }
    ]
};

// Initialize system displays upon DOM ready state
document.addEventListener("DOMContentLoaded", () => {
    refreshWalletInterfaceDisplays();
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
   ADVANCED FILTRATION & LIVE NETWORKING ENGINE LOGIC
   ========================================================================== */

function executeAdvancedFilterSearch() {
    const searchQuery = document.getElementById('medical-query').value.trim().toLowerCase();
    const doctorType = document.getElementById('filter-doctor-type').value;
    const diseaseType = document.getElementById('filter-disease-type').value;
    const priceType = document.getElementById('filter-price-type').value;

    const cards = document.querySelectorAll('.doctor-profile-card-node');

    cards.forEach(card => {
        const cardSpecialist = card.getAttribute('data-specialist');
        const cardDisease = card.getAttribute('data-disease');
        const cardPricingFormat = card.getAttribute('data-pricing');
        const cardTextContent = card.innerText.toLowerCase();

        let matchesSearch = !searchQuery || cardTextContent.includes(searchQuery);
        let matchesSpecialist = (doctorType === 'all') || (cardSpecialist === doctorType);
        let matchesDisease = (diseaseType === 'all') || (cardDisease === diseaseType);
        let matchesPricing = (priceType === 'all') || (cardPricingFormat === priceType);

        if (matchesSearch && matchesSpecialist && matchesDisease && matchesPricing) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    triggerNotificationSynapse("Directory filters applied. Matching results categorized below.");
}

function clearFilterParameters() {
    document.getElementById('medical-query').value = '';
    document.getElementById('filter-doctor-type').value = 'all';
    document.getElementById('filter-disease-type').value = 'all';
    document.getElementById('filter-price-type').value = 'all';
    
    document.querySelectorAll('.doctor-profile-card-node').forEach(card => {
        card.style.display = 'flex';
    });
    triggerNotificationSynapse("Search filters reset to baseline grid indexes.");
}

/* ==========================================================================
   REAL-TIME BIDDING DISTRIBUTION ENGINE (BROADCAST HANDLES)
   ========================================================================== */

/**
 * Initializes a live infrastructure-wide broadcast, waking the Bidding Arena interface container layout module.
 */
function initializeLiveNetworkBroadcast() {
    const query = document.getElementById('medical-query').value.trim().toLowerCase();
    const targetArena = document.getElementById('live-bidding-arena');
    const bidsContainer = document.getElementById('live-bids-container');
    const badgeCount = document.getElementById('bidding-count-badge');

    if (!query) {
        alert("Please enter your specific disease parameter or required test token inside the search input before broadcasting.");
        return;
    }

    // Unhide Bidding Section Framework
    targetArena.style.display = 'block';
    bidsContainer.innerHTML = `<div class="arena-loading-broadcast-pulse"><p>Broadcasting parameters out onto active local nodes... waiting for incoming provider streams.</p></div>`;
    targetArena.scrollIntoView({ behavior: 'smooth' });

    // Identify corresponding streaming assets array
    let matchedKey = "generic";
    if (query.includes("fever") || query.includes("cough") || query.includes("cold")) matchedKey = "fever";
    else if (query.includes("skin") || query.includes("acne") || query.includes("pimple")) matchedKey = "skin";
    else if (query.includes("cbc") || query.includes("blood") || query.includes("test")) matchedKey = "cbc-test";

    const pooledBids = providerBiddingStreams[matchedKey];
    let activeIndex = 0;
    badgeCount.innerText = "0";

    // Clear any conflicting running intervals
    if (patientState.activeBroadcastInterval) clearInterval(patientState.activeBroadcastInterval);

    // Wipe loading placeholders clean when streaming initializes
    setTimeout(() => { bidsContainer.innerHTML = ''; }, 1500);

    // Simulating incoming real-time streaming sockets from surrounding medical units
    patientState.activeBroadcastInterval = setInterval(() => {
        if (activeIndex < pooledBids.length) {
            const currentBid = pooledBids[activeIndex];
            
            // Build dynamic asset card node elements structures
            const bidCard = document.createElement('div');
            bidCard.className = "doctor-profile-card-node active-live-bid-card animation-pop-in";
            bidCard.innerHTML = `
                <div class="doc-card-main-meta">
                    <div class="doc-avatar-placeholder asset-live-generic-node"></div>
                    <div class="doc-identity-details">
                        <div class="doc-rating-badge">⭐ ${currentBid.rating}</div>
                        <h4>${currentBid.provider}</h4>
                        <p class="doc-specialty-subtitle">Live Network Respondent Node</p>
                        <span class="doc-experience-span">&#9202; Estimated Synapse Connect ETA: <strong>${currentBid.eta}</strong></span>
                    </div>
                </div>
                <div class="doc-card-compliance-footer">
                    <div class="doc-pricing-meta">
                        <span class="fee-caption">Live Quoted Price</span>
                        <span class="fee-numerical text-highlight-green">₹${currentBid.price}</span>
                    </div>
                    <button class="btn-consult-action-trigger match-bid-btn" onclick="initializeConsultationBooking('${currentBid.provider}', ${currentBid.price}, 'Live Negotiated Bid')">Accept & Connect</button>
                </div>
            `;
            
            bidsContainer.appendChild(bidCard);
            activeIndex++;
            badgeCount.innerText = activeIndex;
            
            triggerNotificationSynapse(`New Competitive Quote Received from ${currentBid.provider}: ₹${currentBid.price}`);
        } else {
            clearInterval(patientState.activeBroadcastInterval);
            triggerNotificationSynapse("Broadcast sweep final status: All surrounding regional provider response arrays locked.");
        }
    }, 2800);
}

/* ==========================================================================
   CONSULTATION BOOKING & PAYMENT INTERRUPT ROUTINES
   ========================================================================== */

function initializeConsultationBooking(doctorName, consultationFee, trackingType) {
    if (patientState.walletBalance >= consultationFee) {
        patientState.walletBalance -= consultationFee;
        refreshWalletInterfaceDisplays();
        
        triggerNotificationSynapse(`Meeting Fixed (${trackingType}) with ${doctorName}! Instant payment of ₹${consultationFee} deducted from PulseWallet balance.`);
    } else {
        triggerNotificationSynapse(`Meeting Fixed (${trackingType}) with ${doctorName}! Initializing instant credit card/UPI processing gateway notification stream for ₹${consultationFee}...`);
    }
}

/* ==========================================================================
   ROYALTY PREMIUM & WALLET CREDIT LEDGERS
   ========================================================================== */

function initializeRoyaltyPurchase(tierName, priceValue, walletGiftCredits) {
    document.getElementById('checkout-tier-title').innerText = `Activate ${tierName}`;
    document.getElementById('checkout-total-price').innerText = `₹${priceValue.toLocaleString('en-IN')}`;
    document.getElementById('token-mock-id').innerText = `P1-ROY-${Math.floor(1000 + Math.random() * 9000)}`;
    
    patientState.bufferedWalletGift = walletGiftCredits;
    document.getElementById('royalty-checkout-modal').classList.add('modal-visible');
}

function closeCheckoutModal() {
    document.getElementById('royalty-checkout-modal').classList.remove('modal-visible');
}

function processRoyaltyPaymentTransaction(event) {
    event.preventDefault();
    closeCheckoutModal();

    patientState.isRoyaltyMember = true;
    patientState.walletBalance += patientState.bufferedWalletGift;
    patientState.bufferedWalletGift = 0;
    
    refreshWalletInterfaceDisplays();

    const tag = document.getElementById('user-profile-status');
    if (tag) {
        tag.innerText = "Royalty Member";
        tag.style.background = "rgba(70, 228, 131, 0.15)";
        tag.style.color = "#46E483";
    }

    triggerNotificationSynapse(`Royalty Pass Purchase Confirmed! Welcome grant bonus loaded onto your account balances.`);
}

function revealWalletLedgerModal() {
    document.getElementById('wallet-ledger-modal').classList.add('modal-visible');
}

function closeWalletLedgerModal() {
    document.getElementById('wallet-ledger-modal').classList.remove('modal-visible');
}

function executeWalletRechargeDirect() {
    const amountInput = document.getElementById('wallet-recharge-amount');
    const refillValue = parseFloat(amountInput.value);

    if (isNaN(refillValue) || refillValue <= 0) {
        alert("Please enter a valid financial credit reference number value.");
        return;
    }

    patientState.walletBalance += refillValue;
    refreshWalletInterfaceDisplays();
    closeWalletLedgerModal();
    amountInput.value = '';

    triggerNotificationSynapse(`Wallet refilled successfully! Added ₹${refillValue.toLocaleString('en-IN')} active parameters onto database nodes.`);
}

function refreshWalletInterfaceDisplays() {
    const targetHeader = document.getElementById('header-wallet-balance');
    const targetModal = document.getElementById('modal-wallet-balance-display');
    const formattedStr = `₹${patientState.walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    if (targetHeader) targetHeader.innerText = formattedStr;
    if (targetModal) targetModal.innerText = formattedStr;
}