'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/app/components/layout';
import { solicitudService } from '@/app/services/solicitudes/solicitudService';
import { tramiteService } from '@/app/services/tramites/tramiteService';
import { procesoService, CreateProcesoDTO } from '@/app/services/procesos/procesoService';
import { engineerService } from '@/app/services/engineers/engineerService';
import { invimaService } from '@/app/services/invima/invimaService';
import { observacionService } from '@/app/services/observaciones/observacionService';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- TIMEZONE UTILS ---
const formatCO = (dateInput: any, includeTime = false) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    
    if (!includeTime) {
       // Normalizar a YYYY-MM-DD en zona horaria de Colombia
       return new Intl.DateTimeFormat('en-CA', {
         timeZone: 'America/Bogota',
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
       }).format(d);
    }

    return d.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (e) {
    return String(dateInput);
  }
};

// --- DATA TYPES ---
type InvimaStatus = 'PREPARACION' | 'RADICADO' | 'EN_REVISION' | 'OBSERVACIONES' | 'APROBADO' | 'RECHAZADO' | 'EN_PROCESO' | 'TERMINADO' | 'PENDIENTE' | 'COMPLETADA';

interface TimelineEvent {
  status: InvimaStatus;
  title: string;
  date: string | null;
  description: string;
  completed: boolean;
  current: boolean;
  alert?: boolean;
  subItems?: string[];
}

interface DocumentDetail {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'APROBADO' | 'EN_REVISION' | 'RECHAZADO' | 'FALTANTE' | 'REQUIERE_CORRECCION';
}

interface HistoryEvent {
  date: string;
  user: string;
  action: string;
  detail: string;
}

interface ProductProcess {
  id: string;
  fechaEntrada: string;
  fechaInicioBPM: string;
  fechaTerminacion: string | null;
  nombreTramite: string;
  descripcion?: string;
  observacion: string;
  diasVencimiento?: number;
  radicadoSeguimiento: string;
  llave?: string;
  ingeniero: string;
  estado: InvimaStatus;
  etapa: string;
  titular: string;
  idioma: string;
  tipoTramite: string;
  asignacion: string;
  grupo: string;
  progress: number;
  timeline: TimelineEvent[];
  documents: DocumentDetail[];
  history: HistoryEvent[];
  rawProceso?: any;
}

// --- STAGES CONFIGURATION ---

const STAGES_LIST = [
  "SOLICITUD INICIO DE TRÁMITE",
  "INICIO DE TRÁMITE PROVEEDOR",
  "VERIFICACIÓN DOCUMENTAL",
  "ELABORACIÓN DE FORMULARIOS",
  "ELABORACIÓN ANTICIPO",
  "REVISIÓN / APROBACIÓN FORMULARIOS",
  "PAGO ANTICIPO",
  "RADICADO INVIMA",
  "TIEMPO DE RESPUESTA RESOLUCIÓN INVIMAGIL",
  "ENVÍO INFORME RESOLUCIÓN"
];

const buildTimeline = (currentStageIdx: number, alertIdx: number = -1, baseDateStr: string = '2023-10-01'): TimelineEvent[] => {
    const baseDate = new Date(baseDateStr);
    return STAGES_LIST.map((name, i) => {
        const isCompleted = i < currentStageIdx;
        const isCurrent = i === currentStageIdx;
        const isAlert = i === alertIdx;
        
        let dateStr = null;
        if (isCompleted || isCurrent) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + (i * 3));
            dateStr = date.toISOString().split('T')[0];
        }

        const subItemsDocs = [
            "Certificado de Existencia y Representación Legal",
            "Fórmula Cualicuantitativa / Ficha Técnica",
            "Certificados de Análisis o Estabilidad",
            "Certificado de Buenas Prácticas (BPM)",
            "Certificado de Venta Libre (CVL)",
            "Artes, Bocetos y Etiquetas Comerciales",
            "Comprobante de Pago de Tarifa INVIMA"
        ];

        return {
            status: (isAlert ? 'OBSERVACIONES' : (isCompleted ? 'APROBADO' : (isCurrent ? 'EN_REVISION' : 'PREPARACION'))) as InvimaStatus,
            title: name,
            date: dateStr,
            description: isCompleted ? 'Etapa completada exitosamente.' : (isAlert ? 'Revisión requerida en esta etapa.' : (isCurrent ? 'En proceso actualmente.' : 'Etapa pendiente.')),
            completed: isCompleted,
            current: isCurrent,
            alert: isAlert,
            ...(name === 'VERIFICACIÓN DOCUMENTAL' ? { subItems: subItemsDocs } : {})
        };
    });
};


