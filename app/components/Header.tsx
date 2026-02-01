import { useState, useEffect, useRef } from 'react';
import { mapBackendRoleToFrontend, BackendRole } from '@/app/types/auth';
import { authService } from '@/app/services/authService';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    date: Date;
    type: 'success' | 'warning' | 'info' | 'error';
    link?: string;
    category: 'appointment' | 'validation';
}

export default function Header({ 
  userName: propUserName, 
  userRole: propUserRole,
  userAvatar = '',
  onMenuToggle
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState<{ name: string; role: string; rawRole: string } | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
        const mappedRole = mapBackendRoleToFrontend(user.role as BackendRole);
        const displayRole = mappedRole.charAt(0).toUpperCase() + mappedRole.slice(1);
        
        setUserData({
          name: fullName,
          role: displayRole,
          rawRole: mappedRole
        });
      }
    } catch (e) {
      console.error('Error loading user data in Header', e);
    }
  }, []);

  // Fetch Notifications and categorize
  useEffect(() => {
      const fetchNotifications = async () => {
          if (!userData) return;
          
          const userStr = localStorage.getItem('user');
          if (!userStr) return;
          const user = JSON.parse(userStr);
          const role = user.role;

          if (role !== 'engineer' && role !== 'admin' && role !== 'company') return;

          try {
              let res;
              if (role === 'admin') {
                  res = await appointmentService.getAllAppointments({ limit: 20 });
              } else if (role === 'engineer') {
                  const profile = await authService.getProfile();
                  const engineerId = profile?.user?.engineerId || profile?.id || user.id;
                  res = await appointmentService.getAppointmentsByEngineer(engineerId);
              } else {
                  // Empresa
                  res = await appointmentService.getMyAppointments({ limit: 20 });
              }
              
              const data = res?.data || (Array.isArray(res) ? res : []);
              
              if (data) {
                  const newNotifications: Notification[] = [];
                  
                  await Promise.all(data.map(async (apt) => {
                       // 1. Appointments
                       const startTime = new Date(apt.startTime || apt.date);
                       const now = new Date();
                       const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                       // Alerta base de Programación (Para Ingeniero y Empresa)
                       if ((role === 'engineer' || role === 'company') && apt.status === 'PROGRAMADA') {
                           newNotifications.push({
                               id: `apt-${apt.id}`,
                               title: 'Cita Programada',
                               message: role === 'company'
                                  ? `Tienes una cita agendada para el ${startTime.toLocaleDateString()}`
                                  : `Tienes una cita agendada con ${apt.companyName || 'Empresa'} el ${startTime.toLocaleDateString()}`,
                               date: startTime,
                               type: 'info',
                               link: '/gestion-citas',
                               category: 'appointment'
                           });
                       }

                       // Alerta de Cita Inminente (Para Ingeniero y Empresa)
                       if ((role === 'engineer' || role === 'company') && diffHours > 0 && diffHours <= 2) {
                           newNotifications.push({
                               id: `urgent-${apt.id}`,
                               title: 'Cita Inminente',
                               message: `Tu cita comienza en menos de 2 horas.`,
                               date: startTime,
                               type: 'warning',
                               link: '/gestion-citas',
                               category: 'appointment'
                           });
                       }

                       // 2. Validations
                       if (apt.status === 'COMPLETADA') {
                          try {
                              const valRes = await appointmentService.getAppointmentValidation(apt.id);
                              if (valRes.success && valRes.data) {
                                  const val = valRes.data;
                                  
                                  if (val.status === 'APROBADO') {
                                      // Admin y Empresa ven aprobaciones
                                      if (role === 'admin' || role === 'company') {
                                          newNotifications.push({
                                              id: `val-${val.id}-aprobado`,
                                              title: 'Documentación Aprobada',
                                              message: role === 'company'
                                                  ? `Tu documentación ha sido aprobada con éxito.`
                                                  : `La validación de ${apt.companyName} ha sido aprobada con éxito.`,
                                              date: new Date(val.updatedAt || apt.updatedAt || apt.date),
                                              type: 'success',
                                              link: '/documentos-empresa',
                                              category: 'validation'
                                          });
                                      }
                                  } else if (val.status === 'EN_REVISION') {
                                      // Solo Admin ve lo que está pendiente de su revisión
                                      if (role === 'admin') {
                                          newNotifications.push({
                                              id: `val-${val.id}-revision`,
                                              title: 'Pendiente de Revisión',
                                              message: `${apt.companyName} ha enviado documentación para validar.`,
                                              date: new Date(val.updatedAt || apt.updatedAt || apt.date),
                                              type: 'info',
                                              link: '/documentos-empresa',
                                              category: 'validation'
                                          });
                                      }
                                  } else if (val.status === 'REQUIERE_CORRECCIONES') {
                                      // Todos ven correcciones (Ing, Admin, Empresa)
                                      newNotifications.push({
                                          id: `val-${val.id}-rechazado`,
                                          title: 'Correcciones Requeridas',
                                          message: role === 'company'
                                              ? `Se han solicitado cambios en tu documentación. Por favor revisa y corrige.`
                                              : `Se han solicitado cambios en la documentación de ${apt.companyName}.`,
                                          date: new Date(val.updatedAt || apt.updatedAt || apt.date),
                                          type: 'warning',
                                          link: '/documentos-empresa',
                                          category: 'validation'
                                      });
                                  } else if (val.status === 'COMPLETADO') {
                                       // Solo la Empresa recibe notificación de finalización
                                       if (role === 'company') {
                                          newNotifications.push({
                                              id: `val-${val.id}-completado`,
                                              title: 'Gestión Finalizada',
                                              message: `Los documentos de su cita del ${startTime.toLocaleDateString()} ya se encuentran disponibles.`,
                                              date: new Date(val.updatedAt || apt.updatedAt || apt.date),
                                              type: 'success',
                                              link: '/visualizar-documentos',
                                              category: 'validation'
                                          });
                                       }
                                  }
                              }
                          } catch (e) { /* ignore */ }
                       }

                       // 3. Cancellation Notifications
                       if (apt.status === 'CANCELADA') {
                           const canceller = apt.updatedByName || 'un usuario';
                           newNotifications.push({
                               id: `cancel-${apt.id}`,
                               title: 'Cita Cancelada',
                               message: `La cita del ${startTime.toLocaleDateString()} ha sido cancelada por ${canceller}.`,
                               date: new Date(apt.updatedAt || apt.date),
                               type: 'error',
                               link: '/gestion-citas',
                               category: 'appointment'
                           });
                       }
                  }));

                  newNotifications.sort((a, b) => b.date.getTime() - a.date.getTime());
                  setNotifications(newNotifications);
                  setUnreadCount(newNotifications.length);
              }
          } catch (err) {
              console.error('Error fetching notifications', err);
          }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
  }, [userData]);

  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const userName = propUserName || userData?.name || 'Cargando...';
  const userRole = propUserRole || userData?.role || '...';

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleNotificationClick = (notif: Notification) => {
      setShowNotifications(false);
      if (notif.link) router.push(notif.link);
  };

  const handleMenuToggle = () => onMenuToggle?.();
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const aptNotifications = notifications.filter(n => n.category === 'appointment');
  const valNotifications = notifications.filter(n => n.category === 'validation');

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={handleMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Buscar en el sistema..."
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              aria-label="Notifications"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-0 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-gray-900 text-base">Notificaciones</h3>
                        {unreadCount > 0 && <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-wider">{unreadCount} Pendientes</span>}
                    </div>
                    
                    <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="flex flex-col">
                                {/* Appointments Section */}
                                {aptNotifications.length > 0 && (
                                    <div className="bg-gray-50/50">
                                        <div className="px-5 py-2 flex items-center gap-2 border-b border-gray-100/50">
                                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Próximas Citas</span>
                                        </div>
                                        {aptNotifications.map((notif) => (
                                            <NotificationItem key={notif.id} notif={notif} onClick={handleNotificationClick} />
                                        ))}
                                    </div>
                                )}

                                {/* Validations Section */}
                                {valNotifications.length > 0 && (
                                    <div>
                                        <div className="px-5 py-2 flex items-center gap-2 border-b border-gray-100/50 bg-gray-50/20">
                                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estado de Validaciones</span>
                                        </div>
                                        {valNotifications.map((notif) => (
                                            <NotificationItem key={notif.id} notif={notif} onClick={handleNotificationClick} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="px-5 py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">Sin notificaciones</p>
                                <p className="text-xs text-gray-500 mt-1">Te avisaremos cuando haya actividad relevante.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/10 transition-transform group-hover:scale-105">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none mb-1">{userName}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{userRole}</p>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-all duration-300 group-hover:text-gray-600 ${showDropdown ? 'rotate-180 text-blue-600' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 py-1.5 z-50 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Sesión actual</p>
                <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
              </div>
              <button 
                onClick={() => authService.logout()}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({ notif, onClick }: { notif: Notification, onClick: (n: Notification) => void }) {
    return (
        <div 
            onClick={() => onClick(notif)}
            className="px-5 py-4 hover:bg-white cursor-pointer border-b border-gray-50 last:border-0 transition-all duration-200 group relative"
        >
            <div className="flex gap-4">
                <div className="shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        notif.type === 'success' ? 'bg-green-50 text-green-600' :
                        notif.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                    }`}>
                        {notif.type === 'success' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {notif.type === 'warning' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {notif.type === 'info' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{notif.title}</p>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-tight mb-1 content-line-clamp-2">{notif.message}</p>
                    <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {notif.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            </div>
        </div>
    );
}
