
import { ref, set, get, child } from "firebase/database";
import { database } from "../firebase-config";
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, UserRole, SportType, ActivityLog, ChatMessage, CalendarEvent, Badge, SpiritualPost, ReadingStats, SpiritualComment } from '../types';

class StorageService {
  private dbRef = ref(database);

  init() {
    // A inicialização agora é gerenciada pelo Firebase, mas mantemos o localStorage como cache rápido
    if (!localStorage.getItem('profiles')) localStorage.setItem('profiles', JSON.stringify([]));
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
    if (!localStorage.getItem('workouts')) localStorage.setItem('workouts', JSON.stringify([]));
    if (!localStorage.getItem('diets')) localStorage.setItem('diets', JSON.stringify([]));
    if (!localStorage.getItem('progress')) localStorage.setItem('progress', JSON.stringify([]));
    if (!localStorage.getItem('activity')) localStorage.setItem('activity', JSON.stringify([]));
    if (!localStorage.getItem('messages')) localStorage.setItem('messages', JSON.stringify([]));
    if (!localStorage.getItem('events')) localStorage.setItem('events', JSON.stringify([]));
    if (!localStorage.getItem('spiritual_posts')) localStorage.setItem('spiritual_posts', JSON.stringify([]));
  }

  // Persistência de Usuário no Database
  async saveUserToDb(user: User) {
    await set(ref(database, 'users/' + user.id), user);
    // Sync local storage cache
    const users = this.get<User>('users').filter(u => u.id !== user.id);
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }

  async getUserFromDb(userId: string): Promise<User | null> {
    const snapshot = await get(child(this.dbRef, `users/${userId}`));
    return snapshot.exists() ? snapshot.val() as User : null;
  }

  // Persistência de Perfil
  async saveProfile(profile: UserProfile) {
    if (!profile.userId) return;
    await set(ref(database, 'profiles/' + profile.userId), profile);
    
    // Atualiza cache local
    const localProfiles = this.get<UserProfile>('profiles').filter(p => p.userId !== profile.userId);
    localProfiles.push(profile);
    localStorage.setItem('profiles', JSON.stringify(localProfiles));
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    // Tenta cache local primeiro para velocidade
    const local = this.get<UserProfile>('profiles').find(p => p.userId === userId);
    if (local) return local;

    // Se não houver local, busca no Firebase
    const snapshot = await get(child(this.dbRef, `profiles/${userId}`));
    if (snapshot.exists()) {
      const profile = snapshot.val() as UserProfile;
      // Salva no cache
      const profiles = this.get<UserProfile>('profiles');
      profiles.push(profile);
      localStorage.setItem('profiles', JSON.stringify(profiles));
      return profile;
    }
    return undefined;
  }

  // Auxiliares LocalStorage (para compatibilidade de UI síncrona)
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  getUsers(): User[] { 
    const data = localStorage.getItem('users');
    return data ? JSON.parse(data) : [];
  }

  updateUser(updatedUser: Partial<User>) {
    const users = this.get<User>('users');
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      localStorage.setItem('users', JSON.stringify(users));
      // Sincroniza com Firebase
      if (updatedUser.id) {
          set(ref(database, 'users/' + updatedUser.id), users[index]);
      }
    }
  }

  // FIX: Adicionando deleteUser
  deleteUser(userId: string) {
    const users = this.get<User>('users').filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(users));
    set(ref(database, 'users/' + userId), null);
    set(ref(database, 'profiles/' + userId), null);
  }

  // Métodos de Treino, Dieta, etc
  getWorkouts(userId: string): WorkoutPlan[] { return this.get<WorkoutPlan>('workouts').filter(w => w.userId === userId); }
  saveWorkout(workout: WorkoutPlan) {
    let workouts = this.get<WorkoutPlan>('workouts');
    const index = workouts.findIndex(w => w.id === workout.id);
    if (index >= 0) workouts[index] = workout;
    else workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }

  getDiet(userId: string): DietPlan | undefined { return this.get<DietPlan>('diets').find(d => d.userId === userId); }
  saveDiet(diet: DietPlan) {
    const diets = this.get<DietPlan>('diets').filter(d => d.userId !== diet.userId);
    diets.push(diet);
    localStorage.setItem('diets', JSON.stringify(diets));
  }

  getProgress(userId: string): ProgressLog[] { 
    return this.get<ProgressLog>('progress').filter(p => p.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
  }
  addProgress(log: ProgressLog) { localStorage.setItem('progress', JSON.stringify([...this.get<ProgressLog>('progress'), log])); }
  
  getActivity(userId: string): ActivityLog[] { return this.get<ActivityLog>('activity').filter(a => a.userId === userId); }
  logActivity(log: ActivityLog) { localStorage.setItem('activity', JSON.stringify([...this.get<ActivityLog>('activity'), log])); }

  getMessages(userId1: string, userId2: string): ChatMessage[] {
    return this.get<ChatMessage>('messages').filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1)).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  sendMessage(msg: ChatMessage) { localStorage.setItem('messages', JSON.stringify([...this.get<ChatMessage>('messages'), msg])); }

  // FIX: Adicionando getEvents e addEvent
  getEvents(trainerId: string): CalendarEvent[] {
    return this.get<CalendarEvent>('events').filter(e => e.trainerId === trainerId).sort((a,b) => a.date.localeCompare(b.date));
  }

  addEvent(event: CalendarEvent) {
    const events = this.get<CalendarEvent>('events');
    events.push(event);
    localStorage.setItem('events', JSON.stringify(events));
  }

  getStudentEvents(userId: string): CalendarEvent[] {
    return this.get<CalendarEvent>('events').filter(e => e.type === 'global' || e.studentId === userId).sort((a,b) => a.date.localeCompare(b.date));
  }

  getReadingLeaderboard(): UserProfile[] {
    return this.get<UserProfile>('profiles').sort((a,b) => (b.readingStats?.daysCompleted || 0) - (a.readingStats?.daysCompleted || 0));
  }

  getSpiritualPosts(): SpiritualPost[] {
    return this.get<SpiritualPost>('spiritual_posts').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  addSpiritualPost(post: SpiritualPost) { localStorage.setItem('spiritual_posts', JSON.stringify([post, ...this.get<SpiritualPost>('spiritual_posts')])); }

  // FIX: Adicionando addSpiritualComment
  addSpiritualComment(postId: string, comment: SpiritualComment) {
    const posts = this.get<SpiritualPost>('spiritual_posts');
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
      if (!posts[index].comments) posts[index].comments = [];
      posts[index].comments.push(comment);
      localStorage.setItem('spiritual_posts', JSON.stringify(posts));
    }
  }

  // FIX: Implementando placeholders
  checkInReading(userId: string) {
    this.getProfile(userId).then(profile => {
      if (profile) {
        if (!profile.readingStats) {
          profile.readingStats = { daysCompleted: 0, streak: 0, lastReadDate: '' };
        }
        const today = new Date().toISOString().split('T')[0];
        if (profile.readingStats.lastReadDate !== today) {
          profile.readingStats.daysCompleted += 1;
          profile.readingStats.streak += 1;
          profile.readingStats.lastReadDate = today;
          profile.points += 50;
          this.saveProfile(profile);
        }
      }
    });
  }
  
  saveBookSuggestions(userId: string, suggestions: string[]) {
    this.getProfile(userId).then(profile => {
      if (profile) {
        profile.bookSuggestions = suggestions;
        this.saveProfile(profile);
      }
    });
  }
}

export const db = new StorageService();
