// ui.js
// Contiene todas las funciones que interactúan directamente con el DOM.

import { AppState } from './state.js';
import { DOMElements } from './domElements.js';
import { saveUserVocabularyToFirestore } from './api.js';

/**
 * ¡NUEVA FUNCIÓN REUTILIZABLE! Activa la animación de Batman.
 */
export function triggerBatmanTransition() {
    const { batmanTransitionOverlay, batmanTransitionAudio, batmanTransitionGif } = DOMElements;

    if (batmanTransitionOverlay && batmanTransitionAudio && batmanTransitionGif) {
        // Muestra el overlay y el GIF
        batmanTransitionOverlay.classList.add('active');
        batmanTransitionGif.style.display = 'block';
        
        // Reinicia el GIF forzando la recarga
        batmanTransitionGif.src = `batman-transition.gif?t=${new Date().getTime()}`;

        // Reproduce el sonido
        batmanTransitionAudio.currentTime = 0;
        batmanTransitionAudio.play().catch(e => console.error("Error al reproducir audio:", e));
        
        // Oculta todo después de un tiempo
        setTimeout(() => {
            batmanTransitionOverlay.classList.remove('active');
            batmanTransitionGif.style.display = 'none';
        }, 1400); // 1.4 segundos
    }
}

export function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (DOMElements.themeSwitch) {
        DOMElements.themeSwitch.checked = theme === 'dark';
    }
    
    if (DOMElements.themeImageLight && DOMElements.themeImageDark) {
        if (theme === 'dark') {
            DOMElements.themeImageDark.style.display = 'block';
            DOMElements.themeImageLight.style.display = 'none';
        } else {
            DOMElements.themeImageDark.style.display = 'none';
            DOMElements.themeImageLight.style.display = 'block';
        }
    }
}

export function setStatus(message, type = "idle", duration = 0) {
    if (!DOMElements.statusDiv) return;
    DOMElements.statusDiv.textContent = message;
    DOMElements.statusDiv.className = `status-${type}`;
    if (duration > 0) {
        setTimeout(() => {
            if (DOMElements.statusDiv.textContent === message) {
                updateButtonStates("initial");
            }
        }, duration);
    }
}

export function updateButtonStates(state) {
    const { startRecordBtn, pauseResumeBtn, retryProcessBtn, copyPolishedTextBtn, correctTextSelectionBtn, audioPlaybackSection, polishedTextarea } = DOMElements;

    startRecordBtn.disabled = true;
    pauseResumeBtn.disabled = true;
    retryProcessBtn.disabled = true;
    copyPolishedTextBtn.disabled = false;
    correctTextSelectionBtn.disabled = true;
    startRecordBtn.textContent = "Empezar Dictado";
    startRecordBtn.classList.remove("stop-style");
    pauseResumeBtn.textContent = "Pausar";

    let showPlayer = AppState.currentAudioBlob && !['recording', 'paused', 'processing_audio'].includes(state);
    if (audioPlaybackSection) {
        audioPlaybackSection.style.display = showPlayer ? 'block' : 'none';
    }

    switch (state) {
        case "initial":
            startRecordBtn.disabled = false;
            retryProcessBtn.disabled = !AppState.currentAudioBlob;
            correctTextSelectionBtn.disabled = polishedTextarea.value.trim() === "";
            setStatus("Listo", "idle");
            break;
        case "recording":
            startRecordBtn.disabled = false;
            startRecordBtn.textContent = AppState.isDictatingForReplacement ? "Detener Reemplazo" : "Detener Dictado";
            startRecordBtn.classList.add("stop-style");
            pauseResumeBtn.disabled = false;
            break;
        case "paused":
            startRecordBtn.disabled = false;
            startRecordBtn.textContent = AppState.isDictatingForReplacement ? "Detener Reemplazo" : "Detener Dictado";
            startRecordBtn.classList.add("stop-style");
            pauseResumeBtn.disabled = false;
            pauseResumeBtn.textContent = "Reanudar";
            correctTextSelectionBtn.disabled = polishedTextarea.value.trim() === "";
            break;
        case "processing_audio": break;
        case "error_processing":
        case "success_processing":
            startRecordBtn.disabled = false;
            retryProcessBtn.disabled = !AppState.currentAudioBlob;
            correctTextSelectionBtn.disabled = polishedTextarea.value.trim() === "";
            break;
    }
}

