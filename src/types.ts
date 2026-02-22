/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StudentRecord {
  student_id: string;
  student_name: string;
  grade_level: number;
  class_section: string;
  term: string;
  exam_type: string;
  exam_date: string;
  subject_code: string;
  subject_name: string;
  score: number;
  max_score: number;
  percentage: number;
  weight: number;
  teacher_code?: string;
  teacher_name?: string;
  gender?: string;
  notes?: string;
}

export interface SubjectStats {
  subject_name: string;
  avg: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  passRate: number;
  excellenceRate: number;
  count: number;
}

export interface StudentSummary {
  student_id: string;
  student_name: string;
  avg: number;
  totalScore: number;
  maxPossible: number;
  rank: number;
  percentile: number;
  category: string;
  recommendation: string;
  subjectScores: Record<string, number>;
}

export type PageType = 
  | 'welcome' 
  | 'import' 
  | 'dashboard' 
  | 'quality' 
  | 'school_analysis' 
  | 'subject_analysis' 
  | 'student_analysis' 
  | 'export';
