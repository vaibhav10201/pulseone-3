/**
 * PulseOne - Core Platform Operations Script
 */

// Global State Repository
const APP_STATE = {
    currentView: 'home',
    activeModalContext: null
};

/**
 * Single Page Navigation Router Engine
 * @param {string} targetViewID - The target structural state to active view frame
 */
function navigateTo(targetViewID) {
    const validViews = ['home', 'about', 'solutions', 'medical', 'royalty'];
    if (!validViews.includes(targetViewID)) return;

    // Suppress active view frames
    document.querySelectorAll('.page-view').forEach(element => {
        element.classList.remove('dynamic-active');
    });

    // Resolve target mapping element
    const targetedDomNode = document.getElementById(`view-${targetViewID}`);
    if (targetedDomNode) {
        targetedDomNode.classList.add('dynamic-active');
        APP_STATE.currentView = targetViewID;
        
        // Push view state to window global memory
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Opens the Central Interactive Modal Platform Overlay
 * @param {string} interfaceContextTitle - Configuration title descriptive context
 */
function openModal(interfaceContextTitle) {
    const modalOverlayNode = document.getElementById('interactive-modal');
    const titleNode = document.getElementById('modal-workspace-title');
    
    if (modalOverlayNode && titleNode) {
        titleNode.innerText = interfaceContextTitle;
        modalOverlayNode.classList.add('modal-visible');
        APP_STATE.activeModalContext = interfaceContextTitle;
    }
}

/**
 * Closes the Central Interactive Modal Platform Overlay
 */
function closeModal() {
    const modalOverlayNode = document.getElementById('interactive-modal');
    if (modalOverlayNode) {
        modalOverlayNode.classList.remove('modal-visible');
        document.getElementById('workspace-form').reset();
        APP_STATE.activeModalContext = null;
    }
}

/**
 * Form Submit Interceptor Protocol
 * @param {Event} formEventInstance - Form processing context parameters
 */
function handleFormSubmission(formEventInstance) {
    formEventInstance.preventDefault();
    
    // Simulate pipeline compilation
    alert(`Transmission Received Successfully!\nContext Platform: ${APP_STATE.activeModalContext}\nStatus: Processed Cleanly.`);
    closeModal();
}

// Global Document Initialization Listener Hooks
document.addEventListener('DOMContentLoaded', () => {
    // Synchronize initial browser hash routing variables if present
    const browserHashValue = window.location.hash.replace('#', '');
    const routingMap = {
        'about': 'about',
        'solutions': 'solutions',
        'medical-access': 'medical',
        'royalty': 'royalty'
    };
    
    if (routingMap[browserHashValue]) {
        navigateTo(routingMap[browserHashValue]);
    }
});