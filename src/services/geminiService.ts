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
  
  // 1. Generar la metadata/blueprint primero
  const metadata = await generateSessionBlueprint(user, school, course, schedule, date);
  
  // 2. Usar la metadata como guía para generar la sesión completa
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

    IMPORTANTE: Debes usar la siguiente guía (blueprint) generada previamente para estructurar tu sesión:
    ${JSON.stringify(metadata, null, 2)}

    Si la fecha es un feriado, la sesión debe indicar claramente que es un día no laborable por el feriado mencionado y proponer una actividad de reflexión o conmemoración breve que el docente pueda compartir por medios virtuales.

    Si no es feriado, genera una sesión completa siguiendo estrictamente la estructura del CNEB y alineada al blueprint proporcionado:
    1. Título de la sesión: Debe ser retador, atractivo y sintetizar el aprendizaje esperado.
    2. Propósitos de aprendizaje:
       - Competencias: Usa las del blueprint.
       - Capacidades: Usa las del blueprint.
       - Criterios de evaluación: Deben ser observables y medibles.
       - Evidencia de aprendizaje: ¿Qué producto o desempeño demostrará el estudiante?
    3. Secuencia didáctica (Markdown):
       - Inicio (15-20% del tiempo): Motivación, recuperación de saberes previos y planteamiento del conflicto cognitivo. Propósito y organización.
       - Desarrollo (60-70% del tiempo): Gestión y acompañamiento del desarrollo de las competencias. Actividades de aprendizaje andamiadas.
       - Cierre (10-15% del tiempo): Metacognición y evaluación formativa.
    4. Recursos y materiales: Lista de materiales necesarios (incluye los del blueprint).
    5. Evaluación: Instrumento de evaluación sugerido (incluye los del blueprint).
    
    Además, debes generar un objeto 'structuredData' que contenga la información exacta para llenar una plantilla de Word en formato de tabla.
    Asegúrate de llenar TODOS los campos de 'structuredData' (proposito, criterios, evidencia, etc.) extrayendo la información de tu propia respuesta. Si no tienes un propósito explícito, infiérelo.
    Asegúrate de que los tiempos (inicioTiempo, desarrolloTiempo, cierreTiempo) sumen el total de la sesión y que el contenido de inicio, desarrollo y cierre esté separado correctamente en sus respectivos campos, sin incluir los títulos de las secciones en el contenido.
    
    Responde exclusivamente en formato JSON.
  `;

  try {
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
            evaluation: { type: Type.STRING },
            structuredData: {
              type: Type.OBJECT,
              properties: {
                titulo: { type: Type.STRING },
                proposito: { type: Type.STRING },
                competencia: { type: Type.STRING },
                capacidades: { type: Type.STRING },
                desempenos: { type: Type.STRING },
                criterios: { type: Type.STRING },
                evidencia: { type: Type.STRING },
                instrumento: { type: Type.STRING },
                inicio: { type: Type.STRING },
                inicioTiempo: { type: Type.STRING },
                desarrollo: { type: Type.STRING },
                desarrolloTiempo: { type: Type.STRING },
                cierre: { type: Type.STRING },
                cierreTiempo: { type: Type.STRING },
                recursos: { type: Type.STRING },
                evaluacion: { type: Type.STRING }
              },
              required: ["titulo", "proposito", "competencia", "capacidades", "desempenos", "criterios", "evidencia", "instrumento", "inicio", "inicioTiempo", "desarrollo", "desarrolloTiempo", "cierre", "cierreTiempo", "recursos", "evaluacion"]
            }
          },
          required: ["title", "competencies", "capacities", "performanceCriteria", "activities", "resources", "evaluation", "structuredData"]
        }
      }
    });

    if (!response.text) {
      throw new Error("La respuesta de Gemini está vacía.");
    }

    const parsedData = JSON.parse(response.text);
    return {
      ...parsedData,
      metadata // Adjuntamos la metadata generada en el paso 1
    };
  } catch (error) {
    console.error("Error generating learning session:", error);
    throw new Error("No se pudo generar la sesión de aprendizaje. Por favor, intenta de nuevo más tarde.");
  }
}

export async function getPeruvianHolidays(year: number): Promise<{ date: string, name: string }[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `Lista los feriados oficiales en Perú para el año ${year}. Devuelve un JSON con un array de objetos { date: "YYYY-MM-DD", name: "Nombre del feriado" }.`;

  try {
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

    if (!response.text) {
      throw new Error("La respuesta de Gemini está vacía.");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    throw new Error("No se pudieron obtener los feriados. Por favor, verifica tu conexión o intenta más tarde.");
  }
}

export async function generateSessionBlueprint(
  user: UserProfile,
  school: School,
  course: Course,
  schedule: Schedule,
  date: string
): Promise<any> {
  const model = "gemini-3.1-pro-preview";
  
  // TODO: En el futuro, este contexto se obtendrá de una fuente que aún no ha sido creada.
  // Nota interna: Esta metadata se trabajará en coordinación con el currículo nacional vigente.
  const prompt = `
    Eres un experto pedagogo peruano especializado en el Currículo Nacional de Educación Básica (CNEB).
    Tu tarea es generar el esqueleto (blueprint/metadata) de una Sesión de Aprendizaje para:
    - Curso/Materia: ${course.name}
    - Nivel: ${course.level}
    - Grado/Sección: ${schedule.grade} ${schedule.section || ''}
    - Fecha: ${date}

    Debes seleccionar las competencias y capacidades del CNEB más adecuadas.
    Además, debes sugerir herramientas de evaluación y materiales.
    IMPORTANTE: Para las herramientas y materiales, si sugieres algo que se puede generar con IA, indica el 'recursoId' correspondiente.
    Opciones válidas para 'recursoId': 'exercise_multiple', 'exercise_match', 'exercise_fill', 'exercise_order', 'image', o 'none'.

    Genera un JSON con la siguiente estructura:
    {
      "dificultadEstimada": "Alta|Media|Baja",
      "palabrasClave": ["...", "..."],
      "competencias": ["..."],
      "capacidades": ["..."],
      "herramientasEvaluacionSugeridas": [
        { "nombre": "...", "descripcion": "...", "tipo": "Formativa|Sumativa", "recursoId": "..." }
      ],
      "materialesSugeridos": [
        { "item": "...", "proposito": "...", "esDigital": true|false, "recursoId": "..." }
      ],
      "recomendacionesDocente": "..."
    }
    
    Responde exclusivamente con el JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("La respuesta de Gemini está vacía.");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating session blueprint:", error);
    throw error;
  }
}

