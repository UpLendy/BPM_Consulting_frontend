'use client';

interface DocCardProps {
  companyName: string;
  engineerName: string;
  date: string;
  description: string;
  onClick?: () => void;
}

export default function DocCard({
  companyName,
  engineerName,
  date,
  description,
  onClick
}: DocCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 group cursor-pointer"
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          Cita para {companyName}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-semibold text-gray-700 font-inter">Ingeniero:</span>
              {engineerName}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-semibold text-gray-700 font-inter">Fecha:</span>
              {date}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700 font-inter italic">Descripcion:</span>
              <span className="ml-2">{description}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
