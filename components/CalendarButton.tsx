import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ChevronDown, Heart, List } from 'lucide-react';
import { MarathonEvent } from '../types';
import { generateICS, downloadICS, generateFilename } from '../utils/icsGenerator';

interface CalendarButtonProps {
  allEvents: MarathonEvent[];
  favoriteEvents: MarathonEvent[];
}

const CalendarButton: React.FC<CalendarButtonProps> = ({ allEvents, favoriteEvents }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadAll = () => {
    const icsContent = generateICS(allEvents);
    const filename = generateFilename('all', allEvents.length);
    downloadICS(icsContent, filename);
    setIsOpen(false);
  };

  const handleDownloadFavorites = () => {
    if (favoriteEvents.length === 0) {
      alert('즐겨찾기한 마라톤이 없습니다.');
      setIsOpen(false);
      return;
    }
    const icsContent = generateICS(favoriteEvents);
    const filename = generateFilename('favorites', favoriteEvents.length);
    downloadICS(icsContent, filename);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="fixed bottom-8 right-8 z-50">
      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200 min-w-[280px]">
          <button
            onClick={handleDownloadAll}
            className="w-full px-6 py-4 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 group border-b border-slate-800"
          >
            <List size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="flex-1">
              <div className="text-white font-bold text-sm">전체 일정</div>
              <div className="text-slate-500 text-xs">{allEvents.length}개 대회</div>
            </div>
            <Download size={16} className="text-slate-600 group-hover:text-lime-400 transition-colors" />
          </button>

          <button
            onClick={handleDownloadFavorites}
            className="w-full px-6 py-4 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 group"
          >
            <Heart size={20} className="text-pink-500 group-hover:scale-110 transition-transform" fill="currentColor" />
            <div className="flex-1">
              <div className="text-white font-bold text-sm">즐겨찾기만</div>
              <div className="text-slate-500 text-xs">{favoriteEvents.length}개 대회</div>
            </div>
            <Download size={16} className="text-slate-600 group-hover:text-lime-400 transition-colors" />
          </button>
        </div>
      )}

      {/* 메인 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-lime-400 to-blue-500 hover:from-lime-500 hover:to-blue-600 text-slate-900 font-bold px-6 py-4 rounded-2xl shadow-2xl hover:shadow-lime-400/50 transition-all duration-300 flex items-center gap-3 group animate-bounce hover:animate-none"
        aria-label="캘린더 다운로드 옵션"
        aria-expanded={isOpen}
      >
        <Calendar size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="text-sm font-black">캘린더 추가</span>
        <ChevronDown
          size={20}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
};

export default CalendarButton;
