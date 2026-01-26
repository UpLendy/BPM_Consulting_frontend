'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { authService } from '@/app/services/authService';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import ValidationReviewModal from '@/app/components/modals/ValidationReviewModal';

export default function VisualizarDocumentosPage() {
  const router = useRouter();
  const [validations, setValidations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValidation, setSelectedValidation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            console.warn('Error fetching global fallback success rate', err);
          }
        }

        // 2. Use my-appointments endpoint without parameters to avoid parsing issues
        const aptResponse = await appointmentService.getMyAppointments();
        
        if (aptResponse && aptResponse.data) {
          const appointments = aptResponse.data;
          const validationsList: any[] = [];
          
          // Filter completed appointments
          const completedAppointments = appointments.filter(a => a.status === 'COMPLETADA');
          
          console.log('Completed appointments:', completedAppointments);
          
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
                    console.warn(`Could not load specific evaluation for appointment ${apt.id}, using fallback`, evalErr);
                  }

                  // Fetch Record if exists
                  let recordUrl = null;
                  try {
                    const recordRes = await appointmentService.getAppointmentRecordPreview(apt.id);
                    if (recordRes.success) {
                      recordUrl = recordRes.data?.url;
                    }
                  } catch (recErr) {
                    console.warn(`No record found for appointment ${apt.id}`);
                  }

                  validationsList.push({
                    id: validation.id,
                    appointmentId: apt.id,
                    companyName: apt.companyName || user.companyName || 'Mi Empresa',
                    engineerName: validation.reviewedByName || apt.engineerName || 'Ingeniero',
                    date: new Date(apt.date).toLocaleDateString('es-ES'),
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
              console.warn(`Could not load validation for appointment ${apt.id}`, err);
            }
          }));

          // Sort by date
          validationsList.sort((a: any, b: any) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
          console.log('Validations loaded:', validationsList);
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
    val.engineerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    val.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDocuments = (validation: any) => {
    setSelectedValidation(validation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedValidation(null);
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar validaciones..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm font-inter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Validations Grid */}
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
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{validation.companyName}</h3>
                  <p className="text-sm text-gray-500">Ingeniero: {validation.engineerName}</p>
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
        />
      )}
    </DashboardLayout>
  );
}
