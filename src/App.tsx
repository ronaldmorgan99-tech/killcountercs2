/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon,
  Target,
  Clock,
  Skull,
  User,
  HeartPulse,
  List,
  Zap,
  ChevronRight,
  Crosshair,
  ShieldAlert,
  Activity,
  LineChart,
  TerminalSquare
} from 'lucide-react';

interface Kill {
  victim: string;
  timestamp: string;
  id?: string;
}

interface KillData {
  total_kills: number;
  recent: Kill[];
}

export default function App() {
  const [data, setData] = useState<KillData>({ total_kills: 0, recent: [] });
  const [playerName, setPlayerName] = useState('LocalPlayer');
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
  const socketRef = useRef<Socket | null>(null);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Session timer
    const interval = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(cfg => {
        setPlayerName(localStorage.getItem('cs2_player_name') || cfg.player_name || 'LocalPlayer');
      })
      .catch(console.error);

    fetch('/api/kills')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem('cs2_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('analysis-start', (payload: { screenshot: string; playerName: string; id: number }) => {
      setIsAnalyzing(true);
      setLastScreenshot(payload.screenshot);
    });

    socket.on('analysis-complete', () => {
      setIsAnalyzing(false);
    });

    socket.on('kill-update', (newData: KillData) => {
      setData(newData);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const killsPerMin = sessionTime > 0 ? ((data.total_kills / sessionTime) * 60).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans flex flex-col font-medium">
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 border-b border-[#1E293B] bg-[#0F172A]">
        <div className="flex items-center gap-4">
          <div className="bg-[#0EA5E9] rounded-lg text-slate-900 font-bold text-xl flex items-center justify-center w-11 h-11 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            G4
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-bold tracking-tight text-slate-100 uppercase leading-none mb-1.5">
              GEMMA-4 <span className="text-[#38BDF8]">VISION</span> KILL-DETECTOR
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono leading-none">
              v1.2.0 &bull; Local Host
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-100 mr-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`}></div>
            <span>API: Connected</span>
          </div>
          <button className="px-4 h-[38px] flex items-center justify-center rounded-md bg-[#1E293B] text-[12px] font-semibold text-slate-400 border border-slate-700/50 hover:bg-slate-800 transition-colors uppercase tracking-wide">
            HOTKEY: <span className="text-[#38BDF8] ml-1.5">[F9]</span>
          </button>
          <button 
            onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
            className="w-[38px] h-[38px] flex items-center justify-center rounded-md bg-[#1E293B] border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div 
              key="dash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5 px-1">
                  <LineChart className="w-5 h-5 text-[#38BDF8]" />
                  <h2 className="text-[13px] font-bold text-slate-100 uppercase tracking-widest">Session Statistics</h2>
                </div>
                
                {/* Top 4 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-sm shadow-slate-900/50 flex flex-col relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4 z-10">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#0EA5E9]/10 text-[#38BDF8]">
                        <Target className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Kills</span>
                        <span className="text-3xl font-bold text-slate-100 leading-none mb-1.5">{data.total_kills}</span>
                        <span className="text-[12px] text-slate-500">This session</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-sm shadow-slate-900/50 flex flex-col relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4 z-10">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#22C55E]/10 text-[#4ADE80]">
                        <Crosshair className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Kills / Min</span>
                        <span className="text-3xl font-bold text-slate-100 leading-none mb-1.5">{killsPerMin}</span>
                        <span className="text-[12px] text-slate-500">Average</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-sm shadow-slate-900/50 flex flex-col relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4 z-10">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#A855F7]/10 text-[#C084FC]">
                        <Skull className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Headshot %</span>
                        <span className="text-3xl font-bold text-slate-100 leading-none mb-1.5">0%</span>
                        <span className="text-[12px] text-slate-500">Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-sm shadow-slate-900/50 flex flex-col relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#EAB308]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4 z-10">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#EAB308]/10 text-[#FACC15]">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Session Time</span>
                        <span className="text-3xl font-bold text-slate-100 leading-none mb-1.5 font-mono tracking-tight">{formatTime(sessionTime)}</span>
                        <span className="text-[12px] text-slate-500">Elapsed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom 2 Wide Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#0EA5E9]/10 text-[#38BDF8]">
                        <User className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Agent Profile</span>
                        <span className="text-2xl font-bold text-slate-100 mb-2 leading-none">{playerName}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4ADE80]">STATUS: OPERATIONAL</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-sm flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-2">
                       <HeartPulse className="w-6 h-6 text-[#38BDF8]" />
                       <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">System Health</span>
                    </div>
                    <div className="w-full flex items-center gap-4">
                      <div className="flex-1 h-3 bg-[#0B1120] rounded-full overflow-hidden border border-[#1E293B]">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]" 
                          initial={{ width: 0 }}
                          animate={{ width: isConnected ? '85%' : '0%' }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400 w-8">{isConnected ? '85%' : '0%'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-400">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-rose-500'}`} />
                      {isConnected ? 'All systems operational' : 'System offline'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Layout: Recent Events & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mt-2">
                
                {/* Recent Events */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2.5 px-1">
                    <List className="w-5 h-5 text-[#38BDF8]" />
                    <h2 className="text-[13px] font-bold text-slate-100 uppercase tracking-widest">Recent Events</h2>
                  </div>
                  
                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-col h-[300px]">
                    {data.recent.length === 0 ? (
                      <div className="flex-1 bg-[#0F172A]/50 rounded-lg border border-[#1E293B]/50 flex flex-col items-center justify-center text-slate-500">
                        <Crosshair className="w-8 h-8 mb-4 text-slate-600" />
                        <h3 className="text-slate-200 font-bold mb-1.5 transition-opacity">No events detected yet</h3>
                        <p className="text-[13px]">Your kill feed events will appear here</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto custom-scrollbar pr-2">
                        <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                          <thead className="text-slate-500 uppercase text-[11px] tracking-widest font-bold">
                            <tr>
                              <th className="px-4 pb-2">Time</th>
                              <th className="px-4 pb-2">Status</th>
                              <th className="px-4 pb-2 text-[#38BDF8]">Victim</th>
                              <th className="px-4 pb-2 text-right">Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="font-mono">
                            <AnimatePresence>
                              {data.recent.map((kill, i) => (
                                <motion.tr 
                                  key={kill.timestamp + i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="bg-[#0F172A] hover:bg-[#1E293B] transition-colors group cursor-default rounded-lg"
                                >
                                  <td className="px-4 py-3 text-xs text-slate-400 rounded-l-lg">
                                    {new Date(kill.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3 text-[11px]">
                                    <span className="text-[#4ADE80] bg-[#4ADE80]/10 px-2.5 py-1 rounded-sm uppercase font-bold tracking-wider">
                                      Eliminated
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-200 group-hover:text-white transition-colors">
                                    {kill.victim}
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs text-slate-500 rounded-r-lg">
                                    99%
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2.5 px-1">
                    <Zap className="w-5 h-5 text-[#38BDF8]" />
                    <h2 className="text-[13px] font-bold text-slate-100 uppercase tracking-widest">Quick Actions</h2>
                  </div>
                  
                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2 h-[300px]">
                    <button className="flex items-center gap-4 bg-[#0F172A]/50 hover:bg-[#1E293B] border border-[#1E293B]/50 hover:border-[#334155] p-4 text-left transition-colors rounded-xl group/btn">
                      <div className="w-10 h-10 rounded flex items-center justify-center bg-[#EAB308]/10 text-[#FACC15] shrink-0">
                        <TerminalSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-[13px] font-bold text-slate-100 group-hover/btn:text-white transition-colors mb-0.5">Kill Feed Region</span>
                        <span className="text-[12px] text-slate-500">Configure capture area</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover/btn:text-slate-400 transition-colors" />
                    </button>
                    
                    <button className="flex items-center gap-4 bg-[#0F172A]/50 hover:bg-[#1E293B] border border-[#1E293B]/50 hover:border-[#334155] p-4 text-left transition-colors rounded-xl group/btn">
                      <div className="w-10 h-10 rounded flex items-center justify-center bg-[#F97316]/10 text-[#FB923C] shrink-0">
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-[13px] font-bold text-slate-100 group-hover/btn:text-white transition-colors mb-0.5">Hotkey Settings</span>
                        <span className="text-[12px] text-slate-500">Configure shortcuts</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover/btn:text-slate-400 transition-colors" />
                    </button>

                    <button className="flex items-center gap-4 bg-[#0F172A]/50 hover:bg-[#1E293B] border border-[#1E293B]/50 hover:border-[#334155] p-4 text-left transition-colors rounded-xl group/btn">
                      <div className="w-10 h-10 rounded flex items-center justify-center bg-[#0EA5E9]/10 text-[#38BDF8] shrink-0">
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-[13px] font-bold text-slate-100 group-hover/btn:text-white transition-colors mb-0.5">Advanced Settings</span>
                        <span className="text-[12px] text-slate-500">Fine-tune detection</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover/btn:text-slate-400 transition-colors" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
             <motion.div 
               key="settings"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 max-w-md mx-auto w-full my-auto shadow-xl"
             >
               <div className="flex items-center gap-3 mb-8">
                 <div className="p-2 bg-[#0EA5E9]/20 text-[#38BDF8] rounded-lg">
                   <ShieldAlert className="w-5 h-5" />
                 </div>
                 <h2 className="text-lg font-bold text-white uppercase tracking-tight">Setup Instructions</h2>
               </div>
 
               <div className="space-y-6">
                 <div>
                   <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">In-Game Player Name</label>
                   <input
                     type="text"
                     value={playerName}
                     onChange={(e) => setPlayerName(e.target.value)}
                     placeholder="Enter CS2 username..."
                     className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg px-4 py-3 text-sm text-[#38BDF8] font-bold focus:outline-none focus:border-[#0EA5E9] shadow-inner"
                   />
                   <p className="mt-2.5 text-[12px] text-slate-400 leading-relaxed">
                     Your exact CS2 name. Setting this here ensures the dashboard highlights the right kills.
                   </p>
                 </div>
 
                 <div>
                   <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">Windows Agent Target</label>
                   <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-5">
                     <p className="text-[12px] text-slate-400 leading-relaxed mb-4">
                       To track kills, the Aegis Windows Agent must be running on your gaming PC alongside CS2.
                     </p>
                     <div className="space-y-2 text-[12px] font-mono text-slate-300">
                       <p className="flex gap-2"><span>1.</span><span>Edit <span className="text-[#38BDF8]">config.json</span> in the agent folder.</span></p>
                       <p className="flex gap-2"><span>2.</span><span>Set <span className="text-[#38BDF8]">player_name</span> exactly as above.</span></p>
                       <p className="flex gap-2"><span>3.</span><span>Set <span className="text-[#38BDF8]">api_url</span> to this dashboard's IP.</span></p>
                     </div>
                   </div>
                 </div>
 
                 <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-xl flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Integration Endpoint</span>
                      <code className="text-[12px] font-mono text-[#38BDF8]">
                        {window.location.origin}
                      </code>
                    </div>
                 </div>
 
                 <button 
                   onClick={() => setView('dashboard')}
                   className="w-full bg-[#0EA5E9] text-slate-900 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[13px] hover:bg-[#38BDF8] transition-all"
                 >
                   Save & Return
                 </button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-[#1E293B] bg-[#0A0F1C] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#22C55E] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">STATUS: <span className="text-[#4ADE80]">READY</span></span>
        </div>
        
        <div className="text-[12px] font-medium text-slate-500 hidden md:block">
          Listening for kill feed events...
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold uppercase tracking-widest text-slate-500">ENGINE: <span className="text-[#38BDF8]">GEMMA-4 VISION</span></span>
          <div className="bg-[#0EA5E9]/20 text-[#38BDF8] font-bold text-xs rounded border border-[#0EA5E9]/30 px-2 py-1">G4</div>
        </div>
      </footer>
    </div>
  );
}
