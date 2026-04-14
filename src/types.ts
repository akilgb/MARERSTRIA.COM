export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  school?: string;
  level?: 'Inicial' | 'Primaria' | 'Secundaria';
  specialty?: string;
  grade?: string;
  section?: string;
  createdAt: any;
}

export interface School {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: any;
}

export interface Course {
  id: string;
  userId: string;
  schoolId: string;
  name: string;
  color?: string; // Legacy support
  colors: string[];
  level: 'Inicial' | 'Primaria' | 'Secundaria';
}

export interface Schedule {
  id: string;
  userId: string;
  schoolId: string;
  courseId: string;
  grade: string;
  section: string;
  dayOfWeek: number; // 1-7 (1=Lun, 7=Dom)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
}

export interface StructuredSessionData {
  titulo: string;
  proposito: string;
  competencia: string;
  capacidades: string;
  desempenos: string;
  criterios: string;
  evidencia: string;
  instrumento: string;
  inicio: string;
  inicioTiempo: string;
  desarrollo: string;
  desarrolloTiempo: string;
  cierre: string;
  cierreTiempo: string;
  recursos?: string;
  evaluacion?: string;
}

export interface SessionResource {
  id: string;
  type: 'image' | 'exercise_multiple' | 'exercise_match' | 'exercise_fill' | 'exercise_order';
  title: string;
  content: string; // JSON string or base64 image
}

export interface SessionMetadata {
  dificultadEstimada: string;
  palabrasClave: string[];
  competencias: string[];
  capacidades: string[];
  herramientasEvaluacionSugeridas: {
    nombre: string;
    descripcion: string;
    tipo: string;
    recursoId?: 'exercise_multiple' | 'exercise_match' | 'exercise_fill' | 'exercise_order' | 'image' | 'none';
  }[];
  materialesSugeridos: {
    item: string;
    proposito: string;
    esDigital: boolean;
    recursoId?: 'exercise_multiple' | 'exercise_match' | 'exercise_fill' | 'exercise_order' | 'image' | 'none';
  }[];
  recomendacionesDocente: string;
}

export interface LearningSession {
  id: string;
  userId: string;
  schoolId: string;
  courseId: string;
  scheduleId?: string;
  date: string; // YYYY-MM-DD
  title: string;
  competencies: string[];
  capacities: string[];
  performanceCriteria: string[];
  activities: string; // Markdown
  resources: string[];
  evaluation: string;
  isGenerated: boolean;
  structuredData?: StructuredSessionData;
  htmlContent?: string;
  generatedResources?: SessionResource[];
  metadata?: SessionMetadata;
  createdAt: any;
}
