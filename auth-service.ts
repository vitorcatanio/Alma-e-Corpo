
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    setPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence,
    UserCredential, 
    User as FirebaseUser 
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "./firebase-config";
import { UserRole } from "./types";

/**
 * Cria um novo usuário no Firebase Authentication e salva seus dados no Realtime Database.
 */
export const cadastrarUsuario = async (email: string, password: string, nome: string, role: UserRole): Promise<UserCredential> => {
    try {
        // Por padrão, novos cadastros usam persistência local para conveniência
        await setPersistence(auth, browserLocalPersistence);
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salva os dados completos, incluindo o papel (role)
        await set(ref(database, 'users/' + user.uid), {
            id: user.uid,
            name: nome,
            email: email,
            role: role
        });

        console.log("Usuário cadastrado com sucesso no DB:", role);
        return userCredential;
    } catch (error: any) {
        console.error("Erro ao cadastrar usuário:", error.message);
        throw error;
    }
};

/**
 * Realiza o login permitindo escolher entre persistência local (lembrar) ou sessão (temporário).
 */
export const fazerLogin = async (email: string, password: string, lembrarMe: boolean): Promise<FirebaseUser | undefined> => {
    try {
        // Define o tipo de persistência antes de realizar o login
        const persistenceType = lembrarMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistenceType);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw error;
    }
};
