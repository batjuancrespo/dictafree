// app.js
// Punto de entrada principal de la aplicación.
// Coordina la inicialización de todos los módulos y asigna los listeners de eventos.

import { AppState } from './state.js';
// Importamos la FUNCIÓN de inicialización y el OBJETO que se llenará
import { DOMElements, initializeDOMElements } from './domElements.js';
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

    if (DOMElements.appContainer) DOMElements.appContainer.style.display = 'none';
    if (DOMElements.juanizadorContainer) DOMElements.juanizadorContainer.style.display = 'flex';

    initializeJuanizador(textToAnalyze);
}

window.switchToDictationView = function() {
    if (DOMElements.juanizadorContainer) DOMElements.juanizadorContainer.style.display = 'none';
    if (DOMElements.appContainer) DOMElements.appContainer.style.display = 'flex';
};

/**
 * Asigna los listeners de eventos a los elementos de la aplicación de dictado.
 */
export function initializeDictationApp() {
    console.log("DEBUG: Inicializando la lógica de la app de dictado.");
    
    // Se usa un 'flag' para asegurar que los listeners solo se asignen una vez.
    if (!DOMElements.startRecordBtn || DOMElements.startRecordBtn.dataset.listenerAttached) return;

    DOMElements.startRecordBtn.addEventListener('click', () => {
        if (AppState.isProcessingClick) return;
        AppState.isProcessingClick = true;
        toggleRecordingState();
        setTimeout(() => { AppState.isProcessingClick = false; }, CLICK_DEBOUNCE_MS);
    });
    
    DOMElements.pauseResumeBtn.addEventListener('click', handlePauseResume);
    
    DOMElements.retryProcessBtn.addEventListener('click', () => {
        if (AppState.currentAudioBlob) {
            processAudioBlobAndInsertText(AppState.currentAudioBlob);
        }
    });
    
    DOMElements.copyPolishedTextBtn.addEventListener('click', () => copyFullReportToClipboard(true));
    
    DOMElements.resetReportBtn.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres borrar TODO el informe y la técnica?')) {
            DOMElements.headerArea.value = '';
            DOMElements.polishedTextarea.value = '';
            updateCopyButtonState();
        }
    });

    DOMElements.juanizarBtn.addEventListener('click', switchToJuanizadorView);
    
    DOMElements.correctTextSelectionBtn.addEventListener('click', handleCorrectTextSelection);
    
    DOMElements.manageVocabButton.addEventListener('click', openVocabManager);
    DOMElements.manageVocabButton.disabled = false;
    
    DOMElements.techniqueButtonsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.techniqueText) {
            DOMElements.headerArea.value = e.target.dataset.techniqueText;
            updateCopyButtonState();
        }
    });
    
    DOMElements.clearHeaderButton.addEventListener('click', () => {
        DOMElements.headerArea.value = "";
        updateCopyButtonState();
    });
    
    DOMElements.headerArea.addEventListener('input', updateCopyButtonState);
    DOMElements.polishedTextarea.addEventListener('input', updateCopyButtonState);

    document.addEventListener('keydown', (event) => {
        if (document.body.classList.contains('logged-in') && DOMElements.appContainer.style.display !== 'none') {
            if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.key === 'Shift') {
                event.preventDefault();
                DOMElements.startRecordBtn.click();
            }
            if (event.shiftKey && event.altKey && event.key.toUpperCase() === 'P') {
                event.preventDefault();
                DOMElements.pauseResumeBtn.click();
            }
        }
    });

    DOMElements.startRecordBtn.dataset.listenerAttached = 'true';

    updateButtonStates('initial');
    updateCopyButtonState();
}

/**
 * Punto de entrada principal que se ejecuta cuando el DOM está listo.
 */
function main() {
    // ¡PASO CRÍTICO Y FUNDAMENTAL!
    // Se llama a la función para poblar el objeto DOMElements.
    // A partir de este punto, todos los módulos pueden usar DOMElements de forma segura.
    initializeDOMElements();

    console.log("DEBUG: DOM listo. Aplicación principal iniciándose.");
    
    const { themeSwitch } = DOMElements;
    const preferredTheme = localStorage.getItem('theme') || 'dark';
    
    applyTheme(preferredTheme);
    setAccentRGB();
    
    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            applyTheme(themeSwitch.checked ? 'dark' : 'light');
        });
    } else {
        console.warn("Advertencia: El interruptor de tema (themeSwitch) no fue encontrado.");
    }
    
    new MutationObserver(setAccentRGB).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    setupVocabModalListeners();
    initializeAuth();
}

// Iniciar la aplicación cuando el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', main);
