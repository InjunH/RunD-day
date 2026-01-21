
import React, { useState, useEffect, useMemo } from 'react';
import { MARATHON_DATA } from './constants';
import { FilterState, MarathonEvent } from './types';
import { useMarathons } from './hooks/useMarathons';
import MarathonCard from './components/MarathonCard';
import FilterBar from './components/FilterBar';
import CalendarButton from './components/CalendarButton';
import MarathonDetailModal from './components/MarathonDetailModal';
import { generateICS, downloadICS, generateFilename } from './utils/icsGenerator';
import { Heart, Zap, ArrowRight, Gauge, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  // 마라톤 데이터 로딩 (JSON 파일 우선, 실패 시 정적 데이터 fallback)
  const { events: dynamicEvents, isLoading, error, refetch, lastUpdated } = useMarathons();

  // 데이터 소스: 동적 데이터 우선, 실패 시 정적 데이터 사용
  const marathonData = dynamicEvents.length > 0 ? dynamicEvents : MARATHON_DATA;

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('marathon-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [filters, setFilters] = useState<FilterState>({
    months: [],
    regions: [],
    distances: [],
    countries: [],
    searchQuery: '',
  });

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MarathonEvent | null>(null);

  useEffect(() => {
    localStorage.setItem('marathon-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setFilters({
      months: [],
      regions: [],
      distances: [],
      countries: [],
      searchQuery: '',
    });
  };

  // 모달 핸들러
  const handleCardClick = (event: MarathonEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleAddToCalendar = (event: MarathonEvent) => {
    const icsContent = generateICS([event]);
    const filename = generateFilename('single', 1, event.name);
    downloadICS(icsContent, filename);
  };

  const filteredMarathons = useMemo(() => {
    return marathonData.filter(m => {
      // 1. 날짜 필터: 과거 이벤트 제외
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(m.date);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < today) return false;

      // 2. 월 필터
      const month = new Date(m.date).getMonth() + 1;
      const matchMonth = filters.months.length === 0 || filters.months.includes(month);

      // 3. 지역 필터
      const matchRegion = filters.regions.length === 0 || filters.regions.includes(m.region);

      // 4. 국가 필터 (국내/해외)
      const matchCountry = filters.countries.length === 0 || filters.countries.some(fc => {
        if (fc === '국내') return m.region !== '해외';
        if (fc === '해외') return m.region === '해외';
        return true;
      });

      // 5. 거리 필터
      const matchDistance = filters.distances.length === 0 || filters.distances.some(fd => {
        if (fd === '울트라') return m.distances.some(d => d.includes('km') && parseInt(d) >= 50);
        if (fd === '기타') return m.distances.some(d => !['풀', '하프', '10km', '5km'].includes(d) && !d.includes('km'));
        return m.distances.includes(fd);
      });

      // 6. 검색 필터
      const matchSearch = filters.searchQuery === '' ||
        m.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        m.region.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        m.locationDetail.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(filters.searchQuery.toLowerCase()));

      return matchMonth && matchRegion && matchCountry && matchDistance && matchSearch;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filters, marathonData]);

  const favoriteMarathons = useMemo(() => {
    return marathonData
      .filter(m => favorites.includes(m.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [favorites, marathonData]);

  return (
    <div className="min-h-screen pb-20 bg-slate-950">
      {/* Animated Top Bar */}
      <div className="h-1 w-full bg-slate-900 relative overflow-hidden">
        <div className="running-indicator"></div>
      </div>

      {/* Hero Header */}
      <header className="px-6 py-16 md:py-28 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]">
        {/* Track Lines Decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-[20%] left-[-10%] w-[120%] h-[1px] bg-white rotate-[-5deg]"></div>
          <div className="absolute top-[25%] left-[-10%] w-[120%] h-[1px] bg-white rotate-[-5deg]"></div>
          <div className="absolute top-[30%] left-[-10%] w-[120%] h-[1px] bg-white rotate-[-5deg]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-3 mb-6 bg-slate-900/50 backdrop-blur px-4 py-2 rounded-2xl border border-slate-800">
            <Zap className="text-lime-400" size={18} fill="currentColor" />
            <span className="text-slate-200 font-black italic uppercase tracking-[0.2em] text-[10px]">Ready to Run 2026</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] italic tracking-tighter">
            RUN THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-blue-500 to-purple-500">NEXT MILE.</span>
          </h1>
          
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <p className="text-slate-400 text-lg md:text-xl max-w-lg font-bold leading-tight">
              대한민국 모든 마라톤 일정을 단 한 곳에서. <br />
              <span className="text-white underline decoration-blue-500 underline-offset-4">RunD-day</span>와 함께 페이스를 조절하세요.
            </p>
            
            <div className="flex gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center min-w-[100px]">
                <div className="text-2xl font-black text-white italic">{marathonData.length}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Events</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center min-w-[100px]">
                <div className="text-2xl font-black text-lime-400 italic">2026</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Season</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Data Source Indicator */}
      {isLoading ? (
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">데이터 로딩 중...</span>
        </div>
      ) : error && dynamicEvents.length === 0 ? (
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-2 text-amber-400">
          <AlertCircle size={16} />
          <span className="text-sm">정적 데이터 사용 중 (자동 업데이트 실패)</span>
        </div>
      ) : lastUpdated && dynamicEvents.length > 0 ? (
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-xs">최근 업데이트: {lastUpdated.toLocaleDateString('ko-KR')}</span>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw size={12} />
            새로고침
          </button>
        </div>
      ) : null}

      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        onReset={handleResetFilters} 
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Favorite Section */}
        {favoriteMarathons.length > 0 && (
          <section className="mb-20">
            <div className="flex items-end justify-between mb-8 border-l-4 border-pink-500 pl-4">
              <div>
                <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">My Starting Line</h2>
                <p className="text-slate-500 text-sm font-bold">당신이 찜한 {favoriteMarathons.length}개의 레이스</p>
              </div>
              <Heart className="text-pink-500 animate-pulse" size={32} fill="currentColor" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {favoriteMarathons.map(event => (
                <MarathonCard
                  key={event.id}
                  event={event}
                  isFavorite={favorites.includes(event.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => handleCardClick(event)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Marathons */}
        <section>
          <div className="flex items-center justify-between mb-10 border-l-4 border-blue-500 pl-4">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tight uppercase">Official Race Schedule</h2>
              <p className="text-slate-500 text-sm font-bold">목표를 향한 여정을 선택하세요</p>
            </div>
            {filteredMarathons.length > 0 && (
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-blue-400 text-xs font-black italic">{filteredMarathons.length} MATCHED</span>
              </div>
            )}
          </div>

          {filteredMarathons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredMarathons.map(event => (
                <MarathonCard
                  key={event.id}
                  event={event}
                  isFavorite={favorites.includes(event.id)}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => handleCardClick(event)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-800 py-32 flex flex-col items-center justify-center text-center px-6">
               <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600">
                  <Gauge size={48} />
               </div>
               <h3 className="text-2xl font-black text-white mb-2 italic uppercase">No Race Found</h3>
               <p className="text-slate-500 text-base max-w-sm font-medium">검색 결과가 없습니다. 페이스를 유지하며 다른 대회를 찾아볼까요?</p>
               <button 
                 onClick={handleResetFilters}
                 className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-black italic px-8 py-3 rounded-xl transition-all flex items-center gap-2"
               >
                 RESET FILTERS <ArrowRight size={18} />
               </button>
            </div>
          )}
        </section>
      </main>

      {/* Motivation Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-20 py-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black text-white/[0.02] italic select-none pointer-events-none uppercase">
          Marathon
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-block bg-lime-400 text-slate-950 px-6 py-2 rounded-full font-black italic uppercase tracking-widest text-xs mb-8">
            Keep Running, Never Stop
          </div>
          <h2 className="text-3xl font-black text-white italic mb-10">🏃 RunD-day</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto text-slate-500 mb-12">
            <div>
              <div className="text-white font-black italic mb-1 uppercase text-xs">Database</div>
              <div className="text-[10px]">Runner Wiki V2.0</div>
            </div>
            <div>
              <div className="text-white font-black italic mb-1 uppercase text-xs">Update</div>
              <div className="text-[10px]">Every Monday</div>
            </div>
            <div>
              <div className="text-white font-black italic mb-1 uppercase text-xs">Partner</div>
              <div className="text-[10px]">Running Crew Seoul</div>
            </div>
            <div>
              <div className="text-white font-black italic mb-1 uppercase text-xs">Contact</div>
              <div className="text-[10px]">support@rund-day.kr</div>
            </div>
          </div>

          <p className="text-slate-600 text-[10px] leading-relaxed max-w-lg mx-auto uppercase font-bold tracking-widest">
            The road belongs to the one who shows up. Every step counts. <br />
            © 2026 RunD-day. Built for the community.
          </p>
        </div>
      </footer>

      {/* Floating Calendar Button */}
      <CalendarButton
        allEvents={marathonData}
        favoriteEvents={favoriteMarathons}
      />

      {/* Marathon Detail Modal */}
      {selectedEvent && (
        <MarathonDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          isFavorite={favorites.includes(selectedEvent.id)}
          onToggleFavorite={toggleFavorite}
          onAddToCalendar={handleAddToCalendar}
        />
      )}
    </div>
  );
};

export default App;
