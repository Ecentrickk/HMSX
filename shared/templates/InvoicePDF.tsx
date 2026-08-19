import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { HOSPITAL_BRANDING } from '@/shared/branding';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 15, marginBottom: 20 },
  headerLeft: { flex: 1 },
  hospitalName: { fontSize: 20, fontWeight: 'bold', color: '#0072ff', marginBottom: 4 },
  tagline: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  address: { fontSize: 9, color: '#4b5563' },
  headerRight: { width: 60, alignItems: 'flex-end' },
  logoPlaceholder: { width: 50, height: 50, backgroundColor: '#0072ff', borderRadius: 8 },
  title: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  patientInfo: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 25 },
  infoCol: { flexDirection: 'column', gap: 4 },
  infoLabel: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase' },
  infoValue: { fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'center' },
  col4: { flex: 1, textAlign: 'right' },
  col5: { flex: 1.5, textAlign: 'right' },
  totals: { marginTop: 15, alignSelf: 'flex-end', width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#000', marginTop: 4 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 15 },
  signatureBox: { width: 150, alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 },
  signatureText: { fontSize: 10, color: '#4b5563' }
});

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  patient: { name: string; phone: string };
  generatedBy: { name: string };
  items: any[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

export const InvoicePDF = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospitalName}>{HOSPITAL_BRANDING.name}</Text>
          <Text style={styles.tagline}>{HOSPITAL_BRANDING.tagline}</Text>
          <Text style={styles.address}>{HOSPITAL_BRANDING.address}</Text>
          <Text style={styles.address}>Ph: {HOSPITAL_BRANDING.phone} | {HOSPITAL_BRANDING.email}</Text>
          {HOSPITAL_BRANDING.gstin && <Text style={styles.address}>GSTIN: {HOSPITAL_BRANDING.gstin}</Text>}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.logoPlaceholder} />
        </View>
      </View>

      <Text style={styles.title}>Tax Invoice</Text>

      <View style={styles.patientInfo}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Patient Name</Text>
          <Text style={styles.infoValue}>{data.patient.name}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{data.patient.phone}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{new Date(data.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Invoice #</Text>
          <Text style={styles.infoValue}>{data.invoiceNumber || data.id.slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Charges</Text>
      
      <View style={styles.tableHeader}>
        <Text style={{ ...styles.col1, fontSize: 10, color: '#6b7280' }}>SERVICE</Text>
        <Text style={{ ...styles.col2, fontSize: 10, color: '#6b7280' }}>RATE (₹)</Text>
        <Text style={{ ...styles.col3, fontSize: 10, color: '#6b7280' }}>QTY</Text>
        <Text style={{ ...styles.col4, fontSize: 10, color: '#6b7280' }}>TAX (₹)</Text>
        <Text style={{ ...styles.col5, fontSize: 10, color: '#6b7280' }}>TOTAL (₹)</Text>
      </View>

      {data.items.map((item, idx) => (
        <View key={idx} style={styles.tableRow}>
          <View style={styles.col1}>
            <Text style={{ fontWeight: 'bold' }}>{item.serviceName}</Text>
          </View>
          <Text style={styles.col2}>{item.unitPrice.toFixed(2)}</Text>
          <Text style={styles.col3}>{item.quantity}</Text>
          <Text style={styles.col4}>{item.taxAmount.toFixed(2)}</Text>
          <Text style={{ ...styles.col5, fontWeight: 'bold' }}>{item.totalAmount.toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={{ color: '#4b5563' }}>Subtotal:</Text>
          <Text>₹{data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={{ color: '#4b5563' }}>Discount:</Text>
          <Text>₹{data.discount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={{ color: '#4b5563' }}>Tax:</Text>
          <Text>₹{data.taxTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.grandTotal}>
          <Text style={{ fontWeight: 'bold' }}>Grand Total:</Text>
          <Text style={{ fontWeight: 'bold' }}>₹{data.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={{ ...styles.totalRow, marginTop: 10 }}>
          <Text style={{ color: '#4b5563', fontSize: 9 }}>Amount Paid:</Text>
          <Text style={{ fontSize: 9 }}>₹{data.paidAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={{ color: '#4b5563', fontSize: 9 }}>Status:</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{data.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>Generated by H1MS System</Text>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>{new Date().toLocaleString()}</Text>
        </View>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{data.generatedBy.name}</Text>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>Authorized Signatory</Text>
        </View>
      </View>

    </Page>
  </Document>
);
