'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import BaseModal from '../modals/BaseModal';
import { appointmentService } from '@/app/services/appointments/appointmentService';

interface ValidationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  validation: any;
}

export default function ValidationUploadModal({ 
  isOpen, 
  onClose, 
  validation 
}: ValidationUploadModalProps) {
  // Common State
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Normal Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
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
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const rawFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const MAX_SIZE = 20 * 1024 * 1024; // 20MB

      rawFiles.forEach(file => {
          if (file.size > MAX_SIZE) {
              alert(`El archivo "${file.name}" supera el límite de 20MB y no fue agregado.`);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        alert('Todos los documentos se subieron correctamente.');
        resetModal();
    } else {
        alert(`Se subieron ${successCount} archivos. Errores:\n${errors.join('\n')}`);
        resetModal();
    }
  };

  // --- Correction Logic ---

  const handleReplacementSelect = (docId: string, e: ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         // Basic validation
         if (file.size > 20 * 1024 * 1024) {
             alert('El archivo supera el límite de 20MB');
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
              alert('Correcciones enviadas exitosamente.');
              setReplacementFiles({});
              loadRejectedDocuments();
          } else {
              alert(`Se enviaron ${successCount} correcciones. Errores:\n${errors.join('\n')}`);
              setReplacementFiles({});
              loadRejectedDocuments();
          }
      } else {
          alert(`Error al enviar correcciones:\n${errors.join('\n')}`);
      }
  };

  const resetModal = () => {
      setFiles([]);
      setShowConfirmation(false);
      setIsUploading(false);
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
      <div className="space-y-6">
        {/* Info Card */}
        <div className={`border rounded-lg p-4 ${isCorrectionMode ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
          <h4 className={`text-sm font-semibold mb-2 ${isCorrectionMode ? 'text-red-900' : 'text-blue-900'}`}>Detalles de la Validación</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div><span className="opacity-75 block text-xs">Empresa</span><span className="font-medium">{validation.companyName}</span></div>
             <div><span className="opacity-75 block text-xs">Ingeniero</span><span className="font-medium">{validation.engineerName}</span></div>
             <div><span className="opacity-75 block text-xs">Estado</span><span className="font-medium">{validation.status}</span></div>
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
                        <p className="text-sm text-gray-600">
                            Los siguientes documentos fueron rechazados. Por favor, revisa el motivo y sube una nueva versión para cada uno.
                        </p>
                        {rejectedDocs.map(doc => (
                            <div key={doc.id} className="border border-red-200 rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h5 className="font-medium text-gray-900">{doc.fileName || doc.originalName || 'Documento'}</h5>
                                        <p className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded mt-1">
                                            {doc.documentType || 'Tipo Desconocido'}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">RECHAZADO</span>
                                </div>
                                
                                <div className="bg-red-50 p-3 rounded text-sm text-red-800 mb-4 border-l-4 border-red-400">
                                    <span className="font-semibold block text-xs uppercase tracking-wide opacity-75 mb-1">Motivo del rechazo:</span>
                                    {doc.rejectionReason || "Sin razón especificada."}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Subir corrección</label>
                                        <input 
                                            type="file" 
                                            onChange={(e) => handleReplacementSelect(doc.id, e)}
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
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <input 
                            type="file" 
                            multiple 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileSelect} 
                            accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Sube tus archivos</h3>
                        <p className="mt-1 text-sm text-gray-500">Haz clic para seleccionar (Multiples)</p>
                        <p className="mt-2 text-xs text-gray-400">PDF, Imágenes (Max 20MB)</p>
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
