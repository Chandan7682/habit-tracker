import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

export default function Login() {
  const [mode, setMode] = useState('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch(e) { setError(e.message); }
  };

  const emailLogin = async () => {
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch(e) { setError(e.message); }
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0f1a,#1a1a2e)',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'Arial'}}>
      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'20px',padding:'40px',width:'350px',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'0 0 40px rgba(100,0,255,0.3)'}}>
        <h1 style={{color:'#fff',textAlign:'center',fontSize:'28px'}}>⚡ HabitQuest</h1>
        <p style={{color:'#aaa',textAlign:'center',marginBottom:'30px'}}>Level up your daily life!</p>
        {error && <p style={{color:'#ff4444',textAlign:'center',fontSize:'12px'}}>{error}</p>}
        {mode === 'main' && (
          <>
            <button onClick={googleLogin} style={{width:'100%',padding:'14px',marginBottom:'12px',background:'#4285f4',color:'#fff',border:'none',borderRadius:'10px',fontSize:'16px',cursor:'pointer'}}>🔵 Login with Google</button>
            <button onClick={() => setMode('email')} style={{width:'100%',padding:'14px',marginBottom:'12px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:'10px',fontSize:'16px',cursor:'pointer'}}>📧 Login with Email</button>
          </>
        )}
        {mode === 'email' && (
          <>
            <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:'12px',marginBottom:'12px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',color:'#fff',fontSize:'16px',boxSizing:'border-box'}}/>
            <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:'12px',marginBottom:'12px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',color:'#fff',fontSize:'16px',boxSizing:'border-box'}}/>
            <button onClick={emailLogin} style={{width:'100%',padding:'14px',marginBottom:'12px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:'10px',fontSize:'16px',cursor:'pointer'}}>{isRegister?'✅ Register':'🔑 Login'}</button>
            <p onClick={()=>setIsRegister(!isRegister)} style={{color:'#aaa',textAlign:'center',cursor:'pointer'}}>{isRegister?'Already have account? Login':'New user? Register'}</p>
            <p onClick={()=>setMode('main')} style={{color:'#aaa',textAlign:'center',cursor:'pointer'}}>← Back</p>
          </>
        )}
      </div>
    </div>
  );
}