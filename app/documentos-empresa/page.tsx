'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { authService } from '@/app/services/authService';
import DocCard from '@/app/components/documentos/DocCard';

// Mock data for documentation entries based on the image
const MOCK_DOCS = [
  {
    id: '1',
    companyName: 'empresa x',
    engineerName: 'Ernesto Ballesteros Arranz',
    date: '03/11/2025',
    description: 'Cita para asesoría'
  },
  {
    id: '2',
    companyName: 'empresa y',
    engineerName: 'Carlos Morales',
    date: '10/11/2025',
    description: 'Cita para auditoría'
  },
  {
    id: '3',
    companyName: 'empresa z',
    engineerName: 'Jessica Montoya',
    date: '11/11/2025',
    description: 'Cita para auditoría'
  },
  {
    id: '4',
    companyName: 'empresa w',
    engineerName: 'Daniela Palomino',
    date: '12/11/2025',
    description: 'Cita para seguimiento'
  }
];

export default function DocumentosEmpresaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error parsing user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const filteredDocs = MOCK_DOCS.filter(doc => 
    doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.engineerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-inter">
              Documentacion de las empresas
            </h1>
            <p className="text-gray-600 font-inter">
              Aqui podras subir la documentacion de cada cita que hayas hecho
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
                placeholder="Buscar"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm font-inter"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Documentation Cards List */}
        <div className="grid gap-6">
          {filteredDocs.map((doc) => (
            <DocCard
              key={doc.id}
              companyName={doc.companyName}
              engineerName={doc.engineerName}
              date={doc.date}
              description={doc.description}
              onClick={() => console.log('Doc clicked:', doc.id)}
            />
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-lg font-inter">No se encontraron documentos que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
