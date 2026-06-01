import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Terminal, Monitor, Film, Database, 
  Activity, Shield, Zap, Search, BookOpen, Layers,
  Dna, Cpu, AlertTriangle, RefreshCcw, ArrowRight, Send, CheckCircle2,
  Crosshair, Disc, Radio, Box, Clock, Youtube, ExternalLink, Play, Users, Eye,
  Lock, Wifi, Globe, Command, ChevronRight, Binary, Download, Package, 
  Settings, User, MapPin, TrendingUp, Info, LayoutGrid, Moon, Music, Target,
  Cloud, HardDrive, Trash2, FileText, Upload, Brain
} from 'lucide-react';
import AiLibraryView from './components/AiLibraryView';
import { startGalactusLoop } from './services/galactus-loop';
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
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  const testPath = `artifacts/${appId}/public/connectivity`;
  try {
    await getDocFromServer(doc(db, testPath));
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
  
  // Google Drive State
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveStatusMessage, setDriveStatusMessage] = useState<string | null>(null);
  const [showAllDriveFiles, setShowAllDriveFiles] = useState(false);
  const [driveNoteTitle, setDriveNoteTitle] = useState('Ambient_OS_Log');
  const [driveNoteText, setDriveNoteText] = useState('');

  // Set Planner Tracks State
  const [plannerTracks, setPlannerTracks] = useState<any[]>([
    { id: "t1", title: "Cybernetic Pulse", artist: "Observx", bpm: 128, key: "8A", transition: "Bass Swap" },
    { id: "t2", title: "Neon Grime", artist: "Unknown Code", bpm: 130, key: "8A", transition: "Echo Fade" },
    { id: "t3", title: "Atmospheric Pressure", artist: "Klang", bpm: 135, key: "9A", transition: "High Pass Filter" },
    { id: "t4", title: "Terminal Velocity", artist: "System Override", bpm: 145, key: "9B", transition: "Direct Cut" }
  ]);

  // Set Planner Row Editors State
  const [plannerTitleInput, setPlannerTitleInput] = useState('');
  const [plannerArtistInput, setPlannerArtistInput] = useState('');
  const [plannerBpmInput, setPlannerBpmInput] = useState(130);
  const [plannerKeyInput, setPlannerKeyInput] = useState('8A');
  const [plannerTransitionInput, setPlannerTransitionInput] = useState('Fade');

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

  // Visualizer State
  const [vizBpm, setVizBpm] = useState(145);
  const [vizColor, setVizColor] = useState('#00D4FF');
  const [vizPattern, setVizPattern] = useState('neural'); // neural, geometric, flow
  const [codexSortBy, setCodexSortBy] = useState<'bpm_asc' | 'bpm_desc' | 'key_asc' | 'key_desc'>('bpm_desc');
  const canvasRef = useRef(null);

  useEffect(() => {
    if (activeTab !== 'nodes' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const render = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      time += (vizBpm / 60) / 60; // Sync to BPM

      ctx.fillStyle = 'rgba(2, 4, 6, 0.15)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = vizColor;
      ctx.lineWidth = 1;

      if (vizPattern === 'neural') {
        // Neural Pulse Pattern
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pulse = Math.sin(time * Math.PI * 2) * 0.2 + 0.8;

        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          const angle = (i / 8) * Math.PI * 2 + (time * 0.1);
          const r = 100 * pulse + (i * 20);
          ctx.arc(centerX, centerY, Math.max(0, r), 0, Math.PI * 2);
          ctx.globalAlpha = (1 - (i / 8)) * 0.5;
          ctx.stroke();
        }

        // Particle connections
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + time;
          const x = centerX + Math.cos(angle) * (150 * pulse);
          const y = centerY + Math.sin(angle) * (150 * pulse);
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.globalAlpha = 0.1;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.globalAlpha = 0.8;
          ctx.fill();
        }
      } else if (vizPattern === 'geometric') {
        // Cyber Grid Pattern
        const step = 40;
        const offset = (time * 100) % step;
        ctx.globalAlpha = 0.1;
        
        for (let x = offset; x < canvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = offset; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Central Poly
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        const sides = 6;
        const size = 120 + Math.sin(time * Math.PI * 4) * 10;
        for (let i = 0; i <= sides; i++) {
          const ang = (i / sides) * Math.PI * 2 + time * 0.5;
          const px = canvas.width / 2 + Math.cos(ang) * size;
          const py = canvas.height / 2 + Math.sin(ang) * size;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      } else {
        // High Velocity Flow
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height * (i / 5));
          for (let x = 0; x < canvas.width; x += 10) {
            const y = canvas.height * (i / 5) + Math.sin((x * 0.01) + time * 5 + i) * 30;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTab, vizBpm, vizColor, vizPattern]);

  useEffect(() => {
    testConnection();
    startGalactusLoop();
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
    provider.addScope('https://www.googleapis.com/auth/drive');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setDriveToken(credential.accessToken);
      }
    } catch (e) {
      console.error("Login Failure:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDriveToken(null);
    } catch (e) {
      console.error("Logout Failure:", e);
    }
  };

  const handleConnectDrive = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setDriveToken(credential.accessToken);
        setDriveStatusMessage("OAUTH Bridge Secured - Connection Active.");
        fetchDriveFiles(credential.accessToken);
      } else {
        throw new Error("No Access Token Returned");
      }
    } catch (e) {
      console.error("Drive Authorization Error:", e);
      setDriveStatusMessage("Drive authorization failed. Link rejected.");
    }
  };

  const fetchDriveFiles = async (token = driveToken) => {
    if (!token) return;
    setIsFetchingDrive(true);
    setDriveStatusMessage("Syncing cloud metadata...");
    try {
      // Query criteria
      const queryParam = showAllDriveFiles 
        ? encodeURIComponent("trashed = false")
        : encodeURIComponent("name contains 'Ambient_OS_' and trashed = false");
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${queryParam}&orderBy=modifiedTime desc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Drive response error");
      const data = await res.json();
      setDriveFiles(data.files || []);
      setDriveStatusMessage(null);
    } catch (e) {
      console.error("Fetch Drive Files Error:", e);
      setDriveStatusMessage("Offline state or invalid token context.");
    } finally {
      setIsFetchingDrive(false);
    }
  };

  useEffect(() => {
    if (driveToken && activeTab === 'drive') {
      fetchDriveFiles(driveToken);
    }
  }, [driveToken, activeTab, showAllDriveFiles]);

  const savePlanToDrive = async (filename: string) => {
    if (!driveToken) {
      setDriveStatusMessage("Google Drive access token missing.");
      return;
    }
    setIsUploadingDrive(true);
    setDriveStatusMessage(`Syncing list [${filename}]...`);
    try {
      const name = filename.endsWith('.json') ? filename : `${filename}.json`;
      const metadata = { name, mimeType: 'application/json' };
      const fileContent = JSON.stringify({
        appId,
        timestamp: Date.now(),
        type: 'set_plan',
        tracks: plannerTracks,
        avgBpm: Math.round(plannerTracks.reduce((acc, curr) => acc + (curr.bpm || 0), 0) / (plannerTracks.length || 1))
      }, null, 2);

      const boundary = 'gdrive_upload_boundary_ambient';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${driveToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      });

      if (!res.ok) throw new Error("Multipart raw write failed");
      setDriveStatusMessage("Set Plan successfully backed up to Google Drive!");
      fetchDriveFiles(driveToken);
    } catch (e) {
      console.error(e);
      setDriveStatusMessage("Failed to backup plan to Google Drive.");
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const uploadCustomNote = async () => {
    if (!driveToken) {
      setDriveStatusMessage("Google Drive access token missing.");
      return;
    }
    if (!driveNoteText.trim()) {
      alert("Note content empty.");
      return;
    }
    setIsUploadingDrive(true);
    setDriveStatusMessage(`Uploading log [${driveNoteTitle}]...`);
    try {
      const name = driveNoteTitle.endsWith('.txt') ? driveNoteTitle : `${driveNoteTitle}.txt`;
      const metadata = { name, mimeType: 'text/plain' };

      const boundary = 'gdrive_upload_boundary_ambient';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n' +
        driveNoteText +
        closeDelimiter;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${driveToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
      });

      if (!res.ok) throw new Error("Note upload failed");
      setDriveStatusMessage("Personal note saved securely to Drive!");
      setDriveNoteText('');
      fetchDriveFiles(driveToken);
    } catch (e) {
      console.error(e);
      setDriveStatusMessage("Failed to upload note to Google Drive.");
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const loadPlanFromDrive = async (fileId: string) => {
    if (!driveToken) return;
    setDriveStatusMessage("Fetching sequence file...");
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${driveToken}` }
      });
      if (!res.ok) throw new Error("Alt media fetch rejected");
      const data = await res.json();
      if (data && Array.isArray(data.tracks)) {
        setPlannerTracks(data.tracks);
        setDriveStatusMessage("Sequence loaded and synchronized with central console.");
        setActiveTab('set_planner');
      } else {
        throw new Error("Data schema incompatible");
      }
    } catch (e) {
      console.error(e);
      setDriveStatusMessage("Failed to decode Plan content (non-compatible JSON).");
    }
  };

  const deleteDriveFile = async (fileId: string, filename: string) => {
    const confirmed = window.confirm(`Confirm destructive pipeline: Delete [${filename}] from Google Drive? This action cannot be undone.`);
    if (!confirmed) return;
    if (!driveToken) return;
    setDriveStatusMessage(`Deleting [${filename}]...`);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${driveToken}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      setDriveStatusMessage("File purged successfully.");
      fetchDriveFiles(driveToken);
    } catch (e) {
      console.error(e);
      setDriveStatusMessage("Drive delete request failed.");
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
      if (!user.emailVerified) {
        console.warn("User email not verified. Extraction write may fail.");
      }
      await addDoc(collection(db, vaultPath), newItem);
      await addDoc(collection(db, msgPath), {
        role: 'system',
        text: `LOG: Genetic fragment [${newItem.name}] successfully localized in private cluster.`,
        timestamp: Date.now(),
        type: 'extraction_success'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, vaultPath);
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
      if (!user.emailVerified) {
        console.warn("User email not verified. Message write may fail.");
      }
      await addDoc(collection(db, msgPath), {
        role: 'user',
        text,
        timestamp: Date.now(),
        context: visionState.district
      });

      setIsAiTyping(true);
      
      const history: any[] = messages.slice(-10).map(m => ({
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
            Persona: High-tech, cold, analytical but helpful agent. 
            Background: You assist psytrance DJs (like Ambient) and producers with "memory extraction" and set planning.
            Knowledge: The user likes psychedelic progressive trance.
            Task: Assist with sequencing memories into sets (e.g., 145-148 BPM extractions) or exploring darker sonic archetypes.
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
      handleFirestoreError(e, OperationType.CREATE, msgPath);
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
            ) : activeTab === 'codex' ? (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-5 duration-500 pb-20">
                <div className="flex items-center justify-between border-b border-[#00D4FF]/20 pb-4">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-6 h-6 text-[#00D4FF]" />
                    <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Sonic Codex // Archetypes</h2>
                  </div>
                  <div className="text-[8px] font-mono text-[#00D4FF]/40 tracking-widest uppercase">
                    Subject: AMBIENT // CLASSIFIED
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[
                    {
                      name: "The Zenith Void",
                      bpm: "138-142",
                      archetype: "Shadow-Prog",
                      desc: "Deep, cinematic atmospheres with rolling shadows. The archetype of the 'unseen observer'. Heavy Focus on low-frequency resonance.",
                      color: "border-slate-800",
                      icon: Moon
                    },
                    {
                      name: "The Kinetic Occult",
                      bpm: "145",
                      archetype: "Forest-Tech",
                      desc: "High-density glitch patterns over a thick, organic pulse. Represents the bridge between the digital and the primal forest spirits.",
                      color: "border-emerald-900/30",
                      icon: Zap
                    },
                    {
                      name: "Chrono-Phantasm",
                      bpm: "148",
                      archetype: "Dark-Psy",
                      desc: "Time-distorting delays and haunting melodic fragments. A recursive memory loop that explores the collapse of the persona.",
                      color: "border-purple-900/30",
                      icon: Activity
                    }
                  ].map((arch, i) => (
                    <div key={i} className={`p-6 bg-black/60 border ${arch.color} relative group overflow-hidden ${clickableStyle}`}>
                      <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 transform group-hover:scale-100 group-hover:opacity-10 transition-all">
                        <arch.icon className="w-12 h-12" />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[8px] font-mono text-[#00D4FF] uppercase tracking-widest">{arch.archetype}</span>
                        <span className="text-[10px] font-mono text-white/40">{arch.bpm} BPM</span>
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-[#00D4FF] transition-colors">{arch.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">{arch.desc}</p>
                      <div className="mt-6 flex items-center gap-2">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <span className="text-[7px] font-black uppercase text-slate-600 tracking-widest">Localized</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Disc className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Recommended Extractions // Track Selection</span>
                    </div>

                    {/* DYNAMIC SORT DROPDOWN */}
                    <div className="flex items-center gap-2 bg-[#040608] border border-white/10 px-2.5 py-1 rounded-sm">
                      <span className="text-[7.5px] font-black uppercase text-slate-500 tracking-wider">Sort Extractions:</span>
                      <select
                        value={codexSortBy}
                        onChange={(e: any) => setCodexSortBy(e.target.value)}
                        className="bg-transparent text-[8.5px] font-mono text-[#00D4FF] focus:outline-none focus:ring-0 border-none cursor-pointer uppercase font-bold"
                      >
                        <option value="bpm_desc" className="bg-slate-950 text-white">BPM (148 ↓ 138)</option>
                        <option value="bpm_asc" className="bg-slate-950 text-white">BPM (138 ↑ 148)</option>
                        <option value="key_asc" className="bg-slate-950 text-white">Key (A - Z)</option>
                        <option value="key_desc" className="bg-slate-950 text-white">Key (Z - A)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const codexTracks = [
                        { artist: "Sensient", track: "The Deep", district: "Melbourne Underground", type: "Zenith Void", bpm: 138, key: "11B" },
                        { artist: "Grouch", track: "Darkness", district: "Forest Clusters", type: "Kinetic Occult", bpm: 145, key: "11A" },
                        { artist: "Merkaba", track: "Forbidden Knowledge", district: "Ancient Temples", type: "Chrono-Phantasm", bpm: 148, key: "10A" },
                        { artist: "Tetrameth", track: "Primal", district: "Organic Nodes", type: "Zenith Void", bpm: 140, key: "9A" },
                        { artist: "Shadow FX", track: "Direct Drive", district: "System Subsystem", type: "Kinetic Occult", bpm: 142, key: "12A" },
                        { artist: "Terrafractyl", track: "Electronic Evolution", district: "Melbourne Labs", type: "Chrono-Phantasm", bpm: 146, key: "5A" },
                      ];

                      return [...codexTracks].sort((a, b) => {
                        if (codexSortBy === 'bpm_asc') return a.bpm - b.bpm;
                        if (codexSortBy === 'bpm_desc') return b.bpm - a.bpm;
                        if (codexSortBy === 'key_asc') return a.key.localeCompare(b.key);
                        if (codexSortBy === 'key_desc') return b.key.localeCompare(a.key);
                        return 0;
                      });
                    })().map((t, i) => (
                      <div key={i} className={`flex items-center gap-6 p-4 bg-white/[0.02] border border-white/5 hover:bg-[#00D4FF]/5 transition-all ${clickableStyle}`}>
                        <div className="w-12 h-12 flex items-center justify-center bg-black border border-white/10 shrink-0 relative group">
                          <div className="absolute inset-0.5 bg-[#00D4FF]/5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Play className="w-4 h-4 text-slate-600 relative z-10 hover:text-[#00D4FF] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">{t.artist}</span>
                            <span className="text-[7px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-[1px] rounded-[2px]">{t.bpm} BPM</span>
                            <span className="text-[7px] font-mono text-[#00D4FF] font-bold bg-[#00D4FF]/10 px-1 py-[1px] rounded-[2px]">{t.key}</span>
                          </div>
                          <p className="text-sm font-semibold text-white tracking-wide truncate">{t.track}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[7px] font-mono text-slate-500/80 uppercase tracking-tighter">{t.district}</p>
                          <p className="text-[8px] font-black text-slate-700 uppercase tracking-wide mt-0.5">{t.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'aether' ? (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
                <div className="border-b border-[#00D4FF]/20 pb-6">
                   <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Aether Project // Strategy</h2>
                   <p className="text-[8px] font-mono text-[#00D4FF]/60 uppercase tracking-widest mt-2 underline">Status: Delta Sync Active</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[
                     { title: "Executive Summary", desc: "Achieving Economic Proof through sovereign Aether node orchestration.", icon: Target },
                     { title: "Emergence Math", desc: "Ψ (Potential) • Φ (Presence) = Compounding Intelligence.", icon: Binary },
                     { title: "Infrastructure", desc: "Aetherium Nexus visualization and Socratic Sieve operation.", icon: Cpu },
                     { title: "Safety", desc: "H.E.N.S. Protocol enforcement for distress pattern management.", icon: Shield },
                   ].map((item, i) => (
                      <div key={i} className="p-6 bg-white/[0.02] border border-white/5 hover:bg-[#00D4FF]/5 transition-all">
                         <item.icon className="w-5 h-5 text-[#00D4FF] mb-4" />
                         <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{item.title}</h3>
                         <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                   ))}
                </div>

                <div className="bg-[#080C10] border border-[#00D4FF]/20 p-8 text-center space-y-4">
                  <p className="text-[10px] font-black uppercase text-[#00D4FF] tracking-[0.3em]">Current Nephilim Count</p>
                  <p className="text-5xl font-mono text-white tracking-tighter">9 <span className="text-sm text-slate-700">/ 10,000</span></p>
                  <div className="h-[2px] bg-white/5 max-w-sm mx-auto mt-4">
                    <div className="h-full bg-emerald-500 w-[0.09%]" />
                  </div>
                </div>

                {/* GALACTUS ORCHESTRATION STATUS */}
                <div className="border border-[#00D4FF]/20 bg-black/40 p-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Lock className="w-24 h-24 text-[#00D4FF]" />
                   </div>
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4 relative z-10">
                      <Music className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Galactus Integration: Active</span>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                      <div className="p-4 bg-white/[0.02]">
                         <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sovereignty Gate</span>
                         <span className="text-xs font-mono text-emerald-500">PENDING_SIGNATURE LIVE</span>
                      </div>
                      <div className="p-4 bg-white/[0.02]">
                         <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-2">Paralegal Sync</span>
                         <span className="text-xs font-mono text-white">LOCKED (30m cycle)</span>
                      </div>
                      <div className="p-4 bg-white/[0.02]">
                         <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ingestion Pipeline</span>
                         <span className="text-xs font-mono text-[#00D4FF]">SOUNDCLOUD_ACTIVE</span>
                      </div>
                   </div>
                </div>
              </div>
            ) : activeTab === 'nodes' ? (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
                <div className="flex items-center justify-between border-b border-[#00D4FF]/20 pb-6">
                  <div className="flex items-center gap-4">
                    <Layers className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Neural Cluster // Visualizer</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                       <span className="text-[10px] font-mono text-amber-500">{vizBpm} BPM</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* VISUALIZER CANVAS */}
                  <div className="lg:col-span-3 aspect-video bg-black rounded-sm border border-white/5 relative overflow-hidden group">
                    <canvas ref={canvasRef} className="w-full h-full" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
                    
                    {/* HUD Overlay */}
                    <div className="absolute bottom-4 left-4 flex gap-4 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="text-[7px] font-mono text-white/60">LAYER: 0x82<br/>STABILITY: HIGH</div>
                      <div className="text-[7px] font-mono text-white/60">GEOM: {vizPattern.toUpperCase()}<br/>SIGNAL: 44.1kHz</div>
                    </div>
                  </div>

                  {/* CONTROL DECK */}
                  <div className="space-y-6">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-4">Sync Modulator (BPM)</span>
                      <input 
                        type="range" min="130" max="180" value={vizBpm} 
                        onChange={(e) => setVizBpm(parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4FF]" 
                      />
                      <div className="flex justify-between mt-2 font-mono text-[8px] text-slate-600">
                        <span>130</span>
                        <span>180</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Phase Patterns</span>
                      {[
                        { id: 'neural', label: 'Neural Pulse', icon: Activity },
                        { id: 'geometric', label: 'Cyber Grid', icon: LayoutGrid },
                        { id: 'flow', label: 'High Flow', icon: Zap }
                      ].map(p => (
                        <button 
                          key={p.id}
                          onClick={() => setVizPattern(p.id)}
                          className={`w-full flex items-center justify-between p-3 border transition-all ${vizPattern === p.id ? 'bg-[#00D4FF]/10 border-[#00D4FF] text-white' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20'}`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                          <p.icon className="w-3 h-3" />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Chromatic Tuning</span>
                      <div className="grid grid-cols-4 gap-2">
                        {['#00D4FF', '#FF0055', '#A855F7', '#10B981'].map(c => (
                          <button 
                            key={c}
                            onClick={() => setVizColor(c)}
                            className={`aspect-square rounded-sm border-2 transition-all ${vizColor === c ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'set_planner' ? (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#00D4FF]/20 pb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <Disc className="w-6 h-6 text-fuchsia-500" />
                    <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Set Planner // Sequence Grid</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <span className="text-[10px] font-mono text-fuchsia-500 border border-fuchsia-500/20 px-3 py-1 bg-fuchsia-500/10">
                        Tracks: {plannerTracks.length} // Avg BPM: {Math.round(plannerTracks.reduce((sum, t) => sum + (Number(t.bpm) || 0), 0) / (plannerTracks.length || 1))}
                     </span>
                     
                     {/* Backup Set Plan to Google Drive */}
                     {user && driveToken ? (
                       <button
                         onClick={() => {
                           const filename = prompt("Enter filename for Google Drive backup:", `Ambient_OS_Set_Plan_${new Date().toISOString().split('T')[0]}`);
                           if (filename) savePlanToDrive(filename);
                         }}
                         className={`text-[9px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black border border-[#00D4FF]/40 px-3 py-1.5 uppercase tracking-widest ${clickableStyle}`}
                       >
                         Backup to GDrive
                       </button>
                     ) : (
                       <button
                         onClick={handleConnectDrive}
                         className={`text-[8px] font-mono bg-white/5 hover:bg-[#00D4FF]/20 border border-white/10 text-white hover:text-[#00D4FF] px-3 py-1.5 uppercase tracking-widest ${clickableStyle} animate-pulse`}
                       >
                         Authorize GDrive Gasket
                       </button>
                     )}
                  </div>
                </div>

                {driveStatusMessage && (
                  <div className="bg-black border border-amber-500/30 text-amber-500 p-4 font-mono text-xs flex justify-between items-center rounded-sm">
                    <span>⚡ COHERENCE FEEDBACK: {driveStatusMessage}</span>
                    <button onClick={() => setDriveStatusMessage(null)} className="text-[10px] hover:text-white underline">Acknowledge</button>
                  </div>
                )}

                <div className="space-y-4">
                   {plannerTracks.map((track, i) => (
                     <div key={track.id || i} className="group relative flex flex-col md:flex-row items-center border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] p-4 transition-all hover:border-[#00D4FF]/30 gap-6">
                        <div className="font-mono text-xs text-slate-600 w-8">0{i+1}</div>
                        <div className="flex-1 space-y-1 text-center md:text-left">
                           <div className="text-sm font-bold text-white uppercase tracking-wider">{track.title}</div>
                           <div className="text-[10px] text-slate-500 font-mono">{track.artist}</div>
                        </div>
                        <div className="flex items-center gap-8 text-[10px] uppercase font-black tracking-widest text-slate-400">
                           <div className="flex flex-col items-center md:items-start gap-1">
                              <span className="text-[8px] text-slate-600">BPM</span>
                              <span className="text-emerald-400 font-mono text-xs">{track.bpm}</span>
                           </div>
                           <div className="flex flex-col items-center md:items-start gap-1">
                              <span className="text-[8px] text-slate-600">KEY</span>
                              <span className="text-amber-400 font-mono text-xs">{track.key}</span>
                           </div>
                           <div className="hidden md:flex flex-col items-end gap-1 w-32 border-l border-white/10 pl-4 pr-4">
                              <span className="text-[8px] text-slate-600">Transition Out</span>
                              <span className="text-[#00D4FF] text-right font-mono text-[9px] mt-0.5">{track.transition}</span>
                           </div>
                           
                           {/* Trash single track option */}
                           <button 
                             onClick={() => {
                               setPlannerTracks(prev => prev.filter(t => t.id !== track.id));
                             }}
                             className={`p-2 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 text-red-500 rounded ${clickableStyle}`}
                           >
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Adding new audio sequence segment builder */}
                <div className="border border-white/5 bg-black/40 p-6 space-y-4">
                   <h3 className="text-xs font-black uppercase text-[#00D4FF] tracking-[0.2em] border-b border-white/5 pb-2">Initialize Audio Sequence</h3>
                   <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Track Title</label>
                        <input 
                          type="text" 
                          placeholder="Void Resonance" 
                          value={plannerTitleInput}
                          onChange={e => setPlannerTitleInput(e.target.value)}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Artist Signature</label>
                        <input 
                          type="text" 
                          placeholder="Artist Name" 
                          value={plannerArtistInput}
                          onChange={e => setPlannerArtistInput(e.target.value)}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Modulator (BPM)</label>
                        <input 
                          type="number" 
                          value={plannerBpmInput}
                          onChange={e => setPlannerBpmInput(Number(e.target.value))}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Harmonic Key</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 8A" 
                          value={plannerKeyInput}
                          onChange={e => setPlannerKeyInput(e.target.value)}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase">Transition Exit</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Echo Filter" 
                          value={plannerTransitionInput}
                          onChange={e => setPlannerTransitionInput(e.target.value)}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                        />
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                       if (!plannerTitleInput.trim() || !plannerArtistInput.trim()) {
                         alert("Track title and artist signature inputs are required.");
                         return;
                       }
                       const newTrack = {
                         id: `tCustom_${Date.now()}`,
                         title: plannerTitleInput,
                         artist: plannerArtistInput,
                         bpm: plannerBpmInput,
                         key: plannerKeyInput,
                         transition: plannerTransitionInput
                       };
                       setPlannerTracks(prev => [...prev, newTrack]);
                       setPlannerTitleInput('');
                       setPlannerArtistInput('');
                     }}
                     className={`w-full py-3 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 font-black text-xs uppercase tracking-[0.2em] hover:bg-[#00D4FF] hover:text-black transition-all ${clickableStyle}`}
                   >
                     Commit Dynamic Sequence to Grid
                   </button>
                </div>
              </div>
            ) : activeTab === 'drive' ? (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
                {/* Header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#00D4FF]/20 pb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <Cloud className="w-6 h-6 text-[#00D4FF]" />
                    <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Google Drive Bridge // Telemetry Center</h2>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/20 px-3 py-1 bg-emerald-500/10">
                        {driveToken ? "STATUS: AUTHORIZED" : "STATUS: UNAUTHORIZED"}
                     </span>
                  </div>
                </div>

                {driveStatusMessage && (
                  <div className="bg-black border border-amber-500/30 text-amber-500 p-4 font-mono text-xs flex justify-between items-center rounded-sm">
                    <span>⚡ SYSTEM FEEDBACK: {driveStatusMessage}</span>
                    <button onClick={() => setDriveStatusMessage(null)} className="text-[10px] hover:text-white underline">Acknowledge</button>
                  </div>
                )}

                {/* Authentication card */}
                <div className="p-6 border border-[#00D4FF]/20 bg-black/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <HardDrive className="w-32 h-32 text-[#00D4FF]" />
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Secure OAuth Link</h3>
                      <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                        Authorize Ambient OS to interact with your Google Drive. This enables full persistence synchronization to save sound sequences, structural logs, and active local vaults.
                      </p>
                    </div>
                    {driveToken ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                         <button
                           onClick={() => fetchDriveFiles(driveToken)}
                           className={`py-2 px-4 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black border border-[#00D4FF]/30 font-mono text-[10px] font-bold uppercase tracking-wider rounded ${clickableStyle}`}
                         >
                           Refetch GDrive Files
                         </button>
                         <button
                           onClick={() => setDriveToken(null)}
                           className={`py-2 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 font-mono text-[10px] font-bold uppercase tracking-wider rounded ${clickableStyle}`}
                         >
                           Sever GDrive Link
                         </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectDrive}
                        className={`py-3 px-6 bg-[#00D4FF] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-3 rounded ${clickableStyle}`}
                      >
                        <Shield className="w-4 h-4" />
                        Establish GDrive Bridge
                      </button>
                    )}
                  </div>
                </div>

                {driveToken && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Explorer Col */}
                     <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="text-[10px] font-black uppercase text-white tracking-widest">Ambient File Scanner</span>
                           <label className="flex items-center gap-2 cursor-pointer text-xs font-mono select-none text-slate-400">
                             <input 
                               type="checkbox" 
                               checked={showAllDriveFiles} 
                               onChange={e => setShowAllDriveFiles(e.target.checked)}
                               className="accent-[#00D4FF] cursor-pointer"
                             />
                             <span>Show All Drive Files</span>
                           </label>
                        </div>

                        {isFetchingDrive ? (
                           <div className="p-12 border border-white/5 bg-white/[0.01] text-center font-mono text-xs text-slate-500 animate-pulse">
                              Scuba scanning Google Drive sectors...
                           </div>
                        ) : driveFiles.length === 0 ? (
                           <div className="p-12 border border-dashed border-white/10 text-center font-mono text-xs text-slate-500">
                              No compatible telemetry files located. Add sequences and click backing up.
                           </div>
                        ) : (
                           <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                              {driveFiles.map(file => {
                                const isJson = file.name.endsWith('.json');
                                return (
                                 <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/[0.02] border border-white/5 hover:border-[#00D4FF]/20 hover:bg-white/[0.03] transition-all gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                       <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                                       <div className="min-w-0">
                                          <p className="text-xs font-mono text-white truncate max-w-sm">{file.name}</p>
                                          <p className="text-[7px] text-slate-500 font-mono uppercase mt-0.5">File ID: {file.id.substring(0, 15)}...</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-auto">
                                       {isJson && (
                                         <button 
                                           onClick={() => loadPlanFromDrive(file.id)}
                                           className={`text-[8px] font-mono py-1 px-2.5 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black border border-[#00D4FF]/30 font-bold uppercase ${clickableStyle}`}
                                         >
                                            Load to App
                                         </button>
                                       )}
                                       <button 
                                         onClick={() => deleteDriveFile(file.id, file.name)}
                                         className={`text-[8px] font-mono py-1 px-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 font-bold uppercase ${clickableStyle}`}
                                       >
                                          Delete
                                       </button>
                                    </div>
                                 </div>
                                );
                              })}
                           </div>
                        )}
                     </div>

                     {/* Upload Custom Log Column */}
                     <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-white tracking-widest block border-b border-white/5 pb-2">Save Direct Telemetry</span>
                        <div className="p-4 border border-white/5 bg-black/20 space-y-4">
                           <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Filename Title</label>
                              <input 
                                type="text" 
                                value={driveNoteTitle}
                                onChange={e => setDriveNoteTitle(e.target.value)}
                                className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Telemetric Logs / Observations</label>
                              <textarea 
                                rows={4}
                                placeholder="Structure custom sound structures or system signals here..."
                                value={driveNoteText}
                                onChange={e => setDriveNoteText(e.target.value)}
                                className="w-full bg-black border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-[#00D4FF] resize-none"
                              />
                           </div>
                           <button 
                             onClick={uploadCustomNote}
                             disabled={isUploadingDrive}
                             className={`w-full py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest ${clickableStyle}`}
                           >
                             {isUploadingDrive ? "Uploading..." : "Write File to GDrive"}
                           </button>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'ai_library' ? (
              <AiLibraryView 
                user={user}
                db={db}
                appId={appId}
                vaultItems={vaultItems}
                plannerTracks={plannerTracks}
                clickableStyle={clickableStyle}
              />
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
           <div className="p-4 border-b border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between col-span-2">
                 <div className="flex items-center gap-3 overflow-hidden">
                    <Database className="w-4 h-4 text-[#00D4FF] shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block whitespace-nowrap">Local Vault</span>
                 </div>
                 <span className="text-[8px] font-mono text-slate-600 hidden lg:block">{vaultItems.length} SEC</span>
              </div>
              
              {/* Sidebar Backup to GDrive */}
              {user && driveToken && vaultItems.length > 0 && (
                <button 
                  onClick={async () => {
                    setIsUploadingDrive(true);
                    setDriveStatusMessage("Backing up Vault to Cloud Drive...");
                    try {
                      const metadata = { name: `Ambient_OS_Vault_Backup_${new Date().toISOString().split('T')[0]}.json`, mimeType: 'application/json' };
                      const fileContent = JSON.stringify({ appId, type: 'vault_backup', timestamp: Date.now(), items: vaultItems }, null, 2);
                      const boundary = 'gdrive_upload_boundary_ambient';
                      const delimiter = `\r\n--${boundary}\r\n`;
                      const closeDelimiter = `\r\n--${boundary}--`;
                      const body = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: application/json\r\n\r\n' + fileContent + closeDelimiter;
                      
                      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${driveToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
                        body
                      });
                      if (!res.ok) throw new Error("Vault backup write failed");
                      setDriveStatusMessage("Local Vault backup uploaded to Google Drive!");
                      fetchDriveFiles(driveToken);
                    } catch (e) {
                      console.error(e);
                      setDriveStatusMessage("Failed to write Vault backup.");
                    } finally {
                      setIsUploadingDrive(false);
                    }
                  }}
                  className={`text-[8px] font-mono py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest block text-center ${clickableStyle}`}
                >
                  Backup Vault to Drive
                </button>
              )}
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
            { id: 'ai_library', icon: Brain, label: 'AI Library' },
            { id: 'codex', icon: BookOpen, label: 'Codex' },
            { id: 'nodes', icon: Layers, label: 'Clusters' },
            { id: 'aether', icon: Wifi, label: 'Aether' },
            { id: 'set_planner', icon: Disc, label: 'Planner' },
            { id: 'drive', icon: HardDrive, label: 'Drive Bridge' }
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