export function updateCopyButtonState() {
    if (!DOMElements.copyPolishedTextBtn) return;
    const currentText = getCombinedText();
    const isSynced = (currentText === AppState.lastCopiedText);

    if (isSynced && currentText !== "") {
        DOMElements.copyPolishedTextBtn.classList.add('synced');
        DOMElements.copyPolishedTextBtn.textContent = '✓ Copiado';
        DOMElements.copyPolishedTextBtn.title = 'El contenido ya está en el portapapeles.';
    } else {
        DOMElements.copyPolishedTextBtn.classList.remove('synced');
        DOMElements.copyPolishedTextBtn.textContent = 'Copiar Todo';
        DOMElements.copyPolishedTextBtn.title = 'Copiar texto completo';
    }
}

export function getCombinedText() {
    const { headerArea, polishedTextarea } = DOMElements;
    if (!headerArea || !polishedTextarea) return "";
    
    const tecnicaTexto = headerArea.value.trim();
    const informeTexto = polishedTextarea.value.trim();
    
    // Creamos un array para almacenar las partes del texto que no estén vacías.
    const partes = [];
    if (tecnicaTexto) {
        partes.push(tecnicaTexto);
    }
    if (informeTexto) {
        partes.push(informeTexto);
    }
    
    // Unimos las partes con un doble salto de línea.
    // Si solo hay una parte, devolverá esa parte sin saltos de línea extra.
    return partes.join('\n\n');
}

export async function copyFullReportToClipboard(showStatus = true) {
    const textToCopy = getCombinedText();
    if (!textToCopy && showStatus) {
        setStatus("Nada que copiar.", "idle", 2000);
        return;
    }

    try {
        await navigator.clipboard.writeText(textToCopy);
        AppState.lastCopiedText = textToCopy;
        updateCopyButtonState();
        if (showStatus) {
            setStatus("¡Informe completo copiado!", "success", 2000);
        }
        triggerBatmanTransition();
    } catch (e) {
        console.error('Error al copiar el texto:', e);
        AppState.lastCopiedText = '';
        updateCopyButtonState();
        if (showStatus) {
            setStatus("Error al copiar el texto.", "error", 3000);
        }
    }
}

export function setAccentRGB() {
    try {
        const bodyStyles = getComputedStyle(document.body);
        const accentColor = bodyStyles.getPropertyValue('--accent-color').trim();
        if (accentColor.startsWith('#')) {
            const r = parseInt(accentColor.slice(1, 3), 16);
            const g = parseInt(accentColor.slice(3, 5), 16);
            const b = parseInt(accentColor.slice(5, 7), 16);
            document.documentElement.style.setProperty('--accent-color-rgb', `${r},${g},${b}`);
        }
    } catch (e) {
        console.warn("No se pudo establecer --accent-color-rgb:", e);
    }
}

export function openVocabManager() {
    if (!DOMElements.vocabManagerModal) return;
    populateVocabManagerList();
    DOMElements.vocabManagerModal.style.display = 'flex';
}

export function closeVocabManager() {
    if (!DOMElements.vocabManagerModal) return;
    DOMElements.vocabManagerModal.style.display = 'none';
}

