'use client';

import BaseModal from './BaseModal';
import { formatUserFullName } from '@/app/utils/userUtils';

interface Company {
  id: string;
  name: string;
  nit: string;
  address: string;
  is_active: boolean;
  representative: {
    id: string;
    phone_number: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface EngineerCompaniesModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineerName: string;
  companies: Company[];
  isLoading: boolean;
}

export default function EngineerCompaniesModal({
  isOpen,
  onClose,
  engineerName,
  companies,
  isLoading
}: EngineerCompaniesModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Empresas Asignadas a ${engineerName}`}
      size="lg"
    >
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-inter">
              Sin Empresas Asignadas
            </h3>
            <p className="text-sm text-gray-500 font-inter">
              Este ingeniero aún no tiene empresas asignadas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-inter mb-4">
              Total de empresas: <span className="font-bold text-gray-900">{companies.length}</span>
            </p>
            
            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  {/* Company Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 font-inter mb-1">
                        {company.name}
                      </h4>
                      <p className="text-sm text-gray-500 font-inter">
                        NIT: <span className="font-semibold text-gray-700">{company.nit}</span>
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        company.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {company.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Company Details */}
                  <div className="space-y-3">
                    {company.address && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-600 font-inter">{company.address}</p>
                      </div>
                    )}

                    {/* Representative Info */}
                    {company.representative && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-inter">
                          Representante
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {company.representative.user.first_name.charAt(0)}
                              {company.representative.user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 font-inter truncate">
                              {formatUserFullName(
                                company.representative.user.first_name,
                                company.representative.user.last_name
                              )}
                            </p>
                            <p className="text-xs text-gray-500 font-inter truncate">
                              {company.representative.user.email}
                            </p>
                            {company.representative.phone_number && (
                              <p className="text-xs text-gray-500 font-inter">
                                📞 {company.representative.phone_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors font-inter"
          >
            Cerrar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
