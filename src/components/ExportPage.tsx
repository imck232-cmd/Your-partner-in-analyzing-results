/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileDown, FileSpreadsheet, FileText, MessageSquare, 
  Share2, Download, CheckCircle2, Phone, ExternalLink 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentRecord } from '../types';
import { processData } from '../utils/analysis';

interface ExportPageProps {
  data: StudentRecord[];
}

export default function ExportPage({ data }: ExportPageProps) {
  const { subjectStats, studentSummaries } = useMemo(() => processData(data), [data]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary & Dashboard KPIs
    const totalStudents = new Set(data.map(d => d.student_id)).size;
    const totalSubjects = new Set(data.map(d => d.subject_name)).size;
    const avgScore = studentSummaries.reduce((a, b) => a + b.avg, 0) / studentSummaries.length;
    const successRate = (studentSummaries.filter(s => s.avg >= 50).length / studentSummaries.length) * 100;
    const excellenceRate = (studentSummaries.filter(s => s.avg >= 90).length / studentSummaries.length) * 100;

    const summaryData = [
      ['تقرير تحليل النتائج الشامل'],
      ['إعداد: رفيقك في تحليل النتائج - إبراهيم دخان'],
      ['التاريخ', new Date().toLocaleDateString()],
      [''],
      ['لوحة التحكم - المؤشرات الرئيسية'],
      ['المؤشر', 'القيمة'],
      ['إجمالي الطلاب', totalStudents],
      ['إجمالي المواد', totalSubjects],
      ['المتوسط العام للمدرسة', avgScore.toFixed(2) + '%'],
      ['نسبة النجاح العامة', successRate.toFixed(2) + '%'],
      ['نسبة التفوق العامة', excellenceRate.toFixed(2) + '%'],
      ['عدد الطلاب المتعثرين', studentSummaries.filter(s => s.avg < 50).length],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "الملخص ولوحة التحكم");

    // Sheet 2: Student Analysis & Recommendations
    const studentData = studentSummaries.map(s => ({
      'الترتيب': s.rank,
      'رقم الطالب': s.student_id,
      'اسم الطالب': s.student_name,
      'المعدل': s.avg.toFixed(2) + '%',
      'التصنيف': s.category,
      'التوصية التربوية': s.recommendation,
      'المجموع': s.totalScore,
      'النهاية العظمى': s.maxPossible
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(wb, wsStudents, "تحليل الطلاب والتوصيات");

    // Sheet 3: Subject Analysis
    const subjectData = Object.values(subjectStats).map((s: any) => ({
      'المادة': s.subject_name,
      'المتوسط': s.avg.toFixed(2) + '%',
      'نسبة النجاح': s.passRate.toFixed(2) + '%',
      'نسبة التفوق': s.excellenceRate.toFixed(2) + '%',
      'عدد الطلاب المختبرين': s.count,
      'الوسيط': s.median.toFixed(2),
      'أعلى درجة': s.max,
      'أقل درجة': s.min,
      'الانحراف المعياري': s.stdDev.toFixed(2)
    }));
    const wsSubjects = XLSX.utils.json_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, wsSubjects, "تحليل المواد التفصيلي");

    // Sheet 4: Raw Data
    const wsRaw = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, wsRaw, "البيانات الخام");

    // Sheet 5: Charts Data (Distribution)
    const distData = [
      ['توزيع المستويات'],
      ['المستوى', 'العدد'],
      ['متميز (90-100)', studentSummaries.filter(s => s.avg >= 90).length],
      ['جيد جداً (75-89)', studentSummaries.filter(s => s.avg >= 75 && s.avg < 90).length],
      ['جيد (60-74)', studentSummaries.filter(s => s.avg >= 60 && s.avg < 75).length],
      ['مقبول (50-59)', studentSummaries.filter(s => s.avg >= 50 && s.avg < 60).length],
      ['ضعيف (أقل من 50)', studentSummaries.filter(s => s.avg < 50).length],
    ];
    const wsCharts = XLSX.utils.aoa_to_sheet(distData);
    XLSX.utils.book_append_sheet(wb, wsCharts, "بيانات الرسوم البيانية");

    XLSX.writeFile(wb, `تقرير_تحليل_النتائج_الشامل_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportToPDF = async () => {
    const element = document.getElementById('export-container');
    if (!element) return;
    
    try {
      // Temporarily hide export buttons/actions for the screenshot
      const actions = element.querySelectorAll('button, .export-actions');
      actions.forEach(a => (a as HTMLElement).style.visibility = 'hidden');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      // Restore actions
      actions.forEach(a => (a as HTMLElement).style.visibility = 'visible');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`تقرير_تحليل_النتائج_الشامل_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    }
  };

  const generateWhatsAppLink = (student: any) => {
    const message = encodeURIComponent(`
📊 *تقرير أداء الطالب: ${student.student_name}*
📈 المعدل العام: ${student.avg.toFixed(1)}%
🏆 الترتيب: ${student.rank}
🎯 التصنيف: ${student.category}

💡 *التوصية التربوية:*
${student.recommendation}

📊 *تحليل المواد:*
${Object.entries(student.subjectScores).map(([sub, score]) => `• ${sub}: ${(score as number).toFixed(1)}%`).join('\n')}

📞 للاستفسار: 967780804012
    `);
    return `https://wa.me/?text=${message}`;
  };

  const shareGeneralSummary = () => {
    const totalStudents = new Set(data.map(d => d.student_id)).size;
    const totalSubjects = new Set(data.map(d => d.subject_name)).size;
    const avgScore = (studentSummaries.reduce((a, b) => a + b.avg, 0) / studentSummaries.length).toFixed(1);
    
    const excellenceCount = studentSummaries.filter(s => s.avg >= 90).length;
    const goodCount = studentSummaries.filter(s => s.avg >= 75 && s.avg < 90).length;
    const averageCount = studentSummaries.filter(s => s.avg >= 60 && s.avg < 75).length;
    const atRiskCount = studentSummaries.filter(s => s.avg < 50).length;

    const topSubject = (Object.values(subjectStats) as any[]).sort((a: any, b: any) => b.avg - a.avg)[0];

    const message = encodeURIComponent(`
📊 *ملخص لوحة التحكم والأداء العام*
👥 عدد الطلاب: ${totalStudents}
📚 عدد المواد: ${totalSubjects}
📈 المتوسط العام: ${avgScore}%

📈 *تحليل المستويات:*
⭐ متميز (90+): ${excellenceCount}
✅ جيد جداً (75-89): ${goodCount}
🆗 جيد (60-74): ${averageCount}
⚠️ بحاجة دعم (أقل من 50): ${atRiskCount}

📚 *أفضل مادة أداءً:*
${topSubject ? `${topSubject.subject_name} (بمتوسط ${topSubject.avg.toFixed(1)}%)` : 'لا يوجد بيانات'}

📋 *أوائل الطلاب:*
${studentSummaries.slice(0, 5).map(s => `${s.rank}. ${s.student_name} (${s.avg.toFixed(1)}%)`).join('\n')}

💡 *التوصيات والتحليلات:*
${atRiskCount > totalStudents * 0.2 
  ? '• يُلاحظ وجود فجوة في الأداء لبعض الطلاب، يُنصح بخطة علاجية فورية.' 
  : '• الأداء العام ممتاز، يُنصح بالتركيز على مهارات التفكير العليا.'}
• المادة الأكثر احتياجاً للدعم هي تلك التي تقل نسبة نجاحها عن 70%.

تم التصدير من رفيقك في تحليل النتائج 🚀
    `);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const [tableTitle, setTableTitle] = useState('مشاركة سريعة للطلاب (أعلى 10)');

  if (data.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Excel Export */}
        <div className="glass-card p-8 flex flex-col items-center text-center space-y-6 group hover:bg-emerald-500/5 transition-colors">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">تصدير Excel شامل</h3>
            <p className="text-sm text-slate-400">ملف إكسل احترافي يحتوي على جميع التحليلات والإحصائيات في أوراق منفصلة</p>
          </div>
          <button 
            onClick={exportToExcel}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            تصدير الآن
          </button>
        </div>

        {/* PDF Export */}
        <div className="glass-card p-8 flex flex-col items-center text-center space-y-6 group hover:bg-red-500/5 transition-colors">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-10 h-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">تصدير تقرير PDF</h3>
            <p className="text-sm text-slate-400">تقرير مطبوع جاهز للتوزيع يحتوي على ملخص الأداء والرسوم البيانية</p>
          </div>
          <button 
            onClick={exportToPDF}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-5 h-5" />
            تصدير الآن
          </button>
        </div>

        {/* WhatsApp Export */}
        <div className="glass-card p-8 flex flex-col items-center text-center space-y-6 group hover:bg-accent-purple/5 transition-colors">
          <div className="w-20 h-20 bg-accent-purple/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-10 h-10 text-accent-purple" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">مشاركة عبر واتساب</h3>
            <p className="text-sm text-slate-400">إنشاء رسائل مخصصة للطلاب وأولياء الأمور تحتوي على ملخص النتائج</p>
          </div>
          <button 
            onClick={shareGeneralSummary}
            className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Share2 className="w-5 h-5" />
            مشاركة الملخص العام
          </button>
          <div className="w-full p-4 bg-white/5 rounded-xl text-xs text-slate-400 text-right">
            <p className="font-bold mb-2 text-white">مثال للرسالة:</p>
            <p>📊 تقرير أداء الطالب: أحمد...</p>
            <p>📈 المعدل العام: 85.0%</p>
            <p>🏆 الترتيب: 5</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Quick Share List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <input 
            type="text"
            value={tableTitle}
            onChange={(e) => setTableTitle(e.target.value)}
            className="bg-transparent border-none focus:ring-1 focus:ring-accent-purple outline-none font-bold w-full"
          />
          <Share2 className="text-accent-purple w-5 h-5 flex-shrink-0" />
        </div>
        <div className="divide-y divide-white/5">
          {studentSummaries.slice(0, 10).map((s, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-accent-purple">
                  {s.rank}
                </div>
                <div>
                  <p className="font-bold">{s.student_name}</p>
                  <p className="text-xs text-slate-400">{s.avg.toFixed(1)}% - {s.category}</p>
                </div>
              </div>
              <a 
                href={generateWhatsAppLink(s)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Phone className="w-4 h-4" />
                مشاركة
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
