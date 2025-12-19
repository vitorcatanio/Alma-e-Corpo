
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, UserRole } from '../types';
import { db } from '../services/storage';
import { generateWorkoutSuggestion } from '../services/gemini';
import { 
    Users, Plus, ArrowLeft, Dumbbell, Utensils, Activity, Sparkles, 
    Trash2, Save, Loader2, ChevronRight, Scale, Clock, Timer, 
    Footprints, Bike, Info
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
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'workout' | 'diet'>('list');
    const [isLoading, setIsLoading] = useState(true);

    // Workout State
    const [workoutTitle, setWorkoutTitle] = useState('Novo Plano de Treino');
    const [workoutSplit, setWorkoutSplit] = useState('A');
    const [workoutSport, setWorkoutSport] = useState<SportType>(SportType.GYM);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Diet State
    const [dietMacros, setDietMacros] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
    const [dietContent, setDietContent] = useState('');

    useEffect(() => {
        const load = async () => {
            const allUsers = await db.getAllUsersFromDb();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
            setIsLoading(false);
        };
        load();
    }, [activeTab]);

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        const p = await db.getProfile(student.id);
        setSelectedProfile(p || null);
        
        // Reset e carregar dados atuais
        const currentDiet = db.getDiet(student.id);
        if (currentDiet) {
            setDietMacros(currentDiet.macros);
            setDietContent(currentDiet.content);
        }
        
        setBuilderState('manage');
    };

    const addExercise = () => {
        const newEx: Exercise = {
            id: Date.now().toString(),
            name: '',
            type: workoutSport === SportType.GYM ? 'strength' : 'cardio',
            sets: workoutSport === SportType.GYM ? 3 : undefined,
            reps: workoutSport === SportType.GYM ? '12' : undefined,
            load: workoutSport === SportType.GYM ? '' : undefined,
            distance: workoutSport !== SportType.GYM ? '' : undefined,
            pace: workoutSport !== SportType.GYM ? '' : undefined,
            duration: workoutSport !== SportType.GYM ? '' : undefined,
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
        alert('Treino prescrito com sucesso!');
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
        alert('Dieta atualizada com sucesso!');
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
                type: workoutSport === SportType.GYM ? 'strength' : 'cardio',
                sets: e.sets,
                reps: e.repsOrDistance,
                load: e.loadOrPace,
                distance: workoutSport !== SportType.GYM ? e.repsOrDistance : undefined,
                pace: workoutSport !== SportType.GYM ? e.loadOrPace : undefined,
                rest: e.rest,
                notes: e.notes,
                completed: false
            })));
        }
        setIsGeneratingAI(false);
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

    if (builderState === 'list') {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                        <p className="text-slate-500 font-medium">Selecione um aluno para prescrever treinos e dietas.</p>
                    </div>
                    <Users className="w-10 h-10 text-slate-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map(s => (
                        <button key={s.id} onClick={() => handleSelectStudent(s)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {s.name.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-bold text-lg text-slate-900 truncate">{s.name}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aluno Treyo</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
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
                <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Voltar para Lista
                </button>
                
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10 items-center">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-5xl font-black text-white shadow-xl">
                        {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedStudent.name}</h2>
                        <div className="flex gap-4">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">Ativo</span>
                            <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-xs font-black uppercase tracking-widest">{selectedStudent.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setBuilderState('workout')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-6 group">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <Dumbbell className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Prescrever Treino</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Montar ficha contextualizada</p>
                        </div>
                    </button>
                    <button onClick={() => setBuilderState('diet')} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-6 group">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                            <Utensils className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Prescrever Dieta</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Macros e plano alimentar</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    if (builderState === 'workout') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar
                    </button>
                    <button onClick={handleAIGenerate} disabled={isGeneratingAI} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-amber-200 transition-all shadow-sm">
                        {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        SUGERIR COM IA TREYO
                    </button>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Modalidade do Plano</label>
                            <select 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-500 outline-none transition-all" 
                                value={workoutSport} 
                                onChange={e => {
                                    setWorkoutSport(e.target.value as SportType);
                                    setExercises([]); // Reset para não misturar campos
                                }}
                            >
                                {Object.values(SportType).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Título da Ficha</label>
                            <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-500 outline-none transition-all" value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Frequência/Split</label>
                            <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-500 outline-none transition-all" placeholder="Ex: Treino A" value={workoutSplit} onChange={e => setWorkoutSplit(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <h4 className="font-black text-slate-900 text-xl flex items-center gap-2">
                                {workoutSport === SportType.GYM ? <Dumbbell className="w-5 h-5 text-indigo-500" /> : <Timer className="w-5 h-5 text-indigo-500" />}
                                Exercícios Selecionados
                            </h4>
                            <button onClick={addExercise} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                <Plus className="w-4 h-4" /> Adicionar
                            </button>
                        </div>

                        <div className="space-y-4">
                            {exercises.length === 0 && <p className="text-center text-slate-300 py-10 font-bold italic">Nenhum exercício adicionado a esta ficha.</p>}
                            {exercises.map((ex, idx) => (
                                <div key={ex.id} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative group">
                                    <div className="md:col-span-4">
                                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nome do Exercício / Percurso</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none" value={ex.name} onChange={e => { const n = [...exercises]; n[idx].name = e.target.value; setExercises(n); }} placeholder="Puxada Aberta / Circuito Ibirapuera" />
                                    </div>

                                    {workoutSport === SportType.GYM ? (
                                        <>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Séries</label>
                                                <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.sets} onChange={e => { const n = [...exercises]; n[idx].sets = parseInt(e.target.value); setExercises(n); }} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Reps</label>
                                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.reps} onChange={e => { const n = [...exercises]; n[idx].reps = e.target.value; setExercises(n); }} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Carga</label>
                                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.load} onChange={e => { const n = [...exercises]; n[idx].load = e.target.value; setExercises(n); }} placeholder="10kg" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Distância</label>
                                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.distance} onChange={e => { const n = [...exercises]; n[idx].distance = e.target.value; setExercises(n); }} placeholder="5km" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Ritmo/Pace</label>
                                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.pace} onChange={e => { const n = [...exercises]; n[idx].pace = e.target.value; setExercises(n); }} placeholder="5:30 min/km" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Duração</label>
                                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.duration} onChange={e => { const n = [...exercises]; n[idx].duration = e.target.value; setExercises(n); }} placeholder="30 min" />
                                            </div>
                                        </>
                                    )}

                                    <div className="md:col-span-1">
                                        <button onClick={() => setExercises(exercises.filter(e => e.id !== ex.id))} className="w-full bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 className="w-5 h-5 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSaveWorkout} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all">
                        <Save className="w-6 h-6" /> Prescrever Treino Completo
                    </button>
                </div>
            </div>
        );
    }

    if (builderState === 'diet') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </button>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2">Plano Alimentar</h3>
                        <p className="text-slate-400 font-medium">Defina os macros ideais e descreva a rotina de refeições.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <MacroInput label="Calorias Totais" value={dietMacros.calories} onChange={v => setDietMacros({...dietMacros, calories: v})} unit="kcal" />
                        <MacroInput label="Proteínas" value={dietMacros.protein} onChange={v => setDietMacros({...dietMacros, protein: v})} unit="g" />
                        <MacroInput label="Carboidratos" value={dietMacros.carbs} onChange={v => setDietMacros({...dietMacros, carbs: v})} unit="g" />
                        <MacroInput label="Gorduras" value={dietMacros.fats} onChange={v => setDietMacros({...dietMacros, fats: v})} unit="g" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Detalhamento do Plano (Café, Almoço, Jantar, Ceia...)</label>
                        <textarea 
                            className="w-full h-[400px] bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 outline-none font-medium focus:bg-white focus:border-emerald-500 transition-all text-slate-700 leading-relaxed shadow-inner" 
                            value={dietContent} 
                            onChange={e => setDietContent(e.target.value)} 
                            placeholder="Descreva aqui o plano alimentar detalhado do seu aluno..."
                        ></textarea>
                    </div>

                    <button onClick={handleSaveDiet} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all">
                        <Save className="w-6 h-6" /> Atualizar Plano Alimentar
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

const MacroInput = ({ label, value, onChange, unit }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{label}</label>
        <div className="relative group">
            <input 
                type="number" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-5 pr-14 py-4 font-black text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-sm" 
                value={value} 
                onChange={e => onChange(parseInt(e.target.value) || 0)} 
            />
            <span className="absolute right-5 top-4 text-[10px] font-black text-slate-300 group-focus-within:text-indigo-500 transition-colors">{unit}</span>
        </div>
    </div>
);
