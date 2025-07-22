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
    9: "Describe SOLO los hallazgos en cámara gástrica y asas intestinales. Si no hay hallazgos, devuelve EXACTAMENTE: 'Cámara gástrica moderadamente distendida sin hallazgos relevantes. Asas intestinales de delgado y marco cólico sin engrosamientos parietales ni cambios de calibre significativos.'",
    10: "Describe SOLO líquido libre o adenopatías intra-abdominales. Si no hay hallazgos, devuelve EXACTAMENTE: 'No se observa líquido libre ni adenopatías intra-abdominales de aspecto patológico.'",
    11: "Describe SOLO hallazgos en aorta y grandes vasos mesentéricos. Si no hay hallazgos, devuelve EXACTAMENTE: 'Aorta y grandes vasos mesentéricos de calibre normal, sin hallazgos significativos.'",
    12: "Describe SOLO hallazgos en el esqueleto axial. Si no hay hallazgos, devuelve EXACTAMENTE: 'Esqueleto axial incluido en el estudio sin lesiones focales ni anomalías morfológicas relevantes.'",
    13: "Describe SOLO hallazgos que no correspondan a otras categorías. Si no hay hallazgos, devuelve EXACTAMENTE: 'No hay otros hallazgos relevantes que reportar.'",
    14: "Describe SOLO hallazgos en las bases pulmonares visibles. Si no hay hallazgos, devuelve EXACTAMENTE: 'En las bases pulmonares incluidas en el estudio no se observan hallazgos patológicos de significación.'",
    15: "Describe SOLO hallazgos en el hemiabdomen superior visible. Si no hay hallazgos, devuelve EXACTAMENTE: 'En el hemiabdomen superior incluido en el estudio no se objetivan hallazgos relevantes.'"
};


let DOMElementsJuanizador, categorizedFindings = {};

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
    
    const availableCats = window.availableCategories || [];
    const filteredCategories = anatomicalCategories.filter(cat => availableCats.includes(cat.id));
    const categoryNames = filteredCategories.map(cat => `${cat.id}. ${cat.name}`).join('\n');
    
    const prompt = `Eres un radiólogo experto. Categoriza los siguientes hallazgos en las categorías disponibles.
    Categorías Disponibles:\n${categoryNames}
    Hallazgos a Categorizar:\n"${transcript}"
    Devuelve un objeto JSON con claves de ID de categoría y valores como array de hallazgos. Incluye solo categorías con hallazgos. Devuelve SOLO el objeto JSON.`;
    
    try {
        const response = await queryGeminiAPI(prompt);
        if (!response) throw new Error('Respuesta vacía de la API.');
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('La respuesta no contiene un JSON válido.');

        categorizedFindings = JSON.parse(jsonMatch[0]);
        displayCategorizedFindings();
    } catch (error) {
        console.error('Error al categorizar:', error);
        alert('Hubo un error al categorizar los hallazgos.');
    } finally {
        setLoadingState('categorizing-loading', false);
    }
}

function displayCategorizedFindings() {
    const container = DOMElementsJuanizador.categorizedContent;
    container.innerHTML = '';
    // ... Lógica para mostrar los hallazgos categorizados ...
}

function updateAvailableCategories() {
    const tech = DOMElementsJuanizador.imagingTechnique.value;
    const tacContainer = DOMElementsJuanizador.tacScopeContainer;
    const rmContainer = DOMElementsJuanizador.rmTypeContainer;

    tacContainer.style.display = tech === 'tac' ? 'flex' : 'none';
    rmContainer.style.display = tech === 'rm' ? 'flex' : 'none';

    // ... Lógica para definir window.availableCategories ...
    
    updateTechniqueDescription();
}

function updateTechniqueDescription() {
    // ... Lógica para actualizar la descripción de la técnica ...
}

function setLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isLoading ? 'block' : 'none';
    }
}

function initSpeechRecognition() {
    // ... Lógica del SpeechRecognition si se quiere mantener ...
}


/**
 * Inicializa toda la lógica y los listeners del Juanizador.
 */
export function initializeJuanizador(textToAnalyze) {
    DOMElementsJuanizador = {
        container: document.getElementById('juanizador-container'),
        backToDictationBtn: document.getElementById('backToDictationBtn'),
        transcriptArea: document.getElementById('transcript'),
        categorizeBtn: document.getElementById('categorize-btn'),
        clearBtn: document.getElementById('clear-btn'),
        generateReportBtn: document.getElementById('generate-report-btn'),
        copyReportBtn: document.getElementById('copy-report-btn'),
        categorizedContent: document.getElementById('categorized-content'),
        imagingTechnique: document.getElementById('imaging-technique'),
        tacScopeContainer: document.getElementById('tac-scope-container'),
        rmTypeContainer: document.getElementById('rm-type-container'),
        // ... (añadir el resto de IDs del juanizador)
    };
    
    if (DOMElementsJuanizador.transcriptArea) {
        DOMElementsJuanizador.transcriptArea.value = textToAnalyze;
    }
    
    if (!DOMElementsJuanizador.container.dataset.initialized) {
        DOMElementsJuanizador.backToDictationBtn.addEventListener('click', () => {
            window.switchToDictationView();
        });
        
        DOMElementsJuanizador.categorizeBtn.addEventListener('click', categorizeFindings);
        
        DOMElementsJuanizador.clearBtn.addEventListener('click', () => {
            DOMElementsJuanizador.transcriptArea.value = '';
            DOMElementsJuanizador.categorizedContent.innerHTML = '';
            document.getElementById('final-report').textContent = 'El informe generado aparecerá aquí...';
        });

        // ... (resto de listeners del juanizador) ...
        
        DOMElementsJuanizador.container.dataset.initialized = 'true';
    }
    
    updateAvailableCategories();
}
