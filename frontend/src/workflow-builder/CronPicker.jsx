import React, { useState, useEffect, useRef } from 'react';
import './style.css';

const modes = ['daily', 'weekly', 'monthly', 'manual', 'custom'];
const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const days = Array.from({length:31},(_,i)=>i+1);
const pad = n=>String(n).padStart(2,'0');

const CronPicker = ({ value, onChange }) => {
  // Determine initial mode from existing cron string
  const deriveMode = (val) => {
    if(!val) return 'manual';
    if(/\d+ \d+ \* \* [0-6]/.test(val)) return 'weekly';
    if(/\d+ \d+ \d+ \* \*/.test(val)) return 'monthly';
    if(/\d+ \d+ \* \* \*/.test(val)) return 'daily';
    return 'custom';
  };

  const [mode,setMode] = useState(deriveMode(value));
  const [hour,setHour] = useState('08');
  const [min,setMin] = useState('00');
  const [ampm,setAm] = useState('AM');
  const [weekday,setWeekday] = useState('Mon');
  const [dayOfMonth,setDoM] = useState(1);
  const [custom,setCustom] = useState(value||'');

  const prevCron = useRef();

  // Recompute cron expr whenever inputs change
  useEffect(()=>{
    let cron=null;
    const hh = ampm==='AM'?hour:pad((parseInt(hour)%12)+12);
    switch(mode){
      case 'daily':   cron=`${min} ${hh} * * *`; break;
      case 'weekly':  cron=`${min} ${hh} * * ${weekdays.indexOf(weekday)}`; break;
      case 'monthly': cron=`${min} ${hh} ${dayOfMonth} * *`; break;
      case 'custom':  cron=custom.trim()||null; break;
      case 'manual':  default: cron=null;
    }
    if(cron!==prevCron.current){
      prevCron.current=cron;
      onChange(cron);
    }
  },[mode,hour,min,ampm,weekday,dayOfMonth,custom,onChange]);

  // keep in sync when external value changes (switching workflows)
  useEffect(()=>{
    const newMode = deriveMode(value);
    setMode(newMode);
    if(newMode==='custom') setCustom(value||'');
    else if(newMode==='manual') setCustom('');
    // we could parse hour/min but defaults are fine for display
  },[value]);

  return (
    <div className="cron-picker">
      <div className="cron-modes">
        {modes.map(m=> (
          <label key={m} className={mode===m? 'selected':''}>
            <input type="radio" name="mode" value={m} checked={mode===m} onChange={()=>setMode(m)}/>
            {m.charAt(0).toUpperCase()+m.slice(1)}
          </label>
        ))}
      </div>

      {mode!=='manual' && mode!=='custom' && (
        <div className="time-row">
          Time:&nbsp;
          <input type="number" min="1" max="12" value={parseInt(hour)%12||12} onChange={e=>setHour(pad(e.target.value))}/>
          :
          <input type="number" min="0" max="59" value={min} onChange={e=>setMin(pad(e.target.value))}/>
          <select value={ampm} onChange={e=>setAm(e.target.value)}><option>AM</option><option>PM</option></select>
        </div>
      )}
      {mode==='weekly' && (
        <div className="time-row">Weekday:&nbsp;
          <select value={weekday} onChange={e=>setWeekday(e.target.value)}>
            {weekdays.map(w=><option key={w}>{w}</option>)}
          </select>
        </div>
      )}
      {mode==='monthly' && (
        <div className="time-row">Day:&nbsp;
          <select value={dayOfMonth} onChange={e=>setDoM(parseInt(e.target.value,10))}>
            {days.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
      )}
      {mode==='custom' && (
        <input className="wf-input" placeholder="0 8 * * *" value={custom} onChange={e=>setCustom(e.target.value)}/>
      )}
    </div>
  );
};

export default CronPicker;