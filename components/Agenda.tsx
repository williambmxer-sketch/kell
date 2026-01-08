
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { WorkshopContext } from '../App';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../constants';
import { ChevronLeft, ChevronRight, Clock, LayoutGrid, CalendarDays, Plus, User as UserIcon, X, Info, Gauge, Wrench, Package } from 'lucide-react';
import { WorkshopOrder, OSStatus, Priority } from '../types';

type ViewMode = 'day' | 'week';

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 18;
const BUSINESS_DAY_MINUTES = (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60; // 600 mins

const Agenda: React.FC = () => {
  const context = useContext(WorkshopContext);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    // If it's past 18:00 (closing time), start on next day
    if (d.getHours() >= 18) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [mechanicFilter, setMechanicFilter] = useState<string>('all');
  const [viewOnlyOrder, setViewOnlyOrder] = useState<WorkshopOrder | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: React.ReactNode } | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewOnlyOrder(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!context) return null;
  if (!context) return null;
  const { orders, vehicles, clients, mechanics, settings } = context;

  const hours = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`);

  const navigateDate = (amount: number) => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'day') {
      nextDate.setDate(currentDate.getDate() + amount);
    } else {
      // For week view, jump 7 days
      // The weekDays logic will handle aligning to Monday
      nextDate.setDate(currentDate.getDate() + amount * 7);
    }
    setCurrentDate(nextDate);
  };

  const goToToday = () => {
    const d = new Date();
    if (d.getHours() >= 18) {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];

    // Always start from Monday of the current week relative to currentDate
    // We want the cycle to be Mon-Sun (or whatever the settings say, but base is Mon-Sun)
    const scanDate = new Date(currentDate);
    const day = scanDate.getDay(); // 0 = Sun, 1 = Mon ...
    const diff = scanDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(scanDate.setDate(diff));

    const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

    // Iterate for 7 days (Mon -> Sun)
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      // Safety Check for Settings
      if (settings && settings.horario_funcionamento) {
        const dayKey = daysMap[d.getDay()];
        const dayConfig = settings.horario_funcionamento[dayKey];
        // Default to active if missing config, unless explicitly false
        const isActive = dayConfig ? dayConfig.ativo !== false : true;
        if (isActive) days.push(d);
      } else {
        // Default: All days active if no settings
        days.push(d);
      }
    }
    return days;
  }, [currentDate, settings]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // --- Layout Algorithm ---

  interface OrderSegment {
    order: WorkshopOrder;
    date: string; // YYYY-MM-DD
    startMin: number; // Minutes from 00:00
    duration: number; // Minutes
    isSpillover: boolean;
  }

  // Greedy column packing for overlapping events
  const layoutEvents = (segments: OrderSegment[]) => {
    // 1. Sort by start time, then duration descending
    const sorted = [...segments].sort((a, b) => {
      if (a.startMin !== b.startMin) return a.startMin - b.startMin;
      return b.duration - a.duration;
    });

    const columns: OrderSegment[][] = [];
    const assignment: { segment: OrderSegment; colIndex: number }[] = [];

    // 2. Assign columns
    sorted.forEach(seg => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const lastInCol = col[col.length - 1];
        // Check overlap with last event in this column
        // We only need to check the last one because we sorted by start time
        // If seg.start >= last.end, no overlap
        if (seg.startMin >= (lastInCol.startMin + lastInCol.duration)) {
          col.push(seg);
          assignment.push({ segment: seg, colIndex: i });
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Start new column
        columns.push([seg]);
        assignment.push({ segment: seg, colIndex: columns.length - 1 });
      }
    });

    // 3. For "Cluster" width logic:
    // We want events that are part of the same "conflict group" to share width equally.
    // Simple approach: Total columns = Layout Width.
    // But disjoint groups shouldn't be squeezed.
    // Refinement: Layout needs to be aware of disjoint clusters.
    // However, the "greedy packing" effectively places disjoint items in Col 0.
    // So if I have 2 cols total, but disjoint item is in Col 0, it gets 50% width?
    // Yes, usually.
    // To give C 100% width in A/B/C example (A,B overlap, C disjoint), we need Cluster detection.

    // --- Cluster Detection ---
    const clusters: OrderSegment[][] = [];
    if (sorted.length > 0) {
      let currentCluster = [sorted[0]];
      let clusterEnd = sorted[0].startMin + sorted[0].duration;

      for (let i = 1; i < sorted.length; i++) {
        const s = sorted[i];
        if (s.startMin < clusterEnd) {
          currentCluster.push(s);
          clusterEnd = Math.max(clusterEnd, s.startMin + s.duration);
        } else {
          clusters.push(currentCluster);
          currentCluster = [s];
          clusterEnd = s.startMin + s.duration;
        }
      }
      clusters.push(currentCluster);
    }

    // Process clusters independently
    const result: (OrderSegment & { widthPct: number; leftPct: number })[] = [];

    clusters.forEach(cluster => {
      // Local greedy packing for the cluster
      const clusterCols: OrderSegment[][] = [];
      cluster.forEach(seg => {
        let placed = false;
        for (let i = 0; i < clusterCols.length; i++) {
          const col = clusterCols[i];
          const last = col[col.length - 1];
          if (seg.startMin >= (last.startMin + last.duration)) {
            col.push(seg);
            // Store strict col index for this segment
            (seg as any)._colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          clusterCols.push([seg]);
          (seg as any)._colIndex = clusterCols.length - 1;
        }
      });

      const totalCols = clusterCols.length;
      const widthPct = 100 / totalCols;

      cluster.forEach(seg => {
        const colIndex = (seg as any)._colIndex;
        result.push({
          ...seg,
          widthPct,
          leftPct: colIndex * widthPct
        });
      });
    });

    return result;
  };

  // --- Multi-Day / Split Logic Start ---

  const processOrdersForView = useMemo(() => {
    const segments: OrderSegment[] = [];

    orders.forEach(order => {
      if (!order.scheduledDate || !order.estimatedDuration) return;

      // Parse Start
      const [datePart, timePart] = order.scheduledDate.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = timePart.split(':').map(Number);

      let currentScanDate = new Date(y, m - 1, d);
      let remainingDuration = order.estimatedDuration;
      let isFirstSegment = true;
      let currentStartMin = h * 60 + min;

      // Safety limit: max 7 days split to avoid infinite loops
      let dayCount = 0;

      while (remainingDuration > 0 && dayCount < 7) {
        const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const dayIdx = currentScanDate.getDay();
        const dayKey = daysMap[dayIdx];
        const dayConfig = settings?.horario_funcionamento?.[dayKey];

        // If day is closed/inactive, just skip to next day? 
        // Logic: if it's the START day and it's closed, that's an anomaly, but let's assume valid start.
        // If it's a CONTINUATION day and closed, skip it.

        const isActive = dayConfig?.ativo !== false; // Default active if config missing

        if (!isActive) {
          // Skip to next day
          currentScanDate.setDate(currentScanDate.getDate() + 1);
          dayCount++;
          // Start next day at opening time
          currentStartMin = -1; // Flag to reset
          continue;
        }

        const configStart = dayConfig?.inicio || '08:00';
        const configEnd = dayConfig?.fim || '18:00';
        const [openH, openM] = configStart.split(':').map(Number);
        const [closeH, closeM] = configEnd.split(':').map(Number);
        const openMins = openH * 60 + openM;
        const closeMins = closeH * 60 + closeM;

        // If this is a continuation (or first day but start < open), clamp start
        if (currentStartMin < openMins) currentStartMin = openMins;

        // Calculate available time today
        const availableMins = Math.max(0, closeMins - currentStartMin);

        if (availableMins > 0) {
          const consumed = Math.min(remainingDuration, availableMins);

          const sY = currentScanDate.getFullYear();
          const sM = String(currentScanDate.getMonth() + 1).padStart(2, '0');
          const sD = String(currentScanDate.getDate()).padStart(2, '0');
          const segmentDateStr = `${sY}-${sM}-${sD}`;

          segments.push({
            order: order,
            date: segmentDateStr,
            startMin: currentStartMin,
            duration: consumed,
            isSpillover: !isFirstSegment
          });

          remainingDuration -= consumed;
        }

        // Prep for next day
        currentScanDate.setDate(currentScanDate.getDate() + 1);
        currentStartMin = -1; // usage of -1 will trigger reset to openMins in next loop
        isFirstSegment = false;
        dayCount++;
      }
    });

    return segments;
  }, [orders, settings]);

  // --- Multi-Day / Split Logic End ---


  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-slate-100/80">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Operacional</h2>
          <p className="text-slate-700 text-sm font-semibold">Carga técnica e cronograma de serviços.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mechanic Filter (Week View Only) */}
          {viewMode === 'week' && (
            <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-md mr-2">
              <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico:</span>
              </div>
              <select
                value={mechanicFilter}
                onChange={(e) => setMechanicFilter(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold text-slate-900 focus:ring-0 cursor-pointer pl-2 pr-8 py-1 uppercase tracking-tight"
              >
                <option value="all">TODOS</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-md">
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'day' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> DIA
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === 'week' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> SEMANA
            </button>
          </div>

          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-md">
            <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-800 hover:text-slate-900">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 flex flex-col items-center min-w-[140px]">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest leading-none mb-1">{monthYearLabel}</span>
              <span className="text-xs font-black text-slate-900 uppercase">
                {viewMode === 'day'
                  ? currentDate.toLocaleDateString('pt-BR', { day: '2-digit', weekday: 'long' })
                  : weekDays.length > 0
                    ? `${weekDays[0].getDate()} - ${weekDays[weekDays.length - 1].getDate()} ${monthYearLabel.split(' ')[0]}`
                    : monthYearLabel}
              </span>
            </div>
            <button onClick={() => navigateDate(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-800 hover:text-slate-900">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button onClick={goToToday} className="bg-slate-900 border border-slate-900 px-5 py-2.5 rounded-xl text-xs font-black text-white hover:bg-slate-800 transition-all shadow-md active:scale-95 uppercase tracking-widest">
            Hoje
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-white border border-slate-400 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex-1 overflow-auto bg-white border border-slate-400 rounded-2xl shadow-2xl flex flex-col relative">
          {/* VIEW MODE: DAY (Keep Table) */}
          {viewMode === 'day' ? (
            /* VIEW MODE: DAY (Horizontal / Gantt Style) */
            <div className="flex flex-col min-w-[1200px] bg-slate-50">
              {/* Header: Hours */}
              {/* Header: Hours */}
              <div className="relative h-10 bg-slate-50 border-b border-slate-300 shadow-sm ml-[200px]">
                {hours.map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 flex items-center justify-center transform -translate-x-1/2"
                    style={{ left: `${(idx / 10) * 100}%` }}
                  >
                    <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-1">{hour}</span>
                    {/* Tick Mark */}
                    <div className="absolute bottom-0 h-1.5 w-px bg-slate-300"></div>
                  </div>
                ))}
              </div>

              {/* Rows: Mechanics */}
              <div className="flex-1 overflow-y-auto">
                {mechanics.map((mechanic) => (
                  <div key={mechanic.id} className="flex border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors h-24 group">
                    {/* Mechanic Info Column (Sticky Left) */}
                    <div className="w-[200px] shrink-0 sticky left-0 z-20 bg-white border-r border-slate-300 p-3 flex items-center gap-3 group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-xs uppercase leading-tight truncate">{mechanic.name}</p>
                        <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">Mecânico</p>
                      </div>
                    </div>

                    {/* Timeline Track */}
                    <div className="flex-1 relative">
                      {/* Background Grid Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {hours.slice(0, -1).map((h) => (
                          <div key={h} className="flex-1 border-r border-slate-100 last:border-none"></div>
                        ))}
                      </div>

                      {/* Events */}
                      {(() => {
                        const year = currentDate.getFullYear();
                        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                        const dayStr = String(currentDate.getDate()).padStart(2, '0');
                        const dateKey = `${year}-${month}-${dayStr}`;

                        const mechanicSegments = processOrdersForView.filter(seg =>
                          seg.order.mechanicId === mechanic.id &&
                          seg.date === dateKey
                        );

                        return mechanicSegments.map((segment, idx) => {
                          const activeOrder = segment.order;

                          // Calculate Position and Width relative to 08:00
                          // Business hours start at 08:00 (480 mins)
                          const startOffset = segment.startMin - (BUSINESS_START_HOUR * 60);
                          const totalDayMinutes = BUSINESS_DAY_MINUTES; // 600

                          const leftPercent = (Math.max(0, startOffset) / totalDayMinutes) * 100;
                          const widthPercent = (segment.duration / totalDayMinutes) * 100;

                          const vehicle = vehicles.find(v => v.id === activeOrder.vehicleId);
                          const client = vehicle ? clients.find(c => c.id === vehicle.clientId) : null;
                          const priorityStyle = PRIORITY_CONFIG[activeOrder.priority];

                          // Text Label Time Range
                          const endMin = segment.startMin + segment.duration;
                          const startH = Math.floor(segment.startMin / 60);
                          const startM = segment.startMin % 60;
                          const endH = Math.floor(endMin / 60);
                          const endM = endMin % 60;
                          const timeRange = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')} - ${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                          const isFinished = activeOrder.status === OSStatus.FINISHED;
                          const cardBg = isFinished ? 'bg-slate-200' : priorityStyle?.bg;
                          const cardBorder = isFinished ? 'border-slate-300' : priorityStyle?.border;

                          // Helper to format status (remove "Em " for brevity)
                          const statusLabel = STATUS_CONFIG[activeOrder.status].label.replace(/^Em\s+/, '');

                          return (
                            <div
                              key={`${activeOrder.id}-${idx}`}
                              onClick={() => setViewOnlyOrder(activeOrder)}
                              onMouseEnter={(e) => setTooltip({
                                visible: true,
                                x: e.clientX,
                                y: e.clientY,
                                content: (
                                  <>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">📋 OS #{activeOrder.id} {segment.isSpillover && '(Continuação)'}</p>
                                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">👤 Cliente: <span className="text-slate-900">{client?.name || 'N/A'}</span></p>
                                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">🚗 Veículo: <span className="text-slate-900">{vehicle?.model || 'N/A'} ({vehicle?.plate || 'N/A'})</span></p>
                                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">⏰ Horário: <span className="text-slate-900">{timeRange}</span></p>
                                    <p className="text-[10px] font-bold text-slate-600">📊 Status: <span className="text-slate-900">{STATUS_CONFIG[activeOrder.status].label}</span></p>
                                  </>
                                )
                              })}
                              onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                              onMouseLeave={() => setTooltip(null)}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                top: '8px',
                                height: 'calc(100% - 16px)'
                              }}
                              className={`absolute z-10 rounded-lg shadow-md border-[2px] cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:z-20 transition-all overflow-hidden flex flex-col justify-center px-2 ${cardBg} ${cardBorder} ${segment.isSpillover ? 'opacity-90 border-dashed' : ''} ${isFinished ? 'grayscale-0 opacity-90' : ''}`}
                            >
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="font-extrabold text-slate-900 text-[10px] truncate">
                                    {segment.isSpillover && <span className="text-indigo-600 mr-1">↪</span>}
                                    OS #{activeOrder.id}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1 rounded border ${isFinished ? 'bg-slate-300 border-slate-400 text-slate-600' : 'bg-white/50 border-black/5 text-slate-700'}`}>
                                    {statusLabel.split(' ')[0]}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-black text-slate-800 uppercase truncate leading-none mb-0.5">{vehicle?.model}</span>
                                  <span className="text-[9px] font-bold text-slate-600 truncate leading-none">CLIENTE: <span className="text-slate-800">{client?.name.split(' ')[0]}</span></span>
                                  <span className="text-[9px] font-bold text-slate-600 truncate leading-none">MECÂNICO: <span className="text-slate-800">{mechanics.find(m => m.id === activeOrder.mechanicId)?.name.split(' ')[0] || 'N/A'}</span></span>
                                  <span className="text-[9px] font-bold text-slate-500 truncate leading-none mt-0.5">{timeRange}</span>
                                </div>
                              </div>
                            </div>
                          )
                        });
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW MODE: WEEK (Horizontal Gantt Layout) */
            <div className="flex flex-col min-w-[1000px] bg-slate-50 h-full">
              {/* Header: Time Axis (Sticky Top) */}
              <div className="sticky top-0 z-30 flex items-center bg-slate-100 border-b border-slate-300 h-10 ml-[100px] shadow-sm">
                <div className="relative w-full h-full">
                  {hours.map((hour, idx) => {
                    const leftPct = (idx / 10) * 100;
                    const isFirst = idx === 0;
                    const isLast = idx === hours.length - 1;

                    return (
                      <div
                        key={hour}
                        className="absolute top-0 h-full flex flex-col justify-center"
                        style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }} // Center the Wrapper on the point
                      >
                        {/* Tick Mark - Always exactly centered on the point */}
                        <div className="absolute bottom-0 h-1.5 w-px bg-slate-400 left-1/2 -translate-x-1/2"></div>

                        {/* Text Label - Shifted locally based on position */}
                        <span className={`text-[10px] font-black text-slate-500 relative -top-1 ${isFirst ? 'left-1' : isLast ? '-left-1' : ''} ${isFirst ? 'text-left origin-left' : isLast ? 'text-right origin-right' : 'text-center'}`}>
                          {hour}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body: Days (Rows) */}
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {weekDays.map((day, dayIdx) => {
                  const isDayToday = isToday(day);
                  const dYear = day.getFullYear();
                  const dMonth = String(day.getMonth() + 1).padStart(2, '0');
                  const dDay = String(day.getDate()).padStart(2, '0');
                  const dateKey = `${dYear}-${dMonth}-${dDay}`;

                  // Filter segments for this day
                  const daySegments = processOrdersForView.filter(seg =>
                    seg.date === dateKey &&
                    (mechanicFilter === 'all' || seg.order.mechanicId === mechanicFilter)
                  );

                  // Use safe parsing for startMin
                  const rowEvents = daySegments.map(seg => {
                    const startOffset = Math.max(0, seg.startMin - (BUSINESS_START_HOUR * 60));
                    // Ensure we don't go out of bounds (08:00 to 18:00 = 600 mins)
                    const safeOffset = Math.min(BUSINESS_DAY_MINUTES, startOffset);
                    const leftPct = (safeOffset / BUSINESS_DAY_MINUTES) * 100;
                    // Cap duration to remaining day
                    const maxDuration = BUSINESS_DAY_MINUTES - safeOffset;
                    const safeDuration = Math.min(seg.duration, maxDuration);
                    const widthPct = (safeDuration / BUSINESS_DAY_MINUTES) * 100;

                    return { ...seg, leftPct, widthPct };
                  });

                  // Calculate Lanes (Vertical Stacking within the Row)
                  const lanes: (typeof rowEvents)[] = [];
                  const placedEvents: (typeof rowEvents[0] & { laneIndex: number })[] = [];

                  // Sort by start time
                  rowEvents.sort((a, b) => a.startMin - b.startMin).forEach(ev => {
                    let laneIdx = 0;
                    while (true) {
                      // Check collision in this lane
                      const lane = lanes[laneIdx] || [];
                      const hasCollision = lane.some(placed => {
                        const evEnd = ev.startMin + ev.duration;
                        const placedEnd = placed.startMin + placed.duration;
                        return ev.startMin < placedEnd && evEnd > placed.startMin;
                      });

                      if (!hasCollision) {
                        if (!lanes[laneIdx]) lanes[laneIdx] = [];
                        lanes[laneIdx].push(ev);
                        placedEvents.push({ ...ev, laneIndex: laneIdx });
                        break;
                      }
                      laneIdx++;
                    }
                  });

                  const maxLanes = Math.max(1, lanes.length);
                  const laneHeight = 60;
                  const rowHeight = Math.max(100, maxLanes * (laneHeight + 8) + 20);

                  return (
                    <div key={day.toISOString()} className={`flex-1 flex border-b border-slate-200 ${isDayToday ? 'bg-indigo-50/30' : 'bg-white'}`} style={{ minHeight: '100px' }}>
                      {/* Left Column: Day Label */}
                      <div className={`w-[100px] shrink-0 border-r border-slate-300 p-4 flex flex-col items-center justify-center sticky left-0 z-20 ${isDayToday ? 'bg-indigo-50' : 'bg-white'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDayToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </span>
                        <span className={`text-2xl font-black ${isDayToday ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {day.getDate()}
                        </span>
                      </div>

                      {/* Right Track: Horizontal Events */}
                      <div className="flex-1 relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {/* Map 10 intervals (hours 0 to 9) */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-slate-200 relative">
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Events */}
                        {placedEvents.map(ev => {
                          const p = PRIORITY_CONFIG[ev.order.priority];
                          const v = vehicles.find(x => x.id === ev.order.vehicleId);
                          const client = v ? clients.find(c => c.id === v.clientId) : null;

                          // Calculate vertical position (Percentage Based)
                          // Total height = 100%. Split by maxLanes.
                          const laneHeightPct = 100 / maxLanes;
                          const topPct = ev.laneIndex * laneHeightPct;

                          const isFinished = ev.order.status === OSStatus.FINISHED;
                          const cardBg = isFinished ? 'bg-slate-200' : p.bg;
                          const cardBorder = isFinished ? 'border-slate-300' : p.border;

                          // Helper to format status (remove "Em " for brevity without losing meaning)
                          const statusLabel = STATUS_CONFIG[ev.order.status].label.replace(/^Em\s+/, '');

                          return (
                            <div
                              key={`${ev.order.id}-${dayIdx}-${ev.laneIndex}`}
                              onClick={() => setViewOnlyOrder(ev.order)}
                              className={`absolute z-10 transition-all hover:z-30 p-[1px]`}
                              style={{
                                left: `${ev.leftPct}%`,
                                width: `${ev.widthPct}%`,
                                top: `${topPct}%`,
                                height: `${laneHeightPct}%`
                              }}
                              onMouseEnter={(e) => setTooltip({
                                visible: true,
                                x: e.clientX,
                                y: e.clientY,
                                content: (
                                  <>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">📋 OS #{ev.order.id} {ev.isSpillover && '(Continuação)'}</p>
                                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">👤 Cliente: <span className="text-slate-900">{client?.name || 'N/A'}</span></p>
                                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">🚗 Veículo: <span className="text-slate-900">{v?.model || 'N/A'} ({v?.plate || 'N/A'})</span></p>
                                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">📊 Status: <span className="text-slate-900">{STATUS_CONFIG[ev.order.status].label}</span></p>
                                    <p className="text-[10px] font-bold text-slate-600">🔧 Mecânico: <span className="text-slate-900">{mechanics.find(m => m.id === ev.order.mechanicId)?.name || 'N/A'}</span></p>
                                  </>
                                )
                              })}
                              onMouseLeave={() => setTooltip(null)}
                              onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                            >
                              <div className={`w-full h-full rounded-md border-[2px] shadow-md hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer ${cardBg} ${cardBorder} overflow-hidden flex flex-col ${ev.isSpillover ? 'opacity-90 border-dashed' : ''} text-[10px] ${isFinished ? 'grayscale-[0.5] opacity-90' : ''}`}>
                                <div className="bg-white/40 px-1.5 py-1 flex items-center justify-between border-b border-black/5 shrink-0">
                                  <span className="font-extrabold text-slate-900 text-[10px]">OS #{ev.order.id}</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[7px] font-black uppercase tracking-wider px-1 rounded border ${isFinished ? 'bg-slate-300 border-slate-400 text-slate-600' : 'bg-white/50 border-black/5 text-slate-700'}`}>
                                      {statusLabel.split(' ')[0]}
                                    </span>
                                    {ev.isSpillover && <Clock className="w-2.5 h-2.5 text-indigo-400" />}
                                  </div>
                                </div>
                                <div className="px-1.5 py-0.5 flex-1 min-h-0 flex flex-col justify-center gap-0.5">
                                  <div className="font-black text-slate-800 uppercase leading-none truncate mb-0.5">{v?.model}</div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <UserIcon className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className="text-[9px] font-bold text-slate-700 truncate leading-none">{client?.name.split(' ')[0]}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Informativo (Somente Leitura) - Ajustado para max-w-xl */}
      {viewOnlyOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewOnlyOrder(null)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"><Info className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Detalhes da Ordem</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">#{viewOnlyOrder.id} • Informativo Premium</p>
                </div>
              </div>
              <button onClick={() => setViewOnlyOrder(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
            </header>

            <div className="p-8 space-y-8">
              {/* Top Row: Vehicle Details */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Veículo</p>
                  <p className="text-base font-black text-slate-900 uppercase">{vehicles.find(v => v.id === viewOnlyOrder.vehicleId)?.model}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Placa</p>
                  <p className="text-base font-black text-slate-900 font-mono tracking-tighter">{vehicles.find(v => v.id === viewOnlyOrder.vehicleId)?.plate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montadora</p>
                  <p className="text-base font-black text-slate-900 uppercase">{vehicles.find(v => v.id === viewOnlyOrder.vehicleId)?.brand}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ano</p>
                  <p className="text-base font-black text-slate-900 uppercase">{vehicles.find(v => v.id === viewOnlyOrder.vehicleId)?.year}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cor</p>
                  <p className="text-base font-black text-slate-900 uppercase">{vehicles.find(v => v.id === viewOnlyOrder.vehicleId)?.color}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Câmbio</p>
                  <p className="text-base font-black text-slate-900 uppercase">{vehicles.find(v => v.id === viewOnlyOrder.vehicleId)?.transmission || 'N/A'}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Middle Row: Operational Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase inline-block ${STATUS_CONFIG[viewOnlyOrder.status].color}`}>{STATUS_CONFIG[viewOnlyOrder.status].label}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridade</p>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase inline-block ${PRIORITY_CONFIG[viewOnlyOrder.priority].bg} ${PRIORITY_CONFIG[viewOnlyOrder.priority].color} ${PRIORITY_CONFIG[viewOnlyOrder.priority].border}`}>{PRIORITY_CONFIG[viewOnlyOrder.priority].label}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mecânico Responsável</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{mechanics.find(m => m.id === viewOnlyOrder.mechanicId)?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data da Triagem</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{new Date(viewOnlyOrder.createdAt).toLocaleDateString('pt-BR')} às {new Date(viewOnlyOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Bottom Section: Reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relato do Cliente</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">"{viewOnlyOrder.reportedFault}"</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico Técnico</p>
                  {viewOnlyOrder.diagnosis ? (
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{viewOnlyOrder.diagnosis}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Pendente</p>
                  )}
                </div>
              </div>
            </div>

            <footer className="p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setViewOnlyOrder(null)}
                className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black active:scale-[0.98] transition-all"
              >
                Fechar Visualização
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Global Cursor Tooltip - Smart Positioning */}
      {tooltip?.visible && (
        <div
          className="fixed z-[200] pointer-events-none transition-transform duration-75"
          style={{
            left: tooltip.x + (tooltip.x > window.innerWidth * 0.6 ? -12 : 12),
            top: tooltip.y + (tooltip.y > window.innerHeight * 0.6 ? -12 : 12),
            transform: `translate(${tooltip.x > window.innerWidth * 0.6 ? '-100%' : '0'}, ${tooltip.y > window.innerHeight * 0.6 ? '-100%' : '0'})`
          }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl px-4 py-3 min-w-[200px] text-left animate-in fade-in zoom-in-95 duration-150 relative">
            {/* Arrow Decoration (Optional, but adds polish) */}
            <div className={`absolute w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45 
              ${tooltip.y > window.innerHeight * 0.6
                ? '-bottom-1.5 border-t-0 border-l-0 border-b border-r' // pointing down if tooltip is above
                : '-top-1.5' // pointing up if tooltip is below
              }
              ${tooltip.x > window.innerWidth * 0.6
                ? '-right-1.5 border-l-0 border-t border-r' // pointing right if tooltip is left
                : '-left-1.5' // pointing left if tooltip is right
              }
              hidden opacity-0` /* Keeping hidden for now as positioning arrows on dynamic corners is tricky without complex logic */}
            />
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
