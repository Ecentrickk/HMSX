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
  row: { flexDirection: 'row', marginBottom: 6 },
  col1: { width: '30%', fontWeight: 'bold', fontSize: 10, color: '#6b7280' },
  col2: { width: '70%', fontSize: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4, marginBottom: 6 },
  th: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', flex: 1 },
  td: { fontSize: 9, flex: 1 },
});

export const FullRecordPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.tagline}>{HOSPITAL_BRANDING.tagline}</Text>
          <Text style={styles.address}>{HOSPITAL_BRANDING.address}</Text>
        </View>
      </View>

      <Text style={styles.title}>Comprehensive Patient Record</Text>

      <Text style={styles.sectionTitle}>Demographics</Text>
      <View style={styles.row}><Text style={styles.col1}>Name:</Text><Text style={styles.col2}>{data.patient.name}</Text></View>
      <View style={styles.row}><Text style={styles.col1}>Phone:</Text><Text style={styles.col2}>{data.patient.phone}</Text></View>
      <View style={styles.row}><Text style={styles.col1}>DOB / Age:</Text><Text style={styles.col2}>{new Date(data.patient.dateOfBirth).toLocaleDateString()} ({data.age} yrs)</Text></View>
      <View style={styles.row}><Text style={styles.col1}>Gender / Blood Group:</Text><Text style={styles.col2}>{data.patient.gender} / {data.patient.bloodGroup || 'N/A'}</Text></View>

      <Text style={styles.sectionTitle}>Recent Appointments</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.th}>DATE</Text>
        <Text style={styles.th}>DOCTOR</Text>
        <Text style={styles.th}>TYPE</Text>
        <Text style={styles.th}>STATUS</Text>
      </View>
      {data.appointments.map((a: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.td}>{new Date(a.scheduledAt).toLocaleDateString()}</Text>
          <Text style={styles.td}>Dr. {a.doctor.name}</Text>
          <Text style={styles.td}>{a.type}</Text>
          <Text style={styles.td}>{a.status}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Active Prescriptions</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.th}>DATE</Text>
        <Text style={styles.th}>DOCTOR</Text>
        <Text style={styles.th}>MEDICATIONS (QTY)</Text>
      </View>
      {data.prescriptions.map((p: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.td}>{new Date(p.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.td}>Dr. {p.doctor.name}</Text>
          <Text style={styles.td}>{p.medications.length} items</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Recent Lab Reports</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.th}>DATE</Text>
        <Text style={styles.th}>TITLE</Text>
        <Text style={styles.th}>DOCTOR</Text>
      </View>
      {data.reports.map((r: any, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.td}>{new Date(r.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.td}>{r.title}</Text>
          <Text style={styles.td}>Dr. {r.doctor.name}</Text>
        </View>
      ))}

      <Text style={{ position: 'absolute', bottom: 30, left: 40, fontSize: 8, color: '#9ca3af' }}>
        Generated on {new Date().toLocaleString()} by {HOSPITAL_BRANDING.name}
      </Text>

    </Page>
  </Document>
);
