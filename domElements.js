// domElements.js
// Selecciona todos los elementos del DOM una sola vez al cargar
// para mejorar el rendimiento y centralizar las referencias.

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
    
    // --- Botones de Control de Dictado ---
    startRecordBtn: document.getElementById('startRecordBtn'),
    pauseResumeBtn: document.getElementById('pauseResumeBtn'),
    retryProcessBtn: document.getElementById('retryProcessBtn'),
    copyPolishedTextBtn: document.getElementById('copyPolishedTextBtn'),
    correctTextSelectionBtn: document.getElementById('correctTextSelectionBtn'),
    resetReportBtn: document.getElementById('resetReportBtn'),
    juanizarBtn: document.getElementById('juanizarBtn'),
    manageVocabButton: document.getElementById('manageVocabButton'),
    
    // --- Elementos de UI de Dictado ---
    statusDiv: document.getElementById('status'),
    polishedTextarea: document.getElementById('polishedText'),
    headerArea: document.getElementById('headerArea'),
    recordingTimeDisplay: document.getElementById('recordingTimeDisplay'),
    mainTitleImage: document.getElementById('mainTitleImage'),
    mainTitleImageDark: document.getElementById('mainTitleImageDark'),

    // --- Audio y Volumen ---
    audioPlayback: document.getElementById('audioPlayback'),
    audioPlaybackSection: document.querySelector('.audio-playback-section'),
    volumeMeterBar: document.getElementById('volumeMeterBar'),
    volumeMeterContainer: document.getElementById('volumeMeterContainer'),

    // --- Ajustes y Técnicas ---
    themeSwitch: document.getElementById('themeSwitch'),
    techniqueButtonsContainer: document.getElementById('techniqueButtons'),
    clearHeaderButton: document.getElementById('clearHeaderButton'),

    // --- Modal de Vocabulario ---
    vocabManagerModal: document.getElementById('vocabManagerModal'),
    vocabManagerList: document.getElementById('vocabManagerList'),
    modalCloseButtonVocab: document.getElementById('modalCloseButtonVocab'),
    modalAddNewRuleButtonVocab: document.getElementById('modalAddNewRuleButtonVocab'),
};
