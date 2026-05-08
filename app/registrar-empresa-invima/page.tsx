'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { invimaService } from '@/app/services/invima/invimaService';
import { userService } from '@/app/services/users/userService';
import RoleGuard from '@/app/components/auth/RoleGuard';

export default function RegistrarEmpresaInvimaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // For User creation
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [formData, setFormData] = useState({
    // Datos Empresa INVIMA
    nombreEmpresa: '',
    
    // Datos Usuario Normal
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    idNumber: '',
    roleId: '',

    // Perfil INVIMA
    tipo: 'COMERCIAL'
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      // Force cache clear to ensure we get newly created roles like "invima"
      if (typeof userService.clearCache === 'function') {
         userService.clearCache();
      }
      const rolesData = await userService.getRoles();
      setRoles(rolesData || []);
      
      // Auto-select 'invima' role if available
      const invimaRole = rolesData.find((r: any) => r.name.toLowerCase().includes('invima'));
      if (invimaRole) {
        setFormData(prev => ({ ...prev, roleId: invimaRole.id }));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const missing = [];
    if (!formData.nombreEmpresa.trim()) missing.push('Nombre de la Empresa');
    if (!formData.firstName.trim()) missing.push('Nombres');
    if (!formData.lastName.trim()) missing.push('Apellidos');
    if (!formData.email.trim()) missing.push('Correo Electrónico');
    if (!formData.password) missing.push('Contraseña');
    if (!formData.idNumber.trim()) missing.push('Cédula / NIT');
    // Role internally validated below

    if (missing.length > 0) {
      setError(`Faltan campos obligatorios: ${missing.join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
      let finalRoleId = formData.roleId;
      if (!finalRoleId) {
        if (typeof userService.clearCache === 'function') userService.clearCache();
        const freshRoles = await userService.getRoles();
        const invimaRole = (freshRoles || []).find((r: any) => r.name && r.name.toLowerCase().includes('invima'));
        if (invimaRole) {
           finalRoleId = invimaRole.id;
        } else {
           throw new Error('Error fatal: El backend no devolvió ningún rol con el nombre "invima". Por favor, verifica en la base de datos.');
        }
      }

      // 1. Verificar si la Empresa INVIMA ya existe
      const existingCompaniesRes = await invimaService.getCompanies();
      const existingCompanies = Array.isArray(existingCompaniesRes) ? existingCompaniesRes : (existingCompaniesRes?.data || []);
      
      const companyNameLower = formData.nombreEmpresa.trim().toLowerCase();
      const foundCompany = existingCompanies.find((c: any) => c.nombre && c.nombre.trim().toLowerCase() === companyNameLower);

      let invimaCompanyId = '';

      if (foundCompany) {
         // Si existe, usamos su ID
         invimaCompanyId = foundCompany.id || foundCompany._id;
      } else {
         // Si no existe, la creamos
         const companyResponse = await invimaService.createCompany({
           nombre: formData.nombreEmpresa,
           is_active: true
         });
         invimaCompanyId = companyResponse.id || companyResponse.data?.id || companyResponse._id || companyResponse.data?._id;
      }

      if (!invimaCompanyId) {
         throw new Error("No se pudo obtener ni crear el ID de la empresa. Verifica la respuesta del backend.");
      }

      // 2. Crear Usuario Normal
      const userResponse = await userService.createUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        id_number: formData.idNumber,
        roleId: finalRoleId
      });

      const newUserId = userResponse.id || userResponse.data?.id || userResponse._id || userResponse.data?._id;
      if (!newUserId) {
        throw new Error("El usuario se creó pero no se pudo obtener su ID para vincularlo a la empresa.");
      }

      // 3. Crear Perfil INVIMA (Usuario INVIMA)
      await invimaService.createProfile({
        userId: newUserId,
        tipo: formData.tipo,
        invimaCompanyId: invimaCompanyId
      });

      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        nombreEmpresa: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        idNumber: '',
        // keep roleId and tipo the same
      }));
      
      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-10 text-white">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Crear Empresa y Usuario INVIMA</h2>
              <p className="text-blue-100 text-sm sm:text-base font-medium">
                Crea una nueva empresa en INVIMA y registra el usuario asociado en un solo paso.
              </p>
            </div>

            <div className="p-6 sm:p-10">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 animate-fade-in">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 animate-fade-in">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ¡Empresa y usuario creados y vinculados exitosamente!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECCIÓN 1: EMPRESA INVIMA */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Datos de la Empresa
                  </h3>
                  <div>
                    <label htmlFor="nombreEmpresa" className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre de la Empresa INVIMA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombreEmpresa"
                      name="nombreEmpresa"
                      value={formData.nombreEmpresa}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black font-semibold placeholder-gray-500 bg-white"
                      placeholder="Ej. Farmacéutica Colombiana SAS"
                      required
                    />
                  </div>
                </div>

                {/* SECCIÓN 2: USUARIO */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Datos del Nuevo Usuario
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">Nombres <span className="text-red-500">*</span></label>
                      <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500" required />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">Apellidos <span className="text-red-500">*</span></label>
                      <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="idNumber" className="block text-sm font-bold text-gray-700 mb-2">Cédula / NIT <span className="text-red-500">*</span></label>
                      <input type="text" id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500" required />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico <span className="text-red-500">*</span></label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">Contraseña <span className="text-red-500">*</span></label>
                      <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold placeholder-gray-500" required />
                    </div>
                    <div>
                      <label htmlFor="roleId" className="block text-sm font-bold text-gray-700 mb-2">Rol del Sistema <span className="text-red-500">*</span></label>
                      <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 font-bold flex items-center justify-between">
                        <span>INVIMA</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: PERFIL INVIMA */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                    Perfil INVIMA
                  </h3>
                  <div>
                    <label htmlFor="tipo" className="block text-sm font-bold text-gray-700 mb-2">
                      Tipo de Perfil en Plataforma INVIMA
                    </label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
                    >
                      <option value="COMERCIAL">COMERCIAL</option>
                      <option value="TECNICO">TECNICO</option>
                      <option value="LEGAL">LEGAL</option>
                      <option value="ADMINISTRATIVO">CALIDAD</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      'Completar Registro'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