export default function InvimaDashboard() {
  const [dashboardSolicitudes, setDashboardSolicitudes] = useState<ProductProcess[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProcess | null>(null);
  const [selectedProceso, setSelectedProceso] = useState<any>(null);
  const [isLoadingProceso, setIsLoadingProceso] = useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'ETAPAS' | 'DOCUMENTOS' | 'HISTORIAL'>('RESUMEN');
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('');
  const [editingDocsMap, setEditingDocsMap] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<{ total: number, page: number, limit: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } | null>(null);

  // --- ENGINEER CHANGE STATES ---
  const [engineersList, setEngineersList] = useState<any[]>([]);
  const [isChangingEngineer, setIsChangingEngineer] = useState(false);
  const [newEngineerId, setNewEngineerId] = useState('');
  const [isUpdatingEngineer, setIsUpdatingEngineer] = useState(false);

  // --- MODAL STATES ---
  const [showNewTramiteModal, setShowNewTramiteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showResponderAutoModal, setShowResponderAutoModal] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  // --- UPLOAD MODAL STATES ---
  const [uploadFiles, setUploadFiles] = useState<{ id: string; file: File; documentType: string; displayName: string }[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [documentType, setDocumentType] = useState('OTRO');
  const [isUploading, setIsUploading] = useState(false);
  const [verificacionEtapaId, setVerificacionEtapaId] = useState<string | null>(null);
  const [targetUploadEtapaId, setTargetUploadEtapaId] = useState<string | null>(null);
  const [targetUploadEtapaNombre, setTargetUploadEtapaNombre] = useState<string>('');
  const [procesoEtapas, setProcesoEtapas] = useState<any[]>([]);
  const [notasEdicion, setNotasEdicion] = useState<Record<string, string>>({});
  const [guardandoNotas, setGuardandoNotas] = useState<Record<string, boolean>>({});

  // --- REVIEW MODAL STATES ---
  const [selectedReviewDoc, setSelectedReviewDoc] = useState<any>(null);
  const [selectedReviewPreviewUrl, setSelectedReviewPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isUpdatingDocStatus, setIsUpdatingDocStatus] = useState(false);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isReplacingDoc, setIsReplacingDoc] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // --- NUEVO TRAMITE (PROCESO) STATES ---
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [tramitesBase, setTramitesBase] = useState<any[]>([]);
  const [etapasBase, setEtapasBase] = useState<any[]>([]);
  const [isCreatingProceso, setIsCreatingProceso] = useState(false);
  const [procesoError, setProcesoError] = useState<string | null>(null);
  const [procesoSuccess, setProcesoSuccess] = useState<string | null>(null);
  const [isDeletingTramite, setIsDeletingTramite] = useState(false);
  
  // Modals and Forms states for editing details
  const [isEditingDetalles, setIsEditingDetalles] = useState(false);
  const [detallesForm, setDetallesForm] = useState({ codigo: '', llave: '', radicadoInicio: '' });
  const [isUpdatingDetalles, setIsUpdatingDetalles] = useState(false);
  
  const [procesoForm, setProcesoForm] = useState<CreateProcesoDTO>({
    solicitudId: '',
    tramiteBaseId: '',
    codigo: '',
    llave: '',
    radicadoInicio: '',
    urlRadicado: '',
    etapasIds: []
  });

  const { canManageProcess, canUploadDocuments, canReviewDocuments } = useMemo(() => {
    if (!role || !user) return { canManageProcess: false, canUploadDocuments: false, canReviewDocuments: false };
    
    const tipoRaw = user.tipo || user.invimaProfile?.tipo || '';
    const tipo = String(tipoRaw).toUpperCase();
    
    // DEBUG LOGS - View these in Browser Console (F12)
    console.log('[Permission Check]', { role, tipo, userEmail: user.email });

    // 1. If profile is explicitly COMERCIAL, NO write access EVER
    if (tipo === 'COMERCIAL') {
      return { canManageProcess: false, canUploadDocuments: false, canReviewDocuments: false };
    }

    const isAdmin = role === 'admin' || role === 'administrador';
    const isEngineer = role === 'engineer' || role === 'ingeniero' || (role === 'invima' && tipo === 'ADMINISTRATIVO');
    const isInvimaAdmin = role === 'invima' && tipo === 'ADMINISTRATIVO';

    return {
      canManageProcess: isAdmin || isEngineer,
      canReviewDocuments: isAdmin || isEngineer,
      canUploadDocuments: isAdmin || isEngineer || isInvimaAdmin,
    };
  }, [role, user]);

  // Fetch user data and dashboard data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      const r = ((parsed.role as any)?.name || parsed.role || '').toLowerCase();
      setRole(r);

      // Fetch additional profile data only if the user is INVIMA to get 'tipo' (COMERCIAL/ADMINISTRATIVO) and invimaCompanyId
      if (r === 'invima') {
        const userId = parsed.id;
        if (userId) {
          invimaService.getProfileByUserId(userId).then((userProfile: any) => {
            console.log('[InvimaDashboard] Profile fetched:', userProfile);

            if (userProfile) {
              // No sobreescribir el id del usuario con el id del perfil INVIMA (son entidades distintas)
              const updatedUser = {
                ...parsed,
                tipo: userProfile.tipo,
                invimaCompanyId: userProfile.invimaCompanyId,
                invimaCompanyName: userProfile.invimaCompany?.nombre,
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } else if (parsed.tipo) {
              setUser(parsed);
            }
          }).catch(err => {
            console.error('[InvimaDashboard] Error fetching profile:', err);
            if (parsed.tipo) setUser(parsed);
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm) setCurrentPage(1); // Reset to first page when searching
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (role === 'admin' || role === 'administrador') {
      engineerService.getAllEngineers().then(setEngineersList).catch(console.error);
    }
  }, [role]);

  useEffect(() => {
    if (!user || !role) return;

    // Fetch dashboard solicitudes (only those with processes)
    const fetchDashboardData = async () => {
      setIsLoadingDashboard(true);
      try {
        const engineerId = user.engineerId;
        let res: any;

        if (debouncedSearchTerm) {
          // Búsqueda en frontend: Iteramos por las páginas para no tocar el backend
          let allData: any[] = [];
          let currentFetchPage = 1;
          let totalPages = 1;
          let lastMeta = null;

          while (currentFetchPage <= totalPages) {
            let pageRes: any;
            if (role === 'admin' || role === 'administrador') {
              pageRes = await solicitudService.getAllSolicitudes(undefined, currentFetchPage, 100);
            } else if (role === 'invima') {
              if (user?.invimaCompanyId) {
                pageRes = await solicitudService.getSolicitudesByTitular(user.invimaCompanyId, currentFetchPage, 100);
              } else {
                break;
              }
            } else if (engineerId) {
              pageRes = await solicitudService.getSolicitudesByIngeniero(engineerId, undefined, true, currentFetchPage, 100);
            }

            if (pageRes) {
              const items = Array.isArray(pageRes) ? pageRes : (pageRes.data || []);
              allData = [...allData, ...items];
              if (pageRes.meta) {
                lastMeta = pageRes.meta;
                totalPages = pageRes.meta.totalPages || 1;
              }
            } else {
              break;
            }
            currentFetchPage++;
          }
          
          res = { data: allData, meta: lastMeta };
        } else {
          // Normal paginated fetch
          if (role === 'admin' || role === 'administrador') {
            res = await solicitudService.getAllSolicitudes(undefined, currentPage, 10);
          } else if (role === 'invima') {
            if (user?.invimaCompanyId) {
              res = await solicitudService.getSolicitudesByTitular(user.invimaCompanyId, currentPage, 10);
            }
          } else if (engineerId) {
            res = await solicitudService.getSolicitudesByIngeniero(engineerId, undefined, true, currentPage, 10);
          }
        }

        if (res) {
          let rawData = Array.isArray(res) ? res : (res?.data || []);
          if (res.meta) setPaginationMeta(res.meta);
          
          const mappedData: ProductProcess[] = rawData.map((item: any) => {
            // The item could be a Solicitud with a nested 'proceso' or just a Solicitud.
              const sol = item;
              const proc = item.proceso || (item.solicitud ? item : null); // Handle if item is process
              const solId = sol.id;
              
              let finalTitular = sol.titular || sol.titularNombre || sol.cliente?.nombre || sol.empresa?.nombre || 'Sin titular';
              let finalObs = sol.observacion || '';
              // Soporte para extracción manual por si la BD aún tiene el titular dentro de la observación
              const match = finalObs.match(/Titular del producto:\s*(.*?)(?=\r|\n|$)/i);
              if (match && match[1].trim()) {
                finalTitular = match[1].trim();
                finalObs = finalObs.replace(match[0], '').trim();
                // Limpiar posibles saltos de línea huérfanos al inicio
                finalObs = finalObs.replace(/^[\r\n]+/, '').trim();
              }

              return {
                id: solId,
                fechaEntrada: formatCO(sol.fechaEntrada),
                fechaInicioBPM: formatCO(sol.fechaEntrada),
                fechaTerminacion: (() => {
                  const estadoTemp = proc?.status || sol.estado || '';
                  const isCompleted = ['TERMINADO', 'APROBADO', 'COMPLETADA'].includes(estadoTemp.toUpperCase());
                  const fDate = proc?.fechaFin || proc?.fechaTerminacion || sol.fechaTerminacion || (isCompleted ? (proc?.updatedAt || sol.updatedAt) : null);
                  return fDate ? formatCO(fDate) : null;
                })(),
                nombreTramite: sol.titulo || 'Sin título',
                observacion: finalObs,
                radicadoSeguimiento: proc?.radicadoInicio || sol.radicadoInicio || '',
                ingeniero: sol.ingenieroNombre || (sol.ingeniero ? `${sol.ingeniero.first_name} ${sol.ingeniero.last_name}` : ''),
                estado: (proc?.status || sol.estado || 'EN_REVISION') as InvimaStatus,
                etapa: proc?.etapaActual || 'Solicitud',
                titular: finalTitular,
                descripcion: sol.descripcion || '',
                idioma: sol.idioma || 'Español',
                tipoTramite: sol.asignacion || 'Trámite',
                asignacion: sol.asignacion || 'Normal',
                grupo: sol.grupo || 'General',
                progress: proc?.porcentajeCompletado || proc?.progresoPorcentaje || sol.progresoPorcentaje || 0,
                timeline: buildTimeline(1, -1, sol.fechaEntrada), 
                documents: [],
                history: [],
                rawProceso: proc
              };
            });

            setDashboardSolicitudes(mappedData);
            if (mappedData.length > 0) {
              setSelectedProduct(mappedData[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching dashboard data", error);
        } finally {
          setIsLoadingDashboard(false);
        }
      };

      fetchDashboardData();
  }, [user, role, currentPage, debouncedSearchTerm]);

  // Fetch process details when selectedProduct changes
  useEffect(() => {
    if (selectedProduct?.id) {
      const fetchProcesoDetails = async () => {
        setIsLoadingProceso(true);
        try {
          let proc = selectedProduct.rawProceso;
          
          // No buscar proceso si sabemos que la solicitud está PENDIENTE (no tiene proceso asignado)
          const shouldFetchProc = !proc && selectedProduct.estado !== 'PENDIENTE';
          
          // Promise.all para obtener el proceso y el detalle de la solicitud en paralelo
          const [fetchedProc, solicitudDetalle] = await Promise.all([
            shouldFetchProc ? procesoService.getProcesoBySolicitudId(selectedProduct.id).catch(() => null) : Promise.resolve(null),
            solicitudService.getSolicitudById(selectedProduct.id).catch(() => null)
          ]);
          
          if (!proc && fetchedProc) {
            proc = fetchedProc;
          }
          
          setSelectedProceso(proc);
          
          // Extraer el titular si la solicitud detallada lo trae en observación
          let extractedTitular = undefined;
          let finalObsToSave = undefined;
          if (solicitudDetalle) {
            let finalObs = solicitudDetalle.observacion || '';
            const match = finalObs.match(/Titular del producto:\s*(.*?)(?=\r|\n|$)/i);
            if (match && match[1].trim()) {
              extractedTitular = match[1].trim();
              finalObs = finalObs.replace(match[0], '').trim();
              finalObs = finalObs.replace(/^[\r\n]+/, '').trim();
            } else if (solicitudDetalle.titular) {
              extractedTitular = solicitudDetalle.titular;
            }
            finalObsToSave = finalObs;
          }
          
          // If we have a process or a detail, we update the selectedProduct
          if (proc || solicitudDetalle) {
            setSelectedProduct(prev => {
              if (!prev) return null;
              return {
                ...prev,
                titular: extractedTitular || prev.titular,
                descripcion: solicitudDetalle?.descripcion || prev.descripcion,
                observacion: finalObsToSave !== undefined ? finalObsToSave : prev.observacion,
                radicadoSeguimiento: proc?.radicadoInicio || prev.radicadoSeguimiento,
                llave: proc?.llave || prev.llave,
                idioma: proc?.solicitud?.idioma || proc?.idioma || prev.idioma,
                progress: proc?.porcentajeCompletado !== undefined ? proc.porcentajeCompletado : (proc?.progresoPorcentaje !== undefined ? proc.progresoPorcentaje : prev.progress),
                documents: (proc?.documents || []).map((doc: any) => ({
                  id: doc.id,
                  name: doc.displayName || doc.fileName || 'Documento',
                  type: doc.documentType || 'General',
                  uploadDate: formatCO(doc.createdAt),
                  status: doc.status || 'EN_REVISION'
                })),
                history: (proc?.historial || []).map((h: any) => ({
                  date: formatCO(h.createdAt, true),
                  user: h.usuarioNombre || 'Sistema',
                  action: h.accion || 'Cambio',
                  detail: h.descripcion || ''
                }))
              };
            });

            // Fetch stages to find Verificación Documental ID and fetch history
            const fetchStagesAndHistory = async () => {
              try {
                // Fetch stages
                const stages = await procesoService.getEtapasByProcesoId(proc.id);
                const verificacion = stages.find((s: any) => 
                  s.etapa?.nombre === "VERIFICACIÓN DOCUMENTAL" || 
                  s.nombre === "VERIFICACIÓN DOCUMENTAL" ||
                  s.etapaNombre === "VERIFICACIÓN DOCUMENTAL"
                );
                if (verificacion) {
                  setVerificacionEtapaId(verificacion.id);
                }
                setProcesoEtapas(stages);

                // Fetch observations
                const obsRes = await observacionService.getObservacionesByProcesoId(proc.id);
                const rawObs = Array.isArray(obsRes) ? obsRes : (obsRes?.data || []);
                
                const mappedHistory = rawObs.map((h: any) => ({
                  date: formatCO(h.fecha || h.createdAt, true),
                  user: h.createdByUserName || 'Sistema',
                  action: 'HISTORIAL',
                  detail: h.contenido || ''
                }));

                setSelectedProduct(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    history: mappedHistory
                  };
                });

              } catch (err) {
                console.error("Error fetching stages or history", err);
              }
            };
            if (proc) {
              fetchStagesAndHistory();
            }
          }
        } catch (err) {
          console.error("Error fetching process details", err);
          setSelectedProceso(null);
        } finally {
          setIsLoadingProceso(false);
        }
      };
      fetchProcesoDetails();
    }
  }, [selectedProduct?.id]);

  const saveReqDocs = async (reqDocs: string[]) => {
    if (!selectedProduct || !selectedProceso) return;
    try {
      await observacionService.createObservacion({
        procesoId: selectedProceso.id,
        contenido: `|REQ_DOCS:${reqDocs.join(',')}|`
      });
      selectedProduct.history.push({
        date: new Date().toLocaleString(),
        action: 'Configuración',
        detail: `|REQ_DOCS:${reqDocs.join(',')}|`,
        user: user?.nombre || 'Sistema'
      });
    } catch (e) {
      console.error('Error guardando configuración de documentos', e);
      alert('No se pudo guardar la configuración de documentos requeridos');
    }
  };

  const handleUpdateEtapaStatus = async (etapaId: string, currentEstado: string, etapaNombre: string) => {
    let nextEstado = 'PENDIENTE';
    
    if (currentEstado === 'PENDIENTE') {
      nextEstado = 'EN_PROGRESO';
    } else if (currentEstado === 'EN_PROGRESO') {
      nextEstado = 'COMPLETADA';
    } else if (currentEstado === 'COMPLETADA') {
      nextEstado = 'EN_PROGRESO'; // Opción para reabrir
    }

    // Guardar selección de documentos si se está iniciando la etapa de Verificación
    if (currentEstado === 'PENDIENTE' && etapaNombre.toUpperCase().includes('VERIFICACI') && selectedProduct && selectedProceso) {
      const DOC_TYPES_VER = ['CVL', 'FICHAS_TECNICAS', 'PROCESO_ELABORACION', 'AUTORIZACION_AL_PORTADOR', 'AUTORIZACION_AL_TRAMITADOR', 'ETIQUETAS', 'ANALISIS_DE_LABORATORIO', 'REGISTRO_DE_MARCA', 'CERTIFICADO_DE_BPM', 'OTRO'];
      const reqDocs = editingDocsMap[selectedProduct.id] || DOC_TYPES_VER;
      await saveReqDocs(reqDocs);
    }

    try {
      if (currentEstado === 'COMPLETADA' && nextEstado === 'EN_PROGRESO') {
        await procesoService.reopenEtapa(etapaId);
      } else {
        await procesoService.updateEtapaStatus(etapaId, nextEstado);
      }

      // Log action in observations
      if (selectedProceso?.id) {
        const toTitleCase = (str: string) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const estadoLabel = (e: string) => ({ PENDIENTE: 'Pendiente', EN_PROGRESO: 'En progreso', COMPLETADA: 'Completada', CANCELADA: 'Cancelada' }[e] || e);
        try {
          await observacionService.createObservacion({
            procesoId: selectedProceso.id,
            contenido: `Estado de etapa "${toTitleCase(etapaNombre)}" cambiado de ${estadoLabel(currentEstado)} a ${estadoLabel(nextEstado)}`
          });
        } catch (obsErr) {
          console.warn('No se pudo guardar la observación de cambio de estado', obsErr);
        }
      }

      // Refresh process details to show updated status and history
      if (selectedProduct?.id) {
        const proc = await procesoService.getProcesoBySolicitudId(selectedProduct.id);
        setSelectedProceso(proc);
        
        if (proc?.id) {
          const refreshedStages = await procesoService.getEtapasByProcesoId(proc.id);
          setProcesoEtapas(refreshedStages);
          const obsRes2 = await observacionService.getObservacionesByProcesoId(proc.id);
          const rawObs2 = Array.isArray(obsRes2) ? obsRes2 : (obsRes2?.data || []);
          
          const newProgress = proc.porcentajeCompletado ?? proc.progresoPorcentaje ?? selectedProduct.progress;
          
          setSelectedProduct(prev => prev ? { 
            ...prev, 
            progress: newProgress,
            history: rawObs2.map((h: any) => ({ date: formatCO(h.fecha || h.createdAt, true), user: h.createdByUserName || 'Sistema', action: 'HISTORIAL', detail: h.contenido || '' })) 
          } : null);
          
          setDashboardSolicitudes(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, progress: newProgress } : p));
        }

        // Check if all stages are completed to finalize the process
        if (nextEstado === 'COMPLETADA' && proc?.id) {
          const stages = await procesoService.getEtapasByProcesoId(proc.id);
          const allCompleted = stages.length > 0 && stages.every((s: any) => s.estado === 'COMPLETADA');
          
          if (allCompleted) {
            // 1. Log finalization in observations FIRST while process is still active
            try {
              await observacionService.createObservacion({
                procesoId: proc.id,
                contenido: `Proceso finalizado exitosamente. Todas las etapas han sido completadas.`
              });
            } catch (obsErr) {
              console.warn('No se pudo guardar la observación de finalización de proceso', obsErr);
            }

            // 2. Lock the process to TERMINADO
            await procesoService.updateProcesoEstado(proc.id, "TERMINADO");

            // Update UI state
            setSelectedProduct(prev => prev ? { ...prev, estado: 'APROBADO' as any } : null);
          }
        }
      }
    } catch (err: any) {
      console.error("Error updating stage status:", err);
      alert(err?.message || 'Error al actualizar el estado de la etapa');
    }
  };

  const handleSaveNotas = async (etapaId: string, notas: string) => {
    setGuardandoNotas(prev => ({ ...prev, [etapaId]: true }));
    try {
      await procesoService.updateEtapaNotas(etapaId, notas);
      setProcesoEtapas(prev => prev.map(e => e.id === etapaId ? { ...e, notas } : e));
    } catch (err: any) {
      console.error("Error updating stage notes:", err);
    } finally {
      setTimeout(() => {
        setGuardandoNotas(prev => ({ ...prev, [etapaId]: false }));
      }, 1000);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      return;
    }

    if (!targetUploadEtapaId && !verificacionEtapaId) {
      console.error("No se encontró el ID de la etapa para subir el documento.");
      return;
    }

    const uploadEtapaId = targetUploadEtapaId || verificacionEtapaId;

    if (!uploadEtapaId) return;

    setIsUploading(true);
    try {
      for (const item of uploadFiles) {
        const nameToUse = item.displayName || item.file.name;
        
        await invimaService.uploadDocument(uploadEtapaId, {
          file: item.file,
          displayName: nameToUse,
          documentType: item.documentType
        });

        // Log action in observations
        try {
          await observacionService.createObservacion({
            procesoId: selectedProceso.id,
            contenido: `Se subió el documento (${targetUploadEtapaNombre || 'Verificación'}): ${nameToUse} (${item.documentType})`
          });
        } catch (obsErr) {
          console.warn('No se pudo guardar la observación de subida de documento', obsErr);
        }
      }
      
      setShowUploadModal(false);
      setUploadFiles([]);
      setDisplayName('');
      
      // Refresh process details to show new document and history
      if (selectedProduct?.id) {
        const proc = await procesoService.getProcesoBySolicitudId(selectedProduct.id);
        setSelectedProceso(proc);
        // Also refresh stages to update document checklist
        if (proc?.id) {
          const refreshedStages = await procesoService.getEtapasByProcesoId(proc.id);
          setProcesoEtapas(refreshedStages);
          const obsRes2 = await observacionService.getObservacionesByProcesoId(proc.id);
          const rawObs2 = Array.isArray(obsRes2) ? obsRes2 : (obsRes2?.data || []);
          setSelectedProduct(prev => prev ? { ...prev, history: rawObs2.map((h: any) => ({ date: formatCO(h.fecha || h.createdAt, true), user: h.createdByUserName || 'Sistema', action: 'HISTORIAL', detail: h.contenido || '' })) } : null);
        }
      }
      
    } catch (err: any) {
      console.error("Error uploading document:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateDocumentStatus = async (status: string) => {
    if (!selectedReviewDoc) return;
    setIsUpdatingDocStatus(true);
    try {
      await invimaService.updateDocumentStatus(selectedReviewDoc.id, status);
      
      // Log action in observations
        try {
          await observacionService.createObservacion({
            procesoId: selectedProceso.id,
            contenido: `Se actualizó el estado del documento ${selectedReviewDoc.displayName || selectedReviewDoc.fileName} a ${status}`
          });
        } catch (obsErr) {
          console.warn('No se pudo guardar la observación de cambio de estado de documento', obsErr);
        }

      // Refresh process details to show new document status and history
      if (selectedProduct?.id) {
        const proc = await procesoService.getProcesoBySolicitudId(selectedProduct.id);
        setSelectedProceso(proc);
        if (proc?.id) {
          const refreshedStages = await procesoService.getEtapasByProcesoId(proc.id);
          setProcesoEtapas(refreshedStages);
          const obsRes2 = await observacionService.getObservacionesByProcesoId(proc.id);
          const rawObs2 = Array.isArray(obsRes2) ? obsRes2 : (obsRes2?.data || []);
          setSelectedProduct(prev => prev ? { ...prev, history: rawObs2.map((h: any) => ({ date: formatCO(h.fecha || h.createdAt, true), user: h.createdByUserName || 'Sistema', action: 'HISTORIAL', detail: h.contenido || '' })) } : null);
        }
      }
      
      setSelectedReviewDoc(null);
    } catch (err: any) {
      console.error("Error updating document status:", err);
    } finally {
      setIsUpdatingDocStatus(false);
    }
  };

  const handleOpenReviewModal = async (doc: any) => {
    setSelectedReviewDoc(doc);
    setSelectedReviewPreviewUrl(null);
    setIsLoadingPreview(true);
    try {
      const previewData = await invimaService.getDocumentPreview(doc.id);
      setSelectedReviewPreviewUrl(previewData?.url || null);
    } catch (err) {
      console.error("Error al obtener la previsualización", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleReplaceDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedReviewDoc) return;
    
    setIsReplacingDoc(true);
    try {
      await invimaService.replaceDocument(selectedReviewDoc.id, {
        file,
        displayName: selectedReviewDoc.displayName || selectedReviewDoc.fileName || file.name,
        documentType: selectedReviewDoc.documentType || 'OTRO',
        etapaId: selectedReviewDoc.etapaId || selectedProceso?.etapas?.find((e: any) => e.documentosSubidos?.some((d: any) => d.id === selectedReviewDoc.id))?.etapaId || '',
        procesoEtapaId: selectedReviewDoc.procesoEtapaId || selectedProceso?.etapas?.find((e: any) => e.documentosSubidos?.some((d: any) => d.id === selectedReviewDoc.id))?.id || '',
      });
      
      // Log action
        try {
          await observacionService.createObservacion({
            procesoId: selectedProceso.id,
            contenido: `Se reemplazó el archivo del documento ${selectedReviewDoc.displayName || selectedReviewDoc.fileName}`
          });
        } catch (obsErr) {
          console.warn('No se pudo guardar la observación de reemplazo de documento', obsErr);
        }

      // Refresh
      if (selectedProduct?.id) {
        const proc = await procesoService.getProcesoBySolicitudId(selectedProduct.id);
        setSelectedProceso(proc);
        if (proc?.id) {
          const refreshedStages = await procesoService.getEtapasByProcesoId(proc.id);
          setProcesoEtapas(refreshedStages);
          // Re-fetch preview
          handleOpenReviewModal(selectedReviewDoc);
        }
      }
    } catch (err: any) {
      console.error("Error replacing document:", err);
    } finally {
      setIsReplacingDoc(false);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedReviewDoc) return;
    const confirmed = window.confirm(`¿Está seguro de eliminar el documento "${selectedReviewDoc.displayName || selectedReviewDoc.fileName}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setIsDeletingDoc(true);
    try {
      await invimaService.deleteDocument(selectedReviewDoc.id);

      try {
        await observacionService.createObservacion({
          procesoId: selectedProceso.id,
          contenido: `Se eliminó el documento ${selectedReviewDoc.displayName || selectedReviewDoc.fileName}`
        });
      } catch (obsErr) {
        console.warn('No se pudo guardar la observación de eliminación de documento', obsErr);
      }

      // Refresh process details to reflect removed document
      if (selectedProduct?.id) {
        const proc = await procesoService.getProcesoBySolicitudId(selectedProduct.id);
        setSelectedProceso(proc);
        if (proc?.id) {
          const refreshedStages = await procesoService.getEtapasByProcesoId(proc.id);
          setProcesoEtapas(refreshedStages);
          const obsRes2 = await observacionService.getObservacionesByProcesoId(proc.id);
          const rawObs2 = Array.isArray(obsRes2) ? obsRes2 : (obsRes2?.data || []);
          setSelectedProduct(prev => prev ? { ...prev, history: rawObs2.map((h: any) => ({ date: formatCO(h.fecha || h.createdAt, true), user: h.createdByUserName || 'Sistema', action: 'HISTORIAL', detail: h.contenido || '' })) } : null);
        }
      }

      setSelectedReviewDoc(null);
    } catch (err: any) {
      console.error("Error deleting document:", err);
      window.alert(err?.message || 'Ocurrió un error al eliminar el documento');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  // Fetch initial data for the form when modal opens
  useEffect(() => {
    if (showNewTramiteModal) {
      const fetchInitialData = async () => {
        try {
          const storedUser = localStorage.getItem('user');
          const userData = storedUser ? JSON.parse(storedUser) : null;
          
          const roleName = ((userData?.role as any)?.name || userData?.role || '').toLowerCase();
          const isAdmin = roleName === 'admin' || roleName === 'administrador';
          const isInvima = roleName === 'invima';
          const isAdminOrInvima = isAdmin || isInvima;

          // STRICT: Only use engineerId for engineers. Do not fallback to .id
          const engineerId = userData?.engineerId;

          if (!engineerId && !isAdminOrInvima) {
            console.error('[SeguimientoInvima] ERROR: engineerId no encontrado en el objeto user:', userData);
            setProcesoError('Su perfil no tiene un ID de ingeniero asociado. Por favor, cierre sesión y vuelva a entrar.');
            return;
          }

          console.log('[SeguimientoInvima] Cargando solicitudes...');

          let solsPromise: Promise<any> = Promise.resolve([]);

          if (isAdmin) {
            solsPromise = solicitudService.getAllSolicitudes('PENDIENTE');
          } else if (isInvima) {
            // La empresa INVIMA no admite filtro por estado en el backend:
            // se trae la lista de la empresa y se filtra PENDIENTE en cliente.
            if (userData?.invimaCompanyId) {
              solsPromise = solicitudService.getSolicitudesByTitular(userData.invimaCompanyId, 1, 100)
                .then((r: any) => {
                  const items = Array.isArray(r) ? r : (r?.data || []);
                  return { data: items.filter((s: any) => s.estado === 'PENDIENTE') };
                });
            } else {
              console.error('[SeguimientoInvima] ERROR: invimaCompanyId no encontrado en el usuario INVIMA:', userData);
              solsPromise = Promise.resolve({ data: [] });
            }
          } else if (engineerId) {
            solsPromise = solicitudService.getSolicitudesByIngeniero(engineerId, 'PENDIENTE');
          }

          const [solsRes, tramitesRes]: [any, any] = await Promise.all([
            solsPromise,
            tramiteService.getSimpleList()
          ]);
          
          const finalSols = Array.isArray(solsRes) ? solsRes : (solsRes?.data || []);
          console.log('[SeguimientoInvima] Solicitudes cargadas:', finalSols.length);
          
          setSolicitudes(finalSols);
          setTramitesBase(Array.isArray(tramitesRes) ? tramitesRes : (tramitesRes?.data || []));
        } catch (error: any) {
          console.error("Error fetching form data", error);
          setProcesoError('Error al cargar datos: ' + error.message);
        }
      };
      fetchInitialData();
    }
  }, [showNewTramiteModal]);

  // Fetch etapas when tramiteBaseId changes
  useEffect(() => {
    if (procesoForm.tramiteBaseId) {
      const fetchEtapas = async () => {
        try {
          const res = await tramiteService.getEtapasBaseByTramite(procesoForm.tramiteBaseId);
          const etapasData = Array.isArray(res) ? res : (res?.data || []);
          setEtapasBase(etapasData);
          // Auto-select all fetched etapas by default
          setProcesoForm(prev => ({ ...prev, etapasIds: etapasData.map((e: any) => e.etapaId) }));
        } catch (error) {
          console.error("Error fetching etapas", error);
        }
      };
      fetchEtapas();
    } else {
      setEtapasBase([]);
      setProcesoForm(prev => ({ ...prev, etapasIds: [] }));
    }
  }, [procesoForm.tramiteBaseId]);

  const handleProcesoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesoError(null);
    setProcesoSuccess(null);
    setIsCreatingProceso(true);

    try {
      const payload = {
        ...procesoForm,
        codigo: procesoForm.codigo.trim() || `Pendiente por asignar-${Date.now()}-C`,
        llave: procesoForm.llave.trim() || `Pendiente por asignar-${Date.now()}-L`,
        radicadoInicio: procesoForm.radicadoInicio.trim() || `Pendiente por asignar-${Date.now()}-R`,
      };
      const newProc = await procesoService.createProceso(payload);

      // Log action in observations
      if (newProc?.id) {
        try {
          await observacionService.createObservacion({
            procesoId: newProc.id,
            contenido: `Trámite inicializado con código ${procesoForm.codigo} y radicado ${procesoForm.radicadoInicio}`
          });
        } catch (obsErr) {
          console.warn('No se pudo guardar la observación de inicialización de trámite', obsErr);
        }
      }
      
      // Update solicitud status to EN_PROCESO
      try {
        await solicitudService.updateSolicitudEstado(procesoForm.solicitudId, 'EN_PROCESO');
        console.log('[HandleProcesoSubmit] Estado de solicitud actualizado a EN_PROCESO');
      } catch (patchErr) {
        console.error('Error al actualizar el estado de la solicitud:', patchErr);
      }

      setProcesoSuccess('Trámite creado exitosamente.');
      
      // Refresh solicitudes list (to remove the one that is no longer PENDIENTE)
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      if (userData?.engineerId) {
        const res = await solicitudService.getSolicitudesByIngeniero(userData.engineerId, 'PENDIENTE');
        setSolicitudes(Array.isArray(res) ? res : (res?.data || []));
      }

      // 💥 Update Dashboard Local State to reflect immediately without refreshing!
      setDashboardSolicitudes(prev => prev.map(p => {
        if (p.id === procesoForm.solicitudId) {
          return {
            ...p,
            estado: 'EN_PROCESO' as any,
            radicadoSeguimiento: procesoForm.radicadoInicio,
            etapa: 'SOLICITUD INICIO DE TRÁMITE', // First stage
            progress: 0
          };
        }
        return p;
      }));

      setTimeout(() => {
        setShowNewTramiteModal(false);
        setProcesoForm({
          solicitudId: '',
          tramiteBaseId: '',
          codigo: '',
          llave: '',
          radicadoInicio: '',
          urlRadicado: '',
          etapasIds: []
        });
      }, 2000);
    } catch (err: any) {
      setProcesoError(err.message || 'Error al crear el trámite.');
    } finally {
      setIsCreatingProceso(false);
    }
  };

  const handleUpdateDetalles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProceso) return;
    
    setIsUpdatingDetalles(true);
    try {
      await procesoService.updateProceso(selectedProceso.id, detallesForm);
      
      // Update local state to reflect changes
      setSelectedProceso((prev: any) => prev ? {
        ...prev,
        ...detallesForm
      } : prev);
      
      // Also update in solProduct mapping if applicable
      setDashboardSolicitudes(prev => prev.map(p => {
        if (p.rawProceso?.id === selectedProceso.id) {
          return {
            ...p,
            radicadoSeguimiento: detallesForm.radicadoInicio,
            llave: detallesForm.llave,
            rawProceso: {
              ...p.rawProceso,
              ...detallesForm
            }
          };
        }
        return p;
      }));

      setIsEditingDetalles(false);
      
      // Add observation
      try {
        await observacionService.createObservacion({
          procesoId: selectedProceso.id,
          contenido: `Detalles del trámite actualizados. Nuevo Radicado: ${detallesForm.radicadoInicio || 'N/A'}, Llave: ${detallesForm.llave || 'N/A'}, Código: ${detallesForm.codigo || 'N/A'}`
        });
        const obsRes = await observacionService.getObservacionesByProcesoId(selectedProceso.id);
        const rawObs = Array.isArray(obsRes) ? obsRes : (obsRes?.data || []);
        setSelectedProduct(prev => prev ? {
          ...prev,
          history: rawObs.map((h: any) => ({
            date: h.fecha ? new Date(h.fecha).toLocaleDateString() : new Date().toLocaleDateString(),
            user: h.createdByUserName || 'Sistema',
            action: 'HISTORIAL',
            detail: h.contenido || ''
          }))
        } : null);
      } catch(e) { console.error("Error updating history", e); }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar detalles');
    } finally {
      setIsUpdatingDetalles(false);
    }
  };

  const handleDeleteTramite = async () => {
    if (!selectedProduct) return;
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar este trámite y su solicitud?\nEsta acción no se puede deshacer.'
    );
    if (!confirmDelete) return;

    setIsDeletingTramite(true);
    try {
      // 1. Delete Proceso if it exists
      if (selectedProduct.rawProceso?.id) {
        await procesoService.deleteProceso(selectedProduct.rawProceso.id).catch(e => {
          console.warn('Error deleting proceso, it might not exist:', e);
        });
      }
      
      // 2. Delete Solicitud
      await solicitudService.deleteSolicitud(selectedProduct.id);
      
      // 3. Update UI
      setDashboardSolicitudes(prev => prev.filter(p => p.id !== selectedProduct.id));
      setSelectedProduct(null);
      setSelectedProceso(null);
      alert('El trámite ha sido eliminado exitosamente.');
    } catch (error: any) {
      alert('Error al eliminar el trámite: ' + error.message);
    } finally {
      setIsDeletingTramite(false);
    }
  };

  const handleEtapaToggle = (etapaId: string) => {
    setProcesoForm(prev => {
      const current = prev.etapasIds;
      if (current.includes(etapaId)) {
        return { ...prev, etapasIds: current.filter(id => id !== etapaId) };
      } else {
        return { ...prev, etapasIds: [...current, etapaId] };
      }
    });
  };


  // --- FILTERING ---
  const filteredData = useMemo(() => {
    return dashboardSolicitudes.filter(item => {
      const matchesSearch = item.nombreTramite.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                            item.titular.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                            (item.radicadoSeguimiento && item.radicadoSeguimiento.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'TODOS' || filterStatus === 'ALL' || item.estado === filterStatus ||
                            (filterStatus === 'APROBADO' && ['TERMINADO', 'COMPLETADA'].includes(String(item.estado).toUpperCase()));
      return matchesSearch && matchesStatus;
    });
  }, [debouncedSearchTerm, filterStatus, dashboardSolicitudes]);

  // --- AUTO-SELECT ON SEARCH ---
  useEffect(() => {
    if (debouncedSearchTerm && filteredData.length > 0) {
      // Auto select the first matched item
      setSelectedProduct(filteredData[0]);
      setIsMobileListVisible(false); // Open right pane
    }
  }, [debouncedSearchTerm, filteredData]);

  // --- STATS ---
  const stats = useMemo(() => ({
    total: paginationMeta?.total || dashboardSolicitudes.length,
    aprobados: dashboardSolicitudes.filter(d => ['APROBADO', 'TERMINADO', 'COMPLETADA'].includes(String(d.estado).toUpperCase())).length,
    revision: dashboardSolicitudes.filter(d => d.estado === 'EN_REVISION' || d.estado === 'RADICADO' || d.estado === 'EN_PROCESO').length,
    observaciones: dashboardSolicitudes.filter(d => d.estado === 'OBSERVACIONES').length,
  }), [dashboardSolicitudes, paginationMeta]);

  // --- UTILS ---
  const getStatusColor = (status: InvimaStatus) => {
    switch(status) {
      case 'APROBADO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'OBSERVACIONES': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-200';
      case 'EN_REVISION': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EN_PROCESO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RADICADO': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAsignacion = (val: string) => {
    switch (val) {
      case 'IMPORTADO_ALIMENTO': return 'Importados - Alimentos';
      case 'PERECEDEROS': return 'Perecederos';
      case 'MARCA_PROPIA': return 'Marca propia';
      case 'IMPORTADO_BEBIDA': return 'Importados - Bebidas alcoholicas';
      case 'IMPORTADO_PH': return 'Importados - ph';
      default: return val ? val.replace(/_/g, ' ') : '';
    }
  };

  const formatText = (val: string) => {
    if (!val) return '';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  };

  const handleExport = async () => {
    try {
      // 0. Fetch all data for export regardless of pagination
      setShowExportToast(true); // Maybe use a separate state like isExporting, but we can reuse the toast to show "Exportando..."
      
      let allSolicitudes: any[] = [];
      let currentPageExport = 1;
      const maxLimit = 100;
      let hasMore = true;

      while (hasMore) {
        let res: any;
        const engineerId = user?.engineerId;
        if (role === 'admin' || role === 'administrador') {
          res = await solicitudService.getAllSolicitudes(undefined, currentPageExport, maxLimit);
        } else if (role === 'invima') {
          if (user?.invimaCompanyId) {
            res = await solicitudService.getSolicitudesByTitular(user.invimaCompanyId, currentPageExport, maxLimit);
          } else {
            hasMore = false;
            break;
          }
        } else if (engineerId) {
          res = await solicitudService.getSolicitudesByIngeniero(engineerId, undefined, true, currentPageExport, maxLimit);
        }

        const dataArr = Array.isArray(res) ? res : (res?.data || []);
        allSolicitudes = [...allSolicitudes, ...dataArr];

        if (res?.meta) {
          hasMore = res.meta.hasNextPage;
        } else {
          // Fallback just in case meta is not correctly provided
          hasMore = dataArr.length === maxLimit;
        }
        currentPageExport++;
      }

      // Map the full raw data
      const mappedAllData: ProductProcess[] = allSolicitudes.map((item: any) => {
        const sol = item;
        const proc = item.proceso || (item.solicitud ? item : null);
        const solId = sol.id;
        
        let finalTitular = sol.titular || sol.titularNombre || sol.cliente?.nombre || sol.empresa?.nombre || 'Sin titular';
        let finalObs = sol.observacion || '';
        const match = finalObs.match(/Titular del producto:\s*(.*?)(?=\r|\n|$)/i);
        if (match && match[1].trim()) {
          finalTitular = match[1].trim();
          finalObs = finalObs.replace(match[0], '').trim();
          finalObs = finalObs.replace(/^[\r\n]+/, '').trim();
        }

        return {
          id: solId,
          fechaEntrada: formatCO(sol.fechaEntrada),
          fechaInicioBPM: formatCO(sol.fechaEntrada),
          fechaTerminacion: (() => {
            const estadoTemp = proc?.status || sol.estado || '';
            const isCompleted = ['TERMINADO', 'APROBADO', 'COMPLETADA'].includes(estadoTemp.toUpperCase());
            const fDate = proc?.fechaFin || proc?.fechaTerminacion || sol.fechaTerminacion || (isCompleted ? (proc?.updatedAt || sol.updatedAt) : null);
            return fDate ? formatCO(fDate) : null;
          })(),
          nombreTramite: sol.titulo || 'Sin título',
          observacion: finalObs,
          radicadoSeguimiento: proc?.radicadoInicio || sol.radicadoInicio || '',
          ingeniero: sol.ingenieroNombre || (sol.ingeniero ? `${sol.ingeniero.first_name} ${sol.ingeniero.last_name}` : ''),
          estado: (proc?.status || sol.estado || 'EN_REVISION') as InvimaStatus,
          etapa: proc?.etapaActual || 'Solicitud',
          titular: finalTitular,
          descripcion: sol.descripcion || '',
          idioma: sol.idioma || 'Español',
          tipoTramite: sol.asignacion || 'Trámite',
          asignacion: sol.asignacion || 'Normal',
          grupo: sol.grupo || 'General',
          progress: proc?.porcentajeCompletado || proc?.progresoPorcentaje || sol.progresoPorcentaje || 0,
          timeline: buildTimeline(1, -1, sol.fechaEntrada), 
          documents: [],
          history: [],
          rawProceso: proc
        };
      });

      // Filter exactly like the list UI
      const filteredAllData = mappedAllData.filter(item => {
        const matchesSearch = item.nombreTramite.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.titular.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.radicadoSeguimiento && item.radicadoSeguimiento.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'TODOS' || filterStatus === 'ALL' || item.estado === filterStatus ||
                              (filterStatus === 'APROBADO' && ['TERMINADO', 'COMPLETADA'].includes(String(item.estado).toUpperCase()));
        return matchesSearch && matchesStatus;
      });

      // 1. Fetch detailed documents for each process (using the all filtered data)
      const detailedData = await Promise.all(filteredAllData.map(async (item) => {
        let docsText = '';
        let obsText = '';
        let processId = item.rawProceso?.id || item.rawProceso?._id;
        let fetchedProc: any = null;
        try {
          // Always fetch full process to get accurate fechaFin/fechaTerminacion that might be missing from list view
          fetchedProc = await procesoService.getProcesoBySolicitudId(item.id);
          if (fetchedProc) {
            processId = fetchedProc.id || fetchedProc._id;
          }
        } catch (e) {
          // No process found for this solicitud
        }

        if (processId) {
          // Fetch stages for documents
          try {
            const stages = await procesoService.getEtapasByProcesoId(processId);
            const docs: string[] = [];
            stages.forEach((stage: any) => {
              if (stage.documentosSubidos && stage.documentosSubidos.length > 0) {
                stage.documentosSubidos.forEach((doc: any) => {
                   const statusName = doc.status ? doc.status.replace(/_/g, ' ') : 'PENDIENTE';
                   docs.push(`${doc.displayName || doc.fileName}: ${statusName.toLowerCase()}`);
                });
              }
            });
            if (docs.length > 0) {
              docsText = docs.join('\n');
            }
          } catch (e) {
            console.error('Error fetching stages for export', e);
          }
        }
        
        let finalExportObs = item.observacion ? item.observacion + '\n\n' : '';
        if (docsText) finalExportObs += docsText;
        
        return { 
          ...item, 
          exportObservacion: finalExportObs.trim(),
          fullProc: fetchedProc || item.rawProceso
        };
      }));

      const workbook = new ExcelJS.Workbook();

      // --- HOJA DE RESUMEN ---
      const summarySheet = workbook.addWorksheet('Resumen');
      summarySheet.columns = [
        { header: 'ESTADO', key: 'estado', width: 25 },
        { header: 'CANTIDAD', key: 'cantidad', width: 15 }
      ];
      
      const summaryHeader = summarySheet.getRow(1);
      summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
      summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '006064' } };
      summaryHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      
      let enCurso = 0;
      let terminados = 0;
      detailedData.forEach(item => {
        const state = item.estado.toUpperCase();
        if (state === 'TERMINADO' || state === 'COMPLETADA') {
          terminados++;
        } else if (state !== 'CANCELADA' && state !== 'CANCELADO') {
          enCurso++;
        }
      });
      
      summarySheet.addRow({ estado: 'En Curso', cantidad: enCurso });
      summarySheet.addRow({ estado: 'Terminados', cantidad: terminados });
      const totalRow = summarySheet.addRow({ estado: 'TOTAL', cantidad: enCurso + terminados });
      totalRow.font = { bold: true };
      
      summarySheet.eachRow(row => {
        row.eachCell(cell => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      // Generar Gráfica con QuickChart
      if (enCurso > 0 || terminados > 0) {
        try {
          const chartConfig = {
            type: 'pie',
            data: {
              labels: ['En Curso', 'Terminados'],
              datasets: [{
                data: [enCurso, terminados],
                backgroundColor: ['#FBC02D', '#2E7D32']
              }]
            },
            options: {
              plugins: {
                title: { display: true, text: 'Distribución de Estados' }
              }
            }
          };
          const response = await fetch('https://quickchart.io/chart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chart: chartConfig,
              width: 600,
              height: 300,
              backgroundColor: 'white'
            })
          });
          
          if (!response.ok) {
            throw new Error(`QuickChart devolvió estado ${response.status}`);
          }
          const imageBuffer = await response.arrayBuffer();
          
          const chartImageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png',
          });
          
          summarySheet.addImage(chartImageId, {
            tl: { col: 3, row: 1 }, // Columna D (índice 3), Fila 2 (índice 1)
            ext: { width: 600, height: 300 }
          });
        } catch (e) {
          console.error('Error al generar la gráfica para el Excel', e);
        }
      }

      // --- HOJA PRINCIPAL ---
      const worksheet = workbook.addWorksheet('Dashboard INVIMA');

      // Define columns to match Cencosud template
      const columns = [
        { header: 'FECHA', key: 'fecha', width: 15 },
        { header: 'FECHA RADICACIÓN', key: 'fecha_radicacion', width: 20 },
        { header: 'PRODUCTO', key: 'producto', width: 30 },
        { header: 'TITULAR', key: 'titular', width: 25 },
        { header: 'TRÁMITE', key: 'tramite', width: 25 },
        { header: 'OBSERVACIONES', key: 'observaciones', width: 60 },
        { header: 'TAREA REALIZADA', key: 'tarea', width: 30 },
        { header: 'ESTADO DEL TRÁMITE', key: 'estado', width: 20 },
        { header: 'PRIORIDAD', key: 'prioridad', width: 15 },
        { header: 'COMERCIAL', key: 'comercial', width: 20 },
        { header: 'RESPONSABLE', key: 'responsable', width: 20 },
        { header: 'PORCENTAJE CUMPLIMIENTO', key: 'progreso', width: 25 },
        { header: 'DÍAS TRASCURRIDOS', key: 'dias', width: 20 },
        { header: 'ALERTA SEMAF', key: 'alerta', width: 15 },
      ];

      worksheet.columns = columns;

      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      
      headerRow.eachCell((cell, colNumber) => {
        let bgColor = '006064'; // Dark Teal
        if (colNumber === 13) bgColor = '1A237E'; // Dark Blue for DÍAS TRASCURRIDOS
        if (colNumber === 14) bgColor = 'B71C1C'; // Red for ALERTA SEMAF

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.font = {
          color: { argb: 'FFFFFF' },
          bold: true,
          size: 10
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data
      detailedData.forEach(item => {
        const fechaInicio = new Date(item.fechaInicioBPM);
        const hoy = new Date();
        const diasTrascurridos = Math.floor((hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
        
        // Alerta semáforo logic
        let alerta = 'VERDE';
        if (diasTrascurridos > 15) alerta = 'ROJO';
        else if (diasTrascurridos > 7) alerta = 'AMARILLO';

        const rowData = {
          fecha: item.fechaEntrada,
          fecha_radicacion: (() => {
            const rawDate = item.fullProc?.fechaFin || 
                           item.fullProc?.fechaTerminacion || 
                           (item.estado === ('TERMINADO' as any) ? item.fullProc?.updatedAt : null);
            if (rawDate) return formatCO(rawDate);
            return item.fechaTerminacion || '';
          })(),
          producto: item.nombreTramite,
          titular: item.titular,
          tramite: item.etapa,
          observaciones: item.exportObservacion,
          tarea: item.tipoTramite,
          estado: item.estado.replace(/_/g, ' '),
          prioridad: item.rawProceso?.prioridad || item.grupo || '',
          comercial: item.asignacion,
          responsable: item.ingeniero,
          progreso: `${item.progress}%`,
          dias: diasTrascurridos > 0 ? diasTrascurridos : 0,
          alerta: alerta
        };

        const row = worksheet.addRow(rowData);
        
        // Basic row styling
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: colNumber === 6 }; // wrapText for observaciones
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Specific styling for Alerta
        const alertaCell = row.getCell(14);
        if (alerta === 'ROJO') {
          alertaCell.font = { color: { argb: 'B71C1C' }, bold: true };
        } else if (alerta === 'AMARILLO') {
          alertaCell.font = { color: { argb: 'FBC02D' }, bold: true };
        } else {
          alertaCell.font = { color: { argb: '2E7D32' }, bold: true };
        }
      });

      // Generate Buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reporte_INVIMA_Cencosud_${new Date().toISOString().split('T')[0]}.xlsx`);

      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 3000);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Hubo un error al generar el reporte Excel');
    }
  };

  const StatusBadge = ({ status, className = "" }: { status: InvimaStatus, className?: string }) => (
    <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap ${getStatusColor(status)} ${className}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );

  return (
    <DashboardLayout>
      <div className="relative p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC]">
        
        {/* Toast Notification */}
        {showExportToast && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-semibold text-sm">Reporte exportado exitosamente.</span>
          </div>
        )}

        {/* HEADER & KPI DASHBOARD */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-600 p-2.5 rounded-xl shadow-sm shadow-blue-200">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    Portal INVIMA
                  </h1>
              </div>
              <p className="text-gray-500 font-medium text-sm md:text-base">
                Centro de control y trazabilidad de registros sanitarios en tiempo real.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
               <button onClick={handleExport} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Exportar
               </button>
               {canManageProcess && (
                 <button onClick={() => setShowNewTramiteModal(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                     Nuevo Trámite
                 </button>
               )}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-xl text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Total Trámites</p>
                <p className="text-2xl font-black text-gray-900">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">En Revisión / Proceso</p>
                <p className="text-2xl font-black text-gray-900">{stats.revision}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Aprobados</p>
                <p className="text-2xl font-black text-gray-900">{stats.aprobados}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN: PRODUCT LIST */}
          <div className={`w-full lg:w-1/3 xl:w-[30%] flex flex-col gap-4 ${!isMobileListVisible ? 'hidden lg:flex' : 'flex'}`}>
             
             {/* List Header & Filters */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar por producto, titular o radicado..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {['TODOS', 'EN_REVISION', 'APROBADO'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filterStatus === status ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
             </div>

             {/* List Items */}
             <div className="flex flex-col gap-3 h-[calc(100vh-320px)] overflow-y-auto pr-2 pb-10">
               {filteredData.length === 0 ? (
                 <div className="text-center py-10 text-gray-500">No se encontraron resultados</div>
               ) : (
                 filteredData.map(product => (
                   <div 
                     key={product.id}
                     onClick={() => {
                         setSelectedProduct(product);
                         setIsMobileListVisible(false);
                         setActiveTab('RESUMEN');
                     }}
                     className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedProduct?.id === product.id ? 'border-blue-500 bg-blue-50/40 shadow-md transform scale-[1.01]' : 'border-transparent bg-white shadow-sm hover:border-gray-200 hover:shadow-md'}`}
                   >
                     <div className="flex justify-between items-start mb-2.5">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider line-clamp-1 pr-2 bg-gray-100 px-2 py-1 rounded">{product.titular}</span>
                       <StatusBadge status={product.estado} />
                     </div>
                     <h3 className="font-bold text-gray-900 mb-2 leading-snug line-clamp-2 text-sm">{product.nombreTramite}</h3>
                     <div className="flex justify-between items-center text-[11px] text-gray-500 mb-3">
                       <span className="flex items-center gap-1 font-medium"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>{product.grupo}</span>
                       <span className="flex items-center gap-1 font-medium"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{product.ingeniero.split(' ')[0]}</span>
                     </div>
                     
                     <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                       <div className={`h-1.5 rounded-full transition-all duration-1000 ${product.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${product.progress}%` }}></div>
                     </div>
                     <div className="flex justify-between items-center mt-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Radicado: <span className="text-gray-700">{product.radicadoSeguimiento || 'Pendiente'}</span></p>
                       <span className="text-[10px] font-bold text-gray-400">{product.progress}%</span>
                     </div>
                   </div>
                 ))
               )}

               {/* Pagination Controls */}
               {paginationMeta && paginationMeta.totalPages > 1 && (
                 <div className="flex items-center justify-between mt-4 px-2 py-2 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0">
                   <button
                     disabled={!paginationMeta.hasPreviousPage}
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     className={`p-2 rounded-lg transition-all ${!paginationMeta.hasPreviousPage ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                   </button>
                   <span className="text-xs font-bold text-gray-500">
                     Pág <span className="text-gray-900">{paginationMeta.page}</span> de <span className="text-gray-900">{paginationMeta.totalPages}</span>
                   </span>
                   <button
                     disabled={!paginationMeta.hasNextPage}
                     onClick={() => setCurrentPage(prev => Math.min(paginationMeta.totalPages, prev + 1))}
                     className={`p-2 rounded-lg transition-all ${!paginationMeta.hasNextPage ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                   </button>
                 </div>
               )}
             </div>
          </div>

          {/* RIGHT COLUMN: DETAILS */}
          <div className={`w-full lg:w-2/3 xl:w-[70%] flex flex-col ${isMobileListVisible ? 'hidden lg:flex' : 'flex'}`}>
             
             {/* Mobile Back Button */}
             <button 
                onClick={() => setIsMobileListVisible(true)}
                className="lg:hidden mb-4 flex items-center gap-2 text-gray-600 font-bold bg-white border border-gray-200 py-2.5 px-4 rounded-xl w-fit shadow-sm"
             >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 Volver al listado
             </button>

             {!selectedProduct ? (
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-full min-h-[400px]">
                 <div className="bg-gray-100 p-4 rounded-full mb-4">
                   <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <p className="text-gray-500 font-bold">Seleccione un trámite para ver detalles</p>
                 {isLoadingDashboard && <p className="text-xs text-blue-500 mt-2 animate-pulse">Cargando trámites...</p>}
               </div>
             ) : (
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[calc(100vh-200px)]">
                 
                 {/* Product Header */}
                 <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-start mb-6 gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={selectedProduct.estado} className="text-sm px-3 py-1" />
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                {selectedProduct.grupo}
                              </span>
                              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                {formatAsignacion(selectedProduct.asignacion)}
                              </span>
                            </div>
                            {(role === 'admin' || role === 'administrador') && (
                              <button
                                onClick={handleDeleteTramite}
                                disabled={isDeletingTramite}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200 transition-colors disabled:opacity-50"
                                title="Eliminar Trámite"
                              >
                                {isDeletingTramite ? (
                                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="30" strokeLinecap="round" className="opacity-25" /><path d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                )}
                                {isDeletingTramite ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            )}
                          </div>
                          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">{selectedProduct.nombreTramite}</h2>
                          <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Titular: <span className="font-bold text-gray-700">{selectedProduct.titular}</span>
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 shrink-0 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avance Global</p>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-black text-gray-900">{selectedProduct.progress}%</div>
                            <svg className="w-8 h-8 text-blue-500" viewBox="0 0 36 36">
                              <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className={`${selectedProduct.progress === 100 ? 'text-emerald-500' : 'text-blue-500'}`} strokeDasharray={`${selectedProduct.progress}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                          </div>
                        </div>
                    </div>

                    {/* Alerta de Descripción y Observación General */}
                    {(selectedProduct.descripcion || selectedProduct.observacion) && (
                        <div className={`p-4 rounded-xl border ${selectedProduct.estado === 'OBSERVACIONES' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-gray-50 border-gray-200 text-gray-700'} flex gap-3 items-start`}>
                            <svg className={`w-5 h-5 mt-0.5 shrink-0 ${selectedProduct.estado === 'OBSERVACIONES' ? 'text-amber-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                {selectedProduct.descripcion && (
                                  <div className="mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Descripción de la Solicitud</h4>
                                    <p className="text-sm font-medium leading-relaxed">{selectedProduct.descripcion}</p>
                                  </div>
                                )}
                                {selectedProduct.observacion && (
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Estado / Observación</h4>
                                    <p className="text-sm font-medium leading-relaxed">{selectedProduct.observacion}</p>
                                  </div>
                                )}
                            </div>
                            {selectedProduct.estado === 'OBSERVACIONES' && canManageProcess && (
                              <button onClick={() => setShowResponderAutoModal(true)} className="ml-auto shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm">
                                Responder Auto
                              </button>
                            )}
                        </div>
                    )}
                 </div>

                 {/* TABS NAVIGATION */}
                 <div className="flex border-b border-gray-100 bg-white px-6">
                   {[
                     { id: 'RESUMEN', label: 'Resumen General', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                     { id: 'ETAPAS', label: 'Etapas del Trámite', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                     { id: 'DOCUMENTOS', label: `Documentos (${procesoEtapas.reduce((acc, pe) => acc + (pe.documentosSubidos?.length || 0), 0)})`, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                     { id: 'HISTORIAL', label: 'Historial', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
                   ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                       {tab.label}
                     </button>
                   ))}
                 </div>

                 {/* TAB CONTENT */}
                 <div className="p-6 md:p-8 flex-1 bg-white overflow-y-auto">
                   
                   {/* TAB: RESUMEN */}
                   {activeTab === 'RESUMEN' && (
                     <div className="max-w-4xl">
                       
                       {/* Metadata Grid */}
                       <div>
                         {selectedProduct.estado === 'OBSERVACIONES' && selectedProduct.diasVencimiento && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-pulse">
                               <div className="bg-red-100 p-2.5 rounded-full shrink-0">
                                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                               <div>
                                  <h4 className="font-black text-red-900 text-sm">Alerta de Vencimiento de Términos Legales</h4>
                                  <p className="text-red-700 text-xs mt-1 font-medium">El INVIMA ha emitido un auto de requerimiento. El plazo legal para responder sin entrar en abandono vence en <strong>{selectedProduct.diasVencimiento} días</strong>.</p>
                               </div>
                            </div>
                         )}

                         <h3 className="text-base font-black text-gray-900 mb-5 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             Información del Trámite
                           </div>
                           {canManageProcess && !['TERMINADO', 'APROBADO', 'COMPLETADA'].includes(String(selectedProceso?.estado || selectedProduct?.estado).toUpperCase()) && (
                             <button
                               onClick={() => {
                                 setDetallesForm({
                                   codigo: selectedProceso?.codigo?.startsWith('Pendiente por asignar') ? '' : (selectedProceso?.codigo || ''),
                                   llave: selectedProceso?.llave?.startsWith('Pendiente por asignar') ? '' : (selectedProceso?.llave || selectedProduct.llave || ''),
                                   radicadoInicio: selectedProceso?.radicadoInicio?.startsWith('Pendiente por asignar') ? '' : (selectedProceso?.radicadoInicio || selectedProduct.radicadoSeguimiento || '')
                                 });
                                 setIsEditingDetalles(true);
                               }}
                               className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                             >
                               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                               Editar Detalles
                             </button>
                           )}
                         </h3>
                         <div className="grid grid-cols-2 gap-x-6 gap-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                             <div className="col-span-2 flex flex-wrap gap-3 mb-2 border-b border-gray-200 pb-5 w-full">
                                 <div className="flex items-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex-1 md:flex-none">
                                     <div className="bg-gray-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-600 border-r border-gray-200 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg> ID</div>
                                     <div className="px-4 py-2 text-sm font-black font-mono tracking-widest text-gray-900 bg-gray-50/50">
                                       {selectedProceso?.codigo?.startsWith('Pendiente por asignar') ? 'Pendiente por asignar' : (selectedProceso?.codigo || 'N/A')}
                                     </div>
                                 </div>
                                 <div className="flex items-center rounded-lg border border-blue-200 bg-white shadow-sm overflow-hidden flex-1 md:flex-none">
                                     <div className="bg-blue-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 border-r border-blue-200 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> RADICADO</div>
                                     <div className="px-4 py-2 text-sm font-black font-mono tracking-widest text-blue-900 bg-blue-50/30">
                                       {(selectedProceso?.radicadoInicio?.startsWith('Pendiente por asignar') || selectedProduct.radicadoSeguimiento?.startsWith('Pendiente por asignar')) ? 'Pendiente por asignar' : (selectedProceso?.radicadoInicio || selectedProduct.radicadoSeguimiento || 'PENDIENTE')}
                                     </div>
                                 </div>
                                 <div className="flex items-center rounded-lg border border-emerald-200 bg-white shadow-sm overflow-hidden flex-1 md:flex-none">
                                     <div className="bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border-r border-emerald-200 flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> LLAVE</div>
                                     <div className="px-4 py-2 text-sm font-black font-mono tracking-widest text-emerald-900 bg-emerald-50/30">
                                       {(selectedProceso?.llave?.startsWith('Pendiente por asignar') || selectedProduct.llave?.startsWith('Pendiente por asignar')) ? 'Pendiente por asignar' : (selectedProceso?.llave || selectedProduct.llave || 'PENDIENTE')}
                                     </div>
                                 </div>
                             </div>
                            <div className="space-y-1.5 group relative">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ingeniero Asignado</p>
                                
                                {isChangingEngineer ? (
                                  <div className="mt-2 flex flex-col gap-2">
                                    <select
                                      value={newEngineerId}
                                      onChange={(e) => setNewEngineerId(e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                      <option value="" disabled>Seleccione un ingeniero...</option>
                                      {engineersList.map(eng => (
                                        <option key={eng.id} value={eng.id}>
                                          {eng.user?.first_name} {eng.user?.last_name}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={async () => {
                                          if (!newEngineerId || newEngineerId === selectedProduct.rawProceso?.ingenieroId) {
                                            setIsChangingEngineer(false);
                                            return;
                                          }
                                          setIsUpdatingEngineer(true);
                                          try {
                                            await solicitudService.updateSolicitud(selectedProduct.id, { ingenieroId: newEngineerId });
                                            const eng = engineersList.find(e => e.id === newEngineerId);
                                            const engName = eng ? `${eng.user?.first_name} ${eng.user?.last_name}` : newEngineerId;
                                            
                                            try {
                                              await observacionService.createObservacion({
                                                procesoId: selectedProduct.rawProceso?.id || selectedProduct.id,
                                                contenido: `Se cambió el ingeniero asignado a: ${engName}`
                                              });
                                            } catch (e) {}
                                            
                                            // Optimistic update
                                            setSelectedProduct((prev: any) => prev ? { ...prev, ingeniero: engName, rawProceso: { ...prev.rawProceso, ingenieroId: newEngineerId } } : prev);
                                            setDashboardSolicitudes(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, ingeniero: engName, rawProceso: { ...p.rawProceso, ingenieroId: newEngineerId } } : p));
                                            
                                            setIsChangingEngineer(false);
                                          } catch (error: any) {
                                            alert('Error al cambiar ingeniero: ' + error.message);
                                          } finally {
                                            setIsUpdatingEngineer(false);
                                          }
                                        }}
                                        disabled={isUpdatingEngineer || !newEngineerId}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {isUpdatingEngineer ? 'Guardando...' : 'Guardar'}
                                      </button>
                                      <button
                                        onClick={() => setIsChangingEngineer(false)}
                                        disabled={isUpdatingEngineer}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between mt-0.5">
                                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{selectedProduct.ingeniero.charAt(0)}</span>
                                      {selectedProduct.ingeniero}
                                    </p>
                                    {(role === 'admin' || role === 'administrador') && (
                                      <button
                                        onClick={() => {
                                          setNewEngineerId(selectedProduct.rawProceso?.ingenieroId || '');
                                          setIsChangingEngineer(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                                        title="Cambiar ingeniero"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipo de Trámite</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatText(selectedProceso?.tramiteBase?.nombre || selectedProduct.tipoTramite)}
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asignación</p>
                                <p className="text-sm font-semibold text-gray-900">{formatAsignacion(selectedProduct.asignacion)}</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Idioma de Soportes</p>
                                 <p className="text-sm font-semibold text-gray-900">
                                   {formatText(selectedProduct.idioma)}
                                 </p>
                            </div>
                            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2 grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ingreso BPM</p>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1"><svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" /></svg>{selectedProduct.fechaEntrada}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inicio Trabajo</p>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" /></svg>
                                      {selectedProceso?.createdAt ? new Date(selectedProceso.createdAt).toISOString().split('T')[0] : selectedProduct.fechaInicioBPM}
                                    </p>
                                </div>
                                 <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Terminación</p>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1"><svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" /></svg>
                                      {(() => {
                                        const finalDate = selectedProceso?.fechaFin || selectedProceso?.fechaTerminacion;
                                        if (finalDate) return formatCO(finalDate);
                                        return selectedProduct.fechaTerminacion || 'En proceso';
                                      })()}
                                    </p>
                                </div>
                             
                             {selectedProduct.observacion && (
                               <div className="col-span-3 mt-4 pt-4 border-t border-gray-200">
                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones Iniciales de la Solicitud</p>
                                 <div className="p-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-700 italic">
                                   "{selectedProduct.observacion}"
                                 </div>
                               </div>
                             )}
                            </div>
                         </div>
                       </div>
                     </div>
                   )}

                    {/* TAB: ETAPAS */}
                    {activeTab === 'ETAPAS' && (() => {
                      const ETAPAS_ORDER = [
                        'SOLICITUD INICIO DE TRÁMITE',
                        'INICIO DE TRÁMITE PROVEEDOR',
                        'VERIFICACIÓN DOCUMENTAL',
                        'ELABORACIÓN DE FORMULARIOS',
                        'ELABORACIÓN ANTICIPO',
                        'REVISIÓN / APROBACIÓN FORMULARIOS',
                        'PAGO ANTICIPO',
                        'RADICADO INVIMA',
                        'TIEMPO DE RESPUESTA RESOLUCIÓN INVMAGIL',
                        'ENVÍO INFORME RESOLUCIÓN'
                      ];

                      const getEtapaIndex = (etapa: any) => {
                        const name = (etapa.etapaNombre || etapa.etapa?.nombre || etapa.nombre || '').toUpperCase().trim();
                        const foundIndex = ETAPAS_ORDER.findIndex(o => name.includes(o) || o.includes(name));
                        if (foundIndex !== -1) return foundIndex;
                        // Fallbacks
                        if (name.includes('SOLICITUD INICIO')) return 0;
                        if (name.includes('INICIO DE TRÁMITE PROVEEDOR')) return 1;
                        if (name.includes('VERIFICACI')) return 2;
                        if (name.includes('ELABORACIÓN DE FORM')) return 3;
                        if (name.includes('ELABORACIÓN ANTICIPO')) return 4;
                        if (name.includes('REVISIÓN')) return 5;
                        if (name.includes('PAGO')) return 6;
                        if (name.includes('RADICADO')) return 7;
                        if (name.includes('TIEMPO DE RESPUESTA')) return 8;
                        if (name.includes('ENVÍO INFORME')) return 9;
                        return 999;
                      };

                      const sortedEtapas = [...(selectedProceso?.etapas || [])].sort((a: any, b: any) => getEtapaIndex(a) - getEtapaIndex(b));

                      return (
                        <div className="max-w-3xl">
                          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                            {sortedEtapas.length > 0 ? (
                              sortedEtapas.map((etapa: any, idx: number) => {
                                const isCompleted = etapa.estado === 'COMPLETADA';
                                const isInProgress = etapa.estado === 'EN_PROGRESO';
                                
                                // La etapa "siguiente" es la primera que no esté completada
                                const isNext = !isCompleted && (idx === 0 || sortedEtapas[idx-1].estado === 'COMPLETADA');
                                
                                return (
                                <div key={idx} className={`relative pl-8 transition-all duration-500 ${isInProgress || isNext ? 'scale-[1.02]' : ''}`}>
                                  {/* Dot indicator */}
                                  <div className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 shadow-sm z-10 flex items-center justify-center transition-all duration-500
                                    ${isCompleted ? 'bg-emerald-500 border-white ring-4 ring-emerald-50' : 
                                      isInProgress ? 'bg-amber-500 border-white ring-4 ring-amber-100 animate-pulse' : 
                                      isNext ? 'bg-blue-600 border-white ring-4 ring-blue-100' : 
                                      'bg-gray-200 border-white'}
                                  `}>
                                    {isCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </div>

                                  <div className={`p-5 rounded-2xl border transition-all duration-300 shadow-sm
                                    ${isCompleted ? 'bg-emerald-50/30 border-emerald-100' : 
                                      isInProgress ? 'bg-amber-50/30 border-amber-200 ring-1 ring-amber-100 shadow-amber-100/50 shadow-lg' :
                                      isNext ? 'bg-white border-blue-200 ring-1 ring-blue-50' : 
                                      'bg-white border-gray-100 opacity-60'}
                                  `}>
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                           <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded
                                             ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 
                                               isInProgress ? 'bg-amber-500 text-white shadow-sm' :
                                               isNext ? 'bg-blue-600 text-white shadow-sm' : 
                                               'bg-gray-100 text-gray-500'}
                                           `}>
                                             Etapa {idx + 1}
                                           </span>
                                           {isInProgress && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>}
                                        </div>
                                        <h4 className={`font-black text-sm tracking-tight ${isCompleted ? 'text-emerald-900' : isInProgress ? 'text-amber-900' : isNext ? 'text-blue-900' : 'text-gray-400'}`}>
                                          {formatText(etapa.etapaNombre || etapa.etapa?.nombre || etapa.nombre || 'Etapa del Proceso')}
                                        </h4>
                                      </div>
                                      
                                      {isCompleted ? (
                                        <div className="text-right flex flex-col items-end">
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1">Completada</span>
                                          <p className="text-[11px] font-bold text-gray-400">{etapa.updatedAt ? new Date(etapa.updatedAt).toLocaleDateString() : ''}</p>
                                        </div>
                                      ) : isInProgress ? (
                                        <div className="text-right">
                                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider animate-pulse">En progreso</span>
                                        </div>
                                      ) : (
                                        <div className="text-right">
                                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider">Pendiente</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <p className={`text-xs leading-relaxed ${isCompleted ? 'text-emerald-800/70' : isInProgress ? 'text-amber-800/80' : isNext ? 'text-blue-800/80' : 'text-gray-400'}`}>
                                      {etapa.comentario || (isCompleted ? 'Esta etapa ha sido verificada y aprobada satisfactoriamente.' : isInProgress ? 'Se encuentra actualmente en gestión por el equipo encargado.' : 'Etapa pendiente por iniciar.')}
                                    </p>

                                    {/* Notas de la Etapa */}
                                    <div className="mt-4 pt-4 border-t border-gray-100/60">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Notas de la Etapa</p>
                                      <textarea
                                        value={notasEdicion[etapa.id] !== undefined ? notasEdicion[etapa.id] : (etapa.notas || '')}
                                        onChange={(e) => setNotasEdicion({ ...notasEdicion, [etapa.id]: e.target.value })}
                                        placeholder="Escribe alguna observación específica para esta etapa..."
                                        className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[60px] resize-y transition-all"
                                      />
                                      <div className="flex justify-end mt-2">
                                        <button
                                          onClick={() => handleSaveNotas(etapa.id, notasEdicion[etapa.id] !== undefined ? notasEdicion[etapa.id] : (etapa.notas || ''))}
                                          disabled={guardandoNotas[etapa.id] || (notasEdicion[etapa.id] === undefined && !etapa.notas) || (notasEdicion[etapa.id] === etapa.notas) || (notasEdicion[etapa.id] === '' && !etapa.notas)}
                                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5
                                            ${guardandoNotas[etapa.id] ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                        >
                                          {guardandoNotas[etapa.id] ? (
                                            <>
                                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                              Guardando...
                                            </>
                                          ) : (
                                            <>
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                              Guardar Nota
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Checklist de documentos para VERIFICACIÓN DOCUMENTAL */}
                                    {(etapa.etapaNombre || etapa.etapa?.nombre || etapa.nombre || '').toUpperCase().includes('VERIFICACI') && (() => {
                                      const verifEtapa = procesoEtapas.find((pe: any) => pe.etapa?.nombre === 'VERIFICACIÓN DOCUMENTAL');
                                      const docsVer: any[] = verifEtapa?.documentosSubidos || [];
                                      const DOC_TYPES_VER = [
                                        { key: 'CVL', label: 'CVL' },
                                        { key: 'FICHAS_TECNICAS', label: 'Fichas Técnicas' },
                                        { key: 'PROCESO_ELABORACION', label: 'Proceso de Elaboración' },
                                        { key: 'AUTORIZACION_AL_PORTADOR', label: 'Autorización al Portador' },
                                        { key: 'AUTORIZACION_AL_TRAMITADOR', label: 'Autorización al Tramitador' },
                                        { key: 'ETIQUETAS', label: 'Etiquetas' },
                                        { key: 'ANALISIS_DE_LABORATORIO', label: 'Análisis de Laboratorio' },
                                        { key: 'REGISTRO_DE_MARCA', label: 'Registro de Marca' },
                                        { key: 'CERTIFICADO_DE_BPM', label: 'Certificado de BPM' },
                                        { key: 'OTRO', label: 'Otro' },
                                      ];
                                      const reqDocsEvent = [...(selectedProduct?.history || [])].reverse().find((e: any) => e.detail.includes('|REQ_DOCS:'));
                                      const savedReqDocs = reqDocsEvent ? (reqDocsEvent.detail.match(/\|REQ_DOCS:(.*?)\|/)?.[1].split(',') || []) : DOC_TYPES_VER.map(d=>d.key);
                                      const isPendingVerif = etapa.estado === 'PENDIENTE';
                                      const isEditableVerif = etapa.estado === 'PENDIENTE' || etapa.estado === 'EN_PROGRESO';
                                      const currentReqDocs = isEditableVerif ? (editingDocsMap[selectedProduct!.id] || savedReqDocs) : savedReqDocs;
                                      const hasPendingReqDocsChanges = etapa.estado === 'EN_PROGRESO' && editingDocsMap[selectedProduct!.id] !== undefined;

                                      const toggleDoc = (key: string) => {
                                        if (!isEditableVerif || !canManageProcess) return;
                                        const hasDoc = docsVer.some((d: any) => d.documentType === key);
                                        if (hasDoc) return; // no se puede quitar un requisito que ya tiene documento vinculado
                                        const current = editingDocsMap[selectedProduct!.id] || savedReqDocs;
                                        if (current.includes(key)) {
                                          setEditingDocsMap(prev => ({ ...prev, [selectedProduct!.id]: current.filter(k => k !== key) }));
                                        } else {
                                          setEditingDocsMap(prev => ({ ...prev, [selectedProduct!.id]: [...current, key] }));
                                        }
                                      };

                                      return (
                                        <div className="mt-4 pt-4 border-t border-gray-100/60">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Documentos Requeridos {isEditableVerif && <span className="text-amber-500">(Selecciona los que aplican)</span>}</p>
                                          <div className="space-y-1.5">
                                            {DOC_TYPES_VER.map(({ key, label }) => {
                                              const matching = docsVer.filter((d: any) => d.documentType === key);
                                              const hasDoc = matching.length > 0;
                                              const isRequired = currentReqDocs.includes(key);

                                              if (!isRequired && !isEditableVerif && !hasDoc) return null;

                                              const isLocked = isEditableVerif && hasDoc;

                                              return (
                                                <div
                                                  key={key}
                                                  className={`flex items-center justify-between gap-3 py-1 ${isEditableVerif && canManageProcess && !isLocked ? 'cursor-pointer hover:bg-gray-50 rounded px-1' : ''}`}
                                                  onClick={() => toggleDoc(key)}
                                                  title={isLocked ? 'Ya tiene un documento vinculado, no se puede quitar' : undefined}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    {isEditableVerif && canManageProcess ? (
                                                      <input type="checkbox" checked={isRequired} disabled={isLocked} readOnly className={`w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} />
                                                    ) : (
                                                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${hasDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'}`}>
                                                        {hasDoc
                                                          ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                          : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                                        }
                                                      </div>
                                                    )}
                                                    <span className={`text-xs font-semibold ${hasDoc || isRequired ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
                                                  </div>
                                                  <div className="flex flex-col items-end gap-1">
                                                    {hasDoc ? matching.map((doc: any) => {
                                                      const s = doc.status;
                                                      const cls = s === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' :
                                                                  s === 'RECHAZADO'   ? 'bg-red-100 text-red-700' :
                                                                  s === 'REQUIERE_CORRECCION' ? 'bg-red-100 text-red-700' :
                                                                  s === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
                                                      const statusLabel = (s: string) => ({ PENDIENTE: 'Solicitud', EN_REVISION: 'En Revisión', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', REQUIERE_CORRECCION: 'Requiere Corrección' }[s] ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
                                                      const lbl = statusLabel(s);
                                                      return <span key={doc.id} className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${cls}`}>{lbl}</span>;
                                                    }) : (
                                                      !isPendingVerif && isRequired ? <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-400 uppercase tracking-wide">Pendiente</span> : null
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          {hasPendingReqDocsChanges && canManageProcess && (
                                            <div className="mt-3 flex justify-end">
                                              <button
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  await saveReqDocs(currentReqDocs);
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all bg-amber-100 text-amber-700 hover:bg-amber-200"
                                              >
                                                Guardar Documentos Requeridos
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {!isCompleted && (() => {
                                      const etapaNombreStr = (etapa.etapaNombre || etapa.etapa?.nombre || etapa.nombre || '').toUpperCase();
                                      const isVerificacion = etapaNombreStr.includes('VERIFICACI');
                                      const isFormularios = etapaNombreStr.includes('FORMULARIO');
                                      const isResolucion = etapaNombreStr.includes('RESOLUCIÓN') || etapaNombreStr.includes('RESOLUCION');
                                      const isRadicado = etapaNombreStr.includes('RADICADO INVIMA');
                                      const isAnticipo = etapaNombreStr.includes('ANTICIPO');

                                      const verifEtapaData = isVerificacion ? procesoEtapas.find((pe: any) => pe.etapa?.nombre === 'VERIFICACIÓN DOCUMENTAL') : null;
                                      const docsVerif: any[] = verifEtapaData?.documentosSubidos || [];
                                      
                                      // Mandatory document types for verification
                                      const reqDocsEvent = [...(selectedProduct?.history || [])].reverse().find((e: any) => e.detail.includes('|REQ_DOCS:'));
                                      const mandatoryTypes = reqDocsEvent ? (reqDocsEvent.detail.match(/\|REQ_DOCS:(.*?)\|/)?.[1].split(',') || []) : ['CVL', 'FICHAS_TECNICAS', 'PROCESO_ELABORACION', 'AUTORIZACION_AL_PORTADOR', 'AUTORIZACION_AL_TRAMITADOR', 'ETIQUETAS', 'ANALISIS_DE_LABORATORIO', 'REGISTRO_DE_MARCA', 'CERTIFICADO_DE_BPM', 'OTRO'];
                                      
                                      const allMandatoryPresent = mandatoryTypes.every((type: string) => 
                                        docsVerif.some((d: any) => d.documentType === type)
                                      );
                                      const allApproved = docsVerif.length > 0 && docsVerif.every((d: any) => d.status === 'APROBADO');
                                      
                                      const canComplete = !isVerificacion || !isInProgress || (allMandatoryPresent && allApproved);

                                      return (
                                        <div className="mt-4 pt-4 border-t border-gray-100/60">
                                          {isVerificacion && isInProgress && !canComplete && (
                                            <p className="text-[10px] font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                                              {docsVerif.length === 0
                                                ? 'Debes subir al menos un documento antes de completar esta etapa.'
                                                : 'Todos los documentos deben estar verificados para completar esta etapa.'}
                                            </p>
                                          )}
                                          
                                          {canManageProcess && (
                                            <div className="flex flex-wrap items-center justify-end gap-3 mt-3">
                                              {isRadicado && isInProgress && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetallesForm({
                                                      codigo: selectedProceso?.codigo?.startsWith('Pendiente por asignar') ? '' : (selectedProceso?.codigo || 'N/A'),
                                                      llave: selectedProceso?.llave?.startsWith('Pendiente por asignar') ? '' : (selectedProceso?.llave || selectedProduct.llave || ''),
                                                      radicadoInicio: selectedProceso?.radicadoInicio?.startsWith('Pendiente por asignar') ? '' : (selectedProceso?.radicadoInicio || selectedProduct.radicadoSeguimiento || '')
                                                    });
                                                    setIsEditingDetalles(true);
                                                  }}
                                                  className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                >
                                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                  Ingresar Radicado y Llave
                                                </button>
                                              )}

                                              {(isFormularios || isResolucion || isAnticipo || isVerificacion) && isInProgress && canUploadDocuments && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTargetUploadEtapaId(etapa.id);
                                                    setTargetUploadEtapaNombre(etapaNombreStr);
                                                    setDocumentType(isVerificacion ? '' : 'OTRO');
                                                    setShowUploadModal(true);
                                                  }}
                                                  className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                                >
                                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                  Subir Documento
                                                </button>
                                              )}

                                              <button
                                                disabled={!canComplete}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateEtapaStatus(etapa.id, etapa.estado, etapa.etapaNombre || etapa.etapa?.nombre || etapa.nombre || 'Etapa del Proceso');
                                                }}
                                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2
                                                  ${!canComplete
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : isInProgress
                                                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100'
                                                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'}
                                                `}
                                              >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  {isInProgress ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                  ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                  )}
                                                </svg>
                                                {isInProgress ? 'Completar Etapa' : 'Iniciar Etapa'}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {isCompleted && canManageProcess && (() => {
                                      const procesoBloqueado = selectedProceso?.estado === 'TERMINADO' || selectedProceso?.estado === 'CANCELADO';
                                      return (
                                        <div className="mt-4 pt-4 border-t border-gray-100/60 flex justify-end">
                                          <button
                                            disabled={procesoBloqueado}
                                            title={procesoBloqueado ? 'No se puede reabrir: el trámite ya está finalizado/cancelado' : undefined}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!window.confirm('¿Reabrir esta etapa? Volverá a estado "En progreso" y se recalculará el avance del trámite.')) return;
                                              handleUpdateEtapaStatus(etapa.id, etapa.estado, etapa.etapaNombre || etapa.etapa?.nombre || etapa.nombre || 'Etapa del Proceso');
                                            }}
                                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2
                                              ${procesoBloqueado ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Reabrir Etapa
                                          </button>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-16 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                       <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              </div>
                              <p className="text-gray-500 font-bold italic text-sm">
                                {isLoadingProceso ? 'Sincronizando etapas con el servidor...' : 'No se han configurado etapas para este proceso.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                   {/* TAB: DOCUMENTOS */}
                   {activeTab === 'DOCUMENTOS' && (() => {
                      const todasLasEtapasConDocumentos = procesoEtapas.filter((pe: any) => pe.documentosSubidos && pe.documentosSubidos.length > 0);
                      const hayDocumentos = todasLasEtapasConDocumentos.length > 0;
                      return (
                        <div className="space-y-6">
                          {!hayDocumentos ? (
                            <div className="p-16 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </div>
                              <p className="text-gray-500 font-bold text-sm">No hay documentos subidos aún.</p>
                              <p className="text-gray-400 text-xs mt-1">Sube archivos directamente desde la pestaña de Etapas.</p>
                            </div>
                          ) : (
                            todasLasEtapasConDocumentos.map((pe: any) => {
                              const docsSubidos = pe.documentosSubidos || [];
                              const etapaNombre = pe.etapaNombre || pe.etapa?.nombre || pe.nombre || 'Etapa';
                              return (
                                <div key={pe.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <div>
                                      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{etapaNombre}</h3>
                                      <p className="text-gray-500 text-xs mt-0.5">{docsSubidos.length} archivo{docsSubidos.length !== 1 ? 's' : ''}</p>
                                    </div>
                                  </div>
                                  <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                      {docsSubidos.map((doc: any) => (
                                        <div key={doc.id} onClick={() => handleOpenReviewModal(doc)} className="flex flex-col p-4 border border-gray-200 rounded-2xl bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider
                                              ${doc.status === 'APROBADO' ? 'text-emerald-700 bg-emerald-100' :
                                                doc.status === 'EN_REVISION' ? 'text-blue-700 bg-blue-100' :
                                                (doc.status === 'RECHAZADO' || doc.status === 'REQUIERE_CORRECCION') ? 'text-red-700 bg-red-100' :
                                                'text-amber-700 bg-amber-100'}
                                            `}>
                                              {({ PENDIENTE: 'Solicitud', EN_REVISION: 'En Revisión', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', REQUIERE_CORRECCION: 'Requiere Corrección' } as Record<string,string>)[doc.status] ?? doc.status.replace(/_/g, ' ')}
                                            </span>
                                          </div>
                                          <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2" title={doc.displayName || doc.fileName}>{doc.displayName || doc.fileName}</h4>
                                          <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold border-t border-gray-100">
                                            <span className="text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded">{doc.documentType?.replace(/_/g, ' ').toLowerCase()}</span>
                                            <span className="text-gray-400">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })()}

                   {/* TAB: HISTORIAL */}
                   {activeTab === 'HISTORIAL' && (
                     <div className="max-w-3xl">
                       <p className="text-gray-500 text-sm mb-6">Registro detallado de todas las acciones, notificaciones y cambios de estado en este trámite.</p>
                       
                       <div className="space-y-4">
                         {(() => {
                           let historyList = selectedProduct.history.filter((e: any) => !e.detail.includes('|REQ_DOCS:'));
                           if (selectedProduct.observacion) {
                             const firstDate = historyList.length > 0 ? historyList[0].date : (selectedProduct.fechaEntrada || 'N/A 00:00');
                             const initialEvent = {
                               date: firstDate,
                               action: 'OBSERVACIÓN INICIAL (SOLICITUD)',
                               detail: selectedProduct.observacion,
                               user: selectedProduct.ingeniero || 'Sistema'
                             };
                             historyList = [initialEvent, ...historyList];
                           }
                           
                           return historyList.map((event: any, i: number, arr: any[]) => (
                             <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                               <div className="w-32 shrink-0 text-sm">
                                 <p className="font-bold text-gray-900">{event.date.split(' ')[0]}</p>
                                 <p className="text-xs text-gray-500 font-medium">{event.date.split(' ')[1]}</p>
                               </div>
                               <div className="w-10 flex flex-col items-center">
                                 <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1.5"></div>
                                 {i !== arr.length - 1 && <div className="w-px h-full bg-gray-200 mt-2"></div>}
                               </div>
                               <div className="pb-4">
                                 <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{event.action}</p>
                                 <p className="text-sm font-semibold text-gray-900 mb-1">{event.detail}</p>
                                 <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Por: {event.user}
                                 </p>
                               </div>
                             </div>
                           ));
                         })()}
                       </div>
                     </div>
                   )}

                 </div>
               </div>
             )}
          </div>
        </div>

        {/* MODALS OVERLAYS */}

        {/* Modal: Nuevo Trámite */}
        {showNewTramiteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-black text-gray-900">Crear Nuevo Trámite INVIMA</h3>
                <button onClick={() => setShowNewTramiteModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleProcesoSubmit} className="flex flex-col max-h-[80vh]">
                <div className="p-6 space-y-5 overflow-y-auto">
                  {procesoError && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                      {procesoError}
                    </div>
                  )}
                  {procesoSuccess && (
                    <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl border border-green-200">
                      {procesoSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Solicitud Asociada <span className="text-red-500">*</span></label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                        value={procesoForm.solicitudId}
                        onChange={(e) => setProcesoForm({...procesoForm, solicitudId: e.target.value})}
                      >
                        <option value="">Seleccione una solicitud...</option>
                        {solicitudes.map((sol) => (
                          <option key={sol.id || sol._id} value={sol.id || sol._id}>
                            {sol.titulo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Trámite Base <span className="text-red-500">*</span></label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                        value={procesoForm.tramiteBaseId}
                        onChange={(e) => setProcesoForm({...procesoForm, tramiteBaseId: e.target.value})}
                      >
                        <option value="">Seleccione el tipo de trámite...</option>
                        {tramitesBase.map((tb) => (
                          <option key={tb.id} value={tb.id}>
                            {tb.nombre} (V.{tb.version})
                          </option>
                        ))}
                      </select>
                    </div>

                    {etapasBase.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Etapas del Trámite <span className="text-red-500">*</span></label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-48 overflow-y-auto space-y-2">
                          {etapasBase.map((etapa) => (
                            <label key={etapa.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={procesoForm.etapasIds.includes(etapa.etapaId)}
                                onChange={() => handleEtapaToggle(etapa.etapaId)}
                              />
                              <span className="text-sm font-semibold text-gray-700">{etapa.etapaNombre}</span>
                            </label>
                          ))}
                        </div>
                        {procesoForm.etapasIds.length === 0 && (
                          <p className="text-xs text-red-500 mt-1 font-bold">Debes seleccionar al menos una etapa.</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Código <span className="text-gray-400 font-normal normal-case">(Opcional por ahora)</span></label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                        placeholder="Ej. COD-001" 
                        value={procesoForm.codigo}
                        onChange={(e) => setProcesoForm({...procesoForm, codigo: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Llave de Acceso <span className="text-gray-400 font-normal normal-case">(Opcional por ahora)</span></label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                        placeholder="Ej. A7B-9X2-LKJ" 
                        value={procesoForm.llave}
                        onChange={(e) => setProcesoForm({...procesoForm, llave: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Radicado de Inicio <span className="text-gray-400 font-normal normal-case">(Opcional por ahora)</span></label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                        placeholder="Ej. INV-2023-XXXXX" 
                        value={procesoForm.radicadoInicio}
                        onChange={(e) => setProcesoForm({...procesoForm, radicadoInicio: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">URL Radicado (Opcional)</label>
                      <input 
                        type="url" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                        placeholder="https://..." 
                        value={procesoForm.urlRadicado}
                        onChange={(e) => setProcesoForm({...procesoForm, urlRadicado: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 rounded-b-2xl mt-auto">
                  <button type="button" onClick={() => setShowNewTramiteModal(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={isCreatingProceso || (etapasBase.length > 0 && procesoForm.etapasIds.length === 0)} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50">
                    {isCreatingProceso ? 'Creando...' : 'Crear Trámite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Subir Documento */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
              <form onSubmit={handleUpload} className="flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Subir Documento</h3>
                  </div>
                  <button type="button" onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
                  {!verificacionEtapaId && !targetUploadEtapaId && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 text-amber-800 text-xs font-semibold">
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      No se detectó la etapa correcta para subir el documento. Asegúrate de que el trámite esté correctamente inicializado.
                    </div>
                  )}

                  {uploadFiles.length === 0 ? (
                    <>
                      {targetUploadEtapaNombre.includes('VERIFICACI') && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Categoría del Documento (Por defecto)</label>
                          <select
                            required
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                          >
                            <option value="" disabled>Seleccione una categoría...</option>
                            {(() => {
                              const reqDocsEvt = [...(selectedProduct?.history || [])].reverse().find((e: any) => e.detail.includes('|REQ_DOCS:'));
                              const allowedKeys = reqDocsEvt ? (reqDocsEvt.detail.match(/\|REQ_DOCS:(.*?)\|/)?.[1].split(',') || []) : ['CVL', 'FICHAS_TECNICAS', 'PROCESO_ELABORACION', 'AUTORIZACION_AL_PORTADOR', 'AUTORIZACION_AL_TRAMITADOR', 'ETIQUETAS', 'ANALISIS_DE_LABORATORIO', 'REGISTRO_DE_MARCA', 'CERTIFICADO_DE_BPM', 'OTRO'];
                              if (!allowedKeys.includes('OTRO')) allowedKeys.push('OTRO');

                              const DOC_OPTIONS = [
                                { key: 'CVL', label: 'CVL (Certificado Venta Libre)' },
                                { key: 'FICHAS_TECNICAS', label: 'Fichas Técnicas' },
                                { key: 'PROCESO_ELABORACION', label: 'Proceso de Elaboración' },
                                { key: 'AUTORIZACION_AL_PORTADOR', label: 'Autorización al Portador' },
                                { key: 'AUTORIZACION_AL_TRAMITADOR', label: 'Autorización al Tramitador' },
                                { key: 'ETIQUETAS', label: 'Etiquetas / Artes' },
                                { key: 'ANALISIS_DE_LABORATORIO', label: 'Análisis de Laboratorio' },
                                { key: 'REGISTRO_DE_MARCA', label: 'Registro de Marca' },
                                { key: 'CERTIFICADO_DE_BPM', label: 'Certificado de BPM' },
                                { key: 'OTRO', label: 'Otro' },
                              ];

                              return DOC_OPTIONS.filter(opt => allowedKeys.includes(opt.key)).map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                              ));
                            })()}
                          </select>
                        </div>
                      )}

                      <div
                        onClick={() => document.getElementById('file-upload-input')?.click()}
                        className="mt-2 border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <div className="bg-gray-100 group-hover:bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <p className="text-sm font-bold text-gray-700">Haz clic para seleccionar documentos</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1">Soporta PDF, Word, Excel, ZIP (Múltiples archivos)</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 rounded-xl">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div>
                          <p className="text-sm font-black text-emerald-800">
                            {uploadFiles.length} archivos seleccionados
                          </p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                            {(uploadFiles.reduce((acc, item) => acc + item.file.size, 0) / 1024 / 1024).toFixed(2)} MB total
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload-input')?.click()}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          Añadir más
                        </button>
                      </div>

                      {uploadFiles.map((item, index) => (
                        <div key={item.id} className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl space-y-3 relative group">
                          <button
                            type="button"
                            onClick={() => setUploadFiles(prev => prev.filter(f => f.id !== item.id))}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Remover archivo"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-800 truncate" title={item.file.name}>{item.file.name}</p>
                              <p className="text-[10px] text-gray-500 font-semibold">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>

                          <div className={`grid grid-cols-1 gap-3 ${targetUploadEtapaNombre.includes('VERIFICACI') ? 'md:grid-cols-2' : ''}`}>
                            {targetUploadEtapaNombre.includes('VERIFICACI') && (
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Categoría</label>
                                <select
                                  required
                                  value={item.documentType}
                                  onChange={(e) => {
                                    const newVal = e.target.value;
                                    setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, documentType: newVal } : f));
                                  }}
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                >
                                  {(() => {
                                    const reqDocsEvt = [...(selectedProduct?.history || [])].reverse().find((e: any) => e.detail.includes('|REQ_DOCS:'));
                                    const allowedKeys = reqDocsEvt ? (reqDocsEvt.detail.match(/\|REQ_DOCS:(.*?)\|/)?.[1].split(',') || []) : ['CVL', 'FICHAS_TECNICAS', 'PROCESO_ELABORACION', 'AUTORIZACION_AL_PORTADOR', 'AUTORIZACION_AL_TRAMITADOR', 'ETIQUETAS', 'ANALISIS_DE_LABORATORIO', 'REGISTRO_DE_MARCA', 'CERTIFICADO_DE_BPM', 'OTRO'];
                                    if (!allowedKeys.includes('OTRO')) allowedKeys.push('OTRO');

                                    const DOC_OPTIONS = [
                                      { key: 'CVL', label: 'CVL (Certificado Venta Libre)' },
                                      { key: 'FICHAS_TECNICAS', label: 'Fichas Técnicas' },
                                      { key: 'PROCESO_ELABORACION', label: 'Proceso de Elaboración' },
                                      { key: 'AUTORIZACION_AL_PORTADOR', label: 'Autorización al Portador' },
                                      { key: 'AUTORIZACION_AL_TRAMITADOR', label: 'Autorización al Tramitador' },
                                      { key: 'ETIQUETAS', label: 'Etiquetas / Artes' },
                                      { key: 'ANALISIS_DE_LABORATORIO', label: 'Análisis de Laboratorio' },
                                      { key: 'REGISTRO_DE_MARCA', label: 'Registro de Marca' },
                                      { key: 'CERTIFICADO_DE_BPM', label: 'Certificado de BPM' },
                                      { key: 'OTRO', label: 'Otro' },
                                    ];

                                    return DOC_OPTIONS.filter(opt => allowedKeys.includes(opt.key)).map(opt => (
                                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                                    ));
                                  })()}
                                </select>
                              </div>
                            )}
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">Nombre en Pantalla</label>
                              <input 
                                type="text" 
                                value={item.displayName}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, displayName: newVal } : f));
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-xs font-semibold placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                                placeholder="Ej. Ficha Técnica PDF" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <input 
                    id="file-upload-input"
                    type="file" 
                    multiple
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const filesArray = Array.from(e.target.files);
                        
                        // Map each selected file into our new object format
                        const newUploadItems = filesArray.map(file => ({
                          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
                          file,
                          documentType: documentType || 'OTRO', // Use the selected default category
                          displayName: filesArray.length === 1 ? (displayName || file.name) : file.name // Auto-fill display name
                        }));

                        setUploadFiles(prev => [...prev, ...newUploadItems]);
                        
                        // Reset the input value so the same file can be selected again if needed
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                      setDisplayName('');
                      setTargetUploadEtapaId(null);
                      setTargetUploadEtapaNombre('');
                    }} 
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading || uploadFiles.length === 0 || (!verificacionEtapaId && !targetUploadEtapaId)}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Subir Documento
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Responder Auto */}
        {showResponderAutoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Responder Auto / Notificación</h3>
                <button onClick={() => setShowResponderAutoModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-6">Esta función permitirá responder oficialmente al auto o requerimiento con los archivos técnicos requeridos.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowResponderAutoModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    Cerrar
                  </button>
                  <button className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors opacity-50 cursor-not-allowed">
                    Responder (Pronto)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Revisar Documento */}
        {selectedReviewDoc && (() => {
          const isOfficeDoc = [
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].includes(selectedReviewDoc.mimeType) || /\.(docx?|xlsx?)$/i.test(selectedReviewDoc.fileName || selectedReviewDoc.displayName || '');

          const isImage = (selectedReviewDoc.mimeType && selectedReviewDoc.mimeType.startsWith('image/')) ||
                          /\.(png|jpe?g|gif|webp)$/i.test(selectedReviewDoc.fileName || selectedReviewDoc.displayName || '');

          const previewUrl = selectedReviewPreviewUrl ? (isOfficeDoc ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(selectedReviewPreviewUrl)}` : selectedReviewPreviewUrl) : null;

          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shadow-sm border border-blue-200">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 leading-tight">Revisar Documento</h3>
                      <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">Gestión de estado del archivo</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedReviewDoc(null)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-gray-200 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Left Side: Preview Pane */}
                  <div className="w-2/3 bg-gray-100/50 border-r border-gray-200 p-4 flex flex-col min-h-0">
                    <div className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm flex relative">
                      {isLoadingPreview ? (
                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 gap-3">
                           <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                           <p className="font-semibold text-sm">Cargando visualizador...</p>
                        </div>
                      ) : !previewUrl ? (
                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 gap-3">
                          <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <p className="font-semibold text-sm">Este documento no tiene URL de archivo disponible para previsualizar.</p>
                        </div>
                      ) : isImage ? (
                        <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-gray-50">
                          <img src={previewUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-md shadow-sm" />
                        </div>
                      ) : (
                        <iframe src={previewUrl} className="w-full h-full" title="Document Preview" />
                      )}
                    </div>
                  </div>

                  {/* Right Side: Details & Actions */}
                  <div className="w-1/3 flex flex-col min-h-0 overflow-y-auto bg-white">
                    <div className="p-6 flex flex-col gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nombre del Archivo</p>
                          <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100 break-all leading-tight">
                            {selectedReviewDoc.displayName || selectedReviewDoc.fileName}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tipo Documental</p>
                            <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100 capitalize">
                              {selectedReviewDoc.documentType?.replace(/_/g, ' ').toLowerCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Fecha Subida</p>
                            <p className="text-sm font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              {selectedReviewDoc.createdAt ? new Date(selectedReviewDoc.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(canReviewDocuments || canUploadDocuments) && (
                        <div className="space-y-3 pt-6 border-t border-gray-100 mt-auto">
                          {canReviewDocuments && (
                            <>
                              <p className="text-[10px] font-black text-gray-700 text-center uppercase tracking-widest mb-3">Acciones de Revisión</p>
                              <div className="grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => handleUpdateDocumentStatus('APROBADO')}
                                  disabled={isUpdatingDocStatus || selectedReviewDoc.status === 'APROBADO'}
                                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                                >
                                  <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Aprobar</span>
                                </button>
                                
                                <button 
                                  onClick={() => handleUpdateDocumentStatus('RECHAZADO')}
                                  disabled={isUpdatingDocStatus || selectedReviewDoc.status === 'RECHAZADO'}
                                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                                >
                                  <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-700 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </div>
                                  <span className="text-xs font-black text-red-800 uppercase tracking-wider">Rechazar</span>
                                </button>
                              </div>
                            </>
                          )}
                          {(selectedReviewDoc.status === 'RECHAZADO' || selectedReviewDoc.status === 'REQUIERE_CORRECCION') && canUploadDocuments && (
                            <div className={`relative mt-2 ${canUploadDocuments ? 'border-t border-gray-100 pt-3' : ''}`}>
                            <input 
                              type="file" 
                              ref={replaceFileInputRef}
                              onChange={handleReplaceDocument}
                              className="hidden"
                            />
                            <button 
                              onClick={() => replaceFileInputRef.current?.click()}
                              disabled={isReplacingDoc}
                              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-bold text-blue-700 shadow-sm"
                            >
                              {isReplacingDoc ? (
                                <span className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                              )}
                              Reemplazar Archivo
                            </button>
                            <button
                              onClick={handleDeleteDocument}
                              disabled={isDeletingDoc}
                              className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-bold text-red-700 shadow-sm"
                            >
                              {isDeletingDoc ? (
                                <span className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              )}
                              Eliminar Documento
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal: Responder Auto */}
        {showResponderAutoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Responder Requerimiento (Auto)</h3>
                <button onClick={() => setShowResponderAutoModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-sm shadow-inner">
                  <p className="font-black text-xs uppercase tracking-wider mb-1 text-amber-700">Observación Actual del INVIMA:</p>
                  <p className="font-medium">{selectedProduct?.observacion}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Comentarios de respuesta</label>
                  <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none" rows={4} placeholder="Escribe aquí las observaciones formales para el radicado de respuesta al INVIMA..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Soportes Adjuntos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50/50">
                    <span className="text-sm font-bold text-blue-600 hover:text-blue-700">Explorar archivos</span> <span className="text-sm text-gray-500">para adjuntar a la respuesta</span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 rounded-b-2xl">
                <button onClick={() => setShowResponderAutoModal(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                <button onClick={() => { setShowResponderAutoModal(false); handleExport(); }} className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200">Radicar Respuesta</button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Modal: Editar Detalles del Proceso */}
      {isEditingDetalles && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Actualizar Detalles
              </h3>
              <button onClick={() => setIsEditingDetalles(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateDetalles} className="p-6 space-y-5 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-900 text-sm shadow-inner">
                <p className="font-semibold">Actualiza el código, llave o radicado. Estos datos se reflejarán inmediatamente en la información del trámite.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Código</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="Ej. COD-001" 
                    value={detallesForm.codigo}
                    onChange={(e) => setDetallesForm({...detallesForm, codigo: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Radicado de Inicio</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="Ej. INV-2023-XXXXX" 
                    value={detallesForm.radicadoInicio}
                    onChange={(e) => setDetallesForm({...detallesForm, radicadoInicio: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Llave de Acceso</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" 
                    placeholder="Ej. A7B-9X2-LKJ" 
                    value={detallesForm.llave}
                    onChange={(e) => setDetallesForm({...detallesForm, llave: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditingDetalles(false)} 
                  className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdatingDetalles}
                  className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdatingDetalles ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </DashboardLayout>
  );
}
