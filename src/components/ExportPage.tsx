/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileDown, FileSpreadsheet, FileText, MessageSquare, 
  Share2, Download, CheckCircle2, Phone, ExternalLink,
  Image as ImageIcon
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
    
    const loadingToast = document.createElement('div');
    loadingToast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 12px; z-index: 9999; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; items-center; gap: 10px; direction: rtl;">
        <span>جاري تجهيز التقرير المرئي...</span>
      </div>
    `;
    document.body.appendChild(loadingToast);

    try {
      // Temporarily hide export buttons/actions for the screenshot
      const actions = element.querySelectorAll('button, .export-buttons');
      actions.forEach(a => (a as HTMLElement).style.visibility = 'hidden');

      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('export-container');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.padding = '20px';
            
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              const style = window.getComputedStyle(htmlEl);
              const isOkl = (color: string) => color && (color.includes('okl') || color.includes('lab'));
              if (isOkl(style.color)) htmlEl.style.color = '#ffffff';
              if (isOkl(style.backgroundColor)) htmlEl.style.backgroundColor = '#0f172a';
              if (isOkl(style.borderColor)) htmlEl.style.borderColor = 'rgba(255,255,255,0.1)';
              if (isOkl(style.fill)) htmlEl.style.fill = '#8b5cf6';
              if (isOkl(style.stroke)) htmlEl.style.stroke = '#8b5cf6';
              if (style.backdropFilter && style.backdropFilter !== 'none') {
                htmlEl.style.backdropFilter = 'none';
                htmlEl.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
              }
            });
          }
        }
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
      alert('حدث خطأ أثناء تصدير التقرير.');
    } finally {
      document.body.removeChild(loadingToast);
    }
  };

  const exportToImage = async () => {
    const element = document.getElementById('export-container');
    if (!element) return;
    
    const loadingToast = document.createElement('div');
    loadingToast.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 12px; z-index: 9999; font-weight: bold; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; items-center; gap: 10px; direction: rtl;">
        <span>جاري تجهيز الصورة...</span>
      </div>
    `;
    document.body.appendChild(loadingToast);

    try {
      const actions = element.querySelectorAll('button, .export-buttons');
      actions.forEach(a => (a as HTMLElement).style.visibility = 'hidden');

      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('export-container');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.padding = '20px';
            
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              const style = window.getComputedStyle(htmlEl);
              const isOkl = (color: string) => color && (color.includes('okl') || color.includes('lab'));
              if (isOkl(style.color)) htmlEl.style.color = '#ffffff';
              if (isOkl(style.backgroundColor)) htmlEl.style.backgroundColor = '#0f172a';
              if (isOkl(style.borderColor)) htmlEl.style.borderColor = 'rgba(255,255,255,0.1)';
              if (isOkl(style.fill)) htmlEl.style.fill = '#8b5cf6';
              if (isOkl(style.stroke)) htmlEl.style.stroke = '#8b5cf6';
              if (style.backdropFilter && style.backdropFilter !== 'none') {
                htmlEl.style.backdropFilter = 'none';
                htmlEl.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
              }
            });
          }
        }
      });
      
      actions.forEach(a => (a as HTMLElement).style.visibility = 'visible');

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `تقرير_رفيقك_${new Date().toLocaleDateString()}.png`;
      link.click();
    } catch (error) {
      console.error('Image Export Error:', error);
      alert('حدث خطأ أثناء تصدير الصورة.');
    } finally {
      document.body.removeChild(loadingToast);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Excel Export */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4 group hover:bg-emerald-500/5 transition-colors">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">تصدير Excel</h3>
            <p className="text-xs text-slate-400">ملف إكسل شامل بجميع التحليلات</p>
          </div>
          <button 
            onClick={exportToExcel}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            تصدير الآن
          </button>
        </div>

        {/* PDF Export */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4 group hover:bg-red-500/5 transition-colors">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">تقرير PDF</h3>
            <p className="text-xs text-slate-400">تقرير مرئي مطبوع وشامل</p>
          </div>
          <button 
            onClick={exportToPDF}
            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            تصدير PDF
          </button>
        </div>

        {/* Image Export */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4 group hover:bg-blue-500/5 transition-colors">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <ImageIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">تصدير صورة</h3>
            <p className="text-xs text-slate-400">حفظ التقرير كصورة PNG</p>
          </div>
          <button 
            onClick={exportToImage}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            تصدير صورة
          </button>
        </div>

        {/* WhatsApp Export */}
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4 group hover:bg-accent-purple/5 transition-colors">
          <div className="w-16 h-16 bg-accent-purple/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-8 h-8 text-accent-purple" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">مشاركة واتساب</h3>
            <p className="text-xs text-slate-400">مشاركة الملخص العام للنتائج</p>
          </div>
          <button 
            onClick={shareGeneralSummary}
            className="w-full py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Share2 className="w-4 h-4" />
            مشاركة الآن
          </button>
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