function populateVocabManagerList() {
    const { vocabManagerList } = DOMElements;
    if (!vocabManagerList) return;
    
    vocabManagerList.innerHTML = '';
    const keys = Object.keys(AppState.customVocabulary).sort();

    if (keys.length === 0) {
        vocabManagerList.innerHTML = '<li>No tienes reglas personalizadas. ¡Añade una!</li>';
        return;
    }

    keys.forEach(key => {
        const value = AppState.customVocabulary[key];
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="vocab-key">${key}</span> 
            <span class="vocab-arrow">➔</span> 
            <span class="vocab-value">${value || "(borrar)"}</span> 
            <div class="vocab-actions">
                <button class="edit-vocab-btn" data-key="${key}">Editar</button>
                <button class="delete-vocab-btn" data-key="${key}">Borrar</button>
            </div>`;
        listItem.querySelector('.edit-vocab-btn').addEventListener('click', () => handleEditVocabRule(key));
        listItem.querySelector('.delete-vocab-btn').addEventListener('click', () => handleDeleteVocabRule(key));
        vocabManagerList.appendChild(listItem);
    });
}

async function handleAddNewVocabRule() {
    const errorKeyRaw = prompt("Texto incorrecto (la palabra o frase a reemplazar):");
    if (!errorKeyRaw || errorKeyRaw.trim() === "") return;
    
    const errorKey = errorKeyRaw.trim().toLowerCase();
    const correctValueRaw = prompt(`Introduce la corrección para "${errorKey}":\n(Dejar vacío para borrar la palabra)`);
    if (correctValueRaw === null) return;
    
    const correctValue = correctValueRaw.trim();
    
    if (AppState.customVocabulary[errorKey] === correctValue) {
        alert("La regla ya existe con el mismo valor.");
        return;
    }

    AppState.customVocabulary[errorKey] = correctValue;
    await saveUserVocabularyToFirestore();
    populateVocabManagerList();
    setStatus("Regla añadida/actualizada.", "success", 2000);
}

async function handleEditVocabRule(keyToEdit) {
    const currentValue = AppState.customVocabulary[keyToEdit];
    const newCorrectValueRaw = prompt(`Editar corrección para "${keyToEdit}":`, currentValue);
    
    if (newCorrectValueRaw === null) return;
    
    const newCorrectValue = newCorrectValueRaw.trim();
    AppState.customVocabulary[keyToEdit] = newCorrectValue;

    await saveUserVocabularyToFirestore();
    populateVocabManagerList();
    setStatus("Regla actualizada.", "success", 2000);
}

async function handleDeleteVocabRule(keyToDelete) {
    if (confirm(`¿Seguro que quieres borrar la regla para "${keyToDelete}"?`)) {
        delete AppState.customVocabulary[keyToDelete];
        await saveUserVocabularyToFirestore();
        populateVocabManagerList();
        setStatus("Regla borrada.", "success", 2000);
    }
}

export async function handleCorrectTextSelection() {
    const { polishedTextarea } = DOMElements;
    const start = polishedTextarea.selectionStart;
    const end = polishedTextarea.selectionEnd;
    const selectedText = polishedTextarea.value.substring(start, end).trim();

    if (!selectedText) {
        setStatus("Primero selecciona el texto a corregir.", "idle", 3000);
        return;
    }

    const correctedTextRaw = prompt(`Corregir:\n"${selectedText}"\n\nIntroduce la corrección:`, selectedText);
    
    if (correctedTextRaw === null) {
        setStatus("Corrección cancelada.", "idle", 2000);
        return;
    }
    
    const correctedText = correctedTextRaw.trim();
    const ruleKey = selectedText.toLowerCase();

    if (ruleKey !== correctedText.toLowerCase() || (AppState.customVocabulary[ruleKey] !== correctedText && correctedText !== "")) {
        AppState.customVocabulary[ruleKey] = correctedText;
        await saveUserVocabularyToFirestore();
        setStatus(`Regla guardada: "${ruleKey}" ➔ "${correctedText}"`, "success", 3000);
    }

    const textBefore = polishedTextarea.value.substring(0, start);
    const textAfter = polishedTextarea.value.substring(end);
    polishedTextarea.value = textBefore + correctedText + textAfter;
    polishedTextarea.selectionStart = polishedTextarea.selectionEnd = start + correctedText.length;
    
    updateCopyButtonState();
    polishedTextarea.focus();
}

export function setupVocabModalListeners() {
    const { modalCloseButtonVocab, modalAddNewRuleButtonVocab, vocabManagerModal } = DOMElements;
    if (modalCloseButtonVocab) modalCloseButtonVocab.addEventListener('click', closeVocabManager);
    if (modalAddNewRuleButtonVocab) modalAddNewRuleButtonVocab.addEventListener('click', handleAddNewVocabRule);
    if (vocabManagerModal) vocabManagerModal.addEventListener('click', (e) => {
        if (e.target === vocabManagerModal) closeVocabManager();
    });
}
