'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import VisitRegistrationModal from '../visita/VisitRegistrationModal';
import { Appointment } from '@/app/types';
import ConfirmationModal from './ConfirmationModal';
import { formatFileName } from '@/app/utils/fileUtils';

interface ValidationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationId: string;
  companyName: string;
  appointmentId?: string;
  readOnly?: boolean;
}

export default function ValidationReviewModal({
  isOpen,
  onClose,
  validationId,
  companyName,
  appointmentId,
  readOnly = false
}: ValidationReviewModalProps) {

  const [documents, setDocuments] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [fullAppointment, setFullAppointment] = useState<Appointment | null>(null);
  const [showFullEvaluation, setShowFullEvaluation] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // State for active document being previewed
  const [activeDoc, setActiveDoc] = useState<any>(null);
  
  // Rejection logic
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Delete document state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (statusMessage) {
        const timer = setTimeout(() => setStatusMessage(null), 3500);
        return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    // Get user role once
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (err) {
        console.error('Error parsing user for role check', err);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (validationId) {
        loadDocuments();
        if (appointmentId) loadEvaluation();
        setActiveDoc(null); 
        setSelectedPreview(null);
        setIsRejecting(false);
        setRejectionReason('');
        setShowDeleteConfirm(false);
      } else {
        console.error('ValidationReviewModal: Missing validationId');
      }
    }
  }, [isOpen, validationId, appointmentId]);

    const loadDocuments = async () => {
    setIsLoading(true);
    
    // Determine user role early
    let currentRole = userRole;
    if (!currentRole) {
         const uStr = localStorage.getItem('user');
         if (uStr) {
             try { currentRole = JSON.parse(uStr).role; } catch {}
         }
    }
    const isAdmin = currentRole?.toLowerCase() === 'admin';

    try {
      // Parallel fetch for documents and potentially the Acta (Record)

      const tasks: [Promise<any>, Promise<any>?] = [
        appointmentService.getValidationDocuments(validationId)
      ];

      if (appointmentId) {
        tasks.push(
            appointmentService.getAppointmentRecord(appointmentId).then(async (res) => {
                if (!res.success) {
                    // Fallback: If getting record fails (e.g. not signed), try getting preview
                    // and assume status is PENDIENTE/NO_COMPLETADO
                    try {
                        const previewRes = await appointmentService.getAppointmentRecordPreview(appointmentId);
                        if (previewRes.success && previewRes.data) {
                            return { 
                                success: true, 
                                data: { ...previewRes.data, status: 'PENDIENTE' } 
                            };
                        }
                    } catch (e) {
                        console.error("Fallback preview failed", e);
                    }
                }
                return res;
            })
        );
      }

      const [response, recordRes] = await Promise.all(tasks);

      let finalDocs: any[] = [];

      // 1. Add Acta if exists
      if (recordRes) {
        const actaStatus = recordRes.success ? (recordRes.data?.status || 'PENDIENTE') : 'ERROR_CARGA';
        const hasUrl = recordRes.success && recordRes.data?.url;
        
        const normalizedStatus = (actaStatus || '').toUpperCase();
        const isApproved = ['ACEPTADA', 'APROBADO', 'COMPLETADA', 'COMPLETADO'].includes(normalizedStatus);
        
        // Admin sees it even if it failed loading (to debug) or if pending.
        // Companies see it only if Approved (regardless of initial URL, to allow manual fetch retry)
        if ((isAdmin && appointmentId) || isApproved) {
             // If failed or url missing but approved, we create the item
             if (recordRes.success || isAdmin) {
                 finalDocs.push({
                    id: 'ACTA_VISITA_ID',
                    fileName: 'Acta de Visita (PDF)',
                    url: hasUrl ? recordRes.data.url : null,
                    status: actaStatus,
                    isActa: true,
                    hasPreview: hasUrl || true 
                 });
             }
        }
      }

      // 2. Add validation documents
      if (response.success) {
        let docs = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
        
        // Fetch previews for validation documents
        const docPromises = docs.map(async (doc: any) => {
            try {
                const previewRes = await appointmentService.getDocumentPreview(validationId, doc.id);
                if (previewRes.success && previewRes.data) {
                    return {
                        ...doc,
                        ...previewRes.data,
                        hasPreview: true
                    };
                }
                return doc;
            } catch (err) {
                console.error(`Error fetching preview for doc ${doc.id}`, err);
                return doc;
            }
        });

        const docsWithPreviews = await Promise.all(docPromises);
        finalDocs = [...finalDocs, ...docsWithPreviews];
        
        // Auto-approve logic for Admin if no documents and status is EN_REVISION
        const valDocsCount = docs.length;
        if (isAdmin && valDocsCount === 0 && appointmentId) {
             // Non-blocking check to avoid UI delay
             appointmentService.getAppointmentValidation(appointmentId).then(async (vRes) => {
                 if (vRes.success && vRes.data?.status === 'EN_REVISION') {
                      console.log("Auto-approving empty validation...");
                      const upRes = await appointmentService.updateValidationStatus(appointmentId, 'APROBADO');
                      if (upRes.success) {
                           setStatusMessage({ type: 'success', text: 'Validación sin documentos: Aprobada automáticamente.' });
                      }
                 }
             }).catch(err => console.error("Auto-approve check failed", err));
        }
      }

      setDocuments(finalDocs);

      // Auto-select Acta if it's the first one
      if (finalDocs.length > 0 && !activeDoc) {
        handleSelectDoc(finalDocs[0]);
      }

    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvaluation = async () => {
    if (!appointmentId) return;
    
    try {
      const response = await appointmentService.getVisitEvaluation(appointmentId);
      
      // Extract data handling potential wrappers { success, data, ... }
      const evalData = response?.success === true ? (response.data || response) : response;
      
      if (evalData) {
        setEvaluation(evalData);
      }
      
      // Also load the full appointment for the VisitRegistrationModal
      const aptResponse = await appointmentService.getAppointmentById(appointmentId);
      const fullApt = (aptResponse?.success === true ? aptResponse.data : aptResponse) as any;
      
      if (fullApt) {
          setFullAppointment(fullApt);
      }
    } catch (error) {
      console.error('Error loading evaluation for modal:', error);
    }
  };

  const handleSelectDoc = (doc: any) => {
      setActiveDoc(doc);
      setIsRejecting(false);
      if (doc.url) {
          setSelectedPreview(doc.url);
      } else {
         manualPreviewFetch(doc);
      }
  };

  const manualPreviewFetch = async (doc: any) => {
    setPreviewLoading(true);
    try {
        let response;
        if (doc.isActa && appointmentId) {
             response = await appointmentService.getAppointmentRecordPreview(appointmentId);
        } else {
             response = await appointmentService.getDocumentPreview(validationId, doc.id);
        }

        if (response.success && response.data && response.data.url) {
            setSelectedPreview(response.data.url);
        } else {
            setStatusMessage({ type: 'error', text: 'No se pudo obtener la visualización del documento.' });
        }
    } catch (error) {
        console.error('Error fetching preview:', error);
        setStatusMessage({ type: 'error', text: 'Error al cargar el documento.' });
    } finally {
        setPreviewLoading(false);
    }
  };



  const handleApprove = async () => {
      if (!activeDoc) return;
      setActionProcessing(true);
      try {
          const response = await appointmentService.reviewDocument(validationId, activeDoc.id, {
              status: 'APROBADO'
          });
          
          if (response.success) {
              updateLocalDocStatus(activeDoc.id, 'APROBADO');
              setStatusMessage({ type: 'success', text: 'Documento aprobado' });
          } else {
              setStatusMessage({ type: 'error', text: 'Error al aprobar: ' + response.error });
          }
      } catch (error) {
          console.error(error);
          setStatusMessage({ type: 'error', text: 'Error al procesar la aprobación' });
      } finally {
          setActionProcessing(false);
      }
  };

  const handleReject = async () => {
      if (!activeDoc) return;
      if (!rejectionReason.trim()) {
          setStatusMessage({ type: 'error', text: 'Debes ingresar una razón para el rechazo.' });
          return;
      }

      setActionProcessing(true);
      try {
          const response = await appointmentService.reviewDocument(validationId, activeDoc.id, {
              status: 'RECHAZADO',
              rejectionReason: rejectionReason,
              reviewNotes: rejectionReason
          });
          
          if (response.success) {
              updateLocalDocStatus(activeDoc.id, 'RECHAZADO');
              setIsRejecting(false);
              setRejectionReason('');
              setStatusMessage({ type: 'success', text: 'Documento rechazado' });
          } else {
              setStatusMessage({ type: 'error', text: 'Error al rechazar: ' + response.error });
          }
      } catch (error) {
          console.error(error);
          setStatusMessage({ type: 'error', text: 'Error al procesar el rechazo' });
      } finally {
          setActionProcessing(false);
      }
  };

  const handleDeleteDocument = async () => {
      if (!activeDoc) return;
      
      setIsDeleting(true);
      try {
          const response = await appointmentService.deleteDocument(validationId, activeDoc.id);
          
          if (response.success) {
              // Remove document from list
              setDocuments(prev => prev.filter(d => d.id !== activeDoc.id));
              setStatusMessage({ type: 'success', text: 'Documento eliminado correctamente' });
              
              // Clear active document and preview
              setActiveDoc(null);
              setSelectedPreview(null);
              setShowDeleteConfirm(false);
              
              // Select first remaining document if any
              const remainingDocs = documents.filter(d => d.id !== activeDoc.id);
              if (remainingDocs.length > 0) {
                  handleSelectDoc(remainingDocs[0]);
              }
          } else {
              setStatusMessage({ type: 'error', text: 'Error al eliminar: ' + response.error });
          }
      } catch (error) {
          console.error(error);
          setStatusMessage({ type: 'error', text: 'Error al eliminar el documento' });
      } finally {
          setIsDeleting(false);
          setShowDeleteConfirm(false);
      }
  };

  const handleApproveActa = async () => {
      if (!appointmentId) return;
      setActionProcessing(true);
      try {
          const response = await appointmentService.reviewAppointmentRecord(appointmentId, {
              status: 'ACEPTADA'
          });
          
          if (response.success) {
              updateLocalDocStatus('ACTA_VISITA_ID', 'ACEPTADA');
              setStatusMessage({ type: 'success', text: 'Acta aprobada correctamente' });
          } else {
              setStatusMessage({ type: 'error', text: 'Error al aprobar el acta: ' + response.error });
          }
      } catch (error) {
          console.error(error);
          setStatusMessage({ type: 'error', text: 'Error al procesar la aprobación del acta' });
      } finally {
          setActionProcessing(false);
      }
  };

  const handleRejectActa = async () => {
      if (!appointmentId) return;

      setActionProcessing(true);
      try {
          const response = await appointmentService.reviewAppointmentRecord(appointmentId, {
              status: 'RECHAZADA'
          });
          
          if (response.success) {
              setStatusMessage({ type: 'success', text: 'Acta rechazada correctamente' });
          } else {
              setStatusMessage({ type: 'error', text: 'Error al rechazar el acta: ' + response.error });
          }
      } catch (error) {
          console.error(error);
          setStatusMessage({ type: 'error', text: 'Error al procesar el rechazo del acta' });
      } finally {
          setActionProcessing(false);
      }
  };


  const updateLocalDocStatus = (docId: string, status: string) => {
      setDocuments(prev => prev.map(d => 
          d.id === docId ? { ...d, status: status } : d
      ));
      // Update active doc ref as well
      if (activeDoc && activeDoc.id === docId) {
          setActiveDoc({ ...activeDoc, status: status });
      }
  };


  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Revisión de Documentos - ${companyName}`}
      size="xl" 
    >
      <div className="flex h-[75vh] gap-6 relative">
          {/* Status Toast Message */}
          {statusMessage && (
               <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-xl border animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2
                    ${statusMessage.type === 'success' ? 'bg-green-600 text-white border-green-500' : 'bg-red-600 text-white border-red-500'}`}>
                    {statusMessage.type === 'success' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <span className="text-sm font-black uppercase tracking-wider">{statusMessage.text}</span>
               </div>
          )}

        {/* Left Side: Document List + Evaluation Summary for Engineers */}
        <div className="w-1/3 border-r border-gray-200 pr-4 flex flex-col gap-6 overflow-hidden">
            
            {/* Evaluation Summary Card */}
            {(userRole === 'ingeniero' || userRole === 'empresario' || userRole === 'company') && evaluation && (
                <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-lg shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-100">Evaluación de Visita</h3>
                        <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-black italic">
                            {(userRole === 'empresario' || userRole === 'company') ? 'RESULTADOS' : 'REVISIÓN'}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="opacity-20" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                    strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - (evaluation.successRate || 0)/100)} 
                                    strokeLinecap="round" className="transition-all duration-1000" />
                             </svg>
                             <span className="absolute text-lg font-black">{Math.round(evaluation.successRate || 0)}%</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-100 leading-tight mb-1 uppercase tracking-widest">CUMPLIMIENTO</p>
                            <p className="text-sm font-black">
                                {evaluation.successRate >= 80 ? 'Excelente Desempeño' : 
                                 evaluation.successRate >= 60 ? 'Aceptable con Ajustes' : 'Requiere Intervención'}
                            </p>
                        </div>
                    </div>

                    {evaluation.categories ? (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/10 text-[10px]">
                            {evaluation.categories.slice(0, 4).map((cat: any, idx: number) => (
                                <div key={idx} className="flex flex-col gap-0.5">
                                    <span className="opacity-70 truncate">{cat.name}</span>
                                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                                        <div className="bg-white h-full" style={{ width: `${cat.score}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <p className="text-[10px] opacity-70 italic text-center">Detalle del cumplimiento técnico detallado.</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowFullEvaluation(true)}
                        className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-xs font-bold transition-all"
                    >
                        Ver Detalle Completo
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-4 overflow-y-auto flex-1">
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest">Documentos Subidos</h3>
                
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    No hay documentos en esta validación.
                </div>
            ) : (
                <div className="space-y-3 pb-4">
                    {documents.map((doc) => (
                        <div 
                            key={doc.id} 
                            onClick={() => handleSelectDoc(doc)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm flex items-start justify-between
                                ${activeDoc?.id === doc.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-300'}
                            `}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded flex-shrink-0 
                                    ${doc.isActa ? 'bg-blue-600 text-white shadow-sm' : 
                                      doc.status === 'APROBADO' ? 'bg-green-100 text-green-600' : 
                                      doc.status === 'RECHAZADO' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {doc.isActa ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-black truncate ${doc.isActa ? 'text-blue-700' : 'text-black'}`} title={formatFileName(doc.fileName || doc.originalName)}>
                                        {formatFileName(doc.fileName || doc.originalName) || 'Documento sin nombre'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {!readOnly && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border
                                                ${doc.status === 'APROBADO' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                  doc.status === 'RECHAZADO' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`
                                            }>
                                                {(doc.status || 'PENDIENTE').replace(/_/g, ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>

        {/* Right Side: Preview Pane */}
        <div className="w-2/3 flex flex-col gap-4">
             <div className="flex-1 bg-gray-50 rounded-xl overflow-hidden flex flex-col relative border border-gray-200 min-h-0">
                {previewLoading ? (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            <p className="text-sm font-medium text-gray-600">Cargando previsualización...</p>
                        </div>
                     </div>
                ) : selectedPreview ? (
                    <iframe 
                        src={selectedPreview} 
                        className="w-full h-full"
                        title="Previsualización del documento"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-3">
                        <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <p className="font-medium">Seleccione un documento para revisar</p>
                    </div>
                )}
            </div>

            {/* Unified Document Review Section */}
            {activeDoc && !readOnly && (activeDoc.status !== 'APROBADO' && activeDoc.status !== 'ACEPTADA') && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                        <h4 className="font-medium text-gray-900 min-w-0 break-words flex-1">
                            Revisión: {formatFileName(activeDoc.fileName)}
                        </h4>
                        {!activeDoc.isActa && !isRejecting && (
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                    
                    {/* Rejection UI Logic */}
                    {!activeDoc.isActa && isRejecting ? (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                             <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Razón del rechazo (Requerido)</label>
                             <textarea
                                 value={rejectionReason}
                                 onChange={(e) => setRejectionReason(e.target.value)}
                                 placeholder="Indica detalladamente por qué se rechaza este documento..."
                                 className="w-full text-sm p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-black font-bold mb-3"
                                 rows={2}
                             />
                             <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={() => { setIsRejecting(false); setRejectionReason(''); }}
                                    className="text-gray-500 text-sm hover:text-gray-700 px-3 py-2"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleReject}
                                    disabled={actionProcessing}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm disabled:opacity-50"
                                >
                                    {actionProcessing ? 'Procesando...' : 'Confirmar Rechazo'}
                                </button>
                             </div>
                         </div>
                    ) : (
                        /* Standard Actions */
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={activeDoc.isActa ? handleRejectActa : () => setIsRejecting(true)}
                                disabled={actionProcessing}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 flex-1 sm:flex-none"
                            >
                                {actionProcessing ? '...' : (activeDoc.isActa ? 'Rechazar Acta' : 'Rechazar')}
                            </button>
                            <button 
                                onClick={activeDoc.isActa ? handleApproveActa : handleApprove}
                                disabled={actionProcessing}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 shadow-sm disabled:opacity-50 flex-1 sm:flex-none"
                            >
                                {actionProcessing ? '...' : (activeDoc.isActa ? 'Aprobar Acta' : 'Aprobar')}
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* Read Only Info Bar */}
            {activeDoc && readOnly && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Visualizando: {formatFileName(activeDoc.fileName)}</h4>
                </div>
            )}
        </div>
      </div>

      {/* Full Evaluation Read-Only View */}
      {showFullEvaluation && fullAppointment && (
          <VisitRegistrationModal
            isOpen={showFullEvaluation}
            onClose={() => setShowFullEvaluation(false)}
            appointment={fullAppointment}
            readOnly={true}
          />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteDocument}
        title="Eliminar Documento"
        message={`¿Estás seguro de que deseas eliminar el documento "${formatFileName(activeDoc?.fileName || '')}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isProcessing={isDeleting}
      />
    </BaseModal>
  );
}
