// domElements.js
// Define los selectores y exporta una función para inicializar las referencias del DOM de forma segura.

const elementSelectors = {
    // Contenedores Principales
    authContainer: 'auth-container',
    appContainer: 'app-container',
    juanizadorContainer: 'juanizador-container',
    
    // Autenticación
    loginForm: 'login-form', signupForm: 'signup-form', loginEmailInput: 'login-email',
    loginPasswordInput: 'login-password', signupEmailInput: 'signup-email', signupPasswordInput: 'signup-password',
    loginButton: 'loginButton', signupButton: 'signupButton', showSignupLink: 'showSignupLink',
    showLoginLink: 'showLoginLink', loginErrorDiv: 'login-error', signupErrorDiv: 'signup-error',
    userDisplaySpan: 'userDisplay', logoutButton: 'logoutButton',
    
    // Vista de Dictado
    startRecordBtn: 'startRecordBtn', pauseResumeBtn: 'pauseResumeBtn', retryProcessBtn: 'retryProcessBtn',
    copyPolishedTextBtn: 'copyPolishedTextBtn', correctTextSelectionBtn: 'correctTextSelectionBtn',
    resetReportBtn: 'resetReportBtn', juanizarBtn: 'juanizarBtn', manageVocabButton: 'manageVocabButton',
    statusDiv: 'status', polishedTextarea: 'polishedText', headerArea: 'headerArea',
    recordingTimeDisplay: 'recordingTimeDisplay', themeImageLight: 'themeImageLight',
    themeImageDark: 'themeImageDark', audioPlayback: 'audioPlayback',
    audioPlaybackSection: '.audio-playback-section', // Es una clase
    volumeMeterBar: 'volumeMeterBar', volumeMeterContainer: 'volumeMeterContainer',
    themeSwitch: 'themeSwitch', techniqueButtonsContainer: 'techniqueButtons',
    clearHeaderButton: 'clearHeaderButton',

    // Vista del Juanizador
    juanizadorBackToDictationBtn: 'backToDictationBtn', juanizadorTranscriptArea: 'transcript',
    juanizadorCategorizeBtn: 'categorize-btn', juanizadorClearBtn: 'clear-btn',
    juanizadorGenerateReportBtn: 'generate-report-btn', juanizadorCopyReportBtn: 'copy-report-btn',
    juanizadorCategorizedContent: 'categorized-content', juanizadorFinalReport: 'final-report',
    juanizadorImagingTechnique: 'imaging-technique', juanizadorTacScope: 'tac-scope',
    juanizadorRmType: 'rm-type', juanizadorContrastUse: 'contrast-use',
    juanizadorTacScopeContainer: 'tac-scope-container', juanizadorRmTypeContainer: 'rm-type-container',
    juanizadorContrastContainer: 'contrast-container', juanizadorPhaseContainer: 'phase-container',
    juanizadorCategorizingLoading: 'categorizing-loading', juanizadorReportLoading: 'report-loading',

    // Modal de Vocabulario
    vocabManagerModal: 'vocabManagerModal', vocabManagerList: 'vocabManagerList',
    modalCloseButtonVocab: 'modalCloseButtonVocab', modalAddNewRuleButtonVocab: 'modalAddNewRuleButtonVocab',

    // Elementos para la transición Batman
    batmanTransitionOverlay: 'batman-transition-overlay',
    batmanTransitionAudio: 'batman-transition-audio'
};

// Exportamos un objeto vacío que será poblado más tarde.
export let DOMElements = {};

/**
 * Esta función es llamada DESPUÉS de que el DOM esté completamente cargado.
 */
export function initializeDOMElements() {
    console.log("DEBUG: Inicializando referencias del DOM...");
    for (const key in elementSelectors) {
        const selector = elementSelectors[key];
        const element = selector.startsWith('.')
            ? document.querySelector(selector)
            : document.getElementById(selector);
        
        if (!element) {
            console.warn(`Advertencia: El elemento para la clave "${key}" con el selector "${selector}" no se encontró en el DOM.`);
        }
        
        DOMElements[key] = element;
    }
    console.log("DEBUG: Referencias del DOM inicializadas.");
}
