import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Music, Play, Pause, Download, Volume2, RotateCcw, 
  Trash2, Brain, Activity, Shield, Layers, Plus, 
  ArrowRight, CheckCircle2, AlertTriangle, RefreshCcw, 
  Radio, FileJson, Disc, Sparkles, Video, Share2, CornerDownRight, Clapperboard, HelpCircle
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

interface AiLibraryViewProps {
  user: any;
  db: any;
  appId: string;
  vaultItems: any[];
  plannerTracks: any[];
  clickableStyle: string;
}

export default function AiLibraryView({
  user,
  db,
  appId,
  vaultItems,
  plannerTracks,
  clickableStyle
}: AiLibraryViewProps) {
  // Real-time Firestore loaded AI Library tracks
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  
  // Creation States
  const [sourceType, setSourceType] = useState<'vault' | 'planner' | 'soundcloud' | 'custom'>('custom');
  const [selectedVaultIndex, setSelectedVaultIndex] = useState<number>(0);
  const [selectedPlannerIndex, setSelectedPlannerIndex] = useState<number>(0);
  const [customName, setCustomName] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  
  // Custom Track manual metadata
  const [customBpmStr, setCustomBpmStr] = useState('142');
  const [customKeyStr, setCustomKeyStr] = useState('11A');

  // AI Pipeline Telemetry States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Player Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0); // in seconds
  const playbackDuration = 479; // Matches video duration exact: 7:59 (479 seconds)
  const [playbackVolume, setPlaybackVolume] = useState(80);
  const [playFormat, setPlayFormat] = useState<'MP3' | 'WAV' | 'FLAC'>('MP3');
  const playerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const orbitalRotationRef = useRef<number>(0);

  // Video Maker Modal States
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoRendering, setVideoRendering] = useState(false);
  const [videoRenderProgress, setVideoRenderProgress] = useState(0);
  const [videoRenderLogs, setVideoRenderLogs] = useState<string[]>([]);
  const [videoStyle, setVideoStyle] = useState<'glitch_oscilloscope' | 'cosmic_wireframe' | 'shamanic_pulsar'>('glitch_oscilloscope');
  const [soundwaveData, setSoundwaveData] = useState<number[]>([]);
  const waveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active sub-tab inside player dossier
  const [playerTab, setPlayerTab] = useState<'telemetry' | 'narrative' | 'strategy'>('telemetry');

  // Cover default asset
  const coverUrl = '/src/assets/images/cyber_ambient_cover_1780309820396.png';

  // Subscribing to Firestore ai_library collection
  useEffect(() => {
    if (!user) return;
    const aiLibPath = `artifacts/${appId}/users/${user.uid}/ai_library`;
    const aiLibRef = collection(db, aiLibPath);
    
    const unsubscribe = onSnapshot(aiLibRef, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by timestamp desc locally
      loaded.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      setTracks(loaded);

      // If no track is selected yet and we have loaded tracks, select the first one
      if (loaded.length > 0 && !selectedTrack) {
        setSelectedTrack(loaded[0]);
      }
    }, (error) => {
      console.error('[AI Library Firestore Error]:', error);
    });

    return () => unsubscribe();
  }, [user, db, appId]);

  // Audio Playback simulation hook
  useEffect(() => {
    if (isPlaying) {
      playerIntervalRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= playbackDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playerIntervalRef.current) {
        clearInterval(playerIntervalRef.current);
      }
    }

    return () => {
      if (playerIntervalRef.current) {
        clearInterval(playerIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Generate dynamic soundwave data for video rendering overlay
  useEffect(() => {
    if (videoRendering) {
      waveIntervalRef.current = setInterval(() => {
        const newData = Array.from({ length: 25 }, () => Math.floor(Math.random() * 80) + 10);
        setSoundwaveData(newData);
      }, 100);
    } else {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    }
    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, [videoRendering]);

  // Pre-populate default Psy-Ambient track if database is empty or template setup is fresh
  const handlePrepopulateDemo = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    setAnalysisLogs(['Activating default telemetry protocols...', 'Initializing local memory blocks']);
    try {
      const demoTrack = {
        name: 'Psy-Ambient',
        type: 'Ambient Instrumental',
        bpm: 145,
        harmonicKey: '8A',
        resonanceRatio: 0.94,
        coherenceScore: 96.5,
        spectralDensity: 'Glitch structures integrated over cosmic high-density terrain wave pulses',
        description: 'Immersive, highly spacious sonic journey blending soft psytrance rhythms and deep organic forest backdrops. Designed and optimized by Animus AI for therapeutic, deep meditation, or late-night ambient transitions.',
        dynamicMood: 'Transcendental / Psychedelic Calm',
        recommendedBpmAdjustment: 'Lower BPM down to 138 for smooth drone ambient transitions, or modulate key signature up 1 half-step for Kinetic build-ups.',
        crowdResonancePotential: 'Maximum hypnotic locking potential in low-light environments or visual-immersion geodesic structures.',
        subBassLevel: 'HEAVY',
        suggestedTransitions: ['Filtered low-pass sweep', 'Phrase-locked space echo overlay', 'Cross-frequency gate'],
        recommendedOverlays: ['Acid Lead module V9', '1/16th Psychoacoustic Gated Noise', 'Spectral space delays'],
        timestamp: Date.now(),
        dateStr: '5/31/2026'
      };

      const aiLibPath = `artifacts/${appId}/users/${user.uid}/ai_library`;
      await addDoc(collection(db, aiLibPath), demoTrack);
      setAnalysisLogs(prev => [...prev, 'Psy-Ambient demo track successfully injected into AI Library.']);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submits a request to the backend `/api/ai/analyze`
  const handleTriggerAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let targetName = '';
    let targetType = '';
    let parentData: any = {};

    if (sourceType === 'vault') {
      const item = vaultItems[selectedVaultIndex];
      if (!item) {
        setAiError('No local vault item selected.');
        return;
      }
      targetName = item.name || 'Vault Artifact';
      targetType = 'Vault Artifact Extraction';
      parentData = item;
    } else if (sourceType === 'planner') {
      const item = plannerTracks[selectedPlannerIndex];
      if (!item) {
        setAiError('No track selected from sequence planner.');
        return;
      }
      targetName = item.title || 'Planner Segment';
      targetType = 'Planner Sequence Track';
      parentData = item;
    } else if (sourceType === 'soundcloud') {
      if (!soundcloudUrl) {
        setAiError('Please provide a valid SoundCloud track URL.');
        return;
      }
      targetName = soundcloudUrl.split('/').pop() || 'SoundCloud Track';
      targetType = 'SoundCloud Ingestion Stream';
      parentData = { url: soundcloudUrl };
    } else {
      if (!customName) {
        setAiError('Please enter a track name.');
        return;
      }
      targetName = customName;
      targetType = 'Custom Synth Sequence';
      parentData = { bpm: customBpmStr, key: customKeyStr };
    }

    // Trigger loading sequence animations
    setIsAnalyzing(true);
    setAiError(null);
    setAnalysisProgress(10);
    setAnalysisLogs([
      `[CRITICAL] Initiating full cyber-sonic diagnostic scan...`,
      `[LINK] Resolving telemetry pipeline targeting: "${targetName}"`,
      `[PROMPT] Establishing handshake with Animus 4.0 Nexus Core AI...`
    ]);

    const logSteps = [
      'Performing dynamic FFT spectral analysis...',
      'De-constructing low-frequency sub-harmonics...',
      'Synthesizing coherence indices...',
      'Resolving geometric sonic resonance...',
      'Writing telemetry dossiers into persistent secure storage...'
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logSteps.length) {
        setAnalysisLogs(prev => [...prev, `[PROCESS] ${logSteps[currentLog]}`]);
        setAnalysisProgress(prev => Math.min(prev + 18, 90));
        currentLog++;
      }
    }, 450);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetName, type: targetType, parentData })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.details || errJson.error || 'Diagnostic endpoint failure.');
      }

      const report = await response.json();
      
      // Save directly to user's personal firebase collection `ai_library`
      const completeReport = {
        ...report,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
      };

      const aiLibPath = `artifacts/${appId}/users/${user.uid}/ai_library`;
      await addDoc(collection(db, aiLibPath), completeReport);

      setAnalysisLogs(prev => [...prev, `[SUCCESS] Empirical diagnostic report compilation complete!`]);
      setAnalysisProgress(100);

      // Select newly added track
      setSelectedTrack(completeReport);

      // Clean inputs
      setCustomName('');
      setSoundcloudUrl('');

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Operational error during generative telemetry analysis.');
      setAnalysisLogs(prev => [...prev, `[FAILURE] Technical abort - System error encountered.`]);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 1000);
    }
  };

  // Handles Deletion
  const handleDeleteTrack = async (trackId: string, trackName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm(`Are you sure you want to purge telemetry diagnostics for "${trackName}"? This action is irreversible.`)) return;

    try {
      const trackRef = doc(db, `artifacts/${appId}/users/${user.uid}/ai_library`, trackId);
      await deleteDoc(trackRef);
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(null);
      }
    } catch (e: any) {
      console.error('Failed to purge track document:', e);
    }
  };

  // Trigger simulated Music Video rendering popups matching standard modern high-visual telemetry
  const handleLaunchVideoMaker = () => {
    setIsVideoModalOpen(true);
    setVideoRendering(false);
    setVideoRenderProgress(0);
    setVideoRenderLogs([]);
  };

  const handleStartRenderVideo = () => {
    setVideoRendering(true);
    setVideoRenderProgress(0);
    setVideoRenderLogs([
      '[SYS_INIT] Booting Veo v3.1 high-density cinematic video rendering core...',
      `[LOAD] Mapping high-contrast album art "${selectedTrack?.name || 'Psy-Ambient'}"`,
      '[RESOLV] Preparing spatial spectrum oscilloscope overlay nodes...'
    ]);

    const renderSteps = [
      'Interpolating wave frequencies with holographic bento-grids...',
      'Staging cybernetic glitch overlays...',
      'Configuring dynamic frame rate matching 145 BPM sync pulse...',
      'Applying custom shader gradients and motion blurs...',
      'Finalizing audio-video mux file output...'
    ];

    let progress = 0;
    let stepIndex = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setVideoRendering(false);
        setVideoRenderLogs(prev => [...prev, '[COMPLETED] Music Video synthesized successfully! Video ready for spatial playback.']);
      }
      setVideoRenderProgress(progress);

      if (progress % 20 === 0 && stepIndex < renderSteps.length) {
        setVideoRenderLogs(prev => [...prev, `[RENDER] ${renderSteps[stepIndex]}`]);
        stepIndex++;
      }
    }, 150);
  };

  // Helper to format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Saves sonic dossier report as a classic JSON diagnostic file download
  const handleDownloadDossier = (track: any) => {
    if (!track) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(track, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Sonic_Telemetry_${track.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20 p-4">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#00D4FF]/20 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-4">
            <Brain className="w-7 h-7 text-[#00D4FF] animate-pulse" />
            <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-white">AI Studio Sonic Library</h1>
          </div>
          <p className="text-[9px] font-mono text-[#00D4FF]/60 uppercase tracking-widest mt-2">
            INTEGRATING DEEP COGNITIVE SPECTRUM PROFILES // CURRENT_TRIAL_INDEX: AI_OS_V4
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handlePrepopulateDemo} 
            className={`text-[8.5px] font-mono font-bold px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/30 text-emerald-400 uppercase tracking-widest ${clickableStyle}`}
          >
            Prepopulate Demo Track
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Track List & Analyzer form */}
        <div className="lg:col-span-4 space-y-6">
          {/* ANALYZE NEW UNIT WIDGET */}
          <div className="border border-[#00D4FF]/20 bg-black/40 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Sparkles className="w-16 h-16 text-[#00D4FF]" />
            </div>
            
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#00D4FF]" />
              Trigger Diagnostic Telemetry
            </h2>

            {aiError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 text-[10px] font-mono mb-4 rounded-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {isAnalyzing ? (
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] font-black text-[#00D4FF] uppercase tracking-widest animate-pulse">Running Neural Diagnostic...</span>
                  <span className="text-xs font-mono text-white">{analysisProgress}%</span>
                </div>
                <div className="h-[2px] bg-white/5 w-full relative">
                  <div className="absolute h-full bg-[#00D4FF] shadow-[0_0_15px_#00D4FF] transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                </div>
                {/* Simulated Telemetry logs display */}
                <div className="bg-[#040608] border border-white/5 p-3 rounded-sm h-32 overflow-y-auto font-mono text-[8px] text-slate-400 space-y-1 custom-scrollbar">
                  {analysisLogs.map((log, i) => (
                    <p key={i} className="leading-relaxed">{log}</p>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleTriggerAnalysis} className="space-y-4">
                {/* Source Selection tabs */}
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-white/5 border border-white/10 rounded-sm">
                  {[
                    { id: 'custom', label: 'Custom' },
                    { id: 'vault', label: 'Vault' },
                    { id: 'planner', label: 'Planner' },
                    { id: 'soundcloud', label: 'SoundCloud' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSourceType(tab.id as any)}
                      className={`text-[7.5px] font-black uppercase tracking-wider py-1.5 transition-all text-center ${
                        sourceType === tab.id 
                          ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sub-inputs dependent on choice */}
                {sourceType === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Track / Synthesizer Name</label>
                      <input 
                        type="text" 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g., Midnight Psy-Forest Subsystem"
                        className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Source BPM</label>
                        <input 
                          type="text" 
                          value={customBpmStr}
                          onChange={(e) => setCustomBpmStr(e.target.value)}
                          placeholder="145"
                          className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Harmonic Key</label>
                        <input 
                          type="text" 
                          value={customKeyStr}
                          onChange={(e) => setCustomKeyStr(e.target.value)}
                          placeholder="8A"
                          className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {sourceType === 'vault' && (
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Select Loot from Local Vault ({vaultItems.length} items)</label>
                    {vaultItems.length === 0 ? (
                      <p className="text-[9px] font-mono text-amber-500/70 py-2 border border-dashed border-amber-500/20 px-3">
                        No loot items in local vault. Use "Aether Link" to extract items first.
                      </p>
                    ) : (
                      <select
                        value={selectedVaultIndex}
                        onChange={(e) => setSelectedVaultIndex(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                      >
                        {vaultItems.map((val, i) => (
                          <option key={i} value={i} className="bg-slate-950 font-mono text-xs">
                            {val.name || 'Unlocked Fragment'} ({val.district || 'Watson'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {sourceType === 'planner' && (
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Select Planned Sequence Track ({plannerTracks.length} tracks)</label>
                    {plannerTracks.length === 0 ? (
                      <p className="text-[9px] font-mono text-amber-500/70 py-2 border border-dashed border-amber-500/20 px-3">
                        No custom sequence tracks planned yet. Go to the "Planner" tab to commit tracks first.
                      </p>
                    ) : (
                      <select
                        value={selectedPlannerIndex}
                        onChange={(e) => setSelectedPlannerIndex(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                      >
                        {plannerTracks.map((pt, i) => (
                          <option key={i} value={i} className="bg-slate-950 font-mono text-xs">
                            {pt.title || 'Untitled Track'} - {pt.artist || 'Anon DJ'} ({pt.bpm} BPM)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {sourceType === 'soundcloud' && (
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Soundcloud Stream URL</label>
                    <input 
                      type="url" 
                      value={soundcloudUrl}
                      onChange={(e) => setSoundcloudUrl(e.target.value)}
                      placeholder="https://soundcloud.com/artist/track-name"
                      className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                    />
                    <p className="text-[8px] font-mono text-[#00D4FF]/40 mt-1.5">
                      Ingests track metadata, resolves waveforms, and triggers neural AI diagnostic.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    (sourceType === 'vault' && vaultItems.length === 0) ||
                    (sourceType === 'planner' && plannerTracks.length === 0)
                  }
                  className={`w-full py-3 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 font-black text-xs uppercase tracking-[0.2em] hover:bg-[#00D4FF] hover:text-black transition-all disabled:opacity-30 disabled:pointer-events-none mt-2 ${clickableStyle}`}
                >
                  Analyze with Nexus AI
                </button>
              </form>
            )}
          </div>

          {/* LOADED TRACKS DIRECTORY */}
          <div className="border border-white/5 bg-black/20 p-4">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
              <span>Analyzed Track Logs</span>
              <span className="font-mono text-[9px] text-[#00D4FF]">{tracks.length} units</span>
            </h2>

            <div className="space-y-2 h-96 overflow-y-auto custom-scrollbar pr-1">
              {tracks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-25 space-y-3">
                  <Disc className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
                  <p className="text-[8.5px] font-mono uppercase tracking-[0.3em]">AI Library database offline.</p>
                </div>
              ) : (
                tracks.map((track) => (
                  <div 
                    key={track.id} 
                    onClick={() => setSelectedTrack(track)}
                    className={`p-4 bg-white/[0.02] border transition-all cursor-pointer relative ${
                      selectedTrack?.id === track.id
                        ? 'border-[#00D4FF] bg-[#00D4FF]/5 shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-6">
                        <p className="text-[7.5px] font-black uppercase text-[#00D4FF] tracking-wider mb-0.5">{track.type || 'Sonic Diagnostics'}</p>
                        <h3 className="text-xs font-black text-white uppercase truncate">{track.name}</h3>
                        <p className="text-[7.5px] font-mono text-slate-500 mt-1">
                          {track.bpm} BPM // KEY: {track.harmonicKey} // INT: {(track.resonanceRatio * 100).toFixed(0)}%
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteTrack(track.id, track.name, e)}
                        className="p-1 px-1.5 font-mono text-[8px] text-slate-700 hover:text-red-500 hover:bg-red-500/10 border border-transparent rounded-sm transition-all"
                      >
                        PURGE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive High-Fidelity Music Player & Deep Telemetry */}
        <div className="lg:col-span-8">
          {selectedTrack ? (
            <div className="space-y-6">
              {/* PRIMARY MUSIC PLAYER PANEL (Matching Video) */}
              <div className="border border-[#00D4FF]/20 bg-black/60 p-8 flex flex-col items-center relative overflow-hidden">
                {/* Cosmic glowing grids behind player card */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.04)_0%,transparent_70%)] pointer-events-none" />
                
                {/* Header Information */}
                <div className="w-full flex justify-between items-center border-b border-white/5 pb-4 mb-8">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">{selectedTrack.dynamicMood || 'Instrumental'}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 tracking-wider">INDEX_DATE: {selectedTrack.dateStr || '5/31/2026'}</span>
                </div>

                {/* Rotating Album Circle */}
                <div className="relative py-4">
                  <div 
                    className="w-56 h-56 rounded-full border border-[#00D4FF]/20 p-2 flex items-center justify-center bg-[#010305] shadow-[0_0_50px_rgba(0,212,255,0.06)] relative group"
                    style={{
                      transform: isPlaying ? `rotate(${playbackTime * 1.5}deg)` : 'none',
                      transition: isPlaying ? 'transform 1s linear' : 'transform 1s ease-out'
                    }}
                  >
                    {/* Rotating lines overlay mimicking vinyl stylus paths */}
                    <div className="absolute inset-2 border border-slate-900 rounded-full pointer-events-none" />
                    <div className="absolute inset-8 border border-slate-900 rounded-full pointer-events-none" />
                    <div className="absolute inset-16 border border-slate-900/60 rounded-full pointer-events-none" />

                    {/* Album Art Image Center */}
                    <div className="w-44 h-44 rounded-full overflow-hidden relative">
                      <img 
                        src={coverUrl} 
                        className="w-full h-full object-cover grayscale-[0.25] group-hover:grayscale-0 transition-all duration-700" 
                        alt="Cyber Art Cover" 
                      />
                      <div className="absolute inset-0 bg-[#00D4FF]/10 mix-blend-color-dodge" />
                      {/* Stylus line */}
                      <div className="absolute inset-x-1/2 top-0 bottom-1/2 w-[1.5px] bg-[#00D4FF]/30 origin-bottom scale-y-110 pointer-events-none" />
                    </div>
                    
                    {/* Spinning Center spindle hole */}
                    <div className="absolute w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center shadow-inner">
                      <div className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]" />
                    </div>
                  </div>
                </div>

                {/* Player Metadata text */}
                <div className="text-center mt-6 space-y-1">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">{selectedTrack.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Instrumental</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Generated by AI</span>
                  </div>
                </div>

                {/* Simulated Audio Progress Seek Bar */}
                <div className="w-full max-w-md mt-8 space-y-2">
                  <div className="h-[3px] bg-slate-900/80 rounded-full relative group cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const ratio = clickX / rect.width;
                      setPlaybackTime(Math.floor(ratio * playbackDuration));
                    }}
                  >
                    <div 
                      className="h-full bg-emerald-400 shadow-[0_0_10px_#10B981] absolute left-0 top-0 transition-all" 
                      style={{ width: `${(playbackTime / playbackDuration) * 100}%` }} 
                    />
                    {/* Seek bar indicator handle */}
                    <div 
                      className="w-2.5 h-2.5 bg-white border border-emerald-500 rounded-full absolute -top-1 shadow-[0_0_5px_rgba(255,255,255,0.7)] cursor-grab transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `${(playbackTime / playbackDuration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-slate-600">
                    <span>{formatTime(playbackTime)}</span>
                    <span>{formatTime(playbackDuration)}</span>
                  </div>
                </div>

                {/* Playback Controls & Action Utilities matching video exactly */}
                <div className="w-full max-w-lg mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6">
                  {/* Play Buttons left side */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`p-3 rounded-full border ${isPlaying ? 'bg-[#00D4FF]/20 border-[#00D4FF] text-[#00D4FF]' : 'bg-white/5 border-white/10 text-white'} transition-all ${clickableStyle}`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button 
                      onClick={() => setPlaybackTime(0)}
                      className={`p-2 rounded-full border border-white/5 text-slate-500 hover:text-white transition-all ${clickableStyle}`}
                      title="Reset playback track time"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Render video / download triggers */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button 
                      onClick={handleLaunchVideoMaker}
                      className={`text-[8px] font-mono font-bold px-3 py-2 border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF] rounded-sm hover:bg-[#00D4FF] hover:text-black transition-all uppercase tracking-wider flex items-center gap-1.5 ${clickableStyle}`}
                    >
                      <Video className="w-3 h-3" />
                      Create Music Video
                    </button>

                    <div className="flex items-center border border-white/10 rounded-sm overflow-hidden bg-black/40">
                      <select 
                        value={playFormat} 
                        onChange={(e: any) => setPlayFormat(e.target.value)}
                        className="bg-transparent text-[8.5px] font-mono font-bold text-slate-400 px-2.5 py-1.5 focus:outline-none focus:ring-0 border-none cursor-pointer uppercase"
                      >
                        <option value="MP3" className="bg-slate-950 text-white">MP3</option>
                        <option value="WAV" className="bg-slate-950 text-white">WAV</option>
                        <option value="FLAC" className="bg-slate-500 text-white">FLAC</option>
                      </select>
                      <button 
                        onClick={() => handleDownloadDossier(selectedTrack)}
                        className={`px-3 py-1.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF] text-white hover:text-black transition-all border-l border-white/10 ${clickableStyle}`}
                        title="Download track and telemetry details"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTEGRATED DEEP SCAN DIAGNOSTIC PANELS */}
              <div className="border border-white/5 bg-black/40 p-6 space-y-6">
                {/* Dossier Tabs selection */}
                <div className="flex border-b border-white/5 pb-2 gap-6">
                  {[
                    { id: 'telemetry', label: 'Sonic Telemetry', icon: Cpu },
                    { id: 'narrative', label: 'Deep Nexus Narrative', icon: Brain },
                    { id: 'strategy', label: 'Mixing Strategy', icon: Layers }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPlayerTab(tab.id as any)}
                      className={`text-[9px] font-black uppercase tracking-[0.2em] py-2 transition-all flex items-center gap-2 border-b-2 ${
                        playerTab === tab.id 
                          ? 'border-[#00D4FF] text-[#00D4FF]' 
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: Sonic Telemetry Gauges / Status Bars */}
                {playerTab === 'telemetry' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Spectral Resonance Index</span>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-mono text-white leading-none">{(selectedTrack.resonanceRatio * 100).toFixed(1)}%</span>
                          <span className="text-[7.5px] font-mono text-emerald-500 leading-none">STABLE</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedTrack.resonanceRatio * 100}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Biological Coherence</span>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-mono text-white leading-none">{(selectedTrack.coherenceScore).toFixed(1)}%</span>
                          <span className="text-[7.5px] font-mono text-[#00D4FF] leading-none">SYNCED</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00D4FF] rounded-full" style={{ width: `${selectedTrack.coherenceScore}%` }} />
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.01] border border-white/5 space-y-2">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Sub-Bass Delivery Pressure</span>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-mono text-white leading-none">{selectedTrack.subBassLevel || 'HEAVY'}</span>
                          <span className="text-[7.5px] font-mono text-amber-500 leading-none">DIFFERENTIAL</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: selectedTrack.subBassLevel === 'HEAVY' ? '100%' : selectedTrack.subBassLevel === 'BALANCED' ? '60%' : '30%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#050709] border border-white/10 p-4 space-y-3">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                        <span>Calculated BPM: {selectedTrack.bpm}</span>
                        <span>Key Sign: {selectedTrack.harmonicKey}</span>
                      </div>
                      <div className="border-t border-white/5 pt-2.5">
                        <span className="text-[7.5px] font-black text-slate-600 uppercase tracking-widest block mb-1">Spectral Density Mapping</span>
                        <p className="text-xs font-mono text-[#00D4FF] leading-relaxed">{selectedTrack.spectralDensity || 'High density spectrum map active.'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Deep Narrative */}
                {playerTab === 'narrative' && (
                  <div className="space-y-4 font-sans text-xs text-slate-400 leading-relaxed font-light animate-in fade-in duration-300">
                    <p className="border-l-2 border-emerald-500 pl-4 py-1 italic bg-emerald-500/5 text-slate-300 font-normal">
                      &ldquo;{selectedTrack.description}&rdquo;
                    </p>
                    <div className="p-4 bg-black/40 border border-white/5 space-y-2">
                      <h4 className="text-[8px] font-black text-white uppercase tracking-widest">Pacing Modulations / BPM Shift</h4>
                      <p className="leading-relaxed text-slate-500">{selectedTrack.recommendedBpmAdjustment}</p>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 space-y-2">
                      <h4 className="text-[8px] font-black text-white uppercase tracking-widest">Hypnotic Audience Resonance potential</h4>
                      <p className="leading-relaxed text-slate-500">{selectedTrack.crowdResonancePotential}</p>
                    </div>
                  </div>
                )}

                {/* TAB 3: Integration Strategy */}
                {playerTab === 'strategy' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      <h4 className="text-[8.5px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-1">Suggested Mix Transitions</h4>
                      <div className="space-y-2">
                        {selectedTrack.suggestedTransitions?.map((trans: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                            <CornerDownRight className="w-3.5 h-3.5 text-[#00D4FF] shrink-0" />
                            <span>{trans}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[8.5px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-1">Recommended Sonic Overlays</h4>
                      <div className="space-y-2">
                        {selectedTrack.recommendedOverlays?.map((layer: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{layer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center opacity-40 space-y-4">
              <Radio className="w-12 h-12 text-slate-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-widest">No Active Telemetry Selected</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">Select a track from the sidebar directory or run a diagnostic telemetry on sequencer plans or vault items to initialize diagnostics.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MUSIC VIDEO CREATION MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fadeIn duration-300">
          <div className="w-full max-w-2xl bg-[#03060a] border border-[#00D4FF]/30 p-8 space-y-6 relative rounded-sm">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-[0.3em] text-white flex items-center gap-2.5">
                  <Clapperboard className="w-5 h-5 text-[#00D4FF] animate-pulse" />
                  Sensory Video Synthesizer
                </h3>
                <p className="text-[8px] font-mono text-[#00D4FF]/50 mt-1 uppercase">Using Veo 3.1 lite-generate engines for dynamic spatial visuals</p>
              </div>
              <button 
                onClick={() => {
                  setIsVideoModalOpen(false);
                  setVideoRendering(false);
                }} 
                className="text-xs text-slate-500 hover:text-white uppercase font-bold"
              >
                Close
              </button>
            </div>

            {/* Simulated Live Renderer Screen */}
            <div className="w-full bg-[#010204] border border-white/5 h-64 relative flex flex-col items-center justify-center overflow-hidden">
              {videoRendering ? (
                <>
                  <div className="absolute inset-x-0 bottom-4 text-center z-10 space-y-1">
                    <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Rendering sensory frames {videoRenderProgress}%</p>
                    <div className="w-48 h-[1px] bg-slate-900 mx-auto rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${videoRenderProgress}%` }} />
                    </div>
                  </div>
                  {/* Ambient Visual rendering waveforms using absolute coordinates */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-20 pointer-events-none">
                    {soundwaveData.map((val, idx) => (
                      <div 
                        key={idx} 
                        className="bg-emerald-400 w-1 rounded-full transition-all duration-100" 
                        style={{ height: `${val}%` }} 
                      />
                    ))}
                  </div>
                  <img src={coverUrl} className="w-24 h-24 rounded-full object-cover animate-spin opacity-40 scale-110" style={{ animationDuration: '4s' }} alt="Sensing cover" />
                </>
              ) : videoRenderProgress === 100 ? (
                <div className="text-center space-y-4 z-10 p-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Diagnostic Clip Render Finished</h4>
                    <p className="text-[9px] font-mono text-slate-500 uppercase mt-1">Ready for Google Workspace or SoundCloud distribution</p>
                  </div>
                  <button 
                    onClick={() => alert('Simulating high-density export to personal credentials.')}
                    className={`px-4 py-2 bg-emerald-500 text-black font-black text-[9px] uppercase tracking-widest ${clickableStyle}`}
                  >
                    Export Video File
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <Play className="w-12 h-12 text-[#00D4FF]/30 mx-auto animate-pulse" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-white tracking-widest">Awaiting Video synthesis trigger</p>
                    <p className="text-[8.5px] font-mono text-slate-600 uppercase max-w-sm mx-auto mt-1">Resolves album art terrain coordinates combined with current diagnostic sub-bass indicators.</p>
                  </div>
                </div>
              )}

              {/* Grid background visual */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_95%,rgba(0,212,255,0.05)_95%),linear-gradient(90.1deg,rgba(0,0,0,0)_95%,rgba(0,212,255,0.05)_95%)] bg-[size:16px_16px] pointer-events-none" />
            </div>

            {/* Select video configuration */}
            {!videoRendering && videoRenderProgress < 100 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Visual Synthesis Engine Style</label>
                  <select
                    value={videoStyle}
                    onChange={(e: any) => setVideoStyle(e.target.value)}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D4FF]/40 tracking-wider"
                  >
                    <option value="glitch_oscilloscope" className="bg-slate-950 text-white">Oscilloscope & Glitch overlays</option>
                    <option value="cosmic_wireframe" className="bg-slate-950 text-white">Primal Wireframe Terrain</option>
                    <option value="shamanic_pulsar" className="bg-slate-950 text-white">Psychedelic Wave Pulsar</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleStartRenderVideo}
                    className={`w-full py-2.5 bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-[#00D4FF] hover:text-black transition-all ${clickableStyle}`}
                  >
                    Perform Video Compilation
                  </button>
                </div>
              </div>
            )}

            {/* Rendering Progress logs */}
            {videoRenderLogs.length > 0 && (
              <div className="bg-[#020406] border border-white/5 p-4 rounded-sm h-32 overflow-y-auto font-mono text-[8px] text-slate-400 space-y-1 custom-scrollbar">
                {videoRenderLogs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
