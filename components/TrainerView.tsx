
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, UserRole, CalendarEvent, ProgressLog, ChatMessage } from '../types';
import { db } from '../services/storage';
import { generateWorkoutSuggestion } from '../services/gemini';
import { 
    Users, Plus, ArrowLeft, Dumbbell, Utensils, Activity, Sparkles, 
    Trash2, Save, Loader2, ChevronRight, Scale, Clock, Timer, 
    Calendar as CalendarIcon, MessageCircle, TrendingUp, Camera, 
    CheckCircle, Info, LayoutDashboard, Send, Search, Coffee,
    Sun, Sunrise, Moon, Soup, Ruler
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
    const [evolutionLogs, setEvolutionLogs] = useState<ProgressLog[]>([]);

    // Form States - Workout
    const [workoutTitle, setWorkoutTitle] = useState('Novo Plano de Treino');
    const [workoutSplit, setWorkoutSplit] = useState('A');
    const [workoutSport, setWorkoutSport] = useState<SportType>(SportType.GYM);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Form States - Diet
    const [dietMacros, setDietMacros] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
    const [meals, setMeals] = useState({
        breakfast: '', lunch: '', snack: '', dinner: '', supper: ''
    });
    const [dietGuidelines, setDietGuidelines] = useState('');

    useEffect(() => {
        const load = async () => {
            const allUsers = await db.getAllUsersFromDb();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
            setIsLoading(false);
        };
        load();
        if (activeTab !== 'students') setBuilderState('list');
    }, [activeTab]);

    useEffect(() => {
        if (builderState === 'evolution' && selectedStudent) {
            db.getProgress(selectedStudent.id).then(setEvolutionLogs);
        }
    }, [builderState, selectedStudent]);

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        const p = await db.getProfile(student.id);
        setSelectedProfile(p || null);
        const currentDiet = await db.getDiet(student.id);
        if (currentDiet) {
            setDietMacros(currentDiet.macros);
            setMeals(currentDiet.meals || { breakfast: '', lunch: '', snack: '', dinner: '', supper: '' });
            setDietGuidelines(currentDiet.guidelines || '');
        } else {
            setMeals({ breakfast: '', lunch: '', snack: '', dinner: '', supper: '' });
            setDietGuidelines('');
        }
        setBuilderState('manage');
    };

    const handleSaveWorkout = async () => {
        if (!selectedStudent) return;
        await db.saveWorkout({
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
        alert('Treino salvo com sucesso no sistema!');
        setBuilderState('manage');
    };

    const handleSaveDiet = async () => {
        if (!selectedStudent) return;
        try {
            await db.saveDiet({
                id: Date.now().toString(),
                userId: selectedStudent.id,
                trainerId: user.id,
                macros: dietMacros,
                content: "Plano estruturado de refeições",
                meals: meals,
                guidelines: dietGuidelines,
                updatedAt: new Date().toISOString()
            });
            alert('Dieta salva e sincronizada para o aluno!');
            setBuilderState('manage');
        } catch (e) {
            alert('Erro ao salvar dieta. Verifique sua conexão.');
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

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
                        <StatCard label="Mensagens Pendentes" value="Chat Ativo" icon={MessageCircle} color="bg-rose-600" />
                        <StatCard label="Gestão Treyo" value="Ativa" icon={Activity} color="bg-emerald-600" />
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
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Amigo Platinum</p>
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
                            <div className="text-center md:text-left">
                                <h2 className="text-4xl font-black text-slate-900 mb-2">{selectedStudent.name}</h2>
                                <p className="text-slate-500 font-medium mb-4">{selectedStudent.email}</p>
                                <div className="flex gap-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Meta: {selectedProfile?.goal}</span>
                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">{selectedProfile?.weight} kg</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ActionButton onClick={() => setBuilderState('workout')} icon={Dumbbell} label="Prescrever Treino" sub="Montar ficha sincronizada" color="bg-indigo-50 text-indigo-600" hColor="group-hover:bg-indigo-600" />
                            <ActionButton onClick={() => setBuilderState('diet')} icon={Utensils} label="Prescrever Dieta" sub="Macros e alimentação" color="bg-emerald-50 text-emerald-600" hColor="group-hover:bg-emerald-600" />
                            <ActionButton onClick={() => setBuilderState('evolution')} icon={TrendingUp} label="Ver Evolução" sub="Fotos e medidas globais" color="bg-amber-50 text-amber-600" hColor="group-hover:bg-amber-600" />
                        </div>
                    </div>
                );
            }
            
            if (builderState === 'evolution' && selectedStudent) {
                 return (
                    <div className="space-y-8 animate-fade-in pb-20">
                         <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                         <h2 className="text-3xl font-black text-slate-900">Evolução de {selectedStudent.name}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {evolutionLogs.map(log => (
                                <div key={log.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                    {log.photoUrl && <img src={log.photoUrl} className="aspect-[4/3] w-full object-cover" />}
                                    <div className="p-8 space-y-4">
                                        <div className="flex justify-between items-center border-b pb-4">
                                            <span className="text-sm font-black text-indigo-600">{new Date(log.date).toLocaleDateString()}</span>
                                            <span className="text-xl font-black">{log.weight}kg</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-left">
                                            <div className="p-2 bg-slate-50 rounded-lg">Cintura: {log.measurements?.waist}cm</div>
                                            <div className="p-2 bg-slate-50 rounded-lg">Quadril: {log.measurements?.hips}cm</div>
                                        </div>
                                        {log.notes && <p className="text-xs text-slate-500 italic text-left">"{log.notes}"</p>}
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                 );
            }

            if (builderState === 'diet' && selectedStudent) {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar</button>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-2xl font-black text-slate-900">Plano Alimentar para {selectedStudent.name}</h2>
                            <button onClick={handleSaveDiet} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-700 transition-all"><Save /> Salvar e Enviar</button>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                            <h3 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Metas de Macronutrientes</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MacroInput label="Kcal Diárias" value={dietMacros.calories} onChange={(v:number) => setDietMacros({...dietMacros, calories: v})} />
                                <MacroInput label="Proteína (g)" value={dietMacros.protein} onChange={(v:number) => setDietMacros({...dietMacros, protein: v})} />
                                <MacroInput label="Carbo (g)" value={dietMacros.carbs} onChange={(v:number) => setDietMacros({...dietMacros, carbs: v})} />
                                <MacroInput label="Gordura (g)" value={dietMacros.fats} onChange={(v:number) => setDietMacros({...dietMacros, fats: v})} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <MealEditor label="Café da Manhã" icon={Sunrise} color="text-amber-500" value={meals.breakfast} onChange={(v:string) => setMeals({...meals, breakfast: v})} />
                            <MealEditor label="Almoço" icon={Sun} color="text-indigo-500" value={meals.lunch} onChange={(v:string) => setMeals({...meals, lunch: v})} />
                            <MealEditor label="Lanche" icon={Coffee} color="text-orange-500" value={meals.snack} onChange={(v:string) => setMeals({...meals, snack: v})} />
                            <MealEditor label="Jantar" icon={Soup} color="text-rose-500" value={meals.dinner} onChange={(v:string) => setMeals({...meals, dinner: v})} />
                            <MealEditor label="Ceia" icon={Moon} color="text-slate-900" value={meals.supper} onChange={(v:string) => setMeals({...meals, supper: v})} />
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                            <label className="text-xs font-black uppercase text-slate-400 block mb-4 ml-1">Orientações Extras</label>
                            <textarea 
                                className="w-full min-h-[120px] p-5 bg-slate-50 rounded-2xl border-none outline-none font-medium text-slate-700 resize-none" 
                                placeholder="Ex: Beber 3 litros de água, evitar refrigerantes..."
                                value={dietGuidelines}
                                onChange={e => setDietGuidelines(e.target.value)}
                            />
                        </div>
                    </div>
                );
            }
            return null;

        default:
            return <div className="p-20 text-center text-slate-400 font-bold">Módulo em desenvolvimento.</div>;
    }
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all text-left">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform shrink-0`}><Icon className="w-7 h-7" /></div>
        <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><p className="text-xl font-black text-slate-900">{value}</p></div>
    </div>
);

const ActionButton = ({ onClick, icon: Icon, label, sub, color, hColor }: any) => (
    <button onClick={onClick} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group flex flex-col gap-6">
        <div className={`w-14 h-14 ${color} ${hColor} group-hover:text-white rounded-2xl flex items-center justify-center transition-all shrink-0`}><Icon className="w-7 h-7" /></div>
        <div><h3 className="font-bold text-lg text-slate-900">{label}</h3><p className="text-xs text-slate-400 font-medium">{sub}</p></div>
    </button>
);

const MacroInput = ({ label, value, onChange }: any) => (
    <div className="text-left">
        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1 ml-1">{label}</label>
        <input type="number" className="w-full p-4 bg-slate-50 rounded-xl font-black text-slate-900 outline-none border border-transparent focus:border-indigo-100" value={value} onChange={e => onChange(parseInt(e.target.value))} />
    </div>
);

const MealEditor = ({ icon: Icon, label, color, value, onChange }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 text-left">
        <div className="flex items-center gap-4 md:w-48 shrink-0"><div className={`p-3 rounded-xl bg-slate-50 ${color}`}><Icon className="w-6 h-6" /></div><span className="font-black text-slate-900">{label}</span></div>
        <textarea className="flex-1 min-h-[100px] p-4 bg-slate-50 rounded-2xl border-none outline-none font-medium text-slate-700 resize-none" placeholder={`Prescreva o ${label.toLowerCase()}...`} value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const TrainerChatView = ({ students, user }: { students: User[], user: User }) => {
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const loadMsgs = async () => { if(selectedStudent) { const m = await db.getMessages(user.id, selectedStudent.id); setMessages(m); } };
    useEffect(() => { loadMsgs(); }, [selectedStudent]);
    return (
        <div className="bg-white h-[calc(100vh-200px)] rounded-[3rem] border border-slate-100 shadow-2xl flex overflow-hidden animate-fade-in">
            <div className="w-full md:w-80 border-r border-slate-50 flex flex-col bg-slate-50/30">
                <div className="p-8 border-b border-slate-50 bg-white"><h3 className="font-black text-slate-900 text-lg">Conversas</h3></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {students.map(s => (
                        <button key={s.id} onClick={() => setSelectedStudent(s)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedStudent?.id === s.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-600'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${selectedStudent?.id === s.id ? 'bg-indigo-600' : 'bg-slate-200 text-slate-400'}`}>{s.name.charAt(0)}</div>
                            <span className="font-bold text-sm truncate">{s.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="hidden md:flex flex-1 flex-col bg-white">
                {selectedStudent ? (
                    <>
                        <div className="p-8 border-b border-slate-50 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">{selectedStudent.name.charAt(0)}</div><h3 className="font-black text-slate-900 text-xl">{selectedStudent.name}</h3></div>
                        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/20 custom-scrollbar">
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-6 rounded-3xl shadow-sm font-medium ${m.senderId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}><p className="text-sm">{m.content}</p></div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 border-t border-slate-50">
                            <div className="relative">
                                <input className="w-full pl-8 pr-24 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none shadow-inner focus:bg-white focus:border-indigo-500 font-bold transition-all" placeholder="Responder aluno..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={async (e) => {if(e.key === 'Enter') { await db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: selectedStudent.id, content: input, timestamp: new Date().toISOString(), read: false }); setInput(''); loadMsgs(); }}} />
                                <button onClick={async () => { if(input && selectedStudent) { await db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: selectedStudent.id, content: input, timestamp: new Date().toISOString(), read: false }); setInput(''); loadMsgs(); }}} className="absolute right-3 top-3 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all"><Send className="w-6 h-6" /></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 italic text-center p-10"><MessageCircle className="w-16 h-16 opacity-10" /><p>Selecione um Amigo Platinum para conversar e fornecer suporte.</p></div>
                )}
            </div>
        </div>
    );
};
