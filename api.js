// api.js
// Gestiona toda la comunicación con APIs externas: Google Gemini y Firestore.
// VERSIÓN CON PROMPTS REFORZADOS

import { db, doc, getDoc, setDoc } from './firebase.js';
import { AppState } from './state.js';
import { setStatus } from './ui.js';
import { cleanupArtifacts, applyPunctuationRules, capitalizeSentencesProperly, applyAllUserCorrections } from './utils.js';

const userApiKey = 'AIzaSyASbB99MVIQ7dt3MzjhidgoHUlMXIeWvGc'; // Clave de Gemini

async function callGeminiAPI(modelName, promptParts, isTextPrompt = false) {
    if (!userApiKey) throw new Error('No se encontró la API Key de Gemini.');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${userApiKey}`;
    const temperature = isTextPrompt ? 0.2 : 0.3;

    const payload = {
        contents: [{ parts: promptParts }],
        generationConfig: { temperature: temperature },
    };

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
    
    return "";
}

export async function transcribeAndPolishAudio(base64Audio) {
    console.groupCollapsed(`[Proceso de Dictado] ${new Date().toLocaleTimeString()}`);
    
    const MODEL_TO_USE = 'gemini-2.0-flash-lite';

    let transcribedText = '';
    try {
        setStatus('Transcribiendo audio...', 'processing');
        
        // --- PROMPT DE TRANSCRIPCIÓN REFORZADO CON EJEMPLO ---
        const transcriptPromptParts = [
            { text: `Tu única tarea es transcribir el audio palabra por palabra. Es un error crítico interpretar las palabras de puntuación. Debes transcribirlas literalmente.
            Ejemplo: Si el audio dice "hígado normal punto y seguido bazo normal", tu única respuesta válida es "hígado normal punto y seguido bazo normal".
            No respondas con "hígado normal. bazo normal". Transcribe el audio ahora.` },
            { inline_data: { mime_type: "audio/webm", data: base64Audio } }
        ];
        
        transcribedText = await callGeminiAPI(MODEL_TO_USE, transcriptPromptParts, false);
    } catch (e) {
        console.error("Error en la transcripción:", e);
        console.groupEnd();
        throw new Error(`Fallo en la transcripción: ${e.message}`);
    }
    
    let polishedByAI = '';
    try {
        setStatus('Puliendo texto...', 'processing');

        // --- PROMPT DE PULIDO REFORZADO ---
        const polishPromptParts = [{
            text: `Revisa y corrige SOLAMENTE errores ortográficos objetivos en el siguiente texto. NO corrijas la gramática. NO añadas, elimines o modifiques la puntuación o las palabras de puntuación (como "coma" o "punto"). Es un error CRÍTICO cambiar la estructura. Tu única tarea es la corrección ortográfica. Texto a procesar: "${transcribedText}"`
        }];
        
        polishedByAI = await callGeminiAPI(MODEL_TO_USE, polishPromptParts, true);
    } catch (e) {
        console.error("Error en el pulido por IA:", e);
        setStatus(`Fallo en pulido, usando transcripción original.`, "error", 4000);
        polishedByAI = transcribedText;
    }
    
    console.log("%c--- INICIO PROCESAMIENTO DE TEXTO ---", "color: orange; font-weight: bold;");

    const cleanedText = cleanupArtifacts(polishedByAI);
    console.log('%c1. Texto después de limpiar artefactos de IA:', 'color: teal;', JSON.stringify(cleanedText));

    const textWithoutAIPunctuation = cleanedText.replace(/[.,]/g, ' ');
    console.log('%c2. Texto después de FILTRAR puntuación de IA:', 'color: red;', JSON.stringify(textWithoutAIPunctuation));

    const textWithPunctuation = applyPunctuationRules(textWithoutAIPunctuation);
    console.log('%c3. Texto después de APLICAR nuestras reglas de puntuación:', 'color: green;', JSON.stringify(textWithPunctuation));
    
    let finalProcessing = capitalizeSentencesProperly(textWithPunctuation);
    console.log('%c4. Texto después de capitalizar:', 'color: purple;', JSON.stringify(finalProcessing));

    finalProcessing = applyAllUserCorrections(finalProcessing, AppState.customVocabulary);
    console.log('%c5. Texto FINAL (tras correcciones de usuario):', 'color: blue; font-weight: bold;', JSON.stringify(finalProcessing));
    
    console.log("%c--- FIN PROCESAMIENTO DE TEXTO ---", "color: orange; font-weight: bold;");
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
