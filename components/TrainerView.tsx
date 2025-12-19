
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ActivityLog, CalendarEvent, UserRole } from '../types';
import { db } from '../services/storage';
import { generateWorkoutSuggestion } from '../services/gemini';
import { 
    Users, Plus, ArrowLeft, Dumbbell, Utensils, Activity, Sparkles, 
    Trash2, Edit3, Save, Loader2, ChevronRight, Scale, Info, Clock, 
    Calendar as CalendarIcon, Target, X
} from 'lucide-react';

interface TrainerViewProps {
    user: User;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TrainerViewContent: React.FC<TrainerViewProps> = ({ user, activeTab, onTabChange }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'workout' | 'diet'>('list');
    const [isLoading, setIsLoading] = useState(true);

    // Workout Builder State
    const [workoutTitle, setWorkoutTitle] = useState('Novo Plano de Treino');
    const [workoutSplit, setWorkoutSplit] = useState('A');
    const [workoutSport, setWorkoutSport] = useState<SportType>(SportType.GYM);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Diet Builder State
    const [dietMacros, setDietMacros] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
    const [dietContent, setDietContent] = useState('');

    useEffect(() => {
        const load = async () => {
            const allUsers = await db.getAllUsersFromDb();
            const allProfiles = await db.getAllProfilesFromDb();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
            setProfiles(allProfiles);
            setIsLoading(false);
        };
        load();
    }, [activeTab]);

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        const p = await db.getProfile(student.id);
        setSelectedProfile(p || null);
        setBuilderState('manage');

        // Carregar dieta existente se houver
        const currentDiet = db.getDiet(student.id);
        if (currentDiet) {
            setDietMacros(currentDiet.macros);
            setDietContent(currentDiet.content);
        } else {
            setDietContent('');
        }
    };

    const addExercise = () => {
        const newEx: Exercise = {
            id: Date.now().toString(),
            name: '',
            type: 'strength',
            sets: 3,
            reps: '12',
            load: '',
            rest: '60s',
            completed: false
        };
        setExercises([...exercises, newEx]);
    };

    const handleSaveWorkout = () => {
        if (!selectedStudent) return;
        const plan: WorkoutPlan = {
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            sportType: workoutSport,
            split: workoutSplit,
            title: workoutTitle,
            exercises: exercises,
            assignedDate: new Date().toISOString(),
            estimatedCalories: 300,
            durationMinutes: 60
        };
        db.saveWorkout(plan);
        alert('Treino salvo com sucesso!');
        setBuilderState('manage');
    };

    const handleSaveDiet = () => {
        if (!selectedStudent) return;
        const diet: DietPlan = {
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            macros: dietMacros,
            content: dietContent,
            updatedAt: new Date().toISOString()
        };
        db.saveDiet(diet);
        alert('Dieta salva com sucesso!');
        setBuilderState('manage');
    };

