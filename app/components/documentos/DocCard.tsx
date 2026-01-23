'use client';

interface DocCardProps {
  companyName: string;
  engineerName: string;
  date: string;
  description: string;
  status: string;
  onClick?: () => void;
  onAction?: (e: React.MouseEvent) => void;
  actionLabel?: string;
  actionDisabled?: boolean;
}

export default function DocCard({
  companyName,
  engineerName,
  date,
  description,
  status,
  onClick,
  onAction,
  actionLabel,
  actionDisabled
}: DocCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 group relative ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Cita para {companyName}
            </h2>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                {status}
            </span>
        </div>
        
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

        {onAction && actionLabel && (
            <div className="mt-2 flex justify-end">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!actionDisabled) onAction(e);
                    }}
                    disabled={actionDisabled}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border
                        ${actionDisabled 
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'}`}
                >
                    {actionLabel}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
