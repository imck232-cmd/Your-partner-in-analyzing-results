/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Award, AlertTriangle, TrendingUp, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StudentRecord } from '../types';
import { processData } from '../utils/analysis';

interface SubjectAnalysisPageProps {
  data: StudentRecord[];
}

export default function SubjectAnalysisPage({ data }: SubjectAnalysisPageProps) {
  const { subjectStats, studentSummaries } = useMemo(() => processData(data), [data]);
  const subjects = useMemo(() => Object.keys(subjectStats), [subjectStats]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');

  const currentStats = subjectStats[selectedSubject];
  
  const subjectStudents = useMemo(() => {
    return data
      .filter(d => d.subject_name === selectedSubject)
      .map(d => ({
        ...d,
        category: (d.score / d.max_score) * 100 >= 90 ? 'متميز' : (d.score / d.max_score) * 100 < 50 ? 'معرض للخطر' : 'عادي'
      }))
      .sort((a, b) => b.score - a.score);
  }, [data, selectedSubject]);

  const excellentStudents = subjectStudents.filter(s => s.category === 'متميز');
  const atRiskStudents = subjectStudents.filter(s => s.category === 'معرض للخطر');

  const [tableTitle, setTableTitle] = useState(`قائمة الطلاب في مادة ${selectedSubject}`);

  // Update table title when subject changes
  useMemo(() => {
    setTableTitle(`قائمة الطلاب في مادة ${selectedSubject}`);
  }, [selectedSubject]);

  if (subjects.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <Filter className="text-slate-400 w-5 h-5" />
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="glass-button py-2 pr-10 pl-4 appearance-none focus:outline-none focus:ring-2 focus:ring-accent-purple"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub} className="bg-brand-medium">{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Overview */}
          <div className="glass-card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">المتوسط</p>
              <p className="text-2xl font-bold text-accent-purple">{currentStats.avg.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">نسبة النجاح</p>
              <p className="text-2xl font-bold text-emerald-400">{currentStats.passRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">نسبة التفوق</p>
              <p className="text-2xl font-bold text-amber-400">{currentStats.excellenceRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">عدد الطلاب</p>
              <p className="text-2xl font-bold text-blue-400">{currentStats.count}</p>
            </div>
          </div>

          {/* Student List */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <input 
                type="text"
                value={tableTitle}
                onChange={(e) => setTableTitle(e.target.value)}
                className="bg-transparent border-none focus:ring-1 focus:ring-accent-purple outline-none font-bold w-full"
              />
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-right">
                <thead className="bg-white/5 text-slate-400 text-xs sticky top-0">
                  <tr>
                    <th className="p-4">اسم الطالب</th>
                    <th className="p-4">الشعبة</th>
                    <th className="p-4">الدرجة</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subjectStudents.map((s, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium">{s.student_name}</td>
                      <td className="p-4">{s.class_section}</td>
                      <td className="p-4 font-mono">{s.score} / {s.max_score}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          s.category === 'متميز' ? 'bg-emerald-500/20 text-emerald-400' :
                          s.category === 'معرض للخطر' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {s.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Excellence List */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-emerald-400">
              <Award className="w-5 h-5" />
              المتميزون ({excellentStudents.length})
            </h3>
            <div className="space-y-3">
              {excellentStudents.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <span className="text-sm font-medium">{s.student_name}</span>
                  <span className="text-xs font-bold text-emerald-400">{((s.score/s.max_score)*100).toFixed(0)}%</span>
                </div>
              ))}
              {excellentStudents.length > 5 && <p className="text-center text-xs text-slate-500">+{excellentStudents.length - 5} آخرون</p>}
            </div>
          </div>

          {/* At Risk List */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              المعرضون للخطر ({atRiskStudents.length})
            </h3>
            <div className="space-y-3">
              {atRiskStudents.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                  <span className="text-sm font-medium">{s.student_name}</span>
                  <span className="text-xs font-bold text-red-400">{((s.score/s.max_score)*100).toFixed(0)}%</span>
                </div>
              ))}
              {atRiskStudents.length > 5 && <p className="text-center text-xs text-slate-500">+{atRiskStudents.length - 5} آخرون</p>}
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-accent-purple">
              <TrendingUp className="w-5 h-5" />
              توصيات تدريسية
            </h3>
            <div className="space-y-3 text-sm text-slate-400">
              {currentStats.avg < 65 && (
                <p className="flex gap-2">
                  <span className="text-red-400">⚠️</span>
                  المتوسط منخفض، يرجى مراجعة طرق التدريس لهذه المادة.
                </p>
              )}
              {currentStats.excellenceRate > 30 && (
                <p className="flex gap-2">
                  <span className="text-emerald-400">✅</span>
                  أداء متميز، يوصى بتقديم مشاريع إثرائية متقدمة.
                </p>
              )}
              <p className="flex gap-2">
                <span className="text-blue-400">💡</span>
                التركيز على الطلاب في قائمة "المعرضون للخطر" بخطة علاجية عاجلة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
