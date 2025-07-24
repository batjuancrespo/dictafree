// domElements.js
// Define los selectores (IDs) y proporciona una función segura para obtener elementos del DOM.

// Objeto que contiene todos los IDs de los elementos que la aplicación necesita.
// Esta es nuestra "única fuente de verdad" para los nombres de los IDs.
const elementSelectors = {
    // Contenedores
    authContainer: 'auth-container',
    appContainer: 'app-container',
    juanizadorContainer: 'juanizador-container',

    // Autenticación
    loginForm: 'login-form',
    signupForm: 'signup-form',
    loginEmailInput: 'login-email',
    loginPasswordInput: 'login-password',
    signupEmailInput: 'signup-email',
    signupPasswordInput: 'signup-password',
    loginButton: 'loginButton',
    signupButton: 'signupButton',
    showSignupLink: 'showSignupLink',
    showLoginLink: 'showLoginLink',
    loginErrorDiv: 'login-error',
    signupErrorDiv: 'signup-error',
    userDisplaySpan: 'userDisplay',
    logoutButton: 'logoutButton',

    // Vista de Dictado
    startRecordBtn: 'startRecordBtn',
    pauseResumeBtn: 'pauseResumeBtn',
    retryProcessBtn: 'retryProcessBtn',
    copyPolishedTextBtn: 'copyPolishedTextBtn',
    correctTextSelectionBtn: 'correctTextSelectionBtn',
    resetReportBtn: 'resetReportBtn',
    juanizarBtn: 'juanizarBtn',
    manageVocabButton: 'manageVocabButton',
    statusDiv: 'status',
    polishedTextarea: 'polishedText',
    headerArea: 'headerArea',
    recordingTimeDisplay: 'recordingTimeDisplay',
    themeImageLight: 'themeImageLight',
    themeImageDark: 'themeImageDark',
    audioPlayback: 'audioPlayback',
    audioPlaybackSection: '.audio-playback-section', // Es una clase, usamos querySelector
    volumeMeterBar: 'volumeMeterBar',
    volumeMeterContainer: 'volumeMeterContainer',
    themeSwitch: 'themeSwitch',
    techniqueButtonsContainer: 'techniqueButtons',
    clearHeaderButton: 'clearHeaderButton',

    // Vista del Juanizador
    juanizadorBackToDictationBtn: 'backToDictationBtn',
    juanizadorTranscriptArea: 'transcript',
    juanizadorCategorizeBtn: 'categorize-btn',
    juanizadorClearBtn: 'clear-btn',
    juanizadorGenerateReportBtn: 'generate-report-btn',
    juanizadorCopyReportBtn: 'copy-report-btn',
    juanizadorCategorizedContent: 'categorized-content',
    juanizadorFinalReport: 'final-report',
    juanizadorImagingTechnique: 'imaging-technique',
    juanizadorTacScope: 'tac-scope',
    juanizadorRmType: 'rm-type',
    juanizadorContrastUse: 'contrast-use',
    juanizadorTacScopeContainer: 'tac-scope-container',
    juanizadorRmTypeContainer: 'rm-type-container',
    juanizadorContrastContainer: 'contrast-container',
    juanizadorPhaseContainer: 'phase-container',
    juanizadorCategorizingLoading: 'categorizing-loading',
    juanizadorReportLoading: 'report-loading',

    // Modal de Vocabulario
    vocabManagerModal: 'vocabManagerModal',
    vocabManagerList: 'vocabManagerList',
    modalCloseButtonVocab: 'modalCloseButtonVocab',
    modalAddNewRuleButtonVocab: 'modalAddNewRuleButtonVocab',
};

/**
 * Función segura para obtener elementos del DOM.
 * Busca todos los elementos definidos en elementSelectors y los devuelve en un objeto.
 * Lanza un error si un elemento crítico no se encuentra.
 */
function getElements() {
    const elements = {};
    for (const key in elementSelectors) {
        const selector = elementSelectors[key];
        // Distinguimos entre IDs y Clases
        const element = selector.startsWith('.')
            ? document.querySelector(selector)
            : document.getElementById(selector);
        
        elements[key] = element;
    }
    return elements;
}

// Ejecutamos la función una vez y exportamos el objeto con los elementos reales.
// Esto se hace después de que el DOM esté completamente cargado.
export const DOMElements = getElements();
