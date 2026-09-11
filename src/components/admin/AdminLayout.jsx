import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mountain, LogOut, Plus, Database, List, Bell, KeyRound,
  CheckCircle2, AlertCircle, AlertTriangle, X, LayoutDashboard,
  UserCheck, ChevronDown, Compass, MapPin, Sparkles, ExternalLink,
  PanelLeftClose, PanelLeftOpen, Menu, Bus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePlaces } from '../../contexts/PlacesContext';
import { useEvents } from '../../contexts/EventsContext';
import AdminDashboard from './AdminDashboard';
import PlacesList from './PlacesList';
import PlaceForm from './PlaceForm';
import DataExport from './DataExport';
import EventsManager from './EventsManager';
import AdminMapManager from './AdminMapManager';
import TransitList from './TransitList';
import { getLiveTransitLinesGeoJSON, GEODATA_UPDATED_EVENT } from '../../data/mapGeoData';
import { API_BASE_URL } from '../../utils/constants';

export default function AdminLayout() {
  // Pestañas principales unificadas (6 módulos sin redundancia)
  // 'dashboard' | 'places' | 'transit' | 'map-editor' | 'events' | 'database'
  const [view, setView] = useState('dashboard');
  const [editingPlace, setEditingPlace] = useState(null);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const [activeTransitIdForMap, setActiveTransitIdForMap] = useState(null);

  // Barra lateral desplegable (Desktop colapsable, Mobile drawer)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [changingPass, setChangingPass] = useState(false);

  // Sistema de Notificaciones Toast Animadas (Framer Motion)
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const { logout, adminUser, isBackendConnected, changePassword } = useAuth();
  const { places } = usePlaces();
  const { activeEvents } = useEvents();
  const { t } = useLanguage();

  const [transitCount, setTransitCount] = useState(() => {
    return getLiveTransitLinesGeoJSON()?.features?.length || 0;
  });

  const syncTransitCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/transit`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.features)) {
          setTransitCount(data.features.length);
          return;
        } else if (Array.isArray(data)) {
          setTransitCount(data.length);
          return;
        }
      }
    } catch (e) {}
    const live = getLiveTransitLinesGeoJSON();
    setTransitCount(live?.features?.length || 0);
  }, []);

  useEffect(() => {
    syncTransitCount();
    window.addEventListener(GEODATA_UPDATED_EVENT, syncTransitCount);
    window.addEventListener('storage', syncTransitCount);
    return () => {
      window.removeEventListener(GEODATA_UPDATED_EVENT, syncTransitCount);
      window.removeEventListener('storage', syncTransitCount);
    };
  }, [syncTransitCount]);

  const handleNavigate = (target) => {
    setIsMobileDrawerOpen(false);
    if (target === 'add') {
      setView('places');
      setIsCreatingPlace(true);
      setEditingPlace(null);
    } else if (target === 'list' || target === 'places') {
      setView('places');
      setIsCreatingPlace(false);
      setEditingPlace(null);
    } else if (target === 'transit') {
      setView('transit');
      setIsCreatingPlace(false);
      setEditingPlace(null);
    } else if (target === 'map-editor') {
      setView('map-editor');
      setActiveTransitIdForMap(null);
      setIsCreatingPlace(false);
      setEditingPlace(null);
    } else if (target === 'export' || target === 'database') {
      setView('database');
      setIsCreatingPlace(false);
      setEditingPlace(null);
    } else {
      setView(target);
      setIsCreatingPlace(false);
      setEditingPlace(null);
    }
  };

  const handleEditPlace = (place) => {
    setEditingPlace(place);
    setIsCreatingPlace(false);
    setView('places');
    setIsMobileDrawerOpen(false);
  };

  const handleDonePlace = (actionMessage) => {
    setEditingPlace(null);
    setIsCreatingPlace(false);
    if (actionMessage) {
      addToast({ type: 'success', text: actionMessage });
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangingPass(true);
    setPasswordNotice(null);

    const res = await changePassword(currentPassword, newPassword);
    setChangingPass(false);

    if (res.success) {
      setPasswordNotice({ type: 'success', text: 'Contraseña cambiada exitosamente.' });
      setCurrentPassword('');
      setNewPassword('');
      addToast({ type: 'success', text: 'Contraseña de administrador actualizada.' });
      setTimeout(() => setShowPasswordModal(false), 1800);
    } else {
      setPasswordNotice({ type: 'error', text: res.error || 'Error al cambiar contraseña.' });
    }
  };

  const username = adminUser?.username || 'admin';
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const initialLetter = displayName.charAt(0);
  const avatarGradient = username === 'nicolas'
    ? 'from-sky-600 to-cyan-500'
    : 'from-purple-600 to-pink-500';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Resumen',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'places',
      label: 'Lugares Turísticos',
      icon: MapPin,
      badge: places.length
    },
    {
      id: 'transit',
      label: 'Líneas de Transporte',
      icon: Bus,
      badge: transitCount
    },
    {
      id: 'map-editor',
      label: 'Editor Mapa & Trazados',
      icon: Compass,
      badge: null,
      highlight: true
    },
    {
      id: 'events',
      label: 'Eventos & Avisos',
      icon: Bell,
      badge: activeEvents.length > 0 ? activeEvents.length : null,
      badgeColor: 'bg-amber-400 text-slate-950 font-black'
    },
    {
      id: 'database',
      label: 'Base de Datos & Backup',
      icon: Database,
      badge: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/25 to-slate-100/70 text-slate-900 font-sans antialiased flex flex-col md:flex-row">
      {/* ============================================================
          1. HEADER MÓVIL COMPACTO (SÓLO MD:HIDDEN)
          Evita cualquier doble barra; sólo existe para pantallas pequeñas.
         ============================================================ */}
      <header className="md:hidden bg-white/95 backdrop-blur-xl border-b border-sky-100/90 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
            aria-label="Abrir Menú"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="TuriArica"
              className="h-9 w-auto object-contain"
            />
            <span className="font-extrabold text-sm bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-800 bg-clip-text text-transparent">
              TuriArica Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} title={isBackendConnected ? 'SQLite Conectado' : 'Modo Local'} />
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
            {initialLetter}
          </div>
        </div>
      </header>

      {/* ============================================================
          2. BARRA LATERAL DESPLEGABLE / DESKTOP SIDEBAR
          Reemplaza la doble barra superior para que no tape elementos.
         ============================================================ */}
      <aside
        className={`hidden md:flex flex-col bg-white/95 backdrop-blur-2xl border-r border-sky-100/90 shadow-lg shadow-sky-950/5 sticky top-0 h-screen transition-all duration-300 z-30 shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Cabecera del Sidebar: Logo y botón de repliegue */}
        <div className="p-4 flex items-center justify-between border-b border-sky-50 min-h-[72px]">
          <Link to="/" className="flex items-center gap-3 overflow-hidden group">
            <img
              src="/logo.png"
              alt="TuriArica"
              className="h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            {!isSidebarCollapsed && (
              <div className="text-left whitespace-nowrap overflow-hidden">
                <span className="font-extrabold text-base bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-800 bg-clip-text text-transparent block">
                  TuriArica
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
                  Panel Admin
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-xl hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Desplegar barra lateral' : 'Colapsar barra lateral'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Estado de Base de Datos SQLite */}
        {!isSidebarCollapsed ? (
          <div className="px-4 py-2.5 mx-3 mt-3 rounded-xl bg-slate-50/80 border border-sky-100/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-bold text-slate-700">
                {isBackendConnected ? 'SQLite 3 Activo' : 'Modo Local'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">v2.4</span>
          </div>
        ) : (
          <div className="flex justify-center py-3">
            <div
              className={`w-3 h-3 rounded-full ${isBackendConnected ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' : 'bg-amber-500 ring-4 ring-amber-100'}`}
              title={isBackendConnected ? 'SQLite 3 Activo' : 'Modo Local'}
            />
          </div>
        )}

        {/* Menú de Navegación (5 Módulos Unificados) */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/70'
                } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${
                    isActive ? 'text-white' : item.highlight ? 'text-amber-500' : 'text-slate-500 group-hover:text-sky-600'
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isSidebarCollapsed && item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                    item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800')
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip flotante al estar colapsado */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    {item.label}
                    {item.badge !== null && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pie del Sidebar: Usuario, Contraseña y Salida */}
        <div className="p-3 border-t border-sky-50/80 bg-slate-50/40 space-y-2">
          {/* Enlace Volver al Sitio */}
          <Link
            to="/"
            className={`flex items-center gap-2 text-xs text-slate-600 hover:text-sky-600 font-bold px-3 py-2 rounded-xl hover:bg-white transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Volver a la vista pública de TuriArica"
          >
            <ExternalLink size={15} className="shrink-0 text-slate-400" />
            {!isSidebarCollapsed && <span>{t('admin.backToSite')}</span>}
          </Link>

          {/* Tarjeta de Perfil & Menú */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-2xl border border-sky-100 hover:border-sky-200 bg-white hover:bg-sky-50/50 transition-all shadow-xs cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-1.5' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0`}>
                {initialLetter}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 leading-none truncate">{displayName}</p>
                    <p className="text-[10px] font-semibold text-slate-400 capitalize truncate">{adminUser?.role || 'Admin'}</p>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </>
              )}
            </button>

            {/* Dropdown de Opciones de Perfil */}
            {showProfileMenu && (
              <div
                className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-xl border border-sky-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-extrabold text-slate-900">{displayName}</p>
                  <p className="text-[11px] text-slate-500">Credencial SQLite activa</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowPasswordModal(true);
                    setPasswordNotice(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <KeyRound size={15} className="text-slate-400" />
                  <span>Cambiar Contraseña</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut size={15} />
                  <span>{t('admin.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================
          3. DRAWER MÓVIL (DESLIZABLE EN PANTALLAS PEQUEÑAS)
         ============================================================ */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            />

            {/* Panel lateral deslizable */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 bottom-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-10"
            >
              <div className="p-4 flex items-center justify-between border-b border-sky-100">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/logo.png" alt="TuriArica" className="h-9 w-auto object-contain" />
                  <span className="font-extrabold text-sm text-slate-900">TuriArica Admin</span>
                </Link>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/25'
                          : 'text-slate-700 hover:bg-sky-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800')
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-sky-50 bg-slate-50 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-2"
                >
                  <KeyRound size={15} className="text-slate-400" />
                  <span>Cambiar Contraseña</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={15} />
                  <span>{t('admin.logout')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          4. MAIN CONTENT AREA (PANTALLA LIMPIA, SIN DOBLE BARRA)
         ============================================================ */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 w-full">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="view-dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AdminDashboard onNavigate={handleNavigate} />
              </motion.div>
            )}

            {view === 'places' && (
              <motion.div
                key="view-places"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {editingPlace ? (
                  <PlaceForm
                    place={editingPlace}
                    onDone={(msg) => handleDonePlace(msg || `Lugar "${editingPlace.name}" actualizado con éxito.`)}
                  />
                ) : isCreatingPlace ? (
                  <PlaceForm
                    onDone={(msg) => handleDonePlace(msg || 'Nuevo lugar agregado exitosamente al mapa.')}
                  />
                ) : (
                  <PlacesList
                    onEdit={handleEditPlace}
                    onAddNew={() => {
                      setIsCreatingPlace(true);
                      setEditingPlace(null);
                    }}
                    notify={addToast}
                  />
                )}
              </motion.div>
            )}

            {view === 'transit' && (
              <motion.div
                key="view-transit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <TransitList
                  onTraceOnMap={(line) => {
                    const id = line?.properties?.id || line;
                    setActiveTransitIdForMap(id);
                    setView('map-editor');
                  }}
                  onAddNew={() => {
                    setActiveTransitIdForMap(null);
                    setView('map-editor');
                  }}
                  notify={addToast}
                />
              </motion.div>
            )}

            {view === 'map-editor' && (
              <motion.div
                key="view-map-editor"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AdminMapManager initialTransitId={activeTransitIdForMap} />
              </motion.div>
            )}

            {view === 'events' && (
              <motion.div
                key="view-events"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EventsManager notify={addToast} />
              </motion.div>
            )}

            {view === 'database' && (
              <motion.div
                key="view-database"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <DataExport />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ============================================================
          5. SISTEMA GLOBAL DE TOAST NOTIFICATIONS ANIMADAS
         ============================================================ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
                toast.type === 'success'
                  ? 'bg-slate-900 text-white border-emerald-500/40 shadow-emerald-950/20'
                  : toast.type === 'error'
                  ? 'bg-rose-950 text-rose-100 border-rose-800 shadow-rose-950/20'
                  : toast.type === 'warning'
                  ? 'bg-amber-950 text-amber-100 border-amber-800 shadow-amber-950/20'
                  : 'bg-slate-900 text-white border-sky-500/40 shadow-slate-950/20'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
              {(!toast.type || toast.type === 'info') && <Sparkles size={18} className="text-sky-400 shrink-0" />}
              <span className="flex-1">{toast.text}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ============================================================
          6. MODAL: CAMBIO DE CONTRASEÑA
         ============================================================ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-sky-100 relative"
          >
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="text-sky-600" size={20} />
              <span>Cambiar Contraseña ({displayName})</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Actualiza la clave para la cuenta de <strong className="text-slate-800">{displayName}</strong>.
            </p>

            {passwordNotice && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                  passwordNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {passwordNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none text-sm"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {changingPass ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
