import React, { useState, useEffect, useRef } from 'react';
import {
  User, Key, FolderOpen, FileSignature, X, Search,
  Edit, Trash2, Plus, LogOut, Loader2, ExternalLink, UploadCloud,
  Users, Sparkles, BookOpen, Zap, Activity,
  Save, Settings, LayoutDashboard, Link as LinkIcon, Globe, Shield,
  ChevronLeft, ChevronRight, Copy, Check, BarChart3, Download, Megaphone, Radio, PieChart, Bell, BellRing, Send, MousePointer2,
  Calendar, FileText, Award, LifeBuoy, Filter, Download as DownloadIcon
} from 'lucide-react';
import Modal from './components/Modal';
import Certificate from './components/Certificate';

// --- ⚙️ CONFIGURACIÓN ---
const SYS_CONFIG = {
  GITHUB: {
    OWNER: "daniel-alt-pages",
    REPO: "credenciales-mini-2",
    DB_PATH: "public/estudiantes.json",
    CONFIG_PATH: "public/config.json",
    get API_URL() { return `https://api.github.com/repos/${this.OWNER}/${this.REPO}/contents`; },
    get RAW_BASE() { return `https://raw.githubusercontent.com/${this.OWNER}/${this.REPO}/main`; },
  },
  ADMIN_ACCESS_CODE: "202699",
  ASSETS: {
    // Fondo principal restaurado
    fondo: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aOtHLJ5xUNkB12hj_FONDO.svg",
    logoMain: "https://seamosgenios2026.cdn.prismic.io/seamosgenios2026/aR95sGGnmrmGqF-o_ServicesLogo.svg",
    defaultAvatar: "https://images.prismic.io/seamosgenios2026/aMSzIWGNHVfTPKS1_logosg.png?auto=format,compress"
  }
};

const DEFAULT_ACADEMIC_CONFIG = {
  links: { math: "#", lectura: "#", sociales: "#", naturales: "#", ingles: "#" },
  systemMessage: "Bienvenido al Sistema de Credenciales Digitales.",
  lastNotificationId: 0
};

// --- UTILIDADES ---
const utf8_to_b64 = (str) => window.btoa(unescape(encodeURIComponent(str)));
const cleanId = (id) => (!id ? "" : id.toString().replace(/[^a-zA-Z0-9]/g, ""));
const formatDate = () => new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

// --- COMPONENTE VISUAL: ESTELA DEL MOUSE (CANVAS OPTIMIZADO) ---
const MouseTrail = () => {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e) => {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, age: 0 });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const newPoints = [];

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < pointsRef.current.length; i++) {
        const point = pointsRef.current[i];
        point.age += 1;
        if (point.age > 25) continue; // Vida útil de la estela

        const opacity = 1 - point.age / 25;
        ctx.beginPath();
        ctx.arc(point.x, point.y, (25 - point.age) * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${opacity * 0.5})`; // Cyan-400
        ctx.fill();

        newPoints.push(point);
      }
      pointsRef.current = newPoints;
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9999] hidden md:block" />;
};

// --- SERVICIO GITHUB ---
const githubService = {
  async getFile(path) {
    try {
      const response = await fetch(`${SYS_CONFIG.GITHUB.RAW_BASE}/${path}?t=${Date.now()}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) { return null; }
  },

  async saveFile(path, content, message, token) {
    const url = `${SYS_CONFIG.GITHUB.API_URL}/${path}?t=${Date.now()}`;
    let sha = null;
    try {
      const getRes = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (getRes.ok) { const data = await getRes.json(); sha = data.sha; }
      else if (getRes.status !== 404) throw new Error(`Error verificando archivo (${getRes.status})`);
    } catch (e) { throw new Error(`Error de conexión: ${e.message}`); }

    const contentEncoded = utf8_to_b64(JSON.stringify(content, null, 4));
    const bodyData = { message, content: contentEncoded };
    if (sha) bodyData.sha = sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!res.ok) {
      let errMsg = res.statusText;
      try { const err = await res.json(); errMsg = err.message; } catch (e) { }
      throw new Error(`GitHub Error (${res.status}): ${errMsg}`);
    }
    return true;
  }
};

