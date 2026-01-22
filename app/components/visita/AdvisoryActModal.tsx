'use client';

import { useState, useRef, useEffect } from 'react';
import BaseModal from '@/app/components/modals/BaseModal';
import { Appointment } from '@/app/types';
import SignatureCanvas from 'react-signature-canvas';
import { HiCamera, HiCheckCircle, HiPencil, HiTrash, HiDocumentText } from 'react-icons/hi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { appointmentService } from '@/app/services/appointments/appointmentService';

import { PDF_STYLES } from '../../constants/pdfStyles';

interface AdvisoryActModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  initialStep?: 'form' | 'sign' | 'preview';
}

interface ActFormData {
  executedTime: string;
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
}

export default function AdvisoryActModal({
  isOpen,
  onClose,
  appointment,
  initialStep = 'form'
}: AdvisoryActModalProps) {
  const [step, setStep] = useState<'form' | 'preview'>(initialStep === 'sign' ? 'form' : 'form');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showSignatureSuccess, setShowSignatureSuccess] = useState(false);
  const sigPad = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ActFormData & { advisoryId: string }>({
    advisoryId: '',
    executedTime: '3 horas 0 minutos',
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
    signature: null
  });

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
    
    // Initialize representative name from appointment
    if (appointment) {
      setFormData(prev => ({
        ...prev,
        representativeName: (appointment as any).representativeName || ''
      }));
    }
  }, [appointment]);

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
    setFormData(prev => ({ ...prev, signature: null }));
  };

  const saveSignature = () => {
    if (sigPad.current?.isEmpty()) {
      setErrors(prev => ({...prev, signature: 'Debe realizar la firma'}));
      return;
    }
    const signatureData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    setFormData(prev => ({ ...prev, signature: signatureData }));
    setErrors(prev => ({...prev, signature: ''}));
    
    // Mostrar feedback visual elegante en lugar de alert
    setShowSignatureSuccess(true);
    setTimeout(() => setShowSignatureSuccess(false), 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.advisoryId.trim()) newErrors.advisoryId = 'El ID de Asesoría es obligatorio';
    if (!formData.representativeName.trim()) newErrors.representativeName = 'El nombre del Solicitante es obligatorio';
    if (!formData.executedTime.trim()) newErrors.executedTime = 'El Tiempo Ejecutado es obligatorio';
    if (!formData.topicsCovered.trim()) newErrors.topicsCovered = 'Los Temas Tratados son obligatorios';
    if (!formData.solutions.infrastructure.trim()) newErrors.infrastructure = 'Campo obligatorio';
    if (!formData.solutions.inocuity.trim()) newErrors.inocuity = 'Campo obligatorio';
    if (!formData.solutions.staff.trim()) newErrors.staff = 'Campo obligatorio';
    if (!formData.solutions.quality.trim()) newErrors.quality = 'Campo obligatorio';
    if (!formData.solutions.documentation.trim()) newErrors.documentation = 'Campo obligatorio';
    if (!formData.summary.trim()) newErrors.summary = 'El Resumen es obligatorio';
    if (!formData.evidencePhoto) newErrors.evidencePhoto = 'La Foto de Evidencia es obligatoria';
    if (!formData.signature) newErrors.signature = 'La Firma es obligatoria (debe presionar Guardar Firma)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPreview = () => {
    if (validateForm()) {
      setStep('preview');
    } else {
      // Smooth scroll to top to see errors if necessary
      const modalContent = document.querySelector('.max-h-\\[80vh\\]');
      modalContent?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveFinal = async () => {
    if (!previewRef.current) return;
    
    try {
      setIsSaving(true);
      
      // 1. Generate High-Quality Canvas
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Robust cleanup to avoid LAB/OKLCH errors
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          const safeStyle = clonedDoc.createElement('style');
          safeStyle.innerHTML = PDF_STYLES;
          clonedDoc.head.appendChild(safeStyle);
          
          const junk = clonedDoc.querySelectorAll('button, [data-html2canvas-ignore="true"]');
          junk.forEach(j => j.remove());
        }
      });

      // 2. Multipage Logic
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgPdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgPdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPdfHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add more pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgPdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgPdfHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      // 3. Finalize
      const finalIdAsesoria = formData.advisoryId || '0000';
      const fileName = `acta_asesoria_${finalIdAsesoria}`;
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
      
      const uploadRes = await appointmentService.uploadAppointmentRecord(appointment.id, pdfFile, fileName);
      if (!uploadRes.success) {
        setStatusError(uploadRes.error || 'Error al subir el acta');
        setIsSaving(false);
        const modalContent = document.querySelector('.max-h-\\[80vh\\]');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      const signaturePayload = {
        idAsesoria: formData.advisoryId,
        nombre: formData.representativeName
      };
      const signRes = await appointmentService.signAppointmentRecord(appointment.id, signaturePayload);
      if (!signRes.success) {
        setStatusError(signRes.error || 'Error al firmar el acta');
        setIsSaving(false);
        const modalContent = document.querySelector('.max-h-\\[80vh\\]');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

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

        {step === 'form' ? (
          <div className="space-y-8 pb-10">
            {/* Header / Info Fija */}
            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase">ID Asesoría</label>
                    {errors.advisoryId && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.advisoryId}</span>}
                  </div>
                  <input 
                    type="text"
                    value={formData.advisoryId}
                    onChange={(e) => {
                      setFormData({...formData, advisoryId: e.target.value.toUpperCase()});
                      if (errors.advisoryId) setErrors({...errors, advisoryId: ''});
                    }}
                    placeholder="Ej: CE57AG"
                    className={`w-full bg-white border ${errors.advisoryId ? 'border-red-500' : 'border-blue-200'} rounded-lg px-3 py-1 text-sm font-bold text-black focus:ring-2 focus:ring-blue-500`}
                  />
               </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase">Solicitante</label>
                    {errors.representativeName && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.representativeName}</span>}
                  </div>
                  <input 
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => {
                      setFormData({...formData, representativeName: e.target.value});
                      if (errors.representativeName) setErrors({...errors, representativeName: ''});
                    }}
                    placeholder="Nombre del solicitante"
                    className={`w-full bg-white border ${errors.representativeName ? 'border-red-500' : 'border-blue-200'} rounded-lg px-3 py-1 text-sm font-bold text-black focus:ring-2 focus:ring-blue-500`}
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase">Empresa</label>
                  <p className="font-bold text-black">{appointment.companyName}</p>
               </div>
               <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase">Asesor Asignado</label>
                  <p className="font-bold text-black">
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Cargando...'}
                  </p>
               </div>
               <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase">Fecha y Hora</label>
                  <p className="font-bold text-black">
                    {formatDateTime(appointment.date, appointment.startTime)}
                  </p>
               </div>
               <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase">Tiempo Ejecutado</label>
                    {errors.executedTime && <span className="text-[9px] font-bold text-red-500 uppercase">{errors.executedTime}</span>}
                  </div>
                  <input 
                    type="text"
                    value={formData.executedTime}
                    onChange={(e) => {
                      setFormData({...formData, executedTime: e.target.value});
                      if (errors.executedTime) setErrors({...errors, executedTime: ''});
                    }}
                    className={`w-full bg-white border ${errors.executedTime ? 'border-red-500' : 'border-blue-200'} rounded-lg px-3 py-1 text-sm font-bold text-black focus:ring-2 focus:ring-blue-500`}
                  />
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

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Firma de Aceptación del Acta</label>
                {errors.signature && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.signature}</span>}
              </div>
              <div className={`bg-gray-50 border ${errors.signature ? 'border-red-500' : 'border-gray-200'} rounded-3xl p-4 overflow-hidden`}>
                 <div 
                   ref={containerRef}
                   className={`bg-white rounded-2xl border ${errors.signature ? 'border-red-300' : 'border-gray-100'} relative mb-4 h-[200px] w-full overflow-hidden`}
                 >
                    {canvasDim.width > 0 && (
                      <SignatureCanvas 
                        ref={sigPad}
                        penColor='black'
                        velocityFilterWeight={0.7}
                        canvasProps={{
                          width: canvasDim.width,
                          height: canvasDim.height,
                          className: 'sigCanvas cursor-crosshair'
                        }}
                      />
                    )}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button onClick={clearSignature} className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">
                            <HiTrash className="w-5 h-5" />
                        </button>
                        <button onClick={saveSignature} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                            <HiCheckCircle className="w-5 h-5" />
                        </button>
                    </div>

                    {showSignatureSuccess && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                          <HiCheckCircle className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-black text-green-700 uppercase tracking-widest">Firma capturada</p>
                      </div>
                    )}
                 </div>
                 <p className="text-[10px] text-center text-gray-400 font-bold uppercase">EL ASIGNADO DE LA EMPRESA FIRMA CONFIRMANDO LA REALIZACIÓN DE LA ASESORÍA</p>
              </div>
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
                  <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">ID Asesoría</span><span className="text-gray-900 font-bold pdf-value">#{formData.advisoryId || '---'}</span></div>
                  <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Fecha y Hora</span><span className="text-gray-900 font-bold pdf-value">{formatDateTime(appointment.date, appointment.startTime)}</span></div>
                  <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Solicitante</span><span className="text-gray-900 font-bold pdf-value">{formData.representativeName || '---'}</span></div>
                  <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Empresa</span><span className="text-gray-900 font-bold pdf-value">{appointment.companyName}</span></div>
                  <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Asesor Asignado</span><span className="text-gray-900 font-bold pdf-value">{currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : '...'}</span></div>
                  <div className="flex flex-col pdf-info-item"><span className="text-[10px] font-black text-gray-400 uppercase pdf-label">Tiempo Ejecutado</span><span className="text-gray-900 font-bold text-blue-800 pdf-value">{formData.executedTime}</span></div>
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

                  {/* Final Signature */}
                  <div className="pt-8 border-t border-gray-100 flex flex-col items-center pdf-signature-area">
                    {formData.signature ? (
                      <div className="text-center">
                         <img src={formData.signature} alt="Firma" className="max-h-24 mx-auto mb-2 pdf-signature-img" />
                         <div className="pdf-signature-line"></div>
                         <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest pdf-signature-text">Firma de Conformidad</p>
                      </div>
                    ) : (
                      <div className="p-10 border-2 border-dashed border-red-100 rounded-3xl text-center">
                         <p className="text-sm text-red-400 font-bold uppercase">Falta Firma de Aceptación</p>
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
                    disabled={isSaving || !formData.signature}
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
