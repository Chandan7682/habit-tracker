import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import './App.css';

const ADMIN_EMAIL = 'chandankumar768208@gmail.com';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasHabits, setHasHabits] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (docSnap.exists() && docSnap.data().habits?.length > 0) {
          setHasHabits(true);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0f0f1a',color:'#fff',fontSize:'24px'}}>⚡ Loading...</div>
  );

  if (!user) return <Login />;

  return (
    <>
      {user.email === ADMIN_EMAIL && (
        <button onClick={() => setShowAdmin(true)} style={{position:'fixed',bottom:'20px',right:'20px',background:'#7c3aed',border:'none',borderRadius:'50%',width:'50px',height:'50px',color:'#fff',fontSize:'20px',cursor:'pointer',zIndex:999,boxShadow:'0 0 20px rgba(124,58,237,0.5)'}}>
          🛠️
        </button>
      )}
      {showAdmin && <Admin user={user} setShowAdmin={setShowAdmin} />}
      {!hasHabits
        ? <Onboarding user={user} setHasHabits={setHasHabits} />
        : <Dashboard user={user} />
      }
    </>
  );
}