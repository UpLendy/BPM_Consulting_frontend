'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { companyService } from '@/app/services/companies/companyService';
import { CreateCompanyDTO } from '@/app/types';
import RoleGuard from '@/app/components/auth/RoleGuard';


export default function RegistrarEmpresaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateCompanyDTO>({
    name: '',
    nit: '',
    address: ''
  });

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
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8 font-inter">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrar Empresa</h1>
          <p className="text-gray-600">Complete los datos de la nueva empresa para darla de alta en el sistema.</p>
        </div>

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
      </div>
    </DashboardLayout>
    </RoleGuard>
  );
}
