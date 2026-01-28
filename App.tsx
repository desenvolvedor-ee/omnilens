
import React, { useState, useRef, useEffect } from 'react';
import { 
  CloudArrowUpIcon, VideoCameraIcon, DocumentTextIcon, MusicalNoteIcon, PhotoIcon,
  CheckCircleIcon, ExclamationCircleIcon, FolderOpenIcon, Cog6ToothIcon, 
  ClipboardIcon, TrashIcon, SparklesIcon, ChevronRightIcon, Bars3Icon, XMarkIcon,
  LockClosedIcon, GlobeAltIcon, EyeIcon, EyeSlashIcon, ServerIcon, CommandLineIcon
} from '@heroicons/react/24/outline';
import { extractAllFromZip, getFileCategory } from './services/zipService';
import { analyzeMultimodal, fileToBase64 } from './services/geminiService';
import { driveService } from './services/googleDriveService';
import { FileData, ProcessingState, UniversalReport } from './types';
import { LogoIcon, LogoFull } from './components/Logo';

// Logger System - Always active to terminal
const log = (msg: string, type: 'info' | 'error' | 'warn' | 'system' = 'info') => {
  const colors = { info: '#6366F1', error: '#EF4444', warn: '#F59E0B', system: '#10B981' };
  const label = type.toUpperCase();
  console.log(`%c[OmniLens ${label}] %c${msg}`, `color: ${colors[type]}; font-weight: 900; font-size: 10px;`, "color: inherit; font-weight: 500;");
};

