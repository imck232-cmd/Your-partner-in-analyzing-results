/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  UserCircle, Award, AlertTriangle, TrendingUp, Search 
} from 'lucide-react';
import { StudentRecord } from '../types';
import { processData } from '../utils/analysis';

interface StudentAnalysisPageProps {
  data: StudentRecord[];
}

export default function StudentAnalysisPage({ data }: StudentAnalysisPageProps) {
  const { studentSummaries } = useMemo(() => processData(data), [data]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(studentSummaries[0]?.student_id || '');

  const filteredStudents = useMemo(() => {
    return studentSummaries.filter(s => 
      s.student_name.includes(searchTerm) || s.student_id.includes(searchTerm)
    );
  }, [studentSummaries, searchTerm]);

  const selectedStudent = useMemo(() => {
    return studentSummaries.find(s => s.student_id === selectedStudentId);
  }, [studentSummaries, selectedStudentId]);

  const radarData = useMemo(() => {
    if (!selectedStudent) return [];
    return Object.entries(selectedStudent.subjectScores).map(([subject, score]) => ({
      subject,
      score
    }));
  }, [selectedStudent]);

  if (studentSummaries.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text"
            placeholder="ابحث عن طالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-button py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-accent-purple"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student List Sidebar */}
        <div className="glass-card flex flex-col h-[600px]">
          <div className="p-4 border-b border-white/5 bg-white/5 font-bold text-sm">قائمة الطلاب</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredStudents.map(s => (
              <button
                key={s.student_id}
                onClick={() => setSelectedStudentId(s.student_id)}
                className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between group ${
                  selectedStudentId === s.student_id ? 'bg-accent-purple text-white' : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm">{s.student_name}</span>
                  <span className="text-[10px] opacity-60">{s.student_id}</span>
                </div>
                <span className={`text-xs font-bold ${selectedStudentId === s.student_id ? 'text-white' : 'text-accent-purple'}`}>
                  {s.avg.toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Student Details */}
        <div className="lg:col-span-3 space-y-6">
          {selectedStudent ? (
            <motion.div 
              key={selectedStudentId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Profile Header */}
              <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-accent-purple to-accent-blue rounded-full flex items-center justify-center text-4xl font-black shadow-xl shadow-accent-purple/20">
                  {selectedStudent.student_name[0]}
                </div>
                <div className="flex-1 text-center md:text-right space-y-1">
                  <h3 className="text-2xl font-bold">{selectedStudent.student_name}</h3>
                  <p className="text-slate-400">رقم الطالب: {selectedStudent.student_id}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold">الترتيب: {selectedStudent.rank}</span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold">النسبة المئوية: {selectedStudent.percentile.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-slate-400 mb-1">المعدل العام</p>
                  <p className="text-5xl font-black text-accent-purple">{selectedStudent.avg.toFixed(1)}%</p>
                  <p className={`text-sm font-bold mt-2 ${
                    selectedStudent.avg >= 90 ? 'text-emerald-400' :
                    selectedStudent.avg >= 50 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {selectedStudent.category}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="glass-card p-6 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <TrendingUp className="text-accent-purple w-5 h-5" />
                    تحليل نقاط القوة والضعف
                  </h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
                        <Radar
                          name="أداء الطالب"
                          dataKey="score"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.3}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject Breakdown */}
                <div className="glass-card p-6 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Award className="text-accent-blue w-5 h-5" />
                    تفاصيل درجات المواد
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(selectedStudent.subjectScores).map(([sub, score], i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{sub}</span>
                          <span className="font-bold">{(score as number).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            className={`h-full rounded-full ${(score as number) >= 90 ? 'bg-emerald-500' : (score as number) >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className={`p-6 rounded-2xl border ${
                selectedStudent.avg >= 90 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                selectedStudent.avg >= 50 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <h4 className="font-bold flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  التوصيات الشخصية
                </h4>
                <p className="text-lg font-medium">{selectedStudent.recommendation}</p>
                <div className="mt-4 text-sm opacity-80">
                  <p>• يوصى بمتابعة الطالب في المواد التي يقل فيها الأداء عن 60%.</p>
                  <p>• تشجيع الطالب على الاستمرار في التميز في نقاط القوة الموضحة في الرسم البياني.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
              <UserCircle className="w-16 h-16 mb-4 opacity-20" />
              <p>اختر طالباً من القائمة لعرض التحليل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
