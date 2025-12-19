
// Data Model & Entity Definitions

export enum UserRole {
  STUDENT = 'student',
  TRAINER = 'trainer',
}

export enum SportType {
  GYM = 'Musculação',
  RUNNING = 'Corrida',
  WALKING = 'Caminhada',
  CYCLING = 'Bicicleta',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
}

export interface Measurements {
  waist: number;
  hips: number;
  arm: number;
  leg: number;
  chest?: number;
  fatPercentage?: number;
  muscleMass?: number;
}

export interface ReadingStats {
    daysCompleted: number;
    totalChaptersRead: number;
    streak: number;
    lastReadDate: string;
}

export interface LibraryComment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
}

export interface BookReview {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    title: string;
    author: string;
    review: string;
    rating: number; // 1-5
    timestamp: string;
    comments: LibraryComment[];
}

export interface WishlistBook {
    id: string;
    userId: string;
    title: string;
    author: string;
    targetDate: string;
    addedAt: string;
}

/**
 * Interface representing a badge earned by a user.
 */
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

/**
 * Interface representing a comment on a spiritual post.
 */
export interface SpiritualComment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
}

/**
 * Interface representing a spiritual reflection post in the community.
 */
export interface SpiritualPost {
    id: string;
    userId: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: SpiritualComment[];
}

export interface UserProfile {
  userId: string;
  age: number;
  gender: 'masculino' | 'feminino' | 'outro';
  height: number;
  weight: number;
  measurements: Measurements;
  goal: string;
  selectedSports: SportType[];
  onboardingCompleted: boolean;
  waterGoal?: number;
  
  // Módulos Ativos
  activeModules: {
    fitness: boolean;
    spiritual: boolean;
    reading: boolean;
  };

  onboardingChoices: {
    wantsWeightLoss: boolean;
    wantsBibleReading: boolean;
    wantsExtraReading: boolean;
    biblePlanDuration?: string;
    extraReadingGoal?: number;
    extraReadingProgress?: number;
  };

  bookSuggestions?: string[];
  points: number;
  level: number;
  badges: string[];
  readingStats?: ReadingStats;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility'; 
  sets?: number;
  reps?: string;
  load?: string;
  studentLoad?: string;
  distance?: string;
  duration?: string;
  pace?: string;
  rest: string;
  notes?: string;
  completed: boolean;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  trainerId: string;
  sportType: SportType;
  split?: string;
  title: string;
  exercises: Exercise[];
  assignedDate: string;
  estimatedCalories: number;
  durationMinutes: number;
  specificGuidelines?: string;
}

export interface MacroNutrients {
  calories: number;
  protein: number; 
  carbs: number; 
  fats: number; 
}

export interface DietPlan {
  id: string;
  userId: string;
  trainerId: string;
  macros: MacroNutrients; 
  content: string; 
  guidelines?: string;
  updatedAt: string;
}

export interface ProgressLog {
  id: string;
  userId: string;
  date: string;
  weight: number;
  measurements?: Measurements;
  notes?: string;
  photoUrl?: string;
  title?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  date: string;
  workoutId: string;
  completedAt: string;
  durationActual?: number;
  caloriesBurned?: number;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface CalendarEvent {
    id: string;
    trainerId: string;
    studentId?: string; 
    title: string;
    description?: string;
    date: string; 
    time: string;
    type: 'training' | 'assessment' | 'personal' | 'global';
    attendees?: string[]; 
}

export interface AIWorkoutSuggestion {
    title: string;
    rationale: string;
    exercises: {
        name: string;
        sets: number;
        repsOrDistance: string;
        loadOrPace: string;
        rest: string;
        notes: string;
    }[];
}
