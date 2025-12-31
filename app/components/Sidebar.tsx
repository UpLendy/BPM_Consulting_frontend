'use client';

import { useState } from 'react';

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>('');

  // Handle menu item click - Add navigation logic here
  const handleMenuClick = (itemName: string) => {
    setActiveItem(itemName);
    // TODO: Add navigation logic here
    console.log(`Clicked on: ${itemName}`);
  };

  return (
    <aside className="w-64 h-screen bg-[#3f4771] flex flex-col justify-between text-white">
      {/* Top Section */}
      <div>
        {/* Logo Header */}
        <div className="p-6 border-b border-[#4a5180]">
          <h1 className="text-2xl font-bold text-[#1e3a8a]">
            BPM<span className="font-light">Consulting</span>
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="mt-6 px-3">
          {/* Gestión de citas */}
          <button
            onClick={() => handleMenuClick('gestion-citas')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'gestion-citas' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">Gestión de citas</span>
          </button>

          {/* Documentos empresa */}
          <button
            onClick={() => handleMenuClick('documentos-empresa')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'documentos-empresa' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium">Documentos empresa</span>
          </button>

          {/* Registro de visita */}
          <button
            onClick={() => handleMenuClick('registro-visita')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'registro-visita' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📋</span>
            <span className="text-sm font-medium">Registro de visita</span>
          </button>

          {/* Generar acta */}
          <button
            onClick={() => handleMenuClick('generar-acta')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'generar-acta' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📋</span>
            <span className="text-sm font-medium">Generar acta</span>
          </button>

          {/* Dashboard */}
          <button
            onClick={() => handleMenuClick('dashboard')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'dashboard' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          {/* Gestión de usuarios */}
          <button
            onClick={() => handleMenuClick('gestion-usuarios')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'gestion-usuarios' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">👥</span>
            <span className="text-sm font-medium">Gestión de usuarios</span>
          </button>

          {/* Reportes/Estadísticas */}
          <button
            onClick={() => handleMenuClick('reportes')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'reportes' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📈</span>
            <span className="text-sm font-medium">
              Reportes/
              <br />
              Estadísticas
            </span>
          </button>

          {/* Registrar usuarios */}
          <button
            onClick={() => handleMenuClick('registrar-usuarios')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'registrar-usuarios' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">👤</span>
            <span className="text-sm font-medium">Registrar usuarios</span>
          </button>

          {/* Visualizar documentos */}
          <button
            onClick={() => handleMenuClick('visualizar-documentos')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'visualizar-documentos' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl">📑</span>
            <span className="text-sm font-medium">Visualizar documentos</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#4a5180]">
        {/* Ajustes */}
        <button
          onClick={() => handleMenuClick('ajustes')}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
            activeItem === 'ajustes' ? 'bg-[#4a5180]' : ''
          }`}
        >
          <span className="text-2xl">⚙️</span>
          <span className="text-sm font-medium">Ajustes</span>
        </button>

        {/* Cerrar Sesión */}
        <button
          onClick={() => handleMenuClick('cerrar-sesion')}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-red-600"
        >
          <span className="text-2xl">🚪</span>
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
        {/* TODO: Add logout logic here */}
      </div>
    </aside>
  );
}
