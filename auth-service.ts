import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, UserCredential, User } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "./firebase-config";

/**
 * Cria um novo usuário no Firebase Authentication e salva seus dados no Realtime Database.
 * 
 * @param email - O email do usuário.
 * @param password - A senha do usuário.
 * @param nome - O nome completo do usuário.
 * @returns Uma Promise que resolve com a UserCredential do usuário criado.
 */
export const cadastrarUsuario = async (email: string, password: string, nome: string): Promise<UserCredential> => {
    try {
        // Cria o usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salva os dados adicionais (nome e e-mail) no Realtime Database
        // Usa o UID do usuário recém-criado como chave no nó 'users'
        await set(ref(database, 'users/' + user.uid), {
            nome: nome,
            email: email
        });

        console.log("Usuário cadastrado e dados salvos no Database com sucesso:", user.uid);
        return userCredential;
    } catch (error: any) {
        console.error("Erro ao cadastrar usuário no Firebase:", error.code, error.message);
        alert("Erro ao realizar cadastro: " + error.message);
        throw error;
    }
};

/**
 * Realiza o login de um usuário existente no Firebase Authentication.
 * 
 * @param email - O email do usuário.
 * @param password - A senha do usuário.
 * @returns Uma Promise que resolve com o objeto User em caso de sucesso.
 */
export const fazerLogin = async (email: string, password: string): Promise<User | undefined> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Usuário logado com sucesso:", userCredential.user.uid);
        return userCredential.user;
    } catch (error: any) {
        console.error("Erro ao fazer login no Firebase:", error.code, error.message);
        alert("Erro ao fazer login: " + error.message);
        return undefined;
    }
};

/**
 * Verifica o estado atual de login do usuário.
 * Utiliza o onAuthStateChanged para obter o usuário logado de forma assíncrona.
 * 
 * @returns Uma Promise que resolve com o objeto User se logado, ou null.
 */
export const verificarEstadoLogin = (): Promise<User | null> => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Para de ouvir após a primeira resposta
            resolve(user);
        }, (error) => {
            console.error("Erro ao verificar estado de login:", error);
            resolve(null);
        });
    });
};
