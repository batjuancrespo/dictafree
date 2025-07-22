// firebase.js
// Inicializa Firebase y exporta los servicios principales (db, auth)
// para que otros módulos puedan importarlos.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// La configuración está definida en el objeto window en index.html
const firebaseConfig = window.firebaseConfig;

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("DEBUG: Firebase inicializado y servicios exportados desde firebase.js.");
    // Dispara el evento personalizado para que app.js sepa que está listo
    document.dispatchEvent(new CustomEvent('firebaseReady'));
} catch (error) {
    console.error("Error crítico inicializando Firebase en firebase.js:", error);
    alert("Error crítico: No se pudo inicializar Firebase. La aplicación no funcionará.");
}

// Exporta los servicios y las funciones específicas que usaremos en la app
export {
    db,
    auth,
    doc,
    getDoc,
    setDoc,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};
