import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const HABIT_LIBRARY = [
  { id: 1, name: 'Exercise', icon: '💪', category: 'Health', xp: 20 },
  { id: 2, name: 'Study', icon: '📚', category: 'Mind', xp: 20 },
  { id: 3, name: 'Drink 2L Water', icon: '💧', category: 'Health', xp: 10 },
  { id: 4, name: 'Meditation', icon: '🧘', category: 'Mind', xp: 15 },
  { id: 5, name: 'Read Book', icon: '📖', category: 'Mind', xp: 15 },
  { id: 6, name: 'Sleep 8hrs', icon: '😴', category: 'Health', xp: 10 },
  { id: 7, name: 'No Junk Food', icon: '🥗', category: 'Health', xp: 15 },
  { id: 8, name: 'Walk 30min', icon: '🚶', category: 'Health', xp: 10 },
  { id: 9, name: 'Journal', icon: '✍️', category: 'Mind', xp: 10 },
  { id: 10, name: 'Cold Shower', icon: '🚿', category: 'Health', xp: 10 },
];

export default function Onboarding({ user, setHasHabits }) {
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [customHabits, setCustomHabits] = useState([]);
  const [adminHabits, setAdminHabits] = useState([]);

  useEffect(() => {
    loadAdminHabits();
  }, []);

  const loadAdminHabits = async () => {
    const docSnap = await getDoc(doc(db, 'admin', 'habits'));
    if (docSnap.exists()) {
      setAdminHabits(docSnap.data().list || []);
    }
  };

  const toggleHabit = (habit) => {
    const exists = selected.find(h => h.id === habit.id);
    if (exists) {
      setSelected(selected.filter(h => h.id !== habit.id));
    } else {
      setSelected([...selected, habit]);
    }
  };

  const addCustom = () => {
    if (custom.trim() === '') return;
    const newHabit = { id: Date.now(), name: custom, icon: '⭐', category: 'Custom', xp: 10 };
    setCustomHabits([...customHabits, newHabit]);
    setCustom('');
  };

  const saveHabits = async () => {
    const allHabits = [...selected, ...customHabits];
    if (allHabits.length === 0) return;
    await setDoc(doc(db, 'users', user.uid), {
      habits: allHabits,
      xp: 0,
      level: 1,
      streak: 0,
      lastCompleted: null,
      weeklyData: [0, 0, 0, 0, 0, 0, 0],
      createdAt: new Date()
    });
    setHasHabits(true);
  };

  const allLibrary = [...HABIT_LIBRARY, ...adminHabits];

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0f1a,#1a1a2e)',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'Arial',padding:'20px'}}>
      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'20px',padding:'30px',width:'420px',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 0 40px rgba(100,0,255,0.3)'}}>
        <h1 style={{color:'#fff',textAlign:'center',marginBottom:'5px'}}>🎯 Setup Your Quest</h1>
        <p style={{color:'#aaa',textAlign:'center',marginBottom:'20px'}}>Apni daily habits choose karo</p>

        <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginBottom:'20px'}}>
          {allLibrary.map(habit => (
            <div key={habit.id} onClick={() => toggleHabit(habit)} style={{
              padding:'10px 14px',borderRadius:'12px',cursor:'pointer',
              background: selected.find(h=>h.id===habit.id) ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.07)',
              border: selected.find(h=>h.id===habit.id) ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
              color:'#fff',fontSize:'14px',transition:'all 0.2s'
            }}>
              {habit.icon} {habit.name}
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
          <input
            placeholder="Custom habit add karo..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            style={{flex:1,padding:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',color:'#fff',fontSize:'14px'}}
          />
          <button onClick={addCustom} style={{padding:'10px 16px',background:'#7c3aed',border:'none',borderRadius:'10px',color:'#fff',cursor:'pointer',fontSize:'18px'}}>+</button>
        </div>

        {customHabits.length > 0 && (
          <div style={{marginBottom:'16px'}}>
            {customHabits.map(h => (
              <span key={h.id} style={{display:'inline-block',padding:'6px 12px',margin:'4px',background:'rgba(6,182,212,0.2)',border:'1px solid #06b6d4',borderRadius:'10px',color:'#fff',fontSize:'13px'}}>
                ⭐ {h.name}
              </span>
            ))}
          </div>
        )}

        <p style={{color:'#aaa',fontSize:'13px',textAlign:'center',marginBottom:'16px'}}>
          {selected.length + customHabits.length} habits selected
        </p>

        <button onClick={saveHabits} style={{width:'100%',padding:'14px',background:'linear-gradient(90deg,#7c3aed,#4f46e5)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'18px',cursor:'pointer',fontWeight:'bold'}}>
          🚀 Start My Journey!
        </button>
      </div>
    </div>
  );
}