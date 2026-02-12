'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import BaseModal from '../modals/BaseModal';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { formatFileName } from '@/app/utils/fileUtils';

interface ValidationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  validation: any;
}

export default function ValidationUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  validation 
}: ValidationUploadModalProps) {
  // Common State
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Normal Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Correction Mode State
  const isCorrectionMode = validation?.status === 'REQUIERE_CORRECCIONES';
  const [rejectedDocs, setRejectedDocs] = useState<any[]>([]);
  const [isLoadingRejected, setIsLoadingRejected] = useState(false);
  const [replacementFiles, setReplacementFiles] = useState<{[key: string]: File}>({});

  useEffect(() => {
    if (isOpen && isCorrectionMode && validation?.id) {
       loadRejectedDocuments();
    }
  }, [isOpen, isCorrectionMode, validation?.id]);

  const loadRejectedDocuments = async () => {
    setIsLoadingRejected(true);
    try {
        const response = await appointmentService.getValidationDocuments(validation.id);
        if (response.success && response.data) {
            const docs = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
            const rejected = docs.filter((d: any) => d.status === 'RECHAZADO');
            setRejectedDocs(rejected);
        }
    } catch (error) {
        console.error('Error loading rejected docs:', error);
    } finally {
        setIsLoadingRejected(false);
    }
  };

  if (!validation) return null;

  // --- Normal Upload Logic ---
  // Helper for processing files (used by select and drop)
  const processFiles = (incomingFiles: File[]) => {
    const validFiles: File[] = [];
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB

    incomingFiles.forEach(file => {
        if (file.size > MAX_SIZE) {
            setStatusMessage({ type: 'error', text: `El archivo "${file.name}" supera el límite de 20MB.` });
            return;
        }
        
        const sanitizedName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '');

        const sanitizedFile = new File([file], sanitizedName, { type: file.type });
        validFiles.push(sanitizedFile);
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUploadClick = () => {
    if (files.length === 0) return;
    setShowConfirmation(true);
  };

  const confirmAndUpload = async () => {
    setShowConfirmation(false);
    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    let errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const response = await appointmentService.uploadValidationDocument(validation.id, files[i]);
            if (response.success) {
                successCount++;
            } else {
                errors.push(`Error en ${files[i].name}: ${response.error}`);
            }
        } catch (err) {
            errors.push(`Fallo al subir ${files[i].name}`);
            console.error(err);
        }
        setUploadProgress(i + 1);
    }

    setIsUploading(false);
    if (errors.length === 0) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => resetModal(), 2000);
    } else {
        setStatusMessage({ 
            type: 'error', 
            text: `Se subieron ${successCount} archivos. Errores:\n${errors.join('\n')}` 
        });
    }
  };

  // --- Correction Logic ---

  const handleReplacementSelect = (docId: string, e: ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         // Basic validation
         if (file.size > 20 * 1024 * 1024) {
             setStatusMessage({ type: 'error', text: 'El archivo supera el límite de 20MB' });
             return;
         }
         
          const sanitizedName = file.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '');

         const sanitizedFile = new File([file], sanitizedName, { type: file.type });
         
         setReplacementFiles(prev => ({
             ...prev,
             [docId]: sanitizedFile
         }));
     }
  };

  const handleSendCorrections = async () => {
      const keys = Object.keys(replacementFiles);
      if (keys.length === 0) return;
      
      setIsUploading(true);
      let successCount = 0;
      let errors: string[] = [];

      for (const docId of keys) {
          const file = replacementFiles[docId];
          try {
             const response = await appointmentService.replaceDocument(validation.id, docId, file);
             if (response.success) {
                 successCount++;
             } else {
                 errors.push(`Error remplazando ${file.name}: ${response.error}`);
             }
          } catch (err) {
             errors.push(`Fallo al enviar ${file.name}`);
             console.error(err);
          }
      }

      setIsUploading(false);

      if (successCount > 0) {
          if (errors.length === 0) {
              setIsSuccess(true);
              if (onSuccess) onSuccess();
              setReplacementFiles({});
              setTimeout(() => {
                  setIsSuccess(false);
                  loadRejectedDocuments();
                  onClose();
              }, 2000);
          } else {
              setStatusMessage({ 
                  type: 'error', 
                  text: `Se enviaron ${successCount} correcciones. Errores:\n${errors.join('\n')}` 
              });
              setReplacementFiles({});
              loadRejectedDocuments();
          }
      } else {
          setStatusMessage({ type: 'error', text: `Error al enviar correcciones:\n${errors.join('\n')}` });
      }
  };

  const resetModal = () => {
      setFiles([]);
      setShowConfirmation(false);
      setIsUploading(false);
      setIsSuccess(false);
      setStatusMessage(null);
      setRejectedDocs([]);
      setReplacementFiles({});
      onClose();
  }

  // Confirmation View (Only for normal bulk upload)
  if (showConfirmation && !isCorrectionMode) {
      return (
          <BaseModal 
            isOpen={isOpen} 
            onClose={() => setShowConfirmation(false)}
            title="Confirmar Subida"
            size="md"
          >
              <div className="p-4">
                  <p className="text-gray-700 mb-4">
                      ¿Estás seguro que deseas subir <strong>{files.length}</strong> archivos?
                  </p>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                      <button onClick={confirmAndUpload} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirmar y Subir</button>
                  </div>
              </div>
          </BaseModal>
      )
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={resetModal}
      title={isCorrectionMode ? "Corregir Documentación Rechazada" : "Subir Documentación de Validación"}
      size="lg"
    >
      <div className="space-y-6 relative min-h-[300px]">
        {/* Success Overlay */}
        {isSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 rounded-xl">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-black uppercase tracking-widest">¡Envío Exitoso!</h3>
                <p className="text-sm text-gray-800 font-bold mt-2 uppercase tracking-tight">Los documentos se han procesado correctamente</p>
            </div>
        )}

        {/* Status Message (Toast-like) */}
        {statusMessage && (
            <div className={`p-4 rounded-xl border flex justify-between items-center animate-in slide-in-from-top-4 duration-300 shadow-lg
                ${statusMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 
                  statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : 
                  'bg-blue-50 border-blue-200 text-blue-900'}`}
            >
                <div className="flex items-center gap-3">
                    {statusMessage.type === 'error' && (
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span className="text-xs font-black uppercase tracking-wide">{statusMessage.text}</span>
                </div>
                <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )}

        {/* Info Card */}
        <div className={`border rounded-lg p-4 ${isCorrectionMode ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
          <h4 className={`text-sm font-semibold mb-2 ${isCorrectionMode ? 'text-red-900' : 'text-blue-900'}`}>Detalles de la Validación</h4>
          <div className="grid grid-cols-2 gap-4 text-sm mt-3">
             <div><span className="text-black font-black uppercase text-[10px] tracking-widest block mb-1">Empresa</span><span className="font-black text-black text-base italic">{validation.companyName}</span></div>
             <div><span className="text-black font-black uppercase text-[10px] tracking-widest block mb-1">Ingeniero</span><span className="font-black text-black text-base italic">{validation.engineerName}</span></div>
             <div><span className="text-black font-black uppercase text-[10px] tracking-widest block mb-1">Estado Actual</span><span className="font-black text-black text-sm">{(validation.status || '').replace(/_/g, ' ')}</span></div>
          </div>
        </div>

        {isCorrectionMode ? (
            // --- CORRECTION MODE UI ---
            <div>
                {isLoadingRejected ? (
                    <div className="flex justify-center py-8">
                        <span className="animate-spin h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full"></span>
                    </div>
                ) : rejectedDocs.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500">
                        No se encontraron documentos rechazados para corregir.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-800 font-bold mb-4">
                            Los siguientes documentos fueron rechazados. Por favor, revisa el motivo y sube una nueva versión para cada uno.
                        </p>
                        {rejectedDocs.map(doc => (
                            <div key={doc.id} className="border border-red-200 rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h5 className="font-medium text-gray-900">{formatFileName(doc.fileName || doc.originalName) || 'Documento'}</h5>
                                        <p className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">
                                            {doc.documentType || 'Tipo Desconocido'}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">RECHAZADO</span>
                                </div>
                                
                                <div className="bg-red-50 p-3 rounded text-sm text-red-900 mb-4 border-l-4 border-red-400">
                                    <span className="font-black block text-[10px] uppercase tracking-widest text-red-950 mb-1">Motivo del rechazo:</span>
                                    {doc.rejectionReason || doc.reviewNotes || doc.notes || doc.reason || doc.rejection_reason || doc.review_notes || "Razón no disponible. Por favor contacte al administrador."}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Subir corrección</label>
                                        <input 
                                            type="file" 
                                            onChange={(e) => handleReplacementSelect(doc.id, e)}
                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                                            className="block w-full text-sm text-gray-500
                                              file:mr-4 file:py-2 file:px-4
                                              file:rounded-full file:border-0
                                              file:text-sm file:font-semibold
                                              file:bg-blue-50 file:text-blue-700
                                              hover:file:bg-blue-100
                                            "
                                        />
                                    </div>
                                </div>
                                {replacementFiles[doc.id] && (
                                    <p className="text-xs text-green-600 mt-2 font-medium flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Listo para enviar: {replacementFiles[doc.id].name}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={resetModal} className="px-4 py-2 text-gray-700 hover:bg-gray-50 border rounded-lg">Cancelar</button>
                    <button 
                        onClick={handleSendCorrections}
                        disabled={isUploading || Object.keys(replacementFiles).length === 0}
                        className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm
                            ${Object.keys(replacementFiles).length === 0 || isUploading 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'}
                        `}
                    >
                        {isUploading ? 'Enviando...' : `Enviar ${Object.keys(replacementFiles).length} Correcciones`}
                    </button>
                </div>
            </div>
        ) : (
            // --- NORMAL MODE UI (Existing) ---
            !isUploading ? (
                <>
                    <div 
                        onClick={triggerFileInput}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative
                            ${isDragging 
                                ? 'border-blue-600 bg-blue-50 scale-[1.02] shadow-md' 
                                : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                        {isDragging && (
                            <div className="absolute inset-0 bg-blue-600/5 flex items-center justify-center pointer-events-none rounded-xl z-10">
                                <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-black animate-bounce shadow-lg">¡SUELTA LOS ARCHIVOS AQUÍ!</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            multiple 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileSelect} 
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                        />
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 transition-colors
                            ${isDragging ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-black">Sube tus archivos</h3>
                        <p className="mt-1 text-sm text-gray-800 font-bold uppercase tracking-tight">Selecciona o arrastra varios archivos aquí</p>
                        <p className="mt-2 text-[10px] text-blue-800 font-black uppercase tracking-widest">PDF, Imágenes, Word, Excel (Max 20MB)</p>
                    </div>

                    {files.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Archivos Seleccionados ({files.length})</p>
                            <div className="space-y-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm text-sm">
                                        <span className="truncate max-w-[80%] text-gray-700">{file.name}</span>
                                        <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                     <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={resetModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                        <button
                            onClick={handleUploadClick}
                            disabled={files.length === 0}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${files.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            Subir Documentos ({files.length})
                        </button>
                    </div>
                </>
            ) : (
                <div className="py-8 text-center">
                     <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                     <h3 className="text-lg font-medium text-gray-900">Subiendo documentos...</h3>
                     <p className="text-gray-500 text-sm mt-1">{uploadProgress} de {files.length} completados</p>
                     <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress / files.length) * 100}%` }}></div>
                     </div>
                </div>
            )
        )}
      </div>
    </BaseModal>
  );
}
