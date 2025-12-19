
import { ref, set, get, child, remove } from "firebase/database";
import { database } from "../firebase-config";
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, UserRole, SportType, ActivityLog, ChatMessage, CalendarEvent, BookReview, WishlistBook, LibraryComment, SpiritualPost } from '../types';

class StorageService {
  private dbRef = ref(database);

  init() {
    const keys = ['profiles', 'users', 'workouts', 'diets', 'progress', 'activity', 'messages', 'events', 'spiritual_posts', 'book_reviews', 'book_wishlist'];
    keys.forEach(key => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
    });
  }

  private getLocal<T>(key: string): T[] {
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
      const profile = snapshot.val() as UserProfile;
      const profiles = this.getLocal<UserProfile>('profiles').filter(p => p.userId !== userId);
      profiles.push(profile);
      this.setLocal('profiles', profiles);
      return profile;
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

  getProgress(userId: string): ProgressLog[] { 
    return this.getLocal<ProgressLog>('progress').filter(p => p.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
  }
  addProgress(log: ProgressLog) { this.setLocal('progress', [...this.getLocal<ProgressLog>('progress'), log]); }

  // Retrieves the activity history for a specific user
  getActivity(userId: string): ActivityLog[] {
    return this.getLocal<ActivityLog>('activity').filter(a => a.userId === userId);
  }

  getMessages(userId1: string, userId2: string): ChatMessage[] {
    return this.getLocal<ChatMessage>('messages').filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1)).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  sendMessage(msg: ChatMessage) { this.setLocal('messages', [...this.getLocal<ChatMessage>('messages'), msg]); }

  getEvents(trainerId: string): CalendarEvent[] {
    return this.getLocal<CalendarEvent>('events').filter(e => e.trainerId === trainerId).sort((a,b) => a.date.localeCompare(b.date));
  }
  addEvent(event: CalendarEvent) { this.setLocal('events', [...this.getLocal<CalendarEvent>('events'), event]); }
  deleteEvent(eventId: string) { this.setLocal('events', this.getLocal<CalendarEvent>('events').filter(e => e.id !== eventId)); }

  async rsvpToEvent(eventId: string, userId: string, attending: boolean) {
    const events = this.getLocal<CalendarEvent>('events');
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        let attendees = events[index].attendees || [];
        if (attending) { if (!attendees.includes(userId)) attendees.push(userId); }
        else { attendees = attendees.filter(id => id !== userId); }
        events[index].attendees = attendees;
        this.setLocal('events', events);
    }
  }

  getStudentEvents(userId: string): CalendarEvent[] {
    return this.getLocal<CalendarEvent>('events').filter(e => e.type === 'global' || e.studentId === userId).sort((a,b) => a.date.localeCompare(b.date));
  }

  // SOCIAL LIBRARY METHODS
  getBookReviews(): BookReview[] {
    return this.getLocal<BookReview>('book_reviews').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  saveBookReview(review: BookReview) {
    const reviews = this.getLocal<BookReview>('book_reviews');
    this.setLocal('book_reviews', [review, ...reviews]);
  }

  addReviewComment(reviewId: string, comment: LibraryComment) {
    const reviews = this.getLocal<BookReview>('book_reviews');
    const index = reviews.findIndex(r => r.id === reviewId);
    if (index !== -1) {
        if (!reviews[index].comments) reviews[index].comments = [];
        reviews[index].comments.push(comment);
        this.setLocal('book_reviews', reviews);
    }
  }

  getWishlist(userId: string): WishlistBook[] {
    return this.getLocal<WishlistBook>('book_wishlist').filter(w => w.userId === userId);
  }

  addToWishlist(wish: WishlistBook) {
    const wishlist = this.getLocal<WishlistBook>('book_wishlist');
    // Evitar duplicados
    if (!wishlist.find(w => w.userId === wish.userId && w.title === wish.title)) {
        this.setLocal('book_wishlist', [...wishlist, wish]);
    }
  }

  removeFromWishlist(wishId: string) {
    this.setLocal('book_wishlist', this.getLocal<WishlistBook>('book_wishlist').filter(w => w.id !== wishId));
  }

  getReadingLeaderboard(): UserProfile[] {
    return this.getLocal<UserProfile>('profiles').sort((a,b) => (b.readingStats?.daysCompleted || 0) - (a.readingStats?.daysCompleted || 0));
  }

  async checkInReading(userId: string) {
    const profile = await this.getProfile(userId);
    if (profile) {
      if (!profile.readingStats) profile.readingStats = { daysCompleted: 0, streak: 0, lastReadDate: '' };
      const today = new Date().toISOString().split('T')[0];
      if (profile.readingStats.lastReadDate !== today) {
        profile.readingStats.daysCompleted += 1;
        profile.readingStats.streak += 1;
        profile.readingStats.lastReadDate = today;
        profile.points = (profile.points || 0) + 50;
        await this.saveProfile(profile);
      }
    }
  }

  // Retrieves all spiritual reflection posts from the community storage
  getSpiritualPosts(): SpiritualPost[] {
    return this.getLocal<SpiritualPost>('spiritual_posts').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Adds a new spiritual reflection post to the community feed
  addSpiritualPost(post: SpiritualPost) {
    const posts = this.getLocal<SpiritualPost>('spiritual_posts');
    this.setLocal('spiritual_posts', [post, ...posts]);
  }
}

export const db = new StorageService();