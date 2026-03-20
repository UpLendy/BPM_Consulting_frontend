'use client';

import { useState, useEffect } from 'react';
import BaseModal from '@/app/components/modals/BaseModal';
import { Appointment } from '@/app/types';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { HiCheckCircle } from 'react-icons/hi';
import { formatShortDate } from '@/app/utils/dateUtils';

interface VisitRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  appointment: Appointment;
  readOnly?: boolean;
}

import { DIAGNOSTIC_CONFIG, DEFAULT_DIAGNOSTIC_TYPE, DiagnosticType } from '@/app/constants/visitSections';
import PDFDownloadButton from './PDFDownloadButton';

export default function VisitRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  readOnly = false
}: VisitRegistrationModalProps) {
  // State for form data: { [subsectionId]: { q1: string, hallazgos: string } }
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [diagnosticType, setDiagnosticType] = useState<DiagnosticType>(DEFAULT_DIAGNOSTIC_TYPE);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLastVisit, setIsLoadingLastVisit] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load user info and fetch visit data (last visit if editing, current if read-only)
  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      if (isOpen) {
        try {
          setIsLoadingLastVisit(true);
          
          if (readOnly) {
            const response = await appointmentService.getVisitEvaluation(appointment.id);
            const root = response?.data || response;
            const foundFormData = root?.formData || root?.data?.formData;
            
            if (foundFormData) {
              setFormData(foundFormData);
              if (foundFormData.diagnosticType) {
                setDiagnosticType(foundFormData.diagnosticType as DiagnosticType);
              }
            }
          } else {
            let loadedFromCache = false;
            const cacheKey = `visit_form_data_${appointment.id}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (Object.keys(parsed).length > 0) {
                  setFormData(parsed);
                  if (parsed.diagnosticType) {
                    setDiagnosticType(parsed.diagnosticType as DiagnosticType);
                  }
                  loadedFromCache = true;
                }
              } catch (e) {
                console.error('Error al cargar caché local', e);
              }
            }

            if (!loadedFromCache) {
              const currentEvalRes = await appointmentService.getVisitEvaluation(appointment.id);
              const currentRoot = currentEvalRes?.data || currentEvalRes;
              const currentFormData = currentRoot?.formData || currentRoot?.data?.formData;

              if (currentFormData && Object.keys(currentFormData).length > 0) {
                setFormData(currentFormData);
                if (currentFormData.diagnosticType) {
                  setDiagnosticType(currentFormData.diagnosticType as DiagnosticType);
                }
              } else {
                const response = await appointmentService.getAppointmentById(appointment.id);
                const fullApt = (response as any).data || response;
                const foundCompanyId = fullApt?.empresaId || fullApt?.empresa_id || fullApt?.companyId;
                
                if (foundCompanyId) {
                  const lastApt = await appointmentService.getLastAppointmentByCompany(foundCompanyId);
                  if (lastApt && lastApt.id !== appointment.id) {
                    const evalRes = await appointmentService.getVisitEvaluation(lastApt.id);
                    const lastRoot = evalRes?.data || evalRes;
                    const prevFormData = lastRoot?.formData || lastRoot?.data?.formData;
                    if (prevFormData) {
                      setFormData(prevFormData);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('VisitRegistrationModal: Error loading visit data:', error);
        } finally {
          setIsLoadingLastVisit(false);
        }
      }
    };

    if (isOpen) {
      init();
    }
  }, [isOpen, appointment.id, readOnly]); // Added readOnly to dependency array

  // Guardar en la caché cada vez que formData cambia
  useEffect(() => {
    if (isOpen && appointment && !readOnly && Object.keys(formData).length > 0) {
      const cacheKey = `visit_form_data_${appointment.id}`;
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ...formData, diagnosticType }));
      } catch (e) {
        console.warn('No se pudo guardar la caché local', e);
      }
    }
  }, [formData, diagnosticType, isOpen, appointment, readOnly]);

  const handleScoreChange = (itemId: string, score: 'A' | 'AR' | 'I' | 'NA') => {
    const numericScore = score === 'A' ? "2" : score === 'AR' ? "1" : score === 'I' ? "0" : "NA";
    setFormData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], q1: numericScore }
    }));
  };

  const handleFindingsChange = (itemId: string, findings: string) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], hallazgos: findings }
    }));
  };

  const getScoreLabel = (scoreValue: string) => {
    if (scoreValue === "2") return 'A';
    if (scoreValue === "1") return 'AR';
    if (scoreValue === "0") return 'I';
    if (scoreValue === "NA") return 'NA';
    return '';
  };

  const calculateTotalSuccessRate = () => {
    let currentPoints = 0;
    let applicableItems = 0;

    const currentSections = DIAGNOSTIC_CONFIG[diagnosticType].sections;
    currentSections.forEach(section => {
      section.subsections.forEach(sub => {
        sub.items.forEach(item => {
          const data = formData[item.id];
          if (data && data.q1 !== undefined && data.q1 !== "NA") {
            currentPoints += parseInt(data.q1);
            applicableItems++;
          }
        });
      });
    });

    const maxPossiblePoints = applicableItems * 2;
    return maxPossiblePoints > 0 ? (currentPoints / maxPossiblePoints) * 100 : 0;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      const successRate = calculateTotalSuccessRate();
      
      const payload = {
        successRate: Math.round(successRate),
        formData: { ...formData, diagnosticType }
      };
      
      const response = await appointmentService.saveVisitRecord(appointment.id, payload);

      if (response.success) {
        // Limpiar caché al guardar exitosamente
        localStorage.removeItem(`visit_form_data_${appointment.id}`);
        
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setShowConfirmation(false);
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setSaveError(response.error || 'Error al guardar el registro');
      }
    } catch (error) {
      console.error(error);
      setSaveError('Ocurrió un error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const resolvedCompanyName = appointment.companyName || (appointment as any).company?.name || (appointment as any).company_name || '...';
  const isEngineerOrAdmin = currentUser?.role === 'engineer' || currentUser?.role === 'admin';
  const eng = (appointment as any).engineer || (appointment as any).ingeniero;
  const resolvedEngineerName = appointment.engineerName 
      || (eng?.user?.first_name ? `${eng.user.first_name} ${eng.user.last_name || ''}` : null)
      || (eng?.first_name ? `${eng.first_name} ${eng.last_name || ''}` : null)
      || eng?.name 
      || (isEngineerOrAdmin && currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Ingeniero Asignado');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ACTA DE ASESORIA PARA ACOMPAÑAMIENTO"
      size="xl" 
    >
      <div className="max-h-[85vh] overflow-y-auto pr-2 pb-8">
        {/* Diagnostic Type Selector (Always visible if not read-only) */}
        {!readOnly && (
          <div className="mb-6 p-1 bg-gray-200 border border-gray-300 rounded-2xl flex relative h-14">
            {(Object.keys(DIAGNOSTIC_CONFIG) as DiagnosticType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDiagnosticType(type)}
                className={`flex-1 relative z-10 text-xs font-black uppercase transition-all flex items-center justify-center gap-2 rounded-xl ${
                  diagnosticType === type 
                    ? 'bg-blue-900 text-white shadow-lg transform scale-[1.02]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {DIAGNOSTIC_CONFIG[type].title}
              </button>
            ))}
          </div>
        )}

        {/* Informative message if data exists and type is changed */}
        {!readOnly && Object.keys(formData).filter(k => k !== 'diagnosticType').length > 0 && (
          <div className="mb-4 text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase italic">* Al cambiar de tipo, los items no compartidos se ocultarán pero no se perderán.</span>
          </div>
        )}

        {/* Header Metadata */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm border border-gray-400">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Fecha</span>
                   <span className="font-black text-black">
                       {formatShortDate(appointment.date)}
                   </span>
               </div>
                <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Empresa</span>
                   <span className="font-black text-black">
                     {resolvedCompanyName}
                   </span>
                </div>
                <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Municipio</span>
                   <span className="font-black text-black">{appointment.location || (appointment as any).company?.city || 'Manizales'}</span>
                </div>
                <div>
                   <span className="block text-gray-700 text-xs font-black uppercase">Tipo de Acta</span>
                   <span className="font-black text-blue-800">
                     {DIAGNOSTIC_CONFIG[diagnosticType].title}
                   </span>
                </div>
                <div>
                   <span className="block text-gray-800 text-xs font-black uppercase">
                     {readOnly ? '% Cumplimiento Visita' : '% Cumplimiento Última Visita'}
                   </span>
                   <span className="font-black text-blue-900 text-xl">{calculateTotalSuccessRate().toFixed(1)}%</span>
                </div>
           </div>
           {isLoadingLastVisit && (
             <div className="mt-2 text-xs text-blue-800 font-black flex items-center gap-2">
               <div className="animate-spin h-3 w-3 border-2 border-blue-800 border-t-transparent rounded-full"></div>
               RECUPERANDO DATOS HISTÓRICOS...
             </div>
           )}
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {DIAGNOSTIC_CONFIG[diagnosticType].sections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="bg-blue-900 text-white px-4 py-2 text-sm font-black uppercase rounded-t-lg shadow-sm">
                {section.title}
              </div>
              
              <div className="border border-gray-400 rounded-b-lg overflow-hidden shadow-inner">
                 <div className="grid grid-cols-[1fr_50px_50px_50px_50px_60px_35%] bg-gray-200 text-[10px] font-black text-black border-b border-gray-400">
                     <div className="p-2">ASPECTO A EVALUAR</div>
                     <div className="p-2 text-center border-l border-gray-300">A</div>
                     <div className="p-2 text-center border-l border-gray-300">AR</div>
                     <div className="p-2 text-center border-l border-gray-300">I</div>
                     <div className="p-2 text-center border-l border-gray-300">NA</div>
                     <div className="p-2 text-center border-l border-gray-300">Puntaje</div>
                     <div className="p-2 text-center border-l border-gray-300">Hallazgos</div>
                 </div>

                 {section.subsections.map((sub) => (
                    <div key={sub.id} className="bg-gray-50">
                         {sub.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-[1fr_50px_50px_50px_50px_60px_35%] border-b border-gray-200 hover:bg-white transition-colors">
                                {/* ITEM TEXT */}
                                <div className="flex border-r border-gray-200">
                                    <div className="w-10 p-2 text-[10px] font-bold text-gray-700 border-r border-gray-100 flex items-center justify-center bg-gray-50/30">
                                        {item.numeral}
                                    </div>
                                    <div className="flex-1 p-2 text-[11px] text-gray-900 font-medium leading-relaxed">
                                        {item.text}
                                    </div>
                                </div>

                                {/* SCORING CONTROLS FOR THIS ITEM */}
                                <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                                     <input 
                                        type="radio" 
                                        name={`score-${item.id}`}
                                        checked={formData[item.id]?.q1 === "2"}
                                        onChange={() => handleScoreChange(item.id, 'A')}
                                        disabled={readOnly}
                                        className="h-5 w-5 text-green-700 focus:ring-green-500 cursor-pointer border-gray-400 disabled:opacity-75"
                                    />
                                </div>
                                <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                                     <input 
                                        type="radio" 
                                        name={`score-${item.id}`}
                                        checked={formData[item.id]?.q1 === "1"}
                                        onChange={() => handleScoreChange(item.id, 'AR')}
                                        disabled={readOnly}
                                        className="h-5 w-5 text-yellow-600 focus:ring-yellow-400 cursor-pointer border-gray-400 disabled:opacity-75"
                                    />
                                </div>
                                <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                                     <input 
                                        type="radio" 
                                        name={`score-${item.id}`}
                                        checked={formData[item.id]?.q1 === "0"}
                                        onChange={() => handleScoreChange(item.id, 'I')}
                                        disabled={readOnly}
                                        className="h-5 w-5 text-red-700 focus:ring-red-500 cursor-pointer border-gray-400 disabled:opacity-75"
                                    />
                                </div>
                                <div className="flex items-center justify-center border-r border-gray-200 bg-white">
                                     <input 
                                        type="radio" 
                                        name={`score-${item.id}`}
                                        checked={formData[item.id]?.q1 === "NA"}
                                        onChange={() => handleScoreChange(item.id, 'NA')}
                                        disabled={readOnly}
                                        className="h-5 w-5 text-gray-500 focus:ring-gray-400 cursor-pointer border-gray-400 disabled:opacity-75"
                                    />
                                </div>
                                <div className="flex items-center justify-center border-r border-gray-200 bg-gray-100 font-black text-base text-black">
                                    {formData[item.id]?.q1 === "NA" ? 'N/A' : (formData[item.id]?.q1 || '')}
                                </div>
                                <div className="p-1 bg-white">
                                     <textarea
                                        value={formData[item.id]?.hallazgos || ''}
                                        onChange={(e) => handleFindingsChange(item.id, e.target.value)}
                                        disabled={readOnly}
                                        className="w-full h-full min-h-[60px] p-2 text-[12px] text-black font-medium border-0 bg-transparent focus:ring-0 resize-none placeholder-gray-400 disabled:text-gray-600"
                                        placeholder={readOnly ? "Sin hallazgos" : "Registrar hallazgos..."}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                 ))}
              </div>
            </div>
          ))}
        </div>

        {/* CALIFICACIÓN DEL BLOQUE */}
        <div className="mt-8 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-200 p-2 text-center font-black text-xs border-b border-gray-300 text-black uppercase">
                CALIFICACIÓN DE LA VISITA (Calculado Automáticamente)
            </div>
            <div className="p-6 text-center bg-white">
                <span className="block text-gray-500 text-xs font-bold uppercase mb-1">Porcentaje de Cumplimiento</span>
                <span className="text-4xl font-black text-blue-900">
                    {calculateTotalSuccessRate().toFixed(1)}%
                </span>
            </div>
        </div>

         {/* SIGNATURES FOOTER */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-500">
            {/* Engineer Info */}
            <div className="border-b md:border-b-0 md:border-r border-gray-500">
                <div className="bg-gray-200 text-center font-bold text-xs py-1 border-b border-gray-500 text-gray-900">
                    INFORMACION DE QUIEN REALIZA LA VISITA
                </div>
                <div className="grid grid-cols-[100px_1fr] text-xs">
                    <div className="p-2 border-r border-b border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">NOMBRE:</div>
                    <div className="p-2 border-b border-gray-500 uppercase font-bold text-gray-900">
                        {resolvedEngineerName}
                    </div>
                    
                    <div className="p-2 border-r border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">CARGO:</div>
                    <div className="p-2 uppercase font-bold text-gray-900">Ingeniero de Alimentos</div>
                </div>
            </div>

            {/* Company Info */}
            <div className="">
                <div className="bg-gray-200 text-center font-bold text-xs py-1 border-b border-gray-500 text-gray-900">
                    INFORMACION DE QUIEN RECIBE LA VISITA
                </div>
                <div className="grid grid-cols-[100px_1fr] text-xs">
<<<<<<< Updated upstream
                    <div className="p-2 border-r border-b border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase flex items-center">NOMBRE:</div>
                    <div className="p-0 border-b border-gray-500 bg-white">
                        {readOnly ? (
                            <div className="p-2 uppercase font-bold text-gray-900">{formData.contactName || resolvedCompanyName}</div>
                        ) : (
                            <input
                                type="text"
                                value={formData.contactName !== undefined ? formData.contactName : resolvedCompanyName}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                className="w-full h-full p-2 uppercase font-bold text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none focus:bg-yellow-50/50"
                            />
                        )}
                    </div>
                    
                    <div className="p-2 border-r border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase flex items-center">CARGO:</div>
                    <div className="p-0 bg-white">
                        {readOnly ? (
                            <div className="p-2 uppercase font-bold text-gray-900">{formData.contactRole || 'Persona Encargada'}</div>
                        ) : (
                            <input
                                type="text"
                                value={formData.contactRole !== undefined ? formData.contactRole : 'Persona Encargada'}
                                onChange={(e) => setFormData(prev => ({ ...prev, contactRole: e.target.value }))}
                                className="w-full h-full p-2 uppercase font-bold text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none focus:bg-yellow-50/50"
                            />
=======
                    <div className="p-2 border-r border-b border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">NOMBRE:</div>
                    <div className="p-2 border-b border-gray-500 uppercase font-bold text-gray-900 bg-white">
                        {!readOnly ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-black uppercase text-blue-900 focus:border-blue-500 focus:bg-white outline-none transition-all"
                            value={formData.contactName || appointment.companyName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            placeholder="ESCRIBA EL NOMBRE AQUÍ..."
                          />
                        ) : (
                          formData.contactName || appointment.companyName || '__________________________'
                        )}
                    </div>
                    
                    <div className="p-2 border-r border-gray-500 font-bold bg-gray-100 text-gray-800 uppercase">CARGO:</div>
                    <div className="p-2 uppercase font-bold text-gray-900 bg-white">
                        {!readOnly ? (
                          <input 
                            type="text"
                            className="w-full bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-black uppercase text-blue-900 focus:border-blue-500 focus:bg-white outline-none transition-all"
                            value={formData.contactRole || 'Persona Encargada'}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactRole: e.target.value }))}
                            placeholder="ESCRIBA EL CARGO AQUÍ..."
                          />
                        ) : (
                          formData.contactRole || 'Persona Encargada'
>>>>>>> Stashed changes
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {readOnly ? (
                <>
                    <PDFDownloadButton 
                        appointment={appointment}
                        formData={formData}
                        totalSuccessRate={calculateTotalSuccessRate()}
<<<<<<< Updated upstream
                        companyNameStr={resolvedCompanyName}
                        engineerNameStr={resolvedEngineerName}
=======
                        recipientNameStr={formData.contactName || appointment.companyName}
                        engineerNameStr={currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : appointment.engineerName}
>>>>>>> Stashed changes
                    />
                    <button
                        onClick={onClose}
                        className="px-8 py-2 bg-blue-900 text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-all uppercase text-sm"
                    >
                        Cerrar Detalle
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => setShowConfirmation(true)}
                        disabled={isSaving}
                        className={`px-6 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 shadow-md ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Revisar y Guardar
                    </button>
                </>
            )}
        </div>

        {/* Confirmation Overlay Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Confirmar Registro de Visita</h3>
                        <p className="text-sm text-gray-500">Revise el resumen de la calificación antes de guardar.</p>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 relative">
                    {/* Success Overlay inside the confirmation modal */}
                    {isSuccess && (
                      <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                          <HiCheckCircle className="w-12 h-12" />
                        </div>
                        <h4 className="text-2xl font-black text-green-900 uppercase">¡Guardado con éxito!</h4>
                        <p className="text-green-700 font-medium">El registro se ha procesado correctamente.</p>
                      </div>
                    )}

                    {saveError && (
                      <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl animate-fade-in">
                        <p className="text-sm text-red-700 font-bold">Error: {saveError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <span className="text-xs text-blue-600 font-bold uppercase block">Puntaje Total</span>
                            <span className="text-3xl font-black text-blue-900">{calculateTotalSuccessRate().toFixed(1)}%</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center flex flex-col justify-center">
                            <span className="text-xs text-gray-500 font-bold uppercase block">Items Evaluados</span>
                            <span className="text-2xl font-bold text-gray-800">
                            {Object.keys(formData).filter(k => k !== 'diagnosticType').length} / {DIAGNOSTIC_CONFIG[diagnosticType].sections.reduce((acc, s) => acc + s.subsections.reduce((subAcc, sub) => subAcc + sub.items.length, 0), 0)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {DIAGNOSTIC_CONFIG[diagnosticType].sections.map(section => {
                            // Group selected items by section for the summary
                            const allItemsInData = section.subsections.flatMap(sub => 
                                sub.items.filter(item => formData[item.id])
                            );

                            if (allItemsInData.length === 0) return null;
                            
                            return (
                                <div key={section.id} className="border border-gray-100 rounded-lg p-3">
                                    <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">{section.title}</h4>
                                    <div className="space-y-2">
                                        {section.subsections.map(sub => (
                                            <div key={sub.id}>
                                                {sub.items.map(item => {
                                                    const data = formData[item.id];
                                                    if (!data) return null;
                                                    return (
                                                        <div key={item.id} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-700 font-medium">Item {item.numeral}</span>
                                                                <span className="text-[10px] text-gray-400 line-clamp-1">{item.text}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    data.q1 === "2" ? 'bg-green-100 text-green-700' :
                                                                    data.q1 === "1" ? 'bg-yellow-100 text-yellow-700' :
                                                                    data.q1 === "0" ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                    {getScoreLabel(data.q1)} {data.q1 !== "NA" ? `(${data.q1})` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button 
                        onClick={() => setShowConfirmation(false)}
                        className="flex-1 px-4 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        Volver a Editar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Confirmar y Guardar'}
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
