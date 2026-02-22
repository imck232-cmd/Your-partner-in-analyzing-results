import React from 'react';
import { FileSpreadsheet, FileText, Share2, Download, Image as ImageIcon } from 'lucide-react';
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
      // Temporarily hide export buttons for the screenshot
      const buttons = element.querySelectorAll('.export-buttons');
      buttons.forEach(b => (b as HTMLElement).style.visibility = 'hidden');

      // Small delay to ensure all charts and animations are settled
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
            
            // Force standard color space for all elements in the clone to avoid oklab/oklch issues
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach(el => {
              const htmlEl = el as HTMLElement;
              const style = window.getComputedStyle(htmlEl);
              
              // Helper to check if a color string contains okl
              const isOkl = (color: string) => color && (color.includes('okl') || color.includes('lab'));
              
              if (isOkl(style.color)) htmlEl.style.color = '#ffffff';
              if (isOkl(style.backgroundColor)) htmlEl.style.backgroundColor = '#0f172a';
              if (isOkl(style.borderColor)) htmlEl.style.borderColor = 'rgba(255,255,255,0.1)';
              if (isOkl(style.fill)) htmlEl.style.fill = '#8b5cf6';
              if (isOkl(style.stroke)) htmlEl.style.stroke = '#8b5cf6';
              
              // Remove backdrop-filter as it can cause issues and often uses oklch internally
              if (style.backdropFilter && style.backdropFilter !== 'none') {
                htmlEl.style.backdropFilter = 'none';
                htmlEl.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'; // Fallback for glass effect
              }
            });
          }
        }
      });
      
      // Restore buttons
      buttons.forEach(b => (b as HTMLElement).style.visibility = 'visible');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title}_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('حدث خطأ أثناء تصدير التقرير. يرجى المحاولة مرة أخرى.');
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
      const buttons = element.querySelectorAll('.export-buttons');
      buttons.forEach(b => (b as HTMLElement).style.visibility = 'hidden');

      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      
      buttons.forEach(b => (b as HTMLElement).style.visibility = 'visible');

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${title}_${new Date().toLocaleDateString()}.png`;
      link.click();
    } catch (error) {
      console.error('Image Export Error:', error);
      alert('حدث خطأ أثناء تصدير الصورة.');
    } finally {
      document.body.removeChild(loadingToast);
    }
  };

  const shareToWhatsApp = () => {
    let summary = '';
    if (data && Array.isArray(data)) {
      const studentCount = new Set(data.map(d => d.student_id)).size;
      summary = `\nعدد الطلاب: ${studentCount}\nعدد المواد: ${new Set(data.map(d => d.subject_name)).size}`;
    }
    const text = `📊 تقرير: ${title}\n📝 ${description}${summary}\n\nتم التصدير من رفيقك في تحليل النتائج 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        <p className="text-slate-400 text-sm md:text-base">{description}</p>
      </div>
      
      <div className="flex items-center gap-2 export-buttons">
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
          title="تصدير تقرير مرئي PDF"
        >
          <FileText className="w-5 h-5" />
          <span className="hidden sm:inline">تقرير مرئي (PDF)</span>
        </button>

        <button 
          onClick={exportToImage}
          className="glass-button flex items-center gap-2 text-blue-400 border-blue-400/30 px-4 py-2"
          title="تصدير صورة"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="hidden sm:inline">صورة (PNG)</span>
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
