// api.js
// VERSIÓN CON NORMALIZADOR DE PARÉNTESIS

import { db, doc, getDoc, setDoc } from './firebase.js';
import { AppState } from './state.js';
import { setStatus } from './ui.js';
import { 
    cleanupArtifacts, applyPunctuationRules, cleanupDoublePunctuation,
    capitalizeSentencesProperly, applyAllUserCorrections, normalizeParenthesesSpacing
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
    
    // --- INICIO PROCESAMIENTO DE TEXTO ---

    // 1. Limpieza básica de artefactos de la IA
    const cleanedText = cleanupArtifacts(transcribedText);

    // 2. Aplicar NUESTRAS reglas de puntuación (ej: "punto" -> ".")
    const textWithBothPunctuations = applyPunctuationRules(cleanedText);

    // 3. Limpiar puntuación duplicada o conflictiva
    const textWithCleanPunctuation = cleanupDoublePunctuation(textWithBothPunctuations);
    
    // 4. Capitalizar frases
    let processedText = capitalizeSentencesProperly(textWithCleanPunctuation);

    // 5. Aplicar el vocabulario personalizado del usuario (ej: "abrir parentesis" -> "(")
    processedText = applyAllUserCorrections(processedText, AppState.customVocabulary);

    // 6. ¡PASO FINAL! Normalizar espaciado de paréntesis
    const finalProcessing = normalizeParenthesesSpacing(processedText);

    console.log("Texto FINAL (tras normalizar paréntesis):", JSON.stringify(finalProcessing));
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