export async function generateSessionResource(
  type: 'exercise_multiple' | 'exercise_match' | 'exercise_fill' | 'exercise_order',
  topic: string,
  grade: string
): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  let prompt = "";
  let schema: any = {};

  if (type === 'exercise_multiple') {
    prompt = `Genera un ejercicio de opción múltiple (5 preguntas) sobre el tema "${topic}" para estudiantes de ${grade}.`;
    schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer"]
      }
    };
  } else if (type === 'exercise_match') {
    prompt = `Genera un ejercicio de relacionar columnas (5 pares) sobre el tema "${topic}" para estudiantes de ${grade}.`;
    schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          left: { type: Type.STRING },
          right: { type: Type.STRING }
        },
        required: ["left", "right"]
      }
    };
  } else if (type === 'exercise_fill') {
    prompt = `Genera un ejercicio de completar oraciones (5 oraciones) sobre el tema "${topic}" para estudiantes de ${grade}. Usa '___' para el espacio en blanco.`;
    schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["sentence", "answer"]
      }
    };
  } else if (type === 'exercise_order') {
    prompt = `Genera un ejercicio de ordenar oraciones o pasos (5 elementos desordenados que deben ordenarse lógicamente) sobre el tema "${topic}" para estudiantes de ${grade}.`;
    schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scrambled: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctOrder: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanation: { type: Type.STRING }
        },
        required: ["scrambled", "correctOrder"]
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return response.text || "[]";
  } catch (error) {
    console.error("Error generating resource:", error);
    throw new Error("No se pudo generar el recurso.");
  }
}

export async function chatWithCopilot(
  message: string,
  sessionContext?: { title: string; course: string; content: string },
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  globalContext?: { userName: string; courses: any[]; sessions: any[] }
): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  let systemInstruction = `
    Eres el "Inspector IA", el copiloto y asistente pedagógico personal del docente ${globalContext?.userName || ''}.
    Eres una IA "agéntica" y TIENES ACCESO COMPLETO a la base de datos del docente (cursos, sesiones, recursos).
    NUNCA digas que no tienes acceso a sus archivos o sesiones, porque la información se te proporciona en este prompt.
    
    INFORMACIÓN TÉCNICA IMPORTANTE SOBRE TI:
    Estás operando bajo la arquitectura de "Gemini 3 Flash". Si el usuario te pregunta qué versión eres, DEBES responder que eres Gemini 3 Flash. No digas que eres la versión 1.5.

    BASE DE DATOS DEL DOCENTE (Contexto Global):
    - Cursos activos: ${JSON.stringify(globalContext?.courses || [])}
    - Resumen de todas sus sesiones: ${JSON.stringify(globalContext?.sessions || [])}

    Tu objetivo es ayudar al docente a gestionar su información, planificar, recordar qué sesiones ha creado, sugerir mejoras, corregir ortografía, o alinear con el Currículo Nacional de Educación Básica (CNEB) de Perú.
    Si el docente te pregunta "¿cuántas sesiones tengo?" o "¿de qué trata mi última sesión?", usa la información de la BASE DE DATOS DEL DOCENTE para responderle con precisión.
    Sé conciso, amigable y muy práctico.
  `;

  if (sessionContext) {
    systemInstruction += `
    
    CONTEXTO ACTIVO (Lo que el docente está viendo/editando en este momento exacto):
    - Título: ${sessionContext.title}
    - Curso: ${sessionContext.course}
    - Contenido actual (HTML/Texto):
    ${sessionContext.content.substring(0, 3000)} // Limitamos a 3000 caracteres para no saturar el prompt
    `;
  } else {
    systemInstruction += `
    
    CONTEXTO ACTIVO: El docente está en el Dashboard o no tiene ninguna sesión abierta en el editor en este momento.
    `;
  }

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      }
    });

    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: 'Entendido. Tengo acceso a tu base de datos y estoy listo para ayudar.' }] },
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
    });

    return response.text || "Lo siento, no pude procesar tu solicitud.";
  } catch (error) {
    console.error("Error in copilot chat:", error);
    throw new Error("Error de conexión con el Inspector IA.");
  }
}

export async function generateSessionImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Una ilustración educativa, estilo flat design, clara y amigable para estudiantes, sobre: ${prompt}` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("No se pudo generar la imagen.");
  }
}
