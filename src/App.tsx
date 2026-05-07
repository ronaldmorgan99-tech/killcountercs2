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
    <div className="min-h-screen bg-gradient-to-b from-[#050914] to-[#0B1020] text-[#F5F7FF] font-sans flex flex-col font-medium overflow-hidden">
      
      {/* Header */}
      <header className="h-[72px] flex items-center justify-between px-6 border-b border-white/5 bg-[#050914]/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] rounded-[10px] text-white font-bold text-xl flex items-center justify-center w-12 h-12 shadow-[0_0_24px_rgba(14,165,233,0.4)]">
            G4
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[20px] font-bold tracking-tight text-white uppercase leading-none mb-1">
              GEMMA-4 <span className="text-[#38BDF8]">VISION</span> KILL-DETECTOR
            </h1>
            <p className="text-[12px] text-[#A7B1C2] uppercase tracking-[0.1em] font-mono leading-none font-medium">
              v1.2.0 &bull; Local Host
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#F5F7FF] mr-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-[#6D7890]'}`}></div>
            <span>API: Connected</span>
          </div>
          <button className="px-4 h-[38px] flex items-center justify-center rounded-md bg-[#101827] text-[13px] font-semibold text-[#A7B1C2] border border-white/5 hover:bg-[#1A2333] transition-colors tracking-wide">
            HOTKEY: <span className="text-[#38BDF8] ml-1.5">[F9]</span>
          </button>
          <button 
            onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
            className="w-[38px] h-[38px] flex items-center justify-center rounded-md bg-transparent border border-white/5 text-[#A7B1C2] hover:text-white hover:bg-white/5 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto flex flex-col gap-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div 
              key="dash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 h-full"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pl-1">
                  <LineChart className="w-5 h-5 text-[#38BDF8]" />
                  <h2 className="text-[16px] font-semibold text-[#F5F7FF] uppercase tracking-wide">Session Statistics</h2>
                </div>
                
                {/* Top 4 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-4 shadow-[0_0_24px_rgba(0,140,255,0.03)] flex flex-col relative overflow-hidden group hover:border-[#38BDF8]/30 transition-colors">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.1),transparent_50%)] pointer-events-none" />
                    <div className="flex flex-col z-10 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0EA5E9]/10 text-[#38BDF8]">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium uppercase tracking-wide text-[#A7B1C2]">Total Kills</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-[32px] font-bold text-[#F5F7FF] leading-none mb-1">{data.total_kills}</span>
                        <span className="text-[12px] text-[#6D7890]">This session</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-4 shadow-[0_0_24px_rgba(0,140,255,0.03)] flex flex-col relative overflow-hidden group hover:border-[#22C55E]/30 transition-colors">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,197,94,0.1),transparent_50%)] pointer-events-none" />
                    <div className="flex flex-col z-10 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#22C55E]/10 text-[#4ADE80]">
                          <Crosshair className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium uppercase tracking-wide text-[#A7B1C2]">Kills / Min</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-[32px] font-bold text-[#F5F7FF] leading-none mb-1">{killsPerMin}</span>
                        <span className="text-[12px] text-[#6D7890]">Average</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-4 shadow-[0_0_24px_rgba(0,140,255,0.03)] flex flex-col relative overflow-hidden group hover:border-[#A855F7]/30 transition-colors">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
                    <div className="flex flex-col z-10 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#A855F7]/10 text-[#C084FC]">
                          <Skull className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium uppercase tracking-wide text-[#A7B1C2]">Headshot %</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-[32px] font-bold text-[#F5F7FF] leading-none mb-1">0%</span>
                        <span className="text-[12px] text-[#6D7890]">Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-4 shadow-[0_0_24px_rgba(0,140,255,0.03)] flex flex-col relative overflow-hidden group hover:border-[#EAB308]/30 transition-colors">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(234,179,8,0.1),transparent_50%)] pointer-events-none" />
                    <div className="flex flex-col z-10 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#EAB308]/10 text-[#FACC15]">
                          <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium uppercase tracking-wide text-[#A7B1C2]">Session Time</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-[32px] font-bold text-[#F5F7FF] leading-none mb-1 font-mono">{formatTime(sessionTime)}</span>
                        <span className="text-[12px] text-[#6D7890]">Elapsed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom 2 Wide Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-5 shadow-[0_0_24px_rgba(0,140,255,0.03)] flex flex-col justify-center relative overflow-hidden">
                    <div className="flex items-start flex-col gap-5">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-[#38BDF8]" />
                        <span className="text-[16px] font-semibold uppercase text-[#F5F7FF]">Agent Profile</span>
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <span className="text-[32px] font-bold text-[#F5F7FF] leading-none">{playerName}</span>
                        <span className="text-[12px] font-medium uppercase tracking-wider text-[#4ADE80]">STATUS: OPERATIONAL</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-5 shadow-[0_0_24px_rgba(0,140,255,0.03)] flex flex-col justify-center relative overflow-hidden gap-5">
                    <div className="flex items-center gap-3">
                       <HeartPulse className="w-5 h-5 text-[#38BDF8]" />
                       <span className="text-[16px] font-semibold uppercase text-[#F5F7FF]">System Health</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="w-full flex items-center gap-4">
                        <div className="flex-1 h-3 bg-[#050914] rounded-full overflow-hidden border border-white/5 relative">
                          <motion.div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: isConnected ? '85%' : '0%' }}
                            transition={{ duration: 1 }}
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                          </motion.div>
                        </div>
                        <span className="text-[14px] font-medium text-[#A7B1C2] w-8 leading-none">{isConnected ? '85%' : '0%'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-[#A7B1C2]">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                        {isConnected ? 'All systems operational' : 'System offline'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Layout: Recent Events & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 flex-1 min-h-[300px]">
                
                {/* Recent Events */}
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-3 pl-1">
                    <List className="w-5 h-5 text-[#38BDF8]" />
                    <h2 className="text-[16px] font-semibold text-[#F5F7FF] uppercase tracking-wide">Recent Events</h2>
                  </div>
                  
                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-6 flex flex-col h-full shadow-[0_0_24px_rgba(0,140,255,0.03)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050914]/20 pointer-events-none" />
                    {data.recent.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-[#6D7890] z-10 p-8">
                        <Crosshair className="w-10 h-10 mb-5 text-[#6D7890]/50" strokeWidth={1.5} />
                        <h3 className="text-[#F5F7FF] font-semibold text-[18px] mb-2">No events detected yet</h3>
                        <p className="text-[13px] text-[#A7B1C2]">Your kill feed events will appear here</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto custom-scrollbar pr-2 z-10 -m-6 p-6">
                        <table className="w-full text-left text-[14px] border-spacing-y-3 border-separate">
                          <thead className="text-[#6D7890] text-[12px] font-medium sticky top-0 bg-[#0D1526]/90 backdrop-blur pb-2">
                            <tr>
                              <th className="px-4 pb-2 font-medium w-32">Time</th>
                              <th className="px-4 pb-2 font-medium">Status</th>
                              <th className="px-4 pb-2 font-medium text-[#F5F7FF]">Victim</th>
                              <th className="px-4 pb-2 font-medium text-right rounded-tr-[8px]">Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="font-mono">
                            <AnimatePresence>
                              {data.recent.map((kill, i) => (
                                <motion.tr 
                                  key={kill.timestamp + i}
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="bg-[#101827] hover:bg-[#1A2333] transition-colors group cursor-default rounded-[8px]"
                                >
                                  <td className="px-4 py-3.5 text-[13px] text-[#A7B1C2] rounded-l-[8px] border-y border-l border-white/5 group-hover:border-[#38BDF8]/20 group-hover:text-[#F5F7FF]">
                                    {new Date(kill.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3.5 text-[12px] border-y border-white/5 group-hover:border-y-[#38BDF8]/20">
                                    <span className="text-[#4ADE80] flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                                      Eliminated
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 font-bold text-[#F5F7FF] border-y border-white/5 group-hover:border-y-[#38BDF8]/20">
                                    {kill.victim}
                                  </td>
                                  <td className="px-4 py-3.5 text-right text-[13px] text-[#6D7890] rounded-r-[8px] border-y border-r border-white/5 group-hover:border-[#38BDF8]/20">
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
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-center gap-3 pl-1">
                    <Zap className="w-5 h-5 text-[#38BDF8]" />
                    <h2 className="text-[16px] font-semibold text-[#F5F7FF] uppercase tracking-wide">Quick Actions</h2>
                  </div>
                  
                  <div className="bg-[#0D1526] border border-white/5 rounded-[12px] p-5 flex flex-col gap-3 h-full shadow-[0_0_24px_rgba(0,140,255,0.03)] justify-center">
                    <button className="flex items-center gap-4 bg-[#101827] hover:bg-[#1A2333] border border-white/5 hover:border-[#38BDF8]/30 p-4 text-left transition-colors rounded-[10px] group/btn">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#EAB308]/10 text-[#FACC15] shrink-0 outline outline-1 outline-white/5">
                        <TerminalSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-0.5">
                        <span className="text-[14px] font-medium text-[#F5F7FF] group-hover/btn:text-[#38BDF8] transition-colors leading-none">Kill Feed Region</span>
                        <span className="text-[12px] text-[#A7B1C2] leading-none">Configure capture area</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#6D7890] group-hover/btn:text-[#F5F7FF] transition-colors" />
                    </button>
                    
                    <button className="flex items-center gap-4 bg-[#101827] hover:bg-[#1A2333] border border-white/5 hover:border-[#38BDF8]/30 p-4 text-left transition-colors rounded-[10px] group/btn">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#F97316]/10 text-[#FB923C] shrink-0 outline outline-1 outline-white/5">
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-0.5">
                        <span className="text-[14px] font-medium text-[#F5F7FF] group-hover/btn:text-[#38BDF8] transition-colors leading-none">Hotkey Settings</span>
                        <span className="text-[12px] text-[#A7B1C2] leading-none">Configure shortcuts</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#6D7890] group-hover/btn:text-[#F5F7FF] transition-colors" />
                    </button>

                    <button className="flex items-center gap-4 bg-[#101827] hover:bg-[#1A2333] border border-white/5 hover:border-[#38BDF8]/30 p-4 text-left transition-colors rounded-[10px] group/btn">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0EA5E9]/10 text-[#38BDF8] shrink-0 outline outline-1 outline-white/5">
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-0.5">
                        <span className="text-[14px] font-medium text-[#F5F7FF] group-hover/btn:text-[#38BDF8] transition-colors leading-none">Advanced Settings</span>
                        <span className="text-[12px] text-[#A7B1C2] leading-none">Fine-tune detection</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#6D7890] group-hover/btn:text-[#F5F7FF] transition-colors" />
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
               className="bg-[#0D1526] border border-white/5 rounded-[16px] p-8 max-w-md mx-auto w-full my-auto shadow-[0_0_40px_rgba(0,140,255,0.05)] relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.1),transparent_70%)] pointer-events-none" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                   <div className="p-2.5 bg-[#0EA5E9]/10 text-[#38BDF8] rounded-xl outline outline-1 outline-white/5">
                     <ShieldAlert className="w-5 h-5" />
                   </div>
                   <h2 className="text-[20px] font-bold text-[#F5F7FF] uppercase tracking-wide">Setup Instructions</h2>
                 </div>
   
                 <div className="space-y-6">
                   <div>
                     <label className="block text-[13px] font-medium text-[#A7B1C2] mb-2 uppercase tracking-wide">In-Game Player Name</label>
                     <input
                       type="text"
                       value={playerName}
                       onChange={(e) => setPlayerName(e.target.value)}
                       placeholder="Enter CS2 username..."
                       className="w-full bg-[#101827] border border-white/5 rounded-[10px] px-4 py-3 text-[14px] text-[#F5F7FF] placeholder-[#6D7890] focus:outline-none focus:border-[#38BDF8]/50 transition-colors shadow-inner"
                     />
                     <p className="mt-2 text-[12px] text-[#6D7890] leading-relaxed">
                       Your exact CS2 name. Setting this here ensures the dashboard highlights the right kills.
                     </p>
                   </div>
   
                   <div>
                     <label className="block text-[13px] font-medium text-[#A7B1C2] mb-2 uppercase tracking-wide">Windows Agent Target</label>
                     <div className="bg-[#101827] border border-white/5 rounded-[10px] p-5">
                       <p className="text-[13px] text-[#A7B1C2] leading-relaxed mb-4">
                         To track kills, the Aegis Windows Agent must be running on your gaming PC alongside CS2.
                       </p>
                       <div className="space-y-2.5 text-[13px] text-[#A7B1C2]">
                         <p className="flex gap-2"><span>1.</span><span>Edit <span className="text-[#38BDF8] font-mono bg-[#38BDF8]/10 px-1 rounded">config.json</span> in the agent folder.</span></p>
                         <p className="flex gap-2"><span>2.</span><span>Set <span className="text-[#38BDF8] font-mono bg-[#38BDF8]/10 px-1 rounded">player_name</span> exactly as above.</span></p>
                         <p className="flex gap-2"><span>3.</span><span>Set <span className="text-[#38BDF8] font-mono bg-[#38BDF8]/10 px-1 rounded">api_url</span> to this dashboard's IP.</span></p>
                       </div>
                     </div>
                   </div>
   
                   <div className="p-4 bg-[#101827] border border-white/5 rounded-[10px] flex gap-3">
                      <div className="flex items-center justify-center p-2 rounded bg-white/5">
                        <Wifi className="w-4 h-4 text-[#A7B1C2]"/>
                      </div>
                      <div className="flex flex-col gap-1 justify-center">
                        <span className="text-[11px] font-medium uppercase text-[#6D7890] tracking-wider">Integration Endpoint</span>
                        <code className="text-[13px] font-mono text-[#F5F7FF]">
                          {window.location.origin}
                        </code>
                      </div>
                   </div>
   
                   <button 
                     onClick={() => setView('dashboard')}
                     className="w-full bg-[#38BDF8] text-[#050914] py-3.5 mt-2 rounded-[10px] font-bold uppercase tracking-wider text-[14px] hover:bg-white hover:text-black shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all flex items-center justify-center gap-2"
                   >
                     Save & Return
                   </button>
                 </div>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-[48px] border-t border-white/5 bg-[#050914] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#22C55E] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] border border-[#4ADE80]"></div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#A7B1C2]">STATUS: <span className="text-[#F5F7FF]">READY</span></span>
        </div>
        
        <div className="text-[12px] font-medium text-[#6D7890] hidden md:block">
          Listening for kill feed events...
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#A7B1C2]">ENGINE: <span className="text-[#38BDF8]">GEMMA-4 VISION</span></span>
          <div className="bg-[#0EA5E9]/10 text-[#38BDF8] font-bold text-[11px] rounded border border-[#0EA5E9]/20 px-2 py-0.5">G4</div>
        </div>
      </footer>
    </div>
  );
}
