/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentRecord, SubjectStats, StudentSummary } from '../types';

export const calculateStats = (scores: number[]): { avg: number; median: number; min: number; max: number; stdDev: number } => {
  if (scores.length === 0) return { avg: 0, median: 0, min: 0, max: 0, stdDev: 0 };
  
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  
  const squareDiffs = scores.map(s => Math.pow(s - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  return { avg, median, min, max, stdDev };
};

export const getCategory = (percentage: number): { category: string; recommendation: string; color: string } => {
  if (percentage >= 90) return { category: "متميز", recommendation: "برامج إثراء + مشاريع بحثية", color: "#006400" };
  if (percentage >= 75) return { category: "جيد جداً", recommendation: "تثبيت + مراجعة متقدمة", color: "#32CD32" };
  if (percentage >= 60) return { category: "جيد", recommendation: "تحسينات محددة + تمارين إضافية", color: "#1E90FF" };
  if (percentage >= 50) return { category: "بحاجة دعم", recommendation: "خطة علاجية + حصص تقوية", color: "#FFD700" };
  return { category: "معرض للخطر", recommendation: "تدخل عاجل + متابعة مكثفة", color: "#DC143C" };
};

export const processData = (data: StudentRecord[]) => {
  const subjects = Array.from(new Set(data.map(d => d.subject_name)));
  const students = Array.from(new Set(data.map(d => d.student_id)));
  
  const subjectStats: Record<string, SubjectStats> = {};
  subjects.forEach(sub => {
    const subData = data.filter(d => d.subject_name === sub);
    const scores = subData.map(d => d.score);
    const { avg, median, min, max, stdDev } = calculateStats(scores);
    const passCount = subData.filter(d => (d.score / d.max_score) >= 0.5).length;
    const excellenceCount = subData.filter(d => (d.score / d.max_score) >= 0.9).length;
    
    subjectStats[sub] = {
      subject_name: sub,
      avg, median, min, max, stdDev,
      passRate: (passCount / subData.length) * 100,
      excellenceRate: (excellenceCount / subData.length) * 100,
      count: subData.length
    };
  });

  const studentSummaries: StudentSummary[] = students.map(sid => {
    const sData = data.filter(d => d.student_id === sid);
    const name = sData[0].student_name;
    const totalScore = sData.reduce((a, b) => a + b.score, 0);
    const maxPossible = sData.reduce((a, b) => a + b.max_score, 0);
    const avg = (totalScore / maxPossible) * 100;
    const { category, recommendation } = getCategory(avg);
    
    const subjectScores: Record<string, number> = {};
    sData.forEach(d => {
      subjectScores[d.subject_name] = (d.score / d.max_score) * 100;
    });

    return {
      student_id: sid,
      student_name: name,
      avg,
      totalScore,
      maxPossible,
      rank: 0,
      percentile: 0,
      category,
      recommendation,
      subjectScores
    };
  });

  // Calculate ranks
  studentSummaries.sort((a, b) => b.avg - a.avg);
  studentSummaries.forEach((s, i) => {
    s.rank = i + 1;
    s.percentile = ((studentSummaries.length - i) / studentSummaries.length) * 100;
  });

  return { subjectStats, studentSummaries };
};
