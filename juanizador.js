// juanizador.js
// Contiene toda la lógica para la sección del Asistente de Informes (Juanizador).

import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = 'AIzaSyBsKWbE6KgNaolK9BxDNDdviNw3pM7sOv0'; // Mover a un lugar seguro en producción
const MODEL_NAME = 'gemini-1.5-flash-latest';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const anatomicalCategories = [
    { id: 0, name: "Tiroides/glándula tiroidea" }, { id: 1, name: "Estructuras mediastínicas vasculares y/o corazón" }, { id: 2, name: "Adenopatías mediastínicas" },
    { id: 3, name: "Parénquima pulmonar" }, { id: 4, name: "Derrame pleural y cambios secundarios" }, { id: 5, name: "Hígado, porta y confluente esplenomesentérico venoso" },
    { id: 6, name: "Vesícula y vía biliar" }, { id: 7, name: "Páncreas" }, { id: 8, name: "Bazo, glándulas suprarrenales, riñones, vías excretoras, uréteres y vejiga urinaria" },
    { id: 9, name: "Cámara gástrica, asas intestinales" }, { id: 10, name: "Líquido libre o adenopatías intra-abdominales" }, { id: 11, name: "Aorta y grandes vasos mesentéricos" },
    { id: 12, name: "Esqueleto axial" }, { id: 13, name: "Otros hallazgos" }, { id: 14, name: "Bases pulmonares incluidas en el estudio" }, { id: 15, name: "Hemiabdomen superior incluido en el estudio" }
];
const categoryPrompts = {
    0: "Describe SOLO los hallazgos mencionados en la glándula tiroidea. Si no hay hallazgos, devuelve EXACTAMENTE: 'Glándula tiroidea de tamaño y morfología normales, sin nódulos ni otras alteraciones radiológicas significativas.'",
    1: "Describe SOLO los hallazgos en estructuras mediastínicas vasculares y/o corazón. Si no hay hallazgos, devuelve EXACTAMENTE: 'Estructuras mediastinicas vasculares sin hallazgos morfológicos de interés.'",
    2: "Describe SOLO los hallazgos en adenopatías mediastínicas. Si no hay hallazgos, devuelve EXACTAMENTE: 'No se identifican adenopatías mediastínicas de tamaño significativo.'",
    3: "Describe SOLO los hallazgos en el parénquima pulmonar. Si no hay hallazgos, devuelve EXACTAMENTE: 'En el parénquima pulmonar no existen imágenes nodulares ni aumentos de densidad sugestivos de afectación patológica.'",
    4: "Describe SOLO los hallazgos sobre derrame pleural. Si no hay hallazgos, devuelve EXACTAMENTE: 'No se objetiva derrame pleural.'",
    5: "Sigue este esquema para hígado, porta y confluente venoso: 1. Rasgos de hepatopatía crónica (si los hay, usa 'el hígado es de contornos lobulados y parénquima discretamente heterogéneo'; si no, usa 'el hígado es de bordes lisos y densidad homogénea'). 2. Describe lesiones ocupantes de espacio de forma concisa. 3. Describe hallazgos en porta, vena esplénica y mesentérica. Si no hay hallazgos, devuelve EXACTAMENTE: 'El hígado es de bordes lisos y densidad homogénea no identificándose lesiones ocupantes de espacio. Vena porta, esplénica y mesentérica de calibre normal, permeables.'",
    6: "Describe SOLO los hallazgos en vesícula y vía biliar. Si no hay hallazgos, devuelve EXACTAMENTE: 'Vesícula biliar normodistendida, de paredes finas, sin evidencia de litiasis en su interior. Vía biliar intra y extrahepática no dilatada.'",
    7: "Describe SOLO los hallazgos en el páncreas. Si no hay hallazgos, devuelve EXACTAMENTE: 'Páncreas homogéneo y bien definido sin lesiones focales ni dilatación del ducto pancreático principal.'",
    8: "Describe SOLO los hallazgos en bazo, suprarrenales, riñones, vías excretoras y vejiga. Si no hay hallazgos, devuelve EXACTAMENTE: 'Bazo, glándulas suprarrenales y riñones de tamaño, morfología y densidad normales, sin evidencia de lesiones focales. Vías excretoras, uréteres y vejiga urinaria sin alteraciones radiológicas significativas.'",
    9: "Describe SOLO los hallazgos en cámara gástrica y asas intestinales. Si no hay hallazgos, devuelve EXACTAMENTE: 'Cámara gástrica moderadamente distendida sin hallazgos relevantes. Asas de intestino delgado y marco cólico sin engrosamientos parietales ni cambios de calibre significativos.'",
    10: "Describe SOLO líquido libre o adenopatías intra-abdominales. Si no hay hallazgos, devuelve EXACTAMENTE: 'No se observa líquido libre ni adenopatías intra-abdominales de aspecto patológico.'",
    11: "Describe SOLO hallazgos en aorta y grandes vasos mesentéricos. Si no hay hallazgos, devuelve EXACTAMENTE: 'Aorta y grandes vasos mesentéricos de calibre normal, sin hallazgos significativos.'",
    12: "Describe SOLO hallazgos en el esqueleto axial. Si no hay hallazgos, devuelve EXACTAMENTE: 'Esqueleto axial incluido en el estudio sin lesiones focales ni anomalías morfológicas relevantes.'",
    13: "Describe SOLO hallazgos que no correspondan a otras categorías. Si no hay hallazgos, devuelve EXACTAMENTE: 'No hay otros hallazgos relevantes que reportar.'",
    14: "Describe SOLO hallazgos en las bases pulmonares visibles. Si no hay hallazgos, devuelve EXACTAMENTE: 'En las bases pulmonares incluidas en el estudio no se observan hallazgos patológicos de significación.'",
    15: "Describe SOLO hallazgos en el hemiabdomen superior visible. Si no hay hallazgos, devuelve EXACTAMENTE: 'En el hemiabdomen superior incluido en el estudio no se objetivan hallazgos relevantes.'"
};


