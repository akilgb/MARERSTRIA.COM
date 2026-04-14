import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Users, Table, BookOpen, Plus, MoreHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFirebaseData } from '../hooks/useFirebaseData';
import SessionDocument from '../components/SessionDocument';
import { UserProfile } from '../types';
import CreateCourseModal from '../components/modals/CreateCourseModal';
import CreateSessionModal from '../components/modals/CreateSessionModal';
import { useAppStore } from '../store/useAppStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TreeItem = ({ label, icon: Icon, children, defaultOpen = false, isSelected = false, onClick }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = React.Children.count(children) > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group",
          isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
        )}
        onClick={handleClick}
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          ) : null}
        </div>
        <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
        <span className="truncate">{label}</span>
      </div>
      {hasChildren && isOpen && (
        <div className="ml-4 pl-2 border-l border-gray-200 mt-0.5 flex flex-col gap-0.5">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Workspace() {
  const { user, sessions, courses, schools } = useFirebaseData();
  const { currentSessionId, setCurrentSessionId } = useAppStore();
  
  // Modal states
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const selectedSession = sessions.find(s => s.id === currentSessionId);
  const selectedCourse = selectedSession ? courses.find(c => c.id === selectedSession.courseId) : undefined;
  const selectedSchool = selectedCourse ? schools.find(s => s.id === selectedCourse.schoolId) : undefined;

  const profile: UserProfile = user ? {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Docente',
    createdAt: new Date()
  } : {} as UserProfile;

  return (
    <div className="h-full flex bg-white">
      {/* Secondary Sidebar: File Explorer */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0 hidden md:flex">
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 shrink-0 relative">
          <span className="font-semibold text-xs text-gray-500 uppercase tracking-wider">Explorador</span>
          <div className="relative">
            <button 
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {/* Dropdown Menu */}
            {isAddMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsAddMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 overflow-hidden">
                  <button 
                    onClick={() => { setIsCourseModalOpen(true); setIsAddMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Nuevo Curso
                  </button>
                  <button 
                    onClick={() => { setIsSessionModalOpen(true); setIsAddMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Nueva Sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <TreeItem label="DISEÑO CURRICULAR" icon={BookOpen} defaultOpen>
            {courses.length > 0 ? courses.map(course => (
              <TreeItem key={course.id} label={course.name} icon={Folder} defaultOpen>
                <TreeItem label="Plan Anual Base" icon={FileText} />
                <TreeItem label="Sesiones" icon={Folder} defaultOpen>
                  {sessions.filter(s => s.courseId === course.id).map(session => (
                    <TreeItem 
                      key={session.id} 
                      label={session.title} 
                      icon={FileText} 
                      isSelected={currentSessionId === session.id}
                      onClick={() => setCurrentSessionId(session.id)}
                    />
                  ))}
                </TreeItem>
              </TreeItem>
            )) : (
              <div className="px-4 py-3 text-sm text-gray-500 italic">
                No hay cursos registrados. Crea uno para empezar.
              </div>
            )}
          </TreeItem>
          
          <div className="my-3 border-t border-gray-200" />
          
          <TreeItem label="MIS AULAS" icon={Users} defaultOpen>
            <div className="px-4 py-3 text-sm text-gray-500 italic">
              Próximamente...
            </div>
          </TreeItem>
        </div>
      </div>

      {/* Main Canvas: Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Breadcrumbs */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 overflow-hidden whitespace-nowrap">
            {selectedCourse ? (
              <>
                <span className="hover:text-gray-900 cursor-pointer transition-colors hidden sm:inline">{selectedCourse.name}</span>
                <ChevronRight className="w-4 h-4 hidden sm:inline" />
                <span className="hover:text-gray-900 cursor-pointer transition-colors hidden sm:inline">Sesiones</span>
                <ChevronRight className="w-4 h-4 hidden sm:inline" />
                <span className="text-gray-900 font-medium truncate">{selectedSession?.title}</span>
              </>
            ) : (
              <span className="text-gray-500 italic">Espacio de Trabajo</span>
            )}
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {selectedSession ? (
            <SessionDocument 
              session={selectedSession}
              course={selectedCourse}
              school={selectedSchool}
              profile={profile}
              onUpdate={() => {}}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-500 mb-2">Selecciona o crea una sesión</p>
              <p className="text-sm mb-6 text-center max-w-md">Elige una sesión del explorador para verla o editarla, o crea una nueva para empezar a planificar.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCourseModalOpen(true)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Crear Curso
                </button>
                <button 
                  onClick={() => setIsSessionModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Crear Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateCourseModal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)} 
      />
      <CreateSessionModal 
        isOpen={isSessionModalOpen} 
        onClose={() => setIsSessionModalOpen(false)} 
        courses={courses}
      />
    </div>
  );
}
