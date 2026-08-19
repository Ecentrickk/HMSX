import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { HOSPITAL_BRANDING } from '@/shared/branding';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#0072ff', paddingBottom: 15, marginBottom: 20 },
  headerLeft: { flex: 1 },
  hospitalName: { fontSize: 24, fontWeight: 'bold', color: '#0072ff', marginBottom: 4 },
  tagline: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  address: { fontSize: 9, color: '#4b5563' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, textTransform: 'uppercase', color: '#1f2937' },
  row: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 5 },
  label: { width: 150, fontSize: 11, fontWeight: 'bold', color: '#4b5563' },
  value: { flex: 1, fontSize: 12, color: '#111827' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 15 },
  signatureBox: { width: 200, alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10, color: '#4b5563' },
  watermark: { position: 'absolute', top: 300, left: 150, fontSize: 60, color: '#f3f4f6', opacity: 0.5, transform: 'rotate(-45deg)', zIndex: -1 }
});

export const BirthCertificatePDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.watermark}>OFFICIAL COPY</Text>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.tagline}>{HOSPITAL_BRANDING.tagline}</Text>
          <Text style={styles.address}>{HOSPITAL_BRANDING.address}</Text>
          <Text style={styles.address}>Phone: {HOSPITAL_BRANDING.phone} | Email: {HOSPITAL_BRANDING.email}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Certificate No: {data.certificateNumber}</Text>
          <Text style={{ fontSize: 10, marginTop: 4 }}>Date of Issue: {new Date(data.issuedDate).toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={styles.title}>Certificate of Birth</Text>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Name of Child:</Text>
          <Text style={styles.value}>{data.newbornName || 'UNNAMED'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sex:</Text>
          <Text style={styles.value}>{data.newbornGender}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date of Birth:</Text>
          <Text style={styles.value}>{new Date(data.birthTime).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time of Birth:</Text>
          <Text style={styles.value}>{new Date(data.birthTime).toLocaleTimeString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Birth Weight:</Text>
          <Text style={styles.value}>{data.birthWeight ? `${data.birthWeight} kg` : 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Place of Birth:</Text>
          <Text style={styles.value}>{data.placeOfBirth || HOSPITAL_BRANDING.name}</Text>
        </View>
        
        <View style={{ marginTop: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }} />
        
        <View style={styles.row}>
          <Text style={styles.label}>Name of Mother:</Text>
          <Text style={styles.value}>{data.motherName || data.patient.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Name of Father:</Text>
          <Text style={styles.value}>{data.fatherName || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.signatureBox}>
          {data.isSigned && (
            <Text style={{ fontFamily: 'Times-Italic', fontSize: 24, color: '#000', marginBottom: -25 }}>
              {data.signedBy?.name}
            </Text>
          )}
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Attending Physician Signature</Text>
          <Text style={{ fontSize: 9, marginTop: 4, color: '#6b7280' }}>
            {data.isSigned ? `Signed by ${data.signedBy?.name} on ${new Date(data.updatedAt).toLocaleDateString()}` : 'Not digitally signed'}
          </Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Hospital Administrator</Text>
        </View>
      </View>
    </Page>
  </Document>
);
