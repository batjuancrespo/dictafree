// juanizador.js
// VERSIÓN CON TODAS LAS MEJORAS FINALES Y SINTAXIS CORREGIDA

import { DOMElements } from './domElements.js';
import { triggerBatmanTransition, updateCopyButtonState } from './ui.js';
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
    { id: 13, name: "Otros hallazgos", normal: null },
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

function generateTechniqueText() {
    const tech = DOMElements.juanizadorImagingTechnique.value;
    const withContrast = DOMElements.juanizadorContrastUse.value === 'con';
    
    if (tech === 'eco') {
        return "Exploración ecográfica con sonda multifrecuencia.";
    }
    
    if (tech === 'rm') {
        const rmType = DOMElements.juanizadorRmType.value;
        const contrastText = withContrast ? " y estudio dinámico tras la administración endovenosa de contraste" : "";
        switch(rmType) {
            case 'hepatica': return `Se realiza exploración abdominal con secuencias potenciadas en T1 en fase y fuera de fase, T2 sin y con saturación grasa, difusión${contrastText}.`;
            case 'colangio': return `Se realiza exploración abdominal con secuencias potenciadas en T1 en fase y fuera de fase, T2 sin y con saturación grasa, estudio dinámico tras la administración endovenosa de contraste completándose la valoración con cortes radiales respecto al colédoco orientados a la valoración de la via biliar.`;
            case 'entero': return `Se realiza exploración abdominal con secuencias potenciadas en T2, difusión y estudio dinámico tras la administración endovenosa de contraste previa distensión de las asas intestinales. Exploración orientada a la valoración de asas de intestino delgado.`;
            case 'fistulas': return `Se realiza exploración pélvica con secuencias potenciadas en T2 sin y con saturación grasa y difusión.`;
            case 'neo-pelvis': return `Se realiza exploración pélvica con secuencias potenciadas en T2 sin y con saturación grasa en los tres planos del espacio, difusión y estudio dinámico tras la administración endovenosa de contraste.`;
            default: return "";
        }
    }

    if (tech === 'tac') {
        const scope = DOMElements.juanizadorTacScope.options[DOMElements.juanizadorTacScope.selectedIndex].text;
        let text = `Se realiza exploración ${scope.toLowerCase()}`;
        
        if (withContrast) {
            text += " tras la administración endovenosa de contraste";
            const phasesCheckboxes = document.querySelectorAll('#phase-container input[type="checkbox"]:checked');
            const phases = Array.from(phasesCheckboxes).map(cb => cb.value);
            if (phases.length > 0) {
                text += ` con adquisición de imágenes en fase ${phases.join(' y ')}`;
            }
        } else {
            text += " sin administración endovenosa de contraste";
        }
        return text + ".";
    }
    return "";
}

