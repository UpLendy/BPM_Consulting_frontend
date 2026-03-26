'use client';

import { useState, useRef, useEffect } from 'react';
import BaseModal from '@/app/components/modals/BaseModal';
import { Appointment } from '@/app/types';
import SignatureCanvas from 'react-signature-canvas';
import { HiCamera, HiCheckCircle, HiPencil, HiTrash, HiDocumentText, HiExclamation } from 'react-icons/hi';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { representativeService } from '@/app/services/representatives/representativeService';

interface AdvisoryActModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  appointment: Appointment;
  initialStep?: 'form' | 'sign' | 'preview';
}

interface ActFormData {
  executedTimeMinutes: number;
  topicsCovered: string;
  solutions: {
    infrastructure: string;
    inocuity: string;
    staff: string;
    quality: string;
    documentation: string;
  };
  summary: string;
  representativeName: string;
  evidencePhoto: string | null;
  signature: string | null;
  signatureTimestamp?: string | null;
}

export default function AdvisoryActModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  initialStep = 'form'
}: AdvisoryActModalProps) {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showSignatureSuccess, setShowSignatureSuccess] = useState(false);
  const sigPad = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ActFormData>({
    executedTimeMinutes: 180,
    topicsCovered: '',
    representativeName: '',
    solutions: {
      infrastructure: '',
      inocuity: '',
      staff: '',
      quality: '',
      documentation: ''
    },
    summary: '',
    evidencePhoto: null,
    signature: null,
    signatureTimestamp: null
  });

  // Correction Mode State
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [rejectedPdfUrl, setRejectedPdfUrl] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && appointment) {
       appointmentService.getAppointmentRecord(appointment.id).then(async (response) => {
           if (response.success && response.data?.status === 'RECHAZADA') {
               setIsCorrectionMode(true);
               
               let targetUrl = response.data.url;
               // Get fresh download URL to avoid stale links/CORS issues
               try {
                   const downloadRes = await appointmentService.getAppointmentRecordDownloadUrl(appointment.id);
                   if (downloadRes.success && downloadRes.data?.url) {
                       targetUrl = downloadRes.data.url;
                   }
               } catch (e) {
                   console.log("Using original URL fallback");
               }

               setRejectedPdfUrl(targetUrl);
               
               // STRATEGY: Try Local Backup (Works if on same device/browser)
               const localBackupRaw = localStorage.getItem(`sig_backup_${appointment.id}`);
               if (localBackupRaw) {
                   try {
                       const parsed = JSON.parse(localBackupRaw);
                       const { signature, timestamp } = parsed;
                       
                       // Check expiration (72 hours)
                       const createdAt = new Date(timestamp);
                       const now = new Date();
                        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
                        if (diffMinutes <= 4320) {
                            setFormData(prev => ({ ...prev, signature, signatureTimestamp: timestamp }));
                            console.log("Firma recuperada desde respaldo local");
                        } else {
                            console.log("Respaldo local expirado (> 4320 minutos)");
                        }
                   } catch (e) {
                       // Silently ignore or fallback
                       console.log("Formato de respaldo local no compatible");
                   }
               } else {
                   console.log("No se encontró respaldo local de firma");
               }
           }
       });

        // New: Fetch master/profile signature if representativeId is available
        if (appointment.representativeId) {
            representativeService.getRepresentativeSignature(appointment.representativeId).then(async (sigRes) => {
                if (sigRes && sigRes.signatureUrl) {
                    let isExpired = false;
                    if (sigRes.updatedAt) {
                        const updatedAt = new Date(sigRes.updatedAt);
                        const now = new Date();
                         const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
                         if (diffMinutes > 4320) isExpired = true;
                    }

                    if (!isExpired) {
                        const sigUrl = sigRes.signatureUrl;
                        
                        // SECURE STRATEGY: Convert remote URL to Base64 immediately to bypass HTML2Canvas CORS issues
                        try {
                            const response = await fetch(sigUrl);
                            const blob = await response.blob();
                            const reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = () => {
                                const base64data = reader.result as string;
                                setFormData(prev => ({ 
                                    ...prev, 
                                    signature: base64data, // Use the clean local Base64
                                    signatureTimestamp: sigRes.updatedAt 
                                }));
                            };
                        } catch (e) {
                            console.warn("Falling back to direct URL (CORS might block PDF render)", e);
                            setFormData(prev => ({ 
                                ...prev, 
                                signature: sigUrl,
                                signatureTimestamp: sigRes.updatedAt 
                            }));
                        }
                    } else {
                        console.log("Firma de perfil expirada (> 4320 minutos)");
                    }
                }
            });
        }
    }
  }, [isOpen, appointment]);

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  };

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Load cache or initialize representative name
    if (isOpen && appointment) {
      const cacheKey = `act_form_data_${appointment.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Object.keys(parsed).length > 0) {
            // Check if signature in cache is expired
            if (parsed.signature && parsed.signatureTimestamp) {
                const createdAt = new Date(parsed.signatureTimestamp);
                const now = new Date();
                const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

                if (diffMinutes > 4320) {
                    console.log("Firma en cache expirada (> 4320 minutos)");
                    parsed.signature = null;
                    parsed.signatureTimestamp = null;
                }
            }
            
            setFormData(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {
          console.error('Error loading cache', e);
        }
      } else {
        setFormData(prev => ({
          ...prev,
          representativeName: (appointment as any).representativeName || ''
        }));
      }
    }
  }, [isOpen, appointment]);

  // Save cache when formData changes
  useEffect(() => {
    if (isOpen && appointment) {
      const cacheKey = `act_form_data_${appointment.id}`;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(formData));
      } catch (e) {
        console.warn("No se pudo guardar la caché local", e);
      }
    }
  }, [formData, isOpen, appointment]);

  const formatDateTime = (date: Date | string, time: string) => {
    // If date is a string (ISO), extract the date part directly
    let day = '', month = '', year = '';
    
    if (typeof date === 'string' && date.includes('T')) {
      const datePart = date.split('T')[0]; // "YYYY-MM-DD"
      [year, month, day] = datePart.split('-');
    } else {
      const d = new Date(date);
      // fallback to Date methods but being careful
      day = String(d.getUTCDate()).padStart(2, '0');
      month = String(d.getUTCMonth() + 1).padStart(2, '0');
      year = String(d.getUTCFullYear());
    }
    
    // Extract time (HH:mm)
    let formattedTime = time;
    if (time.includes('T')) {
      // If "2026-01-22T10:00:00.000Z", take the 11th characters
      formattedTime = time.substring(11, 16);
    }
    
    return `${day}/${month}/${year} ${formattedTime}`;
  };

  const isEngineerOrAdmin = currentUser?.role === 'engineer' || currentUser?.role === 'admin';
  const eng = (appointment as any)?.engineer || (appointment as any)?.ingeniero;
  const resolvedEngineerName = appointment?.engineerName 
      || (eng?.user?.first_name ? `${eng.user.first_name} ${eng.user.last_name || ''}` : null)
      || (eng?.first_name ? `${eng.first_name} ${eng.last_name || ''}` : null)
      || eng?.name 
      || (isEngineerOrAdmin && currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Ingeniero Asignado');

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDim, setCanvasDim] = useState({ width: 0, height: 200 });

  useEffect(() => {
    if (isOpen && step === 'form' && containerRef.current) {
        const updateSize = () => {
            if (containerRef.current) {
                setCanvasDim({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        
        // Initial sync
        setTimeout(updateSize, 100);
        
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }
  }, [isOpen, step]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, evidencePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSignature = () => {
    sigPad.current?.clear();
    setFormData(prev => ({ ...prev, signature: null, signatureTimestamp: null }));
  };

  const saveSignature = () => {
    if (sigPad.current?.isEmpty()) {
      setErrors(prev => ({...prev, signature: 'Debe realizar la firma'}));
      return;
    }
    const signatureData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    setFormData(prev => ({ 
        ...prev, 
        signature: signatureData,
        signatureTimestamp: new Date().toISOString()
    }));
    setErrors(prev => ({...prev, signature: ''}));
    
    // Mostrar feedback visual elegante en lugar de alert
    setShowSignatureSuccess(true);
    setTimeout(() => setShowSignatureSuccess(false), 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.representativeName.trim()) newErrors.representativeName = 'El nombre del Solicitante es obligatorio';
    if (!formData.executedTimeMinutes || formData.executedTimeMinutes <= 0) newErrors.executedTimeMinutes = 'El Tiempo Ejecutado es obligatorio';
    if (!formData.topicsCovered.trim()) newErrors.topicsCovered = 'Los Temas Tratados son obligatorios';
    if (!formData.solutions.infrastructure.trim()) newErrors.infrastructure = 'Campo obligatorio';
    if (!formData.solutions.inocuity.trim()) newErrors.inocuity = 'Campo obligatorio';
    if (!formData.solutions.staff.trim()) newErrors.staff = 'Campo obligatorio';
    if (!formData.solutions.quality.trim()) newErrors.quality = 'Campo obligatorio';
    if (!formData.solutions.documentation.trim()) newErrors.documentation = 'Campo obligatorio';
    if (!formData.summary.trim()) newErrors.summary = 'El Resumen es obligatorio';
    if (!formData.evidencePhoto) newErrors.evidencePhoto = 'La Foto de Evidencia es obligatoria';
    // Signature is no longer mandatory for generation, as it is collected from the company view
    // if (!formData.signature) newErrors.signature = 'La Firma es obligatoria (debe presionar Guardar Firma)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPreview = () => {
    // Signature existence check (Revision Gate)
    // The timestamp was already verified to be < 120 mins when loaded into the form via useEffect.
    // It should not expire just because the engineer took 20 minutes to type out the minutes.
    const hasValidSignature = !!(formData.signature && formData.signatureTimestamp);

    if (!hasValidSignature) {
        setStatusError('Firma ausente. El cliente debe firmar desde su cuenta para que puedas revisar y generarla.');
        const modalContent = document.querySelector('.max-h-\\[80vh\\]');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (validateForm()) {
      setStep('preview');
    } else {
      // Smooth scroll to top to see errors if necessary
      const modalContent = document.querySelector('.max-h-\\[80vh\\]');
      modalContent?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveFinal = async () => {
    // Signature existence check (Final Gate)
    const hasValidSignature = !!(formData.signature && formData.signatureTimestamp);

    if (!hasValidSignature) {
        setStatusError('Firma ausente. El cliente debe firmar desde su cuenta para que puedas generarla.');
        setStep('form');
        const modalContent = document.querySelector('.max-h-\\[80vh\\]');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    try {
      setIsSaving(true);
      
      // 1. Generate PDF using the new native engine
      const { pdf } = await import('@react-pdf/renderer');
      const AdvisoryActPDF = (await import('./AdvisoryActPDF')).default;
      
      const blob = await pdf(
        <AdvisoryActPDF 
          appointment={appointment} 
          formData={formData} 
          engineerName={resolvedEngineerName} 
        />
      ).toBlob();

      // 2. Finalize
      const companyName = (appointment.companyName || 'Empresa')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_'); // Solo caracteres seguros
      
      // Metadata backup in localStorage
      if (formData.signature) {
        try {
            localStorage.setItem(`sig_backup_${appointment.id}`, JSON.stringify({
                signature: formData.signature,
                timestamp: new Date().toISOString()
            }));
        } catch (e) { console.warn("Local storage full", e); }
      }
      
      const dateStr = new Date(appointment.date).toISOString().split('T')[0];
      const fileName = `acta_asesoria_${companyName}_${dateStr}`;
      const pdfFile = new File([blob], `${fileName}.pdf`, { type: 'application/pdf' });
      
      const uploadRes = await appointmentService.uploadAppointmentRecord(appointment.id, pdfFile, fileName);
      if (!uploadRes.success) {
        setStatusError(uploadRes.error || 'Error al subir el acta');
        setIsSaving(false);
        const modalContent = document.querySelector('.max-h-\\[80vh\\]');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      const signaturePayload = {
        [formData.representativeName]: null
      };
      const signRes = await appointmentService.signAppointmentRecord(appointment.id, signaturePayload);
      if (!signRes.success) {
        setStatusError(signRes.error || 'Error al firmar el acta');
        setIsSaving(false);
        const modalContent = document.querySelector('.max-h-\\[80vh\\]');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Limpiar caché en guardado exitoso
      localStorage.removeItem(`act_form_data_${appointment.id}`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
       console.error('ERROR DETALLADO - GUARDADO ACTA:', error);
       setStatusError('Error inesperado al procesar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'form' ? 'GENERAR ACTA DE ASESORÍA' : 'PREVISUALIZACIÓN DE ACTA'}
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto px-1">
        {statusError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center animate-fade-in shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-bold uppercase tracking-tight">
                  Error: {statusError}
                </p>
              </div>
            </div>
            <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Correction Mode Alert */}
        {isCorrectionMode && step === 'form' && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl flex items-start animate-fade-in shadow-sm mx-4">
            <div className="flex-shrink-0 mt-0.5">
              <HiExclamation className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-tight mb-1">
                Modo de Corrección
              </h3>
              <p className="text-sm text-yellow-700 leading-relaxed mb-2">
                Estás corrigiendo un acta rechazada. Por favor revisa y actualiza la información necesaria.
              </p>
              {rejectedPdfUrl && (
                <a 
                  href={rejectedPdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-xs font-bold text-yellow-800 bg-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors"
                >
                  <HiDocumentText className="mr-1.5 h-3.5 w-3.5" />
                  VER ACTA ORIGINAL (PDF)
                </a>
              )}
            </div>
          </div>
        )}

        {step === 'form' ? (
          <div className="space-y-8 pb-10">
            {/* Header / Info Fija */}
            <div className="bg-gray-100 border border-gray-400 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
                <div>
                   <div className="flex justify-between items-center mb-1">
                     <label className="text-[10px] font-black text-black uppercase tracking-widest">Solicitante</label>
                     {errors.representativeName && <span className="text-[9px] font-bold text-red-600 uppercase">{errors.representativeName}</span>}
                   </div>
                   <input 
                     type="text"
                     value={formData.representativeName}
                     onChange={(e) => {
                       setFormData({...formData, representativeName: e.target.value});
                       if (errors.representativeName) setErrors({...errors, representativeName: ''});
                     }}
                     placeholder="Nombre del solicitante"
                     className={`w-full bg-white border ${errors.representativeName ? 'border-red-500' : 'border-gray-400'} rounded-lg px-3 py-1.5 text-sm font-black text-black focus:ring-2 focus:ring-blue-900 outline-none`}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-black uppercase tracking-widest block mb-1">Empresa</label>
                   <p className="font-black text-black text-base">{appointment.companyName}</p>
                </div>
                <div>
                   <label className="text-[10px] font-black text-black uppercase tracking-widest block mb-1">Asesor Asignado</label>
                   <p className="font-black text-black text-base">
                     {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Cargando...'}
                   </p>
                </div>
                <div>
                   <div className="flex justify-between items-center mb-1">
                     <label className="text-[10px] font-black text-black uppercase tracking-widest">Tiempo Ejecutado (Minutos)</label>
                     {errors.executedTimeMinutes && <span className="text-[9px] font-bold text-red-600 uppercase">{errors.executedTimeMinutes}</span>}
                   </div>
                   <div className="relative">
                     <input 
                       type="number"
                       value={formData.executedTimeMinutes}
                       onChange={(e) => {
                         const val = parseInt(e.target.value) || 0;
                         setFormData({...formData, executedTimeMinutes: val});
                         if (errors.executedTimeMinutes) setErrors({...errors, executedTimeMinutes: ''});
                       }}
                       className={`w-full bg-white border ${errors.executedTimeMinutes ? 'border-red-500' : 'border-gray-400'} rounded-lg px-3 py-1.5 text-sm font-black text-black focus:ring-2 focus:ring-blue-900 outline-none`}
                     />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase pointer-events-none">MIN</span>
                   </div>
                   <p className="mt-1 text-[10px] font-bold text-blue-600 uppercase tracking-tight italic">
                     Convertido: {formatMinutesToHours(formData.executedTimeMinutes)}
                   </p>
                </div>
            </div>

            {/* Temas Tratados */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-wide">
                  <HiDocumentText className="text-blue-600 w-5 h-5" />
                  Temas Tratados
                </label>
                {errors.topicsCovered && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.topicsCovered}</span>}
              </div>
              <textarea 
                placeholder="Describa los temas principales de la asesoría..."
                className={`w-full min-h-[100px] p-4 bg-gray-50 border ${errors.topicsCovered ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-sm font-bold text-black focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all`}
                value={formData.topicsCovered}
                onChange={(e) => {
                  setFormData({...formData, topicsCovered: e.target.value});
                  if (errors.topicsCovered) setErrors({...errors, topicsCovered: ''});
                }}
              />
            </div>

            {/* Soluciones Entregadas */}
            <div className="space-y-4">
              <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Soluciones Entregadas</label>
              
              <div className="space-y-4">
                 <div className={`p-4 bg-white border ${errors.infrastructure ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} rounded-2xl shadow-sm hover:border-blue-200 transition-all`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-blue-600 uppercase block">1. Infraestructura y Diseño Sanitario</span>
                      {errors.infrastructure && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.infrastructure}</span>}
                    </div>
                    <textarea 
                        className="w-full min-h-[80px] text-sm font-bold text-black bg-transparent border-0 p-0 focus:ring-0"
                        placeholder="Recomendaciones estructurales..."
                        value={formData.solutions.infrastructure}
                        onChange={(e) => {
                          setFormData({...formData, solutions: {...formData.solutions, infrastructure: e.target.value}});
                          if (errors.infrastructure) setErrors({...errors, infrastructure: ''});
                        }}
                    />
                 </div>
                 
                 <div className={`p-4 bg-white border ${errors.inocuity ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} rounded-2xl shadow-sm hover:border-blue-200 transition-all`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-blue-600 uppercase block">2. Control de Inocuidad</span>
                      {errors.inocuity && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.inocuity}</span>}
                    </div>
                    <textarea 
                        className="w-full min-h-[80px] text-sm font-bold text-black bg-transparent border-0 p-0 focus:ring-0"
                        placeholder="Programas de control, productos de limpieza..."
                        value={formData.solutions.inocuity}
                        onChange={(e) => {
                          setFormData({...formData, solutions: {...formData.solutions, inocuity: e.target.value}});
                          if (errors.inocuity) setErrors({...errors, inocuity: ''});
                        }}
                    />
                 </div>

                 <div className={`p-4 bg-white border ${errors.staff ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} rounded-2xl shadow-sm hover:border-blue-200 transition-all`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-blue-600 uppercase block">3. Personal y Dotación</span>
                      {errors.staff && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.staff}</span>}
                    </div>
                    <textarea 
                        className="w-full min-h-[80px] text-sm font-bold text-black bg-transparent border-0 p-0 focus:ring-0"
                        placeholder="Protocolos de higiene y bioseguridad..."
                        value={formData.solutions.staff}
                        onChange={(e) => {
                          setFormData({...formData, solutions: {...formData.solutions, staff: e.target.value}});
                          if (errors.staff) setErrors({...errors, staff: ''});
                        }}
                    />
                 </div>

                 <div className={`p-4 bg-white border ${errors.quality ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} rounded-2xl shadow-sm hover:border-blue-200 transition-all`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-blue-600 uppercase block">4. Control de Calidad y Análisis</span>
                      {errors.quality && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.quality}</span>}
                    </div>
                    <textarea 
                        className="w-full min-h-[80px] text-sm font-bold text-black bg-transparent border-0 p-0 focus:ring-0"
                        placeholder="Pruebas de plataforma, mediciones..."
                        value={formData.solutions.quality}
                        onChange={(e) => {
                          setFormData({...formData, solutions: {...formData.solutions, quality: e.target.value}});
                          if (errors.quality) setErrors({...errors, quality: ''});
                        }}
                    />
                 </div>

                 <div className={`p-4 bg-white border ${errors.documentation ? 'border-red-500 bg-red-50/10' : 'border-gray-100'} rounded-2xl shadow-sm hover:border-blue-200 transition-all`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-blue-600 uppercase block">5. Gestión de Documentación y Programas</span>
                      {errors.documentation && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.documentation}</span>}
                    </div>
                    <textarea 
                        className="w-full min-h-[80px] text-sm font-bold text-black bg-transparent border-0 p-0 focus:ring-0"
                        placeholder="Fichas técnicas, formatos, calibración..."
                        value={formData.solutions.documentation}
                        onChange={(e) => {
                          setFormData({...formData, solutions: {...formData.solutions, documentation: e.target.value}});
                          if (errors.documentation) setErrors({...errors, documentation: ''});
                        }}
                    />
                 </div>
              </div>
            </div>

            {/* Resumen Final */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Resumen de la Asesoría</label>
                {errors.summary && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.summary}</span>}
              </div>
              <textarea 
                placeholder="Breve resumen conclusivo de la visita..."
                className={`w-full min-h-[100px] p-4 bg-gray-50 border ${errors.summary ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-sm font-bold text-black focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all`}
                value={formData.summary}
                onChange={(e) => {
                  setFormData({...formData, summary: e.target.value});
                  if (errors.summary) setErrors({...errors, summary: ''});
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Foto de Evidencia</label>
                {errors.evidencePhoto && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.evidencePhoto}</span>}
              </div>
              <div className="flex items-center gap-6">
                <label className={`flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed ${errors.evidencePhoto ? 'border-red-500 bg-red-50/5' : 'border-gray-300'} rounded-3xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all`}>
                  <HiCamera className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-[10px] font-bold text-gray-500">SUBIR FOTO</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                {formData.evidencePhoto && (
                  <div className="relative w-40 h-40 rounded-3xl overflow-hidden group border border-gray-200 shadow-sm">
                    <img src={formData.evidencePhoto} alt="Evidencia" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData({...formData, evidencePhoto: null})}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Firma Preview (Read-only for Engineer) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
               <div className="flex justify-between items-center">
                 <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Firma del Representante</label>
               </div>
               
               {formData.signature ? (
                 <div className="flex items-center gap-6 animate-fade-in">
                    <div className="relative w-64 h-32 bg-gray-50 rounded-3xl overflow-hidden border border-green-200 shadow-inner flex items-center justify-center p-4">
                        <img src={formData.signature} alt="Firma recuperada" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                            <HiCheckCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Firma vinculada</p>
                        <p className="text-xs text-gray-500 leading-tight">Esta firma se ha recuperado automáticamente del perfil del representante y aparecerá en el acta final.</p>
                    </div>
                 </div>
               ) : (
                 <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                        <HiExclamation className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-0.5">Pendiente de firma</p>
                        <p className="text-xs text-blue-600/70 leading-tight">El representante no tiene una firma guardada. Podrá firmar digitalmente desde su panel una vez guardes el acta.</p>
                    </div>
                 </div>
               )}
            </div>

            {/* Botón de Acción Principal */}
            <div className="pt-6 flex justify-end gap-4">
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleContinueToPreview}
                  className="px-10 py-3 bg-blue-900 text-white font-bold rounded-2xl hover:bg-blue-800 shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                >
                  Revisar y Continuar
                </button>
            </div>
          </div>
        ) : (
          /* PASO PREVIEW */
          <div 
            ref={previewRef}
            className="p-10 bg-white space-y-8 max-w-4xl mx-auto border border-gray-200 rounded-lg shadow-sm my-4 pdf-container"
          >
               {/* Document Format Header */}
               <div className="text-center border-b-2 border-blue-900 pb-6">
                  <h2 className="text-3xl font-black text-blue-900 tracking-tighter uppercase italic pdf-title">Acta de Asesoría</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase pdf-subtitle">BPM Consulting S.A.S BIC • Soluciones de Inocuidad</p>
               </div>

                {/* Grid de Información */}
                <div className="grid grid-cols-2 gap-y-4 text-sm font-medium border-b border-gray-100 pb-6 pdf-info-grid">
                   <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Fecha y Hora</span><span className="text-gray-900 font-bold pdf-value">{formatDateTime(appointment.date, appointment.startTime)}</span></div>
                   <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Empresa</span><span className="text-gray-900 font-bold pdf-value">{appointment.companyName}</span></div>
                   <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Solicitante</span><span className="text-gray-900 font-bold pdf-value">{formData.representativeName || '---'}</span></div>
                    <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Asesor Asignado</span><span className="text-gray-900 font-bold pdf-value">{resolvedEngineerName}</span></div>
                   <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Tiempo Ejecutado</span><span className="text-gray-900 font-bold text-blue-800 pdf-value">{formatMinutesToHours(formData.executedTimeMinutes)}</span></div>
                </div>

               {/* Contenido Dinámico */}
               <div className="space-y-6">
                  <section className="pdf-section">
                    <h4 className="text-xs font-black text-blue-900 uppercase border-l-4 border-blue-900 pl-3 mb-2 pdf-section-title">Temas Tratados</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pdf-body-text">{formData.topicsCovered || 'Sin descripción'}</p>
                  </section>

                  <section className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 pdf-solutions-container">
                    <h4 className="text-xs font-black text-blue-900 uppercase mb-4 pdf-section-title">Soluciones Entregadas</h4>
                    <div className="space-y-5">
                       {Object.entries(formData.solutions).map(([key, value], idx) => (
                         value ? (
                           <div key={key} className="flex gap-4 pdf-solution-item">
                             <span className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 pdf-number-bubble">{idx + 1}</span>
                             <div className="pdf-solution-content">
                                <h5 className="text-[11px] font-black text-gray-900 uppercase mb-1 pdf-solution-label">
                                  {key === 'infrastructure' ? 'Infraestructura y Diseño' : 
                                   key === 'inocuity' ? 'Control de Inocuidad' : 
                                   key === 'staff' ? 'Personal y Dotación' : 
                                   key === 'quality' ? 'Calidad y Análisis' : 'Gestión Documental'}
                                </h5>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pdf-body-text">{value}</p>
                             </div>
                           </div>
                         ) : null
                       ))}
                    </div>
                  </section>

                  <section className="pdf-section">
                    <h4 className="text-xs font-black text-blue-900 uppercase border-l-4 border-blue-900 pl-3 mb-2 pdf-section-title">Resumen de la Asesoría</h4>
                    <p className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-wrap pdf-body-text">{formData.summary || 'N/A'}</p>
                  </section>

                  {/* Evidence Display */}
                  {formData.evidencePhoto && (
                    <section className="pdf-section">
                        <h4 className="text-xs font-black text-blue-900 uppercase mb-3 pdf-section-title">Evidencia Fotográfica</h4>
                        <img src={formData.evidencePhoto} className="w-full max-h-[300px] object-cover rounded-2xl shadow-lg pdf-evidence-img" alt="Evidencia de visita" />
                    </section>
                  )}

                  {/* Spacer to prevent signature from splitting across pages */}
                  <div style={{ minHeight: '200px' }}></div>

                  {/* Final Signature */}
                  <div className="pt-8 border-t border-gray-100 flex flex-col items-center pdf-signature-area">
                    {formData.signature ? (
                        <div className="text-center">
                            {/* No crossOrigin needed because we now ensure it's a Base64 string in formData */}
                            <img 
                                src={formData.signature} 
                                alt="Firma de conformidad" 
                                className="max-h-24 mx-auto mb-2 pdf-signature-img" 
                                style={{ display: 'block', pointerEvents: 'none' }}
                            />
                            <div className="pdf-signature-line"></div>
                            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest pdf-signature-text">Firma de Conformidad</p>
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <div className="w-48 border-b-2 border-gray-300 mx-auto mb-2"></div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                Pendiente de firma (el cliente debe firmar desde su panel)
                            </p>
                        </div>
                    )}
                  </div>
               </div>

                <div className="flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-6 gap-4" data-html2canvas-ignore="true">
                  <button 
                    onClick={() => setStep('form')}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all"
                  >
                    EDITAR CONTENIDO
                  </button>
                  <button 
                    onClick={handleSaveFinal}
                    disabled={isSaving}
                    className="px-10 py-4 bg-blue-900 text-white font-black rounded-2xl hover:bg-blue-800 shadow-xl shadow-blue-900/40 disabled:opacity-50 active:scale-95 transition-all text-sm uppercase tracking-wider"
                  >
                    {isSaving ? 'GUARDANDO ACTA...' : 'CONFIRMAR Y GUARDAR ACTA'}
                  </button>
                </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
