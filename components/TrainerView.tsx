
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ProgressLog, UserRole, CalendarEvent, ChatMessage } from '../types';
import { db } from '../services/storage';
import { 
    Users, Plus, Save, ArrowLeft, Trash2, Calendar as CalendarIcon, 
    MessageCircle, Send, Dumbbell, Utensils, ImageIcon, Scale, 
    BookOpen, Target, Settings2, ShieldCheck, CheckSquare, ListTodo, Sparkles,
    UserX, Edit3, Key, Camera, Activity, ChevronRight, Clock, Star, Info
} from 'lucide-react';

interface TrainerViewProps {
    user: User;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TrainerViewContent: React.FC<TrainerViewProps> = ({ user, activeTab, onTabChange }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    
    // Builder States
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'create_workout' | 'edit_diet' | 'view_progress' | 'edit_access' | 'edit_books'>('list');
    
    // Workout Builder
    const [exercises, setExercises] = useState<Partial<Exercise>[]>([]);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [selectedSport, setSelectedSport] = useState<SportType>(SportType.GYM);
    const [selectedSplit, setSelectedSplit] = useState('A');
    const [durationMinutes, setDurationMinutes] = useState(60);
    
    // Diet Editor
    const [dietContent, setDietContent] = useState('');
    const [dietMacros, setDietMacros] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
    const [dietGuidelines, setDietGuidelines] = useState('');

    // Book Suggestions
    const [bookSuggestions, setBookSuggestions] = useState<string[]>([]);
    const [newBook, setNewBook] = useState('');

    // Access Editor
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');

    // Calendar Creation
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '', type: 'global' as const });

    // Messaging
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = () => {
            const allUsers = db.getUsers();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
            // FIX: getEvents is now implemented in StorageService
            setEvents(db.getEvents(user.id));
            setLoading(false);
            
            if (activeChat) {
                setChatMessages(db.getMessages(user.id, activeChat.id));
            }
        };
        load();
        const interval = setInterval(load, 3000);
        return () => clearInterval(interval);
    }, [user.id, activeTab, builderState, activeChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        // FIX: db.getProfile is async, await it and store in state
        const profile = await db.getProfile(student.id);
        setSelectedProfile(profile || null);
        const diet = db.getDiet(student.id);
        
        if (diet) {
            setDietContent(diet.content);
            setDietMacros(diet.macros);
            setDietGuidelines(diet.guidelines || '');
        } else {
            setDietContent('');
            setDietMacros({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
            setDietGuidelines('');
        }

        if (profile?.bookSuggestions) {
            setBookSuggestions(profile.bookSuggestions);
        } else {
            setBookSuggestions([]);
        }
        
        setBuilderState('manage');
    };

    const handleSaveWorkout = () => {
        if (!selectedStudent || !workoutTitle || exercises.length === 0) return;
        
        const newWorkout: WorkoutPlan = {
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            sportType: selectedSport,
            split: selectedSplit,
            title: workoutTitle,
            exercises: exercises.map(ex => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ex.name || 'Exercício',
                type: selectedSport === SportType.GYM ? 'strength' : 'cardio',
                sets: ex.sets || 0,
                reps: ex.reps || '0',
                load: ex.load || '0',
                distance: ex.distance || '0',
                duration: ex.duration || '0',
                pace: ex.pace || '0',
                rest: ex.rest || '60s',
                completed: false
            })) as Exercise[],
            assignedDate: new Date().toISOString(),
            estimatedCalories: 300,
            durationMinutes: durationMinutes
        };

        db.saveWorkout(newWorkout);
        setBuilderState('manage');
        setExercises([]);
        setWorkoutTitle('');
    };

    const handleSaveDiet = () => {
        if (!selectedStudent) return;
        const newDiet: DietPlan = {
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            macros: dietMacros,
            content: dietContent,
            guidelines: dietGuidelines,
            updatedAt: new Date().toISOString()
        };
        db.saveDiet(newDiet);
        setBuilderState('manage');
    };

    const handleSaveBooks = () => {
        if (!selectedStudent) return;
        db.saveBookSuggestions(selectedStudent.id, bookSuggestions);
        setBuilderState('manage');
    }

    const toggleModule = async (module: 'fitness' | 'spiritual' | 'reading') => {
        if (!selectedStudent) return;
        // FIX: db.getProfile is async
        const profile = await db.getProfile(selectedStudent.id);
        if (profile) {
            profile.activeModules[module] = !profile.activeModules[module];
            await db.saveProfile(profile);
            setSelectedProfile({...profile});
            // Force re-render
            setSelectedStudent({...selectedStudent});
        }
    };

    const handleDeleteStudent = () => {
        if (!selectedStudent) return;
        const confirmDelete = window.confirm(`Deseja realmente remover o aluno ${selectedStudent.name}?`);
        if (confirmDelete) {
            // FIX: deleteUser is now implemented in StorageService
            db.deleteUser(selectedStudent.id);
            setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
            setBuilderState('list');
            setSelectedStudent(null);
            setSelectedProfile(null);
        }
    };

    const handleUpdateAccess = () => {
        if (!selectedStudent) return;
        db.updateUser({
            id: selectedStudent.id,
            name: editName,
            email: editEmail,
            password: editPassword || selectedStudent.password
        });
        setBuilderState('manage');
    };

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.date) return;
        // FIX: addEvent is now implemented in StorageService
        db.addEvent({
            ...newEvent,
            id: Date.now().toString(),
            trainerId: user.id,
        });
        setIsAddingEvent(false);
        setEvents(db.getEvents(user.id));
    }

    const handleSendMsg = () => {
        if (!msgInput.trim() || !activeChat) return;
        db.sendMessage({
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: activeChat.id,
            content: input,
            timestamp: new Date().toISOString(),
            read: false
        });
        setMsgInput('');
        setChatMessages(db.getMessages(user.id, activeChat.id));
    };

    if (activeTab === 'dashboard') {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow