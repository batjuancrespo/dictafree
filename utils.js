// utils.js
// Contiene funciones de utilidad, principalmente para el procesamiento de texto.
// Son funciones "puras" que no dependen del estado global directamente.

export function cleanupArtifacts(text) {
    if (!text || typeof text !== 'string') return text || "";
    let cleanedText = text;
    let trimmedForQuotesCheck = cleanedText.trim();
    if (trimmedForQuotesCheck.startsWith('"') && trimmedForQuotesCheck.endsWith('"') && trimmedForQuotesCheck.length > 2) {
        cleanedText = trimmedForQuotesCheck.substring(1, trimmedForQuotesCheck.length - 1).trim();
    }
    cleanedText = cleanedText.replace(/(\s[pP])+[ \t]*$/gm, "");
    cleanedText = cleanedText.replace(/[pP]{2,}[ \t]*$/gm, "");
    cleanedText = cleanedText.replace(/\s+[pP][\s.]*$/gm, "");
    const trimmedTextForPunctuationCheck = cleanedText.trim();
    const wordCount = trimmedTextForPunctuationCheck.split(/\s+/).filter(Boolean).length;
    if (wordCount > 0 && wordCount <= 5) {
        if (trimmedTextForPunctuationCheck.endsWith('.') &&
            !trimmedTextForPunctuationCheck.endsWith('..') &&
            !trimmedTextForPunctuationCheck.endsWith('...') &&
            (trimmedTextForPunctuationCheck.length === 1 || (trimmedTextForPunctuationCheck.length > 1 && trimmedTextForPunctuationCheck.charAt(trimmedTextForPunctuationCheck.length - 2) !== '.'))) {
            if (trimmedTextForPunctuationCheck.length <= 1 || !/[.!?]$/.test(trimmedTextForPunctuationCheck.substring(0, trimmedTextForPunctuationCheck.length - 1).trim())) {
                cleanedText = trimmedTextForPunctuationCheck.slice(0, -1);
            }
        }
    }
    cleanedText = cleanedText.replace(/\n+$/, "");
    cleanedText = cleanedText.replace(/\s+([.!?])$/, "$1");
    cleanedText = cleanedText.replace(/ +/g, ' ');
    return cleanedText.trim();
}

export function capitalizeSentencesProperly(text) {
    if (!text || typeof text !== 'string' || text.trim() === "") {
        return text || "";
    }
    let processedText = text.trim();
    processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
    processedText = processedText.replace(
        /([.!?\n])(\s+)([a-záéíóúüñ])/g,
        (match, punctuation, whitespace, letter) => {
            return punctuation + whitespace + letter.toUpperCase();
        }
    );
    return processedText;
}

export function applyPunctuationRules(text) {
    if (!text) return "";

    let processedText = text
        .replace(/\bpunto y aparte\b/gi, 'puntoaparte')
        .replace(/\bpunto y seguido\b/gi, 'puntoseguido')
        .replace(/\bnueva línea\b/gi, 'nuevalinea');

    const words = processedText.split(/\s+/);
    const result = [];

    for (const word of words) {
        const cleanWord = word.replace(/[.,:;!?]$/, '').toLowerCase();

        switch (cleanWord) {
            case "puntoaparte":
                result.push(".\n");
                break;
            case "puntoseguido":
            case "punto":
                result.push(". ");
                break;
            case "coma":
                result.push(", ");
                break;
            case "nuevalinea":
                result.push("\n");
                break;
            case "dospuntos":
                result.push(": ");
                break;
            default:
                result.push(word);
                break;
        }
    }

    let final_text = result.join(" ");
    final_text = final_text.replace(/([,.:;!?])\s*([,.:;!?])/g, '$2');
    final_text = final_text.replace(/\s+([,.:;!?\n])/g, '$1');
    final_text = final_text.replace(/([,.:;!?])([a-zA-ZáéíóúüñÁÉÍÓÚÑ])/g, '$1 $2');
    final_text = final_text.replace(/ {2,}/g, ' ');
    final_text = final_text.replace(/\n\s+/g, '\n');

    return final_text.trim();
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
        if (!blob || blob.size === 0) return reject(new Error("El blob de audio es nulo o está vacío."));
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const parts = reader.result.toString().split(',');
                if (parts.length < 2 || !parts[1]) return reject(new Error("Fallo al convertir a Base64."));
                resolve(parts[1]);
            } else {
                reject(new Error("FileReader no produjo ningún resultado."));
            }
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(blob);
    });
}
