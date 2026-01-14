
import React from 'react';
import { REGIONS, DISTANCES, MONTHS } from '../constants';
import { FilterState } from '../types';
import { Search, RotateCcw, ChevronDown, Filter } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, onReset }) => {
  const toggleMonth = (m: number) => {
    setFilters(prev => ({
      ...prev,
      months: prev.months.includes(m) ? prev.months.filter(x => x !== m) : [...prev.months, m]
    }));
  };

  const toggleRegion = (r: string) => {
    setFilters(prev => ({
      ...prev,
      regions: prev.regions.includes(r) ? prev.regions.filter(x => x !== r) : [...prev.regions, r]
    }));
  };

  const toggleDistance = (d: string) => {
    setFilters(prev => ({
      ...prev,
      distances: prev.distances.includes(d) ? prev.distances.filter(x => x !== d) : [...prev.distances, d]
    }));
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 pt-6 pb-4 shadow-2xl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Input */}
        <div className="relative group max-w-3xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-lime-400 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="어떤 레이스를 꿈꾸시나요? (대회명, 지역 검색)"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-14 pr-6 py-4 bg-slate-800 border-2 border-transparent focus:border-lime-400 rounded-2xl text-slate-100 placeholder-slate-500 transition-all outline-none text-lg font-semibold"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 mr-2 border-r border-slate-800 pr-4">
            <Filter size={16} />
            <span className="text-xs font-black uppercase tracking-widest italic">Filters</span>
          </div>

          <div className="flex gap-2 shrink-0">
             <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors border border-slate-700">
                  MONTH
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
                <div className="absolute top-full left-0 mt-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 grid grid-cols-4 gap-2 w-56 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                   {MONTHS.map(m => (
                     <button 
                       key={m} 
                       onClick={() => toggleMonth(m)}
                       className={`py-2 text-[11px] rounded-lg font-bold transition-all ${filters.months.includes(m) ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                     >
                       {m}월
                     </button>
                   ))}
                </div>
             </div>

             <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors border border-slate-700">
                  REGION
                  <ChevronDown size={14} className="text-slate-500" />
                </button>
                <div className="absolute top-full left-0 mt-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 grid grid-cols-3 gap-2 w-72 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                   {REGIONS.map(r => (
                     <button 
                       key={r} 
                       onClick={() => toggleRegion(r)}
                       className={`py-2 text-[11px] rounded-lg font-bold transition-all ${filters.regions.includes(r) ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                     >
                       {r}
                     </button>
                   ))}
                </div>
             </div>

             <button 
               onClick={onReset}
               className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 transition-colors"
             >
               <RotateCcw size={14} />
               RESET
             </button>
          </div>

          <div className="flex gap-2 items-center">
            {filters.months.length > 0 && filters.months.map(m => (
              <span key={m} className="bg-blue-900/40 text-blue-400 border border-blue-800/50 px-3 py-1 rounded-lg text-[10px] font-black italic">{m}M</span>
            ))}
            {filters.regions.length > 0 && filters.regions.map(r => (
              <span key={r} className="bg-lime-900/40 text-lime-400 border border-lime-800/50 px-3 py-1 rounded-lg text-[10px] font-black italic">{r}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
