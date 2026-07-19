// ============================================================
// core/firebase.js — LIGAÇÃO AO FIREBASE (camada CORE)
// Inicializa o app Firebase e expõe `auth` (login) e `db` (base de dados
// partilhada, Realtime Database). Carrega o SDK por CDN (ES modules), sem
// passo de build. Reexporta as funções do SDK para os outros módulos (storage,
// auth) usarem sem repetir a versão do CDN.
//
// NOTA: a `apiKey` NÃO é um segredo — é pública por design numa app web. A
// segurança real vem das regras da base de dados (só `auth != null`) e do login.
// ============================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getDatabase, ref, get, set, onValue } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAouAAY1xDnFQNy_DYS-oo6nK34gY6-NGo',
  authDomain: 'gestor-de-obra-d0cfd.firebaseapp.com',
  databaseURL: 'https://gestor-de-obra-d0cfd-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'gestor-de-obra-d0cfd',
  storageBucket: 'gestor-de-obra-d0cfd.firebasestorage.app',
  messagingSenderId: '1013407515832',
  appId: '1:1013407515832:web:145cc69c1c2ad74e4e604d',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Reexporta o SDK para storage.js / auth.js (única fonte da versão do CDN).
export { ref, get, set, onValue, signInWithEmailAndPassword, signOut, onAuthStateChanged };