let DOMElementsJuanizador, categorizedFindings = {};
window.availableCategories = [];

async function queryGeminiAPI(prompt) {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Error al consultar la API de Gemini:', error);
        alert("Error de comunicación con la API del Juanizador. Revisa la consola.");
        return null;
    }
}

async function categorizeFindings() {
    const transcript = DOMElementsJuanizador.transcriptArea.value.trim();
    if (!transcript) {
        alert('No hay hallazgos para categorizar.');
        return;
    }
    
    setLoadingState('categorizing-loading', true);
    
    const filteredCategories = anatomicalCategories.filter(cat => window.availableCategories.includes(cat.id));
    const categoryNames = filteredCategories.map(cat => `${cat.id}. ${cat.name}`).join('\n');
    
    const prompt = `Eres un radiólogo experto. Categoriza los siguientes hallazgos en las categorías disponibles.
    Categorías Disponibles:\n${categoryNames}
    Hallazgos a Categorizar:\n"${transcript}"
    Devuelve un objeto JSON con claves de ID de categoría y valores como array de hallazgos. Incluye solo categorías con hallazgos. Devuelve SOLO el objeto JSON.`;
    
    try {
        const response = await queryGeminiAPI(prompt);
        if (!response) throw new Error('Respuesta vacía de la API.');
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { 
            console.error("Respuesta de API no es un JSON válido:", response);
            throw new Error('La respuesta de la API no contiene un JSON válido.');
        }

        categorizedFindings = JSON.parse(jsonMatch[0]);
        displayCategorizedFindings();
    } catch (error) {
        console.error('Error al categorizar:', error);
        alert(`Hubo un error al categorizar los hallazgos: ${error.message}`);
    } finally {
        setLoadingState('categorizing-loading', false);
    }
}

/**
 * FUNCIÓN RESTAURADA: Genera el informe completo a partir de los hallazgos categorizados.
 */
