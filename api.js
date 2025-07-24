// api.js
// VERSIÓN CON NUEVO FLUJO DE PUNTUACIÓN ROBUSTO

import { db, doc, getDoc, setDoc } from './firebase.js';
import { AppState } from './state.js';
import { setStatus } from './ui.js';
import { 
    cleanupArtifacts, applyPunctuationRules, cleanupDoublePunctuation,
    capitalizeSentencesProperly, applyAllUserCorrections 
} from './utils.js';

const userApiKey = 'AIzaSyASbB99MVIQ7dt3MzjhidgoHUlMXIeWvGc'; // Clave de Gemini

async function callGeminiAPI(modelName, promptParts) {
    if (!userApiKey) throw new Error('No se encontró la API Key de Gemini.');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${userApiKey}`;
    
    const payload = {
        contents: [{ parts: promptParts }],
        generationConfig: { temperature: 0.3 },
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function transcribeAndPolishAudio(base64Audio) {
    console.groupCollapsed(`[Proceso de Dictado] ${new Date().toLocaleTimeString()}`);
    
    const MODEL_TO_USE = 'gemini-2.0-flash-lite';

    let transcribedText = '';
    try {
        setStatus('Transcribiendo audio...', 'processing');
        
        // --- PROMPT SIMPLIFICADO ---
        // Pedimos que transcriba lo mejor posible, incluyendo palabras de puntuación.
        const transcriptPromptParts = [
            { text: `Transcribe el siguiente audio médico. Transcribe las palabras de puntuación como "punto" o "coma" como texto literal.` },
            { inline_data: { mime_type: "audio/webm", data: base64Audio } }
        ];
        
        transcribedText = await callGeminiAPI(MODEL_TO_USE, transcriptPromptParts);
    } catch (e) {
        console.error("Error en la transcripción:", e);
        console.groupEnd();
        throw new Error(`Fallo en la transcripción: ${e.message}`);
    }
    
    console.log("%c--- INICIO PROCESAMIENTO DE TEXTO ---", "color: orange; font-weight: bold;");

    // Paso 1: Limpiar artefactos básicos (comillas, etc.)
    const cleanedText = cleanupArtifacts(transcribedText);
    console.log('%c1. Texto de la IA (limpio):', 'color: teal;', JSON.stringify(cleanedText));

    // Paso 2: Aplicamos NUESTRAS reglas sobre el texto de la IA
    // Esto añade nuestra puntuación dictada. Ej: "hola. coma" -> "hola. ,"
    const textWithBothPunctuations = applyPunctuationRules(cleanedText);
    console.log('%c2. Texto con puntuación de IA + dictado:', 'color: purple;', JSON.stringify(textWithBothPunctuations));

    // Paso 3: Limpiamos la puntuación duplicada o mal formada
    const textWithCleanPunctuation = cleanupDoublePunctuation(textWithBothPunctuations);
    console.log('%c3. Texto después de LIMPIAR puntuación combinada:', 'color: red;', JSON.stringify(textWithCleanPunctuation));
    
    // Paso 4: Capitalización y correcciones de vocabulario
    let finalProcessing = capitalizeSentencesProperly(textWithCleanPunctuation);
    finalProcessing = applyAllUserCorrections(finalProcessing, AppState.customVocabulary);
    console.log('%c4. Texto FINAL (capitalizado y corregido):', 'color: blue; font-weight: bold;', JSON.stringify(finalProcessing));
    
    console.log("%c--- FIN PROCESAMIENTO DE TEXTO ---", "color: orange; font-weight: bold;");
    console.groupEnd();
    return finalProcessing;
}

// --- Funciones de Firestore (sin cambios) ---

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
