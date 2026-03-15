import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { SECTIONS } from '@/app/constants/visitSections';
import { Appointment } from '@/app/types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold'
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 10,
    textAlign: 'center',
    color: '#4B5563',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10
  },
  sectionContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#E5E7EB',
    padding: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#9CA3AF'
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#9CA3AF'
  },
  tableRow: {
    flexDirection: 'row',
  },
  // Table columns widths
  colNum: { width: '8%' },
  colReq: { width: '47%' },
  colC: { width: '5%' },
  colCP: { width: '5%' },
  colNC: { width: '5%' },
  colNA: { width: '5%' },
  colHallazgos: { width: '25%' },

  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#9CA3AF',
    padding: 4,
    justifyContent: 'center'
  },
  tableColCenter: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#9CA3AF',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center'
  },
  tableCell: {
    fontSize: 8,
  },
  checkMark: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#111827'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  summaryContainer: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  summaryText: {
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A'
  }
});

interface VisitEvaluationPDFProps {
  appointment: Appointment;
  formData: Record<string, any>;
  totalSuccessRate: number;
}

const VisitEvaluationPDF: React.FC<VisitEvaluationPDFProps> = ({ appointment, formData, totalSuccessRate }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>DIAGNÓSTICO DE ASESORÍA PARA ACOMPAÑAMIENTO</Text>
          <Text style={styles.subtitle}>BPM CONSULTING</Text>
          
          <View style={styles.detailsRow}>
            <Text>Empresa: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{appointment.companyName}</Text></Text>
            <Text>Fecha: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{new Date(appointment.date).toLocaleDateString()}</Text></Text>
          </View>
          <View style={styles.detailsRow}>
            <Text>Ingeniero: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{appointment.engineerName}</Text></Text>
            <Text>Hora: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{appointment.startTime}</Text></Text>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.id} style={styles.sectionContainer} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, styles.colNum]}>
                  <Text style={styles.tableCellHeader}>Numeral</Text>
                </View>
                <View style={[styles.tableColHeader, styles.colReq]}>
                  <Text style={styles.tableCellHeader}>Requisito</Text>
                </View>
                <View style={[styles.tableColHeader, styles.colC]}>
                  <Text style={styles.tableCellHeader}>C</Text>
                </View>
                <View style={[styles.tableColHeader, styles.colCP]}>
                  <Text style={styles.tableCellHeader}>CP</Text>
                </View>
                <View style={[styles.tableColHeader, styles.colNC]}>
                  <Text style={styles.tableCellHeader}>NC</Text>
                </View>
                <View style={[styles.tableColHeader, styles.colNA]}>
                  <Text style={styles.tableCellHeader}>NA</Text>
                </View>
                <View style={[styles.tableColHeader, styles.colHallazgos]}>
                  <Text style={styles.tableCellHeader}>Hallazgos</Text>
                </View>
              </View>

              {/* Table Rows */}
              {section.subsections.flatMap((sub) =>
                sub.items.map((item) => {
                  const answer = formData[item.id] || {};
                  const score = answer.q1 ?? '';
                  const hallazgos = answer.hallazgos || '';

                  return (
                    <View key={item.id} style={styles.tableRow} wrap={false}>
                      <View style={[styles.tableColCenter, styles.colNum]}>
                        <Text style={styles.tableCellHeader}>{item.numeral}</Text>
                      </View>
                      <View style={[styles.tableCol, styles.colReq]}>
                        <Text style={styles.tableCell}>{item.text}</Text>
                      </View>
                      
                      <View style={[styles.tableColCenter, styles.colC]}>
                        <Text style={styles.checkMark}>{score === '2' ? 'X' : ''}</Text>
                      </View>
                      <View style={[styles.tableColCenter, styles.colCP]}>
                        <Text style={styles.checkMark}>{score === '1' ? 'X' : ''}</Text>
                      </View>
                      <View style={[styles.tableColCenter, styles.colNC]}>
                        <Text style={styles.checkMark}>{score === '0' || score === 'I' ? 'X' : ''}</Text>
                      </View>
                      <View style={[styles.tableColCenter, styles.colNA]}>
                        <Text style={styles.checkMark}>{score === 'NA' ? 'X' : ''}</Text>
                      </View>
                      
                      <View style={[styles.tableCol, styles.colHallazgos]}>
                        <Text style={styles.tableCell}>{hallazgos}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ))}

        <View style={styles.summaryContainer} wrap={false}>
          <Text style={styles.summaryTitle}>Resumen de la Auditoría</Text>
          <Text style={styles.summaryText}>Porcentaje de Cumplimiento: <Text style={styles.summaryValue}>{totalSuccessRate.toFixed(1)}%</Text></Text>
          <Text style={styles.summaryText}>Concepto: <Text style={styles.summaryValue}>{totalSuccessRate >= 80 ? 'FAVORABLE' : totalSuccessRate >= 60 ? 'FAVORABLE CON REQUER. ' : 'DESFAVORABLE'}</Text></Text>
        </View>

        <Text style={styles.footer} fixed>
          Generado el {new Date().toLocaleDateString()} a través de BPM Consulting - Página {""}
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
        </Text>
      </Page>
    </Document>
  );
};

export default VisitEvaluationPDF;
