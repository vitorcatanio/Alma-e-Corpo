
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
    streak: number;
    lastReadDate: string;
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
  
  // Módulos Ativos (Controlados pelo Treinador)
  activeModules: {
    fitness: boolean;
    spiritual: boolean;
    reading: boolean;
  };

  // Metas do Onboarding
  onboardingChoices: {
    wantsWeightLoss: boolean;
    wantsBibleReading: boolean;
    wantsExtraReading: boolean;
    biblePlanDuration?: string;
    extraReadingGoal?: number;
    extraReadingProgress?: number;
  };

  // Sugestões do Personal
  bookSuggestions?: string[];

  // Gamification
  points: number;
  level: number;
  badges: string[];

  // Spiritual
  readingStats?: ReadingStats;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility'; 
  sets?: number;
  reps?: string;
  load?: string;
  studentLoad?: string; // Carga real usada pelo aluno
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
    studentId?: string; // Se vazio, é um evento global/público
    title: string;
    description?: string;
    date: string; // Formato YYYY-MM-DD
    time: string;
    type: 'training' | 'assessment' | 'personal' | 'global';
    attendees?: string[]; // Lista de IDs de usuários que confirmaram
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export interface SpiritualComment {
    userId: string;
    content: string;
    timestamp: string;
}

export interface SpiritualPost {
    id: string;
    userId: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: SpiritualComment[];
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
