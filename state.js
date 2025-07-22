// state.js
// Centraliza todo el estado de la aplicación para evitar variables globales
// y facilitar el seguimiento de los cambios.

export const AppState = {
    // Estado del usuario
    currentUserId: null,
    
    // Estado de la grabación
    mediaRecorder: null,
    audioChunks: [],
    currentAudioBlob: null,
    isRecording: false,
    isPaused: false,

    // Estado del medidor de volumen
    audioContext: null,
    analyser: null,
    microphoneSource: null,
    animationFrameId: null,

    // Estado del temporizador
    recordingTimerInterval: null,
    recordingSeconds: 0,

    // Estado del vocabulario del usuario
    customVocabulary: {},
    learnedCorrections: {},
    commonMistakeNormalization: {},

    // Estado de la Interfaz de Usuario (UI)
    isProcessingClick: false, // Para evitar dobles clics
    isDictatingForReplacement: false,
    replacementSelectionStart: 0,
    replacementSelectionEnd: 0,
    insertionPoint: 0,
    lastCopiedText: '', // Para el estado del botón de copiar
};
