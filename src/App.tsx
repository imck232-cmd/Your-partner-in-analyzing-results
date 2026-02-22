/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileUp, 
  ShieldCheck, 
  School, 
  BookOpen, 
  UserCircle, 
  FileDown, 
  MessageSquare,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
  Award,
  AlertTriangle,
  Users,
  TrendingUp,
  Phone
} from 'lucide-react';
import { PageType, StudentRecord } from './types';
import WelcomePage from './components/WelcomePage';
import ImportPage from './components/ImportPage';
import DashboardPage from './components/DashboardPage';
import QualityPage from './components/QualityPage';
import SchoolAnalysisPage from './components/SchoolAnalysisPage';
import SubjectAnalysisPage from './components/SubjectAnalysisPage';
import StudentAnalysisPage from './components/StudentAnalysisPage';
import ExportPage from './components/ExportPage';
import PageHeader from './components/PageHeader';

export default function App() {
  const [activePage, setActivePage] = useState<PageType>('welcome');
  const [data, setData] = useState<StudentRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false); // On desktop we might want a different behavior, but user wants it hidden
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePageChange = (page: PageType) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  const getPageInfo = () => {
    switch (activePage) {
      case 'welcome': return { title: 'الرئيسية', desc: 'مرحباً بك في رفيقك في تحليل النتائج' };
      case 'import': return { title: 'استيراد البيانات', desc: 'ارفع ملف النتائج للبدء في التحليل' };
      case 'dashboard': return { title: 'لوحة التحكم', desc: 'نظرة عامة على أداء الطلاب والمؤشرات الرئيسية' };
      case 'quality': return { title: 'جودة البيانات', desc: 'تحليل دقة واكتمال البيانات المستوردة' };
      case 'school_analysis': return { title: 'تحليل المدرسة', desc: 'مقارنات الأداء على مستوى الصفوف والشعب' };
      case 'subject_analysis': return { title: 'تحليل المواد', desc: 'تحليل تفصيلي لأداء كل مادة دراسية' };
      case 'student_analysis': return { title: 'تحليل الطلاب', desc: 'تقارير فردية وتوصيات مخصصة لكل طالب' };
      case 'export': return { title: 'التقارير والتصدير', desc: 'استخراج التقارير النهائية ومشاركة النتائج' };
      default: return { title: '', desc: '' };
    }
  };

  const pageInfo = getPageInfo();

  const menuItems = [
    { id: 'welcome', label: 'الرئيسية', icon: Sparkles },
    { id: 'import', label: 'استيراد البيانات', icon: FileUp },
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'quality', label: 'جودة البيانات', icon: ShieldCheck },
    { id: 'school_analysis', label: 'تحليل المدرسة', icon: School },
    { id: 'subject_analysis', label: 'تحليل المواد', icon: BookOpen },
    { id: 'student_analysis', label: 'تحليل الطلاب', icon: UserCircle },
    { id: 'export', label: 'التقارير والتصدير', icon: FileDown },
  ];

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 glass-card m-4 mb-0 flex items-center justify-between p-4 border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-purple rounded-lg flex items-center justify-center shadow-lg shadow-accent-purple/20">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-white">رفيقك</span>
        </div>
        
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 text-white border border-white/10"
        >
          <Menu className="w-6 h-6" />
          <span className="font-bold hidden sm:inline">القائمة</span>
        </button>
      </header>

      {/* Sidebar Overlay Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-brand-dark/95 border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-accent-purple w-6 h-6" />
                  <span className="font-bold text-xl text-white">القائمة الرئيسية</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id as PageType)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                      activePage === item.id 
                      ? 'bg-accent-purple text-white shadow-xl shadow-accent-purple/30' 
                      : 'hover:bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 flex-shrink-0 ${activePage === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className="font-bold text-lg whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-6 border-t border-white/5">
                <a 
                  href="https://wa.me/967780804012" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 glass-button w-full justify-center group bg-emerald-500/10 border-emerald-500/20"
                >
                  <Phone className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
                  <span className="font-bold text-emerald-400">تواصل مع المطور</span>
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div id="export-container">
            <PageHeader 
              title={pageInfo.title} 
              description={pageInfo.desc} 
              data={data} 
              pageId={activePage} 
            />
            
            <div id="main-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {activePage === 'welcome' && <WelcomePage onStart={() => setActivePage('import')} />}
                  {activePage === 'import' && <ImportPage onDataLoaded={(d) => { setData(d); setActivePage('dashboard'); }} />}
                  {activePage === 'dashboard' && <DashboardPage data={data} />}
                  {activePage === 'quality' && <QualityPage data={data} />}
                  {activePage === 'school_analysis' && <SchoolAnalysisPage data={data} />}
                  {activePage === 'subject_analysis' && <SubjectAnalysisPage data={data} />}
                  {activePage === 'student_analysis' && <StudentAnalysisPage data={data} />}
                  {activePage === 'export' && <ExportPage data={data} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
