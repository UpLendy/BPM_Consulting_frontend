/**
 * Estilos específicos para la generación de PDFs de Actas de Asesoría.
 * Estos estilos están optimizados para renderizado con html2canvas y jsPDF en formato A4.
 */

export const PDF_STYLES = `
  /* Reseteo y Base */
  * { 
    box-sizing: border-box !important; 
    -webkit-print-color-adjust: exact !important;
    margin: 0;
    padding: 0;
  }
  
  body { 
    background: #ffffff !important; 
    font-family: 'Helvetica', 'Arial', sans-serif !important;
    width: 794px !important; /* Ancho estándar A4 a 96dpi */
  }

  /* Contenedor Principal (Simulando Hoja A4) */
  .pdf-container {
    padding: 60px 50px !important;
    background-color: #ffffff !important;
  }

  /* Tipografía Escalada */
  .pdf-title {
    font-size: 24px !important;
    font-weight: 900 !important;
    color: #1e3a8a !important;
    text-transform: uppercase !important;
    margin-bottom: 8px !important;
    letter-spacing: -0.5px !important;
  }

  .pdf-subtitle {
    font-size: 10px !important;
    font-weight: 700 !important;
    color: #9ca3af !important;
    text-transform: uppercase !important;
    margin-bottom: 40px !important;
  }

  /* Grid de Información (2 Columnas) */
  .pdf-info-grid {
    display: flex !important;
    flex-wrap: wrap !important;
    margin-bottom: 40px !important;
    border-bottom: 1px solid #f3f4f6 !important;
    padding-bottom: 20px !important;
  }

  .pdf-info-item {
    width: 50% !important;
    padding: 8px 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .pdf-label {
    font-size: 9px !important;
    font-weight: 900 !important;
    color: #6b7280 !important;
    text-transform: uppercase !important;
    margin-bottom: 2px !important;
  }

  .pdf-value {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #111827 !important;
  }

  /* Secciones de Contenido */
  .pdf-section {
    margin-bottom: 30px !important;
  }

  .pdf-section-title {
    font-size: 10px !important;
    font-weight: 900 !important;
    color: #1e3a8a !important;
    text-transform: uppercase !important;
    border-left: 3px solid #1e3a8a !important;
    padding-left: 10px !important;
    margin-bottom: 12px !important;
  }

  .pdf-body-text {
    font-size: 11px !important;
    line-height: 1.6 !important;
    color: #374151 !important;
    white-space: pre-wrap !important;
  }

  /* Bloque de Soluciones */
  .pdf-solutions-container {
    background-color: #f9fafb !important;
    border-radius: 12px !important;
    padding: 20px !important;
    margin-bottom: 30px !important;
  }

  .pdf-solution-item {
    display: flex !important;
    gap: 12px !important;
    margin-bottom: 15px !important;
    align-items: flex-start !important;
  }

  /* Burbuja de Número - Forzado de centrado superior para html2canvas */
  .pdf-number-bubble {
    width: 26px !important;
    height: 26px !important;
    background-color: #1e3a8a !important;
    color: #ffffff !important;
    border-radius: 999px !important;
    font-size: 10px !important;
    font-weight: 900 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    padding-bottom: 4px !important; /* COMPENSACIÓN: Empuja el número hacia arriba */
    margin: 0 !important;
    line-height: 1 !important;
  }

  .pdf-solution-content {
    display: flex !important;
    flex-direction: column !important;
  }

  .pdf-solution-label {
    font-size: 10px !important;
    font-weight: 900 !important;
    color: #111827 !important;
    text-transform: uppercase !important;
    margin-bottom: 4px !important;
  }

  /* Imágenes y Evidencia - Centrada y reducida */
  .pdf-evidence-img {
    width: 35% !important;
    max-height: 220px !important;
    object-fit: contain !important;
    border-radius: 12px !important;
    margin: 20px auto !important; /* Margen vertical y centrado horizontal */
    display: block !important;
  }

  /* Firmas - Con mayor margen superior y protección contra corte */
  .pdf-signature-area {
    margin-top: 80px !important; /* Más aire entre contenido/foto y firma */
    padding-top: 30px !important;
    border-top: 1px solid #f3f4f6 !important;
    text-align: center !important;
    page-break-inside: avoid !important; /* Evita que se corte entre páginas */
    break-inside: avoid !important; /* Estándar moderno */
    min-height: 150px !important; /* Altura mínima para forzar salto si no cabe */
  }

  .pdf-signature-img {
    max-height: 60px !important;
    margin: 0 auto 10px auto !important;
    display: block !important;
  }

  .pdf-signature-line {
    width: 180px !important;
    border-top: 1px solid #111827 !important;
    margin: 0 auto !important;
  }

  .pdf-signature-text {
    font-size: 8px !important;
    font-weight: 900 !important;
    color: #9ca3af !important;
    text-transform: uppercase !important;
    margin-top: 8px !important;
    letter-spacing: 1px !important;
  }

  /* Ocultar elementos innecesarios */
  [data-html2canvas-ignore="true"], button {
    display: none !important;
  }
`;
