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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <div className="min-h-screen bg-brand-dark flex overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-blue/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-20 glass-card m-4 border-white/5 flex flex-col transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-accent-purple rounded-lg flex items-center justify-center shadow-lg shadow-accent-purple/20">
                <TrendingUp className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-lg tracking-tight">رفيقك</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as PageType)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group ${
                activePage === item.id 
                ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activePage === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <a 
            href="https://wa.me/967780804012" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 glass-button w-full justify-center group"
          >
            <Phone className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-medium">تواصل مع المطور</span>}
          </a>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
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
      </main>
    </div>
  );
}
