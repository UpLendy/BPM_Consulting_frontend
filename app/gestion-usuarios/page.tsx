'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { userService } from '@/app/services/users/userService';
import { companyService } from '@/app/services/companies/companyService';
import { engineerService } from '@/app/services/engineers/engineerService';
import { Company } from '@/app/types';

// Define a local interface for the user data from the API (matching backend snake_case)
interface UserListData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  id_number: string;
  role: {
    id: string;
    name: string;
  };
  is_active: boolean;
  createdAt: string;
}

export default function GestionUsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserListData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListData | null>(null);
  const [assignForm, setAssignForm] = useState({
    companyId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersData, companiesData] = await Promise.all([
          userService.getAllUsers(),
          companyService.getAllCompanies()
        ]);
        setUsers(usersData);
        setCompanies(companiesData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openAssignModal = (user: UserListData) => {
    setSelectedUser(user);
    setIsAssignModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
    setAssignForm({ companyId: '' });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !assignForm.companyId) return;

    setIsAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      await engineerService.createAndAssign(selectedUser.id, assignForm.companyId);
      setSuccess(`Usuario ${selectedUser.first_name} asignado correctamente.`);
      setTimeout(() => {
        closeAssignModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al realizar la asignación');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = users.filter(user => 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id_number.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="font-inter">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Administra los accesos y perfiles de todos los usuarios de la plataforma.</p>
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
                placeholder="Buscar por nombre, correo o ID..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm font-inter text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => router.push('/registrar-usuarios')}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 whitespace-nowrap font-inter"
            >
              <span>+</span> Nuevo Usuario
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg font-inter">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 font-inter">Usuario</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 font-inter">ID / Documento</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 font-inter">Rol</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 font-inter">Estado</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 font-inter text-center">Asignación</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 font-inter text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-inter">Cargando usuarios...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 font-inter">{user.first_name} {user.last_name}</span>
                          <span className="text-xs text-gray-500 font-inter">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-inter">{user.id_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-14 py-1.5 rounded-full text-xs font-bold font-inter justify-center flex items-center min-w-[120px] ${
                          user.role?.name?.toLowerCase() === 'admin' 
                            ? 'bg-purple-50 text-purple-700' 
                            : user.role?.name?.toLowerCase() === 'engineer' || user.role?.name?.toLowerCase() === 'ingeniero'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-green-50 text-green-700'
                        }`}>
                          {user.role?.name || 'Usuario'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold font-inter ${
                          user.is_active ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(user.role?.name?.toLowerCase() === 'engineer' || user.role?.name?.toLowerCase() === 'ingeniero') && (
                          <button 
                            onClick={() => openAssignModal(user)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors font-inter"
                          >
                            Asignar Empresa
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded-lg ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <p className="text-gray-500 font-inter">No se encontraron usuarios que coincidan con la búsqueda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 font-inter">Asignar Empresa</h3>
              <button 
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-inter">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-600 text-xs rounded-lg font-inter">
                  {success}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-4 font-inter">
                  Asignar una empresa al ingeniero <span className="font-bold text-gray-900">{selectedUser?.first_name} {selectedUser?.last_name}</span>.
                </p>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-inter">Seleccionar Empresa</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                  value={assignForm.companyId}
                  onChange={(e) => setAssignForm({ companyId: e.target.value })}
                >
                  <option value="">Seleccione una empresa...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} (NIT: {company.nit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all font-inter"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignForm.companyId}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 font-inter"
                >
                  {isAssigning ? 'Asignando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
