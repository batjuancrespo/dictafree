// utils.js
// Contiene funciones de utilidad, principalmente para el procesamiento de texto.

export function cleanupArtifacts(text) {
    if (!text || typeof text !== 'string') return text || "";
    let cleanedText = text.trim();
    if (cleanedText.startsWith('"') && cleanedText.endsWith('"') && cleanedText.length > 2) {
        cleanedText = cleanedText.substring(1, cleanedText.length - 1).trim();
    }
    return cleanedText.replace(/ +/g, ' ');
}

export function capitalizeSentencesProperly(text) {
    if (!text || typeof text !== 'string' || text.trim() === "") return text;
    let processedText = text.trim();
    processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
    processedText = processedText.replace(/([.!?\n]\s*)([a-záéíóúüñ])/g, 
        (match, punctuationAndSpace, letter) => punctuationAndSpace + letter.toUpperCase()
    );
    return processedText;
}

export function applyPunctuationRules(text) {
    if (!text) return "";

    const punctuationMap = {
        'punto y aparte': '.\n',
        'punto y seguido': '.',
        'coma': ',',
        'punto': '.',
        'nuevalinea': '\n',
        'dospuntos': ':'
    };

    const sortedKeys = Object.keys(punctuationMap).sort((a, b) => b.length - a.length);

    let processedText = text;
    for (const key of sortedKeys) {
        const regex = new RegExp(`\\b${key.replace(/\s/g, '\\s')}\\b`, 'gi');
        processedText = processedText.replace(regex, punctuationMap[key]);
    }

    return processedText;
}

/**
 * ¡NUEVA VERSIÓN MEJORADA! Limpia la puntuación en varias pasadas con jerarquía.
 */
export function cleanupDoublePunctuation(text) {
    if (!text) return "";
    let cleanedText = text;

    // 1. Prioridad máxima: Saltos de línea. Cualquier combinación con \n se convierte en \n.
    // Ej: ", .\n" -> "\n"
    cleanedText = cleanedText.replace(/[.,:;!?\s]*\n[\s.,:;!?]*/g, '\n');

    // 2. Prioridad media: Puntos finales. Cualquier combinación con . ! ? se convierte en el punto final.
    // Ej: ", ." -> "."
    cleanedText = cleanedText.replace(/[.,:;\s]*([.!?])[\s.,:;!?]*/g, '$1');

    // 3. Prioridad baja: Comas y otros. Limpia duplicados menores.
    // Ej: ", ," -> ","
    cleanedText = cleanedText.replace(/([,:;])[\s,:;]*/g, '$1');

    // 4. Pasada final para asegurar espacios correctos.
    cleanedText = cleanedText
        .replace(/\s+([.,:;!?\n])/g, '$1') // Espacio antes de puntuación
        .replace(/([.,:;!?\n])([a-zA-ZáéíóúüñÁÉÍÓÚÑ])/g, '$1 $2') // Espacio después de puntuación
        .replace(/ +/g, ' ') // Espacios múltiples
        .trim();

    return cleanedText;
}


export function applyAllUserCorrections(text, customVocabulary) {
    if (!text || Object.keys(customVocabulary).length === 0) return text;
    
    let processedText = text;
    const sortedCustomKeys = Object.keys(customVocabulary).sort((a, b) => b.length - a.length);
    
    for (const errorKey of sortedCustomKeys) {
        const correctValue = customVocabulary[errorKey];
        try {
            const regex = new RegExp(`\\b${escapeRegExp(errorKey)}\\b`, 'gi');
            processedText = processedText.replace(regex, correctValue);
        } catch (e) {
            console.error(`Error en la expresión regular para la clave de vocabulario: "${errorKey}"`, e);
        }
    }
    return processedText;
}

export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        if (!blob || blob.size === 0) {
            return reject(new Error("El blob de audio es nulo o está vacío."));
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const parts = reader.result.toString().split(',');
                if (parts.length < 2 || !parts[1]) {
                    return reject(new Error("Fallo al convertir a Base64."));
                }
                resolve(parts[1]);
            } else {
                reject(new Error("FileReader no produjo ningún resultado."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}
