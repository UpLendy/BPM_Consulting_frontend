'use client';

interface DocCardProps {
  companyName: string;
  engineerName: string;
  date: string;
  description: string;
  status: string;
  title?: string;
  isEditing?: boolean;
  isSaving?: boolean;
  editValue?: string;
  onEditValueChange?: (value: string) => void;
  onEditTitle?: (e: React.MouseEvent) => void;
  onSaveEdit?: (e: React.MouseEvent) => void;
  onCancelEdit?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  onAction?: (e: React.MouseEvent) => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  onSecondaryAction?: (e: React.MouseEvent) => void;
  secondaryActionLabel?: string;
  secondaryActionDisabled?: boolean;
}

export default function DocCard({
  companyName,
  engineerName,
  date,
  description,
  status,
  title,
  isEditing,
  isSaving,
  editValue,
  onEditValueChange,
  onEditTitle,
  onSaveEdit,
  onCancelEdit,
  onClick,
  onAction,
  actionLabel,
  actionDisabled,
  onSecondaryAction,
  secondaryActionLabel,
  secondaryActionDisabled
}: DocCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 group relative ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                        <input 
                            type="text" 
                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-blue-500 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                            value={editValue}
                            onChange={(e) => onEditValueChange?.(e.target.value)}
                            placeholder="Nombre de la validación..."
                            autoFocus
                        />
                        <button 
                            onClick={onSaveEdit}
                            disabled={isSaving || !editValue?.trim() || editValue?.trim() === (title || `Cita para ${companyName}`).trim()}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                            title="Guardar"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                        <button 
                            onClick={onCancelEdit}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center group gap-2">
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {title || `Cita para ${companyName}`}
                        </h2>
                        {onEditTitle && (
                            <button
                                onClick={onEditTitle}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                title="Editar título"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider ml-4 shrink-0 mt-1.5">
                {status.replace(/_/g, ' ')}
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

        {(onAction && actionLabel) || (onSecondaryAction && secondaryActionLabel) ? (
            <div className="mt-2 flex justify-end gap-3">
                {onSecondaryAction && secondaryActionLabel && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!secondaryActionDisabled) onSecondaryAction(e);
                        }}
                        disabled={secondaryActionDisabled}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border
                            ${secondaryActionDisabled 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                    >
                        {secondaryActionLabel}
                    </button>
                )}
                {onAction && actionLabel && (
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
                )}
            </div>
        ) : null}
      </div>
    </div>
  );
}
