import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { HOSPITAL_BRANDING } from '@/shared/branding';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1f2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#0072ff', paddingBottom: 15, marginBottom: 20 },
  headerLeft: { flex: 1 },
  hospitalName: { fontSize: 24, fontWeight: 'bold', color: '#0072ff', marginBottom: 4 },
  tagline: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  address: { fontSize: 9, color: '#4b5563' },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', color: '#1f2937' },
  
  // Patient Info section
  infoBox: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, padding: 10, marginBottom: 20 },
  infoItem: { width: '50%', marginBottom: 8 },
  infoLabel: { fontSize: 9, color: '#6b7280', fontWeight: 'bold' },
  infoValue: { fontSize: 10, color: '#111827', marginTop: 2 },
  
  // Sections
  sectionTitle: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: 6, marginBottom: 10, marginTop: 15 },
  text: { fontSize: 10, lineHeight: 1.5, marginBottom: 10 },
  
  // Tables
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4, marginBottom: 6 },
  th: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', flex: 1 },
  td: { fontSize: 9, flex: 1 },
  
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 15 },
  signatureBox: { width: 200, alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10, color: '#4b5563' }
});

export const DischargeSummaryPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.tagline}>{HOSPITAL_BRANDING.tagline}</Text>
          <Text style={styles.address}>{HOSPITAL_BRANDING.address}</Text>
          <Text style={styles.address}>Phone: {HOSPITAL_BRANDING.phone}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Discharge Summary</Text>
          <Text style={{ fontSize: 10, marginTop: 4 }}>Date: {new Date().toLocaleDateString()}</Text>
          <Text style={{ fontSize: 10 }}>Admission No: {data.admission.uhid}</Text>
        </View>
      </View>

      <Text style={styles.title}>Discharge Summary</Text>

      <View style={styles.infoBox}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Patient Name</Text>
          <Text style={styles.infoValue}>{data.patient.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Age / Sex</Text>
          <Text style={styles.infoValue}>{new Date().getFullYear() - new Date(data.patient.dateOfBirth).getFullYear()} Yrs / {data.patient.gender}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Date of Admission</Text>
          <Text style={styles.infoValue}>{new Date(data.admission.admissionDate).toLocaleString()}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Date of Discharge</Text>
          <Text style={styles.infoValue}>{new Date(data.admission.dischargeDate || Date.now()).toLocaleString()}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Attending Doctor</Text>
          <Text style={styles.infoValue}>Dr. {data.admission.attendingDoctor?.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Discharge Type</Text>
          <Text style={styles.infoValue}>{data.admission.dischargeType}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Diagnosis at Discharge</Text>
      <Text style={styles.text}>{data.diagnoses?.map((d: any) => d.diagnosisString).join(', ') || 'See clinical notes'}</Text>

      <Text style={styles.sectionTitle}>Clinical Summary & Course in Hospital</Text>
      <Text style={styles.text}>{data.admission.dischargeSummary || 'No summary provided.'}</Text>

      {data.prescriptions && data.prescriptions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Medications at Discharge</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>MEDICATION</Text>
            <Text style={styles.th}>DOSAGE</Text>
            <Text style={styles.th}>FREQUENCY</Text>
            <Text style={styles.th}>DURATION</Text>
          </View>
          {data.prescriptions[0].medications.map((m: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.td}>{m.name}</Text>
              <Text style={styles.td}>{m.dosage}</Text>
              <Text style={styles.td}>{m.frequency}</Text>
              <Text style={styles.td}>{m.duration}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
      <Text style={styles.text}>
        {data.admission.referredTo ? `Referred to: ${data.admission.referredTo}\n` : ''}
        Please schedule a follow-up appointment in {data.followUpDays || '7'} days.
        In case of emergency, please visit the emergency department immediately.
      </Text>

      <View style={styles.footer}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Attending Physician Signature</Text>
          <Text style={{ fontSize: 9, marginTop: 4, color: '#6b7280' }}>
            Dr. {data.admission.attendingDoctor?.name}
          </Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Patient / Relative Signature</Text>
        </View>
      </View>
      
    </Page>
  </Document>
);
