
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserProfile } from '../types';
import { db } from '../services/storage';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  Users, 
  LogOut,
  Menu,
  Activity,
  MessageCircle,
  Calendar,
  X,
  Camera,
  Save,
  BookOpen,
  Library,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  role, 
  activeTab, 
  onTabChange, 
  onLogout,
  user,
  onUserUpdate
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [editName, setEditName] = useState(user.name);
  const [previewAvatar, setPreviewAvatar] = useState<string | undefined>(user.avatarUrl);

  useEffect(() => {
    db.getProfile(user.id).then(setProfile);
  }, [user.id, activeTab]);

  const studentNavItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'workouts', label: 'Meus Treinos', icon: Dumbbell },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'progress', label: 'Minha Evolução', icon: TrendingUp, needsFitness: true },
    { id: 'library', label: 'Minha Biblioteca', icon: Library },
    { id: 'spiritual', label: 'Espiritual', icon: BookOpen },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle },
    { id: 'community', label: 'Comunidade', icon: Users },
  ];

  const trainerNavItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'students', label: 'Gestão de Alunos', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle },
  ];

  // Filtra itens do menu baseando-se no perfil e escolhas do onboarding
  const filteredItems = role === UserRole.STUDENT 
    ? studentNavItems.filter(item => {
        if (item.needsFitness) {
            // Só mostra a aba de Evolução se o usuário marcou que quer perder peso/foco físico no onboarding
            return profile?.onboardingChoices?.wantsWeightLoss === true;
        }
        return true;
    })
    : trainerNavItems;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setPreviewAvatar(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = () => {
      const updatedUser = { ...user, name: editName, avatarUrl: previewAvatar };
      db.updateUser(updatedUser);
      onUserUpdate(updatedUser);
      setIsProfileModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans overflow-x-hidden">
      {/* Header Mobile */}
      <div className="md:hidden bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-100 shadow-lg">
                <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-slate-900">TREYO</h1>
        </div>
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900">TREYO</h1>
                <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Corpo & Alma</p>
            </div>
          </div>
          
          <button onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }} className="mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100 w-full hover:border-indigo-200 hover:shadow-md transition-all group text-left relative">
             <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm overflow-hidden border-2 border-white">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
                <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                        {role === UserRole.TRAINER ? 'Personal Master' : 'Amigo Platinum'}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all mr-1" />
             </div>
          </button>

          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                    isActive ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-600/20' : 'bg-transparent'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-900'}`} />
                  </div>
                  <span className="font-bold text-sm tracking-wide">{item.label}</span>
                  {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />}
                </button>
              );
            })}
          </nav>

          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-4 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all mt-auto font-bold text-sm group">
            <div className="p-2 bg-slate-50 group-hover:bg-red-100 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
            </div>
            Sair da conta
          </button>
        </div>
      </div>

      <main className="flex-1 relative w-full overflow-x-hidden">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto p-6 md:p-10 relative z-10 pb-32 md:pb-10 min-h-screen">
            {children}
        </div>
      </main>

      {/* Modal Profile */}
      {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 transition-all animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative slide-up">
                  <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors p-2"><X className="w-6 h-6" /></button>
                  <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">Editar Perfil</h2>
                  <div className="flex flex-col items-center gap-8">
                      <div className="relative group">
                          <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden group-hover:shadow-indigo-100 transition-all">
                              {previewAvatar ? <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-300">{editName.charAt(0)}</div>}
                          </div>
                          <label className="absolute -bottom-2 -right-2 p-3.5 bg-indigo-600 rounded-2xl text-white cursor-pointer hover:bg-indigo-700 shadow-lg transition-transform active:scale-90">
                              <Camera className="w-5 h-5" /><input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                      </div>
                      <div className="w-full space-y-5">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Seu Nome</label>
                            <input className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-slate-700 transition-all" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                          <button onClick={handleSaveProfile} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                            <Save className="w-5 h-5" /> Salvar Alterações
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
};
