import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Users, Table, BookOpen, Plus, MoreHorizontal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TreeItem = ({ label, icon: Icon, children, defaultOpen = false, isSelected = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group",
          isSelected ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-100"
        )}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
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
  return (
    <div className="h-full flex bg-white">
      {/* Secondary Sidebar: File Explorer */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50/30 shrink-0 hidden md:flex">
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <span className="font-semibold text-xs text-gray-500 uppercase tracking-wider">Explorador</span>
          <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <TreeItem label="DISEÑO CURRICULAR" icon={BookOpen} defaultOpen>
            <TreeItem label="Matemáticas 4to Grado" icon={Folder} defaultOpen>
              <TreeItem label="Plan Anual Base" icon={FileText} />
              <TreeItem label="Bimestre 1" icon={Folder} defaultOpen>
                <TreeItem label="Unidad 1: Estadística" icon={Folder} defaultOpen>
                  <TreeItem label="Sesión 1: Recolección" icon={FileText} isSelected />
                  <TreeItem label="Sesión 2: Gráficos" icon={FileText} />
                </TreeItem>
              </TreeItem>
            </TreeItem>
          </TreeItem>
          
          <div className="my-3 border-t border-gray-200" />
          
          <TreeItem label="MIS AULAS" icon={Users} defaultOpen>
            <TreeItem label="4to A" icon={Folder}>
              <TreeItem label="Lista de Alumnos" icon={Users} />
              <TreeItem label="Registro Auxiliar" icon={Table} />
            </TreeItem>
            <TreeItem label="4to B" icon={Folder}>
              <TreeItem label="Lista de Alumnos" icon={Users} />
              <TreeItem label="Registro Auxiliar" icon={Table} />
            </TreeItem>
          </TreeItem>
        </div>
      </div>

      {/* Main Canvas: Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Breadcrumbs */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 overflow-hidden whitespace-nowrap">
            <span className="hover:text-gray-900 cursor-pointer transition-colors hidden sm:inline">Matemáticas 4to Grado</span>
            <ChevronRight className="w-4 h-4 hidden sm:inline" />
            <span className="hover:text-gray-900 cursor-pointer transition-colors hidden sm:inline">Bimestre 1</span>
            <ChevronRight className="w-4 h-4 hidden sm:inline" />
            <span className="text-gray-900 font-medium truncate">Sesión 1: Recolección</span>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <input 
              type="text" 
              defaultValue="Sesión 1: Recolección de Datos"
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 w-full border-none outline-none focus:ring-0 p-0 placeholder-gray-300"
              placeholder="Título de la sesión..."
            />
            
            <div className="prose prose-indigo max-w-none">
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                En esta sesión, los estudiantes aprenderán a diseñar encuestas y recolectar datos de su comunidad local para entender problemas ambientales.
              </p>
              
              <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-5 mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Propósito de Aprendizaje</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <span className="block text-xs text-gray-400 mb-1">Competencia</span>
                    <span className="text-sm font-medium text-gray-900">Resuelve problemas de gestión de datos e incertidumbre.</span>
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs text-gray-400 mb-1">Evidencia</span>
                    <span className="text-sm font-medium text-gray-900">Cuestionario de 5 preguntas aplicado.</span>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Secuencia Didáctica
                <span className="text-xs font-normal px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">90 min</span>
              </h2>
              
              <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-indigo-500">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"></div>
                  <h4 className="font-semibold text-gray-900 flex items-center justify-between">
                    Inicio
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">15 min</span>
                  </h4>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                    Presentación de un caso real sobre la contaminación en el barrio. Se plantea el conflicto cognitivo: ¿Cómo podemos medir exactamente cuánta basura se genera en nuestra calle?
                  </p>
                </div>
                
                <div className="relative pl-6 border-l-2 border-gray-200 hover:border-indigo-300 transition-colors cursor-text group">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-200 group-hover:bg-indigo-300 transition-colors"></div>
                  <h4 className="font-semibold text-gray-900 flex items-center justify-between">
                    Desarrollo
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">60 min</span>
                  </h4>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                    Los estudiantes se agrupan en equipos de 4. Se les entrega papelotes y elaboran un borrador de cuestionario. El docente monitorea y retroalimenta la formulación de preguntas cerradas.
                  </p>
                </div>

                <div className="relative pl-6 border-l-2 border-gray-200 hover:border-indigo-300 transition-colors cursor-text group">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-200 group-hover:bg-indigo-300 transition-colors"></div>
                  <h4 className="font-semibold text-gray-900 flex items-center justify-between">
                    Cierre
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">15 min</span>
                  </h4>
                  <p className="text-gray-400 text-sm mt-2 italic">
                    Haz clic para escribir o pídele a la IA que genere el cierre...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
