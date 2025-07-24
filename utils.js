// utils.js
// Contiene funciones de utilidad, principalmente para el procesamiento de texto.

export function cleanupArtifacts(text) {
    if (!text || typeof text !== 'string') return text || "";
    let cleanedText = text.trim();
    // Elimina comillas de inicio y fin que a veces añade la IA
    if (cleanedText.startsWith('"') && cleanedText.endsWith('"') && cleanedText.length > 2) {
        cleanedText = cleanedText.substring(1, cleanedText.length - 1).trim();
    }
    // Reemplaza espacios múltiples por uno solo
    return cleanedText.replace(/ +/g, ' ');
}

export function capitalizeSentencesProperly(text) {
    if (!text || typeof text !== 'string' || text.trim() === "") return text;
    let processedText = text.trim();
    // Capitaliza la primera letra de todo el texto
    processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
    // Capitaliza las letras que vienen después de un punto, signo de exclamación/interrogación o salto de línea, seguido de CERO o más espacios.
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

    // Ordenamos las claves de la más larga a la más corta para evitar reemplazos parciales.
    const sortedKeys = Object.keys(punctuationMap).sort((a, b) => b.length - a.length);

    let processedText = text;
    // Itera sobre las claves ORDENADAS
    for (const key of sortedKeys) {
        const regex = new RegExp(`\\b${key.replace(/\s/g, '\\s')}\\b`, 'gi');
        processedText = processedText.replace(regex, punctuationMap[key]);
    }

    return processedText;
}

/**
 * ¡VERSIÓN JERÁRQUICA DEFINITIVA! Limpia la puntuación en varias pasadas con prioridades.
 */
export function cleanupDoublePunctuation(text) {
    if (!text) return "";
    let cleanedText = text;

    // 1. PRIORIDAD MÁXIMA: Normalizar "punto y aparte" (.\n).
    // Busca cualquier combinación de puntuación/espacio que contenga ".\n"
    // y la reemplaza por un ".\n" limpio, preservando el punto.
    // Ej: ", .\n ." -> ".\n"
    cleanedText = cleanedText.replace(/[\s.,:;!?]*(\.\n)[\s.,:;!?]*/g, '$1');

    // 2. PRIORIDAD MEDIA: Normalizar puntos finales.
    // Busca cualquier combinación de comas/puntos/espacios que contenga un punto final
    // y la reemplaza por un solo punto final, dándole prioridad al punto.
    // Ej: ", ." -> "."
    cleanedText = cleanedText.replace(/[,:;\s]*([.!?])[\s.,:;!?]*/g, '$1');

    // 3. PRIORIDAD BAJA: Limpiar comas y otros duplicados.
    // Ej: ", ," -> ","
    cleanedText = cleanedText.replace(/([,:;])[\s,:;]*/g, '$1');

    // 4. PASADA FINAL DE ESPACIADO: Asegura un formato impecable.
    cleanedText = cleanedText
        // Elimina espacios ANTES de la puntuación.
        .replace(/\s+([.,:;!?\n])/g, '$1')
        // Asegura un espacio DESPUÉS de la puntuación si le sigue una letra.
        .replace(/([.,:;!?\n])([a-zA-ZáéíóúüñÁÉÍÓÚÑ])/g, '$1 $2')
        // Elimina TODOS los espacios alrededor de los saltos de línea para una capitalización correcta.
        .replace(/\s*\n\s*/g, '\n')
        // Elimina espacios múltiples residuales.
        .replace(/ +/g, ' ')
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
