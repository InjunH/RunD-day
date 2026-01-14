
import React from 'react';
import { MarathonEvent } from '../types';
import { Heart, MapPin, Calendar, Trophy, ExternalLink, Timer, ChevronRight } from 'lucide-react';

interface MarathonCardProps {
  event: MarathonEvent;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const MarathonCard: React.FC<MarathonCardProps> = ({ event, isFavorite, onToggleFavorite }) => {
  const eventDate = new Date(event.date);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isUpcoming = dDay > 0;
  const isImminent = dDay <= 14 && dDay > 0;

  const getDDayText = () => {
    if (dDay === 0) return 'D-DAY';
    if (dDay > 0) return `D-${String(dDay).padStart(2, '0')}`;
    return 'FINISH';
  };

  return (
    <div className={`group relative bg-slate-800 border-2 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20 ${event.isPopular ? 'border-blue-500' : 'border-slate-700'}`}>
      {/* Decorative Race Line */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${event.isPopular ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-600'}`}></div>
      
      {/* Popular Badge */}
      {event.isPopular && (
        <div className="absolute top-4 right-4 bg-blue-600 text-[10px] font-black italic uppercase px-2 py-0.5 rounded text-white tracking-tighter glow-neon z-10">
          HOT RACE
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className={`font-athletic font-black text-2xl italic ${isImminent ? 'text-lime-300' : 'text-slate-100'}`}>
              {getDDayText()}
            </div>
            <div className="h-0.5 w-8 bg-blue-500 mt-1"></div>
          </div>
          <button 
            onClick={() => onToggleFavorite(event.id)}
            className={`p-2.5 rounded-xl transition-all ${isFavorite ? 'text-pink-500 bg-pink-500/10' : 'text-slate-500 bg-slate-700 hover:text-slate-300'}`}
          >
            <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h3 className="text-xl font-extrabold text-white mb-4 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {event.name}
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-slate-400 text-sm gap-3">
            <Calendar size={16} className="text-blue-500" />
            <span className="font-semibold">{event.date} <span className="opacity-50 font-normal">({['일', '월', '화', '수', '목', '금', '토'][eventDate.getDay()]})</span></span>
          </div>
          <div className="flex items-center text-slate-400 text-sm gap-3">
            <MapPin size={16} className="text-blue-500" />
            <span className="line-clamp-1">{event.region} · {event.locationDetail}</span>
          </div>
          <div className="flex items-center text-slate-400 text-sm gap-3">
            <Trophy size={16} className="text-blue-500" />
            <div className="flex gap-1.5 flex-wrap">
              {event.distances.map(d => (
                <span key={d} className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-600">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 opacity-60">
          {event.tags.map(tag => (
            <span key={tag} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              #{tag}
            </span>
          ))}
        </div>

        <button 
          onClick={() => event.registrationUrl ? window.open(event.registrationUrl, '_blank') : alert('정보 준비 중입니다.')}
          className={`group/btn w-full py-3.5 rounded-xl font-black text-sm uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${event.registrationUrl ? 'bg-lime-400 text-slate-900 hover:bg-lime-300' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
        >
          {event.registrationUrl ? (
            <>
              Register Now
              <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </>
          ) : (
            'Preparing'
          )}
        </button>
      </div>
      
      {/* Race Bib Texture Effect */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900/50"></div>
    </div>
  );
};

export default MarathonCard;
