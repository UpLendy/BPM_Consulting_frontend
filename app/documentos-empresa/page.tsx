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
  }>({
      isOpen: false,
      doc: null,
      isProcessing: false
  });

  useEffect(() => {
    // ... existing init logic ...
    const init = async () => {
      // ... existing auth checks ...
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
                         
                         const mappedList = items.map((val: any) => ({
                             id: val.id,
                             appointmentId: val.appointmentId,
                             companyName: val.companyName || val.appointment?.companyName || 'Empresa', 
                             engineerName: val.reviewedByName || val.appointment?.engineerName || 'Ingeniero',
                             date: val.updatedAt ? new Date(val.updatedAt).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES'),
                             description: val.message || 'Validación en Revisión',
                             status: val.status,
                             docCount: val.documentsCount || 0,
                             rawDate: val.updatedAt || val.createdAt
                         }));
                         setDocs(mappedList);
                     }
                 } catch (e) {
                     console.error('Admin fetch error', e);
                 }
            } else {            
                // ... existing engineer fetch logic ...
                if (!targetId) {
                    setIsLoading(false);
                    return;
                }

                const aptResponse = await appointmentService.getAppointmentsByEngineer(targetId);
                
                if (aptResponse.success && aptResponse.data) {
                const appointments = aptResponse.data;
                const validationsList: any[] = [];
                
                const completedAppointments = appointments.filter(a => a.status === 'COMPLETADA');
                
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
                                date: new Date(apt.date).toLocaleDateString('es-ES'),
                                description: validation.message || validation.status || 'Validación de Cita',
                                status: validation.status,
                                docCount: docCount, 
                                rawDate: apt.date 
                            });
                        }
                    } catch (err) {
                        console.warn(`Could not load validation for appointment ${apt.id}`, err);
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

    init();
  }, [router]);

  const filteredDocs = docs.filter(doc => 
    doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.engineerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (doc: any) => {
      // If Admin and status is EN_REVISION (or relevant for review), Open Review Modal
      if (currentUserRole === 'admin') {
          setSelectedDoc(doc);
          setIsReviewModalOpen(true);
          return;
      }
      
      // Prevent opening upload modal if status is EN_REVISION, APROBADO or COMPLETADO for non-admins
      if (['EN_REVISION', 'APROBADO', 'COMPLETADO'].includes(doc.status)) {
          return;
      }
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
  const handleStatusUpdateClick = (doc: any, e: React.MouseEvent) => {
      setConfirmModal({
          isOpen: true,
          doc: doc,
          isProcessing: false
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

        // Logic for Admin updating Approved -> Completed
        // (Assuming current user is Admin if they can see/interact with APROBADO card)
        if (doc.status === 'APROBADO') {
            nextStatus = 'COMPLETADO';
            nextDescription = 'Validación completada y documentos enviados.';
        }

        const response = await appointmentService.updateValidationStatus(doc.appointmentId || doc.id, nextStatus);
        
        if (response.success) {
            // Success
            setDocs(prevDocs => 
                prevDocs.map(d => 
                    d.id === doc.id ? { ...d, status: nextStatus, description: nextDescription } : d
                )
            );
            // Close modal
            setConfirmModal({ isOpen: false, doc: null, isProcessing: false });
        } else {
            alert('Error al actualizar: ' + response.error);
            setConfirmModal(prev => ({ ...prev, isProcessing: false }));
        }
    } catch (err) {
        console.error(err);
        alert('Ocurrió un error al actualizar el estado.');
        setConfirmModal(prev => ({ ...prev, isProcessing: false }));
    }
  };
  
  // Determine if card is interactable (onClick behavior)
  const isCardClickable = (doc: any) => {
      if (currentUserRole === 'admin') return true; 
      if (['EN_REVISION', 'APROBADO', 'COMPLETADO'].includes(doc.status)) return false;
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
                placeholder="Buscar por ingeniero, empresa..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm font-inter"
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
                (doc.status === 'PENDIENTE_DOCUMENTACION' || doc.status === 'REQUIERE_CORRECCIONES' || !doc.status || (currentUserRole === 'admin' && doc.status === 'APROBADO')) 
                  ? (e) => handleStatusUpdateClick(doc, e) 
                  : undefined
              }
              actionLabel={
                doc.status === 'REQUIERE_CORRECCIONES' ? "Finalizar y Enviar a Revisión" :
                doc.status === 'APROBADO' ? "Enviar Documentos" :
                "Confirmar Carga de Documentos"
              }
              actionDisabled={!doc.docCount || doc.docCount === 0}
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
         validation={selectedDoc}
      />
      
      {/* Admin Review Modal */}
      {selectedDoc && (
          <ValidationReviewModal
            isOpen={isReviewModalOpen}
            onClose={handleCloseReviewModal}
            validationId={selectedDoc.id}
            companyName={selectedDoc.companyName}
          />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeStatusUpdate}
        title={
            confirmModal.doc?.status === 'APROBADO' 
                ? "Confirmar Envío de Documentos"
                : "Confirmar Finalización"
        }
        message={
            confirmModal.doc?.status === 'APROBADO' ? (
                <span>
                    ¿Estás seguro que deseas enviar los documentos finales? 
                    <br/><br/>
                    El estado cambiará a <strong>COMPLETADO</strong>.
                </span>
            ) : (
                <span>
                    ¿Estás seguro que deseas notificar que has cargado toda la documentación? 
                    <br/><br/>
                    El estado cambiará a <strong>EN_REVISIÓN</strong> y el administrador será notificado.
                </span>
            )
        }
        confirmLabel="Sí, Confirmar"
        isProcessing={confirmModal.isProcessing}
      />
    </DashboardLayout>
  );
}
