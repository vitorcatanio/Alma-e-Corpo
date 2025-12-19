
// Fix: Added missing methods getReadingLeaderboard and getStudentEvents to StorageService

import { ref, set, get, child, remove, onValue } from "firebase/database";
import { database } from "../firebase-config";
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, UserRole, SportType, ActivityLog, ChatMessage, CalendarEvent, Badge, SpiritualPost, ReadingStats, SpiritualComment } from '../types';

class StorageService {
  private dbRef = ref(database);

  init() {
    // Inicialização local para fallback
    if (!localStorage.getItem('profiles')) localStorage.setItem('profiles', JSON.stringify([]));
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
    if (!localStorage.getItem('events')) localStorage.setItem('events', JSON.stringify([]));
  }

  async getAllUsersFromDb(): Promise<User[]> {
    const snapshot = await get(child(this.dbRef, 'users'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as User[];
    }
    return [];
  }

  async getAllProfilesFromDb(): Promise<UserProfile[]> {
    const snapshot = await get(child(this.dbRef, 'profiles'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as UserProfile[];
    }
    return [];
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

  private getLocal<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  updateUser(updatedUser: Partial<User>) {
    if (updatedUser.id) {
        set(ref(database, 'users/' + updatedUser.id), updatedUser);
    }
  }

  async getWorkouts(userId: string): Promise<WorkoutPlan[]> {
    const snapshot = await get(child(this.dbRef, `workouts/${userId}`));
    if (snapshot.exists()) {
      return Object.values(snapshot.val()) as WorkoutPlan[];
    }
    return [];
  }

  async saveWorkout(workout: WorkoutPlan) {
    await set(ref(database, `workouts/${workout.userId}/${workout.id}`), workout);
  }

  async getDiet(userId: string): Promise<DietPlan | undefined> {
    const snapshot = await get(child(this.dbRef, `diets/${userId}`));
    return snapshot.exists() ? snapshot.val() as DietPlan : undefined;
  }

  async saveDiet(diet: DietPlan) {
    await set(ref(database, `diets/${diet.userId}`), diet);
  }

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
  }
  
  async getActivity(userId: string): Promise<ActivityLog[]> {
    const snapshot = await get(child(this.dbRef, `activity/${userId}`));
    return snapshot.exists() ? Object.values(snapshot.val()) as ActivityLog[] : [];
  }

  async logActivity(log: ActivityLog) {
    await set(ref(database, `activity/${log.userId}/${log.id}`), log);
  }

  async getMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    const snapshot = await get(child(this.dbRef, 'messages'));
    if (snapshot.exists()) {
        const allMessages = Object.values(snapshot.val()) as ChatMessage[];
        return allMessages.filter(m => 
            (m.senderId === userId1 && m.receiverId === userId2) || 
            (m.senderId === userId2 && m.receiverId === userId1)
        ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return [];
  }

  async sendMessage(msg: ChatMessage) {
    await set(ref(database, 'messages/' + msg.id), msg);
  }

  async getEvents(): Promise<CalendarEvent[]> {
    const snapshot = await get(child(this.dbRef, 'events'));
    if (snapshot.exists()) {
        const events = Object.values(snapshot.val()) as CalendarEvent[];
        return events.sort((a,b) => a.date.localeCompare(b.date));
    }
    return [];
  }

  async addEvent(event: CalendarEvent) {
    await set(ref(database, 'events/' + event.id), event);
  }

  async deleteEvent(eventId: string) {
    await remove(ref(database, 'events/' + eventId));
  }

  async rsvpToEvent(eventId: string, userId: string, attending: boolean) {
    const snapshot = await get(child(this.dbRef, `events/${eventId}`));
    if (snapshot.exists()) {
        const event = snapshot.val() as CalendarEvent;
        let attendees = event.attendees || [];
        if (attending) {
            if (!attendees.includes(userId)) attendees.push(userId);
        } else {
            attendees = attendees.filter(id => id !== userId);
        }
        event.attendees = attendees;
        await set(ref(database, `events/${eventId}`), event);
    }
  }

  async getSpiritualPosts(): Promise<SpiritualPost[]> {
    const snapshot = await get(child(this.dbRef, 'spiritual_posts'));
    if (snapshot.exists()) {
        const posts = Object.values(snapshot.val()) as SpiritualPost[];
        return posts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [];
  }
  
  async addSpiritualPost(post: SpiritualPost) {
    await set(ref(database, 'spiritual_posts/' + post.id), post);
  }

  async checkInReading(userId: string) {
    const profile = await this.getProfile(userId);
    if (profile) {
      if (!profile.readingStats) {
        profile.readingStats = { daysCompleted: 0, streak: 0, lastReadDate: '' };
      }
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

  // Fix: Missing getReadingLeaderboard for StudentView
  async getReadingLeaderboard(): Promise<UserProfile[]> {
    const profiles = await this.getAllProfilesFromDb();
    return profiles.sort((a, b) => (b.readingStats?.daysCompleted || 0) - (a.readingStats?.daysCompleted || 0));
  }

  // Fix: Missing getStudentEvents for StudentView
  async getStudentEvents(userId: string): Promise<CalendarEvent[]> {
    const events = await this.getEvents();
    return events.filter(e => !e.studentId || e.studentId === userId);
  }
}

export const db = new StorageService();
