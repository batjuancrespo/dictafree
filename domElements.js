// domElements.js
// Define los selectores y exporta una función para inicializar las referencias del DOM de forma segura.

// Objeto que contiene todos los IDs y selectores de los elementos que la aplicación necesita.
// Esta es nuestra "única fuente de verdad" para los nombres de los selectores.
const elementSelectors = {
    // Contenedores Principales
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

// Exportamos un objeto vacío que será poblado más tarde por la función de inicialización.
export let DOMElements = {};

/**
 * Esta función es llamada DESPUÉS de que el DOM esté completamente cargado.
 * Selecciona todos los elementos y los añade al objeto DOMElements exportado.
 * Es el núcleo de la solución para evitar errores de elementos 'null'.
 */
export function initializeDOMElements() {
    console.log("DEBUG: Inicializando referencias del DOM...");
    for (const key in elementSelectors) {
        const selector = elementSelectors[key];
        // Distinguimos entre IDs (por defecto) y Clases (si empiezan con '.')
        const element = selector.startsWith('.')
            ? document.querySelector(selector)
            : document.getElementById(selector);
        
        // Verificación crítica para la depuración
        if (!element) {
            console.warn(`Advertencia de Inicialización: El elemento para la clave "${key}" con el selector "${selector}" no se encontró en el DOM.`);
        }
        
        DOMElements[key] = element;
    }
    console.log("DEBUG: Referencias del DOM inicializadas y pobladas en el objeto DOMElements.");
}
