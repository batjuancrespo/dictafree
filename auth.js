// auth.js
// Gestiona el flujo de autenticación de usuarios: registro, inicio y cierre de sesión.

import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';
import { AppState } from './state.js';
import { DOMElements } from './domElements.js';
import { loadUserVocabularyFromFirestore } from './api.js';
import { initializeDictationApp } from './app.js';

let isAppInitialized = false;

function getFirebaseErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email': return 'El formato del email no es válido.';
        case 'auth/user-disabled': return 'Esta cuenta de usuario ha sido deshabilitada.';
        case 'auth/user-not-found': return 'No se encontró usuario con este email.';
        case 'auth/wrong-password': return 'La contraseña es incorrecta.';
        case 'auth/email-already-in-use': return 'Este email ya está registrado.';
        case 'auth/weak-password': return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
        default: return "Error desconocido de autenticación. Revisa la consola.";
    }
}

function handleLogin(e) {
    e.preventDefault();
    const { loginEmailInput, loginPasswordInput, loginErrorDiv, loginButton } = DOMElements;
    loginButton.disabled = true;
    loginErrorDiv.textContent = '';
    signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value)
        .catch(error => loginErrorDiv.textContent = getFirebaseErrorMessage(error))
        .finally(() => loginButton.disabled = false);
}

function handleSignup(e) {
    e.preventDefault();
    const { signupEmailInput, signupPasswordInput, signupErrorDiv, signupButton } = DOMElements;
    signupButton.disabled = true;
    signupErrorDiv.textContent = '';
    createUserWithEmailAndPassword(auth, signupEmailInput.value, signupPasswordInput.value)
        .catch(error => signupErrorDiv.textContent = getFirebaseErrorMessage(error))
        .finally(() => signupButton.disabled = false);
}

function handleLogout() {
    signOut(auth).catch(error => console.error('Error al cerrar sesión:', error));
}

function setupAuthListeners() {
    const { loginForm, signupForm, logoutButton, showLoginLink, showSignupLink } = DOMElements;
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    logoutButton.addEventListener('click', handleLogout);

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
}

function handleAuthStateChange(user) {
    const { authContainer, appContainer, userDisplaySpan } = DOMElements;
    if (user) {
        AppState.currentUserId = user.uid;
        document.body.classList.remove('logged-out');
        document.body.classList.add('logged-in');
        authContainer.style.display = 'none';
        
        window.switchToDictationView();
        
        userDisplaySpan.textContent = user.email || 'Usuario';
        
        loadUserVocabularyFromFirestore(user.uid).then(() => {
            if (!isAppInitialized) {
                initializeDictationApp();
                isAppInitialized = true;
            }
        });

    } else {
        AppState.currentUserId = null;
        document.body.classList.remove('logged-in');
        document.body.classList.add('logged-out');
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        DOMElements.juanizadorContainer.style.display = 'none';
        userDisplaySpan.textContent = '';
        isAppInitialized = false;

        if (AppState.mediaRecorder && AppState.mediaRecorder.state !== 'inactive') {
            AppState.mediaRecorder.stop();
        }
    }
}

/**
 * Inicializa todo el sistema de autenticación.
 */
export function initializeAuth() {
    setupAuthListeners();
    onAuthStateChanged(auth, handleAuthStateChange);
    console.log("DEBUG: Sistema de autenticación inicializado y listener de estado asignado.");
}
