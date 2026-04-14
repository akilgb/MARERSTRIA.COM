import React, { useState, useRef, useMemo, useEffect } from 'react';
import JoditEditor from 'jodit-react';
import { LearningSession, School, Course, Schedule, UserProfile, SessionResource } from '../types';
import { Download, Image as ImageIcon, FileQuestion, ListChecks, Type, Loader2, Save, Sparkles, ArrowDownUp } from 'lucide-react';
import { generateSessionResource, generateSessionImage } from '../services/geminiService';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  session: LearningSession;
  school?: School;
  course?: Course;
  schedule?: Schedule;
  profile: UserProfile;
  onUpdate: (updatedSession: LearningSession) => void;
}

const generateInitialHtml = (data: any, profile: UserProfile, school?: School, course?: Course, schedule?: Schedule, sessionDate?: string) => {
  return `
    <h2 style="text-align: center; font-family: Arial, sans-serif; text-transform: uppercase;">SESIÓN DE APRENDIZAJE: ${data.titulo}</h2>
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;" border="1">
      <tbody>
        <tr>
          <td colspan="4" style="background-color: #f3f4f6; font-weight: bold; text-align: center; padding: 8px;">I. DATOS INFORMATIVOS</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; width: 25%;">Docente:</td>
          <td style="padding: 8px; width: 25%;">${profile.displayName}</td>
          <td style="font-weight: bold; padding: 8px; width: 25%;">I.E.:</td>
          <td style="padding: 8px; width: 25%;">${school?.name || '---'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Área/Curso:</td>
          <td style="padding: 8px;">${course?.name || '---'}</td>
          <td style="font-weight: bold; padding: 8px;">Grado y Sección:</td>
          <td style="padding: 8px;">${schedule?.grade || '---'} ${schedule?.section || ''}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Fecha:</td>
          <td style="padding: 8px;">${sessionDate || '---'}</td>
          <td style="font-weight: bold; padding: 8px;">Duración:</td>
          <td style="padding: 8px;">${schedule ? `${schedule.startTime} - ${schedule.endTime}` : '---'}</td>
        </tr>
      </tbody>
    </table>
    <br/>
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;" border="1">
      <tbody>
        <tr>
          <td colspan="2" style="background-color: #f3f4f6; font-weight: bold; text-align: center; padding: 8px;">II. PROPÓSITOS DE APRENDIZAJE</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; width: 25%;">Propósito:</td>
          <td style="padding: 8px;">${data.proposito}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Competencia:</td>
          <td style="padding: 8px;">${data.competencia}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Capacidades:</td>
          <td style="padding: 8px;">${data.capacidades}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Desempeños:</td>
          <td style="padding: 8px;">${data.desempenos}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Criterios de Evaluación:</td>
          <td style="padding: 8px;">${data.criterios}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Evidencia:</td>
          <td style="padding: 8px;">${data.evidencia}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Instrumento:</td>
          <td style="padding: 8px;">${data.instrumento}</td>
        </tr>
      </tbody>
    </table>
    <br/>
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;" border="1">
      <tbody>
        <tr>
          <td colspan="3" style="background-color: #f3f4f6; font-weight: bold; text-align: center; padding: 8px;">III. SECUENCIA DIDÁCTICA</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: center; padding: 8px; width: 15%;">MOMENTOS</td>
          <td style="font-weight: bold; text-align: center; padding: 8px; width: 70%;">ESTRATEGIAS / ACTIVIDADES</td>
          <td style="font-weight: bold; text-align: center; padding: 8px; width: 15%;">TIEMPO</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: center; padding: 8px;">INICIO</td>
          <td style="padding: 8px;">${(data.inicio || '').replace(/\n/g, '<br/>')}</td>
          <td style="text-align: center; padding: 8px;">${data.inicioTiempo}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: center; padding: 8px;">DESARROLLO</td>
          <td style="padding: 8px;">${(data.desarrollo || '').replace(/\n/g, '<br/>')}</td>
          <td style="text-align: center; padding: 8px;">${data.desarrolloTiempo}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: center; padding: 8px;">CIERRE</td>
          <td style="padding: 8px;">${(data.cierre || '').replace(/\n/g, '<br/>')}</td>
          <td style="text-align: center; padding: 8px;">${data.cierreTiempo}</td>
        </tr>
      </tbody>
    </table>
    <br/>
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;" border="1">
      <tbody>
        <tr>
          <td colspan="2" style="background-color: #f3f4f6; font-weight: bold; text-align: center; padding: 8px;">IV. RECURSOS Y EVALUACIÓN</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px; width: 25%;">Recursos y Materiales:</td>
          <td style="padding: 8px;">${(data.recursos || '').replace(/\n/g, '<br/>')}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 8px;">Instrumentos de Evaluación:</td>
          <td style="padding: 8px;">${(data.evaluacion || '').replace(/\n/g, '<br/>')}</td>
        </tr>
      </tbody>
    </table>
  `;
};

