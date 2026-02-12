'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { authService } from '@/app/services/authService';
import DocCard from '@/app/components/documentos/DocCard';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import ValidationUploadModal from '@/app/components/documentos/ValidationUploadModal';
import ValidationReviewModal from '@/app/components/modals/ValidationReviewModal';
import ConfirmationModal from '@/app/components/modals/ConfirmationModal';
import { formatShortDate } from '@/app/utils/dateUtils';

export default function DocumentosEmpresaPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>(''); // Store role
  
  // Modal state
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false); // Admin Review Modal
  
  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      doc: any | null;
      isProcessing: boolean;
      warning?: string;
      isConfirmDisabled?: boolean;
      actionType?: 'standard' | 'no_docs';
  }>({
      isOpen: false,
      doc: null,
      isProcessing: false,
      warning: '',
      isConfirmDisabled: false,
      actionType: 'standard'
  });

  /* Fetch Data Function - Reusable for Refresh */
  const fetchData = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        router.push('/login');
        return;
      }

        try {
            const user = JSON.parse(userStr);
            const profileRes = await authService.getProfile();
            
            let targetId = user.id; 
            
            if (profileRes && profileRes.user) {
                 if (profileRes.user.engineerId) {
                     targetId = profileRes.user.engineerId;
                 } else if (profileRes.user.id) {
                     targetId = profileRes.user.id;
                 }
            }

            const role = (user.role || profileRes?.user?.role || '').toLowerCase();
            setCurrentUserRole(role); // Set role

            if (role === 'admin') {
                // ... existing admin fetch logic ...
                 try {
                     const valResponse = await appointmentService.getAllValidations({
                         limit: 100
                     });
                     
                     if (valResponse.success && valResponse.data) {
                         const validationsData = valResponse.data;
                         const items = Array.isArray(validationsData) ? validationsData : (validationsData.data || []);
                         
                        const mappedList = await Promise.all(items.map(async (val: any) => {
                             let actaStatus = null;
                             // If validation is APPROVED, we check Acta status to know if we can complete
                             if (val.status === 'APROBADO') {
                                 const aptId = val.appointmentId || val.appointment?.id;
                                 if (aptId) {
                                     try {
                                         const recordRes = await appointmentService.getAppointmentRecord(aptId);
                                         if (recordRes.success && recordRes.data) {
                                             actaStatus = recordRes.data.status;
                                         }
                                     } catch (e) {
                                         console.error("Error fetching acta status for validation", val.id, e);
                                     }
                                 }
                             }

                             return {
                                 id: val.id,
                                 appointmentId: val.appointmentId || val.appointment?.id,
                                 companyName: val.companyName || val.appointment?.companyName || 'Empresa', 
                                 engineerName: val.reviewedByName || val.appointment?.engineerName || 'Ingeniero',
                                 date: formatShortDate(val.updatedAt || val.createdAt),
                                 description: val.message || 'Validación en Revisión',
                                 status: val.status,
                                 docCount: val.documentsCount || 0,
                                 rawDate: val.updatedAt || val.createdAt,
                                 actaStatus: actaStatus
                             };
                         }));
                         setDocs(mappedList);
                     }
                 } catch (e) {
                     console.error('Admin fetch error', e);
                 }
            } else {            
                // Engineer fetch logic with pagination
                if (!targetId) {
                    setIsLoading(false);
                    return;
                }

                // Fetch ALL appointments with pagination
                let allAppointments: any[] = [];
                let page = 1;
                let hasMore = true;

                while (hasMore && page <= 10) { // Max 10 pages to prevent infinite loop
                    const aptResponse = await appointmentService.getAppointmentsByEngineer(targetId, {
                        page,
                        limit: 100 // Fetch 100 per page to minimize requests
                    });
                    
                    if (aptResponse.success && aptResponse.data) {
                        const pageData = aptResponse.data.data || [];
                        allAppointments = [...allAppointments, ...pageData];
                        hasMore = aptResponse.data.meta?.hasNextPage || false;
                        page++;
                    } else {
                        hasMore = false;
                    }
                }
                
                if (allAppointments.length > 0) {
                    const validationsList: any[] = [];
                    
                    const completedAppointments = allAppointments.filter((a: any) => a.status === 'COMPLETADA');
                    
                    await Promise.all(completedAppointments.map(async (apt) => {
                        try {
                            const valResponse = await appointmentService.getAppointmentValidation(apt.id);
                            if (valResponse.success && valResponse.data) {
                                const validation = valResponse.data;
                                
                                // Using documentsCount directly from validation object response
                                const docCount = validation.documentsCount || 0;

                                validationsList.push({
                                    id: validation.id,
                                    appointmentId: apt.id,
                                    companyName: apt.companyName || user.companyName || 'Mi Empresa',
                                    engineerName: validation.reviewedByName || apt.engineerName || 'Ingeniero Asignado',
                                    date: formatShortDate(apt.date),
                                    description: validation.message || (validation.status || '').replace(/_/g, ' ') || 'Validación de Cita',
                                    status: validation.status,
                                    docCount: docCount, 
                                    rawDate: apt.date 
                                });
                            }
                        } catch (err) {
                            // Silent fallback
                        }
                    }));

                    validationsList.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
                    setDocs(validationsList);
                }
            }
        } catch (error) {
            console.error('Error in init flow:', error);
        } finally {
            setIsLoading(false);
        }
    };

  useEffect(() => {
    fetchData();
  }, [router]);

  const filteredDocs = docs.filter(doc => 
    doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (doc: any) => {
      // If Admin, always open Review Modal for relevant statuses, or maybe generic info?
      // Actually normally admins review EN_REVISION.
      if (currentUserRole === 'admin') {
          setSelectedDoc(doc);
          setIsReviewModalOpen(true);
          return;
      }
      
      // For Company (non-admin):
      // If Approved or Completed, Open Review Modal in Read-Only to see documents/Acta
      if (['APROBADO', 'COMPLETADO'].includes(doc.status)) {
          setSelectedDoc(doc);
          setIsReviewModalOpen(true);
          return;
      }

      // If EN_REVISION, they can't do anything (waiting for admin)
      if (doc.status === 'EN_REVISION') {
          return;
      }

      // If PENDING/CORRECTIONS, Open Upload Modal
      setSelectedDoc(doc);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedDoc(null);
  };

  const handleCloseReviewModal = () => {
      setIsReviewModalOpen(false);
      setSelectedDoc(null);
      // Force reload to update list state from backend (approvals/rejections change validation status)
      window.location.reload();
  };

  /* Trigger confirmation modal */
  const handleStatusUpdateClick = async (doc: any, e: React.MouseEvent) => {
      let warning = '';
      let isConfirmDisabled = false;
      
      // If Admin and finalizing review, check for pending docs
      if (currentUserRole === 'admin' && doc.status === 'EN_REVISION') {
          setIsLoading(true); // Temporary loading state while checking
          try {
              const res = await appointmentService.getValidationDocuments(doc.id);
              if (res.success && res.data) {
                  const pendingCount = res.data.filter((d: any) => !d.isActa && d.status !== 'APROBADO' && d.status !== 'RECHAZADO').length;
                  if (pendingCount > 0) {
                      warning = `No puedes finalizar la revisión porque hay ${pendingCount} documentos pendientes. Debes aprobarlos o rechazarlos todos primero.`;
                      isConfirmDisabled = true;
                  }
              }
          } catch (err) {
              console.error('Error checking pending docs', err);
          } finally {
              setIsLoading(false);
          }
      }

      // If Admin wants to complete (APROBADO -> COMPLETADO), check Acta status!
      if (currentUserRole === 'admin' && doc.status === 'APROBADO') {
            // Check is now handled in the render, but double check here doesn't hurt, 
            // though we are disabling the button so this likely won't be reached.
            if (doc.actaStatus !== 'ACEPTADA' && doc.actaStatus !== 'APROBADO') {
                 warning = "No puedes completar la validación: El Acta de Visita aún no ha sido aceptada.";
                 isConfirmDisabled = true; 
            }
      }

      setConfirmModal({
          isOpen: true,
          doc: doc,
          isProcessing: false,
          warning: warning,
          isConfirmDisabled: isConfirmDisabled,
          actionType: 'standard'
      });
  };

  /* Trigger confirmation modal for No Docs */
  const handleNoDocClick = async (doc: any, e: React.MouseEvent) => {
      setConfirmModal({
          isOpen: true,
          doc: doc,
          isProcessing: false,
          warning: '',
          isConfirmDisabled: false,
          actionType: 'no_docs'
      });
  };

  /* Execute API Call */
  const executeStatusUpdate = async () => {
    const doc = confirmModal.doc;
    if (!doc) return;

    setConfirmModal(prev => ({ ...prev, isProcessing: true }));

    try {
        let nextStatus = 'EN_REVISION';
        let nextDescription = 'Documentación cargada, en revisión por el administrador';

        // 0. Explicit No-Doc Action
        if (confirmModal.actionType === 'no_docs') {
             nextStatus = 'EN_REVISION';
             nextDescription = 'Cita marcada sin documentos, en revisión.';
        }
        // 1. Logic for ADMIN finalizing a review (EN_REVISION -> APROBADO/REQUIERE_CORRECCIONES)
        else if (currentUserRole === 'admin' && doc.status === 'EN_REVISION') {
            const docsResponse = await appointmentService.getValidationDocuments(doc.id);
            if (docsResponse.success && docsResponse.data) {
                const validationDocs = docsResponse.data;
                const hasRejected = validationDocs.some((d: any) => d.status === 'RECHAZADO');
                nextStatus = hasRejected ? 'REQUIERE_CORRECCIONES' : 'APROBADO';
                nextDescription = hasRejected 
                    ? 'La validación requiere correcciones en algunos documentos.' 
                    : 'Todos los documentos han sido aprobados.';
            } else {
                throw new Error('No se pudieron verificar los documentos para finalizar la revisión.');
            }
        } 
        // 2. Logic for Admin updating Approved -> Completed
        else if (currentUserRole === 'admin' && doc.status === 'APROBADO') {
            nextStatus = 'COMPLETADO';
            nextDescription = 'Validación completada y documentos enviados.';
        }
        // 3. Logic for Engineer sending to review
        else {
            nextStatus = 'EN_REVISION';
            nextDescription = 'Documentación cargada, en revisión por el administrador';
        }

        const response = await appointmentService.updateValidationStatus(doc.appointmentId || doc.id, nextStatus);
        
        if (response.success) {
            setDocs(prevDocs => 
                prevDocs.map(d => 
                    d.id === doc.id ? { ...d, status: nextStatus, description: nextDescription } : d
                )
            );
            setConfirmModal({ isOpen: false, doc: null, isProcessing: false, warning: '', isConfirmDisabled: false });
        } else {
            setConfirmModal(prev => ({ ...prev, isProcessing: false }));
        }
    } catch (err: any) {
        console.error(err);
        setConfirmModal(prev => ({ ...prev, isProcessing: false }));
    }
  };
  
  // Determine if card is interactable (onClick behavior)
  const isCardClickable = (doc: any) => {
      // Admin always clickable
      if (currentUserRole === 'admin') return true; 
      
      // Company clickable if PENDING/CORRECTIONS (to upload) OR APPROVED/COMPLETED (to view)
      // Only EN_REVISION is non-clickable
      if (doc.status === 'EN_REVISION') return false;
      
      return true;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-inter">
              Documentación de la empresa
            </h1>
            <p className="text-gray-600 font-inter">
              Aquí podrás ver las validaciones y documentación de tus visitas.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por empresa..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm font-inter placeholder-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Documentation Cards List */}
        <div className="grid gap-6">
          {filteredDocs.map((doc) => (
            <DocCard
              key={doc.id}
              companyName={doc.companyName}
              engineerName={doc.engineerName}
              date={doc.date}
              description={doc.description}
              status={doc.status}
              onClick={
                  isCardClickable(doc) ? () => handleCardClick(doc) : undefined
              }
               onAction={
                 (currentUserRole === 'admin' && (doc.status === 'EN_REVISION' || doc.status === 'APROBADO'))
                 ? (e) => handleStatusUpdateClick(doc, e)
                 : (currentUserRole !== 'admin' && (doc.status === 'PENDIENTE_DOCUMENTACION' || doc.status === 'REQUIERE_CORRECCIONES' || !doc.status))
                 ? (e) => handleStatusUpdateClick(doc, e)
                 : undefined
               }
               actionLabel={
                 currentUserRole === 'admin' 
                   ? (doc.status === 'APROBADO' ? "Marcar como Completado" : "Finalizar Revisión")
                   : (doc.status === 'REQUIERE_CORRECCIONES' ? "Finalizar y Enviar a Revisión" : "Confirmar Carga de Documentos")
               }
               actionDisabled={
                 (currentUserRole !== 'admin' && (!doc.docCount || doc.docCount === 0)) ||
                 (currentUserRole === 'admin' && doc.status === 'APROBADO' && doc.actaStatus !== 'ACEPTADA' && doc.actaStatus !== 'APROBADO')
               }
               
               onSecondaryAction={
                   (currentUserRole !== 'admin' && (doc.status === 'PENDIENTE_DOCUMENTACION' || doc.status === 'REQUIERE_CORRECCIONES' || !doc.status))
                   ? (e) => handleNoDocClick(doc, e)
                   : undefined
               }
               secondaryActionLabel="Cita sin documentos"
            />
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
               </div>
               <h3 className="text-lg font-medium text-gray-900 font-inter">No hay documentos</h3>
               <p className="mt-1 text-gray-500 font-inter">No se encontraron validaciones o documentos para esta empresa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <ValidationUploadModal 
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         onSuccess={() => {
             fetchData(); // Refresh list on success
         }}
         validation={selectedDoc}
      />
      
      {/* Admin Review Modal */}
      {selectedDoc && (
          <ValidationReviewModal
            isOpen={isReviewModalOpen}
            onClose={handleCloseReviewModal}
            validationId={selectedDoc.id}
            appointmentId={selectedDoc.appointmentId}
            companyName={selectedDoc.companyName}
            readOnly={currentUserRole !== 'admin'}
          />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        title={
            confirmModal.actionType === 'no_docs' 
                ? "Confirmar Cita Sin Documentos"
                : (currentUserRole === 'admin' 
                    ? (confirmModal.doc?.status === 'APROBADO' ? "Confirmar Envío de Documentos" : "Confirmar Finalización de Revisión")
                    : "Confirmar Carga de Documentos")
        }
        message={
            confirmModal.actionType === 'no_docs' ? (
                <span>
                    ¿Estás seguro de marcar esta cita como <strong>SIN DOCUMENTOS</strong>? 
                    <br/><br/>
                    Se enviará a revisión automáticamente y el administrador será notificado.
                </span>
            ) : (
                currentUserRole === 'admin' ? (
                    confirmModal.doc?.status === 'APROBADO' ? (
                        <span>
                            ¿Estás seguro que deseas enviar los documentos finales? 
                            <br/><br/>
                            El estado cambiará a <strong>COMPLETADO</strong>.
                        </span>
                    ) : (
                        <span>
                            ¿Estás seguro que deseas finalizar la revisión? 
                            <br/><br/>
                            El estado cambiará a <strong>APROBADO</strong> o <strong>REQUIERE CORRECCIONES</strong> según tus revisiones.
                        </span>
                    )
                ) : (
                    <span>
                        ¿Estás seguro que deseas notificar que has cargado toda la documentación? 
                        <br/><br/>
                        El estado cambiará a <strong>EN REVISION</strong> y el administrador será notificado.
                    </span>
                )
            )
        }
        confirmLabel="Sí, Confirmar"
        isProcessing={confirmModal.isProcessing}
        confirmDisabled={confirmModal.isConfirmDisabled}
      >
        {confirmModal.warning && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-800 font-medium">{confirmModal.warning}</p>
            </div>
        )}
      </ConfirmationModal>
    </DashboardLayout>
  );
}
