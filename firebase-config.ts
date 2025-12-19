
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBIAC3CvX_SoHnXZJZv3S0kqeN3ofRHg7U",
  authDomain: "treyo-77c7a.firebaseapp.com",
  databaseURL: "https://treyo-77c7a-default-rtdb.firebaseio.com",
  projectId: "treyo-77c7a",
  storageBucket: "treyo-77c7a.firebasestorage.app",
  messagingSenderId: "819166847914",
  appId: "1:819166847914:web:4ab743f62e0992330501d3",
  measurementId: "G-FER58V13NM"
};

// Inicialização segura do Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Em ambientes ESM/CDN, os componentes de serviço (auth, database) 
 * registram-se no core do Firebase via efeitos colaterais.
 * Chamar getAuth(app) e getDatabase(app) aqui garante que a 
 * instância correta seja vinculada e exportada.
 */
export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app);

export default app;
