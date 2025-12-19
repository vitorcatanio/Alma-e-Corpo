import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Configuração do Firebase extraída do console
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

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Analytics (opcional em ambientes de desenvolvimento)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Exporta as referências dos serviços conforme solicitado
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;