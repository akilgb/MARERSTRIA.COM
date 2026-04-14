import React from 'react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { FileText, BookOpen, Sparkles, Clock, Plus, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, sessions, courses } = useFirebaseData();
  const navigate = useNavigate();

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalCourses = courses.length;
  const totalResources = sessions.reduce((acc, session) => acc + (session.generatedResources?.length || 0), 0);

  // Get recent sessions (sort by createdAt descending, take top 4)
  const recentSessions = [...sessions]
    .sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  // Get first name for greeting
  const firstName = user?.displayName?.split(' ')[0] || 'Docente';

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-600">
          Este es el resumen de tu actividad y progreso curricular.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sesiones Creadas</p>
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Cursos Activos</p>
            <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Recursos IA Generados</p>
            <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sessions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Sesiones Recientes
            </h2>
            <button 
              onClick={() => navigate('/workspace')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Ver todo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {recentSessions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentSessions.map(session => {
                  const course = courses.find(c => c.id === session.courseId);
                  return (
                    <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {session.title || 'Sesión sin título'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {course?.name || 'Curso no asignado'} • {session.date || 'Sin fecha'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/workspace')}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Abrir
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No hay sesiones recientes</h3>
                <p className="text-sm text-gray-500">Crea tu primera sesión de aprendizaje para empezar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500" />
            Acciones Rápidas
          </h2>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/workspace')}
              className="w-full flex items-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 group"
            >
              <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-semibold">Nueva Sesión</span>
                <span className="text-xs text-indigo-100">Crear desde cero o con IA</span>
              </div>
            </button>

            <button 
              onClick={() => navigate('/workspace')}
              className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm group"
            >
              <div className="bg-gray-100 p-2 rounded-xl text-gray-500 group-hover:text-gray-700 transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-semibold">Nuevo Curso</span>
                <span className="text-xs text-gray-500">Añadir área curricular</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
