'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { userService } from '@/app/services/users/userService';
import { companyService } from '@/app/services/companies/companyService';
import { engineerService } from '@/app/services/engineers/engineerService';
import { representativeService } from '@/app/services/representatives/representativeService';
import { Company, UserBackend } from '@/app/types';
import RoleGuard from '@/app/components/auth/RoleGuard';
import { EditUserModal } from '@/app/components/modals';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });


  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListData | null>(null);
  const [assignForm, setAssignForm] = useState({
    companyId: '',
    phoneNumber: '' // For company representatives
  });

  // Filtered companies for company role (only companies without representatives)
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  
  // Track users who already have representative assignments
  const [usersWithAssignments, setUsersWithAssignments] = useState<Set<string>>(new Set());
  
  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListData | null>(null);
  
  // Delete User Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let shouldKeepLoading = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Pedimos los 10 normales de la página actual
        const fetchLimit = 10;
        const fetchPage = currentPage;

        const usersResponse = await userService.getAllUsers({ 
          page: fetchPage, 
          limit: fetchLimit
        });

        if (!isMounted) return;

        // Si hay búsqueda, verificamos si hay algún resultado en esta página
        if (searchTerm) {
          const hasMatches = (usersResponse.data || []).some((user: any) => 
            `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.id_number || '').includes(searchTerm)
          );

          if (!hasMatches && usersResponse.meta?.hasNextPage) {
            // No hay resultados en esta página, pero hay más. 
            // Avanzamos automáticamente manteniendo el estado de carga.
            shouldKeepLoading = true;
            setCurrentPage(prev => prev + 1);
            return;
          }
        }

        const [companiesData, representativesData] = await Promise.all([
          companyService.getAllCompanies(),
          representativeService.getAllRepresentatives()
        ]);
        
        if (!isMounted) return;

        // El backend devuelve los datos paginados correctamente
        setUsers(usersResponse.data || []);
        if (usersResponse.meta) setPaginationMeta(usersResponse.meta);
        
        setCompanies(companiesData);

        // Track which users already have representative assignments
        const assignedUserIds = new Set(
          representativesData
            .filter(rep => rep.companyId)
            .map(rep => rep.userId)
        );
        setUsersWithAssignments(assignedUserIds);
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching data:', err);
          setError('No se pudieron cargar los datos.');
        }
      } finally {
        if (isMounted && !shouldKeepLoading) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [currentPage, searchTerm]); // Recargar cuando cambie la página o el término de búsqueda

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);



  // Filter companies based on selected user's role
  useEffect(() => {
    const filterCompaniesForRole = async () => {
      if (!selectedUser) {
        setFilteredCompanies(companies);
        return;
      }

      const isCompany = selectedUser.role?.name?.toLowerCase() === 'company' || 
                        selectedUser.role?.name?.toLowerCase() === 'empresa' ||
                        selectedUser.role?.name?.toLowerCase() === 'empresario';

      if (isCompany) {
        // For company role: Only show companies without representatives
        try {
          const allReps = await representativeService.getAllRepresentatives();
          const companiesWithReps = new Set(
            allReps
              .filter(rep => rep.companyId) // Only those with a company assigned
              .map(rep => rep.companyId)
          );

          const availableCompanies = companies.filter(
            company => !companiesWithReps.has(company.id)
          );

          setFilteredCompanies(availableCompanies);
        } catch (err) {
          console.error('Error filtering companies:', err);
          setFilteredCompanies(companies);
        }
      } else {
        // For engineer role: Only show companies without engineers
        try {
          const allEngineers = await engineerService.getAllEngineers();
          
          // Get IDs of companies that already have an engineer assigned
          const companiesWithEngineers = new Set(
            allEngineers
              .flatMap(eng => eng.companies || [])
              .map(comp => comp.id)
          );

          const availableCompanies = companies.filter(
            company => !companiesWithEngineers.has(company.id)
          );

          setFilteredCompanies(availableCompanies);
        } catch (err) {
          console.error('Error filtering companies for engineer:', err);
          setFilteredCompanies(companies);
        }
      }
    };

    filterCompaniesForRole();
  }, [selectedUser, companies]);

  const openAssignModal = (user: UserListData) => {
    setSelectedUser(user);
    setIsAssignModalOpen(true);
    setSuccess(null);
    setError(null);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
    setAssignForm({ companyId: '', phoneNumber: '' });
  };
  
  const openEditModal = (user: UserListData) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUserForEdit(null);
  };
  
  const handleEditSuccess = async () => {
    // Refresh user list
    try {
      const usersData = await userService.getAllUsers({ page: currentPage, limit: 10 });
      setUsers(usersData.data || []);
      if (usersData.meta) setPaginationMeta(usersData.meta);
    } catch (err) {
      console.error('Error refreshing users:', err);
    }
  };


  
  const openDeleteModal = (user: UserListData) => {
    setSelectedUserForDelete(user);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUserForDelete(null);
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    
    setIsDeleting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const isEngineer = selectedUserForDelete.role?.name?.toLowerCase() === 'engineer' || 
                        selectedUserForDelete.role?.name?.toLowerCase() === 'ingeniero';
      
      // If user is an engineer, delete engineer record first
      if (isEngineer) {
        try {
          // Get the engineer record by userId
          const engineer = await engineerService.getEngineerByUserId(selectedUserForDelete.id);
          
          if (engineer) {
            // Delete engineer record
            await engineerService.deleteEngineer(engineer.id);
          }
        } catch (engineerError) {
          console.error('Error eliminando ingeniero:', engineerError);
          // Continue with user deletion even if engineer deletion fails
        }
      }
      
      // Delete user
      await userService.deleteUser(selectedUserForDelete.id);
      
      setSuccess(`Usuario ${selectedUserForDelete.first_name} ${selectedUserForDelete.last_name} eliminado correctamente.`);
      
      // Refresh user list
      const usersData = await userService.getAllUsers({ page: currentPage, limit: 10 });
      setUsers(usersData.data || []);
      if (usersData.meta) setPaginationMeta(usersData.meta);

      
      // Close modal after short delay
      setTimeout(() => {
        closeDeleteModal();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Error al eliminar el usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !assignForm.companyId) return;

    const isCompany = selectedUser.role?.name?.toLowerCase() === 'company' || 
                      selectedUser.role?.name?.toLowerCase() === 'empresa' ||
                      selectedUser.role?.name?.toLowerCase() === 'empresario';

    // Validate phone number for company representatives
    if (isCompany && (!assignForm.phoneNumber || assignForm.phoneNumber.length < 10 || assignForm.phoneNumber.length > 15)) {
      setError('El número de teléfono debe tener entre 10 y 15 caracteres');
      return;
    }

    setIsAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      if (isCompany) {
        // Create representative and assign to company
        await representativeService.ensureRepresentative(
          selectedUser.id, 
          assignForm.phoneNumber, 
          assignForm.companyId
        );
        setSuccess(`Representante ${selectedUser.first_name} asignado correctamente.`);
      } else {
        // Create engineer and assign to company
        await engineerService.createAndAssign(selectedUser.id, assignForm.companyId);
        setSuccess(`Ingeniero ${selectedUser.first_name} asignado correctamente.`);
      }
      
      setTimeout(() => {
        closeAssignModal();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al realizar la asignación');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => 
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.id_number || '').includes(searchTerm)
  ) : [];

  // La paginación ahora la dictan los metadatos del backend
  const { totalPages, total: totalItems, limit: itemsPerPage } = paginationMeta;



  return (
    <RoleGuard allowedRoles={['admin', 'administrador']}>
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
                        {((user.role?.name?.toLowerCase() === 'engineer' || user.role?.name?.toLowerCase() === 'ingeniero') ||
                          (user.role?.name?.toLowerCase() === 'company' || user.role?.name?.toLowerCase() === 'empresa' || user.role?.name?.toLowerCase() === 'empresario')) && (
                          (() => {
                            const isCompany = user.role?.name?.toLowerCase() === 'company' || 
                                            user.role?.name?.toLowerCase() === 'empresa' || 
                                            user.role?.name?.toLowerCase() === 'empresario';
                                            
                            const isAssigned = isCompany && usersWithAssignments.has(user.id);
                            
                            return (
                              <button 
                                onClick={() => !isAssigned && openAssignModal(user)}
                                disabled={isAssigned}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors font-inter flex items-center gap-1 ${
                                  isAssigned 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                {isAssigned && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {isAssigned ? 'Asignado' : 'Asignar Empresa'}
                              </button>
                            );
                          })()
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => openDeleteModal(user)}
                          className="p-2 text-gray-400 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded-lg ml-2"
                        >
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

          {/* Pagination UI */}
          {!isLoading && !searchTerm && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between font-inter">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
                    <span className="font-bold">{totalItems}</span> usuarios
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

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
                  Asignar una empresa a {selectedUser?.role?.name?.toLowerCase() === 'company' || selectedUser?.role?.name?.toLowerCase() === 'empresa' || selectedUser?.role?.name?.toLowerCase() === 'empresario' ? 'el representante' : 'el ingeniero'} <span className="font-bold text-gray-900">{selectedUser?.first_name} {selectedUser?.last_name}</span>.
                </p>

                {/* Phone Number - Only for Company representatives */}
                {(selectedUser?.role?.name?.toLowerCase() === 'company' || 
                  selectedUser?.role?.name?.toLowerCase() === 'empresa' || 
                  selectedUser?.role?.name?.toLowerCase() === 'empresario') && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-inter">
                      Número de Teléfono
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="Ej: 3001234567"
                      minLength={10}
                      maxLength={15}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                      value={assignForm.phoneNumber}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                )}

                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-inter">Seleccionar Empresa</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-inter text-gray-900"
                  value={assignForm.companyId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, companyId: e.target.value }))}
                >
                  <option value="">
                    {filteredCompanies.length > 0 
                      ? 'Seleccione una empresa...' 
                      : 'No hay empresas disponibles'}
                  </option>
                  {filteredCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} (NIT: {company.nit})
                    </option>
                  ))}
                </select>
                {filteredCompanies.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-inter">
                    ℹ️ Todas las empresas ya tienen un {selectedUser?.role?.name?.toLowerCase() === 'company' || selectedUser?.role?.name?.toLowerCase() === 'empresa' || selectedUser?.role?.name?.toLowerCase() === 'empresario' ? 'representante' : 'ingeniero'} asignado. Recuerda verificar si creaste la empresa que vas a asignar.
                  </p>
                )}
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
      
      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={handleEditSuccess}
        userId={selectedUserForEdit?.id || ''}
        currentData={selectedUserForEdit ? {
          email: selectedUserForEdit.email,
          first_name: selectedUserForEdit.first_name,
          last_name: selectedUserForEdit.last_name,
          id_number: selectedUserForEdit.id_number,
          role: selectedUserForEdit.role
        } : undefined}
      />

      {/* Delete User Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-inter">Eliminar Usuario</h3>
                  <p className="text-sm text-gray-500 font-inter">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
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

              <p className="text-sm text-gray-600 font-inter">
                ¿Estás seguro de que deseas eliminar al usuario{' '}
                <span className="font-bold text-gray-900">
                  {selectedUserForDelete?.first_name} {selectedUserForDelete?.last_name}
                </span>?
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all font-inter disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 font-inter"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </DashboardLayout>
    </RoleGuard>
  );
}
