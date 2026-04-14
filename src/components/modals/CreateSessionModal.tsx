import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast } from 'sonner';
import { Course } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  defaultCourseId?: string;
}

export default function CreateSessionModal({ isOpen, onClose, courses, defaultCourseId }: Props) {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(defaultCourseId || (courses.length > 0 ? courses[0].id : ''));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Update default course if it changes while modal is closed
  React.useEffect(() => {
    if (isOpen && defaultCourseId) {
      setCourseId(defaultCourseId);
    } else if (isOpen && !courseId && courses.length > 0) {
      setCourseId(courses[0].id);
    }
  }, [isOpen, defaultCourseId, courses]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!courseId) {
      toast.error('Debes seleccionar un curso');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'sessions'), {
        userId: auth.currentUser.uid,
        schoolId: 'default',
        courseId,
        title,
        date,
        isGenerated: false,
        activities: '',
        competencies: [],
        capacities: [],
        performanceCriteria: [],
        resources: [],
        evaluation: '',
        createdAt: serverTimestamp()
      });
      toast.success('Sesión creada exitosamente');
      onClose();
      setTitle('');
    } catch (error) {
      console.error(error);
      toast.error('Error al crear la sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">Nueva Sesión</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {courses.length === 0 ? (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
              Debes crear al menos un curso antes de poder crear una sesión.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Curso / Área</label>
                <select 
                  required 
                  value={courseId} 
                  onChange={e => setCourseId(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="" disabled>Selecciona un curso</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Sesión</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Ej. Reconocemos nuestras emociones" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Programada</label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
            </>
          )}
          
          <div className="pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || courses.length === 0} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
