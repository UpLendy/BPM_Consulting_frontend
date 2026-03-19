'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { authService } from '@/app/services/authService';
import { Appointment, AppointmentStatus, PaginatedResponse } from '@/app/types';
import { HiDocumentText } from 'react-icons/hi';
import { formatLongDate } from '@/app/utils/dateUtils';
import AdvisoryActModal from '@/app/components/visita/AdvisoryActModal';
import BaseModal from '@/app/components/modals/BaseModal';
import { representativeService } from '@/app/services/representatives/representativeService';
import { HiExclamation } from 'react-icons/hi';

export default function GenerarActaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeModal, setActiveModal] = useState<'act' | null>(null);
  const [finishing, setFinishing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [idToFinalize, setIdToFinalize] = useState<string | null>(null);
  const [validationName, setValidationName] = useState('');
  const [isCheckingSignature, setIsCheckingSignature] = useState(false);
  const [signatureWarning, setSignatureWarning] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginatedResponse<Appointment>['meta'] | undefined>(undefined);
  const itemsPerPage = 10;
  
  // State for rejected actas
  const [rejectedRecords, setRejectedRecords] = useState<Array<{appointment: Appointment, recordUrl: string}>>([]);
  const [checkingRejected, setCheckingRejected] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setCheckingRejected(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      const profile = await authService.getProfile();
      const engineerId = profile?.user?.engineerId || user.id;

      // Fetch ALL appointments (we'll paginate client-side)
      let allFetchedAppointments: Appointment[] = [];
      let page = 1;
      let hasMore = true;

      // Fetch all pages
      while (hasMore && page <= 10) { // Max 10 pages to prevent infinite loop
        const response = await appointmentService.getAppointmentsByEngineer(engineerId, {
          page,
          limit: 100 // Fetch 100 per page to minimize requests
        });
        
        if (response.success && response.data) {
          const pageData = response.data.data || [];
          allFetchedAppointments = [...allFetchedAppointments, ...pageData];
          hasMore = response.data.meta?.hasNextPage || false;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Filter ONLY EN_PROGRESO appointments
      const inProgressAppointments = allFetchedAppointments.filter(
        (apt: Appointment) => apt.status === AppointmentStatus.EN_PROGRESO
      );
      
      // Sort by date (most recent first)
      const sortedAppointments = inProgressAppointments.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setAllAppointments(sortedAppointments);
      
      // Calculate pagination metadata
      const total = sortedAppointments.length;
      const totalPages = Math.ceil(total / itemsPerPage);
      setPaginationMeta({
        total,
        page: currentPage,
        limit: itemsPerPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });

      // Now check for rejected records using the already fetched appointments
      // We check all statuses that could potentially have an acta (basically anything beyond PROGRAMADA/CANCELADA)
      const completedAppointments = allFetchedAppointments.filter(
        (apt: Appointment) => apt.status !== AppointmentStatus.PROGRAMADA && apt.status !== AppointmentStatus.CANCELADA
      );
      
      await checkForRejectedRecords(completedAppointments);

    } catch (error) {
      console.error('Error fetching data:', error);
      setAllAppointments([]);
    } finally {
      setLoading(false);
      setCheckingRejected(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Update displayed appointments when page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAppointments = allAppointments.slice(startIndex, endIndex);
    setAppointments(paginatedAppointments);

    // Update pagination meta for current page
    if (allAppointments.length > 0) {
      const total = allAppointments.length;
      const totalPages = Math.ceil(total / itemsPerPage);
      setPaginationMeta({
        total,
        page: currentPage,
        limit: itemsPerPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }
  }, [currentPage, allAppointments]);

  const handleFinalizeAppointment = async (apt: Appointment) => {
    setError(null);
    setSignatureWarning(null);
    
    // Check for recent signature before allowing to show confirmation
    if (apt.representativeId) {
      setIsCheckingSignature(true);
      try {
        const sigRes = await representativeService.getRepresentativeSignature(apt.representativeId);
        
        let isRecent = false;
        if (sigRes && sigRes.signatureUrl && sigRes.updatedAt) {
          const updatedAt = new Date(sigRes.updatedAt);
          const now = new Date();
          const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
          
          if (diffMinutes <= 15) {
            isRecent = true;
          } else {
            setSignatureWarning('La firma del cliente no es válida. Debe solicitar al cliente que firme el acta nuevamente.');
          }
        } else {
          setSignatureWarning('No se encontró la firma del cliente. Solicite al cliente que firme el acta desde su panel.');
        }

        if (!isRecent) {
           setError('Firma ausente. El cliente debe firmar desde su cuenta para poder finalizar la visita.');
           window.scrollTo({ top: 0, behavior: 'smooth' });
           return;
        }
      } catch (err) {
        console.error("Error checking signature", err);
      } finally {
        setIsCheckingSignature(false);
      }
    } else {
      setError('No hay un representante asignado a esta cita. No se puede verificar la firma.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIdToFinalize(apt.id);
    
    // Suggest a default name, but let the user change it
    setValidationName(`Cita para ${apt.companyName || 'Empresa'}`);
    
    setShowConfirmModal(true);
  };

  const confirmFinalize = async () => {
    if (!idToFinalize) return;
    
    setShowConfirmModal(false);
    setFinishing(idToFinalize);
    setError(null);
    
    const response = await appointmentService.completeAppointment(idToFinalize);
    
    if (response.success) {
      // Llamar a la validación obligatoriamente después de completar
      await appointmentService.createAppointmentValidation(idToFinalize, validationName.trim() || 'Validación de Cita', validationName.trim());
      fetchData();
    } else {
      setError(response.error || 'Error al finalizar la cita');
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setFinishing(null);
    setIdToFinalize(null);
  };

  /**
   * Check for rejected actas that need correction
   * Uses already fetched COMPLETADO appointments to minimize API calls
   */
  const checkForRejectedRecords = async (completedAppointments: Appointment[]) => {
    try {
      if (!completedAppointments || completedAppointments.length === 0) return;

      // 2. Check each completed appointment for rejected acta
      const rejected: Array<{appointment: Appointment, recordUrl: string}> = [];
      
      for (const apt of completedAppointments) {
        try {
          const recordResponse = await appointmentService.getAppointmentRecord(apt.id);
          
          let isRejectedOrNeedsSignature = false;
          let recordUrl = '';

          if (recordResponse.success && recordResponse.data) {
            const status = (recordResponse.data.status || '').toUpperCase();
            
            // Check if status is RECHAZADA or RECHAZADO
            if (status === 'RECHAZADA' || status === 'RECHAZADO') {
              isRejectedOrNeedsSignature = true;
              recordUrl = recordResponse.data.url;
            } else if (status === 'APROBADO' || status === 'APROBADA' || status === 'ACEPTADA') {
              // Limpiar firma cacheada si ya está aprobada para liberar espacio
              try {
                localStorage.removeItem(`sig_backup_${apt.id}`);
              } catch (e) {
                // Ignore storage errors
              }
            }
          } else if (!recordResponse.success && recordResponse.error && recordResponse.error.toLowerCase().includes('firmado')) {
             // Backend throws a 500 error if it's not signed or accepted
             isRejectedOrNeedsSignature = true;
          }

          if (isRejectedOrNeedsSignature) {
            rejected.push({
              appointment: apt,
              recordUrl: recordUrl
            });
          }
        } catch (error) {
          // Skip this appointment if error
          console.error(`Error checking record for appointment ${apt.id}:`, error);
        }
      }

      setRejectedRecords(rejected);
    } catch (error) {
      console.error('Error checking for rejected records:', error);
    } finally {
      setCheckingRejected(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="p-10 font-inter max-w-7xl mx-auto min-h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Generar acta</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Aquí podrás generar el acta de la visita que acabas de realizar
          </p>
        </div>

        {/* Rejected Records Alert */}
        {rejectedRecords.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <HiExclamation className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                  Corrección de Actas Requerida ({rejectedRecords.length})
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="mb-2">Las siguientes actas han sido rechazadas y requieren corrección para ser aprobadas:</p>
                  <ul className="space-y-2 mt-2">
                    {rejectedRecords.map(({ appointment }, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-white p-3 rounded-md border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <span className="font-bold text-gray-900 block">{appointment.companyName || 'Empresa sin nombre'}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            📅 {formatLongDate(appointment.date)} • ⏰ {appointment.startTime} - {appointment.endTime}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setActiveModal('act');
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1"
                        >
                          ✏️ Corregir Acta
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center animate-fade-in shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-bold uppercase tracking-tight">
                  Atención: {error}
                </p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#525298]"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <HiDocumentText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay citas en progreso para generar acta.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8">
              {appointments.map((apt) => (
                <div 
                  key={apt.id}
                  className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 flex flex-col items-center"
                >
                  <div className="w-full mb-8 text-center">
                    <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
                      Vista para: {apt.companyName}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {formatLongDate(apt.date)} • {apt.location || 'Sede Principal'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl justify-center">
                    <button 
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setActiveModal('act');
                      }}
                      disabled={finishing === apt.id}
                      className="flex-1 min-w-[280px] h-[140px] bg-[#525298] text-white text-4xl font-medium rounded-2xl hover:bg-[#434380] shadow-2xl shadow-blue-900/10 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      Generar acta
                    </button>
                    <button 
                      onClick={() => handleFinalizeAppointment(apt)}
                      disabled={finishing === apt.id || isCheckingSignature}
                      className="flex-1 min-w-[280px] h-[140px] bg-emerald-600 text-white text-4xl font-medium rounded-2xl hover:bg-emerald-700 shadow-2xl shadow-emerald-900/10 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {finishing === apt.id ? 'Finalizando...' : isCheckingSignature ? '...' : 'Finalizar cita'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-600">
                  Mostrando página <span className="font-bold">{paginationMeta.page}</span> de{' '}
                  <span className="font-bold">{paginationMeta.totalPages}</span>
                  {' • '}
                  <span className="font-bold">{paginationMeta.total}</span> citas en total
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginationMeta.hasPreviousPage}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paginationMeta.hasNextPage}
                    className="px-4 py-2 bg-[#525298] text-white rounded-lg text-sm font-medium hover:bg-[#434380] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {selectedAppointment && (
          <AdvisoryActModal
            isOpen={activeModal !== null}
            onClose={() => {
              setActiveModal(null);
              setSelectedAppointment(null);
            }}
            onSuccess={fetchData}
            appointment={selectedAppointment}
          />
        )}

        {/* Modal de Confirmación Personalizado */}
        <BaseModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar Finalización"
          size="sm"
        >
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <HiExclamation className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">¿Estás seguro?</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Deseas finalizar esta cita. Asegúrate de haber <strong>guardado el acta</strong> primero, ya que esta acción no se puede deshacer.
            </p>
            
            <div className="w-full text-left mb-8">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Nombre de la Documentación
              </label>
              <input
                type="text"
                value={validationName}
                onChange={(e) => setValidationName(e.target.value)}
                placeholder="Ej. Validación mes de Abril - Empresa XYZ"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-500"
              />
              <p className="text-xs text-gray-400 mt-2 font-medium">Este título acompañará a la carpeta de documentos de la visita para identificarlos.</p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinalize}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all uppercase text-xs"
              >
                Sí, finalizar
              </button>
            </div>
          </div>
        </BaseModal>
      </div>
    </DashboardLayout>
  );
}
