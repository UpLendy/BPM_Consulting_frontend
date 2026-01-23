'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { appointmentService } from '@/app/services/appointments/appointmentService';

interface ValidationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationId: string;
  companyName: string;
  readOnly?: boolean;
}

export default function ValidationReviewModal({
  isOpen,
  onClose,
  validationId,
  companyName,
  readOnly = false
}: ValidationReviewModalProps) {

  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // State for active document being previewed
  const [activeDoc, setActiveDoc] = useState<any>(null);
  
  // Rejection logic
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (validationId) {
        loadDocuments();
        setActiveDoc(null); 
        setSelectedPreview(null);
        setIsRejecting(false);
        setRejectionReason('');
      } else {
        console.error('ValidationReviewModal: Missing validationId');
      }
    }
  }, [isOpen, validationId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching documents for validation:', validationId);
      const response = await appointmentService.getValidationDocuments(validationId);
      if (response.success) {
        // Ensure data is array
        let docs = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
        console.log('Documents fetched:', docs);

        // Fetch previews for ALL documents to get fileName and URL as requested
        const docPromises = docs.map(async (doc: any) => {
            try {
                const previewRes = await appointmentService.getDocumentPreview(validationId, doc.id);
                if (previewRes.success && previewRes.data) {
                    return {
                        ...doc,
                        ...previewRes.data, // Merges url, fileName, mimeType
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
        setDocuments(docsWithPreviews);
      } else {
        console.error('Error fetching documents:', response.error);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
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
        const response = await appointmentService.getDocumentPreview(validationId, doc.id);
        if (response.success && response.data && response.data.url) {
            setSelectedPreview(response.data.url);
        } else {
            alert('No se pudo obtener la visualización del documento.');
        }
    } catch (error) {
        console.error('Error fetching preview:', error);
        alert('Error al cargar el documento.');
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
          } else {
              alert('Error al aprobar: ' + response.error);
          }
      } catch (error) {
          console.error(error);
          alert('Error al procesar la aprobación');
      } finally {
          setActionProcessing(false);
      }
  };

  const handleReject = async () => {
      if (!activeDoc) return;
      if (!rejectionReason.trim()) {
          alert('Debes ingresar una razón para el rechazo.');
          return;
      }

      setActionProcessing(true);
      try {
          const response = await appointmentService.reviewDocument(validationId, activeDoc.id, {
              status: 'RECHAZADO',
              rejectionReason: rejectionReason
          });
          
          if (response.success) {
              updateLocalDocStatus(activeDoc.id, 'RECHAZADO');
              setIsRejecting(false);
              setRejectionReason('');
          } else {
              alert('Error al rechazar: ' + response.error);
          }
      } catch (error) {
          console.error(error);
          alert('Error al procesar el rechazo');
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
      <div className="flex h-[75vh] gap-6">
        {/* Left Side: Document List */}
        <div className="w-1/3 border-r border-gray-200 pr-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Documentos Subidos</h3>
            
            {isLoading ? (
                 <div className="flex justify-center py-8">
                    <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                 </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    No hay documentos en esta validación.
                </div>
            ) : (
                <div className="space-y-3">
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
                                    ${doc.status === 'APROBADO' ? 'bg-green-100 text-green-600' : 
                                      doc.status === 'RECHAZADO' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                     <p className="text-sm font-medium text-gray-900 truncate" title={doc.fileName || doc.originalName}>
                                         {doc.fileName || doc.originalName || 'Documento sin nombre'}
                                     </p>
                                     <div className="flex items-center gap-2 mt-0.5">
                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border
                                            ${doc.status === 'APROBADO' ? 'bg-green-50 text-green-700 border-green-200' : 
                                              doc.status === 'RECHAZADO' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`
                                         }>
                                            {doc.status || 'PENDIENTE'}
                                         </span>
                                     </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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

            {activeDoc && !readOnly && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">Revisión: {activeDoc.fileName}</h4>
                        <div className="flex gap-2">
                             {!isRejecting ? (
                                 <>
                                    <button 
                                        onClick={() => setIsRejecting(true)}
                                        disabled={actionProcessing || activeDoc.status === 'RECHAZADO'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${activeDoc.status === 'RECHAZADO' 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'}`}
                                    >
                                        Rechazar
                                    </button>
                                    <button 
                                        onClick={handleApprove}
                                        disabled={actionProcessing || activeDoc.status === 'APROBADO'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${activeDoc.status === 'APROBADO' 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}`}
                                    >
                                        {actionProcessing ? 'Procesando...' : 'Aprobar Documento'}
                                    </button>
                                 </>
                             ) : (
                                 <div className="flex items-center gap-2">
                                     <button 
                                         onClick={() => setIsRejecting(false)}
                                         className="text-gray-500 text-sm hover:underline"
                                     >
                                         Cancelar
                                     </button>
                                     <button 
                                         onClick={handleReject}
                                         disabled={actionProcessing}
                                         className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm"
                                     >
                                         {actionProcessing ? 'Rechazando...' : 'Confirmar Rechazo'}
                                     </button>
                                 </div>
                             )}
                        </div>
                    </div>
                    
                    {isRejecting && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Razón del rechazo (Requerido)</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Indica por qué se rechaza este documento..."
                                className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                rows={2}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Read Only Info Bar */}
            {activeDoc && readOnly && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Visualizando: {activeDoc.fileName}</h4>
                    <span className={`text-xs px-2 py-1 rounded font-bold
                        ${activeDoc.status === 'APROBADO' ? 'bg-green-100 text-green-700' : 
                          activeDoc.status === 'RECHAZADO' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {activeDoc.status || 'PENDIENTE'}
                    </span>
                </div>
            )}
        </div>
      </div>
    </BaseModal>
  );
}
