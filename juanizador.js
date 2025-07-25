// juanizador.js
// VERSIÓN CON LÓGICA DE INFORMES COMPLETA Y RESTAURADA

import { DOMElements } from './domElements.js';
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = 'AIzaSyBsKWbE6KgNaolK9BxDNDdviNw3pM7sOv0';
const MODEL_NAME = 'gemini-2.0-flash-lite';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const anatomicalCategories = [
    { id: 0, name: "Tiroides/glándula tiroidea", normal: "Glándula tiroidea de tamaño y morfología normales, sin nódulos ni otras alteraciones radiológicas significativas." },
    { id: 1, name: "Estructuras mediastínicas vasculares y/o corazón", normal: "Estructuras mediastinicas vasculares sin hallazgos morfológicos de interés." },
    { id: 2, name: "Adenopatías mediastínicas", normal: "No se identifican adenopatías mediastínicas de tamaño significativo." },
    { id: 3, name: "Parénquima pulmonar", normal: "En el parénquima pulmonar no existen imágenes nodulares ni aumentos de densidad sugestivos de afectación patológica." },
    { id: 4, name: "Derrame pleural y cambios secundarios", normal: "No se objetiva derrame pleural." },
    { id: 5, name: "Hígado, porta y confluente esplenomesentérico venoso", normal: "El hígado es de bordes lisos y densidad homogénea no identificándose lesiones ocupantes de espacio. Vena porta, esplénica y mesentérica de calibre normal, permeables." },
    { id: 6, name: "Vesícula y vía biliar", normal: "Vesícula biliar normodistendida, de paredes finas, sin evidencia de litiasis en su interior. Vía biliar intra y extrahepática no dilatada." },
    { id: 7, name: "Páncreas", normal: "Páncreas homogéneo y bien definido sin lesiones focales ni dilatación del ducto pancreático principal." },
    { id: 8, name: "Bazo, glándulas suprarrenales, riñones, vías excretoras, uréteres y vejiga urinaria", normal: "Bazo, glándulas suprarrenales y riñones de tamaño, morfología y densidad normales, sin evidencia de lesiones focales. Vías excretoras, uréteres y vejiga urinaria sin alteraciones radiológicas significativas." },
    { id: 9, name: "Cámara gástrica, asas intestinales", normal: "Cámara gástrica moderadamente distendida sin hallazgos relevantes. Asas de intestino delgado y marco cólico sin engrosamientos parietales ni cambios de calibre significativos." },
    { id: 10, name: "Líquido libre o adenopatías intra-abdominales", normal: "No se observa líquido libre ni adenopatías intra-abdominales de aspecto patológico." },
    { id: 11, name: "Aorta y grandes vasos mesentéricos", normal: "Aorta y grandes vasos mesentéricos de calibre normal, sin hallazgos significativos." },
    { id: 12, name: "Esqueleto axial", normal: "Esqueleto axial incluido en el estudio sin lesiones focales ni anomalías morfológicas relevantes." },
    { id: 13, name: "Otros hallazgos", normal: null }, // Esta categoría no tiene frase de normalidad
    { id: 14, name: "Bases pulmonares incluidas en el estudio", normal: "En las bases pulmonares incluidas en el estudio no se observan hallazgos patológicos de significación." },
    { id: 15, name: "Hemiabdomen superior incluido en el estudio", normal: "En el hemiabdomen superior incluido en el estudio no se objetivan hallazgos relevantes." }
];

let categorizedFindings = {};
window.availableCategories = [];

async function queryGeminiAPI(prompt) {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error en la llamada a Gemini:", error);
        alert("Error de comunicación con la API del Juanizador. Revisa la consola.");
        return null;
    }
}

