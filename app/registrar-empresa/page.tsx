'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { companyService } from '@/app/services/companies/companyService';
import { engineerService } from '@/app/services/engineers/engineerService';
import { CreateCompanyDTO, Engineer } from '@/app/types';
import RoleGuard from '@/app/components/auth/RoleGuard';
import EngineerCompaniesModal from '@/app/components/modals/EngineerCompaniesModal';
import { formatUserFullName } from '@/app/utils/userUtils';

export default function RegistrarEmpresaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Engineers state
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoadingEngineers, setIsLoadingEngineers] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [engineerCompanies, setEngineerCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [showCompaniesModal, setShowCompaniesModal] = useState(false);

  const [formData, setFormData] = useState<CreateCompanyDTO>({
    name: '',
    nit: '',
    address: ''
  });

  // Load engineers on mount
  useEffect(() => {
    loadEngineers();
  }, []);

  const loadEngineers = async () => {
    setIsLoadingEngineers(true);
    try {
      const engineersData = await engineerService.getAllEngineers();
      // Engineer object already includes user data
      setEngineers(engineersData);
    } catch (err) {
      console.error('Error loading engineers:', err);
    } finally {
      setIsLoadingEngineers(false);
    }
  };

  const handleViewCompanies = async (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setShowCompaniesModal(true);
    setIsLoadingCompanies(true);
    setEngineerCompanies([]);

    try {
      const companies = await engineerService.getEngineerCompanies(engineer.id);
      setEngineerCompanies(companies);
    } catch (err) {
      console.error('Error loading companies:', err);
      setEngineerCompanies([]);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Frontend validation based on DTO
    if (formData.name.length < 2 || formData.name.length > 100) {
      setError('El nombre debe tener entre 2 y 100 caracteres');
      setIsLoading(false);
      return;
    }
    if (formData.nit.length < 5 || formData.nit.length > 15) {
      setError('El NIT debe tener entre 5 y 15 caracteres');
      setIsLoading(false);
      return;
    }
    if (formData.address && formData.address.length > 255) {
      setError('La dirección no puede exceder los 255 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare payload: omit address if empty since it's Optional in DTO
      const payload: CreateCompanyDTO = {
        name: formData.name.trim(),
        nit: formData.nit.trim(),
      };
      
      if (formData.address?.trim()) {
        payload.address = formData.address.trim();
      }

      await companyService.createCompany(payload);
      setSuccess(true);
      setFormData({
        name: '',
        nit: '',
        address: ''
      });
    } catch (err: any) {
      setError(err.message || 'Error al registrar la empresa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'administrador']}>
      <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 font-inter">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrar Empresa</h1>
          <p className="text-gray-600">Complete los datos de la nueva empresa para darla de alta en el sistema.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Registration Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg font-inter">
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg font-inter">
                <p className="font-medium text-sm text-center">¡Empresa registrada exitosamente!</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Nombre de la Empresa</label>
                <input
                  required
                  type="text"
                  name="name"
                  minLength={2}
                  maxLength={100}
                  placeholder="Nombre completo de la empresa"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* NIT */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">NIT</label>
                <input
                  required
                  type="text"
                  name="nit"
                  minLength={5}
                  maxLength={15}
                  placeholder="Ej: 900.123.456-7"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                  value={formData.nit}
                  onChange={handleChange}
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Dirección (Opcional)</label>
                <input
                  type="text"
                  name="address"
                  maxLength={255}
                  placeholder="Dirección física de la empresa"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                  value={formData.address || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 font-inter"
                >
                  {isLoading ? 'Registrando...' : 'Registrar Empresa'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Engineers List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-inter mb-2">
                Ingenieros y sus Empresas
              </h2>
              <p className="text-sm text-gray-600 font-inter">
                Haz clic en un ingeniero para ver las empresas asignadas
              </p>
            </div>

            {isLoadingEngineers ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : engineers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-inter">No hay ingenieros activos registrados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {engineers.map((engineer) => (
                  <button
                    key={engineer.id}
                    onClick={() => handleViewCompanies(engineer)}
                    className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 font-inter truncate">
                            {engineer.user 
                              ? formatUserFullName(engineer.user.first_name, engineer.user.last_name)
                              : 'Cargando...'}
                          </p>
                          <p className="text-xs text-gray-500 font-inter truncate">
                            {engineer.user?.email || ''}
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engineer Companies Modal */}
      <EngineerCompaniesModal
        isOpen={showCompaniesModal}
        onClose={() => {
          setShowCompaniesModal(false);
          setSelectedEngineer(null);
          setEngineerCompanies([]);
        }}
        engineerName={
          selectedEngineer?.user
            ? formatUserFullName(selectedEngineer.user.first_name, selectedEngineer.user.last_name)
            : 'Ingeniero'
        }
        companies={engineerCompanies}
        isLoading={isLoadingCompanies}
      />
    </DashboardLayout>
    </RoleGuard>
  );
}