    const handleAIGenerate = async () => {
        if (!selectedProfile) return;
        setIsGeneratingAI(true);
        const suggestion = await generateWorkoutSuggestion(selectedProfile, workoutSport);
        if (suggestion) {
            setWorkoutTitle(suggestion.title);
            setExercises(suggestion.exercises.map((e, idx) => ({
                id: `ai-${idx}-${Date.now()}`,
                name: e.name,
                type: 'strength',
                sets: e.sets,
                reps: e.repsOrDistance,
                load: e.loadOrPace,
                rest: e.rest,
                notes: e.notes,
                completed: false
            })));
        }
        setIsGeneratingAI(false);
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

    if (builderState === 'list') {
        return (
            <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map(s => (
                        <button key={s.id} onClick={() => handleSelectStudent(s)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">Aluno Treyo</p>
                                </div>
                                <ChevronRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (selectedStudent && builderState === 'manage') {
        return (
            <div className="space-y-8 animate-fade-in">
                <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-5xl font-black text-white">{selectedStudent.name.charAt(0)}</div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedStudent.name}</h2>
                        <p className="text-slate-500 font-medium">{selectedStudent.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setBuilderState('workout')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Dumbbell className="w-7 h-7" /></div>
                        <div><h3 className="text-xl font-black">Prescrever Treino</h3><p className="text-xs text-slate-400 font-bold uppercase">Montar ficha de exercícios</p></div>
                    </button>
                    <button onClick={() => setBuilderState('diet')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Utensils className="w-7 h-7" /></div>
                        <div><h3 className="text-xl font-black">Prescrever Dieta</h3><p className="text-xs text-slate-400 font-bold uppercase">Macros e plano alimentar</p></div>
                    </button>
                </div>
            </div>
        );
    }

    if (builderState === 'workout') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                    <button onClick={handleAIGenerate} disabled={isGeneratingAI} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-amber-200 transition-all">
                        {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        SUGERIR COM IA
                    </button>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Título</label><input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)} /></div>
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Divisão (Split)</label><input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={workoutSplit} onChange={e => setWorkoutSplit(e.target.value)} /></div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Modalidade</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={workoutSport} onChange={e => setWorkoutSport(e.target.value as SportType)}>
                                {Object.values(SportType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><h4 className="font-black text-slate-900 text-xl">Exercícios</h4><button onClick={addExercise} className="bg-slate-900 text-white p-2 rounded-lg"><Plus className="w-4 h-4" /></button></div>
                        <div className="space-y-3">
                            {exercises.map((ex, idx) => (
                                <div key={ex.id} className="p-6 bg-slate-50 rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                    <div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400">Nome</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" value={ex.name} onChange={e => { const n = [...exercises]; n[idx].name = e.target.value; setExercises(n); }} /></div>
                                    <div><label className="text-[9px] font-black uppercase text-slate-400">Séries / Dist</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" value={ex.sets} onChange={e => { const n = [...exercises]; n[idx].sets = parseInt(e.target.value); setExercises(n); }} /></div>
                                    <div><label className="text-[9px] font-black uppercase text-slate-400">Reps / Ritmo</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" value={ex.reps} onChange={e => { const n = [...exercises]; n[idx].reps = e.target.value; setExercises(n); }} /></div>
                                    <div><label className="text-[9px] font-black uppercase text-slate-400">Carga / Notas</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" value={ex.load} onChange={e => { const n = [...exercises]; n[idx].load = e.target.value; setExercises(n); }} /></div>
                                    <button onClick={() => setExercises(exercises.filter(e => e.id !== ex.id))} className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4 mx-auto" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSaveWorkout} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Salvar Treino para Aluno</button>
                </div>
            </div>
        );
    }

    if (builderState === 'diet') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="text-2xl font-black">Plano Alimentar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MacroInput label="Calorias" value={dietMacros.calories} onChange={v => setDietMacros({...dietMacros, calories: v})} unit="kcal" />
                        <MacroInput label="Proteínas" value={dietMacros.protein} onChange={v => setDietMacros({...dietMacros, protein: v})} unit="g" />
                        <MacroInput label="Carbos" value={dietMacros.carbs} onChange={v => setDietMacros({...dietMacros, carbs: v})} unit="g" />
                        <MacroInput label="Gorduras" value={dietMacros.fats} onChange={v => setDietMacros({...dietMacros, fats: v})} unit="g" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Prescrição Detalhada (HTML/Markdown aceitos)</label>
                        <textarea className="w-full h-80 bg-slate-50 border border-slate-200 rounded-2xl p-6 outline-none font-medium focus:bg-white focus:border-emerald-500 transition-all" value={dietContent} onChange={e => setDietContent(e.target.value)} placeholder="Descreva as refeições do dia..."></textarea>
                    </div>
                    <button onClick={handleSaveDiet} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Salvar Dieta do Aluno</button>
                </div>
            </div>
        );
    }

    return null;
};

const MacroInput = ({ label, value, onChange, unit }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{label}</label>
        <div className="relative">
            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 font-black text-slate-900" value={value} onChange={e => onChange(parseInt(e.target.value))} />
            <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400">{unit}</span>
        </div>
    </div>
);
