import { useState, useEffect, useMemo } from 'react';
import { PLAN, MONTH_NAMES } from '../lib/readingPlan';
import { DB } from '../lib/db';

export default function ReadingPlanPage() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay   = today.getDate();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [completed, setCompleted]         = useState({}); // { "1-1": true, "3-15": true, ... }
  const [loading, setLoading]             = useState(true);

  // Load all completion data
  useEffect(() => {
    DB.getAllPlanDone().then(records => {
      const map = {};
      records.forEach(r => { if (r.done) map[r.day_key] = true; });
      setCompleted(map);
      setLoading(false);
    });
  }, []);

  const toggleDay = async (month, day) => {
    const key = `${month}-${day}`;
    const next = !completed[key];
    await DB.setPlanDone(month, day, next);
    setCompleted(prev => {
      const copy = { ...prev };
      if (next) copy[key] = true;
      else delete copy[key];
      return copy;
    });
  };

  // Stats
  const totalDays = useMemo(() => Object.values(PLAN).reduce((s, m) => s + m.length, 0), []);
  const doneDays  = Object.keys(completed).length;
  const pct       = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;

  const monthDays   = PLAN[selectedMonth] || [];
  const monthDone   = monthDays.filter((_, i) => completed[`${selectedMonth}-${i + 1}`]).length;
  const monthPct    = monthDays.length > 0 ? Math.round((monthDone / monthDays.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ padding: '28px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-line" style={{ width: `${50 + (i % 3) * 15}%` }} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-calendar-check" style={{ marginRight: '8px' }} />Plano de Leitura 2026</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Leia a Bíblia em 1 ano — marque cada dia ao concluir
        </p>
      </div>

      {/* Global progress */}
      <div style={{ padding: '0 28px 16px' }}>
        <div className="plan-global-progress">
          <div className="plan-progress-info">
            <span><i className="fas fa-trophy" style={{ marginRight: '6px', color: '#f59e0b' }} />{doneDays} de {totalDays} leituras</span>
            <span className="plan-pct">{pct}%</span>
          </div>
          <div className="plan-progress-bar">
            <div className="plan-progress-fill" style={{ width: pct + '%' }} />
          </div>
        </div>
      </div>

      {/* Month tabs */}
      <div className="plan-month-tabs">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
          const mDays = PLAN[m] || [];
          const mDone = mDays.filter((_, j) => completed[`${m}-${j + 1}`]).length;
          const allDone = mDone === mDays.length && mDays.length > 0;
          return (
            <button
              key={m}
              className={`plan-month-btn${selectedMonth === m ? ' active' : ''}${allDone ? ' complete' : ''}`}
              onClick={() => setSelectedMonth(m)}
            >
              <span className="plan-month-name">{MONTH_NAMES[m].slice(0, 3)}</span>
              {allDone && <i className="fas fa-check-circle" style={{ fontSize: '10px', color: '#22c55e' }} />}
            </button>
          );
        })}
      </div>

      {/* Month header */}
      <div style={{ padding: '16px 28px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            {MONTH_NAMES[selectedMonth]}
          </h5>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {monthDone}/{monthDays.length} — {monthPct}%
          </span>
        </div>
        <div className="plan-progress-bar" style={{ marginTop: '8px' }}>
          <div className="plan-progress-fill month" style={{ width: monthPct + '%' }} />
        </div>
      </div>

      {/* Day list */}
      <div className="plan-day-list">
        {monthDays.map((reading, i) => {
          const day = i + 1;
          const key = `${selectedMonth}-${day}`;
          const done = !!completed[key];
          const isToday = selectedMonth === currentMonth && day === currentDay;
          return (
            <div
              key={key}
              className={`plan-day-item${done ? ' done' : ''}${isToday ? ' today' : ''}`}
              onClick={() => toggleDay(selectedMonth, day)}
            >
              <div className="plan-day-check">
                <i className={`fa${done ? 's' : 'r'} fa-${done ? 'check-circle' : 'circle'}`} />
              </div>
              <div className="plan-day-num">{day}</div>
              <div className="plan-day-reading">{reading}</div>
              {isToday && <span className="plan-today-badge">Hoje</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
