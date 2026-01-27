
import React, { useState, useRef, useEffect } from 'react';
import { 
  CloudArrowUpIcon, VideoCameraIcon, DocumentTextIcon, MusicalNoteIcon, PhotoIcon,
  CheckCircleIcon, ExclamationCircleIcon, FolderOpenIcon, Cog6ToothIcon, 
  ClipboardIcon, TrashIcon, SparklesIcon, ChevronRightIcon, Bars3Icon, XMarkIcon,
  LockClosedIcon, GlobeAltIcon
} from '@heroicons/react/24/outline';
import { extractAllFromZip, getFileCategory } from './services/zipService';
import { analyzeMultimodal, fileToBase64 } from './services/geminiService';
import { driveService } from './services/googleDriveService';
import { FileData, ProcessingState, UniversalReport } from './types';
import { LogoIcon, LogoFull } from './components/Logo';

export default function App() {
  const [fileList, setFileList] = useState<FileData[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle', progress: 0, message: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clientId, setClientId] = useState(() => process.env.GOOGLE_CLIENT_ID || localStorage.getItem('google_client_id') || '');
  const [copySuccess, setCopySuccess] = useState(false);

  // Feature Flag: API Public Access
  const isApiPublic = process.env.API_PUBLIC_ACCESS === 'true';

  useEffect(() => {
    if (clientId && !process.env.GOOGLE_CLIENT_ID) {
      localStorage.setItem('google_client_id', clientId);
    }
  }, [clientId]);

  const addFiles = async (files: File[]) => {
    const newFiles: FileData[] = [];
    for (const f of files) {
      if (f.type === 'application/zip' || f.name.endsWith('.zip')) {
        setProcessingState({ status: 'extracting', progress: 0, message: `Extraindo ${f.name}...` });
        const extracted = await extractAllFromZip(f);
        extracted.forEach(ef => {
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            file: ef,
            name: ef.name,
            mimeType: ef.type,
            category: getFileCategory(ef.type, ef.name),
            url: URL.createObjectURL(ef)
          });
        });
      } else {
        const category = getFileCategory(f.type, f.name);
        if (category !== 'unknown') {
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            name: f.name,
            mimeType: f.type,
            category,
            url: URL.createObjectURL(f)
          });
        }
      }
    }
    setFileList(prev => [...prev, ...newFiles]);
    if (activeFileIndex === null && newFiles.length > 0) setActiveFileIndex(0);
    setProcessingState({ status: 'idle', progress: 0, message: 'Arquivos prontos.' });
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const processBatch = async () => {
    if (fileList.length === 0) return;
    if (!isApiPublic && !process.env.API_KEY) {
      alert("Acesso Privado: Configure sua API_KEY no ambiente para continuar.");
      return;
    }
    
    setProcessingState({ status: 'analyzing', progress: 0, message: 'Processando lote...', totalFiles: fileList.length, currentFileIndex: 0 });

    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].report) continue;
      
      setProcessingState(prev => ({ ...prev, currentFileIndex: i + 1, message: `IA analisando: ${fileList[i].name}` }));
      
      try {
        let parts: any[] = [];
        const f = fileList[i];

        if (f.category === 'video') {
          const frames = await captureFramesForFile(f.url);
          parts = frames.map(fr => ({ inlineData: { mimeType: 'image/jpeg', data: fr.data.split(',')[1] } }));
        } else {
          const b64 = await fileToBase64(f.file);
          parts = [{ inlineData: { mimeType: f.mimeType || 'application/octet-stream', data: b64 } }];
        }

        const report = await analyzeMultimodal(parts, f.category, f.name);
        setFileList(prev => {
          const updated = [...prev];
          updated[i].report = report;
          return updated;
        });
      } catch (err) {
        console.error(err);
      }
      
      setProcessingState(prev => ({ ...prev, progress: Math.floor(((i + 1) / fileList.length) * 100) }));
    }
    setProcessingState({ status: 'completed', progress: 100, message: 'Análise finalizada!' });
  };

  const captureFramesForFile = (url: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      const c = document.createElement('canvas');
      v.src = url;
      v.muted = true;
      v.onloadedmetadata = async () => {
        const frames = [];
        const ctx = c.getContext('2d');
        c.width = v.videoWidth / 2; c.height = v.videoHeight / 2;
        for (let i = 0; i < v.duration && i < 30; i += 2) {
          v.currentTime = i;
          await new Promise(r => v.onseeked = r);
          ctx?.drawImage(v, 0, 0, c.width, c.height);
          frames.push({ data: c.toDataURL('image/jpeg', 0.6) });
        }
        resolve(frames);
      };
      v.onerror = reject;
    });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'video': return <VideoCameraIcon className="w-5 h-5" />;
      case 'audio': return <MusicalNoteIcon className="w-5 h-5" />;
      case 'image': return <PhotoIcon className="w-5 h-5" />;
      case 'document': return <DocumentTextIcon className="w-5 h-5" />;
      default: return <SparklesIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 selection:bg-indigo-100 flex flex-col">
      {/* Dynamic Header */}
      <header className="glass-effect sticky top-0 z-[100] px-4 md:px-8 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl"
          >
            {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-4">
            <LogoIcon className="w-10 h-10 hidden sm:block" />
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tighter leading-none">OMNILENS</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.5 PRO</span>
                <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ${isApiPublic ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {isApiPublic ? <GlobeAltIcon className="w-3 h-3" /> : <LockClosedIcon className="w-3 h-3" />}
                  {isApiPublic ? 'Público' : 'Privado'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={async () => {
              if (!clientId) { setShowSettings(true); return; }
              await driveService.connect(clientId, file => addFiles([file]));
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:border-indigo-300 transition-all active:scale-95"
          >
            <FolderOpenIcon className="w-4 h-4 text-blue-500" /> Drive
          </button>
          
          <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all">
            <Cog6ToothIcon className="w-5 h-5 text-slate-500" />
          </button>
          
          {fileList.length > 0 && (
            <button 
              onClick={processBatch}
              disabled={processingState.status === 'analyzing'}
              className="px-4 md:px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-black shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              Analisar {fileList.length}
            </button>
          )}
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row max-w-[1920px] mx-auto w-full relative">
        
        {/* Responsive Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-[90] w-full sm:w-80 bg-white border-r border-slate-100 p-6 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Fluxo de Trabalho</h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{fileList.length}</span>
            </div>
            
            <div className="flex-grow space-y-2 overflow-y-auto pr-2 custom-scrollbar pb-20">
              {fileList.map((f, idx) => (
                <div 
                  key={f.id}
                  onClick={() => { setActiveFileIndex(idx); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                  className={`group relative p-3.5 rounded-2xl cursor-pointer border transition-all ${activeFileIndex === idx ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-50/50' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${activeFileIndex === idx ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {getCategoryIcon(f.category)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold truncate pr-4">{f.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-slate-400 uppercase font-black">{f.category}</p>
                        {f.report && <span className="w-1 h-1 bg-emerald-400 rounded-full" />}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFileList(prev => prev.filter((_, i) => i !== idx)); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="relative group border-2 border-dashed border-slate-100 rounded-2xl p-6 hover:bg-slate-50 transition-all cursor-pointer">
                <input type="file" multiple onChange={(e) => addFiles(Array.from(e.target.files || []))} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-indigo-500">
                  <div className="bg-slate-50 p-3 rounded-full group-hover:bg-indigo-50 transition-colors">
                    <CloudArrowUpIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Carregar Arquivos</span>
                </div>
              </div>

              {/* Mobile Only: Drive integration */}
              <button 
                onClick={async () => {
                  if (!clientId) { setShowSettings(true); return; }
                  await driveService.connect(clientId, file => addFiles([file]));
                }}
                className="md:hidden w-full flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black border border-blue-100"
              >
                <FolderOpenIcon className="w-4 h-4" /> Importar do Google Drive
              </button>
            </div>

            {processingState.status !== 'idle' && (
              <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Motor de IA</span>
                  <span className="text-xs font-black">{processingState.progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 rounded-full" style={{ width: `${processingState.progress}%` }} />
                </div>
                <p className="text-[11px] font-bold text-slate-400 truncate">{processingState.message}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-grow p-4 md:p-10 space-y-6 md:space-y-10">
          {activeFileIndex !== null ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600">
                        {getCategoryIcon(fileList[activeFileIndex].category)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg md:text-2xl font-black truncate">{fileList[activeFileIndex].name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fileList[activeFileIndex].mimeType}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(fileList[activeFileIndex].file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                   </div>
                </div>
                
                <div className="aspect-video bg-slate-950 flex items-center justify-center relative group">
                  {fileList[activeFileIndex].category === 'video' && <video className="w-full h-full object-contain" controls src={fileList[activeFileIndex].url} />}
                  {fileList[activeFileIndex].category === 'image' && <img className="w-full h-full object-contain" src={fileList[activeFileIndex].url} />}
                  {fileList[activeFileIndex].category === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-600 to-purple-800 text-white">
                      <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8 animate-pulse">
                        <MusicalNoteIcon className="w-16 h-16" />
                      </div>
                      <audio className="w-full max-w-md filter invert" controls src={fileList[activeFileIndex].url} />
                    </div>
                  )}
                  {fileList[activeFileIndex].category === 'document' && (
                    <iframe className="w-full h-full bg-white" src={fileList[activeFileIndex].url} />
                  )}
                </div>
              </div>

              {/* Analysis Result */}
              {fileList[activeFileIndex].report ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10 mt-10 pb-24">
                  <div className="xl:col-span-2 space-y-10">
                    <div className="bg-white rounded-[48px] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <SparklesIcon className="w-40 h-40" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black mb-8 leading-tight">Síntese do Conteúdo</h3>
                      <p className="text-slate-600 leading-relaxed text-lg md:text-xl font-medium">{fileList[activeFileIndex].report?.summary}</p>
                      
                      <div className="mt-16 space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="h-px bg-slate-100 flex-grow" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex-shrink-0">Detalhamento Técnico</h4>
                          <div className="h-px bg-slate-100 flex-grow" />
                        </div>
                        
                        {fileList[activeFileIndex].report?.detailedAnalysis.map((item, idx) => (
                          <div key={idx} className="group relative pl-8 border-l-2 border-slate-100 hover:border-indigo-500 transition-all py-2">
                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white border-4 border-slate-100 group-hover:border-indigo-500 transition-all" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                              {item.timestamp && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">{item.timestamp}</span>}
                              <div className="flex gap-2">
                                {item.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">{tag}</span>
                                ))}
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${item.importance === 'high' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-400'}`}>{item.importance}</span>
                              </div>
                            </div>
                            <p className="font-bold text-slate-800 text-base md:text-lg leading-snug">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="bg-[#1A1A2E] rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[80px]" />
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-8">Deep Insights</h4>
                       <ul className="space-y-6">
                         {fileList[activeFileIndex].report?.keyInsights.map((ki, i) => (
                           <li key={i} className="flex gap-4 text-sm md:text-base font-bold leading-snug group">
                             <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform flex-shrink-0" />
                             <span className="opacity-90 group-hover:opacity-100 transition-opacity">{ki}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Nuvem de Entidades</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {fileList[activeFileIndex].report?.entitiesFound.map(ent => (
                          <span key={ent} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 hover:bg-white hover:shadow-md transition-all cursor-default">{ent}</span>
                        ))}
                      </div>
                      
                      {fileList[activeFileIndex].report?.sentiment && (
                        <div className="mt-12 pt-10 border-t border-slate-50">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Humor / Contexto</p>
                          <div className="flex items-center gap-3">
                            <SparklesIcon className="w-5 h-5 text-indigo-500" />
                            <p className="text-lg font-black text-indigo-900 leading-none">{fileList[activeFileIndex].report?.sentiment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[48px] py-32 text-center mt-10">
                  <div className="bg-white w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <SparklesIcon className="w-10 h-10 text-indigo-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">IA em Standby</h3>
                  <p className="text-slate-400 max-w-xs mx-auto mt-4 font-bold text-sm leading-relaxed uppercase tracking-widest">Clique em "Analisar" no topo para gerar o relatório forense</p>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
               <LogoFull className="mb-10" />
               <div className="max-w-3xl space-y-6">
                 <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">Analise vídeos, documentos e áudios com a potência do Gemini 2.5 Pro. Suporte nativo a ZIP e Google Drive.</p>
                 
                 <div className="pt-10 flex flex-wrap items-center justify-center gap-4">
                    <div className="px-6 py-3 bg-slate-100 rounded-full text-xs font-black uppercase text-slate-500 tracking-widest">Análise de Vídeo</div>
                    <div className="px-6 py-3 bg-slate-100 rounded-full text-xs font-black uppercase text-slate-500 tracking-widest">OCR Inteligente</div>
                    <div className="px-6 py-3 bg-slate-100 rounded-full text-xs font-black uppercase text-slate-500 tracking-widest">Extração de ZIP</div>
                 </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Configurações</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ambiente & Segurança</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>
            
            <div className="p-8 md:p-10 space-y-10">
              <div className="space-y-4">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Google Client ID (OAuth)</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="12345...apps.googleusercontent.com"
                  className="w-full px-6 py-5 rounded-3xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-mono text-sm shadow-inner bg-slate-50/50"
                />
              </div>

              <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <GlobeAltIcon className="w-20 h-20" />
                </div>
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-[0.3em]">URL Autorizada (Google Console)</p>
                <div className="flex items-center justify-between gap-6">
                  <code className="text-xs font-mono opacity-80 truncate bg-white/5 p-3 rounded-xl flex-grow">{window.location.origin}</code>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                    {copySuccess ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" /> : <ClipboardIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-[32px]">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Acesso API</p>
                   <p className={`text-xs font-black ${isApiPublic ? 'text-emerald-600' : 'text-amber-600'}`}>
                     {isApiPublic ? 'Público Liberado' : 'Acesso Restrito'}
                   </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px]">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Deploy Engine</p>
                   <p className="text-xs font-black text-slate-900">Vercel Edge</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
              >
                Salvar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
