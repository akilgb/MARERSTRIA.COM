import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, LearningSession, School, Course, Schedule } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateLearningSession(
  user: UserProfile,
  school: School,
  course: Course,
  schedule: Schedule,
  history: LearningSession[],
  date: string,
  holidays: string[]
): Promise<Partial<LearningSession>> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Eres un experto pedagogo peruano especializado en el Currículo Nacional de Educación Básica (CNEB).
    Tu tarea es generar una Sesión de Aprendizaje de alta calidad para el docente:
    - Docente: ${user.displayName}
    - Colegio: ${school.name}
    - Curso/Materia: ${course.name}
    - Nivel: ${course.level}
    - Grado/Sección: ${schedule.grade} ${schedule.section || ''}
    - Horario: ${schedule.startTime} - ${schedule.endTime}

    Fecha de la sesión: ${date}
    Feriados detectados en esta fecha: ${holidays.join(", ") || "Ninguno"}

    Contexto adicional:
    - Historial de sesiones previas en este curso: ${JSON.stringify(history.slice(-3).map(s => ({ title: s.title, date: s.date })))}

    Si la fecha es un feriado, la sesión debe indicar claramente que es un día no laborable por el feriado mencionado y proponer una actividad de reflexión o conmemoración breve que el docente pueda compartir por medios virtuales.

    Si no es feriado, genera una sesión completa siguiendo estrictamente la estructura del CNEB:
    1. Título de la sesión: Debe ser retador, atractivo y sintetizar el aprendizaje esperado.
    2. Propósitos de aprendizaje:
       - Competencias: Selecciona las competencias del CNEB más adecuadas para el curso.
       - Capacidades: Desglosa las capacidades que se movilizarán.
       - Criterios de evaluación: Deben ser observables y medibles.
       - Evidencia de aprendizaje: ¿Qué producto o desempeño demostrará el estudiante?
    3. Secuencia didáctica (Markdown):
       - Inicio (15-20% del tiempo): Motivación, recuperación de saberes previos y planteamiento del conflicto cognitivo. Propósito y organización.
       - Desarrollo (60-70% del tiempo): Gestión y acompañamiento del desarrollo de las competencias. Actividades de aprendizaje andamiadas.
       - Cierre (10-15% del tiempo): Metacognición y evaluación formativa.
    4. Recursos y materiales: Lista de materiales necesarios.
    5. Evaluación: Instrumento de evaluación sugerido (Lista de cotejo, rúbrica, etc.).

    Responde exclusivamente en formato JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          competencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          capacities: { type: Type.ARRAY, items: { type: Type.STRING } },
          performanceCriteria: { type: Type.ARRAY, items: { type: Type.STRING } },
          activities: { type: Type.STRING, description: "Markdown content for the didactic sequence" },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          evaluation: { type: Type.STRING }
        },
        required: ["title", "competencies", "capacities", "performanceCriteria", "activities", "resources", "evaluation"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getPeruvianHolidays(year: number): Promise<{ date: string, name: string }[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `Lista los feriados oficiales en Perú para el año ${year}. Devuelve un JSON con un array de objetos { date: "YYYY-MM-DD", name: "Nombre del feriado" }.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            name: { type: Type.STRING }
          },
          required: ["date", "name"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}
