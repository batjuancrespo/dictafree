// api.js
// Gestiona toda la comunicación con APIs externas: Google Gemini y Firestore.

import { db, doc, getDoc, setDoc } from './firebase.js';
import { AppState } from './state.js';
import { setStatus } from './ui.js';
import { cleanupArtifacts, applyPunctuationRules, capitalizeSentencesProperly, applyAllUserCorrections } from './utils.js';

const userApiKey = 'AIzaSyASbB99MVIQ7dt3MzjhidgoHUlMXIeWvGc'; // Clave de Gemini

/**
 * Llama a la API de Gemini para generar contenido.
 * @param {string} modelName - El nombre del modelo a usar.
 * @param {Array} promptParts - Las partes del prompt.
 * @param {boolean} isTextPrompt - Si es un prompt de solo texto para ajustar la temperatura.
 * @returns {Promise<string>} - La respuesta de texto de la API.
 */
async function callGeminiAPI(modelName, promptParts, isTextPrompt = false) {
    if (!userApiKey) throw new Error('No se encontró la API Key de Gemini.');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${userApiKey}`;
    const temperature = isTextPrompt ? 0.2 : 0.3;

    const payload = {
        contents: [{ parts: promptParts }],
        generationConfig: { temperature: temperature },
    };

    console.log(`%c[API Call] Enviando a ${modelName} (Temp: ${temperature})`, 'color: #888;', { prompt: JSON.stringify(payload.contents).substring(0, 400) + '...' });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("[API Error] Respuesta no OK:", errorData);
        throw new Error(`Error de la API: ${errorData.error?.message || response.statusText} (${response.status})`);
    }

    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    
    if (data.promptFeedback?.blockReason) throw new Error(`Prompt bloqueado por seguridad: ${data.promptFeedback.blockReason}.`);
    if (data.candidates?.[0]?.finishReason !== "STOP") throw new Error(`Generación incompleta (Razón: ${data.candidates[0].finishReason}).`);
    
    return "";
}

/**
 * Proceso completo de transcripción y pulido del audio.
 * @param {string} base64Audio - El audio codificado en Base64.
 * @returns {Promise<string>} - El texto final, procesado y listo para insertar.
 */
export async function transcribeAndPolishAudio(base64Audio) {
    console.groupCollapsed(`[Proceso de Dictado] ${new Date().toLocaleTimeString()}`);
    
    const MODEL_TO_USE = 'gemini-2.0-flash-lite'; // <-- MODELO REVERTIDO

    let transcribedText = '';
    try {
        setStatus('Transcribiendo audio...', 'processing');
        const transcriptPromptParts = [
            { text: "Transcribe el siguiente audio a texto con la MÁXIMA LITERALIDAD POSIBLE. Transcribe palabras como 'punto', 'coma', 'punto y aparte' como texto, no como signos de puntuación. El objetivo es una transcripción fiel palabra por palabra, incluyendo los signos de puntuación que el hablante dicte (ej. si dice una coma, transcribe ',')." },
            { inline_data: { mime_type: "audio/webm", data: base64Audio } }
        ];
        transcribedText = await callGeminiAPI(MODEL_TO_USE, transcriptPromptParts, false);
        console.log("%c[PASO 1] Transcripción literal recibida:", "font-weight: bold; color: blue;", JSON.stringify(transcribedText));
    } catch (e) {
        console.error("Error en la transcripción:", e);
        console.groupEnd();
        throw new Error(`Fallo en la transcripción: ${e.message}`);
    }
    
    let polishedByAI = '';
    try {
        setStatus('Puliendo texto...', 'processing');
        const polishPromptParts = [{
            text: `Por favor, revisa el siguiente texto. Tu única tarea es corregir errores ortográficos y gramaticales objetivos.
            - NO cambies la elección de palabras.
            - NO reestructures frases.
            - CRUCIAL: Mantén las palabras de puntuación (como "punto", "coma", "punto y aparte") y los signos de puntuación (como ",") EXACTAMENTE como están. No los conviertas ni los elimines.
            
            Texto a procesar:
            "${transcribedText}"`
        }];
        
        polishedByAI = await callGeminiAPI(MODEL_TO_USE, polishPromptParts, true);
        console.log("%c[PASO 2] Texto pulido por IA:", "font-weight: bold; color: purple;", JSON.stringify(polishedByAI));
    } catch (e) {
        console.error("Error en el pulido por IA:", e);
        setStatus(`Fallo en pulido, usando transcripción original.`, "error", 4000);
        polishedByAI = transcribedText;
    }

    const cleanedText = cleanupArtifacts(polishedByAI);
    const textWithPunctuation = applyPunctuationRules(cleanedText);
    let finalProcessing = capitalizeSentencesProperly(textWithPunctuation);
    finalProcessing = applyAllUserCorrections(finalProcessing, AppState.customVocabulary);
    
    console.groupEnd();
    return finalProcessing;
}

// ... (El resto de las funciones de Firestore no cambian)
export async function loadUserVocabularyFromFirestore(userId) {
    if (!userId || !db) {
        AppState.customVocabulary = {};
        AppState.learnedCorrections = {};
        AppState.commonMistakeNormalization = {};
        return;
    }

    const vocabDocRef = doc(db, "userVocabularies", userId);
    try {
        const docSnap = await getDoc(vocabDocRef);
        if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            AppState.customVocabulary = firestoreData.rulesMap || {};
            AppState.learnedCorrections = firestoreData.learnedMap || {};
            AppState.commonMistakeNormalization = firestoreData.normalizations || {};
        } else {
            AppState.customVocabulary = {};
        }
    } catch (error) {
        console.error("Error cargando vocabulario desde Firestore:", error);
        AppState.customVocabulary = {};
        setStatus("Error al cargar las personalizaciones.", "error", 3000);
    }
}

export async function saveUserVocabularyToFirestore() {
    if (!AppState.currentUserId || !db) return;

    const vocabDocRef = doc(db, "userVocabularies", AppState.currentUserId);
    const dataToSave = {
        rulesMap: AppState.customVocabulary,
        learnedMap: AppState.learnedCorrections,
        normalizations: AppState.commonMistakeNormalization
    };

    try {
        await setDoc(vocabDocRef, dataToSave, { merge: true });
    } catch (error) {
        console.error("Error guardando vocabulario del usuario:", error);
        setStatus("Error al guardar las personalizaciones.", "error", 3000);
    }
}
