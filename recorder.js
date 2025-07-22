// recorder.js
// Gestiona toda la lógica de la grabación de audio, incluyendo el medidor de volumen,
// el temporizador y el procesamiento del blob de audio.

import { AppState } from './state.js';
import { DOMElements } from './domElements.js';
import { setStatus, updateButtonStates, updateCopyButtonState } from './ui.js';
import { transcribeAndPolishAudio } from './api.js';
import { blobToBase64 } from './utils.js';

// --- Temporizador de Grabación ---

function startRecordingTimer() {
    stopRecordingTimer();
    updateRecordingTimeDisplay();
    AppState.recordingTimerInterval = setInterval(() => {
        if (!AppState.isPaused) {
            AppState.recordingSeconds++;
            updateRecordingTimeDisplay();
        }
    }, 1000);
}

function stopRecordingTimer() {
    clearInterval(AppState.recordingTimerInterval);
}

function updateRecordingTimeDisplay() {
    const { recordingTimeDisplay } = DOMElements;
    const minutes = Math.floor(AppState.recordingSeconds / 60);
    const seconds = AppState.recordingSeconds % 60;
    recordingTimeDisplay.textContent = AppState.isRecording || AppState.isPaused ?
        `Tiempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : "";
}

// --- Medidor de Volumen ---

function setupVolumeMeter(stream) {
    const { volumeMeterContainer, volumeMeterBar } = DOMElements;
    volumeMeterContainer.style.display = 'block';
    
    if (!AppState.audioContext) AppState.audioContext = new(window.AudioContext || window.webkitAudioContext)();
    if (AppState.audioContext.state === 'suspended') AppState.audioContext.resume();
    
    AppState.analyser = AppState.audioContext.createAnalyser();
    AppState.microphoneSource = AppState.audioContext.createMediaStreamSource(stream);
    AppState.microphoneSource.connect(AppState.analyser);
    AppState.analyser.fftSize = 256;

    const dataArray = new Uint8Array(AppState.analyser.frequencyBinCount);

    function draw() {
        if (!AppState.isRecording) {
            stopVolumeMeter();
            return;
        }
        
        AppState.animationFrameId = requestAnimationFrame(draw);
        AppState.analyser.getByteFrequencyData(dataArray);
        
        let sum = dataArray.reduce((a, b) => a + b, 0);
        let avg = sum / dataArray.length;
        let volume = (avg / 130) * 100;
        
        volumeMeterBar.style.width = Math.min(100, Math.max(0, volume)) + '%';
        volumeMeterBar.classList.toggle('paused', AppState.isPaused);
    }
    draw();
}

function stopVolumeMeter() {
    if (AppState.animationFrameId) cancelAnimationFrame(AppState.animationFrameId);
    if (AppState.microphoneSource) AppState.microphoneSource.disconnect();
    DOMElements.volumeMeterBar.style.width = '0%';
    DOMElements.volumeMeterContainer.style.display = 'none';
}


// --- Lógica Principal de Grabación ---

export function toggleRecordingState() {
    if (AppState.isRecording) {
        if (AppState.mediaRecorder && AppState.mediaRecorder.state !== "inactive") {
            AppState.mediaRecorder.stop();
        }
    } else {
        startActualRecording();
    }
}

export function handlePauseResume() {
    if (!AppState.mediaRecorder || !AppState.isRecording) return;
    if (AppState.mediaRecorder.state === "recording") {
        AppState.mediaRecorder.pause();
    } else if (AppState.mediaRecorder.state === "paused") {
        AppState.mediaRecorder.resume();
    }
}

async function startActualRecording() {
    const { polishedTextarea, audioPlayback, audioPlaybackSection } = DOMElements;
    
    if (polishedTextarea.selectionStart !== polishedTextarea.selectionEnd) {
        AppState.isDictatingForReplacement = true;
        AppState.replacementSelectionStart = polishedTextarea.selectionStart;
        AppState.replacementSelectionEnd = polishedTextarea.selectionEnd;
        setStatus("Dicte el texto de reemplazo...", "processing");
    } else {
        AppState.isDictatingForReplacement = false;
        AppState.insertionPoint = polishedTextarea.selectionStart;
        setStatus("Solicitando permiso...", "processing");
    }

    AppState.isPaused = false;
    AppState.audioChunks = [];
    AppState.currentAudioBlob = null;
    AppState.recordingSeconds = 0;
    if (audioPlayback.src) URL.revokeObjectURL(audioPlayback.src);
    audioPlaybackSection.style.display = 'none';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        AppState.isRecording = true;
        setupVolumeMeter(stream);
        startRecordingTimer();

        AppState.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        AppState.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) AppState.audioChunks.push(e.data); };
        AppState.mediaRecorder.onpause = () => { AppState.isPaused = true; setStatus(AppState.isDictatingForReplacement ? 'Reemplazo en pausa.' : 'Dictado en pausa.', 'idle'); updateButtonStates("paused"); };
        AppState.mediaRecorder.onresume = () => { AppState.isPaused = false; setStatus(AppState.isDictatingForReplacement ? 'Dictando reemplazo...' : 'Grabando...', 'processing'); updateButtonStates("recording"); };

        AppState.mediaRecorder.onstop = async () => {
            AppState.isRecording = false;
            AppState.isPaused = false;
            stopVolumeMeter();
            stopRecordingTimer();
            stream.getTracks().forEach(track => track.stop());

            if (AppState.audioChunks.length === 0) {
                setStatus("No se grabó audio.", "error", 3000);
                updateButtonStates("initial");
                return;
            }

            AppState.currentAudioBlob = new Blob(AppState.audioChunks, { type: 'audio/webm' });
            audioPlayback.src = URL.createObjectURL(AppState.currentAudioBlob);
            
            await processAudioBlobAndInsertText(AppState.currentAudioBlob);
        };

        AppState.mediaRecorder.start();
        setStatus(AppState.isDictatingForReplacement ? 'Dicte el reemplazo...' : 'Grabando...', "processing");
        updateButtonStates("recording");

    } catch (e) {
        console.error("Error al iniciar grabación:", e);
        AppState.isRecording = false;
        updateButtonStates("initial");
        setStatus(`Error de micrófono: ${e.message}`, "error", 5000);
    }
}

export async function processAudioBlobAndInsertText(audioBlob) {
    updateButtonStates("processing_audio");

    try {
        const base64Audio = await blobToBase64(audioBlob);
        const processedNewText = await transcribeAndPolishAudio(base64Audio);
        insertTextIntoTextarea(processedNewText);
        updateButtonStates("success_processing");

    } catch (error) {
        console.error('Error en processAudioBlobAndInsertText:', error);
        setStatus(`Error de procesamiento: ${error.message}`, "error", 5000);
        updateButtonStates("error_processing");
    } finally {
        AppState.isDictatingForReplacement = false;
    }
}

function insertTextIntoTextarea(newText) {
    const { polishedTextarea } = DOMElements;
    const currentContent = polishedTextarea.value;
    let finalContent = '';
    let newCursorPos = 0;

    if (AppState.isDictatingForReplacement) {
        const before = currentContent.substring(0, AppState.replacementSelectionStart);
        const after = currentContent.substring(AppState.replacementSelectionEnd);
        finalContent = before + newText + after;
        newCursorPos = AppState.replacementSelectionStart + newText.length;
    } else {
        const before = currentContent.substring(0, AppState.insertionPoint);
        const after = currentContent.substring(AppState.insertionPoint);
        let space = (before.length > 0 && !/\s$/.test(before) && newText.length > 0) ? ' ' : '';
        finalContent = before + space + newText + after;
        newCursorPos = AppState.insertionPoint + space.length + newText.length;
    }
    
    polishedTextarea.value = finalContent;
    polishedTextarea.focus();
    polishedTextarea.selectionStart = polishedTextarea.selectionEnd = newCursorPos;
    
    updateCopyButtonState();
    setStatus('Texto insertado con éxito.', 'success', 3000);
}
