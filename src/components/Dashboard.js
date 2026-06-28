import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Dashboard({ user }) {
  const [userData, setUserData] = useState(null);
  const [todayHabits, setTodayHabits] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [showRequest, setShowRequest] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestType, setRequestType] = useState('habit');
  const [requestSent, setRequestSent] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [history, setHistory] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const today = new Date().toDateString();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserData(data);
      setHistory(data.history || {});
      if (data.todayDate === today) setTodayHabits(data.todayHabits || {});
      else setTodayHabits({});
    }
    const settingsSnap = await getDoc(doc(db, 'admin', 'settings'));
    if (settingsSnap.exists()) {
      const s = settingsSnap.data();
      setSettings(s);
      if (s.announcement) setAnnouncement(s.announcement);
    }
    setLoading(false);
  };

  const toggleHabit = async (habit) => {
    const newTodayHabits = { ...todayHabits, [habit.name]: !todayHabits[habit.name] };
    setTodayHabits(newTodayHabits);

    const completed = Object.values(newTodayHabits).filter(Boolean).length;
    const total = userData.habits.length;
    const todayXP = userData.habits
      .filter(h => newTodayHabits[h.name])
      .reduce((sum, h) => sum + (h.xp || 10), 0);

    const xpPerLevel = settings.xpPerLevel || 1000;
    const newTotalXP = (userData.totalXP || 0) - (userData.todayXP || 0) + todayXP;
    const newLevel = Math.floor(newTotalXP / xpPerLevel) + 1;

    const weeklyData = [...(userData.weeklyData || [0,0,0,0,0,0,0])];
    weeklyData[new Date().getDay()] = Math.round((completed/total)*100);

    const newStreak = completed === total ? (userData.streak||0)+1 : userData.streak||0;

    const dateKey = new Date().toISOString().split('T')[0];
    const newHistory = {
      ...history,
      [dateKey]: {
        habits: newTodayHabits,
        completed,
        total,
        percent: Math.round((completed/total)*100)
      }
    };
    setHistory(newHistory);

    await updateDoc(doc(db, 'users', user.uid), {
      todayHabits: newTodayHabits,
      todayDate: today,
      todayXP,
      totalXP: newTotalXP,
      level: newLevel,
      streak: newStreak,
      weeklyData,
      history: newHistory,
    });

    setUserData(prev => ({...prev, totalXP:newTotalXP, level:newLevel, streak:newStreak, weeklyData, todayXP}));
  };

  const sendRequest = async () => {
    if (!requestText.trim()) return;
    await addDoc(collection(db, 'requests'), {
      userId: user.uid,
      type: requestType,
      habitName: requestType === 'habit' ? requestText : null,
      message: requestType === 'suggestion' ? requestText : null,
      createdAt: Date.now(),
    });
    setRequestSent(true);
    setRequestText('');
    setTimeout(() => { setRequestSent(false); setShowRequest(false); }, 2000);
  };

  const onCalendarClick = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    setSelectedDay(dateKey);
    setSelectedDayData(history[dateKey] || null);
  };

  const getTileClassName = ({ date }) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayData = history[dateKey];
    if (!dayData) return '';
    if (dayData.percent === 100) return 'cal-complete';
    if (dayData.percent > 0) return 'cal-partial';
    return '';
  };

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0f0f1a',color:'#fff',fontSize:'24px'}}>⚡ Loading...</div>
  );

  const completed = Object.values(todayHabits).filter(Boolean).length;
  const total = userData?.habits?.length || 0;
  const percent = total > 0 ? Math.round((completed/total)*100) : 0;
  const totalXP = userData?.totalXP || 0;
  const xpPerLevel = settings.xpPerLevel || 1000;
  const level = userData?.level || 1;
  const streak = userData?.streak || 0;
  const xpInLevel = totalXP % xpPerLevel;
  const xpPercent = (xpInLevel / xpPerLevel) * 100;
  const appName = settings.appName || 'HabitQuest';
  const themeColor = settings.themeColor || '#7c3aed';

  const chartData = (userData?.weeklyData || [0,0,0,0,0,0,0]).map((val,i) => ({
    day: days[i], progress: val
  }));

  const badges = [];
  if (streak >= 3) badges.push('🔥 3 Day Streak');
  if (streak >= 7) badges.push('⚡ 7 Day Warrior');
  if (streak >= 30) badges.push('👑 30 Day Legend');
  if (totalXP >= xpPerLevel) badges.push('🏆 Level 2+');
  if (percent === 100) badges.push('✅ Perfect Day');

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0f1a,#1a1a2e)',fontFamily:'Arial',padding:'20px',color:'#fff'}}>

      <style>{`
        .react-calendar { background: #1a1a2e !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 14px !important; color: #fff !important; width: 100% !important; }
        .react-calendar__tile { color: #fff !important; border-radius: 8px !important; }
        .react-calendar__tile:hover { background: rgba(124,58,237,0.3) !important; }
        .react-calendar__tile--active { background: #7c3aed !important; }
        .react-calendar__navigation button { color: #fff !important; }
        .react-calendar__month-view__weekdays { color: #aaa !important; }
        .cal-complete { background: rgba(5,150,105,0.4) !important; border: 1px solid #059669 !important; }
        .cal-partial { background: rgba(234,179,8,0.3) !important; border: 1px solid #eab308 !important; }
      `}</style>

      {announcement && (
        <div style={{background:`${themeColor}33`,border:`1px solid ${themeColor}`,borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'#fff',fontSize:'13px'}}>📢 {announcement}</span>
          <button onClick={() => setAnnouncement('')} style={{background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:'16px'}}>×</button>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <div>
          <h2 style={{margin:0,color:themeColor}}>⚡ {appName}</h2>
          <p style={{margin:0,color:'#aaa',fontSize:'13px'}}>Namaste, {user.displayName || user.email?.split('@')[0] || 'Hero'}! 👋</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={() => setShowCalendar(true)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',padding:'8px 12px',borderRadius:'10px',cursor:'pointer',fontSize:'16px'}}>📅</button>
          <button onClick={() => setShowRequest(true)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',padding:'8px 12px',borderRadius:'10px',cursor:'pointer',fontSize:'12px'}}>💬</button>
          <button onClick={() => signOut(auth)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#aaa',padding:'8px 12px',borderRadius:'10px',cursor:'pointer',fontSize:'12px'}}>Logout</button>
        </div>
      </div>

      {settings.quote && (
        <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',border:'1px solid rgba(255,255,255,0.08)',fontStyle:'italic',color:'#aaa',fontSize:'13px',textAlign:'center'}}>
          💡 "{settings.quote}"
        </div>
      )}

      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'16px',marginBottom:'14px',border:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
          <span style={{color:themeColor,fontWeight:'bold'}}>🏆 Level {level}</span>
          <span style={{color:'#aaa',fontSize:'13px'}}>{xpInLevel}/{xpPerLevel} XP</span>
        </div>
        <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',height:'10px'}}>
          <div style={{width:`${xpPercent}%`,height:'100%',background:`linear-gradient(90deg,${themeColor},#06b6d4)`,borderRadius:'10px',transition:'width 0.5s'}}></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px',fontSize:'12px',color:'#aaa'}}>
          <span>⚡ Total: {totalXP} XP</span>
          <span>🔥 Streak: {streak}</span>
        </div>
      </div>

      <div style={{display:'flex',gap:'10px',marginBottom:'14px'}}>
        {[{label:'Today XP',value:`+${userData?.todayXP||0}`},{label:'Done',value:`${completed}/${total}`},{label:'Progress',value:`${percent}%`}].map((s,i) => (
          <div key={i} style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'12px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontSize:'18px',fontWeight:'bold',color:themeColor}}>{s.value}</div>
            <div style={{fontSize:'11px',color:'#aaa'}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px',fontSize:'13px'}}>
          <span>Aaj ka Progress</span>
          <span style={{color:themeColor}}>{percent}%</span>
        </div>
        <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'10px',height:'10px'}}>
          <div style={{width:`${percent}%`,height:'100%',background:`linear-gradient(90deg,${themeColor},#06b6d4)`,borderRadius:'10px',transition:'width 0.5s'}}></div>
        </div>
      </div>

      <h3 style={{color:'#aaa',marginBottom:'10px',fontSize:'14px'}}>📋 Aaj ki Habits</h3>
      {userData?.habits?.map((habit,i) => (
        <div key={i} onClick={() => toggleHabit(habit)} style={{display:'flex',alignItems:'center',gap:'12px',background:todayHabits[habit.name]?`${themeColor}44`:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'14px',marginBottom:'8px',cursor:'pointer',border:todayHabits[habit.name]?`1px solid ${themeColor}`:'1px solid rgba(255,255,255,0.1)',transition:'all 0.3s'}}>
          <span style={{fontSize:'20px'}}>{habit.icon||'⭐'}</span>
          <span style={{flex:1,textDecoration:todayHabits[habit.name]?'line-through':'none',color:todayHabits[habit.name]?'#aaa':'#fff',fontSize:'14px'}}>{habit.name}</span>
          <span style={{color:themeColor,fontSize:'12px'}}>+{habit.xp||10} XP</span>
          <span style={{fontSize:'18px'}}>{todayHabits[habit.name]?'✅':'○'}</span>
        </div>
      ))}

      <h3 style={{color:'#aaa',margin:'16px 0 10px',fontSize:'14px'}}>📊 Weekly Progress</h3>
      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'14px',padding:'16px',marginBottom:'14px',border:'1px solid rgba(255,255,255,0.1)'}}>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" stroke="#aaa" fontSize={11}/>
            <YAxis stroke="#aaa" fontSize={11} domain={[0,100]}/>
            <Tooltip contentStyle={{background:'#1a1a2e',border:`1px solid ${themeColor}`,borderRadius:'8px',color:'#fff'}}/>
            <Bar dataKey="progress" fill={themeColor} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {badges.length > 0 && (
        <>
          <h3 style={{color:'#aaa',marginBottom:'8px',fontSize:'14px'}}>🏅 Badges</h3>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'14px'}}>
            {badges.map((badge,i) => (
              <span key={i} style={{padding:'6px 12px',background:`${themeColor}33`,border:`1px solid ${themeColor}`,borderRadius:'20px',color:'#fff',fontSize:'12px'}}>{badge}</span>
            ))}
          </div>
        </>
      )}

      {percent === 100 && (
        <div style={{textAlign:'center',padding:'20px',background:`${themeColor}33`,borderRadius:'14px',border:`1px solid ${themeColor}`}}>
          <div style={{fontSize:'36px'}}>🎉</div>
          <div style={{fontSize:'18px',fontWeight:'bold'}}>Sab complete! Amazing!</div>
          <div style={{color:themeColor}}>+{userData?.todayXP||0} XP earned today!</div>
        </div>
      )}

      {showCalendar && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'20px'}}>
          <div style={{background:'#1a1a2e',borderRadius:'20px',padding:'24px',width:'380px',maxHeight:'90vh',overflowY:'auto',border:'1px solid #7c3aed'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <h3 style={{color:'#fff',margin:0}}>📅 Progress Calendar</h3>
              <button onClick={() => {setShowCalendar(false);setSelectedDay(null);setSelectedDayData(null);}} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:'8px',cursor:'pointer'}}>✕</button>
            </div>
            <div style={{marginBottom:'12px',display:'flex',gap:'12px',fontSize:'12px'}}>
              <span>🟢 Complete</span>
              <span>🟡 Partial</span>
              <span>⬜ None</span>
            </div>
            <Calendar onClickDay={onCalendarClick} tileClassName={getTileClassName}/>
            {selectedDay && (
              <div style={{marginTop:'16px',background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'14px',border:'1px solid rgba(255,255,255,0.1)'}}>
                <h4 style={{color:'#a78bfa',margin:'0 0 10px'}}>{selectedDay}</h4>
                {selectedDayData ? (
                  <>
                    <p style={{color:'#aaa',fontSize:'13px',margin:'0 0 8px'}}>{selectedDayData.completed}/{selectedDayData.total} habits — {selectedDayData.percent}%</p>
                    {Object.entries(selectedDayData.habits).map(([name,done],i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                        <span>{done?'✅':'○'}</span>
                        <span style={{color:done?'#fff':'#555',fontSize:'13px'}}>{name}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{color:'#555',fontSize:'13px',margin:0}}>Is din koi data nahi hai</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showRequest && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'20px'}}>
          <div style={{background:'#1a1a2e',borderRadius:'20px',padding:'24px',width:'360px',border:'1px solid #7c3aed'}}>
            <h3 style={{color:'#fff',marginBottom:'16px'}}>💬 Admin ko Request Bhejo</h3>
            <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
              <button onClick={() => setRequestType('habit')} style={{flex:1,padding:'8px',background:requestType==='habit'?themeColor:'rgba(255,255,255,0.1)',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontSize:'13px'}}>🎯 Habit Request</button>
              <button onClick={() => setRequestType('suggestion')} style={{flex:1,padding:'8px',background:requestType==='suggestion'?themeColor:'rgba(255,255,255,0.1)',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontSize:'13px'}}>💡 Suggestion</button>
            </div>
            <textarea
              placeholder={requestType==='habit'?'Kaunsi habit add karwana chahte ho?':'Kya suggestion hai?'}
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
              rows={4}
              style={{width:'100%',padding:'12px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',color:'#fff',fontSize:'14px',boxSizing:'border-box',resize:'none',marginBottom:'12px'}}
            />
            {requestSent && <p style={{color:'#059669',textAlign:'center',marginBottom:'8px'}}>✅ Request bhej di!</p>}
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setShowRequest(false)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'10px',color:'#fff',cursor:'pointer'}}>Cancel</button>
              <button onClick={sendRequest} style={{flex:1,padding:'10px',background:themeColor,border:'none',borderRadius:'10px',color:'#fff',cursor:'pointer',fontWeight:'bold'}}>Send 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}