async function generateCompleteReport() {
    if (Object.keys(categorizedFindings).length === 0) {
        alert('Primero debe categorizar los hallazgos.');
        return;
    }
    
    setLoadingState('report-loading', true);
    DOMElementsJuanizador.finalReport.textContent = 'Generando informe, por favor espere...';

    const tech = DOMElementsJuanizador.imagingTechnique.value;
    const vocabularyInstructions = {
        'tac': "Utiliza terminología de Tomografía Computarizada (TAC). Describe los hallazgos en términos de densidad (ej: hipodenso, hiperdenso) y realce tras el contraste.",
        'rm': "Utiliza terminología de Resonancia Magnética (RM). Describe los hallazgos en términos de intensidad de señal (ej: hipointenso, hiperintenso) y su comportamiento en las diferentes secuencias.",
        'eco': "Utiliza terminología de Ecografía. Describe los hallazgos en términos de ecogenicidad (ej: hipoecoico, anecoico, hiperecogénico) y menciona artefactos relevantes como sombra o refuerzo."
    };
    const modalityInstruction = vocabularyInstructions[tech] || "Redacta un párrafo conciso y profesional.";

    let reportOrder = anatomicalCategories.filter(c => window.availableCategories.includes(c.id));
    
    let fullReport = '';
    for (const category of reportOrder) {
        const findings = categorizedFindings[category.id.toString()] || [];
        const prompt = `${categoryPrompts[category.id]}
Instrucción de estilo: ${modalityInstruction}
Hallazgos encontrados: ${findings.length > 0 ? findings.join('. ') : 'Ninguno'}
Ahora, redacta el párrafo final de forma profesional y concisa, aplicando estrictamente la instrucción de estilo.`;
        
        const sectionReport = await queryGeminiAPI(prompt);
        if (sectionReport && sectionReport.trim()) {
            fullReport += `${sectionReport.trim()}\n`;
        }
    }
    
    const allFindings = Object.values(categorizedFindings).flat();
    const conclusionPrompt = `Eres un radiólogo experto.
Instrucción de estilo: ${modalityInstruction}
Basado en estos hallazgos:
${allFindings.join('. ')}
Genera una conclusión concisa (máx. 2-3 líneas) con los 2-3 hallazgos más relevantes, usando el vocabulario correcto según la instrucción de estilo. Para el resto, usa "Ver informe descriptivo". Si no hay hallazgos, devuelve: "No se observan alteraciones radiológicas significativas."`;
    
    const conclusion = await queryGeminiAPI(conclusionPrompt);
    if (conclusion) {
        fullReport += `\nCONCLUSIÓN:\n${conclusion.trim()}`;
    }
    
    DOMElementsJuanizador.finalReport.textContent = fullReport;
    setLoadingState('report-loading', false);
}


function displayCategorizedFindings() {
    const container = DOMElementsJuanizador.categorizedContent;
    container.innerHTML = '';
    const orderedCatIds = anatomicalCategories.map(c => c.id.toString());
    
    let hasFindings = false;
    orderedCatIds.forEach(catId => {
        if (categorizedFindings[catId] && categorizedFindings[catId].length > 0) {
            hasFindings = true;
            const category = anatomicalCategories.find(c => c.id == catId);
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            const findingsList = categorizedFindings[catId].map(finding => `<li>${finding}</li>`).join('');
            categoryDiv.innerHTML = `<h3>${category.name}</h3><ul>${findingsList}</ul>`;
            container.appendChild(categoryDiv);
        }
    });

    if (!hasFindings) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No se encontraron hallazgos para categorizar.</p>';
    }
}

