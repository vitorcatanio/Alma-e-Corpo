
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, UserRole, SportType, ActivityLog, ChatMessage, CalendarEvent, Badge, SpiritualPost, ReadingStats } from '../types';

const MOCK_TRAINER_ID = 'trainer-1';
const MOCK_STUDENT_ID = 'student-1';

const INITIAL_USERS: User[] = [
  { id: MOCK_TRAINER_ID, name: 'Treinador', email: 'coach@fit.com', role: UserRole.TRAINER, password: '123' },
  { id: MOCK_STUDENT_ID, name: 'João Silva', email: 'joao@fit.com', role: UserRole.STUDENT, password: '123' },
];

const INITIAL_PROFILES: UserProfile[] = [
  {
    userId: MOCK_STUDENT_ID,
    age: 28,
    gender: 'masculino',
    height: 175,
    weight: 80,
    measurements: { waist: 90, hips: 100, arm: 35, leg: 55, chest: 105, fatPercentage: 18, muscleMass: 40 },
    goal: 'Foco Total',
    selectedSports: [SportType.GYM],
    onboardingCompleted: true,
    waterGoal: 3000,
    activeModules: { fitness: true, spiritual: true, reading: true },
    onboardingChoices: {
        wantsWeightLoss: true,
        wantsBibleReading: true,
        wantsExtraReading: true,
        biblePlanDuration: '1 ano',
        extraReadingGoal: 12,
        extraReadingProgress: 2
    },
    bookSuggestions: ['O Peregrino - John Bunyan', 'Hábitos Atômicos - James Clear'],
    points: 1250,
    level: 3,
    badges: ['badge-1'],
    readingStats: { daysCompleted: 45, streak: 12, lastReadDate: new Date().toISOString() }
  }
];

class StorageService {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  init() {
    if (!localStorage.getItem('users')) this.set('users', INITIAL_USERS);
    if (!localStorage.getItem('profiles')) this.set('profiles', INITIAL_PROFILES);
    if (!localStorage.getItem('workouts')) this.set('workouts', []);
    if (!localStorage.getItem('diets')) this.set('diets', []);
    if (!localStorage.getItem('messages')) this.set('messages', []);
    if (!localStorage.getItem('events')) this.set('events', [
        { id: '1', trainerId: MOCK_TRAINER_ID, title: 'Treinão de Sábado', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'global', description: 'Todos convidados para o parque!' }
    ]);
    if (!localStorage.getItem('progress')) this.set('progress', []);
    if (!localStorage.getItem('activity')) this.set('activity', []);
    if (!localStorage.getItem('spiritual_posts')) this.set('spiritual_posts', []);
  }

  getUsers(): User[] { return this.get('users'); }
  
  registerUser(user: User) { 
    const users = this.get<User>('users');
    users.push(user);
    this.set('users', users);
  }

