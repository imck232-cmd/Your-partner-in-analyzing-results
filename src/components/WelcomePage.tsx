/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Sparkles, ArrowLeft, Phone, ShieldCheck, TrendingUp, Award } from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <div className="absolute inset-0 bg-accent-purple/20 blur-[60px] rounded-full animate-pulse" />
        <div className="relative w-48 h-48 bg-gradient-to-br from-accent-purple to-accent-blue rounded-3xl flex items-center justify-center shadow-2xl shadow-accent-purple/30">
          <TrendingUp className="text-white w-24 h-24" />
        </div>
      </motion.div>

      <div className="space-y-4">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500"
        >
          رفيقك في تحليل النتائج
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-slate-400 font-medium"
        >
          إعداد المستشار الإداري والتربوي إبراهيم دخان
        </motion.p>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 w-full max-w-4xl px-4"
      >
        {[
          { icon: ShieldCheck, title: "دقة عالية", desc: "تحليل إحصائي متقدم وموثوق" },
          { icon: TrendingUp, title: "رؤى ذكية", desc: "توصيات بناءً على اتجاهات الأداء" },
          { icon: Award, title: "تقارير احترافية", desc: "تصدير Excel و PDF بجودة عالية" }
        ].map((feature, i) => (
          <div key={i} className={`glass-card p-3 md:p-6 space-y-2 md:space-y-3 hover:bg-white/10 transition-colors group ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
            <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-accent-purple group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-sm md:text-lg">{feature.title}</h3>
            <p className="text-[10px] md:text-sm text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onStart}
        className="group relative px-12 py-5 bg-accent-purple rounded-2xl font-bold text-xl shadow-xl shadow-accent-purple/30 hover:shadow-accent-purple/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <span>ابدأ التحليل الآن</span>
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
      </motion.button>
    </div>
  );
}
