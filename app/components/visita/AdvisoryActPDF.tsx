import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Appointment } from '@/app/types';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 9,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 20,
    letterSpacing: 1
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  infoItem: {
    width: '50%',
    marginBottom: 10,
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold'
  },
  value: {
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold'
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a8a',
    paddingLeft: 8,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  solutionsContainer: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  solutionItem: {
    marginBottom: 12,
  },
  solutionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  evidenceContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  evidencePhoto: {
    width: '100%',
    maxHeight: 250,
    objectFit: 'contain',
    borderRadius: 8,
  },
  signatureArea: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  signatureImg: {
    maxHeight: 70,
    maxWidth: 200,
    marginBottom: 5,
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: '#111827',
  },
  signatureText: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginTop: 5,
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  }
});

interface AdvisoryActPDFProps {
  appointment: Appointment;
  formData: any;
  engineerName: string;
}

const AdvisoryActPDF: React.FC<AdvisoryActPDFProps> = ({ appointment, formData, engineerName }) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <Document title={`Acta de Asesoría - ${appointment.companyName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Acta de Asesoría</Text>
          <Text style={styles.subtitle}>BPM CONSULTING - Gestión de Calidad e Inocuidad</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Empresa</Text>
              <Text style={styles.value}>{appointment.companyName || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Solicitante</Text>
              <Text style={styles.value}>{formData.representativeName || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Asesor Asignado</Text>
              <Text style={styles.value}>{engineerName || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Fecha de Visita</Text>
              <Text style={styles.value}>{formatDate(appointment.date)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Tiempo Ejecutado</Text>
              <Text style={styles.value}>{formatMinutes(formData.executedTimeMinutes)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Hora de Inicio</Text>
              <Text style={styles.value}>{appointment.startTime || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temas Tratados</Text>
          <Text style={styles.bodyText}>{formData.topicsCovered || 'No se registraron temas específicos.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soluciones Entregadas</Text>
          <View style={styles.solutionsContainer}>
            <View style={styles.solutionItem}>
              <Text style={styles.solutionLabel}>1. Infraestructura y Diseño Sanitario</Text>
              <Text style={styles.bodyText}>{formData.solutions.infrastructure || 'N/A'}</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={styles.solutionLabel}>2. Control de Inocuidad</Text>
              <Text style={styles.bodyText}>{formData.solutions.inocuity || 'N/A'}</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={styles.solutionLabel}>3. Personal y Dotación</Text>
              <Text style={styles.bodyText}>{formData.solutions.staff || 'N/A'}</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={styles.solutionLabel}>4. Control de Calidad y Análisis</Text>
              <Text style={styles.bodyText}>{formData.solutions.quality || 'N/A'}</Text>
            </View>
            <View style={styles.solutionItem}>
              <Text style={styles.solutionLabel}>5. Gestión de Documentación y Programas</Text>
              <Text style={styles.bodyText}>{formData.solutions.documentation || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de la Asesoría</Text>
          <Text style={styles.bodyText}>{formData.summary || 'N/A'}</Text>
        </View>

        {formData.evidencePhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencia Fotográfica</Text>
            <View style={styles.evidenceContainer}>
              <Image src={formData.evidencePhoto} style={styles.evidencePhoto} />
            </View>
          </View>
        )}

        <View style={styles.signatureArea} wrap={false}>
          {formData.signature ? (
            <>
              <Image src={formData.signature} style={styles.signatureImg} />
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Firma de Conformidad</Text>
            </>
          ) : (
            <>
              <View style={[styles.signatureLine, { marginTop: 40 }]} />
              <Text style={styles.signatureText}>Pendiente de Firma</Text>
            </>
          )}
        </View>

        <Text style={styles.footer} fixed>
          Este documento es una constancia legal de asesoría técnica de BPM CONSULTING. - Generado el {new Date().toLocaleDateString()} - Página {' '}
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
        </Text>
      </Page>
    </Document>
  );
};

export default AdvisoryActPDF;