async function generateCompleteReport() {
    if (!DOMElements.juanizadorCategorizeBtn.dataset.categorized) {
        alert('Primero debe categorizar los hallazgos.');
        return;
    }
    
    setLoadingState('juanizadorReportLoading', true);
    DOMElements.juanizadorFinalReport.textContent = 'Generando contenido del informe...';

    const tech = DOMElements.juanizadorImagingTechnique.value;
    const vocabularyInstructions = { 'tac': "TAC", 'rm': "Resonancia Magnética (RM)", 'eco': "Ecografía" };
    const modalityInstruction = vocabularyInstructions[tech] || "genérica";

    const reportCategories = anatomicalCategories.filter(c => window.availableCategories.includes(c.id));
    
    let findingsList = [];
    reportCategories.forEach(category => {
        const findings = categorizedFindings[category.id.toString()];
        if (findings && findings.length > 0) {
            findingsList.push({ category: category.name, findings: findings.join('. ') });
        }
    });

    const finalPrompt = `
Eres un radiólogo experto. Tu tarea es generar el texto para un informe.
Usa vocabulario de ${modalityInstruction}.

**Tarea 1: Hallazgos Anormales**
Para cada categoría en esta lista, redacta un párrafo profesional describiendo los hallazgos:
${JSON.stringify(findingsList)}

**Tarea 2: Conclusión**
Basado SOLAMENTE en los hallazgos anormales de la lista anterior, genera una conclusión concisa de 2-3 líneas resumiendo lo más importante. Si la lista de hallazgos está vacía, la conclusión debe ser "No se observan alteraciones radiológicas significativas."

**Formato de Salida Obligatorio:**
Devuelve un único objeto JSON con dos claves: "report_paragraphs" y "conclusion".
"report_paragraphs" debe ser un objeto donde cada clave es el nombre de la categoría y el valor es el párrafo que has redactado.
Si la lista de hallazgos anormales está vacía, "report_paragraphs" debe ser un objeto vacío {}.`;

    let aiContent;
    try {
        const response = await queryGeminiAPI(finalPrompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('La respuesta de la IA no es un JSON válido.');
        aiContent = JSON.parse(jsonMatch[0]);
    } catch (e) {
        DOMElements.juanizadorFinalReport.textContent = "Error al generar el contenido con la IA. Revisa la consola.";
        setLoadingState('juanizadorReportLoading', false);
        return;
    }

    DOMElements.juanizadorFinalReport.textContent = 'Ensamblando informe final...';

    const techniqueText = generateTechniqueText();
    let findingsText = "";
    
    reportCategories.forEach(category => {
        if (aiContent.report_paragraphs && aiContent.report_paragraphs[category.name]) {
            findingsText += aiContent.report_paragraphs[category.name] + '\n';
        } else if (category.normal) {
            findingsText += category.normal + '\n';
        }
    });

    const conclusionText = aiContent.conclusion || "No se observan alteraciones radiológicas significativas.";
    const fullReport = `${techniqueText}\n\n${findingsText.trim()}\n\n${conclusionText.trim()}`;
    
    DOMElements.juanizadorFinalReport.textContent = fullReport;
    setLoadingState('juanizadorReportLoading', false);
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
    }
    DOMElements.juanizadorCategorizeBtn.dataset.categorized = "true";
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
        
        safeAddEventListener('juanizadorBackToDictationBtn', 'click', () => {
            const reportText = DOMElements.juanizadorFinalReport.textContent;
            const placeholderText = 'El informe generado aparecerá aquí...';
            
            if (reportText && reportText !== placeholderText) {
                const technique = generateTechniqueText();
                const bodyOfReport = reportText.replace(technique, '').trim();
                
                DOMElements.headerArea.value = technique;
                DOMElements.polishedTextarea.value = bodyOfReport;
                updateCopyButtonState();
            }
            window.switchToDictationView();
        });
        
        safeAddEventListener('juanizadorCategorizeBtn', 'click', categorizeFindings);
        safeAddEventListener('juanizadorGenerateReportBtn', 'click', generateCompleteReport);
        
        safeAddEventListener('juanizadorCopyReportBtn', 'click', () => {
            const textToCopy = DOMElements.juanizadorFinalReport.textContent;
            if (textToCopy && textToCopy !== 'El informe generado aparecerá aquí...') {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        alert("Informe final copiado al portapapeles.");
                        triggerBatmanTransition();
                    })
                    .catch(err => console.error("Error al copiar el informe final:", err));
            } else {
                alert("No hay informe generado para copiar.");
            }
        });

        safeAddEventListener('juanizadorClearBtn', 'click', () => {
            if (DOMElements.juanizadorTranscriptArea) DOMElements.juanizadorTranscriptArea.value = '';
            if (DOMElements.juanizadorCategorizedContent) DOMElements.juanizadorCategorizedContent.innerHTML = '';
            if (DOMElements.juanizadorFinalReport) DOMElements.juanizadorFinalReport.textContent = 'El informe generado aparecerá aquí...';
            if (DOMElements.juanizadorCategorizeBtn) DOMElements.juanizadorCategorizeBtn.dataset.categorized = "false";
        });

        const selectorsToWatch = ['juanizadorImagingTechnique', 'juanizadorTacScope', 'juanizadorRmType', 'juanizadorContrastUse'];
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
