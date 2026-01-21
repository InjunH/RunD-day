
import React, { useEffect, useState } from 'react';
import { MarathonEvent } from '../types';
import {
  X,
  Heart,
  Calendar,
  MapPin,
  Trophy,
  ExternalLink,
  Users,
  AlertCircle,
  DollarSign,
  Clock,
} from 'lucide-react';

interface MarathonDetailModalProps {
  event: MarathonEvent;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCalendar: (event: MarathonEvent) => void;
}

const MarathonDetailModal: React.FC<MarathonDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onAddToCalendar,
}) => {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // D-Day 계산
  const calculateDDay = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDDayText = (): string => {
    const dDay = calculateDDay(event.date);
    if (dDay === 0) return 'D-DAY';
    if (dDay > 0) return `D-${String(dDay).padStart(2, '0')}`;
    return 'FINISH';
  };

  // 요일 계산
  const getDayOfWeek = (): string => {
    const date = new Date(event.date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  // 확장 정보 존재 여부
  const hasExtendedInfo = (): boolean => {
    return !!(
      event.organizer ||
      event.registrationStatus ||
      event.price ||
      event.registrationEnd
    );
  };

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = document.querySelector('.modal-container');
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstFocusable?.focus();

    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="modal-container relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          aria-label="모달 닫기"
        >
          <X size={24} className="text-slate-300" />
        </button>

        {/* Image Section */}
        <div className="relative w-full h-64 bg-slate-800 rounded-t-3xl overflow-hidden">
          {event.imageUrl && !imageLoadFailed ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
              <MapPin size={48} className="text-slate-600 mb-2" />
              <span className="text-2xl font-black text-slate-500 italic uppercase">
                {event.region}
              </span>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20"></div>
            </div>
          )}

          {/* Popular Badge */}
          {event.isPopular && (
            <div className="absolute top-4 left-4 bg-blue-600 text-xs font-black italic uppercase px-3 py-1 rounded-lg text-white tracking-tighter">
              HOT RACE
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="modal-title"
                className="text-3xl font-black text-white leading-tight"
              >
                {event.name}
              </h2>
              <div className="flex-shrink-0 bg-lime-400 text-slate-900 px-4 py-2 rounded-xl font-black italic text-lg">
                {getDDayText()}
              </div>
            </div>

            <div id="modal-description" className="space-y-3 text-slate-300">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-blue-400" />
                <span className="font-semibold">
                  {event.date} ({getDayOfWeek()})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-blue-400" />
                <span>
                  {event.region} · {event.locationDetail}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Trophy size={18} className="text-blue-400" />
                <div className="flex gap-2 flex-wrap">
                  {event.distances.map((d) => (
                    <span
                      key={d}
                      className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg text-sm font-bold border border-slate-700"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Extended Info */}
          {hasExtendedInfo() && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-3">
              <h3 className="text-lg font-black text-white italic uppercase tracking-wider mb-3">
                📋 대회 정보
              </h3>

              {event.organizer && (
                <div className="flex items-start gap-3 text-slate-300">
                  <Users size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-slate-500">주최</span>
                    <p className="font-semibold">{event.organizer}</p>
                  </div>
                </div>
              )}

              {event.registrationStatus && (
                <div className="flex items-start gap-3 text-slate-300">
                  <AlertCircle
                    size={16}
                    className="text-amber-400 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <span className="text-sm text-slate-500">등록 상태</span>
                    <p className="font-bold text-amber-400">
                      {event.registrationStatus}
                    </p>
                  </div>
                </div>
              )}

              {event.price && (
                <div className="flex items-start gap-3 text-slate-300">
                  <DollarSign
                    size={16}
                    className="text-green-400 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <span className="text-sm text-slate-500">참가비</span>
                    <p className="font-bold">
                      {event.price.amount.toLocaleString()}원
                      {event.price.description && (
                        <span className="ml-2 text-sm text-slate-400">
                          ({event.price.description})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {event.registrationEnd && (
                <div className="flex items-start gap-3 text-slate-300">
                  <Clock size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-slate-500">접수 마감</span>
                    <p className="font-semibold">{event.registrationEnd}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={() => onToggleFavorite(event.id)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase italic tracking-wider transition-all ${
                isFavorite
                  ? 'bg-pink-500/20 text-pink-400 border-2 border-pink-500/50 hover:bg-pink-500/30'
                  : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
            </button>

            <button
              onClick={() => onAddToCalendar(event)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-sm uppercase italic tracking-wider text-white transition-all border-2 border-transparent"
            >
              <Calendar size={18} />
              캘린더 추가
            </button>

            <button
              onClick={() => {
                if (event.registrationUrl) {
                  window.open(event.registrationUrl, '_blank', 'noopener,noreferrer');
                } else {
                  alert('등록 페이지 정보가 없습니다.');
                }
              }}
              disabled={!event.registrationUrl}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase italic tracking-wider transition-all border-2 ${
                event.registrationUrl
                  ? 'bg-lime-400 hover:bg-lime-300 text-slate-900 border-transparent'
                  : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
              }`}
            >
              <ExternalLink size={18} />
              등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarathonDetailModal;
