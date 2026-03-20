'use client';

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import VisitEvaluationPDF from './VisitEvaluationPDF';
import { Appointment } from '@/app/types';

interface PDFDownloadButtonProps {
    appointment: Appointment;
    formData: Record<string, any>;
    totalSuccessRate: number;
    recipientNameStr?: string;
    engineerNameStr?: string;
}

export default function PDFDownloadButton({ appointment, formData, totalSuccessRate, recipientNameStr, engineerNameStr }: PDFDownloadButtonProps) {
    // Only render on client to avoid hydration mismatch
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <button className="px-6 py-2 bg-gray-200 text-gray-400 font-bold rounded-lg uppercase text-sm cursor-not-allowed">
                Cargando PDF...
            </button>
        );
    }

    return (
        <PDFDownloadLink
            document={
                <VisitEvaluationPDF 
                    appointment={appointment} 
                    formData={formData} 
                    totalSuccessRate={totalSuccessRate} 
                    recipientNameStr={recipientNameStr}
                    engineerNameStr={engineerNameStr}
                />
            }
            fileName={`Evaluacion_${(recipientNameStr || appointment.companyName || 'Empresa').replace(/\s+/g, '_')}_${new Date(appointment.date).toISOString().split('T')[0]}.pdf`}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-all uppercase text-sm inline-flex items-center justify-center gap-2"
        >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar Diagnostico PDF
        </PDFDownloadLink>
    );
}
