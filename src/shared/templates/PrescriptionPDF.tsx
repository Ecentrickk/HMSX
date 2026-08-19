import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { HOSPITAL_BRANDING } from '@/shared/branding';

// You could register fonts here if needed
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0072ff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  address: {
    fontSize: 9,
    color: '#4b5563',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  // In a real scenario, use Image with the logoUrl
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#0072ff',
    borderRadius: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 25,
  },
  infoCol: {
    flexDirection: 'column',
    gap: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 10,
  },
  medicationRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  medName: {
    flex: 2,
    fontWeight: 'bold',
  },
  medDosage: {
    flex: 1,
  },
  medFrequency: {
    flex: 1,
  },
  medDuration: {
    flex: 1,
  },
  notes: {
    marginTop: 20,
    fontSize: 10,
    fontStyle: 'italic',
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
  },
  signatureBox: {
    width: 150,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: '#4b5563',
  }
});

interface PrescriptionData {
  id: string;
  createdAt: Date;
  patient: { name: string; age: number; gender: string };
  doctor: { name: string; department?: string };
  medications: any[];
  notes?: string;
}

export const PrescriptionPDF = ({ data }: { data: PrescriptionData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.tagline}>{HOSPITAL_BRANDING.tagline}</Text>
          <Text style={styles.address}>{HOSPITAL_BRANDING.address}</Text>
          <Text style={styles.address}>Ph: {HOSPITAL_BRANDING.phone} | {HOSPITAL_BRANDING.email}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.logoPlaceholder} />
        </View>
      </View>

      <Text style={styles.title}>Prescription</Text>

      {/* Patient Info */}
      <View style={styles.patientInfo}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Patient Name</Text>
          <Text style={styles.infoValue}>{data.patient.name}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Age / Gender</Text>
          <Text style={styles.infoValue}>{data.patient.age} / {data.patient.gender}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{new Date(data.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Prescription ID</Text>
          <Text style={styles.infoValue}>{data.id.slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      {/* Medications */}
      <Text style={styles.sectionTitle}>Rx - Medications</Text>
      
      <View style={{ ...styles.medicationRow, borderBottomWidth: 2, borderBottomColor: '#000' }}>
        <Text style={{ ...styles.medName, fontSize: 10, color: '#6b7280' }}>MEDICINE</Text>
        <Text style={{ ...styles.medDosage, fontSize: 10, color: '#6b7280' }}>DOSAGE</Text>
        <Text style={{ ...styles.medFrequency, fontSize: 10, color: '#6b7280' }}>FREQUENCY</Text>
        <Text style={{ ...styles.medDuration, fontSize: 10, color: '#6b7280' }}>DURATION</Text>
      </View>

      {data.medications.map((med, idx) => (
        <View key={idx} style={styles.medicationRow}>
          <View style={styles.medName}>
            <Text>{med.name}</Text>
            {med.instructions && <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{med.instructions}</Text>}
          </View>
          <Text style={styles.medDosage}>{med.dosage}</Text>
          <Text style={styles.medFrequency}>{med.frequency}</Text>
          <Text style={styles.medDuration}>{med.duration}</Text>
        </View>
      ))}

      {data.notes && (
        <Text style={styles.notes}>Notes: {data.notes}</Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>Generated by H1MS System</Text>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>{new Date().toLocaleString()}</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Dr. {data.doctor.name}</Text>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>{data.doctor.department || 'Medical Officer'}</Text>
        </View>
      </View>

    </Page>
  </Document>
);
