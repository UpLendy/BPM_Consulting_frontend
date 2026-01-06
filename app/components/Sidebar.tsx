'use client';

import { useState } from 'react';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>('');

  // Handle menu item click - Add navigation logic here
  const handleMenuClick = (itemName: string) => {
    setActiveItem(itemName);
    // TODO: Add navigation logic here
    console.log(`Clicked on: ${itemName}`);
  };

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} h-screen bg-[#3f4771] flex flex-col justify-between text-white transition-all duration-300 overflow-hidden`}>
      {/* Top Section */}
      <div>
        {/* Logo Header */}
        <div className="p-6 border-b border-[#4a5180] min-h-[81px] flex items-center">
          {isOpen ? (
            <h1 className="text-2xl font-bold text-[#1e3a8a] truncate">
              BPM<span className="font-light">Consulting</span>
            </h1>
          ) : (
            <span className="text-xl font-bold text-[#1e3a8a] w-full text-center">BPM</span>
          )}
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
            <span className="text-2xl shrink-0">📅</span>
            {isOpen && <span className="text-sm font-medium truncate">Gestión de citas</span>}
          </button>

          {/* Documentos empresa */}
          <button
            onClick={() => handleMenuClick('documentos-empresa')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'documentos-empresa' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">📄</span>
            {isOpen && <span className="text-sm font-medium truncate">Documentos empresa</span>}
          </button>

          {/* Registro de visita */}
          <button
            onClick={() => handleMenuClick('registro-visita')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'registro-visita' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">📋</span>
            {isOpen && <span className="text-sm font-medium truncate">Registro de visita</span>}
          </button>

          {/* Generar acta */}
          <button
            onClick={() => handleMenuClick('generar-acta')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'generar-acta' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">📋</span>
            {isOpen && <span className="text-sm font-medium truncate">Generar acta</span>}
          </button>

          {/* Dashboard */}
          <button
            onClick={() => handleMenuClick('dashboard')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'dashboard' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">📊</span>
            {isOpen && <span className="text-sm font-medium truncate">Dashboard</span>}
          </button>

          {/* Gestión de usuarios */}
          <button
            onClick={() => handleMenuClick('gestion-usuarios')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'gestion-usuarios' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">👥</span>
            {isOpen && <span className="text-sm font-medium truncate">Gestión de usuarios</span>}
          </button>

          {/* Reportes/Estadísticas */}
          <button
            onClick={() => handleMenuClick('reportes')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'reportes' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">📈</span>
            {isOpen && (
              <span className="text-sm font-medium truncate text-left">
                Reportes/Estadísticas
              </span>
            )}
          </button>

          {/* Registrar usuarios */}
          <button
            onClick={() => handleMenuClick('registrar-usuarios')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'registrar-usuarios' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">👤</span>
            {isOpen && <span className="text-sm font-medium truncate">Registrar usuarios</span>}
          </button>

          {/* Visualizar documentos */}
          <button
            onClick={() => handleMenuClick('visualizar-documentos')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-colors hover:bg-[#4a5180] ${
              activeItem === 'visualizar-documentos' ? 'bg-[#4a5180]' : ''
            }`}
          >
            <span className="text-2xl shrink-0">📑</span>
            {isOpen && <span className="text-sm font-medium truncate">Visualizar documentos</span>}
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
          <span className="text-2xl shrink-0">⚙️</span>
          {isOpen && <span className="text-sm font-medium truncate">Ajustes</span>}
        </button>

        {/* Cerrar Sesión */}
        <button
          onClick={() => handleMenuClick('cerrar-sesion')}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-red-600"
        >
          <span className="text-2xl shrink-0">🚪</span>
          {isOpen && <span className="text-sm font-medium truncate">Cerrar Sesión</span>}
        </button>
        {/* TODO: Add logout logic here */}
      </div>
    </aside>
  );
}
