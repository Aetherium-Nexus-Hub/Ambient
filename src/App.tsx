import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Terminal, Monitor, Film, Database, 
  Activity, Shield, Zap, Search, BookOpen, Layers,
  Dna, Cpu, AlertTriangle, RefreshCcw, ArrowRight, Send, CheckCircle2,
  Crosshair, Disc, Radio, Box, Clock, Youtube, ExternalLink, Play, Users, Eye,
  Lock, Wifi, Globe, Command, ChevronRight, Binary, Download, Package, 
  Settings, User, MapPin, TrendingUp, Info, LayoutGrid
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json';

// --- CONFIGURATION ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);
const appId = 'animus-nexus-v4';

// Gemini AI Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL_NAME = 'gemini-3-flash-preview';
const TTS_MODEL_NAME = 'gemini-3.1-flash-tts-preview';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'artifacts', appId, 'public', 'connectivity'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [activeTab, setActiveTab] = useState('vision');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [vaultItems, setVaultItems] = useState<any[]>([]);

  const [visionState, setVisionState] = useState({ 
    district: "WATSON_DISTRICT", 
    action: "Memory Stream Active", 
    active: true,
    image: null,
    coherence: 0.96,
    loot_detected: "LEGENDARY_COMPONENT_X1",
    sequence: "01",
    fragment_id: "MEM_FRAG_882",
    sync_status: "SYNCHRONIZED"
  });

  useEffect(() => {
    testConnection();
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    const glitchTimer = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 150);
      }
    }, 2000);
    return () => { clearInterval(timer); clearInterval(glitchTimer); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login Failure:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout Failure:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const visionPath = `artifacts/${appId}/public/data/vision_node/current_state`;
    const visionRef = doc(db, visionPath);
    const unsubVision = onSnapshot(visionRef, (docSnap) => {
      if (docSnap.exists()) setVisionState(prev => ({ ...prev, ...docSnap.data() }));
    }, (err) => handleFirestoreError(err, OperationType.GET, visionPath));

    const vaultPath = `artifacts/${appId}/users/${user.uid}/vault`;
    const vaultRef = collection(db, vaultPath);
    const unsubVault = onSnapshot(vaultRef, (s) => {
      setVaultItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, vaultPath));

    const msgPath = `artifacts/${appId}/users/${user.uid}/messages`;
    const msgQuery = query(collection(db, msgPath), orderBy('timestamp', 'asc'));
    const unsubMsg = onSnapshot(msgQuery, (s) => {
      setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, msgPath));

    return () => { unsubVision(); unsubVault(); unsubMsg(); };
  }, [user]);

  const handleExtraction = async () => {
    if (isExtracting || !visionState.loot_detected || !user) return;
    setIsExtracting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setExtractProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        finalizeExtraction();
      }
    }, 50);
  };

  const finalizeExtraction = async () => {
    if (!user) return;
    const newItem = {
      name: visionState.loot_detected,
      district: visionState.district,
      fragment: visionState.fragment_id,
      sync_integrity: 98.4,
      timestamp: Date.now()
    };
    
    const vaultPath = `artifacts/${appId}/users/${user.uid}/vault`;
    const msgPath = `artifacts/${appId}/users/${user.uid}/messages`;

    try {
      await addDoc(collection(db, vaultPath), newItem);
      await addDoc(collection(db, msgPath), {
        role: 'system',
        text: `LOG: Genetic fragment [${newItem.name}] successfully localized in private cluster.`,
        timestamp: Date.now(),
        type: 'extraction_success'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, vaultPath);
    } finally {
      setIsExtracting(false);
      setExtractProgress(0);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || isAiTyping) return;

    const text = inputText;
    setInputText('');
    const msgPath = `artifacts/${appId}/users/${user.uid}/messages`;

    try {
      await addDoc(collection(db, msgPath), {
        role: 'user',
        text,
        timestamp: Date.now(),
        context: visionState.district
      });

      setIsAiTyping(true);
      
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));
      history.push({ role: 'user', parts: [{ text }] });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: history,
        config: {
          systemInstruction: `You are the Animus 4.0 // Nexus AI. 
          Current Context: ${visionState.district}
          Subject Sync: ${visionState.coherence * 100}%
          Persona: High-tech, cold, analytical but helpful agent. You assist psytrance DJs and producers with "memory extraction" and set planning.
          Be brief and stay in character.`,
        },
      });

      const aiText = response.text || "Synchronicity error.";

      await addDoc(collection(db, msgPath), {
        role: 'ai',
        text: aiText,
        timestamp: Date.now(),
        context: visionState.district
      });

    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, msgPath);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Reusable CSS classes for clickable highlighting
  const clickableStyle = "cursor-pointer transition-all duration-200 hover:ring-1 hover:ring-[#00D4FF] hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] active:scale-95 active:shadow-[0_0_5px_rgba(0,212,255,0.8)]";
  const navButtonStyle = "flex flex-col items-center gap-1.5 transition-all group w-20 shrink-0 relative py-2";

  if (!user) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen bg-[#020406] text-[#A0D4FF] font-sans transition-all duration-75 ${isGlitching ? 'skew-x-1 opacity-80' : ''}`}>
        <div className="fixed top-0 left-0 w-full h-[1px] bg-[#00D4FF]/30 shadow-[0_0_15px_#00D4FF] z-[201] animate-[scan_8s_linear_infinite]" />
        
        <div className="max-w-md w-full p-8 border border-[#00D4FF]/20 bg-black/40 backdrop-blur-xl space-y-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 to-transparent pointer-events-none" />
          
          <Dna className="w-16 h-16 text-[#00D4FF] mx-auto animate-pulse" />
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Aetherium</h1>
            <p className="text-[8px] font-mono text-[#00D4FF]/60 uppercase tracking-[1em]">Identity Firewall Active</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              UNAUTHORIZED ACCESS DETECTED. PLEASE INITIALIZE NEURAL LINK VIA BIOMETRIC GATEWAY.
            </p>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-[#00D4FF]/10 border border-[#00D4FF]/40 hover:bg-[#00D4FF] hover:text-black transition-all font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 group"
          >
            <Shield className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Initialize Link
          </button>
        </div>

        <p className="fixed bottom-8 text-[7px] font-mono text-slate-700 tracking-[0.5em] uppercase">Abstergo Cloud Services // Secure Entry v4.0</p>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scan {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-[#020406] text-[#A0D4FF] font-sans overflow-hidden transition-all duration-75 ${isGlitching ? 'skew-x-1 opacity-80' : ''}`}>
      
      {/* HUD SCANLINES */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[200] border-[16px] border-[#00D4FF]/5" />
      <div className="fixed top-0 left-0 w-full h-[1px] bg-[#00D4FF]/30 shadow-[0_0_15px_#00D4FF] z-[201] animate-[scan_8s_linear_infinite]" />

      {/* HEADER SECTION: Core Identity */}
      <header className="h-16 shrink-0 border-b border-[#00D4FF]/10 flex items-center justify-between px-6 lg:px-10 bg-black/95 z-[150]">
        <div className="flex items-center gap-6">
          <Dna className={`w-5 h-5 text-[#00D4FF] ${isExtracting ? 'animate-spin' : 'animate-pulse'}`} />
          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Animus 4.0 // Nexus</h1>
            <p className="text-[7px] font-mono text-[#00D4FF]/60 uppercase tracking-widest mt-0.5">Coherence: {(visionState.coherence * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Network</span>
              <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-1.5"><Wifi className="w-2 h-2" /> ENCRYPTED</span>
           </div>
           {user && (
             <button onClick={handleLogout} className="p-2 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all rounded group">
               <Settings className="w-3 h-3 text-slate-400 group-hover:text-red-400" />
             </button>
           )}
           <div className="text-right">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Subject_Time</span>
              <p className="text-[11px] font-mono text-white tracking-tighter">{currentTime}</p>
           </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: System Vitals & Stats */}
        <aside className="w-16 lg:w-64 border-r border-[#00D4FF]/10 flex flex-col bg-black/40 overflow-hidden">
           <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <Activity className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">System Vitals</span>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 lg:px-4 space-y-4">
              {[
                { label: 'Bitrate', val: '6.2 MBPS', icon: Wifi, color: 'text-emerald-500' },
                { label: 'Latency', val: '18MS', icon: Radio, color: 'text-[#00D4FF]' },
                { label: 'Sync Buffer', val: isExtracting ? '94%' : '12%', icon: Cpu, color: isExtracting ? 'text-amber-500' : 'text-slate-600' },
                { label: 'Security', val: 'ALPHA_LEVEL', icon: Shield, color: 'text-emerald-500' },
                { label: 'Load', val: '24%', icon: Zap, color: 'text-amber-400' }
              ].map((stat, i) => (
                <div key={i} className={`p-3 bg-white/[0.02] border border-white/5 group ${clickableStyle}`}>
                   <div className="flex items-center gap-3 mb-1">
                      <stat.icon className={`w-3 h-3 ${stat.color}`} />
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest hidden lg:block">{stat.label}</span>
                   </div>
                   <p className="text-[10px] font-mono text-white tracking-widest text-center lg:text-left">{stat.val}</p>
                </div>
              ))}
           </div>
           
           <div className="p-4 border-t border-white/5 bg-black/60 hidden lg:block">
              <div className="flex items-center gap-3 mb-2">
                 <Users className="w-3 h-3 text-slate-600" />
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Active Observers</span>
              </div>
              <p className="text-lg font-mono text-white">12,408</p>
           </div>
        </aside>

        {/* CENTER SECTION */}
        <main className="flex-1 flex flex-col bg-[#05080a] relative overflow-hidden">
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
            {activeTab === 'vision' ? (
              <div className="max-w-5xl mx-auto space-y-6">
                 {/* CINEMATIC FEED WIDGET */}
                 <div className="relative group rounded-sm overflow-hidden border border-[#00D4FF]/20 bg-black shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                    <div className="aspect-video relative overflow-hidden">
                       <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none" />
                       
                       {visionState.image ? (
                         <img src={`data:image/jpeg;base64,${visionState.image}`} className="w-full h-full object-cover transition-all duration-1000 grayscale-[0.2] group-hover:grayscale-0" alt="Animus Feed" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-slate-950">
                            <Binary className="w-12 h-12 text-[#00D4FF]/10 animate-pulse" />
                            <p className="text-[8px] font-black uppercase tracking-[1em] text-[#00D4FF]/20">Awaiting Memory Link...</p>
                         </div>
                       )}

                       {/* INTEGRATED HUD OVERLAYS */}
                       <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20 pointer-events-none">
                          <div className={`p-4 bg-black/60 backdrop-blur-md border-l-2 border-[#00D4FF] pointer-events-auto ${clickableStyle}`}>
                             <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-3 h-3 text-[#00D4FF]" />
                                <span className="text-[7px] font-black text-[#00D4FF] uppercase tracking-widest">Memory_Region</span>
                             </div>
                             <p className="text-xs font-mono text-white tracking-[0.2em]">{visionState.district}</p>
                          </div>
                          <div className={`p-4 bg-black/60 backdrop-blur-md border-r-2 border-white/30 text-right pointer-events-auto ${clickableStyle}`}>
                             <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Seq_Index</span>
                             <span className="text-xl font-mono text-white leading-none">{visionState.sequence}</span>
                          </div>
                       </div>

                       {/* EXTRACTION WIDGET (CONTEXTUAL) */}
                       {visionState.loot_detected && (
                          <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
                             <div className={`flex items-center gap-4 p-4 border transition-all duration-500 ${isExtracting ? 'bg-[#00D4FF]/20 border-[#00D4FF] scale-105' : 'bg-black/80 border-amber-500/50 hover:border-amber-500'}`}>
                                <div className={`p-2 rounded-full ${isExtracting ? 'bg-[#00D4FF]/20' : 'bg-amber-500/10'}`}>
                                   <Package className={`w-4 h-4 ${isExtracting ? 'text-[#00D4FF] animate-bounce' : 'text-amber-500'}`} />
                                </div>
                                <div>
                                   <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Frag_Detected</p>
                                   <p className="text-[10px] font-mono text-white uppercase truncate max-w-[150px]">{visionState.loot_detected}</p>
                                </div>
                                {!isExtracting && (
                                   <button onClick={handleExtraction} className={`ml-4 p-2 bg-white/5 text-[#00D4FF] border border-[#00D4FF]/20 ${clickableStyle} hover:bg-[#00D4FF] hover:text-black`}>
                                      <Download className="w-4 h-4" />
                                   </button>
                                )}
                             </div>
                          </div>
                       )}

                       {isExtracting && (
                         <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center">
                            <div className="w-64 space-y-4">
                               <div className="flex justify-between items-end">
                                  <span className="text-[8px] font-black text-[#00D4FF] uppercase tracking-widest">Synchronizing Stream</span>
                                  <span className="text-sm font-mono text-white">{extractProgress}%</span>
                               </div>
                               <div className="h-[2px] bg-white/5 w-full relative">
                                  <div className="absolute h-full bg-[#00D4FF] shadow-[0_0_15px_#00D4FF] transition-all" style={{ width: `${extractProgress}%` }} />
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* DESCRIPTIVE WIDGET */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#080C10] border border-white/5 p-6">
                       <div className="flex items-center gap-3 mb-4">
                          <Info className="w-4 h-4 text-[#00D4FF]" />
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">Memory Context</span>
                       </div>
                       <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          Current genetic sequence corresponds to historical activities within the <span className="text-white">{visionState.district}</span>. 
                          The Animus is maintaining a stable coherence of <span className="text-emerald-500">{(visionState.coherence * 100).toFixed(1)}%</span>.
                       </p>
                       <div className="flex gap-4">
                          <span className={`text-[8px] font-mono text-[#00D4FF] border border-[#00D4FF]/20 px-2 py-1 ${clickableStyle}`}>PHASE_01: ACTIVE</span>
                          <span className={`text-[8px] font-mono text-slate-600 border border-white/10 px-2 py-1 ${clickableStyle}`}>PHASE_02: LOCKED</span>
                       </div>
                    </div>
                    <div className={`bg-[#080C10] border border-white/5 p-6 flex flex-col justify-center items-center ${clickableStyle}`}>
                       <Globe className="w-8 h-8 text-slate-800 mb-3" />
                       <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Regional Mapping</p>
                       <p className="text-xs font-mono text-white mt-2">GEO_CALIBRATION_PENDING</p>
                    </div>
                 </div>
              </div>
            ) : activeTab === 'chat' ? (
              <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center gap-4 text-slate-600 mb-8 pb-4 border-b border-white/5">
                   <Terminal className="w-4 h-4" />
                   <span className="text-[9px] font-black uppercase tracking-[0.5em]">Session Telemetry Log</span>
                </div>
                {messages.map((m, i) => (
                   <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-8 py-6 border transition-all ${
                        m.role === 'user' 
                          ? 'bg-[#00D4FF]/5 border-[#00D4FF]/20 text-white' 
                          : m.type === 'extraction_success'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-mono'
                          : 'bg-[#080C10] border-white/5 text-slate-300'
                      }`}>
                         <p className="text-sm leading-relaxed">{m.text}</p>
                         <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-20 text-[7px] font-mono uppercase tracking-[0.4em]">
                           <span>{m.context || 'NULL'}</span>
                           <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                         </div>
                      </div>
                   </div>
                ))}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#080C10] border border-white/5 px-8 py-6 text-slate-500 italic animate-pulse">
                      Analyzing stream...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20 flex-col space-y-4">
                 <LayoutGrid className="w-12 h-12" />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em]">Module Under Calibration</p>
              </div>
            )}
          </div>

          {/* CHAT INPUT */}
          {activeTab === 'chat' && (
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
               <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto group">
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="TRANSMIT TO CLOUD_CLUSTER..."
                    className="w-full bg-black border border-[#00D4FF]/20 px-8 py-5 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50 tracking-widest transition-all"
                  />
                  <button type="submit" disabled={isAiTyping} className={`absolute right-6 top-1/2 -translate-y-1/2 text-[#00D4FF]/40 hover:text-[#00D4FF] p-2 ${clickableStyle} border-none shadow-none ring-0`}>
                    <Send className="w-5 h-5" />
                  </button>
               </form>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: Local Vault */}
        <aside className="w-16 lg:w-72 border-l border-[#00D4FF]/10 flex flex-col bg-black/20">
           <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                 <Database className="w-4 h-4 text-[#00D4FF] shrink-0" />
                 <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block whitespace-nowrap">Local Vault</span>
              </div>
              <span className="text-[8px] font-mono text-slate-600 hidden lg:block">{vaultItems.length} SEC</span>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-2 lg:p-4 space-y-3">
              {vaultItems.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-5">
                   <Package className="w-12 h-12" />
                </div>
              ) : (
                vaultItems.map((item, i) => (
                   <div key={i} className={`bg-white/[0.03] border border-white/5 p-3 group ${clickableStyle}`}>
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[9px] font-black text-white truncate group-hover:text-[#00D4FF]">{item.name}</span>
                         <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-[6px] font-mono text-slate-600 uppercase hidden lg:block">{item.district}</p>
                   </div>
                ))
              )}
           </div>
        </aside>

      </div>

      {/* FOOTER NAVIGATION */}
      <nav className="h-20 shrink-0 bg-black border-t border-[#00D4FF]/10 z-[160] overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-start lg:justify-center h-full min-w-max px-8 gap-8 lg:gap-20">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Telemetry' },
            { id: 'vision', icon: Monitor, label: 'Aether Link' },
            { id: 'codex', icon: BookOpen, label: 'Codex' },
            { id: 'nodes', icon: Layers, label: 'Clusters' },
            { id: 'map', icon: MapPin, label: 'GeoGrid' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`${navButtonStyle} ${activeTab === t.id ? 'text-[#00D4FF]' : 'text-slate-700 hover:text-slate-400'}`}
            >
              <t.icon className={`w-4 h-4 transition-transform ${activeTab === t.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{t.label}</span>
              {activeTab === t.id && (
                <div className="absolute inset-0 border border-[#00D4FF]/30 shadow-[inset_0_0_10px_rgba(0,212,255,0.1)] rounded-sm pointer-events-none" />
              )}
              {activeTab === t.id && (
                <div className="w-4 h-[2px] bg-[#00D4FF] shadow-[0_0_10px_#00D4FF] mt-1" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, 0.3); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

