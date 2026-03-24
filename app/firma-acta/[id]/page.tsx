'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import SignatureCanvas from 'react-signature-canvas';
import { HiCheckCircle, HiTrash, HiDocumentText, HiPencil, HiRefresh } from 'react-icons/hi';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { representativeService } from '@/app/services/representatives/representativeService';
import { Appointment } from '@/app/types';
import { formatShortDate } from '@/app/utils/dateUtils';
import { getDisplayTime } from '@/app/components/calendar/utils';

export default function FirmaActaPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [profileSignature, setProfileSignature] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showSignatureSuccess, setShowSignatureSuccess] = useState(false);
  const [hasAcceptedProfileSignature, setHasAcceptedProfileSignature] = useState(false);

  const sigPad = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDim, setCanvasDim] = useState({ width: 0, height: 200 });

  useEffect(() => {
    // Role check to ensure only 'company' or 'empresario' can access
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'company' && user.role !== 'empresario') {
        router.push('/dashboard'); // Redirect unauthorized
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }

    // Fetch appointment data
    const fetchAppointment = async () => {
      try {
        const response = await appointmentService.getAppointmentById(appointmentId);
        if (response.success && response.data) {
          const apt = response.data as Appointment;
          setAppointment(apt);

          // Try to fetch representative's saved signature from profile
          if (apt.representativeId) {
             const sigRes = await representativeService.getRepresentativeSignature(apt.representativeId);
             
             // Check if signature is valid and NOT expired (more than 72 hours)
             if (sigRes && sigRes.signatureUrl) {
                let isExpired = false;
                if (sigRes.updatedAt) {
                    const updatedAt = new Date(sigRes.updatedAt);
                    const now = new Date();
                    const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
                    if (diffHours > 72) isExpired = true;
                }

                if (!isExpired) {
                    setProfileSignature(sigRes.signatureUrl);
                    setSignatureData(sigRes.signatureUrl);
                } else {
                    console.log("Firma de perfil expirada (más de 72 horas)");
                }
             }
          }
        } else {
          setStatusMessage({ type: 'error', text: 'No se pudo cargar la cita' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Error de conexión' });
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId, router]);

  // Resize canvas appropriately
  useEffect(() => {
    const updateSize = () => {
        if (containerRef.current) {
            setCanvasDim({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };
    if (!loading) {
        setTimeout(updateSize, 100);
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }
  }, [loading]);

  const clearSignature = () => {
    sigPad.current?.clear();
    setSignatureData(null);
    setProfileSignature(null); // Completely forget the profile sig for this session if cleared
    setHasAcceptedProfileSignature(false);
  };

  const saveSignature = () => {
    if (sigPad.current?.isEmpty()) {
      setErrors(prev => ({...prev, signature: 'Debe realizar la firma en el recuadro'}));
      return;
    }
    const dataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    setSignatureData(dataUrl);
    setErrors(prev => ({...prev, signature: ''}));
    
    setShowSignatureSuccess(true);
    setTimeout(() => setShowSignatureSuccess(false), 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!signatureData) newErrors.signature = 'Debe aceptar y guardar su firma';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!appointment || !validateForm()) return;
    
    setIsSaving(true);
    setStatusMessage(null);

    try {
      // 1. Update the representative's profile signature if it's a new one (base64)
      // or if they explicitly accepted using it for this session.
      // Based on the new instruction, we only use the representative signature endpoint.
      if (signatureData && signatureData.startsWith('data:image') && appointment.representativeId) {
          await representativeService.updateRepresentativeSignature(appointment.representativeId, signatureData);
      }
      
      // If signatureData is already an HTTP URL (from profile), 
      // it means the user just accepted their existing profile signature.
      // In either case, the profile signature is now the source of truth for all acts.
      
      setStatusMessage({ type: 'success', text: 'Firma procesada con éxito' });
      
      setTimeout(() => {
        router.push('/gestion-citas');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error inesperado al intentar procesar la firma' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
       <DashboardLayout>
         <div className="p-8 text-center max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800">Cita no encontrada</h2>
            <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Volver</button>
         </div>
       </DashboardLayout>
    );
  }
  
  const eng = (appointment as any)?.engineer || (appointment as any)?.ingeniero;
  const resolvedEngineerName = appointment?.engineerName 
      || (eng?.user?.first_name ? `${eng.user.first_name} ${eng.user.last_name || ''}`.trim() : null)
      || (eng?.first_name ? `${eng.first_name} ${eng.last_name || ''}`.trim() : null)
      || eng?.name 
      || 'Ingeniero Asignado';

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto font-inter">
        
        {statusMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in
                ${statusMessage.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-800' : 'bg-red-50 border-l-4 border-red-500 text-red-800'}`}>
                <div className="flex items-center gap-3">
                    {statusMessage.type === 'success' ? <HiCheckCircle className="w-6 h-6 text-green-500"/> : <HiCheckCircle className="w-6 h-6 text-red-500 opacity-0"/>}
                    <span className="text-sm font-bold uppercase tracking-tight">{statusMessage.text}</span>
                </div>
            </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 md:p-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                   <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Firma de Documento</h1>
                   <p className="text-blue-200 text-sm mt-1 font-medium">Asesoría de BPM Consulting</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner text-center md:text-right w-full md:w-auto">
                   <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">Empresa</p>
                   <p className="text-white font-black">{appointment.companyName}</p>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* Details Summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row gap-6 justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de la Cita</p>
                        <p className="text-sm font-bold text-gray-800">{formatShortDate(appointment.date)} a las {getDisplayTime(appointment.startTime)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ingeniero / Asesor</p>
                        <p className="text-sm font-bold text-gray-800">{resolvedEngineerName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo de Servicio</p>
                        <p className="text-sm font-bold text-gray-800">{appointment.appointmentType}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* El campo Nombre del Firmante ha sido removido según solicitud */}

                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-sm font-black text-gray-800 uppercase tracking-wide">Firma Digital</label>
                             {errors.signature && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.signature}</span>}
                        </div>
                        
                        <div className={`bg-gray-50 border ${errors.signature ? 'border-red-500' : 'border-gray-200'} rounded-3xl p-5 overflow-hidden shadow-inner`}>
                            <div 
                                ref={containerRef}
                                className="bg-white rounded-2xl border border-gray-100 relative mb-4 h-[250px] w-full overflow-hidden shadow-sm"
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
                                        onEnd={() => {
                                            if (errors.signature) setErrors({...errors, signature: ''});
                                        }}
                                    />
                                )}
                                
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    <button 
                                        onClick={clearSignature} 
                                        className="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors shadow-sm focus:outline-none"
                                        title="Limpiar firma"
                                    >
                                        <HiTrash className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={saveSignature} 
                                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm focus:outline-none"
                                        title="Guardar firma"
                                    >
                                        <HiCheckCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Choice Overlay: Use Profile Signature or Sign Fresh */}
                                {profileSignature && !hasAcceptedProfileSignature && (
                                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-[40] animate-fade-in p-4 overflow-y-auto">
                                        <div className="text-center mb-3">
                                            <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight">Firma guardada encontrada</p>
                                            <p className="text-[9px] text-gray-500 font-bold max-w-[200px] mx-auto">¿Deseas usar esta firma o firmar de nuevo?</p>
                                        </div>

                                        <div className="relative p-2 bg-white rounded-2xl border border-gray-100 mb-4 shadow-sm">
                                            <img src={profileSignature} alt="Firma de perfil" className="max-h-16 object-contain mix-blend-multiply" />
                                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow-lg">
                                                <HiCheckCircle className="w-3 h-3" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-2">
                                            <button 
                                                className="py-2.5 bg-blue-900 text-white font-black rounded-xl shadow-lg shadow-blue-900/10 hover:bg-blue-800 active:scale-95 transition-all uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5"
                                                onClick={() => {
                                                    setSignatureData(profileSignature);
                                                    setHasAcceptedProfileSignature(true);
                                                    setShowSignatureSuccess(true);
                                                    setTimeout(() => setShowSignatureSuccess(false), 2000);
                                                }}
                                            >
                                                <HiCheckCircle className="w-4 h-4" />
                                                Usar Perfil
                                            </button>
                                            <button 
                                                onClick={clearSignature}
                                                className="py-2.5 bg-white border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-all text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5"
                                            >
                                                <HiPencil className="w-3 h-3" />
                                                Nuevo Trazo
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Success Message Overlay */}
                                {showSignatureSuccess && (
                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-[50]">
                                        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                            <HiCheckCircle className="w-10 h-10" />
                                        </div>
                                        <p className="text-sm font-black text-green-700 uppercase tracking-widest">Firma lista y guardada</p>
                                    </div>
                                )}

                                {hasAcceptedProfileSignature && signatureData && !showSignatureSuccess && (
                                    <div className="absolute inset-0 bg-white/40 pointer-events-none flex flex-col items-center justify-center z-10">
                                        <img src={signatureData} alt="Firma de perfil" className="max-h-32 object-contain mix-blend-multiply opacity-50" />
                                        <div className="mt-2 bg-blue-600/10 px-3 py-1 rounded-full border border-blue-600/20">
                                            <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Usando firma de perfil</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex justify-center opacity-30">
                                    <div className="w-2/3 border-b-2 border-dashed border-gray-400"></div>
                                </div>
                            </div>
                            <p className="text-[11px] text-center text-gray-500 font-bold uppercase tracking-wide">
                                Dibuje su firma en el recuadro blanco y presione el botón <span className="text-blue-600 inline-flex items-center"><HiCheckCircle className="w-3 h-3 mx-0.5" /> Guardar</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-8 border-t border-gray-100 flex justify-end gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-8 py-3 bg-blue-900 text-white font-bold rounded-2xl hover:bg-blue-800 shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                PROCESANDO...
                            </>
                        ) : (
                            <>
                                <HiDocumentText className="w-5 h-5" />
                                FIRMAR Y ENVIAR
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