async function categorizeFindings() {
    const transcript = DOMElements.juanizadorTranscriptArea.value.trim();
    if (!transcript) {
        alert('No hay hallazgos para categorizar.');
        return;
    }
    
    setLoadingState('juanizadorCategorizingLoading', true);
    
    const filteredCategories = anatomicalCategories.filter(cat => window.availableCategories.includes(cat.id));
    const categoryNames = filteredCategories.map(cat => `${cat.id}. ${cat.name}`).join('\n');
    
    const prompt = `Eres un radiólogo experto. Categoriza los siguientes hallazgos en las categorías disponibles.
    Categorías Disponibles:\n${categoryNames}
    Hallazgos a Categorizar:\n"${transcript}"
    Devuelve un objeto JSON con claves de ID de categoría y valores como array de hallazgos. Incluye solo categorías con hallazgos. Devuelve SOLO el objeto JSON.`;
    
    try {
        const response = await queryGeminiAPI(prompt);
        if (response === null) throw new Error('La API devolvió null.');
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('La respuesta de la API no contiene un JSON válido.');

        categorizedFindings = JSON.parse(jsonMatch[0]);
        displayCategorizedFindings();
    } catch (error) {
        alert(`Hubo un error al categorizar los hallazgos: ${error.message}`);
    } finally {
        setLoadingState('juanizadorCategorizingLoading', false);
    }
}

/**
 * ¡FUNCIÓN RESTAURADA Y MEJORADA! Genera el informe completo con toda la lógica original.
 */
async function generateCompleteReport() {
    if (!DOMElements.juanizadorCategorizeBtn.dataset.categorized) {
        alert('Primero debe categorizar los hallazgos.');
        return;
    }
    
    setLoadingState('juanizadorReportLoading', true);
    DOMElements.juanizadorFinalReport.textContent = 'Generando informe completo, por favor espere...';

    // 1. Recopilar toda la información del contexto del estudio
    const tech = DOMElements.juanizadorImagingTechnique.value;
    const tacScope = DOMElements.juanizadorTacScope.value;
    const withContrast = DOMElements.juanizadorContrastUse.value === 'con';
    const phasesCheckboxes = document.querySelectorAll('#phase-container input[type="checkbox"]:checked');
    const phases = Array.from(phasesCheckboxes).map(cb => cb.value);

    const vocabularyInstructions = {
        'tac': "Utiliza terminología de Tomografía Computarizada (TAC).",
        'rm': "Utiliza terminología de Resonancia Magnética (RM).",
        'eco': "Utiliza terminología de Ecografía."
    };
    const modalityInstruction = vocabularyInstructions[tech] || "Redacta un párrafo conciso y profesional.";

    // 2. Determinar el orden de las categorías y cuáles tienen hallazgos y cuáles no
    const reportCategories = anatomicalCategories.filter(c => window.availableCategories.includes(c.id));
    
    let findingsForPrompt = "Hallazgos encontrados por categoría:\n";
    let normalCategoriesForPrompt = "Categorías sin hallazgos (debes usar la frase de normalidad exacta para estas):\n";
    
    reportCategories.forEach(category => {
        const findings = categorizedFindings[category.id.toString()];
        if (findings && findings.length > 0) {
            findingsForPrompt += `- ${category.name}: ${findings.join('. ')}\n`;
        } else if (category.normal) { // Solo si tiene una frase de normalidad
            normalCategoriesForPrompt += `- ${category.name}: "${category.normal}"\n`;
        }
    });

    // 3. Construir el prompt único y enriquecido
    const finalPrompt = `
Eres un radiólogo experto. Tu tarea es generar un informe radiológico completo y estructurado.

**Contexto del Estudio:**
- Técnica: ${tech.toUpperCase()}
- Alcance: ${tacScope}
- Contraste: ${withContrast ? 'Sí' : 'No'}
${withContrast && phases.length > 0 ? `- Fases: ${phases.join(', ')}` : ''}

**Instrucciones Generales:**
1.  **Vocabulario:** Usa estrictamente el vocabulario correspondiente a la técnica (${modalityInstruction}).
2.  **Orden:** Genera el informe respetando el orden de las categorías que te proporciono.
3.  **Integridad:** Debes generar un párrafo para CADA categoría, tanto las que tienen hallazgos como las que no.
4.  **Conclusión:** Al final de todo, añade una sección llamada "CONCLUSIÓN:" que resuma los 2-3 hallazgos más importantes. Si no hay hallazgos significativos, la conclusión debe ser "No se observan alteraciones radiológicas significativas."

**Contenido a Incluir:**

${findingsForPrompt}
---
${normalCategoriesForPrompt}

Ahora, genera el informe completo (HALLAZGOS y CONCLUSIÓN) siguiendo todas las instrucciones.`;

    try {
        const fullReport = await queryGeminiAPI(finalPrompt);
        DOMElements.juanizadorFinalReport.textContent = fullReport ? fullReport.replace("HALLAZGOS:", "").trim() : "La API no generó un informe. Inténtalo de nuevo.";
    } catch (e) {
        DOMElements.juanizadorFinalReport.textContent = "Error al generar el informe. Revisa la consola.";
    } finally {
        setLoadingState('juanizadorReportLoading', false);
    }
}

