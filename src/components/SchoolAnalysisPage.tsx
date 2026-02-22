/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { motion } from 'motion/react';
import { School, TrendingUp, Users, Award, Target, Scale } from 'lucide-react';
import { StudentRecord } from '../types';
import { processData, calculateStats } from '../utils/analysis';

interface SchoolAnalysisPageProps {
  data: StudentRecord[];
}

export default function SchoolAnalysisPage({ data }: SchoolAnalysisPageProps) {
  const { subjectStats, studentSummaries } = useMemo(() => processData(data), [data]);

  const schoolStats = useMemo(() => {
    const allScores = studentSummaries.map(s => s.avg);
    return calculateStats(allScores);
  }, [studentSummaries]);

  const classPerformance = useMemo(() => {
    const sections = Array.from(new Set(data.map(d => d.class_section)));
    return sections.map(sec => {
      const secData = data.filter(d => d.class_section === sec);
      const scores = secData.map(d => (d.score / d.max_score) * 100);
      const { avg } = calculateStats(scores);
      return { name: `شعبة ${sec}`, avg };
    }).sort((a, b) => b.avg - a.avg);
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 space-y-2 border-r-4 border-r-accent-purple">
          <p className="text-slate-400 text-sm">المتوسط العام</p>
          <p className="text-3xl font-bold">{schoolStats.avg.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-6 space-y-2 border-r-4 border-r-accent-blue">
          <p className="text-slate-400 text-sm">الوسيط</p>
          <p className="text-3xl font-bold">{schoolStats.median.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-6 space-y-2 border-r-4 border-r-emerald-400">
          <p className="text-slate-400 text-sm">أعلى معدل</p>
          <p className="text-3xl font-bold">{schoolStats.max.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-6 space-y-2 border-r-4 border-r-red-400">
          <p className="text-slate-400 text-sm">الانحراف المعياري</p>
          <p className="text-3xl font-bold">{schoolStats.stdDev.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Comparison */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Scale className="text-accent-purple w-5 h-5" />
            مقارنة الأداء بين الشعب
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="avg" name="المتوسط" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Distribution Curve */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="text-accent-blue w-5 h-5" />
            منحنى توزيع الأداء
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studentSummaries.slice(0, 20).map((s, i) => ({ name: i, avg: s.avg }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis hide />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="avg" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-slate-500 italic">يمثل هذا المنحنى تدرج مستويات الطلاب من الأعلى إلى الأقل</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Target className="text-emerald-400 w-5 h-5" />
          تحليل الفجوات التعليمية
        </h3>
        <div className="space-y-6">
          {Object.values(subjectStats).map((s: any, i) => {
            const gap = s.avg - schoolStats.avg;
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{s.subject_name}</span>
                  <span className={gap >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {gap >= 0 ? '+' : ''}{gap.toFixed(1)}% عن المتوسط العام
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${s.avg}%` }}
                    className={`h-full rounded-full ${s.avg >= 75 ? 'bg-emerald-500' : s.avg >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
