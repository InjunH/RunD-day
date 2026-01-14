import React from 'react';
import { Calendar, Download } from 'lucide-react';

const CalendarButton: React.FC = () => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/2026_마라톤_일정.ics';
    link.download = '2026_마라톤_일정.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="fixed bottom-8 right-8 bg-gradient-to-r from-lime-400 to-blue-500 hover:from-lime-500 hover:to-blue-600 text-slate-900 font-bold px-6 py-4 rounded-2xl shadow-2xl hover:shadow-lime-400/50 transition-all duration-300 flex items-center gap-3 z-50 group animate-bounce hover:animate-none"
      aria-label="구글 캘린더에 추가"
    >
      <Calendar size={24} className="group-hover:rotate-12 transition-transform" />
      <span className="text-sm font-black">캘린더 추가</span>
      <Download size={20} className="group-hover:translate-y-1 transition-transform" />
    </button>
  );
};

export default CalendarButton;