export default function SessionDocument({ session, school, course, schedule, profile, onUpdate }: Props) {
  const [isGeneratingResource, setIsGeneratingResource] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);

  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    if (session.htmlContent) {
      setHtmlContent(session.htmlContent);
      return;
    }

    const parseActivities = (activities: string) => {
      let inicio = 'Motivación, saberes previos, conflicto cognitivo...';
      let desarrollo = activities || 'Gestión y acompañamiento...';
      let cierre = 'Evaluación y metacognición...';
      let inicioTiempo = '15 min';
      let desarrolloTiempo = '60 min';
      let cierreTiempo = '15 min';

      if (!activities) return { inicio, desarrollo, cierre, inicioTiempo, desarrolloTiempo, cierreTiempo };

      const inicioMatch = activities.match(/(?:\*\*|###\s*)?\bINICIO\b.*?(?=(?:\*\*|###\s*)?\bDESARROLLO\b|$)/is);
      const desarrolloMatch = activities.match(/(?:\*\*|###\s*)?\bDESARROLLO\b.*?(?=(?:\*\*|###\s*)?\bCIERRE\b|$)/is);
      const cierreMatch = activities.match(/(?:\*\*|###\s*)?\bCIERRE\b.*$/is);

      const cleanContent = (text: string) => {
        return text.replace(/^(?:\*\*|###\s*)?(?:INICIO|DESARROLLO|CIERRE)(?:\s*\((.*?)\))?[\*\:\s]*/i, '').trim();
      };

      const extractTime = (text: string) => {
        const match = text.match(/^(?:\*\*|###\s*)?(?:INICIO|DESARROLLO|CIERRE)\s*\((.*?)\)/i);
        return match ? match[1].trim() : null;
      };

      if (inicioMatch) {
        inicio = cleanContent(inicioMatch[0]);
        const t = extractTime(inicioMatch[0]);
        if (t) inicioTiempo = t;
      }
      if (desarrolloMatch) {
        desarrollo = cleanContent(desarrolloMatch[0]);
        const t = extractTime(desarrolloMatch[0]);
        if (t) desarrolloTiempo = t;
      }
      if (cierreMatch) {
        cierre = cleanContent(cierreMatch[0]);
        const t = extractTime(cierreMatch[0]);
        if (t) cierreTiempo = t;
      }

      if (!inicioMatch && !desarrolloMatch && !cierreMatch) {
        desarrollo = activities;
      }

      return { inicio, desarrollo, cierre, inicioTiempo, desarrolloTiempo, cierreTiempo };
    };

    let dataToUse: any = {};

    if (session.structuredData) {
      dataToUse = { ...session.structuredData };
      
      // Fix if AI dumped everything into desarrollo
      if (dataToUse.desarrollo && (dataToUse.desarrollo.includes('**INICIO') || dataToUse.desarrollo.includes('**CIERRE'))) {
        const parsed = parseActivities(dataToUse.desarrollo);
        dataToUse.inicio = parsed.inicio;
        dataToUse.desarrollo = parsed.desarrollo;
        dataToUse.cierre = parsed.cierre;
        dataToUse.inicioTiempo = parsed.inicioTiempo;
        dataToUse.desarrolloTiempo = parsed.desarrolloTiempo;
        dataToUse.cierreTiempo = parsed.cierreTiempo;
      }
      
      // Fix missing fields
      if (!dataToUse.proposito) dataToUse.proposito = '';
      if (!dataToUse.criterios) dataToUse.criterios = '';
      if (!dataToUse.evidencia) dataToUse.evidencia = '';
      if (!dataToUse.recursos) dataToUse.recursos = session.resources?.join(', ') || '';
      if (!dataToUse.evaluacion) dataToUse.evaluacion = session.evaluation || '';
    } else {
      const parsed = parseActivities(session.activities || '');
      dataToUse = {
        titulo: session.title || '',
        proposito: '',
        competencia: session.competencies?.join(', ') || '',
        capacidades: session.capacities?.join(', ') || '',
        desempenos: session.performanceCriteria?.join(', ') || '',
        criterios: '',
        evidencia: '',
        instrumento: session.evaluation || '',
        recursos: session.resources?.join(', ') || '',
        evaluacion: session.evaluation || '',
        ...parsed
      };
    }

    setHtmlContent(generateInitialHtml(dataToUse, profile, school, course, schedule, session.date));
  }, [session, profile, school, course, schedule]);

  const editorConfig = useMemo(() => ({
    readonly: false,
    height: 600,
    placeholder: 'Escribe aquí...',
    toolbarSticky: false,
    style: {
      background: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }
  }), []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSession = {
        ...session,
        htmlContent
      };
      await updateDoc(doc(db, 'sessions', session.id), { htmlContent });
      onUpdate(updatedSession);
      toast.success('Sesión guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la sesión');
    } finally {
      setIsSaving(false);
    }
  };

  const exportToWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; font-family: Arial, sans-serif; font-size: 11pt; } h1, h2, h3 { font-family: Arial, sans-serif; } .bg-gray { background-color: #f3f4f6; font-weight: bold; }</style></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Sesion_${session.title.replace(/\s+/g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const handleGenerateResource = async (type: 'image' | 'exercise_multiple' | 'exercise_match' | 'exercise_fill' | 'exercise_order') => {
    setIsGeneratingResource(true);
    try {
      let content = '';
      let title = '';
      
      if (type === 'image') {
        title = 'Imagen Ilustrativa';
        content = await generateSessionImage(`Concepto educativo sobre: ${session.title}`);
      } else {
        const grade = schedule ? `${schedule.grade} ${schedule.section}` : 'estudiantes';
        content = await generateSessionResource(type, session.title, grade);
        title = type === 'exercise_multiple' ? 'Práctica: Opción Múltiple' : 
                type === 'exercise_match' ? 'Práctica: Relacionar' : 
                type === 'exercise_fill' ? 'Práctica: Completar' : 'Práctica: Ordenar';
      }

      const newResource: SessionResource = {
        id: Date.now().toString(),
        type,
        title,
        content
      };

      const updatedResources = [...(session.generatedResources || []), newResource];
      await updateDoc(doc(db, 'sessions', session.id), { generatedResources: updatedResources });
      onUpdate({ ...session, generatedResources: updatedResources });
      toast.success('Recurso generado correctamente');
    } catch (error) {
      toast.error('Error al generar el recurso');
    } finally {
      setIsGeneratingResource(false);
    }
  };

  const renderResource = (resource: SessionResource) => {
    if (resource.type === 'image') {
      return <img src={resource.content} alt={resource.title} className="max-w-full h-auto rounded-lg shadow-sm" />;
    }
    
    try {
      const data = JSON.parse(resource.content);
      if (resource.type === 'exercise_multiple') {
        return (
          <div className="space-y-4">
            {data.map((q: any, i: number) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-800 mb-2">{i + 1}. {q.question}</p>
                <ul className="space-y-1 pl-4">
                  {q.options.map((opt: string, j: number) => (
                    <li key={j} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                      <span className="text-slate-700">{opt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-sm text-emerald-600 bg-emerald-50 p-2 rounded">
                  <strong>Respuesta:</strong> {q.correctAnswer} <br/>
                  <span className="text-emerald-700/80">{q.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        );
      }
      if (resource.type === 'exercise_match') {
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-bold text-slate-700 text-center">Columna A</h5>
              {data.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-center">{item.left}</div>
              ))}
            </div>
            <div className="space-y-2">
              <h5 className="font-bold text-slate-700 text-center">Columna B</h5>
              {/* Shuffle right column in a real app, here we just display it */}
              {data.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-center">{item.right}</div>
              ))}
            </div>
          </div>
        );
      }
      if (resource.type === 'exercise_fill') {
        return (
          <div className="space-y-3">
            {data.map((item: any, i: number) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                <p className="text-slate-800 leading-relaxed">{i + 1}. {item.sentence}</p>
                <div className="mt-2 text-sm text-emerald-600">
                  <strong>Respuesta:</strong> {item.answer}
                </div>
              </div>
            ))}
          </div>
        );
      }
      if (resource.type === 'exercise_order') {
        return (
          <div className="space-y-4">
            {data.map((item: any, i: number) => (
              <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-700 mb-2">Ordena los siguientes elementos:</p>
                <ul className="list-decimal pl-5 space-y-1 mb-3 text-slate-600">
                  {item.scrambled.map((s: string, j: number) => <li key={j}>{s}</li>)}
                </ul>
                <div className="mt-3 text-sm text-emerald-600 bg-emerald-50 p-2 rounded">
                  <strong>Orden Correcto:</strong>
                  <ol className="list-decimal pl-5 mt-1">
                    {item.correctOrder.map((s: string, j: number) => <li key={j}>{s}</li>)}
                  </ol>
                  {item.explanation && <p className="mt-2 text-emerald-700/80">{item.explanation}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      return <p className="text-red-500">Error al renderizar el recurso.</p>;
    }
  };

  const isRecommended = (type: string) => {
    if (!session.metadata) return false;
    const inEval = session.metadata.herramientasEvaluacionSugeridas?.some(h => h.recursoId === type);
    const inMat = session.metadata.materialesSugeridos?.some(m => m.recursoId === type);
    return inEval || inMat;
  };

  const getButtonClass = (type: string) => {
    const base = "w-full flex items-center gap-3 p-3 text-left border rounded-xl transition-colors disabled:opacity-50";
    if (isRecommended(type)) {
      return `${base} bg-emerald-50 border-emerald-300 hover:bg-emerald-100 ring-2 ring-emerald-400 animate-[pulse_2s_ease-in-out_infinite] relative overflow-hidden`;
    }
    return `${base} bg-slate-50 hover:bg-slate-100 border-slate-200`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Document Editor Area */}
      <div className="w-full flex flex-col bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-blue-600" />
            Plantilla de Sesión (MINEDU)
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
            <button 
              onClick={exportToWord}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar a Word
            </button>
          </div>
        </div>

        <div className="p-4 flex justify-center bg-slate-100 overflow-x-auto">
          <div className="w-full max-w-[21cm] min-w-[800px] bg-white shadow-xl">
            <JoditEditor
              ref={editorRef}
              value={htmlContent}
              config={editorConfig}
              onBlur={newContent => setHtmlContent(newContent)}
              onChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Resources Area */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Generar Recursos IA
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              <button 
                onClick={() => handleGenerateResource('exercise_multiple')}
                disabled={isGeneratingResource}
                className={getButtonClass('exercise_multiple')}
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ListChecks className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Opción Múltiple</span>
                  {isRecommended('exercise_multiple') && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Recomendado</span>}
                </div>
              </button>
              <button 
                onClick={() => handleGenerateResource('exercise_match')}
                disabled={isGeneratingResource}
                className={getButtonClass('exercise_match')}
              >
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FileQuestion className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Relacionar Columnas</span>
                  {isRecommended('exercise_match') && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Recomendado</span>}
                </div>
              </button>
              <button 
                onClick={() => handleGenerateResource('exercise_fill')}
                disabled={isGeneratingResource}
                className={getButtonClass('exercise_fill')}
              >
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Type className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Completar Oraciones</span>
                  {isRecommended('exercise_fill') && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Recomendado</span>}
                </div>
              </button>
              <button 
                onClick={() => handleGenerateResource('exercise_order')}
                disabled={isGeneratingResource}
                className={getButtonClass('exercise_order')}
              >
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><ArrowDownUp className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Ordenar Elementos</span>
                  {isRecommended('exercise_order') && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Recomendado</span>}
                </div>
              </button>
              <button 
                onClick={() => handleGenerateResource('image')}
                disabled={isGeneratingResource}
                className={getButtonClass('image')}
              >
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><ImageIcon className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Imagen Ilustrativa</span>
                  {isRecommended('image') && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Recomendado</span>}
                </div>
              </button>
            </div>
          </div>

          {session.metadata && (
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Guía Pedagógica (IA)
              </h4>
              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <span className="font-bold text-slate-200">Dificultad:</span> {session.metadata.dificultadEstimada}
                </div>
                <div>
                  <span className="font-bold text-slate-200">Palabras Clave:</span> {session.metadata.palabrasClave?.join(', ')}
                </div>
                {session.metadata.recomendacionesDocente && (
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <span className="font-bold text-amber-400 block mb-1">Recomendación:</span>
                    {session.metadata.recomendacionesDocente}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 flex flex-col">
          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <h4 className="font-bold text-slate-800 mb-4">Carpeta de Recursos ({session.generatedResources?.length || 0})</h4>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {session.generatedResources?.map(resource => (
                <div key={resource.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-medium text-sm text-slate-700 flex items-center justify-between">
                    {resource.title}
                  </div>
                  <div className="p-3 bg-slate-50/50 text-sm">
                    {renderResource(resource)}
                  </div>
                </div>
              ))}
              {(!session.generatedResources || session.generatedResources.length === 0) && (
                <div className="text-center p-6 text-slate-400">
                  <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No hay recursos generados aún.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
