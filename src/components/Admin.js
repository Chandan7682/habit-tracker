import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'chandankumar768208@gmail.com';

export default function Admin({ user, setShowAdmin }) {
  const [tab, setTab] = useState('habits');
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⭐', xp: 10 });
  const [quote, setQuote] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [xpPerLevel, setXpPerLevel] = useState(1000);
  const [appName, setAppName] = useState('HabitQuest');
  const [themeColor, setThemeColor] = useState('#7c3aed');
  const [saved, setSaved] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const habitSnap = await getDoc(doc(db, 'admin', 'habits'));
    if (habitSnap.exists()) setHabits(habitSnap.data().list || []);

    const settingsSnap = await getDoc(doc(db, 'admin', 'settings'));
    if (settingsSnap.exists()) {
      const s = settingsSnap.data();
      setQuote(s.quote || '');
      setAnnouncement(s.announcement || '');
      setXpPerLevel(s.xpPerLevel || 1000);
      setAppName(s.appName || 'HabitQuest');
      setThemeColor(s.themeColor || '#7c3aed');
    }

    const usersSnap = await getDocs(collection(db, 'users'));
    const usersList = [];
    usersSnap.forEach(d => usersList.push({ id: d.id, ...d.data() }));
    setUsers(usersList);

    const reqSnap = await getDocs(collection(db, 'requests'));
    const reqList = [];
    reqSnap.forEach(d => reqList.push({ id: d.id, ...d.data() }));
    setRequests(reqList.sort((a,b) => b.createdAt - a.createdAt));
  };

  const saveHabits = async () => {
    await setDoc(doc(db, 'admin', 'habits'), { list: habits });
    showSaved('Habits saved!');
  };

  const saveSettings = async () => {
    await setDoc(doc(db, 'admin', 'settings'), {
      quote, announcement, xpPerLevel, appName, themeColor
    });
    showSaved('Settings saved!');
  };

  const approveRequest = async (req) => {
    const newHabitFromReq = { id: Date.now(), name: req.habitName, icon: '⭐', xp: 10 };
    const updatedHabits = [...habits, newHabitFromReq];
    setHabits(updatedHabits);
    await setDoc(doc(db, 'admin', 'habits'), { list: updatedHabits });
    await updateDoc(doc(db, 'requests', req.id), { status: 'approved' });
    setRequests(prev => prev.map(r => r.id === req.id ? {...r, status:'approved'} : r));
    showSaved('Approved!');
  };

  const rejectRequest = async (req) => {
    await updateDoc(doc(db, 'requests', req.id), { status: 'rejected' });
    setRequests(prev => prev.map(r => r.id === req.id ? {...r, status:'rejected'} : r));
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    setHabits([...habits, { ...newHabit, id: Date.now() }]);
    setNewHabit({ name: '', icon: '⭐', xp: 10 });
  };

  const removeHabit = (id) => setHabits(habits.filter(h => h.id !== id));

  const showSaved = (msg) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2000);
  };

  if (user.email !== ADMIN_EMAIL) return null;

  const tabs = [
    { id: 'habits', label: '🎯 Habits' },
    { id: 'settings', label: '⚙️ Settings' },
    { id: 'users', label: '👥 Users' },
    { id: 'requests', label: `💬 Requests ${requests.filter(r=>!r.status).length > 0 ? `(${requests.filter(r=>!r.status).length})` : ''}` },
    { id: 'analytics', label: '📊 Analytics' },
  ];

  const topUsers = [...users].sort((a,b) => (b.totalXP||0) - (a.totalXP||0)).slice(0,10);
  const popularHabits = {};
  users.forEach(u => (u.habits||[]).forEach(h => {
    popularHabits[h.name] = (popularHabits[h.name] || 0) + 1;
  }));
  const sortedHabits = Object.entries(popularHabits).sort((a,b) => b[1]-a[1]).slice(0,5);

  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'20px'}}>
      <div style={{background:'#1a1a2e',borderRadius:'20px',width:'480px',maxHeight:'90vh',overflow:'hidden',border:'1px solid #7c3aed',display:'flex',flexDirection:'column'}}>

        <div style={{padding:'20px',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{color:'#fff',margin:0}}>🛠️ Admin Panel</h2>
          <button onClick={() => setShowAdmin(false)} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',padding:'8px 14px',borderRadius:'10px',cursor:'pointer'}}>✕</button>
        </div>

        <div style={{display:'flex',gap:'4px',padding:'12px',borderBottom:'1px solid rgba(255,255,255,0.1)',overflowX:'auto'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'8px 12px',background:tab===t.id?'#7c3aed':'rgba(255,255,255,0.07)',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontSize:'12px',whiteSpace:'nowrap'}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:'20px',overflowY:'auto',flex:1}}>
          {saved && (
            <div style={{background:'#059669',borderRadius:'10px',padding:'10px',textAlign:'center',color:'#fff',marginBottom:'12px',fontSize:'14px'}}>
              ✅ {saved}
            </div>
          )}

          {tab === 'habits' && (
            <>
              <h3 style={{color:'#aaa',fontSize:'13px',marginBottom:'10px'}}>Current Habits ({habits.length})</h3>
              {habits.map(h => (
                <div key={h.id} style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.05)',borderRadius:'10px',padding:'10px',marginBottom:'8px'}}>
                  <span style={{fontSize:'20px'}}>{h.icon}</span>
                  <span style={{flex:1,color:'#fff',fontSize:'14px'}}>{h.name}</span>
                  <span style={{color:'#a78bfa',fontSize:'12px'}}>+{h.xp} XP</span>
                  <button onClick={() => removeHabit(h.id)} style={{background:'#ff4444',border:'none',borderRadius:'6px',color:'#fff',padding:'4px 8px',cursor:'pointer'}}>×</button>
                </div>
              ))}
              <div style={{marginTop:'16px',padding:'14px',background:'rgba(255,255,255,0.03)',borderRadius:'12px',border:'1px dashed rgba(255,255,255,0.1)'}}>
                <input placeholder="Habit name" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px',marginBottom:'8px',boxSizing:'border-box'}}/>
                <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                  <input placeholder="Icon" value={newHabit.icon} onChange={e => setNewHabit({...newHabit, icon: e.target.value})} style={{width:'70px',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px'}}/>
                  <input type="number" placeholder="XP" value={newHabit.xp} onChange={e => setNewHabit({...newHabit, xp: parseInt(e.target.value)||10})} style={{width:'70px',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px'}}/>
                  <button onClick={addHabit} style={{flex:1,padding:'10px',background:'#7c3aed',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontWeight:'bold'}}>+ Add</button>
                </div>
              </div>
              <button onClick={saveHabits} style={{width:'100%',padding:'12px',background:'linear-gradient(90deg,#7c3aed,#4f46e5)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'15px',cursor:'pointer',fontWeight:'bold',marginTop:'12px'}}>
                💾 Save Habits
              </button>
            </>
          )}

          {tab === 'settings' && (
            <>
              <div style={{marginBottom:'14px'}}>
                <p style={{color:'#aaa',fontSize:'12px',marginBottom:'6px'}}>App Name</p>
                <input value={appName} onChange={e => setAppName(e.target.value)} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px',boxSizing:'border-box'}}/>
              </div>
              <div style={{marginBottom:'14px'}}>
                <p style={{color:'#aaa',fontSize:'12px',marginBottom:'6px'}}>Daily Quote</p>
                <textarea value={quote} onChange={e => setQuote(e.target.value)} rows={3} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px',boxSizing:'border-box',resize:'none'}}/>
              </div>
              <div style={{marginBottom:'14px'}}>
                <p style={{color:'#aaa',fontSize:'12px',marginBottom:'6px'}}>Announcement</p>
                <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px',boxSizing:'border-box',resize:'none'}}/>
              </div>
              <div style={{marginBottom:'14px'}}>
                <p style={{color:'#aaa',fontSize:'12px',marginBottom:'6px'}}>XP per Level</p>
                <input type="number" value={xpPerLevel} onChange={e => setXpPerLevel(parseInt(e.target.value)||1000)} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',color:'#fff',fontSize:'14px',boxSizing:'border-box'}}/>
              </div>
              <div style={{marginBottom:'14px'}}>
                <p style={{color:'#aaa',fontSize:'12px',marginBottom:'6px'}}>Theme Color</p>
                <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                  <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{width:'50px',height:'40px',border:'none',borderRadius:'8px',cursor:'pointer'}}/>
                  <span style={{color:'#fff',fontSize:'14px'}}>{themeColor}</span>
                </div>
              </div>
              <button onClick={saveSettings} style={{width:'100%',padding:'12px',background:'linear-gradient(90deg,#7c3aed,#4f46e5)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'15px',cursor:'pointer',fontWeight:'bold'}}>
                💾 Save Settings
              </button>
            </>
          )}

          {tab === 'users' && (
            <>
              <p style={{color:'#aaa',fontSize:'13px',marginBottom:'12px'}}>Total Users: {users.length}</p>
              <h3 style={{color:'#aaa',fontSize:'13px',marginBottom:'8px'}}>🏆 Leaderboard</h3>
              {topUsers.map((u,i) => (
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.05)',borderRadius:'10px',padding:'12px',marginBottom:'8px'}}>
                  <span style={{color:'#a78bfa',fontWeight:'bold',width:'20px'}}>#{i+1}</span>
                  <div style={{flex:1}}>
                    <p style={{color:'#fff',margin:0,fontSize:'13px'}}>{u.id.slice(0,20)}...</p>
                    <p style={{color:'#aaa',margin:0,fontSize:'11px'}}>Level {u.level||1} • Streak {u.streak||0}🔥</p>
                  </div>
                  <span style={{color:'#a78bfa',fontSize:'13px',fontWeight:'bold'}}>{u.totalXP||0} XP</span>
                </div>
              ))}
            </>
          )}

          {tab === 'requests' && (
            <>
              <p style={{color:'#aaa',fontSize:'13px',marginBottom:'12px'}}>User Requests ({requests.length})</p>
              {requests.length === 0 && (
                <p style={{color:'#555',textAlign:'center',padding:'20px'}}>Koi request nahi abhi</p>
              )}
              {requests.map(req => (
                <div key={req.id} style={{background:'rgba(255,255,255,0.05)',borderRadius:'10px',padding:'14px',marginBottom:'10px',border:`1px solid ${req.status==='approved'?'#059669':req.status==='rejected'?'#ff4444':'rgba(255,255,255,0.1)'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                    <span style={{color:'#fff',fontWeight:'bold',fontSize:'14px'}}>{req.type==='habit'?'🎯 Habit Request':'💬 Suggestion'}</span>
                    <span style={{color:req.status==='approved'?'#059669':req.status==='rejected'?'#ff4444':'#aaa',fontSize:'12px'}}>{req.status||'Pending'}</span>
                  </div>
                  <p style={{color:'#ccc',fontSize:'13px',margin:'0 0 6px'}}>{req.habitName||req.message}</p>
                  <p style={{color:'#555',fontSize:'11px',margin:'0 0 10px'}}>User: {req.userId?.slice(0,20)}...</p>
                  {!req.status && (
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={() => approveRequest(req)} style={{flex:1,padding:'8px',background:'#059669',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontSize:'13px'}}>✅ Approve</button>
                      <button onClick={() => rejectRequest(req)} style={{flex:1,padding:'8px',background:'#ff4444',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontSize:'13px'}}>❌ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {tab === 'analytics' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
                {[
                  {label:'Total Users',value:users.length,icon:'👥'},
                  {label:'Total XP',value:users.reduce((s,u)=>s+(u.totalXP||0),0),icon:'⚡'},
                  {label:'Avg Level',value:users.length>0?Math.round(users.reduce((s,u)=>s+(u.level||1),0)/users.length):0,icon:'🏆'},
                  {label:'Avg Streak',value:users.length>0?Math.round(users.reduce((s,u)=>s+(u.streak||0),0)/users.length):0,icon:'🔥'},
                ].map((s,i) => (
                  <div key={i} style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'14px',textAlign:'center',border:'1px solid rgba(255,255,255,0.1)'}}>
                    <div style={{fontSize:'24px'}}>{s.icon}</div>
                    <div style={{color:'#a78bfa',fontWeight:'bold',fontSize:'20px'}}>{s.value}</div>
                    <div style={{color:'#aaa',fontSize:'11px'}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <h3 style={{color:'#aaa',fontSize:'13px',marginBottom:'8px'}}>🎯 Popular Habits</h3>
              {sortedHabits.map(([name,count],i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                  <span style={{color:'#a78bfa',width:'20px',fontSize:'13px'}}>#{i+1}</span>
                  <span style={{flex:1,color:'#fff',fontSize:'13px'}}>{name}</span>
                  <span style={{color:'#aaa',fontSize:'12px'}}>{count} users</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}