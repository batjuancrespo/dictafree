// app.js
// Punto de entrada principal de la aplicación.
// Coordina la inicialización de todos los módulos y asigna los listeners de eventos.

import { AppState } from './state.js';
import { DOMElements } from './domElements.js';
import { initializeAuth } from './auth.js';
import { toggleRecordingState, handlePauseResume, processAudioBlobAndInsertText } from './recorder.js';
import { 
    applyTheme, setAccentRGB, updateButtonStates, updateCopyButtonState, 
    copyFullReportToClipboard, openVocabManager, handleCorrectTextSelection, setupVocabModalListeners
} from './ui.js';
import { initializeJuanizador } from './juanizador.js';

const CLICK_DEBOUNCE_MS = 300;

// --- GESTIÓN DE VISTAS ---

function switchToJuanizadorView() {
    const textToAnalyze = DOMElements.polishedTextarea.value.trim();
    if (!textToAnalyze) {
        alert('No hay texto en el informe para analizar.');
        return;
    }

    DOMElements.appContainer.style.display = 'none';
    DOMElements.juanizadorContainer.style.display = 'flex';

    initializeJuanizador(textToAnalyze);
}

// Se asigna a 'window' para que el módulo del juanizador pueda llamarla globalmente.
window.switchToDictationView = function() {
    DOMElements.juanizadorContainer.style.display = 'none';
    DOMElements.appContainer.style.display = 'flex';
};

/**
 * Asigna los listeners de eventos a los elementos de la aplicación de dictado.
 * Esta función es exportada para ser llamada desde el módulo de autenticación.
 */
export function initializeDictationApp() {
    console.log("DEBUG: Inicializando la lógica de la app de dictado.");
    
    const { 
        startRecordBtn, pauseResumeBtn, retryProcessBtn, copyPolishedTextBtn,
        resetReportBtn, juanizarBtn, correctTextSelectionBtn, manageVocabButton,
        headerArea, polishedTextarea, techniqueButtonsContainer, clearHeaderButton
    } = DOMElements;

    // Se usa un 'flag' para asegurar que los listeners solo se asignen una vez.
    if (startRecordBtn.dataset.listenerAttached) return;

    startRecordBtn.addEventListener('click', () => {
        if (AppState.isProcessingClick) return;
        AppState.isProcessingClick = true;
        toggleRecordingState();
        setTimeout(() => { AppState.isProcessingClick = false; }, CLICK_DEBOUNCE_MS);
    });

    pauseResumeBtn.addEventListener('click', handlePauseResume);
    
    retryProcessBtn.addEventListener('click', () => {
        if (AppState.currentAudioBlob) {
            processAudioBlobAndInsertText(AppState.currentAudioBlob);
        }
    });

    copyPolishedTextBtn.addEventListener('click', () => copyFullReportToClipboard(true));
    resetReportBtn.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres borrar TODO el informe y la técnica?')) {
            headerArea.value = '';
            polishedTextarea.value = '';
            updateCopyButtonState();
        }
    });

    juanizarBtn.addEventListener('click', switchToJuanizadorView);
    correctTextSelectionBtn.addEventListener('click', handleCorrectTextSelection);
    manageVocabButton.addEventListener('click', openVocabManager);
    manageVocabButton.disabled = false;

    techniqueButtonsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.techniqueText) {
            headerArea.value = e.target.dataset.techniqueText;
            updateCopyButtonState();
        }
    });
    clearHeaderButton.addEventListener('click', () => {
        headerArea.value = "";
        updateCopyButtonState();
    });
    
    headerArea.addEventListener('input', updateCopyButtonState);
    polishedTextarea.addEventListener('input', updateCopyButtonState);

    document.addEventListener('keydown', (event) => {
        // Solo ejecutar atajos si el usuario está logueado y la vista de dictado está activa
        if (document.body.classList.contains('logged-in') && DOMElements.appContainer.style.display !== 'none') {
            if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.key === 'Shift') {
                event.preventDefault();
                startRecordBtn.click();
            }
            if (event.shiftKey && event.altKey && event.key.toUpperCase() === 'P') {
                event.preventDefault();
                pauseResumeBtn.click();
            }
        }
    });

    // Marcar como inicializado para no volver a asignar listeners
    startRecordBtn.dataset.listenerAttached = 'true';

    updateButtonStates('initial');
    updateCopyButtonState();
}

/**
 * Punto de entrada principal que se ejecuta cuando el DOM está listo.
 */
function main() {
    console.log("DEBUG: DOM listo. Aplicación principal iniciándose.");

    const { themeSwitch } = DOMElements;
    const preferredTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(preferredTheme);
    setAccentRGB();
    
    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => applyTheme(themeSwitch.checked ? 'dark' : 'light'));
    }
    
    new MutationObserver(setAccentRGB).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    setupVocabModalListeners();

    // Llamamos a initializeAuth directamente para asegurar que el listener onAuthStateChanged
    // se configure inmediatamente, evitando condiciones de carrera.
    initializeAuth();
}

// Iniciar la aplicación cuando el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', main);
