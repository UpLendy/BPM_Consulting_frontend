'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { DashboardLayout } from '@/app/components/layout';
import RoleGuard from '@/app/components/auth/RoleGuard';
import { companyService } from '@/app/services/companies/companyService';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { engineerService } from '@/app/services/engineers/engineerService';
import { AppointmentStatus, Appointment } from '@/app/types';

const COLORS = ['#8b5cf6', '#f97316', '#ef4444', '#06b6d4', '#64748b', '#475569', '#10b981', '#f59e0b'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeEngineers, setActiveEngineers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user for welcome message
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Parallel fetch for chart data and global stats
        const [aptRes, valRes] = await Promise.all([
          appointmentService.getAllAppointments({}),
          appointmentService.getAllValidations({ status: 'EN_REVISION', limit: 1 })
        ]);

        const apps = aptRes?.data || [];
        processChartData(apps);

        if (valRes.success) {
           setStats({
             en_revision: valRes.data?.meta?.total ?? valRes.data?.total ?? 0
           });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [stats, setStats] = useState<any>(null);

  const processChartData = (appointments: Appointment[] = []) => {
    // Ensure we have an array
    const appsArray = Array.isArray(appointments) ? appointments : [];
    
    // Filter appointments - Using PROGRAMADA for now as per user request in previous step for Reports
    const filteredApps = appsArray.filter(app => app.status === AppointmentStatus.PROGRAMADA);
    
    // Engineer Map
    const engineerMap = new Map<string, string>();
    filteredApps.forEach(app => {
      const rawApp = app as any;
      const engId = rawApp.engineerId || rawApp.ingenieroId || rawApp.engineer?.id;

      if (engId) {
        const engName = rawApp.engineer?.full_name || 
                       rawApp.engineer?.username || 
                       rawApp.engineerName || 
                       `Ingeniero ${String(engId).substring(0,4)}`;
        engineerMap.set(engId, engName);
      }
    });

    const uniqueEngineers = Array.from(engineerMap.keys());
    setActiveEngineers(uniqueEngineers.map(id => engineerMap.get(id) || id));

    // Group by Month (Default for Dashboard view)
    const groupedData: Record<string, any> = {};

    filteredApps.forEach(app => {
      const rawApp = app as any;
      const engId = rawApp.engineerId || rawApp.ingenieroId || rawApp.engineer?.id;
      const dateVal = app.date instanceof Date ? app.date : new Date(app.date);
      
      if (isNaN(dateVal.getTime())) return;

      const month = dateVal.toLocaleString('es-ES', { month: 'short' });
      const year = dateVal.getFullYear();
      const timeKey = `${month.charAt(0).toUpperCase() + month.slice(1)}`;
      const sortKey = `${year}-${String(dateVal.getMonth() + 1).padStart(2, '0')}`;

      if (!groupedData[sortKey]) {
        groupedData[sortKey] = { name: timeKey, sortKey };
        uniqueEngineers.forEach(id => {
          groupedData[sortKey][engineerMap.get(id) || id] = 0;
        });
      }

      const engName = engineerMap.get(engId || '') || '';
      if (engName && engId) {
         groupedData[sortKey][engName] = (groupedData[sortKey][engName] || 0) + 1;
      }
    });

    const sortedData = Object.values(groupedData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    setChartData(sortedData);
  };

  const menuCards = [
    {
      title: 'Usuarios registrados',
      subtitle: 'Empresas, Ingenieros, Administradores',
      path: '/gestion-usuarios',
    },
    {
      title: stats?.en_revision > 0 ? `${stats.en_revision} Citas por revisar` : 'Sin citas por revisar',
      subtitle: 'Revisiones pendientes',
      path: '/gestion-citas?status=EN_REVISION',
    },
    {
      title: 'Gestión de Citas',
      subtitle: 'Historial y Programación',
      path: '/gestion-citas',
    },
    {
      title: 'Registrar usuario',
      subtitle: 'Nuevos usuarios',
      path: '/registrar-usuarios',
    },
  ];

  return (
    <RoleGuard allowedRoles={['admin', 'administrador']}>
      <DashboardLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-2">
              "¡Hola, {user?.first_name || 'Usuario'} {user?.last_name || ''} Bienvenido al sistema de gestión de BPM Consulting"
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuCards.map((card, index) => (
              <button
                key={index}
                onClick={() => router.push(card.path)}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow group flex flex-col justify-center h-32"
              >
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-2 uppercase tracking-wide">
                  {card.subtitle}
                </p>
              </button>
            ))}
          </div>

          {/* Main Chart Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-lg font-bold text-gray-900">Estadísticas generales</h2>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-full border border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors">
                  Ingenieros ▼
                </button>
                <button className="px-4 py-1.5 rounded-full border border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors">
                  Citas ▼
                </button>
              </div>
            </div>

            {/* Chart Visualization */}
            <div className="h-96 w-full mb-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" />
                    {activeEngineers.map((engineerName, idx) => (
                       <Line
                          key={engineerName}
                          type="monotone"
                          dataKey={engineerName}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                       />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="text-center text-gray-400">
                      <p className="mb-2">No hay datos para mostrar</p>
                      <p className="text-sm">Las estadísticas aparecerán cuando se agenden citas</p>
                    </div>
                 </div>
              )}
            </div>

            {/* Legend Cycles */}
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-6">
              <span className="text-sm font-bold text-gray-700 mr-2">Ciclos:</span>
              {activeEngineers.length > 0 ? activeEngineers.map((label, idx) => (
                <span key={idx} className="px-3 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                  {label}
                </span>
              )) : (
                <span className="text-xs text-gray-400 italic">Sin datos activos</span>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
