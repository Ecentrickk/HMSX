import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { HOSPITAL_BRANDING } from '@/shared/branding';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 15, marginBottom: 20 },
  headerLeft: { flex: 1 },
  hospitalName: { fontSize: 20, fontWeight: 'bold', color: '#0072ff', marginBottom: 4 },
  tagline: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  address: { fontSize: 9, color: '#4b5563' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: 6, marginBottom: 10, marginTop: 15 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4, marginBottom: 6 },
  th: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', flex: 1 },
  td: { fontSize: 9, flex: 1 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 15 },
  signatureBox: { width: 150, alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10, color: '#4b5563' }
});

export const HandoffPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.tagline}>{HOSPITAL_BRANDING.tagline}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Date: {new Date().toLocaleDateString()}</Text>
          <Text style={{ fontSize: 10 }}>Time: {new Date().toLocaleTimeString()}</Text>
          <Text style={{ fontSize: 10 }}>Prepared by: {data.nurseName}</Text>
        </View>
      </View>

      <Text style={styles.title}>Nurse Shift Handoff</Text>

      <Text style={styles.sectionTitle}>Occupied Beds ({data.occupiedBeds?.length || 0})</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.th}>WARD/BED</Text>
        <Text style={styles.th}>PATIENT NAME</Text>
        <Text style={styles.th}>TYPE</Text>
        <Text style={styles.th}>CRITICAL ALERTS</Text>
        <Text style={styles.th}>NOTES / VITALS</Text>
      </View>
      {data.occupiedBeds?.map((b: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.td}>{b.ward?.name} - {b.bedNumber}</Text>
          <Text style={styles.td}>{b.patient?.name}</Text>
          <Text style={styles.td}>{b.patient?.admissions?.[0]?.admissionType || 'IPD'}</Text>
          <Text style={{...styles.td, color: '#ef4444'}}>
            {b.patient?.medicalHistories?.filter((h:any) => h.category === 'ALLERGY' || h.category === 'CHRONIC_CONDITION').map((h:any) => h.title).join(', ') || 'None'}
          </Text>
          <Text style={styles.td}></Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>New Admissions (Since Last Handoff)</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.th}>TIME</Text>
        <Text style={styles.th}>PATIENT</Text>
        <Text style={styles.th}>TYPE / WARD</Text>
        <Text style={styles.th}>DIAGNOSIS / REASON</Text>
      </View>
      {data.newAdmissions?.map((a: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.td}>{new Date(a.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.td}>{a.patient?.name}</Text>
          <Text style={styles.td}>{a.admissionType} {a.ward?.name ? `- ${a.ward.name}` : ''}</Text>
          <Text style={styles.td}>{a.notes || 'N/A'}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Pending Medications ({data.pendingMeds?.length || 0})</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.th}>TIME</Text>
        <Text style={styles.th}>PATIENT</Text>
        <Text style={styles.th}>MEDICATION</Text>
        <Text style={styles.th}>DOSAGE</Text>
      </View>
      {data.pendingMeds?.map((m: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.td}>{new Date(m.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.td}>{m.patient?.name}</Text>
          <Text style={styles.td}>{m.medicationName}</Text>
          <Text style={styles.td}>{m.dosage}</Text>
        </View>
      ))}

      <View style={{ ...styles.sectionTitle, marginTop: 20 }}><Text>General Shift Notes</Text></View>
      <View style={{ minHeight: 80, border: '1px solid #e5e7eb', borderRadius: 4, padding: 10 }}>
        {/* Empty area for manual notes */}
      </View>

      <View style={styles.footer}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Relinquishing Nurse Signature</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Receiving Nurse Signature</Text>
        </View>
      </View>

    </Page>
  </Document>
);
