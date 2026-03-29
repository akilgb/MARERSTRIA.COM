import React, { useState, useEffect, useContext, createContext } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, doc, setDoc, getDoc, onSnapshot, query, where, serverTimestamp, FirebaseUser, handleFirestoreError, OperationType, addDoc, deleteDoc } from './firebase';
import { UserProfile, LearningSession, Holiday, School, Course, Schedule } from './types';
import { generateLearningSession, getPeruvianHolidays } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  School as SchoolIcon,
  BookOpen,
  User as UserIcon, 
  LogOut, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings,
  Clock,
  FileText,
  Database,
  ArrowRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, getDay, parse, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg', isLoading?: boolean }>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Algo salió mal</h2>
              <p className="text-slate-600">Lo sentimos, ha ocurrido un error inesperado en la aplicación.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40">
              <code className="text-xs text-red-500">{this.state.error?.message}</code>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Recargar Aplicación
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Custom Confirmation Modal ---
function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6"
      >
        <div className="flex items-center gap-4 text-amber-600">
          <div className="p-2 bg-amber-100 rounded-full">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-slate-600">{message}</p>
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => { onConfirm(); onClose(); }} className="flex-1 bg-red-600 hover:bg-red-700">Confirmar</Button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Confirmation Context ---
interface ConfirmContextType {
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
}

function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </ConfirmContext.Provider>
  );
}

// --- Main App ---

const TIME_SERVERS = [
  'https://worldtimeapi.org/api/timezone/America/Lima',
  'https://timeapi.io/api/Time/current/zone?timeZone=America/Lima'
];

const SCHOOL_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const COURSE_COLORS = [
  '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', 
  '#ffedd5', '#fed7aa', '#fdb274', '#fb923c', '#f97316', 
  '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', 
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', 
  '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', 
  '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', 
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', 
  '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', 
  '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', 
  '#fae8ff', '#f5d0fe', '#f0abfc', '#e879f9', '#d946ef', 
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899',
];

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ConfirmProvider>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </ConfirmProvider>
    </ErrorBoundary>
  );
}

