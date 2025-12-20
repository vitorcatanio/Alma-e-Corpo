
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, UserRole, CalendarEvent, ProgressLog, ChatMessage } from '../types';
import { db } from '../services/storage';
import { generateWorkoutSuggestion } from '../services/gemini';
import { 
    Users, Plus, ArrowLeft, Dumbbell, Utensils, Activity, Sparkles, 
    Trash2, Save, Loader2, ChevronRight, Scale, Clock, Timer, 
    Calendar as CalendarIcon, MessageCircle, TrendingUp, Camera, 
    CheckCircle, Info, LayoutDashboard, Send, Search
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
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'workout' | 'diet' | 'evolution'>('list');
    const [isLoading, setIsLoading] = useState(true);
    // Added state for evolution logs to fix async property access in render
    const [evolutionLogs, setEvolutionLogs] = useState<ProgressLog[]>([]);

    // Form States
    const [workoutTitle, setWorkoutTitle] = useState('Novo Plano de Treino');
    const [workoutSplit, setWorkoutSplit] = useState('A');
    const [workoutSport, setWorkoutSport] = useState<SportType>(SportType.GYM);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [dietMacros, setDietMacros] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
    const [dietContent, setDietContent] = useState('');
    const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({ title: '', date: '', time: '', type: 'training' });

    useEffect(() => {
        const load = async () => {
            const allUsers = await db.getAllUsersFromDb();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
            setIsLoading(false);
        };
        load();
        // Se mudar de aba global, reseta o estado interno de gestão
        if (activeTab !== 'students') setBuilderState('list');
    }, [activeTab]);

    // Fetch evolution logs when builderState changes to 'evolution'
    useEffect(() => {
        if (builderState === 'evolution' && selectedStudent) {
            db.getProgress(selectedStudent.id).then(setEvolutionLogs);
        }
    }, [builderState, selectedStudent]);

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        const p = await db.getProfile(student.id);
        setSelectedProfile(p || null);
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
        db.saveWorkout({
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
        });
        alert('Treino salvo!');
        setBuilderState('manage');
    };

    const handleSaveDiet = () => {
        if (!selectedStudent) return;
        db.saveDiet({
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            macros: dietMacros,
            content: dietContent,
            updatedAt: new Date().toISOString()
        });
        alert('Dieta salva!');
        setBuilderState('manage');
    };

    const handleSaveEvent = () => {
        if (!eventForm.title || !eventForm.date) return;
        db.addEvent({
            id: Date.now().toString(),
            trainerId: user.id,
            studentId: selectedStudent?.id,
            title: eventForm.title!,
            date: eventForm.date!,
            time: eventForm.time || '08:00',
            type: (eventForm.type as any) || 'training',
            attendees: []
        });
        alert('Evento agendado!');
        setEventForm({ title: '', date: '', time: '', type: 'training' });
    };

    // Fix for missing handleAIGenerate function using Gemini service
    const handleAIGenerate = async () => {
        if (!selectedProfile || isGeneratingAI) return;
        
        setIsGeneratingAI(true);
        try {
            const suggestion = await generateWorkoutSuggestion(selectedProfile, workoutSport);
            if (suggestion) {
                setWorkoutTitle(suggestion.title);
                const mappedExercises: Exercise[] = suggestion.exercises.map((ex, idx) => ({
                    id: `ai-${Date.now()}-${idx}`,
                    name: ex.name,
                    type: workoutSport === SportType.GYM ? 'strength' : 'cardio',
                    sets: ex.sets,
                    reps: workoutSport === SportType.GYM ? ex.repsOrDistance : undefined,
                    load: workoutSport === SportType.GYM ? ex.loadOrPace : undefined,
                    distance: workoutSport !== SportType.GYM ? ex.repsOrDistance : undefined,
                    pace: workoutSport !== SportType.GYM ? ex.loadOrPace : undefined,
                    duration: undefined,
                    rest: ex.rest,
                    notes: ex.notes,
                    completed: false
                }));
                setExercises(mappedExercises);
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert("Erro ao gerar treino com IA. Verifique os logs.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

    // RENDERIZAÇÃO POR ABA
    switch (activeTab) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-2">Visão Geral</h2>
                            <p className="text-slate-400 font-medium">Status da sua base de alunos Treyo.</p>
                        </div>
                        <LayoutDashboard className="absolute right-10 top-10 w-32 h-32 text-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Alunos Ativos" value={students.length} icon={Users} color="bg-indigo-600" />
                        <StatCard label="Treinos Prescritos" value={db.getWorkouts('').length || students.length * 2} icon={Dumbbell} color="bg-emerald-600" />
                        <StatCard label="Mensagens Pendentes" value="3" icon={MessageCircle} color="bg-rose-600" />
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600"/> Atividade Recente</h3>
                        <div className="space-y-4">
                            {students.slice(0, 3).map(s => (
                                <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">{s.name.charAt(0)}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900">{s.name} concluiu um treino de {SportType.GYM}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Há 2 horas</p>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'agenda':
            return (
                <div className="space-y-8 animate-fade-in">
                    <h2 className="text-3xl font-black text-slate-900">Agenda de Avaliações</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black mb-6">Próximos Compromissos</h3>
                            <div className="space-y-4">
                                {db.getEvents(user.id).map(e => (
                                    <div key={e.id} className="p-6 bg-slate-50 rounded-3xl flex items-center gap-6 group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm text-slate-900">
                                            <span className="text-[10px] font-black uppercase text-indigo-600">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                            <span className="text-xl font-black">{new Date(e.date).getDate()}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-lg">{e.title}</h4>
                                            <p className="text-sm text-slate-400 font-medium flex items-center gap-2"><Clock className="w-3 h-3" /> {e.time}</p>
                                        </div>
                                        <button onClick={() => db.deleteEvent(e.id)} className="p-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 h-fit">
                            <h3 className="text-xl font-black">Novo Evento</h3>
                            <div className="space-y-4">
                                <input placeholder="Título do Evento" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-indigo-500 font-bold" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
                                <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-indigo-500 font-bold" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} />
                                <input type="time" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-indigo-500 font-bold" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} />
                                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})}>
                                    <option value="training">Treino Presencial</option>
                                    <option value="assessment">Avaliação Física</option>
                                    <option value="global">Evento Global</option>
                                </select>
                                <button onClick={handleSaveEvent} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-transform">Agendar Evento</button>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'messages':
            return <TrainerChatView students={students} user={user} />;

        case 'students':
            if (builderState === 'list') {
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                                <input placeholder="Buscar aluno..." className="pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 shadow-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {students.map(s => (
                                <button key={s.id} onClick={() => handleSelectStudent(s)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Aluno Ativo</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600" />
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
                        <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar para Lista</button>
                        
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10 items-center">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-5xl font-black text-white shadow-xl">{selectedStudent.name.charAt(0)}</div>
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedStudent.name}</h2>
                                <p className="text-slate-500 font-medium mb-4">{selectedStudent.email}</p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Meta: {selectedProfile?.goal || 'Hipertrofia'}</span>
                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">{selectedProfile?.weight} kg</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ActionButton onClick={() => setBuilderState('workout')} icon={Dumbbell} label="Prescrever Treino" sub="Montar ficha contextual" color="bg-indigo-50 text-indigo-600" hColor="group-hover:bg-indigo-600" />
                            <ActionButton onClick={() => setBuilderState('diet')} icon={Utensils} label="Prescrever Dieta" sub="Macros e alimentação" color="bg-emerald-50 text-emerald-600" hColor="group-hover:bg-emerald-600" />
                            <ActionButton onClick={() => setBuilderState('evolution')} icon={TrendingUp} label="Ver Evolução" sub="Fotos e medidas" color="bg-amber-50 text-amber-600" hColor="group-hover:bg-amber-600" />
                        </div>
                    </div>
                );
            }

            if (builderState === 'evolution') {
                // Fixed: use evolutionLogs state instead of calling async db.getProgress in render
                const logs = evolutionLogs;
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                        <h2 className="text-3xl font-black text-slate-900">Acompanhamento: {selectedStudent?.name}</h2>
                        
                        {logs.length === 0 ? (
                            <div className="p-20 bg-white rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                                <Camera className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">O aluno ainda não registrou evoluções no timelapse.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group">
                                        <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                            {log.photoUrl ? (
                                                <img src={log.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-12 h-12" /></div>
                                            )}
                                        </div>
                                        <div className="p-8">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="font-black text-2xl text-slate-900">{log.weight} kg</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase">{new Date(log.date).toLocaleDateString()}</p>
                                            </div>
                                            {log.measurements && (
                                                <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-slate-400">
                                                    <span className="bg-slate-50 p-2 rounded-lg">Cintura: {log.measurements.waist}cm</span>
                                                    <span className="bg-slate-50 p-2 rounded-lg">Quadril: {log.measurements.hips}cm</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            if (builderState === 'workout') {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <div className="flex justify-between items-center">
                            <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                            <button onClick={handleAIGenerate} disabled={isGeneratingAI} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-amber-200 transition-all shadow-sm">
                                {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} SUGERIR COM IA
                            </button>
                        </div>
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Modalidade</label><select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold" value={workoutSport} onChange={e => {setWorkoutSport(e.target.value as SportType); setExercises([]);}}>{Object.values(SportType).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Título</label><input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold" value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)} /></div>
                                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Divisão</label><input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold" value={workoutSplit} onChange={e => setWorkoutSplit(e.target.value)} /></div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b pb-4"><h4 className="font-black text-slate-900 text-xl">Exercícios</h4><button onClick={addExercise} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Plus className="w-4 h-4" /> Adicionar</button></div>
                                <div className="space-y-4">
                                    {exercises.map((ex, idx) => (
                                        <div key={ex.id} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative group">
                                            <div className="md:col-span-4"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nome</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.name} onChange={e => { const n = [...exercises]; n[idx].name = e.target.value; setExercises(n); }} /></div>
                                            {workoutSport === SportType.GYM ? (
                                                <><div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Séries</label><input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.sets} onChange={e => { const n = [...exercises]; n[idx].sets = parseInt(e.target.value); setExercises(n); }} /></div><div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Reps</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.reps} onChange={e => { const n = [...exercises]; n[idx].reps = e.target.value; setExercises(n); }} /></div><div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Carga</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.load} onChange={e => { const n = [...exercises]; n[idx].load = e.target.value; setExercises(n); }} /></div></>
                                            ) : (
                                                <><div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">KM</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.distance} onChange={e => { const n = [...exercises]; n[idx].distance = e.target.value; setExercises(n); }} /></div><div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Pace</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.distance} onChange={e => { const n = [...exercises]; n[idx].pace = e.target.value; setExercises(n); }} /></div><div className="md:col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Tempo</label><input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={ex.duration} onChange={e => { const n = [...exercises]; n[idx].duration = e.target.value; setExercises(n); }} /></div></>
                                            )}
                                            <div className="md:col-span-2 flex gap-2"><button onClick={() => setExercises(exercises.filter(e => e.id !== ex.id))} className="w-full bg-red-50 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5 mx-auto" /></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleSaveWorkout} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3"><Save className="w-6 h-6" /> Salvar Treino</button>
                        </div>
                    </div>
                );
            }
            return null;

        default:
            return <div className="p-20 text-center text-slate-400 font-bold">Módulo em desenvolvimento.</div>;
    }
};
// ... rest of file unchanged
