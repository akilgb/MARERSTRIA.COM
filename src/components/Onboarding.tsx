import React, { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    school: '',
    level: 'Primaria',
    specialty: '',
    grade: '',
    section: ''
  });

  useEffect(() => {
    const checkProfile = async () => {
      if (!auth.currentUser) return;
      
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Profile already exists, skip onboarding
          onComplete();
        } else {
          // Profile doesn't exist, show form
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setLoading(false);
      }
    };
    
    checkProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const userProfile: UserProfile = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || 'Docente',
        school: formData.school,
        level: formData.level as 'Inicial' | 'Primaria' | 'Secundaria',
        specialty: formData.specialty,
        grade: formData.grade,
        section: formData.section,
        createdAt: serverTimestamp()
      };
      
      // Add a timeout to prevent infinite hanging if offline
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: No se pudo conectar con el servidor')), 10000);
      });

      await Promise.race([
        setDoc(doc(db, 'users', auth.currentUser.uid), userProfile),
        timeoutPromise
      ]);

      toast.success('¡Perfil guardado con éxito!');
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error('Error al guardar el perfil. Revisa tu conexión.');
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const userProfile: UserProfile = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || 'Docente',
        createdAt: serverTimestamp()
      };
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: No se pudo conectar con el servidor')), 10000);
      });

      await Promise.race([
        setDoc(doc(db, 'users', auth.currentUser.uid), userProfile),
        timeoutPromise
      ]);

      onComplete();
    } catch (error) {
      console.error("Error skipping profile:", error);
      toast.error('Error al omitir. Revisa tu conexión.');
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido a Docente AI!</h2>
          <p className="text-gray-600 mt-2">Cuéntanos un poco sobre ti para personalizar tu experiencia.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institución Educativa</label>
            <input 
              type="text" 
              value={formData.school}
              onChange={(e) => setFormData({...formData, school: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej. I.E. San Juan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <select 
              value={formData.level}
              onChange={(e) => setFormData({...formData, level: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Inicial">Inicial</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad / Área</label>
            <input 
              type="text" 
              value={formData.specialty}
              onChange={(e) => setFormData({...formData, specialty: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej. Matemáticas, Comunicación..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grado</label>
              <input 
                type="text" 
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. 4to"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
              <input 
                type="text" 
                value={formData.section}
                onChange={(e) => setFormData({...formData, section: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. A"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Comenzar
            </button>
            <button 
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 font-medium py-2.5 rounded-lg transition-colors"
            >
              Saltar por ahora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