function App() {
  const { showConfirm } = useConfirm();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'schools' | 'profile' | 'database'>('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const orphans = {
    courses: courses.filter(c => !schools.find(s => s.id === c.schoolId)),
    schedules: schedules.filter(s => !schools.find(sch => sch.id === s.schoolId) || !courses.find(c => c.id === s.courseId)),
    sessions: sessions.filter(sess => !schools.find(sch => sch.id === sess.schoolId) || !courses.find(c => c.id === sess.courseId))
  };

  const cleanOrphans = async () => {
    showConfirm(
      'Limpiar Base de Datos',
      `Se eliminarán ${orphans.courses.length + orphans.schedules.length + orphans.sessions.length} registros huérfanos. ¿Continuar?`,
      async () => {
        try {
          const promises = [
            ...orphans.courses.map(c => deleteDoc(doc(db, 'courses', c.id))),
            ...orphans.schedules.map(s => deleteDoc(doc(db, 'schedules', s.id))),
            ...orphans.sessions.map(sess => deleteDoc(doc(db, 'sessions', sess.id)))
          ];
          await Promise.all(promises);
          toast.success('Base de Datos depurada correctamente');
        } catch (error) {
          toast.error('Error al depurar la base de datos');
        }
      }
    );
  };

  // Peru Time Sync
  useEffect(() => {
    const syncTime = async () => {
      try {
        // Try multiple sources as requested
        const sources = [
          'https://worldtimeapi.org/api/timezone/America/Lima',
          'https://timeapi.io/api/Time/current/zone?timeZone=America/Lima'
        ];
        
        for (const source of sources) {
          try {
            const response = await fetch(source);
            if (!response.ok) continue;
            const data = await response.json();
            const serverTime = new Date(data.datetime || data.dateTime).getTime();
            const localTime = Date.now();
            setTimeOffset(serverTime - localTime);
            console.log(`Time synced with ${source}. Offset: ${serverTime - localTime}ms`);
            break;
          } catch (e) {
            continue;
          }
        }
      } catch (error) {
        console.error("All time sync sources failed", error);
      }
    };
    syncTime();
    // Re-sync every 30 minutes
    const interval = setInterval(syncTime, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPeruNow = () => {
    const now = new Date(Date.now() + timeOffset);
    // Ensure it's always Peru time even if offset sync fails (fallback to Intl)
    return new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        try {
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setProfile({ 
              uid: firebaseUser.uid, 
              email: firebaseUser.email || '', 
              displayName: firebaseUser.displayName || 'Docente',
              ...data 
            } as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Docente',
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }

          // Real-time listeners
          const qSessions = query(collection(db, 'sessions'), where('userId', '==', firebaseUser.uid));
          onSnapshot(qSessions, (snapshot) => {
            setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LearningSession)));
          });

          const qHolidays = collection(db, 'holidays');
          onSnapshot(qHolidays, (snapshot) => {
            setHolidays(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Holiday)));
          });

          const qSchools = query(collection(db, 'schools'), where('userId', '==', firebaseUser.uid));
          onSnapshot(qSchools, (snapshot) => {
            setSchools(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as School)));
          });

          const qCourses = query(collection(db, 'courses'), where('userId', '==', firebaseUser.uid));
          onSnapshot(qCourses, (snapshot) => {
            setCourses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
          });

          const qSchedules = query(collection(db, 'schedules'), where('userId', '==', firebaseUser.uid));
          onSnapshot(qSchedules, (snapshot) => {
            setSchedules(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Schedule)));
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error', error);
    }
  };

  const [peruNow, setPeruNow] = useState(new Date());

  useEffect(() => {
    const syncTime = async () => {
      try {
        // Try multiple free time servers for redundancy
        const servers = TIME_SERVERS;
        
        let success = false;
        for (const url of servers) {
          try {
            const res = await fetch(url);
            const data = await res.json();
            // worldtimeapi uses 'datetime', timeapi.io uses 'dateTime'
            const timeStr = data.datetime || data.dateTime;
            if (timeStr) {
              const remoteDate = new Date(timeStr);
              setPeruNow(remoteDate);
              console.log(`Time synchronized with ${url}:`, remoteDate);
              success = true;
              break;
            }
          } catch (e) {
            console.warn(`Failed to sync with ${url}`, e);
          }
        }
        
        if (!success) {
          // Fallback to local time but adjusted to Peru if possible
          const now = new Date();
          const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
          setPeruNow(peruTime);
        }
      } catch (error) {
        console.error('Time sync error', error);
      }
    };

    syncTime();
    const interval = setInterval(syncTime, 60000); // Sync every minute
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => signOut(auth);

  const generateSessionForDate = async (date: Date, school: School, course: Course, schedule: Schedule) => {
    if (!profile) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const holidayNames = holidays.filter(h => h.date === dateStr).map(h => h.name);
    
    try {
      const courseHistory = sessions.filter(s => s.courseId === course.id);
      const sessionData = await generateLearningSession(
        profile, 
        school, 
        course, 
        schedule, 
        courseHistory, 
        dateStr, 
        holidayNames
      );
      const newSession: Partial<LearningSession> = {
        ...sessionData,
        userId: profile.uid,
        date: dateStr,
        schoolId: school.id,
        courseId: course.id,
        scheduleId: schedule.id,
        isGenerated: true,
        createdAt: serverTimestamp(),
      };
      // Use a unique ID for each session (date + schedule)
      const sessionId = `${profile.uid}_${dateStr}_${schedule.id}`;
      await setDoc(doc(db, 'sessions', sessionId), newSession);
    } catch (error) {
      console.error('Generation error', error);
      toast.error('Error al generar la sesión. Por favor, intenta de nuevo.');
    }
  };

  const syncHolidays = async () => {
    const year = new Date().getFullYear();
    const fetched = await getPeruvianHolidays(year);
    for (const h of fetched) {
      await setDoc(doc(db, 'holidays', h.date), h);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-2">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-200">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Marestria</h1>
            <p className="text-slate-500">Potenciando la labor docente con IA de grado gubernamental.</p>
          </div>
          <Card className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Bienvenido, Docente</h2>
              <p className="text-sm text-slate-500">Inicia sesión con tu cuenta institucional o personal para comenzar a generar tus sesiones alineadas al CNEB.</p>
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Continuar con Google
            </Button>
          </Card>
          <p className="text-xs text-slate-400">© 2026 Marestria - Ministerio de Educación (Simulación)</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl text-slate-900">Marestria</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}><ChevronLeft className="h-5 w-5" /></Button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
              <NavItem icon={<CalendarIcon />} label="Calendario" active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }} />
              <NavItem icon={<SchoolIcon />} label="Colegios y Cursos" active={activeTab === 'schools'} onClick={() => { setActiveTab('schools'); setIsMobileMenuOpen(false); }} />
              <NavItem icon={<Database />} label="Gestor BD" active={activeTab === 'database'} onClick={() => { setActiveTab('database'); setIsMobileMenuOpen(false); }} />
              <NavItem icon={<UserIcon />} label="Mi Perfil" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} />
            </nav>
            <div className="p-4 border-t border-slate-100">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-bottom border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Marestria</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<CalendarIcon />} label="Calendario" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <NavItem icon={<SchoolIcon />} label="Colegios y Cursos" active={activeTab === 'schools'} onClick={() => setActiveTab('schools')} />
          <NavItem icon={<Database />} label="Gestor BD" active={activeTab === 'database'} onClick={() => setActiveTab('database')} />
          <NavItem icon={<UserIcon />} label="Mi Perfil" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <LayoutDashboard className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold text-slate-800 capitalize">
              {activeTab === 'dashboard' && 'Panel de Control'}
              {activeTab === 'calendar' && 'Calendario Académico'}
              {activeTab === 'schools' && 'Gestión de Colegios y Cursos'}
              {activeTab === 'database' && 'Gestor de Base de Datos (UML)'}
              {activeTab === 'profile' && 'Configuración de Perfil'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{profile?.displayName}</p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
              <UserIcon className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard title="Sesiones Generadas" value={sessions.length} icon={<Sparkles className="text-emerald-600" />} />
                  <StatCard title="Colegios Registrados" value={schools.length} icon={<SchoolIcon className="text-blue-600" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg">Sesiones Recientes</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('calendar')}>Ver todo</Button>
                    </div>
                    <div className="space-y-4">
                      {sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(session => (
                        <div 
                          key={session.id} 
                          onClick={() => setSelectedSession(session)}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                              <BookOpen className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{session.title}</p>
                              <p className="text-xs text-slate-500">{format(new Date(session.date), 'PPP', { locale: es })}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      ))}
                      {sessions.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>Aún no has generado sesiones.</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg">Próximos Feriados</h3>
                      <Button variant="ghost" size="sm" onClick={syncHolidays}>Sincronizar</Button>
                    </div>
                    <div className="space-y-4">
                      {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).filter(h => new Date(h.date) >= peruNow).slice(0, 5).map(holiday => (
                        <div key={holiday.id} className="flex items-center gap-4 p-4 border-l-4 border-amber-400 bg-amber-50 rounded-r-xl">
                          <div className="text-center min-w-[50px]">
                            <p className="text-xs font-bold text-amber-600 uppercase">{format(new Date(holiday.date), 'MMM', { locale: es })}</p>
                            <p className="text-xl font-bold text-amber-900">{format(new Date(holiday.date), 'dd')}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-amber-900">{holiday.name}</p>
                            <p className="text-xs text-amber-700">Día no laborable oficial</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CalendarView 
                  currentDate={currentDate} 
                  setCurrentDate={setCurrentDate} 
                  sessions={sessions} 
                  holidays={holidays}
                  schools={schools}
                  courses={courses}
                  schedules={schedules}
                  profile={profile!}
                  onGenerate={generateSessionForDate}
                  selectedSession={selectedSession}
                  setSelectedSession={setSelectedSession}
                  peruNow={peruNow}
                />
              </motion.div>
            )}

            {activeTab === 'schools' && (
              <motion.div key="schools" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SchoolsView 
                  schools={schools} 
                  courses={courses} 
                  schedules={schedules} 
                  profile={profile!} 
                />
              </motion.div>
            )}

              {activeTab === 'database' && (
                <motion.div key="database" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <DatabaseManagerView 
                    schools={schools} 
                    courses={courses} 
                    schedules={schedules} 
                    sessions={sessions}
                    cleanOrphans={cleanOrphans}
                    hasOrphans={orphans.courses.length + orphans.schedules.length + orphans.sessions.length > 0}
                  />
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </main>

      {/* Global Session Modal */}
      <AnimatePresence>
        {selectedSession && (
          <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionModal({ session, onClose }: { session: LearningSession, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="text-2xl font-bold text-slate-900">{session.title}</h4>
            <p className="text-sm text-slate-500">{format(new Date(session.date), 'PPPP', { locale: es })}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 not-prose">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Competencias</p>
              <div className="flex flex-wrap gap-2">
                {session.competencies?.map(c => <span key={c} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{c}</span>)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capacidades</p>
              <div className="flex flex-wrap gap-2">
                {session.capacities?.map(c => <span key={c} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">{c}</span>)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos</p>
              <div className="flex flex-wrap gap-2">
                {session.resources?.map(r => <span key={r} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">{r}</span>)}
              </div>
            </div>
          </div>
          <hr className="my-8" />
          <ReactMarkdown>{session.activities}</ReactMarkdown>
          <hr className="my-8" />
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h5 className="text-emerald-900 font-bold mb-2">Evaluación</h5>
            <p className="text-emerald-800">{session.evaluation}</p>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir PDF</Button>
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Sub-components ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all',
        active 
          ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'h-5 w-5' })}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
          {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'h-6 w-6' })}
        </div>
      </div>
    </Card>
  );
}

function CalendarView({ currentDate, setCurrentDate, sessions, holidays, schools, courses, schedules, profile, onGenerate, selectedSession, setSelectedSession, peruNow }: { 
  currentDate: Date, 
  setCurrentDate: (d: Date) => void, 
  sessions: LearningSession[], 
  holidays: Holiday[],
  schools: School[],
  courses: Course[],
  schedules: Schedule[],
  profile: UserProfile,
  onGenerate: (d: Date, school: School, course: Course, schedule: Schedule) => Promise<void>,
  selectedSession: LearningSession | null,
  setSelectedSession: (s: LearningSession | null) => void,
  peruNow: Date
}) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  // Calculate padding for Monday start
  // getDay returns 0 for Sunday, 1 for Monday...
  // If 1st is Sunday (0), we need 6 empty slots
  // If 1st is Monday (1), we need 0 empty slots
  // If 1st is Tuesday (2), we need 1 empty slot
  const firstDayOfMonth = start;
  const paddingCount = (getDay(firstDayOfMonth) + 6) % 7;
  const padding = Array.from({ length: paddingCount });

  const handleGenerate = async (date: Date, school: School, course: Course, schedule: Schedule) => {
    const id = `${format(date, 'yyyy-MM-dd')}_${schedule.id}`;
    setGeneratingId(id);
    await onGenerate(date, school, course, schedule);
    setGeneratingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-slate-900">{format(currentDate, 'MMMM yyyy', { locale: es })}</h3>
          <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 border-r border-slate-200"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-50"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <Button onClick={() => setCurrentDate(peruNow)} variant="secondary">Hoy</Button>
      </div>

      <Card className="p-1">
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="bg-slate-50 p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
          ))}
          
          {/* Padding for Monday start */}
          {padding.map((_, i) => (
            <div key={`pad-${i}`} className="bg-slate-50/30 min-h-[180px]" />
          ))}

          {days.map((day) => {
            const dStr = format(day, 'yyyy-MM-dd');
            // Fix: getDay returns 0 for Sunday, 1 for Monday...
            // Our system uses 1 for Monday, 2 for Tuesday, ..., 7 for Sunday
            const dayOfWeek = getDay(day) === 0 ? 7 : getDay(day);
            const holiday = holidays.find(h => h.date === dStr);
            const isWeekendDay = isWeekend(day);
            
            // Find schedules for this day of week
            const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
            // Group by school
            const schoolGroups = schools.map(school => ({
              school,
              schedules: daySchedules.filter(s => s.schoolId === school.id)
            })).filter(g => g.schedules.length > 0);

            return (
              <div 
                key={dStr} 
                className={cn(
                  "bg-white min-h-[180px] p-2 flex flex-col gap-2 transition-colors",
                  isWeekendDay && "bg-slate-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", isSameDay(day, peruNow) ? "w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center" : "text-slate-900")}>
                    {format(day, 'd')}
                  </span>
                  {holiday && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded uppercase truncate max-w-[60px]">{holiday.name}</span>}
                </div>

                <div className="flex-1 space-y-2">
                  {schoolGroups.map(({ school, schedules: schoolSchedules }) => (
                    <div key={school.id} className="rounded-lg border-2 p-1 space-y-1" style={{ borderColor: school.color }}>
                      <p className="text-[8px] font-bold text-center uppercase text-slate-500 truncate">{school.name}</p>
                      <div className="grid grid-cols-1 gap-1">
                        {schoolSchedules.map(schedule => {
                          const course = courses.find(c => c.id === schedule.courseId);
                          const session = sessions.find(s => s.date === dStr && s.scheduleId === schedule.id);
                          const isGenerating = generatingId === `${dStr}_${schedule.id}`;

                          return (
                            <div key={schedule.id} className="flex flex-col border border-slate-100 rounded overflow-hidden">
                              <div className="bg-slate-100 px-1 py-0.5 text-center">
                                <span className="text-[8px] font-bold text-slate-700">{schedule.grade} {schedule.section}</span>
                              </div>
                              <button
                                onClick={() => session ? setSelectedSession(session) : handleGenerate(day, school, course!, schedule)}
                                disabled={isGenerating || holiday !== undefined}
                                className={cn(
                                  "p-1 text-[8px] font-bold text-center transition-all min-h-[40px] flex flex-col items-center justify-center relative group shadow-sm rounded-md",
                                  session ? "text-white ring-2 ring-white ring-inset" : "text-slate-700 hover:brightness-95"
                                )}
                                style={{ 
                                  background: course?.colors ? 
                                    (course.colors.length > 1 ? 
                                      `linear-gradient(135deg, ${course.colors.join(', ')})` : 
                                      course.colors[0]) : 
                                    ((course as any)?.color || '#f1f5f9'),
                                  opacity: session ? 1 : 0.7
                                }}
                              >
                                {isGenerating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <span className="leading-tight">{schedule.startTime}</span>
                                    <span className="leading-tight">{schedule.endTime}</span>
                                    {!session && <Plus className="h-2 w-2 absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />}
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SchoolsView({ schools, courses, schedules, profile }: { schools: School[], courses: Course[], schedules: Schedule[], profile: UserProfile }) {
  const { showConfirm } = useConfirm();
  console.log('SchoolsView rendered with profile:', profile);
  const [expandedSchools, setExpandedSchools] = useState<string[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState<{ schoolId: string } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<{ schoolId: string, courseId: string } | null>(null);

  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolColor, setNewSchoolColor] = useState(SCHOOL_COLORS[0]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColors, setNewCourseColors] = useState<string[]>([COURSE_COLORS[0]]);
  const [newCourseLevel, setNewCourseLevel] = useState<'Inicial' | 'Primaria' | 'Secundaria'>('Secundaria');
  const [newSchedule, setNewSchedule] = useState({ grade: '', section: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:30' });
  
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  const toggleSchool = (id: string) => setExpandedSchools(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleCourse = (id: string) => setExpandedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleAddSchool = async () => {
    console.log('handleAddSchool called', newSchoolName);
    if (!newSchoolName.trim()) return;
    setIsAddingSchool(true);
    try {
      console.log('Attempting to add school to Firestore...');
      await addDoc(collection(db, 'schools'), { 
        userId: profile.uid, 
        name: newSchoolName.trim(), 
        color: newSchoolColor, 
        createdAt: serverTimestamp() 
      });
      console.log('School added successfully');
      setNewSchoolName('');
      setNewSchoolColor(SCHOOL_COLORS[schools.length % SCHOOL_COLORS.length]);
      setShowSchoolModal(false);
    } catch (error) {
      console.error('Error in handleAddSchool:', error);
      handleFirestoreError(error, OperationType.CREATE, 'schools');
    } finally {
      setIsAddingSchool(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim() || !showCourseModal) return;
    setIsAddingCourse(true);
    try {
      await addDoc(collection(db, 'courses'), { 
        userId: profile.uid, 
        schoolId: showCourseModal.schoolId, 
        name: newCourseName.trim(), 
        colors: newCourseColors, 
        level: newCourseLevel 
      });
      setNewCourseName('');
      setNewCourseColors([COURSE_COLORS[courses.length % COURSE_COLORS.length]]);
      setShowCourseModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'courses');
    } finally {
      setIsAddingCourse(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.grade.trim() || !showScheduleModal) return;
    setIsAddingSchedule(true);
    try {
      const scheduleData = {
        userId: profile.uid,
        schoolId: showScheduleModal.schoolId,
        courseId: showScheduleModal.courseId,
        grade: newSchedule.grade.trim(),
        section: newSchedule.section.trim(),
        dayOfWeek: Number(newSchedule.dayOfWeek),
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime
      };

      // Conflict detection
      const conflict = schedules.find(s => 
        s.dayOfWeek === scheduleData.dayOfWeek && 
        ((scheduleData.startTime >= s.startTime && scheduleData.startTime < s.endTime) || 
         (scheduleData.endTime > s.startTime && scheduleData.endTime <= s.endTime) || 
         (scheduleData.startTime <= s.startTime && scheduleData.endTime >= s.endTime))
      );

      if (conflict) {
        const conflictSchool = schools.find(s => s.id === conflict.schoolId);
        const conflictCourse = courses.find(c => c.id === conflict.courseId);
        toast.warning('¡CONFLICTO DETECTADO!', {
          description: `Ya tienes una clase programada de ${conflict.startTime} a ${conflict.endTime} en ${conflictSchool?.name} (${conflictCourse?.name}).`
        });
        setIsAddingSchedule(false);
        return;
      }

      await addDoc(collection(db, 'schedules'), scheduleData);
      setNewSchedule({ grade: '', section: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:30' });
      setShowScheduleModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    showConfirm(
      '¿Eliminar elemento?',
      '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
      async () => {
        try {
          await deleteDoc(doc(db, col, id));
          toast.success('Elemento eliminado correctamente');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, col);
          toast.error('Error al eliminar el elemento');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Mis Instituciones</h3>
          <p className="text-slate-500">Gestiona tus colegios, cursos y horarios de forma organizada.</p>
        </div>
        <Button onClick={() => setShowSchoolModal(true)}><Plus className="mr-2 h-4 w-4" /> Agregar Colegio</Button>
      </div>

      <div className="space-y-4">
        {schools.map(school => (
          <div key={school.id} className={cn("bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-l-8")} style={{ borderLeftColor: school.color }}>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => toggleSchool(school.id)}>
              <div className="flex items-center gap-3">
                <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", !expandedSchools.includes(school.id) && "-rotate-90")} />
                <SchoolIcon className="h-5 w-5 text-slate-600" />
                <h4 className="font-bold text-lg text-slate-900">{school.name}</h4>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => setShowCourseModal({ schoolId: school.id })}><Plus className="h-4 w-4 mr-1" /> Curso</Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteItem('schools', school.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <AnimatePresence>
              {expandedSchools.includes(school.id) && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/50">
                  <div className="p-4 pl-12 space-y-3">
                    {courses.filter(c => c.schoolId === school.id).map(course => (
                      <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => toggleCourse(course.id)}>
                          <div className="flex items-center gap-3">
                            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", !expandedCourses.includes(course.id) && "-rotate-90")} />
                            <div className="flex -space-x-1">
                              {course.colors?.map((c, i) => (
                                <div key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                              ))}
                            </div>
                            <span className="font-semibold text-slate-800">{course.name}</span>
                          </div>
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal({ schoolId: school.id, courseId: course.id })}><Plus className="h-4 w-4 mr-1" /> Horario</Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteItem('courses', course.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>

                        {expandedCourses.includes(course.id) && (
                          <div className="p-3 pl-10 border-t border-slate-100 bg-slate-50/30 space-y-2">
                            {schedules.filter(s => s.courseId === course.id).map(schedule => (
                              <div key={schedule.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="font-bold text-emerald-600">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][schedule.dayOfWeek - 1]}</span>
                                  <span className="text-slate-600 font-medium">{schedule.grade} {schedule.section}</span>
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    <span>{schedule.startTime} - {schedule.endTime}</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-400 h-7 w-7 p-0" onClick={() => deleteItem('schedules', schedule.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            ))}
                            {schedules.filter(s => s.courseId === course.id).length === 0 && (
                              <p className="text-xs text-slate-400 italic">No hay horarios definidos.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {courses.filter(c => c.schoolId === school.id).length === 0 && (
                      <p className="text-sm text-slate-400 italic">No hay cursos registrados en este colegio.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {schools.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <SchoolIcon className="h-12 w-12 mx-auto mb-4 text-slate-200" />
            <p className="text-slate-400">Comienza agregando tu primer colegio para organizar tus clases.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSchoolModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h4 className="text-xl font-bold mb-4">Agregar Nuevo Colegio</h4>
              <form onSubmit={e => { e.preventDefault(); handleAddSchool(); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nombre del Colegio</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newSchoolName} 
                    onChange={e => setNewSchoolName(e.target.value)}
                    placeholder="Ej. Colegio Nacional San Juan"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Color Identificador</label>
                  <div className="flex flex-wrap gap-2">
                    {SCHOOL_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewSchoolColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          newSchoolColor === color ? "border-slate-900 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowSchoolModal(false)} disabled={isAddingSchool}>Cancelar</Button>
                  <Button type="submit" className="flex-1" isLoading={isAddingSchool}>Guardar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h4 className="text-xl font-bold mb-4">Agregar Nuevo Curso</h4>
              <form onSubmit={e => { e.preventDefault(); handleAddCourse(); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nombre del Curso</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newCourseName} 
                    onChange={e => setNewCourseName(e.target.value)}
                    placeholder="Ej. Matemática, Comunicación..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nivel</label>
                    <select 
                      value={newCourseLevel} 
                      onChange={e => setNewCourseLevel(e.target.value as any)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="Inicial">Inicial</option>
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Colores (Máx. 3)</label>
                    <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto p-1 border border-slate-100 rounded-xl">
                      {COURSE_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setNewCourseColors(prev => {
                              if (prev.includes(color)) {
                                return prev.filter(c => c !== color);
                              }
                              if (prev.length < 3) {
                                return [...prev, color];
                              }
                              return prev;
                            });
                          }}
                          className={cn(
                            "w-6 h-6 rounded-full border transition-all",
                            newCourseColors.includes(color) ? "border-slate-900 scale-110 ring-2 ring-emerald-500 ring-offset-1" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {newCourseColors.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                      ))}
                      {newCourseColors.length === 0 && <span className="text-[10px] text-red-500 italic">Selecciona al menos un color</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCourseModal(null)} disabled={isAddingCourse}>Cancelar</Button>
                  <Button type="submit" className="flex-1" isLoading={isAddingCourse}>Guardar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h4 className="text-xl font-bold mb-4">Programar Horario</h4>
              <form onSubmit={e => { e.preventDefault(); handleAddSchedule(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Grado</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newSchedule.grade} 
                      onChange={e => setNewSchedule({...newSchedule, grade: e.target.value})}
                      placeholder="Ej. 4°"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sección</label>
                    <input 
                      type="text" 
                      value={newSchedule.section} 
                      onChange={e => setNewSchedule({...newSchedule, section: e.target.value})}
                      placeholder="Ej. A"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Día</label>
                    <select 
                      value={newSchedule.dayOfWeek} 
                      onChange={e => setNewSchedule({...newSchedule, dayOfWeek: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value={1}>Lunes</option>
                      <option value={2}>Martes</option>
                      <option value={3}>Miércoles</option>
                      <option value={4}>Jueves</option>
                      <option value={5}>Viernes</option>
                      <option value={6}>Sábado</option>
                      <option value={7}>Domingo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Inicio</label>
                    <input type="time" value={newSchedule.startTime} onChange={e => setNewSchedule({...newSchedule, startTime: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Fin</label>
                    <input type="time" value={newSchedule.endTime} onChange={e => setNewSchedule({...newSchedule, endTime: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowScheduleModal(null)} disabled={isAddingSchedule}>Cancelar</Button>
                  <Button type="submit" className="flex-1" isLoading={isAddingSchedule}>Guardar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DatabaseManagerView({ 
  schools, 
  courses, 
  schedules, 
  sessions, 
  cleanOrphans,
  hasOrphans 
}: { 
  schools: School[], 
  courses: Course[], 
  schedules: Schedule[], 
  sessions: LearningSession[],
  cleanOrphans: () => void,
  hasOrphans: boolean
}) {
  const { showConfirm } = useConfirm();

  const deleteRaw = async (col: string, id: string) => {
    showConfirm('Eliminar Registro', '¿Confirmas la eliminación directa de este registro?', async () => {
      try {
        await deleteDoc(doc(db, col, id));
        toast.success('Registro eliminado');
      } catch (e) {
        toast.error('Error al eliminar');
      }
    });
  };

  const EntityCard = ({ title, items, icon, color, colName, parentCheck }: { 
    title: string, 
    items: any[], 
    icon: React.ReactNode, 
    color: string,
    colName: string,
    parentCheck?: (item: any) => boolean
  }) => (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-w-[300px]">
      <div className={cn("p-3 flex items-center justify-between border-b", color)}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {icon}
          <span>{title} ({items.length})</span>
        </div>
      </div>
      <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto bg-slate-50/50">
        {items.map(item => {
          const isOrphan = parentCheck ? !parentCheck(item) : false;
          return (
            <div key={item.id} className={cn(
              "p-2 rounded-lg border text-xs flex flex-col gap-1 transition-all",
              isOrphan ? "bg-red-50 border-red-200 ring-1 ring-red-500/20" : "bg-white border-slate-100"
            )}>
              <div className="flex justify-between items-start">
                <span className="font-bold truncate max-w-[180px]">{item.name || item.title || (item.grade ? item.grade + ' ' + item.section : '')}</span>
                <button onClick={() => deleteRaw(colName, item.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-mono">ID: {item.id.substring(0, 8)}...</div>
                <div className="flex gap-0.5">
                  {item.colors?.map((c: string, i: number) => (
                    <div key={i} className="w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                  ))}
                  {item.color && !item.colors && (
                    <div className="w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: item.color }} />
                  )}
                </div>
              </div>
              {isOrphan && (
                <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mt-1">
                  <AlertCircle className="h-2 w-2" />
                  <span>HUÉRFANO (Sin Padre)</span>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-center py-4 text-slate-400 text-xs italic">Sin registros</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Gestor de Base de Datos</h3>
          <p className="text-slate-500">Visualización relacional y limpieza de registros huérfanos.</p>
        </div>
        {hasOrphans && (
          <Button onClick={cleanOrphans} className="bg-red-600 hover:bg-red-700">
            <Trash2 className="mr-2 h-4 w-4" /> Limpiar Huérfanos
          </Button>
        )}
      </div>

      <div className="flex gap-8 overflow-x-auto pb-8 pt-4 items-start">
        <EntityCard 
          title="Schools" 
          items={schools} 
          icon={<SchoolIcon className="h-4 w-4" />} 
          color="bg-emerald-50 text-emerald-700 border-emerald-200"
          colName="schools"
        />
        
        <div className="flex flex-col justify-center h-[400px] text-slate-300">
          <ArrowRight className="h-8 w-8" />
        </div>

        <EntityCard 
          title="Courses" 
          items={courses} 
          icon={<BookOpen className="h-4 w-4" />} 
          color="bg-blue-50 text-blue-700 border-blue-200"
          colName="courses"
          parentCheck={(c) => !!schools.find(s => s.id === c.schoolId)}
        />

        <div className="flex flex-col justify-center h-[400px] text-slate-300">
          <ArrowRight className="h-8 w-8" />
        </div>

        <EntityCard 
          title="Schedules" 
          items={schedules} 
          icon={<Clock className="h-4 w-4" />} 
          color="bg-amber-50 text-amber-700 border-amber-200"
          colName="schedules"
          parentCheck={(s) => !!schools.find(sch => sch.id === s.schoolId) && !!courses.find(c => c.id === s.courseId)}
        />

        <div className="flex flex-col justify-center h-[400px] text-slate-300">
          <ArrowRight className="h-8 w-8" />
        </div>

        <EntityCard 
          title="Sessions" 
          items={sessions} 
          icon={<Sparkles className="h-4 w-4" />} 
          color="bg-purple-50 text-purple-700 border-purple-200"
          colName="sessions"
          parentCheck={(sess) => !!schools.find(sch => sch.id === sess.schoolId) && !!courses.find(c => c.id === sess.courseId)}
        />
      </div>

      <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
          <Settings className="h-4 w-4" /> Notas de Arquitectura (UML)
        </h4>
        <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
          <li><strong>Schools:</strong> Entidad raíz. Al eliminarse, sus hijos (Courses/Schedules) pierden referencia.</li>
          <li><strong>Courses:</strong> Depende de School (1:N).</li>
          <li><strong>Schedules:</strong> Depende de School y Course (Composición).</li>
          <li><strong>Sessions:</strong> Depende de Course y Schedule para el contexto de IA.</li>
          <li className="text-red-500 font-bold">Los registros en rojo son "Huérfanos" y están causando conflictos en tu calendario.</li>
        </ul>
      </div>
    </div>
  );
}

function ProfileView({ profile, setProfile }: { profile: UserProfile, setProfile: (p: UserProfile) => void }) {
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', profile.uid), formData);
      setProfile(formData);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Profile save error', error);
      toast.error('Error al actualizar el perfil');
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">Configuración de Perfil</h3>
        <p className="text-slate-500">Personaliza tu información básica y profesional.</p>
      </div>
      <Card className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
            <input 
              type="text" 
              value={formData.displayName} 
              onChange={e => setFormData({...formData, displayName: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
            <input 
              type="email" 
              value={formData.email} 
              disabled
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Especialidad</label>
            <input 
              type="text" 
              value={formData.specialty || ''} 
              onChange={e => setFormData({...formData, specialty: e.target.value})}
              placeholder="Ej. Matemática, Ciencias Sociales..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nivel de Enseñanza</label>
            <select 
              value={formData.level || 'Secundaria'} 
              onChange={e => setFormData({...formData, level: e.target.value as any})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="Inicial">Inicial</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
            </select>
          </div>
        </div>
        <div className="pt-4">
          <Button onClick={handleSave} isLoading={isSaving} className="w-full">Guardar Perfil</Button>
        </div>
      </Card>
    </div>
  );
}
