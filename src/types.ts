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
  createdAt: any;
}
