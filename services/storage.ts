
import { ref, set, get, child, remove, update } from "firebase/database";
import { database } from "../firebase-config";
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, UserRole, SportType, ActivityLog, ChatMessage, CalendarEvent, BookReview, WishlistBook, LibraryComment, SpiritualPost, CommunityPost } from '../types';

class StorageService {
  private dbRef = ref(database);

  init() {
    const keys = [
      'profiles', 'users', 'workouts', 'diets', 'progress', 'activity', 
      'messages', 'events', 'spiritual_posts', 'book_reviews', 
      'book_wishlist', 'community_posts'
    ];
    keys.forEach(key => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
    });
  }

  public getLocal<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setLocal<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getAllUsersFromDb(): Promise<User[]> {
    const snapshot = await get(child(this.dbRef, 'users'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const users = Object.values(data) as User[];
      this.setLocal('users', users);
      return users;
    }
    return [];
  }

  async saveUserToDb(user: User) {
    await set(ref(database, 'users/' + user.id), user);
    const users = this.getLocal<User>('users').filter(u => u.id !== user.id);
    users.push(user);
    this.setLocal('users', users);
  }

  async getUserFromDb(userId: string): Promise<User | null> {
    const snapshot = await get(child(this.dbRef, `users/${userId}`));
    return snapshot.exists() ? snapshot.val() as User : null;
  }

  async saveProfile(profile: UserProfile) {
    if (!profile.userId) return;
    await set(ref(database, 'profiles/' + profile.userId), profile);
    const localProfiles = this.getLocal<UserProfile>('profiles').filter(p => p.userId !== profile.userId);
    localProfiles.push(profile);
    this.setLocal('profiles', localProfiles);
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const snapshot = await get(child(this.dbRef, `profiles/${userId}`));
    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    return this.getLocal<UserProfile>('profiles').find(p => p.userId === userId);
  }

  updateUser(updatedUser: Partial<User>) {
    const users = this.getLocal<User>('users');
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      this.setLocal('users', users);
      if (updatedUser.id) set(ref(database, 'users/' + updatedUser.id), users[index]);
    }
  }

  getWorkouts(userId: string): WorkoutPlan[] { return this.getLocal<WorkoutPlan>('workouts').filter(w => w.userId === userId); }
  saveWorkout(workout: WorkoutPlan) {
    let workouts = this.getLocal<WorkoutPlan>('workouts');
    const index = workouts.findIndex(w => w.id === workout.id);
    if (index >= 0) workouts[index] = workout;
    else workouts.push(workout);
    this.setLocal('workouts', workouts);
  }

  getDiet(userId: string): DietPlan | undefined { return this.getLocal<DietPlan>('diets').find(d => d.userId === userId); }
  saveDiet(diet: DietPlan) {
    const diets = this.getLocal<DietPlan>('diets').filter(d => d.userId !== diet.userId);
    diets.push(diet);
    this.setLocal('diets', diets);
  }

  async getProgress(userId: string): Promise<ProgressLog[]> { 
    const snapshot = await get(child(this.dbRef, `progress/${userId}`));
    if (snapshot.exists()) {
        const data = snapshot.val();
        const logs = Object.values(data) as ProgressLog[];
        return logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
  }

  async addProgress(log: ProgressLog) { 
    const progressRef = ref(database, `progress/${log.userId}/${log.id}`);
    await set(progressRef, log);
    const profile = await this.getProfile(log.userId);
    if (profile) {
        profile.weight = log.weight;
        profile.measurements = { ...profile.measurements, ...log.measurements };
        await this.saveProfile(profile);
    }
  }

  getMessages(userId1: string, userId2: string): ChatMessage[] {
    return this.getLocal<ChatMessage>('messages').filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1)).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  sendMessage(msg: ChatMessage) { this.setLocal('messages', [...this.getLocal<ChatMessage>('messages'), msg]); }

  getEvents(trainerId: string): CalendarEvent[] {
    return this.getLocal<CalendarEvent>('events').filter(e => e.trainerId === trainerId).sort((a,b) => a.date.localeCompare(b.date));
  }
  
  // Fix: Added missing addEvent method to StorageService
  addEvent(event: CalendarEvent) {
    const events = this.getLocal<CalendarEvent>('events');
    events.push(event);
    this.setLocal('events', events);
  }

  // Fix: Added missing deleteEvent method to StorageService
  deleteEvent(eventId: string) {
    const events = this.getLocal<CalendarEvent>('events').filter(e => e.id !== eventId);
    this.setLocal('events', events);
  }
  
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

      if (index !== -1) {
        chapters.splice(index, 1);
      } else {
        chapters.push(chapterID);
      }

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

  getBookReviews(): BookReview[] {
    return this.getLocal<BookReview>('book_reviews').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  saveBookReview(review: BookReview) {
    let reviews = this.getLocal<BookReview>('book_reviews');
    const index = reviews.findIndex(r => r.id === review.id);
    if (index !== -1) reviews[index] = review;
    else reviews = [review, ...reviews];
    this.setLocal('book_reviews', reviews);
  }

  getSpiritualPosts(): SpiritualPost[] {
    return this.getLocal<SpiritualPost>('spiritual_posts').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getCommunityPosts(): CommunityPost[] {
    return this.getLocal<CommunityPost>('community_posts').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addCommunityPost(post: CommunityPost) {
    const posts = this.getLocal<CommunityPost>('community_posts');
    this.setLocal('community_posts', [...posts, post]);
  }
}

export const db = new StorageService();
