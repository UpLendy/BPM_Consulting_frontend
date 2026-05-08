'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { solicitudService } from '@/app/services/solicitudes/solicitudService';
import { engineerService } from '@/app/services/engineers/engineerService';
import { invimaService } from '@/app/services/invima/invimaService';
import RoleGuard from '@/app/components/auth/RoleGuard';

export default function CrearSolicitudPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [invimaProfile, setInvimaProfile] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modal de asignación de ingeniero
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ ingenieroId: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    asignacion: 'IMPORTADO_ALIMENTO', // Sección
    grupo: 'MEDIO', // Prioridad
    idioma: 'ESPAÑOL',
    observacion: '',
    fechaEntrada: '',
    empresaInvimaId: '',
    ingenieroId: ''
  });

  const SECCIONES = [
    { label: 'Importados - Alimentos', value: 'IMPORTADO_ALIMENTO' },
    { label: 'Perecederos', value: 'PERECEDEROS' },
    { label: 'Marca propia', value: 'MARCA_PROPIA' },
    { label: 'Importados - Bebidas alcoholicas', value: 'IMPORTADO_BEBIDA' },
    { label: 'Importados - ph', value: 'IMPORTADO_PH' }
  ];

  const PRIORIDADES = [
    { label: 'Alta', value: 'ALTA' },
    { label: 'Media', value: 'MEDIO' },
    { label: 'Baja', value: 'BAJA' }
  ];

  const IDIOMAS = [
    'ESPAÑOL', 'INGLES', 'PORTUGUES', 'OTRO'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      const r = ((parsed.role as any)?.name || parsed.role || '').toLowerCase();
      setRole(r);
      fetchData(parsed, r);
    } else {
      setIsLoadingData(false);
    }
  }, []);

  const refreshSolicitudes = async (currentUser: any, userRole: string) => {
    try {
      const isAdmin = userRole === 'admin' || userRole === 'administrador';
      const isEngineer = userRole === 'engineer' || userRole === 'ingeniero';

      if (isAdmin || isEngineer) {
        // Try to get fresh user data from localStorage
        const storedUser = localStorage.getItem('user');
        const userData = storedUser ? JSON.parse(storedUser) : currentUser;
        
        // STRICT: Use only engineerId
        const targetId = userData?.engineerId;
        
        console.log('[CrearSolicitud] RefreshSolicitudes -> engineerId:', targetId);

        if (targetId) {
          const solsRes = await solicitudService.getSolicitudesByIngeniero(targetId, 'PENDIENTE');
          setSolicitudes(Array.isArray(solsRes) ? solsRes : (solsRes?.data || []));
        } else {
          console.error('[CrearSolicitud] No se encontró engineerId en el usuario:', userData);
          setSolicitudes([]);
        }
      }
    } catch (err) {
      console.error('Error refreshing solicitudes:', err);
    }
  };

  const fetchData = async (currentUser: any, userRole: string) => {
    try {
      if (userRole === 'admin' || userRole === 'administrador') {
        const [comps, engs] = await Promise.all([
          invimaService.getCompanies(),
          engineerService.getAllEngineers()
        ]);
        setCompanies(Array.isArray(comps) ? comps : (comps?.data || []));
        setEngineers(engs || []);
        await refreshSolicitudes(currentUser, userRole);
      } 
      else if (userRole === 'engineer' || userRole === 'ingeniero') {
        const [comps, engs] = await Promise.all([
          invimaService.getCompanies(),
          engineerService.getAllEngineers()
        ]);
        setCompanies(Array.isArray(comps) ? comps : (comps?.data || []));
        setEngineers(engs || []);
        await refreshSolicitudes(currentUser, userRole);
      } 
      else if (userRole === 'invima') {
        // Fetch companies and profiles
        const [comps, profilesRes] = await Promise.all([
          invimaService.getCompanies(),
          invimaService.getProfiles()
        ]);
        
        const companiesData = Array.isArray(comps) ? comps : (comps?.data || []);
        setCompanies(companiesData);

        // API returns { data: [...] } — extract the array
        const profiles = Array.isArray(profilesRes) ? profilesRes : (profilesRes?.data || []);
        
        // Match by email since API doesn't return userId
        const myProfile = profiles.find((p: any) => p.userEmail === currentUser.email);
        
        if (myProfile) {
          // Resolve companyId by matching companyName against companies list
          if (!myProfile.invimaCompanyId && myProfile.invimaCompanyName) {
             const matchedCompany = companiesData.find((c: any) => c.nombre === myProfile.invimaCompanyName);
             if (matchedCompany) {
               myProfile.invimaCompanyId = matchedCompany.id || matchedCompany._id;
             }
          }

          // Resolve comercial/administrativo profile IDs from same company
          const companyProfiles = profiles.filter((p: any) => p.invimaCompanyName === myProfile.invimaCompanyName);
          const comercialProfile = companyProfiles.find((p: any) => p.tipo === 'COMERCIAL');
          const administrativoProfile = companyProfiles.find((p: any) => p.tipo === 'ADMINISTRATIVO');
          myProfile._comercialProfileId = comercialProfile?.id;
          myProfile._administrativoProfileId = administrativoProfile?.id;

          setInvimaProfile(myProfile);
        } else {
          console.error('No se encontró perfil INVIMA para:', currentUser.email, '| Profiles disponibles:', profiles);
          setInvimaProfile(null);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const openAssignModal = (solicitud: any) => {
    setSelectedSolicitud(solicitud);
    setAssignForm({ ingenieroId: solicitud.ingenieroId || '' });
    setIsAssignModalOpen(true);
    setAssignError(null);
    setAssignSuccess(null);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedSolicitud(null);
    setAssignForm({ ingenieroId: '' });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSolicitud || !assignForm.ingenieroId) return;

    setIsAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      await solicitudService.updateSolicitud(selectedSolicitud.id || selectedSolicitud._id, {
        ingenieroId: assignForm.ingenieroId
      });
      setAssignSuccess('Ingeniero asignado correctamente.');
      
      await refreshSolicitudes(user, role);
      
      setTimeout(() => {
        closeAssignModal();
      }, 2000);
    } catch (err: any) {
      setAssignError(err.message || 'Error al asignar el ingeniero');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setError('Por favor complete el título y la descripción.');
      return;
    }

    const isAdmin = role === 'admin' || role === 'administrador';
    const isEngineer = role === 'engineer' || role === 'ingeniero';
    const isInvima = role === 'invima';

    if ((isAdmin || isEngineer) && !formData.fechaEntrada) {
      setError('Por favor seleccione la fecha de entrada.');
      return;
    }

    if ((isAdmin || isEngineer) && !formData.empresaInvimaId) {
      setError('Por favor seleccione la empresa INVIMA.');
      return;
    }

    if (isAdmin && !formData.ingenieroId) {
      setError('Por favor seleccione el ingeniero asignado.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Determine Company
      let finalCompanyId = '';
      if (isInvima) {
        console.log('🔍 [DEBUG SUBMIT] invimaProfile at submit:', JSON.stringify(invimaProfile, null, 2));
        const foundCompanyId = invimaProfile?.invimaCompanyId || invimaProfile?.invimaCompany?.id || invimaProfile?.invimaCompany?._id || invimaProfile?.companyId;
        console.log('🔍 [DEBUG SUBMIT] foundCompanyId:', foundCompanyId);
        if (!invimaProfile || !foundCompanyId) {
          throw new Error('Tu perfil INVIMA está incompleto o no se encontró tu empresa en la base de datos.');
        }
        finalCompanyId = foundCompanyId;
      } else {
        finalCompanyId = formData.empresaInvimaId;
      }

      // 2. Determine Invima Profile IDs (backend expects profile IDs, not user IDs)
      let finalComercialId = undefined;
      let finalAdministrativoId = undefined;

      if (isInvima) {
        // Use precomputed profile IDs from the same company
        finalComercialId = invimaProfile._comercialProfileId;
        finalAdministrativoId = invimaProfile._administrativoProfileId;
      } else {
        // Para admin/ingeniero consultamos los miembros de la empresa
        const members = await invimaService.getCompanyMembers(finalCompanyId);
        const membersData = Array.isArray(members) ? members : (members?.data || []);
        const comercial = membersData.find((m: any) => m.tipo === 'COMERCIAL');
        const administrativo = membersData.find((m: any) => m.tipo === 'ADMINISTRATIVO');
        finalComercialId = comercial?.id;
        finalAdministrativoId = administrativo?.id;
      }

      // 3. Determine Engineer
      let finalIngenieroId = undefined;
      if (isAdmin) {
        finalIngenieroId = formData.ingenieroId;
      } else if (isEngineer) {
        const myEngProfile = engineers.find(eng => eng.userId === user.id);
        if (myEngProfile) {
          finalIngenieroId = myEngProfile.id;
        }
      }

      // 4. Set Date
      let finalFechaEntrada = new Date().toISOString();
      if (!isInvima) {
        finalFechaEntrada = new Date(formData.fechaEntrada).toISOString();
      }

      await solicitudService.createSolicitud({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        fechaEntrada: finalFechaEntrada,
        fechaTerminacion: undefined,
        idioma: formData.idioma,
        asignacion: formData.asignacion,
        grupo: formData.grupo,
        observacion: formData.observacion,
        ingenieroId: finalIngenieroId,
        invimaComercialId: finalComercialId,
        invimaAdministrativoId: finalAdministrativoId
      });

      setSuccess(true);
      setFormData({
        titulo: '',
        descripcion: '',
        asignacion: 'IMPORTADO_ALIMENTO',
        grupo: 'MEDIO',
        idioma: 'ESPAÑOL',
        observacion: '',
        fechaEntrada: '',
        empresaInvimaId: '',
        ingenieroId: ''
      });
      
      // Refresh solicitudes if admin/engineer
      if (isAdmin || isEngineer) {
        await refreshSolicitudes(user, role);
      }

      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      setError(err.message || 'Error al crear la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = role === 'admin' || role === 'administrador';
  const isEngineer = role === 'engineer' || role === 'ingeniero';
  const isInvima = role === 'invima';

  if (isLoadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 font-semibold animate-pulse">Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ADMINISTRADOR', 'ENGINEER', 'INGENIERO', 'INVIMA']}>
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-10 text-white">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Crear Nueva Solicitud</h2>
              <p className="text-blue-100 text-sm sm:text-base font-medium">
                Registra una solicitud de INVIMA en el sistema.
              </p>
            </div>

            <div className="p-6 sm:p-10">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 animate-fade-in">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 animate-fade-in">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ¡Solicitud creada exitosamente!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    Información General
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="titulo" className="block text-sm font-bold text-gray-700 mb-2">Título de la Solicitud <span className="text-red-500">*</span></label>
                      <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500" placeholder="Ej. Solicitud de Registro Sanitario" required />
                    </div>
                    
                    <div>
                      <label htmlFor="descripcion" className="block text-sm font-bold text-gray-700 mb-2">Descripción <span className="text-red-500">*</span></label>
                      <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500 resize-none" placeholder="Describe brevemente la solicitud..." required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="asignacion" className="block text-sm font-bold text-gray-700 mb-2">Sección</label>
                        <select id="asignacion" name="asignacion" value={formData.asignacion} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white">
                          {SECCIONES.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="grupo" className="block text-sm font-bold text-gray-700 mb-2">Prioridad</label>
                        <select id="grupo" name="grupo" value={formData.grupo} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white">
                          {PRIORIDADES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="idioma" className="block text-sm font-bold text-gray-700 mb-2">Idioma</label>
                        <select id="idioma" name="idioma" value={formData.idioma} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white">
                          {IDIOMAS.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>

                      {(isAdmin || isEngineer) && (
                        <div>
                          <label htmlFor="fechaEntrada" className="block text-sm font-bold text-gray-700 mb-2">Fecha de Entrada <span className="text-red-500">*</span></label>
                          <input type="datetime-local" id="fechaEntrada" name="fechaEntrada" value={formData.fechaEntrada} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white" required />
                        </div>
                      )}

                      {(isAdmin || isEngineer) && (
                        <div className={isAdmin ? 'md:col-span-2' : ''}>
                          <label htmlFor="empresaInvimaId" className="block text-sm font-bold text-gray-700 mb-2">Empresa INVIMA <span className="text-red-500">*</span></label>
                          <select id="empresaInvimaId" name="empresaInvimaId" value={formData.empresaInvimaId} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white" required>
                            <option value="">Seleccione la empresa...</option>
                            {companies.map(c => (
                              <option key={c.id || c._id} value={c.id || c._id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="md:col-span-2">
                          <label htmlFor="ingenieroId" className="block text-sm font-bold text-gray-700 mb-2">Ingeniero Asignado <span className="text-red-500">*</span></label>
                          <select id="ingenieroId" name="ingenieroId" value={formData.ingenieroId} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white" required>
                            <option value="">Seleccione el ingeniero...</option>
                            {engineers.map(e => (
                              <option key={e.id} value={e.id}>{e.user?.first_name} {e.user?.last_name} ({e.user?.email})</option>
                            ))}
                          </select>
                        </div>
                      )}

                    </div>

                    <div>
                      <label htmlFor="observacion" className="block text-sm font-bold text-gray-700 mb-2">Observación (Opcional)</label>
                      <textarea id="observacion" name="observacion" value={formData.observacion} onChange={handleInputChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500 resize-none" placeholder="Notas adicionales..." />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      'Crear Solicitud'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Solicitudes List Section */}
          {(isAdmin || isEngineer) && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-8">
              <div className="bg-gray-50 border-b border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900">Listado de Solicitudes</h3>
                <p className="text-sm text-gray-500 mt-1">Gestiona las solicitudes y asigna ingenieros si es necesario.</p>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-700 border-b border-gray-200">Título / Estado</th>
                      <th className="px-6 py-4 font-bold text-gray-700 border-b border-gray-200">Ingeniero</th>
                      <th className="px-6 py-4 font-bold text-gray-700 border-b border-gray-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                          No hay solicitudes registradas
                        </td>
                      </tr>
                    ) : (
                      solicitudes.map(sol => (
                        <tr key={sol.id || sol._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{sol.titulo}</div>
                          </td>
                          <td className="px-6 py-4">
                            {sol.ingenieroNombre ? (
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                  {sol.ingenieroNombre.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-medium text-gray-700">
                                  {sol.ingenieroNombre}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Sin asignar</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openAssignModal(sol)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {sol.ingenieroNombre ? 'Cambiar Ingeniero' : 'Asignar Ingeniero'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Asignación */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Asignar Ingeniero</h3>
                <button 
                  onClick={closeAssignModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                {assignError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                    {assignError}
                  </div>
                )}
                {assignSuccess && (
                  <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl border border-green-200">
                    {assignSuccess}
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona el ingeniero que se hará cargo de la solicitud: <br/>
                    <strong className="text-gray-900">{selectedSolicitud?.titulo}</strong>
                  </p>

                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ingeniero</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-900"
                    value={assignForm.ingenieroId}
                    onChange={(e) => setAssignForm({ ingenieroId: e.target.value })}
                  >
                    <option value="">Seleccione un ingeniero...</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.user?.first_name} {eng.user?.last_name} ({eng.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning || !assignForm.ingenieroId}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isAssigning ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}
