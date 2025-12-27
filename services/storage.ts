
import { ref, set, get, child, push, update, remove } from "firebase/database";
import { database } from "../firebase-config";
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, UserRole, SportType, ActivityLog, ChatMessage, CalendarEvent, BookReview, CommunityPost } from '../types';

class StorageService {
  private dbRef = ref(database);

  init() {
    // Não precisamos mais inicializar chaves no localStorage
  }

  // --- USUÁRIOS E PERFIS ---
  async getAllUsersFromDb(): Promise<User[]> {
    const snapshot = await get(child(this.dbRef, 'users'));
    return snapshot.exists() ? Object.values(snapshot.val()) as User[] : [];
  }

  async saveUserToDb(user: User) {
    await set(ref(database, 'users/' + user.id), user);
  }

  async getUserFromDb(userId: string): Promise<User | null> {
    const snapshot = await get(child(this.dbRef, `users/${userId}`));
    return snapshot.exists() ? snapshot.val() as User : null;
  }

  async saveProfile(profile: UserProfile) {
    if (!profile.userId) return;
    await set(ref(database, 'profiles/' + profile.userId), profile);
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const snapshot = await get(child(this.dbRef, `profiles/${userId}`));
    return snapshot.exists() ? snapshot.val() as UserProfile : undefined;
  }

  async updateUser(updatedUser: Partial<User>) {
    if (!updatedUser.id) return;
    await update(ref(database, 'users/' + updatedUser.id), updatedUser);
  }

  // --- TREINOS ---
  async getWorkouts(userId: string): Promise<WorkoutPlan[]> {
    const snapshot = await get(child(this.dbRef, `workouts/${userId}`));
    return snapshot.exists() ? Object.values(snapshot.val()) as WorkoutPlan[] : [];
  }

  async saveWorkout(workout: WorkoutPlan) {
    await set(ref(database, `workouts/${workout.userId}/${workout.id}`), workout);
  }

  // --- DIETAS ---
  async getDiet(userId: string): Promise<DietPlan | undefined> {
    const snapshot = await get(child(this.dbRef, `diets/${userId}`));
    return snapshot.exists() ? snapshot.val() as DietPlan : undefined;
  }

  async saveDiet(diet: DietPlan) {
    await set(ref(database, `diets/${diet.userId}`), diet);
  }

  // --- PROGRESSO/EVOLUÇÃO ---
  async getProgress(userId: string): Promise<ProgressLog[]> { 
    const snapshot = await get(child(this.dbRef, `progress/${userId}`));
    if (snapshot.exists()) {
        const logs = Object.values(snapshot.val()) as ProgressLog[];
        return logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
  }

  async addProgress(log: ProgressLog) { 
    await set(ref(database, `progress/${log.userId}/${log.id}`), log);
    const profile = await this.getProfile(log.userId);
    if (profile) {
        profile.weight = log.weight;
        profile.measurements = { ...profile.measurements, ...log.measurements };
        await this.saveProfile(profile);
    }
  }

  // --- MENSAGENS (CHAT) ---
  private getChatId(id1: string, id2: string) {
    return [id1, id2].sort().join('_');
  }

  async getMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    const chatId = this.getChatId(userId1, userId2);
    const snapshot = await get(child(this.dbRef, `messages/${chatId}`));
    if (snapshot.exists()) {
        const msgs = Object.values(snapshot.val()) as ChatMessage[];
        return msgs.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return [];
  }

  async sendMessage(msg: ChatMessage) {
    const chatId = this.getChatId(msg.senderId, msg.receiverId);
    await set(ref(database, `messages/${chatId}/${msg.id}`), msg);
  }

  // --- AGENDA/EVENTOS ---
  async getEvents(trainerId: string): Promise<CalendarEvent[]> {
    const snapshot = await get(child(this.dbRef, `events/${trainerId}`));
    return snapshot.exists() ? Object.values(snapshot.val()) as CalendarEvent[] : [];
  }
  
  async addEvent(event: CalendarEvent) {
    await set(ref(database, `events/${event.trainerId}/${event.id}`), event);
  }

  async deleteEvent(trainerId: string, eventId: string) {
    await remove(ref(database, `events/${trainerId}/${eventId}`));
  }
  
  // --- LEITURA ESPIRITUAL ---
  async getReadingLeaderboard(): Promise<(UserProfile & { userName: string, avatarUrl?: string })[]> {
    const profilesSnapshot = await get(child(this.dbRef, 'profiles'));
    const usersSnapshot = await get(child(this.dbRef, 'users'));
    if (!profilesSnapshot.exists()) return [];
    const profilesData = profilesSnapshot.val();
    const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};
    const leaderboard = Object.values(profilesData).map((p: any) => ({
        ...p,
        userName: usersData[p.userId]?.name || 'Membro Treyo',
        avatarUrl: usersData[p.userId]?.avatarUrl || null,
        points: p.points || 0
    }));
    return leaderboard.sort((a, b) => b.points - a.points);
  }

  async checkInReading(userId: string, book: string, chapter: number) {
    const profile = await this.getProfile(userId);
    if (profile) {
      if (!profile.readingStats) {
        profile.readingStats = { daysCompleted: 0, totalChaptersRead: 0, streak: 0, lastReadDate: '', readChapters: [] };
      }
      let chapters = profile.readingStats.readChapters ? [...profile.readingStats.readChapters] : [];
      const chapterID = `${book}-${chapter}`;
      const index = chapters.indexOf(chapterID);
      if (index !== -1) chapters.splice(index, 1);
      else chapters.push(chapterID);
      profile.readingStats.readChapters = chapters;
      profile.readingStats.totalChaptersRead = chapters.length;
      profile.points = chapters.length * 10;
      profile.level = Math.floor(profile.points / 500) + 1;
      const today = new Date().toISOString().split('T')[0];
      if (profile.readingStats.lastReadDate !== today && index === -1) {
        profile.readingStats.streak = (profile.readingStats.streak || 0) + 1;
        profile.readingStats.lastReadDate = today;
      }
      await this.saveProfile(profile);
      return profile;
    }
    return null;
  }

  // --- BIBLIOTECA (REVIEWS) ---
  async getBookReviews(): Promise<BookReview[]> {
    const snapshot = await get(child(this.dbRef, 'book_reviews'));
    if (snapshot.exists()) {
        const reviews = Object.values(snapshot.val()) as BookReview[];
        return reviews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [];
  }
  
  async saveBookReview(review: BookReview) {
    await set(ref(database, `book_reviews/${review.id}`), review);
  }

  // --- COMUNIDADE ---
  async getCommunityPosts(): Promise<CommunityPost[]> {
    const snapshot = await get(child(this.dbRef, 'community_posts'));
    if (snapshot.exists()) {
        const posts = Object.values(snapshot.val()) as CommunityPost[];
        return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [];
  }

  async addCommunityPost(post: CommunityPost) {
    await set(ref(database, `community_posts/${post.id}`), post);
  }
}

export const db = new StorageService();
