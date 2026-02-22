/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Users, BookOpen, TrendingUp, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StudentRecord } from '../types';
import { processData } from '../utils/analysis';

interface DashboardPageProps {
  data: StudentRecord[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage({ data }: DashboardPageProps) {
  const { subjectStats, studentSummaries } = useMemo(() => processData(data), [data]);

  const kpis = useMemo(() => {
    const totalStudents = new Set(data.map(d => d.student_id)).size;
    const totalSubjects = new Set(data.map(d => d.subject_name)).size;
    const avgScore = studentSummaries.reduce((a, b) => a + b.avg, 0) / studentSummaries.length;
    const successRate = (studentSummaries.filter(s => s.avg >= 50).length / studentSummaries.length) * 100;
    const excellenceRate = (studentSummaries.filter(s => s.avg >= 90).length / studentSummaries.length) * 100;
    const atRiskCount = studentSummaries.filter(s => s.avg < 50).length;

    return [
      { label: 'إجمالي الطلاب', value: totalStudents, icon: Users, color: 'text-blue-400' },
      { label: 'إجمالي المواد', value: totalSubjects, icon: BookOpen, color: 'text-purple-400' },
      { label: 'متوسط الدرجات', value: `${avgScore.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-400' },
      { label: 'نسبة النجاح', value: `${successRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-blue-500' },
      { label: 'نسبة التفوق', value: `${excellenceRate.toFixed(1)}%`, icon: Award, color: 'text-amber-400' },
      { label: 'طلاب في خطر', value: atRiskCount, icon: AlertTriangle, color: 'text-red-400' },
    ];
  }, [data, studentSummaries]);

  const distributionData = useMemo(() => {
    const categories = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'معرض للخطر'];
    return categories.map(cat => ({
      name: cat,
      value: studentSummaries.filter(s => s.category === cat).length
    }));
  }, [studentSummaries]);

  const subjectComparisonData = useMemo(() => {
    return Object.values(subjectStats).map((s: any) => ({
      name: s.subject_name,
      avg: s.avg,
      pass: s.passRate
    }));
  }, [subjectStats]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl">يرجى استيراد البيانات أولاً لعرض لوحة التحكم</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-card p-2 md:p-4 flex flex-col items-center text-center space-y-1 md:space-y-2">
            <kpi.icon className={`w-6 h-6 md:w-8 md:h-8 ${kpi.color}`} />
            <span className="text-lg md:text-2xl font-bold">{kpi.value}</span>
            <span className="text-[10px] md:text-xs text-slate-400 font-medium">{kpi.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="text-accent-purple w-5 h-5" />
            توزيع المستويات العامة
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {distributionData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Performance Chart */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="text-accent-blue w-5 h-5" />
            مقارنة أداء المواد
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="avg" name="المتوسط" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subject Radar Chart */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="text-emerald-400 w-5 h-5" />
          تحليل التوازن الأكاديمي
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectComparisonData}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
              <Radar
                name="متوسط المادة"
                dataKey="avg"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
