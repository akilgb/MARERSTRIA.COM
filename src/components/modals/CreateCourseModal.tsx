import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCourseModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Primaria');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'courses'), {
        userId: auth.currentUser.uid,
        schoolId: 'default', // Placeholder until full school management is added
        name,
        level,
        colors: ['#4F46E5', '#818CF8'],
        createdAt: serverTimestamp()
      });
      toast.success('Curso creado exitosamente');
      onClose();
      setName('');
    } catch (error) {
      console.error(error);
      toast.error('Error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">Nuevo Curso / Área</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej. Matemáticas 4to Grado" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <select 
              value={level} 
              onChange={e => setLevel(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="Inicial">Inicial</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
            </select>
          </div>
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
              disabled={loading} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear Curso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