function displayCategorizedFindings() {
    const container = DOMElements.juanizadorCategorizedContent;
    container.innerHTML = '';
    DOMElements.juanizadorCategorizeBtn.dataset.categorized = "false";
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
    } else {
        DOMElements.juanizadorCategorizeBtn.dataset.categorized = "true";
    }
}

function setLoadingState(loadingElementKey, isLoading) {
    const element = DOMElements[loadingElementKey];
    if (element) {
        element.style.display = isLoading ? 'block' : 'none';
    }
}

function updateAvailableCategories() {
    const tech = DOMElements.juanizadorImagingTechnique.value;
    const tacScope = DOMElements.juanizadorTacScope.value;
    const rmType = DOMElements.juanizadorRmType.value;
    const contrast = DOMElements.juanizadorContrastUse.value;
    
    DOMElements.juanizadorTacScopeContainer.style.display = tech === 'tac' ? 'flex' : 'none';
    DOMElements.juanizadorRmTypeContainer.style.display = tech === 'rm' ? 'flex' : 'none';
    DOMElements.juanizadorContrastContainer.style.display = (tech === 'tac' || tech === 'rm') ? 'flex' : 'none';
    DOMElements.juanizadorPhaseContainer.style.display = (tech === 'tac' && contrast === 'con') ? 'flex' : 'none';
    
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
}

function safeAddEventListener(elementKey, event, handler) {
    const element = DOMElements[elementKey];
    if (element) {
        element.addEventListener(event, handler);
    } else {
        console.error(`Error Crítico de Inicialización: El elemento con la clave "${elementKey}" no se encontró en el DOM.`);
    }
}

export function initializeJuanizador(textToAnalyze) {
    if (!DOMElements.juanizadorContainer.dataset.initialized) {
        console.log("DEBUG: Asignando listeners del Juanizador por primera vez.");
        
        safeAddEventListener('juanizadorBackToDictationBtn', 'click', () => window.switchToDictationView());
        safeAddEventListener('juanizadorCategorizeBtn', 'click', categorizeFindings);
        safeAddEventListener('juanizadorGenerateReportBtn', 'click', generateCompleteReport); // Apunta a la nueva función
        safeAddEventListener('juanizadorClearBtn', 'click', () => {
            if (DOMElements.juanizadorTranscriptArea) DOMElements.juanizadorTranscriptArea.value = '';
            if (DOMElements.juanizadorCategorizedContent) DOMElements.juanizadorCategorizedContent.innerHTML = '';
            if (DOMElements.juanizadorFinalReport) DOMElements.juanizadorFinalReport.textContent = 'El informe generado aparecerá aquí...';
            DOMElements.juanizadorCategorizeBtn.dataset.categorized = "false";
        });

        const selectorsToWatch = [
            'juanizadorImagingTechnique', 'juanizadorTacScope', 'juanizadorRmType', 'juanizadorContrastUse'
        ];
        selectorsToWatch.forEach(key => safeAddEventListener(key, 'change', updateAvailableCategories));
        
        document.querySelectorAll('#phase-container input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', updateAvailableCategories);
        });

        DOMElements.juanizadorContainer.dataset.initialized = 'true';
    }
    
    if (DOMElements.juanizadorTranscriptArea) {
        DOMElements.juanizadorTranscriptArea.value = textToAnalyze;
        categorizedFindings = {};
        DOMElements.juanizadorCategorizedContent.innerHTML = '';
        DOMElements.juanizadorFinalReport.textContent = 'El informe generado aparecerá aquí...';
        DOMElements.juanizadorCategorizeBtn.dataset.categorized = "false";
    }
    
    updateAvailableCategories();
}
