import React from 'react';
import { FileSpreadsheet, FileText, Share2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PageHeaderProps {
  title: string;
  description: string;
  data?: any;
  pageId: string;
}

export default function PageHeader({ title, description, data, pageId }: PageHeaderProps) {
  const exportToExcel = () => {
    if (!data) return;
    const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${title}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportToPDF = async () => {
    const element = document.getElementById('main-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a' // Match background color
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    }
  };

  const shareToWhatsApp = () => {
    const text = `تقرير: ${title}\n${description}\nتم التصدير من رفيقك في تحليل النتائج`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="text-slate-400">{description}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={exportToExcel}
          className="glass-button flex items-center gap-2 text-emerald-400 border-emerald-400/30 px-4 py-2"
          title="تصدير Excel"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="hidden sm:inline">Excel</span>
        </button>
        
        <button 
          onClick={exportToPDF}
          className="glass-button flex items-center gap-2 text-red-400 border-red-400/30 px-4 py-2"
          title="تصدير PDF"
        >
          <FileText className="w-5 h-5" />
          <span className="hidden sm:inline">PDF</span>
        </button>
        
        <button 
          onClick={shareToWhatsApp}
          className="glass-button flex items-center gap-2 text-emerald-500 border-emerald-500/30 px-4 py-2"
          title="مشاركة WhatsApp"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
