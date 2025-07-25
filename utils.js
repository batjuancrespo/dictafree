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
    // Capitaliza las letras que vienen después de un punto, signo de exclamación/interrogación o salto de línea, seguido de espacios.
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
        // La expresión regular maneja claves con espacios (ej. "punto y aparte")
        // y busca la clave como una palabra completa (\b) de forma global (g) y sin importar mayúsculas/minúsculas (i)
        const regex = new RegExp(`\\b${key.replace(/\s/g, '\\s')}\\b`, 'gi');
        processedText = processedText.replace(regex, punctuationMap[key]);
    }

    return processedText;
}

/**
 * Limpia y normaliza la puntuación usando una jerarquía.
 */
export function cleanupDoublePunctuation(text) {
    if (!text) return "";

    // Esta función se pasa como reemplazo al regex. Analiza cada "agrupación" de puntuación.
    const punctuationReplacer = (match) => {
        // JERARQUÍA: Elige el signo de mayor importancia encontrado en la agrupación.
        if (match.includes('.\n')) return '.\n'; // 1. Punto y aparte es el más importante.
        if (match.includes('\n')) return '\n';   // 2. Nueva línea.
        if (match.includes('!')) return '!';     // 3. Puntos finales.
        if (match.includes('?')) return '?';
        if (match.includes('.')) return '.';
        if (match.includes(':')) return ':';     // 4. Otros.
        if (match.includes(';')) return ';';
        if (match.includes(',')) return ',';     // 5. Coma es el menos importante.
        return ' '; // Si por alguna razón es solo espacio, devuelve un espacio.
    };

    let cleanedText = text;
    
    // El regex busca una agrupación de 2 o más caracteres de puntuación y/o espacios.
    cleanedText = cleanedText.replace(/([.,:;!?\n][\s.,:;!?\n]*)/g, punctuationReplacer);

    // PASADA FINAL DE ESPACIADO: Asegura un formato impecable.
    cleanedText = cleanedText
        .replace(/\s+([.,:;!?\n])/g, '$1') // Elimina espacio ANTES de puntuación.
        .replace(/([.,:;!?\n])([a-zA-ZáéíóúüñÁÉÍÓÚÑ])/g, '$1 $2') // Asegura espacio DESPUÉS.
        .replace(/\s*\n\s*/g, '\n') // Elimina espacios alrededor de saltos de línea.
        .replace(/ +/g, ' ') // Elimina espacios múltiples.
        .trim();

    return cleanedText;
}

/**
 * ¡NUEVA FUNCIÓN! Limpia el espaciado y la puntuación alrededor de los paréntesis.
 */
export function normalizeParenthesesSpacing(text) {
    if (!text) return "";
    return text
        // Elimina espacio DESPUÉS de abrir paréntesis: "( texto" -> "(texto"
        .replace(/\(\s+/g, '(')
        // Elimina espacio ANTES de cerrar paréntesis: "texto )" -> "texto)"
        .replace(/\s+\)/g, ')')
        // Elimina comas ANTES de abrir paréntesis, manteniendo un espacio: "palabra, (" -> "palabra ("
        .replace(/,\s*\(/g, ' (')
        // Mueve la puntuación final DESPUÉS de cerrar paréntesis: ") ." -> ")."
        .replace(/\)\s*([.,:;!?])/g, ')$1');
}

export function applyAllUserCorrections(text, customVocabulary) {
    if (!text || Object.keys(customVocabulary).length === 0) return text;
    
    let processedText = text;
    // Ordena las claves por longitud (de más larga a más corta) para evitar reemplazos parciales
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
    // Escapa caracteres especiales para que puedan ser usados en una expresión regular
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
