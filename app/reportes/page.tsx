'use client';

import { useState, useEffect, useRef } from 'react';
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
import { AppointmentType, AppointmentStatus, Appointment } from '@/app/types';

// Palette matching the design
const COLORS = ['#8b5cf6', '#f97316', '#ef4444', '#06b6d4', '#64748b', '#475569', '#10b981', '#f59e0b'];

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('Mensual');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    companiesCount: 0,
    asesoriasCount: 0,
    auditoriasCount: 0,
    engineersCount: 0,
    totalEngineers: 0, 
    documentsPending: 30 
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeEngineers, setActiveEngineers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const periods = ['Semanal', 'Mensual', 'Anual'];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [companies, appointmentsRes, engineers, globalStatsRes] = await Promise.all([
          companyService.getAllCompanies(),
          appointmentService.getAllAppointments({}),
          engineerService.getAllEngineers(),
          appointmentService.getAppointmentStats()
        ]);

        const appointments = (Array.isArray(appointmentsRes) ? appointmentsRes : (appointmentsRes as any)?.data || []) as Appointment[];

        const asesorias = appointments.filter((a: Appointment) => a.appointmentType === AppointmentType.ASESORIA).length;
        const auditorias = appointments.filter((a: Appointment) => a.appointmentType === AppointmentType.AUDITORIA).length;

        setStats({
          companiesCount: companies.length,
          asesoriasCount: asesorias,
          auditoriasCount: auditorias,
          engineersCount: engineers.length,
          totalEngineers: engineers.length,
          documentsPending: globalStatsRes.success ? globalStatsRes.data.en_revision : 0
        });

        // Process Chart Data
        processChartData(appointments, period);

      } catch (error) {
        console.error('Error fetching report stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]); // Refetch/recalc when period changes

  const processChartData = (appointments: Appointment[], periodType: string) => {
    // 1. Filter completed appointments
    const completedApps = appointments.filter(app => app.status === AppointmentStatus.COMPLETADA);

    // 2. Identify all unique engineers involved in completed appointments
    // We use a map to store their names for the legend
    const engineerMap = new Map<string, string>(); // id -> Full Name
    completedApps.forEach(app => {
      // Handle potential property name differences explicitly
      const rawApp = app as any;
      const engId = rawApp.engineerId || rawApp.ingenieroId || rawApp.engineer?.id;

      if (engId) {
        // Try to get a friendly name
        const engName = rawApp.engineer?.full_name || 
                       rawApp.engineer?.username || 
                       rawApp.engineerName || 
                       `Ingeniero ${String(engId).substring(0,4)}`;
        
        engineerMap.set(engId, engName);
      }
    });

    const uniqueEngineers = Array.from(engineerMap.keys());
    setActiveEngineers(uniqueEngineers.map(id => engineerMap.get(id) || id));

    // 3. Group by Time Period
    // Structure: { "Ciclo 1": { engineerId1: 5, engineerId2: 3, name: "Jan" }, ... }
    const groupedData: Record<string, any> = {};

    completedApps.forEach(app => {
      const rawApp = app as any;
      const engId = rawApp.engineerId || rawApp.ingenieroId || rawApp.engineer?.id;
      
      // Ensure date is a Date object
      const dateVal = app.date instanceof Date ? app.date : new Date(app.date);
      
      if (isNaN(dateVal.getTime())) return; // Skip invalid dates

      let timeKey = '';
      let sortKey = ''; // Used to sort the periods correctly

      if (periodType === 'Mensual') {
        const month = dateVal.toLocaleString('es-ES', { month: 'short' });
        const year = dateVal.getFullYear();
        timeKey = `${month.charAt(0).toUpperCase() + month.slice(1)}`; // E.g., "Ene"
        sortKey = `${year}-${String(dateVal.getMonth() + 1).padStart(2, '0')}`; // "2024-01"
      } else if (periodType === 'Anual') {
        timeKey = dateVal.getFullYear().toString();
        sortKey = timeKey;
      } else {
        // Weekly - simplified: Week number of year
        const start = new Date(dateVal.getFullYear(), 0, 1);
        const diff = dateVal.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        const week = Math.ceil((day + 1) / 7);
        timeKey = `Sem ${week}`;
        sortKey = `${dateVal.getFullYear()}-W${String(week).padStart(2, '0')}`;
      }

      if (!groupedData[sortKey]) {
        groupedData[sortKey] = { name: timeKey, sortKey }; // Init
        uniqueEngineers.forEach(id => {
          groupedData[sortKey][engineerMap.get(id) || id] = 0; // Init counters
        });
      }

      const engName = engineerMap.get(engId || '') || '';
      if (engName && engId) {
         groupedData[sortKey][engName] = (groupedData[sortKey][engName] || 0) + 1;
      }
    });



    // 4. Convert to Array and Sort
    const sortedData = Object.values(groupedData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    setChartData(sortedData);
  };

  return (
    <RoleGuard allowedRoles={['admin', 'administrador']}>
      <DashboardLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes/ Estadisticas</h1>
              <p className="text-gray-500 text-sm">Estas son las estadisticas de BPM Consulting</p>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {period}
                <svg className={`w-4 h-4 transition-transform duration-200 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isPeriodDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${
                        period === p ? 'text-purple-700 font-medium bg-purple-50' : 'text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Empresas */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.companiesCount}
                </h3>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">EMPRESAS</p>
              </div>
            </div>

            {/* Asesorias */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between h-32">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.asesoriasCount}
                </h3>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">ASESORIAS</p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>

            {/* Auditorias */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between h-32">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stats.auditoriasCount}
                </h3>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">AUDITORIAS</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>

            {/* Citas por revisar (Large CTA) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-auto row-span-2 lg:col-start-4 lg:row-start-1 lg:row-end-3">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-2">Citas por revisar</p>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  Hacen falta por revisar:<br />
                  <span className="text-3xl">{stats.documentsPending} citas</span>
                </h3>
              </div>
              <button 
                onClick={() => router.push('/gestion-citas?status=EN_REVISION')}
                className="mt-6 w-full py-3 bg-[#3f4771] text-white rounded-xl text-sm font-medium hover:bg-[#2c3357] transition-colors flex items-center justify-center gap-2"
              >
                Ver todas las citas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* Ingenieros (Second Row) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between h-32 lg:col-span-3">
              <div className="flex items-center gap-8 w-full justify-center">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stats.engineersCount}/{loading ? '...' : stats.totalEngineers}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">INGENIEROS</p>
                </div>
                <div className="flex -space-x-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xl shadow-sm">
                      👨‍💻
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
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
                    margin={{
                      top: 5,
                      right: 30,
                      left: 0,
                      bottom: 5,
                    }}
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
                          type="monotone" // Smooth curve
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
                      <p className="mb-2">No hay datos de citas completadas para mostrar</p>
                      <p className="text-sm">Las estadísticas aparecerán cuando se completen citas</p>
                    </div>
                 </div>
              )}
            </div>

            {/* Custom Legend/Badges Section - Optional as Chart has Legend */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-700 mr-2">Ciclos:</span>
                {activeEngineers.length > 0 ? activeEngineers.map((label, idx) => (
                  <span key={idx} className="px-3 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                    {label}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400 italic">Sin datos activos</span>
                )}
              </div>

              <button className="px-6 py-2 bg-[#3f4771] text-white rounded-lg text-sm font-medium hover:bg-[#2c3357] transition-colors shadow-lg shadow-indigo-100">
                Exportar reporte
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
