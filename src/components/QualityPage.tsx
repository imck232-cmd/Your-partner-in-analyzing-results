/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertCircle, CheckCircle2, Info, Search, Filter } from 'lucide-react';
import { StudentRecord } from '../types';

interface QualityPageProps {
  data: StudentRecord[];
}

export default function QualityPage({ data }: QualityPageProps) {
  const qualityStats = useMemo(() => {
    const total = data.length;
    if (total === 0) return null;

    const missingScores = data.filter(d => d.score === undefined || d.score === null).length;
    const outOfRange = data.filter(d => d.score < 0 || d.score > d.max_score).length;
    const duplicates = data.length - new Set(data.map(d => `${d.student_id}-${d.subject_code}-${d.term}`)).size;
    
    const issues = [];
    if (missingScores > 0) issues.push({ type: 'error', msg: `يوجد ${missingScores} سجلات تفتقد للدرجات` });
    if (outOfRange > 0) issues.push({ type: 'error', msg: `يوجد ${outOfRange} درجات خارج النطاق المسموح (0-100)` });
    if (duplicates > 0) issues.push({ type: 'warning', msg: `تم اكتشاف ${duplicates} سجلات مكررة محتملة` });

    const score = Math.max(0, 100 - (missingScores/total*50) - (outOfRange/total*50) - (duplicates/total*20));

    return { total, missingScores, outOfRange, duplicates, issues, score };
  }, [data]);

  if (!qualityStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl">يرجى استيراد البيانات أولاً لفحص الجودة</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 space-y-2">
          <p className="text-slate-400 text-sm">إجمالي السجلات</p>
          <p className="text-3xl font-bold">{qualityStats.total}</p>
        </div>
        <div className="glass-card p-6 space-y-2">
          <p className="text-slate-400 text-sm">القيم المفقودة</p>
          <p className={`text-3xl font-bold ${qualityStats.missingScores > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {qualityStats.missingScores}
          </p>
        </div>
        <div className="glass-card p-6 space-y-2">
          <p className="text-slate-400 text-sm">التكرارات المكتشفة</p>
          <p className={`text-3xl font-bold ${qualityStats.duplicates > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {qualityStats.duplicates}
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2">
          <AlertCircle className="text-accent-purple w-5 h-5" />
          <span className="font-bold">تنبيهات وملاحظات الجودة</span>
        </div>
        <div className="p-6 space-y-4">
          {qualityStats.issues.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-emerald-400 space-y-2">
              <CheckCircle2 className="w-12 h-12" />
              <p className="font-bold">البيانات تبدو ممتازة وجاهزة للتحليل</p>
            </div>
          ) : (
            qualityStats.issues.map((issue, i) => (
              <div key={i} className={`p-4 rounded-xl flex items-center gap-4 ${
                issue.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="font-medium">{issue.msg}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Info className="text-blue-400 w-5 h-5" />
          نصائح لتحسين جودة البيانات
        </h3>
        <ul className="space-y-3 text-slate-400">
          <li className="flex gap-3">
            <span className="text-accent-purple font-bold">•</span>
            تأكد من توحيد أسماء المواد (مثلاً: "الرياضيات" بدلاً من "رياضيات").
          </li>
          <li className="flex gap-3">
            <span className="text-accent-purple font-bold">•</span>
            تحقق من أن جميع الطلاب لديهم أرقام هوية فريدة.
          </li>
          <li className="flex gap-3">
            <span className="text-accent-purple font-bold">•</span>
            تأكد من أن الدرجة العظمى موحدة لكل مادة في نفس الفصل.
          </li>
        </ul>
      </div>
    </div>
  );
}
