// domElements.js
// Selecciona todos los elementos del DOM una sola vez al cargar.
// Esta es la ÚNICA fuente de verdad para las referencias al DOM.

export const DOMElements = {
    // --- Contenedores Principales ---
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    juanizadorContainer: document.getElementById('juanizador-container'),
    
    // --- Autenticación ---
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginEmailInput: document.getElementById('login-email'),
    loginPasswordInput: document.getElementById('login-password'),
    signupEmailInput: document.getElementById('signup-email'),
    signupPasswordInput: document.getElementById('signup-password'),
    loginButton: document.getElementById('loginButton'),
    signupButton: document.getElementById('signupButton'),
    showSignupLink: document.getElementById('showSignupLink'),
    showLoginLink: document.getElementById('showLoginLink'),
    loginErrorDiv: document.getElementById('login-error'),
    signupErrorDiv: document.getElementById('signup-error'),
    userDisplaySpan: document.getElementById('userDisplay'),
    logoutButton: document.getElementById('logoutButton'),
    
    // --- VISTA DE DICTADO ---
    startRecordBtn: document.getElementById('startRecordBtn'),
    pauseResumeBtn: document.getElementById('pauseResumeBtn'),
    retryProcessBtn: document.getElementById('retryProcessBtn'),
    copyPolishedTextBtn: document.getElementById('copyPolishedTextBtn'),
    correctTextSelectionBtn: document.getElementById('correctTextSelectionBtn'),
    resetReportBtn: document.getElementById('resetReportBtn'),
    juanizarBtn: document.getElementById('juanizarBtn'),
    manageVocabButton: document.getElementById('manageVocabButton'),
    statusDiv: document.getElementById('status'),
    polishedTextarea: document.getElementById('polishedText'),
    headerArea: document.getElementById('headerArea'),
    recordingTimeDisplay: document.getElementById('recordingTimeDisplay'),
    themeImageLight: document.getElementById('themeImageLight'),
    themeImageDark: document.getElementById('themeImageDark'),
    audioPlayback: document.getElementById('audioPlayback'),
    audioPlaybackSection: document.querySelector('.audio-playback-section'),
    volumeMeterBar: document.getElementById('volumeMeterBar'),
    volumeMeterContainer: document.getElementById('volumeMeterContainer'),
    themeSwitch: document.getElementById('themeSwitch'),
    techniqueButtonsContainer: document.getElementById('techniqueButtons'),
    clearHeaderButton: document.getElementById('clearHeaderButton'),

    // --- VISTA DEL JUANIZADOR (TODOS LOS ELEMENTOS CENTRALIZADOS AQUÍ) ---
    juanizadorBackToDictationBtn: document.getElementById('backToDictationBtn'),
    juanizadorTranscriptArea: document.getElementById('transcript'),
    juanizadorCategorizeBtn: document.getElementById('categorize-btn'),
    juanizadorClearBtn: document.getElementById('clear-btn'),
    juanizadorGenerateReportBtn: document.getElementById('generate-report-btn'),
    juanizadorCopyReportBtn: document.getElementById('copy-report-btn'),
    juanizadorCategorizedContent: document.getElementById('categorized-content'),
    juanizadorFinalReport: document.getElementById('final-report'),
    juanizadorImagingTechnique: document.getElementById('imaging-technique'),
    juanizadorTacScope: document.getElementById('tac-scope'),
    juanizadorRmType: document.getElementById('rm-type'),
    juanizadorContrastUse: document.getElementById('contrast-use'),
    juanizadorTacScopeContainer: document.getElementById('tac-scope-container'),
    juanizadorRmTypeContainer: document.getElementById('rm-type-container'),
    juanizadorContrastContainer: document.getElementById('contrast-container'),
    juanizadorPhaseContainer: document.getElementById('phase-container'),
    juanizadorCategorizingLoading: document.getElementById('categorizing-loading'),
    juanizadorReportLoading: document.getElementById('report-loading'),

    // --- Modal de Vocabulario ---
    vocabManagerModal: document.getElementById('vocabManagerModal'),
    vocabManagerList: document.getElementById('vocabManagerList'),
    modalCloseButtonVocab: document.getElementById('modalCloseButtonVocab'),
    modalAddNewRuleButtonVocab: document.getElementById('modalAddNewRuleButtonVocab'),
};