export default function App() {
  // 1. ESTADOS
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('sg_viewMode') || 'student');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('sg_adminToken') || '');
  const [database, setDatabase] = useState([]);
  const [academicConfig, setAcademicConfig] = useState(DEFAULT_ACADEMIC_CONFIG);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastSeenNotif, setLastSeenNotif] = useState(() => parseInt(localStorage.getItem('sg_last_notif_id') || '0'));
  const lastMessageRef = useRef("");

  const [formData, setFormData] = useState({ tipoDoc: 'T.I.', numeroDoc: '' });
  const [studentResult, setStudentResult] = useState(() => {
    const saved = localStorage.getItem('sg_studentResult');
    return saved ? JSON.parse(saved) : null;
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [activeFeature, setActiveFeature] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin Filters
  const [filterPlan, setFilterPlan] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // 2. CONSTANTES
  const SUBJECTS_UI = [
    { key: 'math', name: 'Matemáticas', icon: <Activity size={20} />, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50' },
    { key: 'lectura', name: 'Lectura Crítica', icon: <BookOpen size={20} />, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50' },
    { key: 'sociales', name: 'C. Ciudadanas', icon: <Users size={20} />, color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50' },
    { key: 'naturales', name: 'C. Naturales', icon: <Zap size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50' },
    { key: 'ingles', name: 'Inglés', icon: <Sparkles size={20} />, color: 'text-pink-400', bg: 'bg-pink-900/30', border: 'border-pink-500/50' },
  ];

  const FEATURES_UI = [
    { key: 'horario', name: 'Horario', icon: <Calendar size={24} />, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30', desc: 'Ver programación' },
    { key: 'boletin', name: 'Boletín', icon: <FileText size={24} />, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30', desc: 'Notas parciales' },
    { key: 'certificados', name: 'Certificados', icon: <Award size={24} />, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', desc: 'Solicitar documentos' },
  ];

  const PLAN_DETAILS = {
    "Plan Basico": {
      price: "$8.000 COP",
      features: [
        "Mini Simulacro: Pon a prueba tus conocimientos con preguntas de alta calidad."
      ]
    },
    "Plan Intermedio": {
      price: "$15.000 COP",
      features: [
        "Todo lo del Plan Básico",
        "Calificación global y percentiles: Conoce tu posición frente a otros aspirantes.",
        "Análisis detallado: Identifica tus fortalezas y áreas de mejora."
      ]
    },
    "Plan Premium": {
      price: "$20.000 COP",
      features: [
        "Todo lo del Plan Intermedio",
        "Plan de estudio personalizado: Una guía adaptada a tus necesidades.",
        "Retroalimentación en vivo: Resuelve tus dudas con expertos.",
        "¡BONO ESPECIAL! Acceso a la semana de pre-inducción con clases en vivo."
      ]
    }
  };

  const safeDB = database || [];
  const activeCount = safeDB.filter(s => s.estado === 'Activo').length;
  const plansDistribution = safeDB.reduce((acc, curr) => {
    const plan = curr.plan || 'Sin Plan';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  // 3. EFECTOS
  useEffect(() => {
    localStorage.setItem('sg_viewMode', viewMode);
    localStorage.setItem('sg_adminToken', adminToken);
  }, [viewMode, adminToken]);

  useEffect(() => {
    if (studentResult) {
      localStorage.setItem('sg_studentResult', JSON.stringify(studentResult));
    } else {
      localStorage.removeItem('sg_studentResult');
    }
  }, [studentResult]);

  useEffect(() => {
    loadSystemData();
    if ("Notification" in window && Notification.permission === "granted") setNotificationsEnabled(true);
  }, []);

  useEffect(() => {
    if (viewMode === 'student' && notificationsEnabled) {
      const interval = setInterval(async () => {
        const remoteConfig = await githubService.getFile(SYS_CONFIG.GITHUB.CONFIG_PATH);
        if (remoteConfig && remoteConfig.lastNotificationId && remoteConfig.lastNotificationId > lastSeenNotif) {
          showNotification("📢 Nuevo Anuncio", remoteConfig.systemMessage);
          setLastSeenNotif(remoteConfig.lastNotificationId);
          localStorage.setItem('sg_last_notif_id', remoteConfig.lastNotificationId);
          setAcademicConfig(remoteConfig);
        }
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [viewMode, notificationsEnabled, lastSeenNotif]);

  const loadSystemData = async () => {
    try {
      const [dbData, configData] = await Promise.all([
        githubService.getFile(SYS_CONFIG.GITHUB.DB_PATH),
        githubService.getFile(SYS_CONFIG.GITHUB.CONFIG_PATH)
      ]);
      setDatabase(dbData || []);
      if (configData) setAcademicConfig(configData);
      setUnsavedChanges(false);
    } catch (err) { console.error(err); }
  };

  // 4. HANDLERS
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return alert("Navegador no compatible.");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      new Notification("Sistema Conectado", { body: "Notificaciones activadas exitosamente.", icon: SYS_CONFIG.ASSETS.logoMain });
    }
  };

  const showNotification = (title, body) => {
    if (Notification.permission === "granted") {
      try { new Notification(title, { body, icon: SYS_CONFIG.ASSETS.logoMain }); } catch (e) { }
    }
  };

  const handleConfigChange = (area, value) => {
    setAcademicConfig(prev => ({ ...prev, links: { ...prev.links, [area]: value } }));
    setUnsavedChanges(true);
  };

  const handleBroadcastMessage = async () => {
    if (!adminToken) return alert("Falta Token Admin");
    if (!confirm("¿ENVIAR NOTIFICACIÓN MASIVA?")) return;
    setIsSaving(true);
    try {
      const newConfig = { ...academicConfig, lastNotificationId: Date.now() };
      await githubService.saveFile(SYS_CONFIG.GITHUB.CONFIG_PATH, newConfig, "Broadcast Message", adminToken);
      setAcademicConfig(newConfig);
      setUnsavedChanges(false);
      alert("🚀 Mensaje Enviado");
    } catch (error) { alert("Error: " + error.message); }
    finally { setIsSaving(false); }
  };

  const handleLocalSaveStudent = (e) => {
    e.preventDefault();
    const form = e.target;
    const newStudent = {
      nombre: form.nombre.value.toUpperCase(),
      tipoDoc: form.tipoDoc.value,
      id: form.id.value,
      email: form.email.value,
      plan: form.plan.value,
      estado: form.estado.value,
      fechaPago: form.fechaPago.value || "Pendiente",
      url_carpeta: form.url_carpeta.value || "#"
    };

    let updatedDB;
    if (editingStudent) {
      updatedDB = database.map(s => s === editingStudent ? newStudent : s);
    } else {
      if (database.some(s => cleanId(s.id) === cleanId(newStudent.id))) { alert("ID duplicado"); return; }
      updatedDB = [...database, newStudent];
    }
    setDatabase(updatedDB);
    setUnsavedChanges(true);
    setShowModal(false);
  };

  const handleLocalDelete = (student) => {
    if (confirm(`¿Borrar a ${student.nombre}?`)) {
      setDatabase(database.filter(s => s !== student));
      setUnsavedChanges(true);
    }
  };

  const saveAllChanges = async () => {
    if (!adminToken) return alert("Falta Token");
    setIsSaving(true);
    try {
      await githubService.saveFile(SYS_CONFIG.GITHUB.DB_PATH, database, "Update DB", adminToken);
      await new Promise(r => setTimeout(r, 1000));
      if (unsavedChanges) await githubService.saveFile(SYS_CONFIG.GITHUB.CONFIG_PATH, academicConfig, "Update Config", adminToken);
      setUnsavedChanges(false);
      alert("✅ Guardado Correcto");
    } catch (error) { console.error(error); alert("Error al guardar: " + error.message); }
    finally { setIsSaving(false); }
  };

  const exportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(database, null, 2));
    const link = document.createElement('a');
    link.href = dataStr; link.download = "backup.json"; link.click();
  };

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { if (document.execCommand('copy')) { setCopiedId(text); setTimeout(() => setCopiedId(null), 2000); } } catch (err) { }
    document.body.removeChild(textArea);
  };

  const handleStudentVerify = (e) => {
    e.preventDefault();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(p => { if (p === "granted") setNotificationsEnabled(true); });
    }
    const code = formData.numeroDoc.trim();
    if (!code) return;
    if (code === SYS_CONFIG.ADMIN_ACCESS_CODE) { setViewMode('login'); setFormData({ ...formData, numeroDoc: '' }); return; }
    setSearchLoading(true); setSearchError(''); setStudentResult(null);
    const inputClean = cleanId(code);
    setTimeout(() => {
      const found = database.find(s => cleanId(s.id) === inputClean);
      if (found) {
        if (found.estado?.toLowerCase() === "revocado") setSearchError("ACCESO DENEGADO");
        else setStudentResult(found);
      } else { setSearchError("NO ENCONTRADO"); }
      setSearchLoading(false);
    }, 800);
  };

  // 5. VISTAS (RENDERING)
  return (
    <div className="min-h-screen w-full font-sans text-slate-200 bg-[#020617] relative flex flex-col items-center justify-center overflow-x-hidden">

      {/* BACKGROUND GLOBAL FIXED */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10"></div> {/* Overlay para contraste */}
        <img src={SYS_CONFIG.ASSETS.fondo} className="w-full h-full object-cover opacity-50" alt="Fondo" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 z-20"></div>
      </div>

      <MouseTrail />

      {/* --- VISTA LOGIN --- */}
      {viewMode === 'login' && (
        <div className="relative z-10 bg-slate-900/70 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.1)] max-w-md w-full animate-fade-in neon-container">
          <img src={SYS_CONFIG.ASSETS.logoMain} className="h-16 w-auto mx-auto mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          <h2 className="text-xl font-bold text-white mb-8 flex items-center justify-center gap-3 tracking-widest text-shadow-white"><Shield className="text-white animate-pulse" /> NEXUS ADMIN</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (adminToken) setViewMode('admin'); }} className="space-y-6">
            <div className="group relative">
              <Key className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-white transition-colors" size={20} />
              <input type="password" className="w-full bg-black/40 border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white focus:border-white/60 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] outline-none transition-all" placeholder="Access Token" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all tracking-wide">INICIAR SISTEMA</button>
            <button type="button" onClick={() => setViewMode('student')} className="w-full text-slate-400 text-xs hover:text-white transition-colors">REGRESAR AL PORTAL PÚBLICO</button>
          </form>
        </div>
      )}

      {/* --- VISTA ADMIN --- */}
      {viewMode === 'admin' && (
        <div className="relative z-10 w-full h-screen flex flex-col bg-black/80 backdrop-blur-sm">
          <header className="bg-slate-900/90 border-b border-white/10 px-6 py-3 flex justify-between items-center sticky top-0 z-30 neon-border-bottom">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white"><Settings size={24} /></button>
              <img src={SYS_CONFIG.ASSETS.logoMain} className="h-8 w-auto" />
              <span className="font-mono text-white text-xs tracking-[0.2em] border-l border-white/20 pl-4 hidden md:block">SYSTEM v8.0</span>
            </div>
            <div className="flex items-center gap-3">
              {unsavedChanges && <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest animate-pulse hidden md:block">⚠ Cambios pendientes</span>}
              <button onClick={saveAllChanges} disabled={!unsavedChanges || isSaving} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border ${unsavedChanges ? 'bg-white text-black hover:bg-slate-200' : 'border-slate-700 text-slate-500'}`}>{isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} <span className="hidden md:inline">{isSaving ? 'SYNCING...' : 'GUARDAR'}</span></button>
              <button onClick={() => { setViewMode('student'); setAdminToken(''); }} className="bg-slate-800 hover:bg-red-900/50 border border-slate-700 text-slate-400 hover:text-red-200 px-3 py-2 rounded-lg transition-all"><LogOut size={16} /></button>
            </div>
          </header>
          <div className="flex flex-grow overflow-hidden relative">
            {/* Mobile Overlay */}
            {mobileMenuOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}

            <aside className={`bg-slate-950/90 border-r border-white/10 flex-col transition-all duration-300 
              fixed inset-y-0 left-0 z-50 w-64 p-4 md:relative md:flex
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              ${sidebarCollapsed ? 'md:w-20 md:items-center md:py-6' : 'md:w-64 md:p-4'}
            `}>
              <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-bold text-slate-500 md:hidden">MENU</span>
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-slate-500 hover:text-white hidden md:block">{sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-white md:hidden"><X size={20} /></button>
              </div>
              <nav className="space-y-2 w-full">
                {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Métricas' }, { id: 'students', icon: Users, label: 'Estudiantes' }, { id: 'config', icon: Settings, label: 'Configuración' }].map((item) => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center gap-4 transition-all ${activeTab === item.id ? 'bg-white/10 text-white border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-slate-500 hover:text-white'}`}>
                    <item.icon size={20} className="min-w-[20px]" />
                    <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'}`}>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
            <main className="flex-grow p-6 overflow-y-auto custom-scrollbar">
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 neon-container hover:border-white/30 transition-all"><h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Base de Datos</h3><p className="text-4xl font-mono font-bold text-white">{safeDB.length}</p></div>
                  <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 neon-container hover:border-white/30 transition-all"><h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Usuarios Activos</h3><p className="text-4xl font-mono font-bold text-emerald-400">{activeCount}</p></div>
                  <div className="md:col-span-2 lg:col-span-2 bg-slate-900/60 p-6 rounded-2xl border border-white/10 neon-container"><h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Distribución</h3><div className="space-y-3">{Object.entries(plansDistribution).reduce((a, c, i, arr) => i < 4 ? [...a, c] : a, []).map(([plan, count]) => (<div key={plan} className="flex items-center gap-3 text-xs"><span className="w-24 truncate text-slate-300 font-bold">{plan}</span><div className="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-white" style={{ width: `${(count / safeDB.length) * 100}%`, boxShadow: '0 0 10px white' }}></div></div><span className="text-white font-mono">{count}</span></div>))}</div></div>
                </div>
              )}
              {activeTab === 'students' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 neon-container">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                      <input type="text" placeholder="Buscar por nombre o ID..." className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-white/50 text-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                      <select className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-white/50" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
                        <option value="Todos">Todos los Planes</option>
                        <option value="Plan Basico">Plan Básico</option>
                        <option value="Plan Intermedio">Plan Intermedio</option>
                        <option value="Plan Premium">Plan Premium</option>
                      </select>
                      <select className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-white/50" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="Todos">Todos los Estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Revocado">Revocado</option>
                      </select>
                      <button onClick={() => { setEditingStudent(null); setShowModal(true); }} className="bg-white text-black px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-slate-200 transition-all flex items-center gap-2 whitespace-nowrap"><Plus size={18} /> <span className="hidden md:inline">Nuevo</span></button>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden neon-container flex flex-col h-[calc(100vh-280px)]">
                    <div className="overflow-auto custom-scrollbar flex-grow">
                      <table className="w-full text-left text-sm whitespace-nowrap relative">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-widest font-bold sticky top-0 z-10 shadow-md">
                          <tr>
                            <th className="p-4 bg-slate-950">Estudiante</th>
                            <th className="p-4 bg-slate-950">ID</th>
                            <th className="p-4 bg-slate-950">Plan</th>
                            <th className="p-4 bg-slate-950">Estado</th>
                            <th className="p-4 bg-slate-950 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {safeDB.filter(s => {
                            const matchesSearch = s.nombre.includes(searchTerm.toUpperCase()) || s.id.includes(searchTerm);
                            const matchesPlan = filterPlan === 'Todos' || s.plan === filterPlan;
                            const matchesStatus = filterStatus === 'Todos' || s.estado === filterStatus;
                            return matchesSearch && matchesPlan && matchesStatus;
                          }).map(s => (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-4 font-bold text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] border border-white/10">{s.nombre.charAt(0)}</div>
                                {s.nombre}
                              </td>
                              <td className="p-4 font-mono text-cyan-300 opacity-80 group-hover:opacity-100">{s.id}</td>
                              <td className="p-4 text-slate-300"><span className="px-2 py-1 rounded-md bg-white/5 text-[10px] border border-white/5">{s.plan}</span></td>
                              <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${s.estado === 'Activo' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>{s.estado}</span></td>
                              <td className="p-4 text-right">
                                <button onClick={() => { setEditingStudent(s); setShowModal(true); }} className="text-blue-400 p-2 hover:bg-blue-900/30 rounded-lg transition-colors mr-2"><Edit size={14} /></button>
                                <button onClick={() => handleLocalDelete(s)} className="text-red-400 p-2 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                          {safeDB.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay estudiantes registrados.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 bg-black/20 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center">
                      <span>Mostrando resultados filtrados</span>
                      <span>Total Registros: {safeDB.length}</span>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'config' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
                  <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 neon-container">
                    <div className="flex items-center gap-4 mb-6"><Megaphone className="text-white" size={24} /><div><h3 className="text-lg font-bold text-white">Broadcast System</h3><p className="text-xs text-slate-400">Envía notificaciones globales.</p></div></div>
                    <div className="relative space-y-4"><textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-white/50 outline-none transition-all min-h-[100px] resize-none" value={academicConfig.systemMessage || ''} onChange={(e) => { setAcademicConfig(p => ({ ...p, systemMessage: e.target.value })); setUnsavedChanges(true); }} placeholder="Mensaje..." /><div className="flex justify-end"><button onClick={handleBroadcastMessage} disabled={isSaving} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform">{isSaving ? <Loader2 className="animate-spin" /> : <Send />} ENVIAR</button></div></div>
                  </div>
                  <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 neon-container">
                    <div className="flex items-center gap-4 mb-6"><Globe className="text-white" size={24} /><div><h3 className="text-lg font-bold text-white">Links Académicos</h3></div></div>
                    <div className="grid gap-4">{SUBJECTS_UI.map((sub) => (<div key={sub.key} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/30 transition-all"><div className={`p-3 rounded-lg ${sub.bg} ${sub.color}`}>{sub.icon}</div><div className="flex-grow"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-wider">{sub.name}</label><input type="text" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 font-mono" value={academicConfig.links[sub.key] || ''} onChange={(e) => handleConfigChange(sub.key, e.target.value)} placeholder="https://..." /></div></div>))}</div>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* MODAL ADMIN */}
          {showModal && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-lg p-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative neon-container">
                <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-bold text-white tracking-wide">{editingStudent ? 'EDITAR' : 'NUEVO'}</h3><button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button></div>
                <form onSubmit={handleLocalSaveStudent} className="space-y-5">
                  <div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold uppercase">Nombre</label><input name="nombre" defaultValue={editingStudent?.nombre} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white uppercase focus:border-white/50 outline-none" required /></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold uppercase">ID</label><input name="id" defaultValue={editingStudent?.id} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-white/50 outline-none" required /></div><div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold uppercase">Tipo</label><select name="tipoDoc" defaultValue={editingStudent?.tipoDoc || "T.I."} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"><option>T.I.</option><option>C.C.</option></select></div></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold uppercase">Plan</label><input name="plan" defaultValue={editingStudent?.plan || "Plan Básico"} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none" /></div><div className="space-y-1"><label className="text-[10px] text-slate-400 font-bold uppercase">Estado</label><select name="estado" defaultValue={editingStudent?.estado || "Activo"} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none"><option>Activo</option><option>Revocado</option></select></div></div>
                  <div className="space-y-1"><label className="text-[10px] text-cyan-400 font-bold uppercase">Link Drive</label><input name="url_carpeta" defaultValue={editingStudent?.url_carpeta} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-cyan-400 font-mono text-xs outline-none focus:border-cyan-500" /></div>
                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10"><button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white px-4 py-2 text-xs font-bold uppercase">Cancelar</button><button type="submit" className="bg-white text-black px-8 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform text-xs">GUARDAR</button></div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- VISTA STUDENT (NEON EDITION) --- */}
      {!studentResult && viewMode === 'student' && (
        <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.1)] max-w-md w-full text-center animate-fade-in neon-container">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-black/40 border border-white/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin-slow opacity-70"></div>
            <img src={SYS_CONFIG.ASSETS.logoMain} className="h-12 w-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          </div>
          {academicConfig.systemMessage && (<div className="mb-6 p-3 bg-white/5 border border-white/20 rounded-lg text-xs text-white flex items-center gap-2 justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)]"><Megaphone size={14} className="animate-bounce text-cyan-300" /> {academicConfig.systemMessage}</div>)}
          <h1 className="text-2xl font-bold text-white mb-2 tracking-widest text-shadow-white">ACCESO ESTUDIANTIL</h1>
          <p className="text-slate-300 text-xs mb-8 uppercase tracking-widest opacity-80">Identifíquese para continuar</p>
          <form onSubmit={handleStudentVerify} className="space-y-5">
            <div className="flex gap-2">
              <select className="bg-black/40 border border-white/20 rounded-xl px-3 py-3 text-white text-xs font-bold outline-none focus:border-white/60"><option>T.I.</option><option>C.C.</option></select>
              <input type="number" placeholder="NÚMERO DE DOCUMENTO" className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/60 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all font-mono placeholder:text-slate-500" value={formData.numeroDoc} onChange={(e) => setFormData({ ...formData, numeroDoc: e.target.value })} />
            </div>
            <button disabled={searchLoading} className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-slate-200 transition-all active:scale-95 tracking-widest text-xs">{searchLoading ? 'PROCESANDO...' : 'VERIFICAR CREDENCIAL'}</button>
          </form>
          {searchError && <div className="mt-6 text-red-300 text-[10px] font-bold bg-red-900/20 p-3 rounded-lg border border-red-500/30 flex items-center gap-2 justify-center uppercase tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.2)]"><Shield size={14} /> {searchError}</div>}
        </div>
      )}

      {studentResult && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-slate-900/80 rounded-3xl shadow-[0_0_80px_rgba(255,255,255,0.15)] flex flex-col max-h-[95vh] border border-white/10 neon-container overflow-hidden">
            <button onClick={() => setStudentResult(null)} className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white transition-colors bg-black/40 p-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-red-500/20"><X size={24} /></button>
            <div className="flex flex-col md:flex-row w-full overflow-y-auto custom-scrollbar min-h-0 md:min-h-[600px]">
              <div className="md:w-2/5 bg-black/40 p-6 md:p-10 flex flex-col items-center text-center relative overflow-hidden justify-center border-b md:border-b-0 md:border-r border-white/5 shrink-0">
                <div className="relative mb-8 group cursor-default">
                  <div className="absolute -inset-4 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full p-1 bg-gradient-to-b from-slate-800 to-black relative z-10 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <img src={SYS_CONFIG.ASSETS.defaultAvatar} className="w-full h-full object-contain rounded-full bg-white/5" />
                  </div>
                  {/* ANILLOS ROTATORIOS CSS */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute -inset-2 rounded-full border border-cyan-500/20 border-b-transparent animate-spin-slow" style={{ animationDuration: '7s', animationDirection: 'reverse' }}></div>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] break-words">{studentResult.nombre}</h2>
                <div className="w-full border-t border-white/10 my-6"></div>
                <div className="grid grid-cols-1 gap-4 w-full">
                  <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/10 hover:border-white/30 transition-all cursor-pointer group" onClick={() => copyToClipboard(studentResult.id)} title="Copiar ID">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 flex justify-between">Credencial ID <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" /></p>
                    <p className="text-xl font-mono text-cyan-300 tracking-wider group-hover:text-white transition-colors">{studentResult.id}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex-1 relative group cursor-pointer" onClick={() => setShowPlanDetails(true)}>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-2">Plan <LifeBuoy size={10} className="text-cyan-400 animate-pulse" /></p>
                      <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{studentResult.plan}</p>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={12} className="text-cyan-400" /></div>
                    </div>
                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex-1"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Estado</p><p className={`text-sm font-bold ${studentResult.estado === 'Activo' ? 'text-emerald-400' : 'text-red-400'}`}>{studentResult.estado}</p></div>
                  </div>
                </div>
              </div>
              <div className="md:w-3/5 p-6 md:p-12 bg-transparent relative shrink-0">
                <div className="mb-10 flex justify-between items-start">
                  <div><h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-wide text-shadow-white"><LayoutDashboard className="text-white" /> PANEL DE CONTROL</h3><p className="text-slate-400 text-sm mt-2">Acceso a recursos asignados.</p></div>
                  <button onClick={requestNotificationPermission} className={`p-3 rounded-full border transition-all ${notificationsEnabled ? 'bg-white/10 border-white/30 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-transparent border-slate-700 text-slate-500 hover:text-white'}`} title={notificationsEnabled ? "Notificaciones Activas" : "Activar Alertas"}>{notificationsEnabled ? <BellRing size={20} /> : <Bell size={20} />}</button>
                </div>
                {academicConfig.systemMessage && (<div className="mb-8 p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-l-4 border-white rounded-r-lg flex items-start gap-4 shadow-[0_0_20px_rgba(147,51,234,0.2)]"><Megaphone className="text-white shrink-0 mt-1" /><div><h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Anuncio del Sistema</h4><p className="text-slate-200 text-sm leading-relaxed">{academicConfig.systemMessage}</p></div></div>)}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 1. REPOSITORIO DIGITAL (Large Card) */}
                  <a href={studentResult.url_carpeta} target="_blank" className="col-span-2 md:col-span-2 flex items-center gap-6 p-6 bg-black/30 rounded-2xl border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-900/20 shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all group relative overflow-hidden h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-4 bg-slate-800 rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform shadow-inner relative z-10"><FolderOpen size={28} /></div>
                    <div className="relative z-10"><h4 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors break-words">Repositorio</h4><p className="text-xs text-slate-400 mt-1 break-words">Material de estudio</p></div>
                    <ExternalLink size={20} className="ml-auto text-slate-600 group-hover:text-cyan-400 relative z-10" />
                  </a>

                  {/* 2. EVALUACIONES (Large Card) */}
                  <button onClick={() => setShowSubjectModal(true)} className="col-span-2 md:col-span-2 flex items-center gap-6 p-6 bg-black/30 rounded-2xl border border-white/10 hover:border-purple-400/50 hover:bg-purple-900/20 shadow-lg hover:shadow-[0_0_20px_rgba(192,132,252,0.2)] transition-all group text-left w-full relative overflow-hidden h-32">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-4 bg-slate-800 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform shadow-inner relative z-10"><FileSignature size={28} /></div>
                    <div className="relative z-10"><h4 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors break-words">Evaluaciones</h4><p className="text-xs text-slate-400 mt-1 break-words">Simulacros online</p></div>
                    <ChevronRight size={20} className="ml-auto text-slate-600 group-hover:text-purple-400 relative z-10" />
                  </button>

                  {/* 3. NEW FEATURES GRID (Small Cards) */}
                  {FEATURES_UI.map((feat) => (
                    <button
                      key={feat.key}
                      onClick={() => {
                        if (feat.key === 'certificados') setShowCertificate(true);
                        else setActiveFeature(feat);
                      }}
                      className={`col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/20 transition-all group relative overflow-hidden h-32`}
                    >
                      <div className={`mb-3 p-3 rounded-xl ${feat.bg} ${feat.color} group-hover:scale-110 transition-transform`}>{feat.icon}</div>
                      <h4 className="text-sm font-bold text-white mb-1">{feat.name}</h4>
                    </button>
                  ))}

                  {/* Empty slot filler if needed or support button */}
                  <button onClick={() => setActiveFeature({ name: 'Soporte', icon: <LifeBuoy />, bg: 'bg-slate-800', color: 'text-slate-300' })} className="col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/20 transition-all group relative overflow-hidden h-32">
                    <div className="mb-3 p-3 rounded-xl bg-slate-800 text-slate-400 group-hover:scale-110 transition-transform"><LifeBuoy size={24} /></div>
                    <h4 className="text-sm font-bold text-slate-400 mb-1">Ayuda</h4>
                  </button>
                </div>
                <div className="absolute bottom-8 right-12 text-[10px] text-slate-600 font-mono uppercase tracking-widest">Secure Connection • {formatDate()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl border border-white/20 w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)] relative neon-container">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40"><h3 className="text-lg font-bold text-white tracking-wide">SELECCIONAR MÓDULO</h3><button onClick={() => setShowSubjectModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button></div>
            <div className="p-6 grid grid-cols-1 gap-3">
              {SUBJECTS_UI.map((sub) => {
                const link = academicConfig.links[sub.key];
                const hasLink = link && link !== '#' && link !== '';

                return (
                  <button
                    key={sub.key}
                    onClick={() => {
                      if (hasLink) window.open(link, '_blank');
                      else setActiveFeature({ name: sub.name, icon: sub.icon, bg: sub.bg, color: sub.color });
                    }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] group bg-black/20 border-white/5 hover:border-white/30 hover:bg-white/5 w-full text-left`}
                  >
                    <div className={`p-3 rounded-lg shadow-inner bg-slate-950 ${sub.color}`}>{sub.icon}</div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-slate-200 text-sm group-hover:text-white">{sub.name}</h4>
                      <p className="text-[10px] text-slate-500 opacity-70 font-mono">
                        {hasLink ? 'Acceso Disponible' : 'No habilitado'}
                      </p>
                    </div>
                    {hasLink ? <ExternalLink size={16} className="text-slate-500 group-hover:text-white" /> : <LifeBuoy size={16} className="text-slate-700" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )
      }

      {/* MODAL GENÉRICO PARA NUEVAS SECCIONES */}
      <Modal
        isOpen={!!activeFeature}
        onClose={() => setActiveFeature(null)}
        title={activeFeature?.name || 'Información'}
      >
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className={`p-6 rounded-full ${activeFeature?.bg} ${activeFeature?.color} mb-4`}>
            {activeFeature?.icon}
          </div>
          <h4 className="text-lg font-bold text-white">Próximamente</h4>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Estamos trabajando para habilitar la sección de <span className="text-white font-bold">{activeFeature?.name}</span>.
            Muy pronto podrás acceder a este contenido.
          </p>
          <button onClick={() => setActiveFeature(null)} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold text-white transition-colors">
            Entendido
          </button>
        </div>
      </Modal>

      {/* MODAL DETALLES DEL PLAN */}
      <Modal
        isOpen={showPlanDetails}
        onClose={() => setShowPlanDetails(false)}
        title={`Beneficios: ${studentResult?.plan}`}
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Award size={100} className="text-white" /></div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">{studentResult?.plan}</h3>
            <p className="text-cyan-400 font-mono text-xl font-bold">{PLAN_DETAILS[studentResult?.plan]?.price || 'Consultar Precio'}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">Incluye:</h4>
            <ul className="space-y-3">
              {PLAN_DETAILS[studentResult?.plan]?.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              )) || <li className="text-slate-500 italic">Información no disponible para este plan.</li>}
            </ul>
          </div>

          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-slate-500 mb-3">¿Deseas mejorar tu plan?</p>
            <a href="https://wa.me/573008871908" target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-green-500/20">
              <Megaphone size={16} /> Contactar Asesor
            </a>
          </div>
        </div>
      </Modal>

      {/* CERTIFICADO */}
      {
        showCertificate && studentResult && (
          <Certificate
            student={studentResult}
            onClose={() => setShowCertificate(false)}
          />
        )
      }

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } } 
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        
        /* NEON GLOW CLASSES */
        .neon-container {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 20px rgba(255,255,255,0.02);
            border: 1px solid rgba(255, 255, 255, 0.15);
            animation: border-pulse 4s infinite alternate;
        }
        .neon-border-bottom {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .text-shadow-white {
            text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        @keyframes border-pulse {
            0% { border-color: rgba(255, 255, 255, 0.15); box-shadow: 0 0 15px rgba(255,255,255,0.05); }
            100% { border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 0 25px rgba(255,255,255,0.15); }
        }
        .font-sans { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div >
  );
}
