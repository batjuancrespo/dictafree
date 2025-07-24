// juanizador.js
// VERSIÓN CON ARQUITECTURA CORREGIDA - USA DOM ELEMENTS CENTRALIZADO

import { DOMElements } from './domElements.js';
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = 'AIzaSyBsKWbE6KgNaolK9BxDNDdviNw3pM7sOv0';
const MODEL_NAME = 'gemini-2.0-flash-lite';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const anatomicalCategories = [
    { id: 0, name: "Tiroides/glándula tiroidea" }, { id: 1, name: "Estructuras mediastínicas vasculares y/o corazón" }, { id: 2, name: "Adenopatías mediastínicas" },
    { id: 3, name: "Parénquima pulmonar" }, { id: 4, name: "Derrame pleural y cambios secundarios" }, { id: 5, name: "Hígado, porta y confluente esplenomesentérico venoso" },
    { id: 6, name: "Vesícula y vía biliar" }, { id: 7, name: "Páncreas" }, { id: 8, name: "Bazo, glándulas suprarrenales, riñones, vías excretoras, uréteres y vejiga urinaria" },
    { id: 9, name: "Cámara gástrica, asas intestinales" }, { id: 10, "name": "Líquido libre o adenopatías intra-abdominales" }, { id: 11, name: "Aorta y grandes vasos mesentéricos" },
    { id: 12, name: "Esqueleto axial" }, { id: 13, name: "Otros hallazgos" }, { id: 14, name: "Bases pulmonares incluidas en el estudio" }, { id: 15, name: "Hemiabdomen superior incluido en el estudio" }
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
    
    setLoadingState(DOMElements.juanizadorCategorizingLoading, true);
    
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
        setLoadingState(DOMElements.juanizadorCategorizingLoading, false);
    }
}

async function generateCompleteReportOptimized() {
    if (!categorizedFindings || Object.keys(categorizedFindings).length === 0) {
        alert('Primero debe categorizar los hallazgos.');
        return;
    }
    
    setLoadingState(DOMElements.juanizadorReportLoading, true);
    DOMElements.juanizadorFinalReport.textContent = 'Generando informe completo, por favor espere...';

    const tech = DOMElements.juanizadorImagingTechnique.value;
    const vocabularyInstructions = {
        'tac': "Utiliza terminología de Tomografía Computarizada (TAC).",
        'rm': "Utiliza terminología de Resonancia Magnética (RM).",
        'eco': "Utiliza terminología de Ecografía."
    };
    const modalityInstruction = vocabularyInstructions[tech] || "Redacta un párrafo conciso y profesional.";

    let reportOrder = anatomicalCategories.filter(c => window.availableCategories.includes(c.id));
    
    let findingsForPrompt = "Hallazgos por categoría:\n";
    for(const category of reportOrder) {
        const findings = categorizedFindings[category.id.toString()];
        if(findings && findings.length > 0) {
            findingsForPrompt += `- ${category.name}: ${findings.join('. ')}\n`;
        }
    }

    const finalPrompt = `Eres un radiólogo experto. Tu tarea es generar un informe radiológico estructurado.
Sigue estas instrucciones estrictamente:
1.  **Instrucción de Estilo General:** ${modalityInstruction}
2.  **Genera un párrafo para cada categoría anatómica** que tenga hallazgos. Si una categoría no tiene hallazgos, NO la menciones.
3.  **Mantén el orden** de las categorías que te proporciono.
4.  **Redacta cada párrafo** de forma profesional y concisa.
5.  **Al final de todo**, añade una sección llamada "CONCLUSIÓN:" que resuma los 2-3 hallazgos más importantes. Si no hay hallazgos significativos, la conclusión debe ser "No se observan alteraciones radiológicas significativas."

${findingsForPrompt}

Ahora, genera el informe completo (HALLAZGOS y CONCLUSIÓN).`;

    try {
        const fullReport = await queryGeminiAPI(finalPrompt);
        DOMElements.juanizadorFinalReport.textContent = fullReport || "La API no generó un informe. Inténtalo de nuevo.";
    } catch (e) {
        DOMElements.juanizadorFinalReport.textContent = "Error al generar el informe. Revisa la consola.";
    } finally {
        setLoadingState(DOMElements.juanizadorReportLoading, false);
    }
}

function displayCategorizedFindings() {
    const container = DOMElements.juanizadorCategorizedContent;
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
    const tech = DOMElements.juanizadorImagingTechnique.value;
    const tacScope = DOMElements.juanizadorTacScope.value;
    const rmType = DOMElements.juanizadorRmType.value;
    
    DOMElements.juanizadorTacScopeContainer.style.display = tech === 'tac' ? 'flex' : 'none';
    DOMElements.juanizadorRmTypeContainer.style.display = tech === 'rm' ? 'flex' : 'none';
    DOMElements.juanizadorContrastContainer.style.display = (tech === 'tac' || tech === 'rm') ? 'flex' : 'none';
    
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
    } else {
        categories = [5, 6, 7, 8, 9, 10, 11, ...baseCategories];
    }
    window.availableCategories = categories;
}

function setLoadingState(loadingElement, isLoading) {
    if (loadingElement) {
        loadingElement.style.display = isLoading ? 'block' : 'none';
    }
}

export function initializeJuanizador(textToAnalyze) {
    console.log("DEBUG: Inicializando Juanizador...");
    
    if (DOMElements.juanizadorTranscriptArea) {
        DOMElements.juanizadorTranscriptArea.value = textToAnalyze;
        categorizedFindings = {};
        DOMElements.juanizadorCategorizedContent.innerHTML = '';
        DOMElements.juanizadorFinalReport.textContent = 'El informe generado aparecerá aquí...';
    }
    
    if (!DOMElements.juanizadorContainer.dataset.initialized) {
        console.log("DEBUG: Asignando listeners del Juanizador por primera vez.");
        
        DOMElements.juanizadorBackToDictationBtn.addEventListener('click', () => {
            window.switchToDictationView();
        });
        
        DOMElements.juanizadorCategorizeBtn.addEventListener('click', categorizeFindings);
        
        DOMElements.juanizadorGenerateReportBtn.addEventListener('click', generateCompleteReportOptimized);
        
        DOMElements.juanizadorClearBtn.addEventListener('click', () => {
            DOMElements.juanizadorTranscriptArea.value = '';
            DOMElements.juanizadorCategorizedContent.innerHTML = '';
            DOMElements.juanizadorFinalReport.textContent = 'El informe generado aparecerá aquí...';
        });

        [
            DOMElements.juanizadorImagingTechnique, 
            DOMElements.juanizadorTacScope, 
            DOMElements.juanizadorRmType, 
            DOMElements.juanizadorContrastUse
        ].forEach(el => {
            if(el) el.addEventListener('change', updateAvailableCategories);
        });
        
        DOMElements.juanizadorContainer.dataset.initialized = 'true';
        console.log("DEBUG: Listeners del Juanizador asignados.");
    }
    
    updateAvailableCategories();
}
