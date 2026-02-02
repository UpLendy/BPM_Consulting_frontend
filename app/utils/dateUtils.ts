/**
 * Procesa una fecha del backend para que se muestre correctamente en la zona horaria local
 * sin desplazamientos de día (evita el error de mostrar un día antes).
 */
export function formatLongDate(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '';

    // Extraemos solo el componente de fecha YYYY-MM-DD
    const dateStr = typeof dateInput === 'string' ? dateInput.split('T')[0] : dateInput.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);

    // Creamos el objeto fecha usando el constructor local (año, mes-1, día)
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export function formatShortDate(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '';
    const dateStr = typeof dateInput === 'string' ? dateInput.split('T')[0] : dateInput.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