  updateUser(updatedUser: Partial<User>) {
      const users = this.get<User>('users');
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index !== -1) {
          users[index] = { ...users[index], ...updatedUser };
          this.set('users', users);
          const current = localStorage.getItem('currentUser');
          if (current) {
              const parsed = JSON.parse(current);
              if (parsed.id === updatedUser.id) {
                   localStorage.setItem('currentUser', JSON.stringify(users[index]));
              }
          }
      }
  }

  getProfile(userId: string): UserProfile | undefined {
    return this.get<UserProfile>('profiles').find(p => p.userId === userId);
  }
  
  saveProfile(profile: UserProfile) {
    if (!profile.userId) return;
    const profiles = this.get<UserProfile>('profiles').filter(p => p.userId !== profile.userId);
    profiles.push(profile);
    this.set('profiles', profiles);
  }

  saveBookSuggestions(userId: string, suggestions: string[]) {
    const profiles = this.get<UserProfile>('profiles');
    const index = profiles.findIndex(p => p.userId === userId);
    if (index !== -1) {
        profiles[index].bookSuggestions = suggestions;
        this.set('profiles', profiles);
    }
  }
  
  deleteUser(userId: string) {
      this.set('users', this.get<User>('users').filter(u => u.id !== userId));
      this.set('profiles', this.get<UserProfile>('profiles').filter(p => p.userId !== userId));
  }

  getWorkouts(userId: string): WorkoutPlan[] { return this.get<WorkoutPlan>('workouts').filter(w => w.userId === userId); }
  saveWorkout(workout: WorkoutPlan) {
    let workouts = this.get<WorkoutPlan>('workouts');
    const index = workouts.findIndex(w => w.id === workout.id);
    if (index >= 0) workouts[index] = workout;
    else workouts.push(workout);
    this.set('workouts', workouts);
  }

  getDiet(userId: string): DietPlan | undefined { return this.get<DietPlan>('diets').find(d => d.userId === userId); }
  saveDiet(diet: DietPlan) {
    const diets = this.get<DietPlan>('diets').filter(d => d.userId !== diet.userId);
    diets.push(diet);
    this.set('diets', diets);
  }

  getProgress(userId: string): ProgressLog[] { 
      return this.get<ProgressLog>('progress').filter(p => p.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
  }
  addProgress(log: ProgressLog) { this.set('progress', [...this.get<ProgressLog>('progress'), log]); }
  
  getActivity(userId: string): ActivityLog[] { return this.get<ActivityLog>('activity').filter(a => a.userId === userId); }
  logActivity(log: ActivityLog) { this.set('activity', [...this.get<ActivityLog>('activity'), log]); }

  getMessages(userId1: string, userId2: string): ChatMessage[] {
      return this.get<ChatMessage>('messages').filter(m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1)).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  sendMessage(msg: ChatMessage) { this.set('messages', [...this.get<ChatMessage>('messages'), msg]); }

  getEvents(trainerId: string): CalendarEvent[] { return this.get<CalendarEvent>('events').filter(e => e.trainerId === trainerId); }
  getStudentEvents(userId: string): CalendarEvent[] {
      return this.get<CalendarEvent>('events').filter(e => e.type === 'global' || e.studentId === userId).sort((a,b) => a.date.localeCompare(b.date));
  }
  addEvent(event: CalendarEvent) { this.set('events', [...this.get<CalendarEvent>('events'), event]); }

  getBadges(badgeIds: string[]): Badge[] { return []; }

  getSpiritualPosts(): SpiritualPost[] {
      return this.get<SpiritualPost>('spiritual_posts').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  addSpiritualPost(post: SpiritualPost) { this.set('spiritual_posts', [post, ...this.get<SpiritualPost>('spiritual_posts')]); }
  addSpiritualComment(postId: string, comment: any) {
      const posts = this.get<SpiritualPost>('spiritual_posts');
      const idx = posts.findIndex(p => p.id === postId);
      if (idx !== -1) { posts[idx].comments.push(comment); this.set('spiritual_posts', posts); }
  }

  checkInReading(userId: string) {
      const profiles = this.get<UserProfile>('profiles');
      const index = profiles.findIndex(p => p.userId === userId);
      if (index !== -1) {
          const profile = profiles[index];
          const today = new Date().toISOString().split('T')[0];
          const lastRead = profile.readingStats?.lastReadDate?.split('T')[0];
          if (lastRead === today) return;
          const wasYesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] === lastRead;
          const newStats: ReadingStats = {
              daysCompleted: (profile.readingStats?.daysCompleted || 0) + 1,
              streak: wasYesterday ? (profile.readingStats?.streak || 0) + 1 : 1,
              lastReadDate: new Date().toISOString()
          };
          profiles[index] = { ...profile, readingStats: newStats, points: profile.points + 50 };
          this.set('profiles', profiles);
      }
  }
  
  getReadingLeaderboard(): UserProfile[] {
      return this.get<UserProfile>('profiles').sort((a,b) => (b.readingStats?.daysCompleted || 0) - (a.readingStats?.daysCompleted || 0));
  }
}

export const db = new StorageService();
