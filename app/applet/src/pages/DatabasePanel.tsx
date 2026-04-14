import React from 'react';

export default function DatabasePanel() {
  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
        Panel BD (Modo Experto)
      </h1>
      <p className="text-gray-600 mb-4">Control total de la base de datos, relaciones UML y edición en caliente.</p>
      
      <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center text-green-400 font-mono text-sm">
        // Lienzo UML interactivo aquí
      </div>
    </div>
  );
}
