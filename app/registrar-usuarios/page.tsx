'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { userService } from '@/app/services/users/userService';

export default function RegistrarUsuariosPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    id_number: '',
    roleId: ''
  });

  useEffect(() => {
    // Fetch roles to populate the select input
    const fetchRoles = async () => {
      try {
        const rolesData = await userService.getRoles();
        // Filter out admin role
        const filteredRoles = rolesData.filter((role: any) => 
          role.name.toLowerCase() !== 'admin' && 
          role.name.toLowerCase() !== 'administrador'
        );
        setRoles(filteredRoles);
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (formData.first_name.length < 2 || formData.first_name.length > 50) {
      setError('El nombre debe tener entre 2 y 50 caracteres');
      setIsLoading(false);
      return;
    }
    if (formData.last_name.length < 2 || formData.last_name.length > 50) {
      setError('El apellido debe tener entre 2 y 50 caracteres');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setIsLoading(false);
      return;
    }
    if (formData.id_number.length !== 10) {
      setError('El número de identificación debe tener exactamente 10 dígitos');
      setIsLoading(false);
      return;
    }
    if (!formData.roleId) {
      setError('Debe seleccionar un rol');
      setIsLoading(false);
      return;
    }

    try {
      await userService.createUser(formData);
      setSuccess(true);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        id_number: '',
        roleId: ''
      });
      // Optionally redirect after success
      // setTimeout(() => router.push('/admin-dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-inter">Registrar Nuevo Usuario</h1>
          <p className="text-gray-600 font-inter">Complete los campos para dar de alta a un nuevo integrante en la plataforma.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg font-inter">
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg font-inter">
              <p className="font-medium text-sm text-center">¡Usuario registrado exitosamente!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Correo Electrónico</label>
              <input
                required
                type="email"
                name="email"
                placeholder="ejemplo@bpm.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Nombres</label>
              <input
                required
                type="text"
                name="first_name"
                placeholder="Juan"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Apellidos</label>
              <input
                required
                type="text"
                name="last_name"
                placeholder="Pérez"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Número de Identificación</label>
              <input
                required
                type="text"
                name="id_number"
                placeholder="10 dígitos"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                value={formData.id_number}
                onChange={handleChange}
              />
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Rol del Usuario</label>
              <select
                required
                name="roleId"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-inter text-gray-900"
                value={formData.roleId}
                onChange={handleChange}
              >
                <option value="">Seleccione un rol</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
                {/* Fallback if roles are empty */}
                {roles.length === 0 && (
                  <>
                    <option value="engineer">Ingeniero</option>
                    <option value="company">Empresa</option>
                  </>
                )}
              </select>
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-inter">Contraseña</label>
              <input
                required
                type="password"
                name="password"
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 font-inter"
              >
                {isLoading ? 'Registrando...' : 'Registrar Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
