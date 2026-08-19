import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { HOSPITAL_BRANDING } from '@/shared/branding';

// Tag size: 3.5 x 2 inches (standard ID badge / label size)
// 1 inch = 72 pt, so 3.5x2 is 252x144 pt
const styles = StyleSheet.create({
  page: { 
    width: '3.5in', height: '2in',
    padding: 10,
    fontFamily: 'Helvetica', 
    backgroundColor: '#ffffff',
    flexDirection: 'row'
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
    borderRight: '1px solid #e5e7eb',
    justifyContent: 'center'
  },
  rightCol: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8
  },
  hospitalName: { fontSize: 8, fontWeight: 'bold', color: '#0072ff', marginBottom: 6 },
  patientName: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  label: { fontSize: 7, color: '#6b7280', width: 35 },
  value: { fontSize: 7, color: '#111827', fontWeight: 'bold' },
  qrImage: { width: 70, height: 70, marginBottom: 4 },
  qrText: { fontSize: 6, color: '#6b7280', textAlign: 'center' }
});

export const PatientTagPDF = ({ data, qrCodeBase64 }: { data: any, qrCodeBase64: string }) => {
  // Calculate Age
  const birthDate = new Date(data.dateOfBirth);
  const age = Math.floor((new Date().getTime() - birthDate.getTime()) / 3.15576e+10);

  return (
    <Document>
      <Page size={[252, 144]} style={styles.page}>
        <View style={styles.leftCol}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.patientName}>{data.name}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>AGE</Text>
            <Text style={styles.value}>{age} YRS</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>BLOOD</Text>
            <Text style={styles.value}>{data.bloodGroup || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>EMERGENCY</Text>
            <Text style={styles.value}>{data.emergencyPhone || data.emergencyContact || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={qrCodeBase64} style={styles.qrImage} />
          <Text style={styles.qrText}>SCAN FOR RECORD</Text>
        </View>
      </Page>
    </Document>
  );
};
