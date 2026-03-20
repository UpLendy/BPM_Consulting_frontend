'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { authService } from '@/app/services/authService';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import ValidationReviewModal from '@/app/components/modals/ValidationReviewModal';
import { formatShortDate } from '@/app/utils/dateUtils';
import { formatFileName } from '@/app/utils/fileUtils';

export default function VisualizarDocumentosPage() {
  const router = useRouter();
  const [validations, setValidations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValidation, setSelectedValidation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'cita' | 'carpeta'>('cita');
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const FOLDER_NAMES: Record<string, string> = {
      CERTIFICADO: 'Carpeta: Cursos',
      CONTRATO: 'Carpeta: Asesorías',
      LICENCIA: 'Carpeta: Invimas',
      PERMISO: 'Carpeta: Plan de Saneamiento',
      IDENTIFICACION: 'Carpeta: Auditoría',
      OTRO: 'Carpeta: Otro',
  };

  useEffect(() => {
    const init = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        router.push('/login');
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const profileRes = await authService.getProfile();
        const companyId = user.companyId || profileRes?.user?.companyId;
        
        // 1. Fetch the absolute last completed success rate for this company as fallback
        let globalFallbackRate = null;
        if (companyId) {
          try {
            const lastApt = await appointmentService.getLastAppointmentByCompany(companyId);
            if (lastApt && lastApt.id) {
              const lastEval = await appointmentService.getVisitEvaluation(lastApt.id);
              if (lastEval && lastEval.successRate !== undefined) {
                globalFallbackRate = lastEval.successRate;
              }
            }
          } catch (err) {
            // Error silently ignored or handled by lack of rate
          }
        }

        // 2. Fetch ALL appointments with pagination
        let allAppointments: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) { // Max 10 pages to prevent infinite loop
          const aptResponse = await appointmentService.getMyAppointments({
            page,
            limit: 100 // Fetch 100 per page to minimize requests
          });
          
          if (aptResponse && aptResponse.data) {
            const pageData = aptResponse.data || [];
            allAppointments = [...allAppointments, ...pageData];
            hasMore = aptResponse.meta?.hasNextPage || false;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        if (allAppointments.length > 0) {
          const validationsList: any[] = [];
          
          // Filter completed appointments
          const completedAppointments = allAppointments.filter(a => a.status === 'COMPLETADA');
          
          // Get validation for each completed appointment
          await Promise.all(completedAppointments.map(async (apt) => {
            try {
              const valResponse = await appointmentService.getAppointmentValidation(apt.id);
              if (valResponse.success && valResponse.data) {
                const validation = valResponse.data;
                
                // Only show COMPLETADO validations
                if (validation.status === 'COMPLETADO') {
                  // Fetch specific evaluation to get successRate
                  let successRate = null;
                  try {
                    const evalResponse = await appointmentService.getVisitEvaluation(apt.id);
                    if (evalResponse && evalResponse.successRate !== undefined) {
                      successRate = evalResponse.successRate;
                    } else {
                      // Apply fallback if this specific appt has no evaluation yet
                      successRate = globalFallbackRate;
                    }
                    } catch (evalErr) {
                      // Apply fallback on error too
                      successRate = globalFallbackRate;
                    }

                  // Fetch Record if exists
                  let recordUrl = null;
                  try {
                    const recordRes = await appointmentService.getAppointmentRecordPreview(apt.id);
                    if (recordRes.success) {
                      recordUrl = recordRes.data?.url;
                    }
                  } catch (recErr) {
                    // Silent fallback
                  }

                  validationsList.push({
                    id: validation.id,
                    appointmentId: apt.id,
                    companyName: apt.companyName || user.companyName || 'Mi Empresa',
                    title: validation.title,
                    engineerName: validation.reviewedByName || apt.engineerName || 'Ingeniero',
                    date: formatShortDate(apt.date),
                    description: validation.message || validation.status || 'Validación de Cita',
                    status: validation.status,
                    docCount: validation.documentsCount || 0,
                    rawDate: apt.date,
                    successRate: successRate,
                    recordUrl: recordUrl
                  });
                }
              }
            } catch (err) {
              // Ignore validation errors
            }
          }));

          // Sort by date (most recent first)
          validationsList.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
          setValidations(validationsList);
        }
      } catch (error) {
        console.error('Error loading validations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const filteredValidations = validations.filter(val => 
    val.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (val.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    val.engineerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    val.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleEditTitle = (e: React.MouseEvent, validation: any) => {
    e.stopPropagation();
    setEditingTitleId(validation.appointmentId);
    setNewTitle(validation.title || validation.companyName);
  };

  const handleSaveTitle = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    try {
        const res = await appointmentService.updateValidationTitle(appointmentId, newTitle);
        if (res.success) {
            setValidations(prev => prev.map(v => 
                v.appointmentId === appointmentId ? { ...v, title: newTitle } : v
            ));
            setEditingTitleId(null);
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleViewDocuments = (validation: any) => {
    setSelectedValidation(validation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedValidation(null);
  };

  const loadAllDocuments = async (validationsList: any[]) => {
    if (hasLoadedDocs) return;
    setLoadingDocs(true);
    try {
      const allDocs: any[] = [];
      await Promise.all(validationsList.map(async (v) => {
        try {
          const res = await appointmentService.getValidationDocuments(v.id);
          const fetchedDocs = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || (res.data as any)?.documents || []);
          if (res.success && fetchedDocs) {
            const docsWithContext = fetchedDocs.map((d: any) => ({
                ...d, 
                validationId: v.id, 
                appointmentId: v.appointmentId, 
                companyName: v.companyName, 
                engineerName: v.engineerName, 
                apptDate: v.rawDate
            }));
            allDocs.push(...docsWithContext);
          }
        } catch (e) {}
      }));
      setAllDocuments(allDocs);
      setHasLoadedDocs(true);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleToggleView = (mode: 'cita' | 'carpeta') => {
    setViewMode(mode);
    if (mode === 'carpeta' && !hasLoadedDocs) {
      loadAllDocuments(validations);
    }
  };

  const toggleFolder = (folderName: string) => {
      setExpandedFolders(prev => ({
          ...prev,
          [folderName]: prev[folderName] === undefined ? false : !prev[folderName]
      }));
  };

  const handleViewDocFromFolder = (doc: any) => {
      setSelectedValidation({
          id: doc.validationId,
          appointmentId: doc.appointmentId,
          companyName: doc.companyName,
          selectedDocId: doc.isActa ? 'ACTA_VISITA_ID' : doc.id
      });
      setIsModalOpen(true);
  };

  const renderFolders = () => {
    if (loadingDocs) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            </div>
        );
    }

    const filteredDocs = allDocuments.filter(doc => 
        (doc.fileName || doc.originalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredDocs.length === 0) {
        return (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 font-inter">No hay documentos</h3>
              <p className="mt-1 text-gray-500 font-inter">No se encontraron documentos en carpetas.</p>
            </div>
        );
    }

    const folderGroups = filteredDocs.reduce((acc: any, doc: any) => {
        if (doc.isActa) {
             if (!acc['Acta de Visita']) acc['Acta de Visita'] = [];
             acc['Acta de Visita'].push(doc);
        } else {
             const folderKey = FOLDER_NAMES[doc.documentType] || 'Carpeta: Otro';
             if (!acc[folderKey]) acc[folderKey] = [];
             acc[folderKey].push(doc);
        }
        return acc;
    }, {} as any);

    return (
        <div className="space-y-6">
            {Object.entries(folderGroups).map(([folderName, folderDocs]: any) => {
                const isExpanded = expandedFolders[folderName] !== false; 
                
                return (
                <div key={folderName} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                   <button 
                        onClick={() => toggleFolder(folderName)}
                        className="w-full flex items-center justify-between text-left group focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
                                </svg>
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{folderName}</h3>
                            <span className="text-xs text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-bold">{folderDocs.length}</span>
                        </div>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isExpanded && (
                        <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {folderDocs.map((doc: any) => (
                                <div 
                                    key={doc.id}
                                    onClick={() => handleViewDocFromFolder(doc)}
                                    className="p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer flex items-start gap-3 shadow-sm"
                                >
                                     <div className={`p-2 rounded flex-shrink-0 
                                            ${doc.isActa ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
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
                                    <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-black truncate ${doc.isActa ? 'text-blue-700' : 'text-gray-900'}`} title={formatFileName(doc.fileName || doc.originalName)}>
                                                {formatFileName(doc.fileName || doc.originalName) || 'Documento sin nombre'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-semibold mt-1 uppercase tracking-wider">Cita: {formatShortDate(doc.apptDate)}</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                );
            })}
        </div>
    );
  };

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-inter">
              Documentación de Validaciones
            </h1>
            <p className="text-gray-600 font-inter">
              Consulta y visualiza la documentación de tus validaciones completadas.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
              <button 
                className={`flex-1 md:w-32 py-2 text-[11px] uppercase tracking-widest font-black rounded-lg transition-all ${viewMode === 'cita' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                onClick={() => handleToggleView('cita')}
              >
                Por Cita
              </button>
              <button 
                className={`flex-1 md:w-32 py-2 text-[11px] uppercase tracking-widest font-black rounded-lg transition-all ${viewMode === 'carpeta' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                onClick={() => handleToggleView('carpeta')}
              >
                Por Carpeta
              </button>
            </div>

            <div className="relative flex-1 md:w-80 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={viewMode === 'cita' ? "Buscar validaciones..." : "Buscar documentos..."}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm font-inter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Dynamic Rendering */}
        {viewMode === 'cita' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredValidations.map((validation) => (
              <div
                key={validation.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer relative"
              onClick={() => handleViewDocuments(validation)}
            >
              {/* Success Rate Badge - Top Right */}
              {validation.successRate !== null && validation.successRate !== undefined && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                  {Math.round(validation.successRate)}%
                </div>
              )}

              <div className="flex justify-between items-start mb-4 mt-8">
                <div className="flex-1 min-w-0">
                  {editingTitleId === validation.appointmentId ? (
                    <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                        <input 
                            type="text" 
                            className="flex-1 px-2 py-1 bg-gray-50 border border-blue-500 rounded text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            autoFocus
                        />
                        <button 
                            onClick={e => handleSaveTitle(e, validation.appointmentId)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button 
                            onClick={e => { e.stopPropagation(); setEditingTitleId(null); }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                  ) : (
                    <div className="flex items-start group gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate flex-1" title={validation.title || `Cita para ${validation.companyName}`}>
                            {validation.title || `Cita para ${validation.companyName}`}
                        </h3>
                        <button 
                            onClick={e => handleEditTitle(e, validation)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 truncate">Ingeniero: {validation.engineerName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${validation.status === 'APROBADO' || validation.status === 'COMPLETADO' ? 'bg-green-100 text-green-700' : 
                    validation.status === 'RECHAZADO' ? 'bg-red-100 text-red-700' : 
                    validation.status === 'EN_REVISION' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {validation.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{validation.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{validation.docCount} documento(s)</span>
                </div>
              </div>

              <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                Ver Documentación
              </button>
            </div>
          ))}

          {filteredValidations.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 font-inter">No hay validaciones</h3>
              <p className="mt-1 text-gray-500 font-inter">No se encontraron validaciones para tu empresa.</p>
            </div>
          )}
          </div>
        ) : (
          renderFolders()
        )}
      </div>

      {/* Visualization Modal (Read-Only) */}
      {selectedValidation && (
        <ValidationReviewModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          validationId={selectedValidation.id}
          companyName={selectedValidation.companyName}
          appointmentId={selectedValidation.appointmentId}
          readOnly={true}
          singleDocumentId={selectedValidation.selectedDocId}
        />
      )}
    </DashboardLayout>
  );
}
