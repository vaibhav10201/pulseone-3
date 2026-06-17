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


const doctorsDatabase = [

{
    id:1,
    name:"Dr. Sarah Jenkins",
    gender:"female",
    specialty:"General Physician",
    disease:["fever","cold","cough","heart"],
    experience:12,
    fee:500,
    rating:4.9,
    mode:"clinic",
    image:"https://i.pravatar.cc/200?img=32",
    hospital:"PulseOne City Hospital",
    address:"Civil Lines, Kanpur",
    availability:"Available Today"
},

{
    id:2,
    name:"Dr. Anand Verma",
    gender:"male",
    specialty:"Dermatologist",
    disease:["skin","acne"],
    experience:14,
    fee:700,
    rating:4.8,
    mode:"video",
    image:"https://i.pravatar.cc/200?img=12",
    hospital:"SkinCare Clinic",
    address:"Swaroop Nagar, Kanpur",
    availability:"Available Today"
},

{
    id:3,
    name:"Dr. Priya Nair",
    gender:"female",
    specialty:"Gynecologist",
    disease:["pregnancy","women"],
    experience:18,
    fee:900,
    rating:4.9,
    mode:"clinic",
    image:"https://i.pravatar.cc/200?img=44",
    hospital:"Mother Care Hospital",
    address:"Kakadeo, Kanpur",
    availability:"Available Tomorrow"
},

{
    id:4,
    name:"Dr. Raj Patel",
    gender:"male",
    specialty:"Cardiologist",
    disease:["heart","bp"],
    experience:20,
    fee:1200,
    rating:4.8,
    mode:"video",
    image:"https://i.pravatar.cc/200?img=15",
    hospital:"PulseOne Heart Centre",
    address:"GSVM Area, Kanpur",
    availability:"Available Today"
}

];




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
     renderDoctors(doctorsDatabase);
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

    const query =
        document.getElementById("medical-query")
        .value
        .toLowerCase()
        .trim();

    const gender = 
        document.getElementById("filter-doctor-gender")
        .value;

    const experience =
        document.getElementById("filter-experience")
        .value
        .toLowerCase();

    const fee =
        document.getElementById("filter-fees")
        .value;

    const rating =
        document.getElementById("filter-rating")
        .value;

    const mode =
        document.getElementById("filter-mode")
        .value;

    const filteredDoctors = doctorsDatabase.filter(doc => {

        const matchesQuery =
            query === "" ||
            doc.name.toLowerCase().includes(query) ||
            doc.specialty.toLowerCase().includes(query) ||
            doc.disease.some(d =>
                d.toLowerCase().includes(query)
            );

        const matchesGender =
        gender === "all" ||
        doc.gender === gender;

        const matchesExperience =
            experience === "all" ||
            doc.experience >= Number(experience);

        const matchesFee =
            fee === "all" ||
            doc.fee <= Number(fee);

        const matchesRating =
            rating === "all" ||
            doc.rating >= Number(rating);

        const matchesMode =
            mode === "all" ||
            doc.mode === mode;

        return (
            matchesQuery &&
            matchesExperience &&
            matchesFee &&
            matchesRating &&
            matchesMode
        );

    });

    renderDoctors(filteredDoctors);

    triggerNotificationSynapse(
        `${filteredDoctors.length} doctors found`
    );
}

function renderDoctors(doctors) {

    const container = document.getElementById("doctor-results-grid");

    container.innerHTML = "";

    if (doctors.length === 0) {
        container.innerHTML = `
            <div class="no-doctor-found">
                <h3>No Doctors Found</h3>
                <p>Try changing your filters.</p>
            </div>
        `;
        return;
    }

    doctors.forEach(doc => {

        container.innerHTML += `

        <div class="doctor-card-horizontal">

            <!-- LEFT SIDE -->
            <div class="doctor-left">
                <img
                    src="${doc.image}"
                    alt="${doc.name}"
                    class="doctor-profile-image"
                >
            </div>

            <!-- CENTER -->
            <div class="doctor-center">

                <h3>${doc.name}</h3>

                <div class="doctor-speciality">
                    ${doc.specialty}
                </div>

                <div class="doctor-experience">
                    🩺 ${doc.experience}+ Years Experience
                </div>

                <div class="doctor-hospital">
                    🏥 ${doc.hospital}
                </div>

                <div class="doctor-address">
                    📍 ${doc.address}
                </div>

                <div class="doctor-rating">
                    ⭐ ${doc.rating} Rating
                </div>

                <div class="doctor-availability">
                    ${doc.availability}
                </div>

            </div>

            <!-- RIGHT -->
            <div class="doctor-right">

                <div class="consult-fee">
                    ₹${doc.fee}
                </div>

                <div class="fee-label">
                    Consultation Fee
                </div>

                <button
                    class="book-btn"
                    onclick="initializeConsultationBooking('${doc.name}', ${doc.fee}, 'Clinic Appointment')"
                >
                    Book Appointment
                </button>

                <button
                    class="video-btn"
                    onclick="initializeConsultationBooking('${doc.name}', ${doc.fee}, 'Video Consultation')"
                >
                    Video Consultation
                </button>

            </div>

        </div>

        `;
    });
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






function executeAdvancedFilterSearch(){

    const disease =
        document.getElementById("medical-query")
        .value
        .toLowerCase();

    const exp =
        document.getElementById("filter-experience")
        .value;

    const fee =
        document.getElementById("filter-fees")
        .value;

    const rating =
        document.getElementById("filter-rating")
        .value;

    const mode =
        document.getElementById("filter-mode")
        .value;

    let results = doctorsDatabase.filter(doc=>{

        let matchDisease =
            disease === ""
            || doc.disease.some(d =>
                d.includes(disease));

        let matchExp =
            exp === "all"
            || doc.experience >= parseInt(exp);

        let matchFee =
            fee === "all"
            || doc.fee <= parseInt(fee);

        let matchRating =
            rating === "all"
            || doc.rating >= parseFloat(rating);

        let matchMode =
            mode === "all"
            || doc.mode === mode;

        return (
            matchDisease &&
            matchExp &&
            matchFee &&
            matchRating &&
            matchMode
        );
    });

    renderDoctors(results);
}

function renderDoctors(doctors){

    const container =
    document.getElementById(
        "doctor-results-grid"
    );

    container.innerHTML = "";

    if(doctors.length===0){

        container.innerHTML = `
        <h3>No Doctors Found</h3>
        `;

        return;
    }

    doctors.forEach(doc=>{

        container.innerHTML += `

        <div class="doctor-card-horizontal">

            <div class="doctor-left">

                <img
                    src="${doc.image}"
                    alt="${doc.name}"
                    class="doctor-profile-image"
                >

            </div>

            <div class="doctor-center">

                <h3>${doc.name}</h3>

                <div class="doctor-speciality">
                    ${doc.specialty}
                </div>

                <div class="doctor-experience">
                    ${doc.experience}+ Years Experience
                </div>

                <div class="doctor-hospital">
                    🏥 ${doc.hospital}
                </div>

                <div class="doctor-address">
                    📍 ${doc.address}
                </div>

                <div class="doctor-rating">
                    ⭐ ${doc.rating}
                </div>

                <div class="doctor-availability">
                    ${doc.availability}
                </div>

            </div>

            <div class="doctor-right">

                <div class="consult-fee">
                    ₹${doc.fee}
                </div>

                <div class="fee-label">
                    Consultation Fee
                </div>

                <button class="book-btn">
                    Book Appointment
                </button>

                <button class="video-btn">
                    Video Consult
                </button>

            </div>

        </div>

        `;
    });
}