export default function App() {
  const getEnv = (key: string) => (typeof process !== 'undefined' ? process.env[key] : '') || '';

  // Config States
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('omni_api_key') || getEnv('API_KEY'));
  const [clientId, setClientId] = useState(() => localStorage.getItem('omni_client_id') || getEnv('GOOGLE_CLIENT_ID'));
  const [showKey, setShowKey] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{api?: boolean, client?: boolean}>({});
  
  // App States
  const [fileList, setFileList] = useState<FileData[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle', progress: 0, message: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Feature Flags from Env
  const isApiPublic = getEnv('API_PUBLIC_ACCESS') === 'true';
  const turnstileEnabled = getEnv('TURNSTILE_ENABLED') === 'true';
  const cfSiteKey = getEnv('CF_SITE_KEY');
  const envFile = getEnv('ENV_FILE') || '.env';
  const logsFile = getEnv('LOGS_FILE') || 'terminal';

  useEffect(() => {
    log(`Sistema Inicializado. Config: ${envFile}`, 'system');
    log(`Logs direcionados para: ${logsFile}`, 'system');
    if (turnstileEnabled && !cfSiteKey) log("ALERTA: Turnstile habilitado mas CF_SITE_KEY não informada!", 'warn');
  }, []);

  const validateConfigs = (action: 'analyze' | 'drive') => {
    const errors: {api?: boolean, client?: boolean} = {};
    if (action === 'analyze' && !apiKey && !isApiPublic) errors.api = true;
    if (action === 'drive' && !clientId) errors.client = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShowSettings(true);
      log(`Bloqueio de ação: Faltam credenciais para ${action}`, 'warn');
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const saveSettings = (newKey: string, newId: string) => {
    localStorage.setItem('omni_api_key', newKey);
    localStorage.setItem('omni_client_id', newId);
    setApiKey(newKey);
    setClientId(newId);
    setFieldErrors({});
    log("Configurações salvas e aplicadas.");
  };

  const addFiles = async (files: File[]) => {
    log(`Recebendo ${files.length} arquivos...`);
    const newFiles: FileData[] = [];
    for (const f of files) {
      if (f.type === 'application/zip' || f.name.endsWith('.zip')) {
        setProcessingState({ status: 'extracting', progress: 0, message: `Extraindo ${f.name}...` });
        log(`Iniciando descompressão ZIP: ${f.name}`);
        const extracted = await extractAllFromZip(f);
        log(`ZIP extraído: ${extracted.length} arquivos válidos encontrados.`);
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
    setProcessingState({ status: 'idle', progress: 0, message: 'Pronto para análise.' });
  };

  const handleProcess = async () => {
    if (!validateConfigs('analyze')) return;
    
    if (turnstileEnabled && !turnstileToken) {
      log("Ação bloqueada: Validação Turnstile pendente.", "warn");
      alert("Por favor, valide o desafio de segurança (Turnstile) na barra lateral.");
      return;
    }

    setProcessingState({ 
      status: 'analyzing', progress: 0, 
      message: 'Iniciando motores de IA...', 
      totalFiles: fileList.length, 
      currentFileIndex: 0 
    });

    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].report) continue;
      const f = fileList[i];
      log(`Processando [${i+1}/${fileList.length}]: ${f.name}`);
      setProcessingState(prev => ({ ...prev, currentFileIndex: i + 1, message: `Analisando: ${f.name}` }));
      
      try {
        let parts: any[] = [];
        if (f.category === 'video') {
          log(`Capturando frames forenses de vídeo...`);
          const frames = await captureFramesForFile(f.url);
          parts = frames.map(fr => ({ inlineData: { mimeType: 'image/jpeg', data: fr.data.split(',')[1] } }));
        } else {
          const b64 = await fileToBase64(f.file);
          parts = [{ inlineData: { mimeType: f.mimeType || 'application/octet-stream', data: b64 } }];
        }

        const report = await analyzeMultimodal(parts, f.category, f.name, apiKey);
        setFileList(prev => {
          const updated = [...prev];
          updated[i].report = report;
          return updated;
        });
        log(`Relatório gerado com sucesso para ${f.name}`, 'system');
      } catch (err: any) {
        log(`Falha crítica na IA para ${f.name}: ${err.message}`, 'error');
        setProcessingState(prev => ({ ...prev, message: `Erro em ${f.name}` }));
      }
      setProcessingState(prev => ({ ...prev, progress: Math.floor(((i + 1) / fileList.length) * 100) }));
    }
    setProcessingState({ status: 'completed', progress: 100, message: 'Análise Concluída.' });
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
        for (let i = 0; i < v.duration && i < 20; i += 3) {
          v.currentTime = i;
          await new Promise(r => v.onseeked = r);
          ctx?.drawImage(v, 0, 0, c.width, c.height);
          frames.push({ data: c.toDataURL('image/jpeg', 0.5) });
        }
        resolve(frames);
      };
      v.onerror = reject;
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 flex flex-col selection:bg-indigo-100">
      <header className="glass-effect sticky top-0 z-[100] px-4 md:px-8 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <LogoIcon className="w-10 h-10" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tighter leading-none">OMNILENS</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.5 PRO INTELLIGENCE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (validateConfigs('drive')) {
                log("Abrindo seletor do Google Drive...");
                await driveService.connect(clientId, file => addFiles([file]));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm hover:border-indigo-300 transition-all"
          >
            <FolderOpenIcon className="w-4 h-4 text-blue-500" /> <span className="hidden sm:inline">Drive</span>
          </button>
          
          <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
            <Cog6ToothIcon className="w-5 h-5 text-slate-500" />
          </button>
          
          {fileList.length > 0 && (
            <button 
              onClick={handleProcess}
              disabled={processingState.status === 'analyzing'}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-black shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              Analisar {fileList.length}
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row max-w-[1920px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 border-r border-slate-100 p-6 flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Fluxo de Trabalho</h3>
             <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{fileList.length}</span>
           </div>

           <div className="flex-grow space-y-2 overflow-y-auto custom-scrollbar pr-1 pb-4">
             {fileList.map((f, idx) => (
               <div 
                 key={f.id}
                 onClick={() => setActiveFileIndex(idx)}
                 className={`p-3.5 rounded-2xl cursor-pointer border transition-all ${activeFileIndex === idx ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-50/50' : 'bg-white border-slate-100 hover:border-slate-300'}`}
               >
                 <div className="flex items-center gap-3">
                   <div className={activeFileIndex === idx ? 'text-indigo-600' : 'text-slate-400'}>
                     {f.category === 'video' && <VideoCameraIcon className="w-5 h-5" />}
                     {f.category === 'image' && <PhotoIcon className="w-5 h-5" />}
                     {f.category === 'audio' && <MusicalNoteIcon className="w-5 h-5" />}
                     {f.category === 'document' && <DocumentTextIcon className="w-5 h-5" />}
                   </div>
                   <div className="min-w-0 flex-grow">
                     <p className="text-xs font-bold truncate">{f.name}</p>
                     <p className="text-[9px] text-slate-400 uppercase font-black">{f.category}</p>
                   </div>
                   {f.report && <CheckCircleIcon className="w-4 h-4 text-emerald-500" />}
                 </div>
               </div>
             ))}
             
             <div className="relative group border-2 border-dashed border-slate-100 rounded-2xl p-6 hover:bg-slate-50 transition-all cursor-pointer text-center">
               <input type="file" multiple onChange={(e) => addFiles(Array.from(e.target.files || []))} className="absolute inset-0 opacity-0 cursor-pointer" />
               <div className="bg-slate-50 p-3 rounded-full w-fit mx-auto group-hover:bg-indigo-50 transition-colors">
                  <CloudArrowUpIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 block">Upload Local</span>
             </div>
           </div>

           <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
              {turnstileEnabled && cfSiteKey && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <LockClosedIcon className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Segurança Turnstile</span>
                  </div>
                  <div 
                    className="cf-turnstile w-full scale-90 origin-left" 
                    data-sitekey={cfSiteKey}
                    data-callback={(token: string) => { log("Turnstile validado com sucesso.", "system"); setTurnstileToken(token); }}
                  ></div>
                </div>
              )}

              {processingState.status !== 'idle' && (
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">IA Processing</span>
                    <span className="text-[10px] font-black">{processingState.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${processingState.progress}%` }} />
                  </div>
                  <p className="text-[9px] mt-3 opacity-60 font-bold truncate tracking-wide">{processingState.message}</p>
                </div>
              )}
           </div>
        </aside>

        {/* Content View */}
        <section className="flex-grow p-4 md:p-10 lg:overflow-y-auto custom-scrollbar">
           {activeFileIndex !== null ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                   <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-2xl">
                           <SparklesIcon className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <h2 className="text-lg md:text-xl font-black">{fileList[activeFileIndex].name}</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{(fileList[activeFileIndex].file.size / 1024 / 1024).toFixed(2)} MB • {fileList[activeFileIndex].mimeType}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = fileList.filter((_, i) => i !== activeFileIndex);
                          setFileList(updated);
                          setActiveFileIndex(updated.length > 0 ? 0 : null);
                        }}
                        className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all rounded-xl"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                   </div>
                   <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
                      {fileList[activeFileIndex].category === 'video' && <video className="w-full h-full object-contain" controls src={fileList[activeFileIndex].url} />}
                      {fileList[activeFileIndex].category === 'image' && <img className="w-full h-full object-contain" src={fileList[activeFileIndex].url} />}
                      {fileList[activeFileIndex].category === 'audio' && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 p-8">
                           <MusicalNoteIcon className="w-20 h-20 text-white/20 mb-6 animate-pulse" />
                           <audio controls src={fileList[activeFileIndex].url} className="w-full max-w-md filter invert opacity-80" />
                        </div>
                      )}
                      {fileList[activeFileIndex].category === 'document' && <iframe className="w-full h-full bg-white" src={fileList[activeFileIndex].url} />}
                   </div>
                </div>

                {fileList[activeFileIndex].report ? (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
                    <div className="xl:col-span-2 space-y-8">
                      <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm">
                        <h3 className="text-2xl font-black mb-8">Síntese de Inteligência</h3>
                        <p className="text-slate-600 leading-relaxed text-lg font-medium">{fileList[activeFileIndex].report?.summary}</p>
                        
                        <div className="mt-12 space-y-6">
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Linha do Tempo Tática</span>
                              <div className="h-px bg-slate-100 flex-grow" />
                           </div>
                           {fileList[activeFileIndex].report?.detailedAnalysis.map((item, idx) => (
                             <div key={idx} className="flex gap-6 group">
                               <div className="flex flex-col items-center">
                                 <div className="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                                 <div className="w-0.5 h-full bg-slate-100" />
                               </div>
                               <div className="pb-6">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{item.timestamp || '00:00'}</span>
                                    <div className="flex gap-1">
                                      {item.tags.map(t => <span key={t} className="text-[9px] font-black uppercase text-slate-400">#{t}</span>)}
                                    </div>
                                  </div>
                                  <p className="font-bold text-slate-800 leading-snug">{item.description}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8">
                       <div className="bg-[#1A1A2E] rounded-[40px] p-8 text-white shadow-2xl">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-8">Deep Insights</h4>
                          <ul className="space-y-6">
                            {fileList[activeFileIndex].report?.keyInsights.map((ki, i) => (
                              <li key={i} className="flex gap-4 text-sm font-bold leading-snug">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                <span className="opacity-80">{ki}</span>
                              </li>
                            ))}
                          </ul>
                       </div>
                       <div className="bg-indigo-50 rounded-[40px] p-8 border border-indigo-100">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-6">Entidades & Sentimento</h4>
                          <div className="flex flex-wrap gap-2">
                             {fileList[activeFileIndex].report?.entitiesFound.map(e => (
                               <span key={e} className="px-3 py-1 bg-white border border-indigo-200 text-[10px] font-black text-indigo-600 rounded-full">{e}</span>
                             ))}
                          </div>
                          {fileList[activeFileIndex].report?.sentiment && (
                            <div className="mt-6 pt-6 border-t border-indigo-200/30">
                               <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">Vibe do Conteúdo</p>
                               <p className="font-black text-indigo-900 text-lg uppercase tracking-tight">{fileList[activeFileIndex].report?.sentiment}</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                     <SparklesIcon className="w-16 h-16 text-indigo-200 mx-auto animate-pulse" />
                     <h3 className="text-xl font-black text-slate-900 mt-6 tracking-tight">Análise Forense Disponível</h3>
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">IA em espera. Clique em analisar para iniciar a varredura multimodal.</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center opacity-30 select-none pointer-events-none">
                <LogoFull />
             </div>
           )}
        </section>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/40">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black">Configurações Avançadas</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Hardware & Ambiente</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white rounded-full transition-colors"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                  <span>Gemini API Key</span>
                  {isApiPublic && <span className="text-emerald-500">Acesso Público Ativo</span>}
                </label>
                <div className="relative">
                  <input 
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className={`w-full px-5 py-3 rounded-2xl border bg-slate-50 font-mono text-sm outline-none focus:ring-4 transition-all ${fieldErrors.api ? 'field-error ring-red-50 border-red-200' : 'border-slate-100 focus:ring-indigo-100'}`}
                    placeholder="Cole sua chave aqui..."
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-3 text-slate-400">
                    {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Google Client ID (OAuth)</label>
                <input 
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="...apps.googleusercontent.com"
                  className={`w-full px-5 py-3 rounded-2xl border bg-slate-50 font-mono text-sm outline-none focus:ring-4 transition-all ${fieldErrors.client ? 'field-error ring-amber-50 border-amber-200' : 'border-slate-100 focus:ring-indigo-100'}`}
                />
              </div>

              <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-5">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <CommandLineIcon className="w-5 h-5 text-indigo-400" />
                     <span className="text-xs font-black uppercase tracking-widest">Environment Meta</span>
                   </div>
                   <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full font-black">LOGS ACTIVE</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-[10px] font-mono opacity-80">
                   <div className="space-y-1">
                      <p className="opacity-40 uppercase">Config File</p>
                      <p className="text-indigo-300 truncate">{envFile}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="opacity-40 uppercase">Log Target</p>
                      <p className="text-indigo-300 truncate">{logsFile}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="opacity-40 uppercase">Gatekeeper</p>
                      <p className={turnstileEnabled ? 'text-emerald-400' : 'text-slate-500'}>{turnstileEnabled ? 'Turnstile ON' : 'Turnstile OFF'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="opacity-40 uppercase">Visibility</p>
                      <p className={isApiPublic ? 'text-emerald-400' : 'text-amber-400'}>{isApiPublic ? 'PUBLIC' : 'RESTRICTED'}</p>
                   </div>
                 </div>
              </div>

              <button 
                onClick={() => { saveSettings(apiKey, clientId); setShowSettings(false); }}
                className="w-full bg-slate-900 text-white py-4 rounded-[20px] font-black shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                Salvar Configurações <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