function updateAvailableCategories() {
    const tech = DOMElementsJuanizador.imagingTechnique.value;
    const tacScope = DOMElementsJuanizador.tacScope.value;
    const rmType = DOMElementsJuanizador.rmType.value;
    
    DOMElementsJuanizador.tacScopeContainer.style.display = tech === 'tac' ? 'flex' : 'none';
    DOMElementsJuanizador.rmTypeContainer.style.display = tech === 'rm' ? 'flex' : 'none';
    DOMElementsJuanizador.contrastContainer.style.display = (tech === 'tac' || tech === 'rm') ? 'flex' : 'none';
    
    const baseCategories = [12, 13];
    let categories = [];
    
    if (tech === 'tac') {
        switch(tacScope) {
            case 'toracoabdominal': categories = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, ...baseCategories]; break;
            case 'torax': categories = [0, 1, 2, 3, 4, 15, ...baseCategories]; break;
            case 'abdomen': categories = [5, 6, 7, 8, 9, 10, 11, 14, ...baseCategories]; break;
        }
    } else if (tech === 'rm') {
        switch(rmType) {
            case 'hepatica': case 'colangio': categories = [5, 6, 7, 8, 10, ...baseCategories]; break;
            default: categories = [5, 6, 7, 8, 9, 10, 11, ...baseCategories]; break;
        }
    } else { // Eco
        categories = [5, 6, 7, 8, 9, 10, 11, ...baseCategories];
    }
    window.availableCategories = categories;
    updateTechniqueDescription();
}

function updateTechniqueDescription() {
    // Implementa aquí la lógica si es necesario
}

function setLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isLoading ? 'block' : 'none';
    }
}

export function initializeJuanizador(textToAnalyze) {
    if (!DOMElementsJuanizador) {
        DOMElementsJuanizador = {
            container: document.getElementById('juanizador-container'),
            backToDictationBtn: document.getElementById('backToDictationBtn'),
            transcriptArea: document.getElementById('transcript'),
            categorizeBtn: document.getElementById('categorize-btn'),
            clearBtn: document.getElementById('clear-btn'),
            generateReportBtn: document.getElementById('generate-report-btn'),
            copyReportBtn: document.getElementById('copy-report-btn'),
            categorizedContent: document.getElementById('categorized-content'),
            finalReport: document.getElementById('final-report'),
            imagingTechnique: document.getElementById('imaging-technique'),
            tacScope: document.getElementById('tac-scope'),
            rmType: document.getElementById('rm-type'),
            contrastUse: document.getElementById('contrast-use'),
            tacScopeContainer: document.getElementById('tac-scope-container'),
            rmTypeContainer: document.getElementById('rm-type-container'),
            contrastContainer: document.getElementById('contrast-container'),
            phaseContainer: document.getElementById('phase-container'),
        };
    }
    
    if (DOMElementsJuanizador.transcriptArea) {
        DOMElementsJuanizador.transcriptArea.value = textToAnalyze;
        categorizedFindings = {};
        DOMElementsJuanizador.categorizedContent.innerHTML = '';
        DOMElementsJuanizador.finalReport.textContent = 'El informe generado aparecerá aquí...';
    }
    
    if (!DOMElementsJuanizador.container.dataset.initialized) {
        DOMElementsJuanizador.backToDictationBtn.addEventListener('click', () => {
            window.switchToDictationView();
        });
        
        DOMElementsJuanizador.categorizeBtn.addEventListener('click', categorizeFindings);
        
        // <-- LISTENER AÑADIDO
        DOMElementsJuanizador.generateReportBtn.addEventListener('click', generateCompleteReport);
        
        DOMElementsJuanizador.clearBtn.addEventListener('click', () => {
            DOMElementsJuanizador.transcriptArea.value = '';
            DOMElementsJuanizador.categorizedContent.innerHTML = '';
            DOMElementsJuanizador.finalReport.textContent = 'El informe generado aparecerá aquí...';
        });

        [DOMElementsJuanizador.imagingTechnique, DOMElementsJuanizador.tacScope, DOMElementsJuanizador.rmType, DOMElementsJuanizador.contrastUse].forEach(el => {
            if(el) el.addEventListener('change', updateAvailableCategories);
        });
        
        DOMElementsJuanizador.container.dataset.initialized = 'true';
    }
    
    updateAvailableCategories();
}
