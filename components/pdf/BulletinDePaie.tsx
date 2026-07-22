import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed (using default for now)

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  republique: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  devise: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ecoleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  periodeText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  employeeBanner: {
    backgroundColor: '#1E3A8A', // dark blue
    color: 'white',
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  tableRowHeader: {
    margin: 'auto',
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  tableColHeader: {
    width: '33.33%',
    borderRightColor: '#E5E7EB',
    borderRightWidth: 1,
    padding: 5,
  },
  tableCol: {
    width: '33.33%',
    borderRightColor: '#E5E7EB',
    borderRightWidth: 1,
    padding: 5,
  },
  tableCellHeader: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellRight: {
    fontSize: 10,
    textAlign: 'right',
  },
  detailsTable: {
    width: '100%',
    marginBottom: 20,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  colDate: { width: '20%' },
  colType: { width: '20%' },
  colMotif: { width: '40%' },
  colMontant: { width: '20%', textAlign: 'right', color: 'red' },
  
  totauxBanner: {
    backgroundColor: '#1E3A8A', // dark blue
    color: 'white',
    flexDirection: 'row',
    padding: 6,
    fontWeight: 'bold',
  },
  totauxRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 6,
    marginBottom: 30,
  },
  col1: { width: '25%' },
  col2: { width: '25%', textAlign: 'right' },
  col3: { width: '25%', textAlign: 'right' },
  col4: { width: '25%', textAlign: 'right', fontWeight: 'bold' },
  
  signatureContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  signatureText: {
    fontSize: 9,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  signatureTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginRight: 50,
    marginTop: 20,
    marginBottom: 10,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginRight: 30,
    marginBottom: 5,
  },
  signatureDate: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginRight: 50,
    marginBottom: 20,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 200,
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 20,
  },
  signatureLabel: {
    fontSize: 9,
    fontStyle: 'italic',
    alignSelf: 'flex-end',
    marginRight: 60,
    marginTop: 5,
  }
});

export interface Deduction {
  date: string;
  type: string;
  motif: string;
  montant: number;
}

export interface BulletinData {
  periode: string;
  employe: {
    nom: string;
    prenom: string;
    poste: string;
    groupePedagogique?: string;
  };
  salaireBrut: number;
  deductions: Deduction[];
  dateEmission: string;
  directeurNom: string;
  logoUrl?: string;
}

export const BulletinDePaiePDF = ({ data }: { data: BulletinData }) => {
  const totalDeductions = data.deductions.reduce((sum, d) => sum + d.montant, 0);
  const netAPayer = data.salaireBrut - totalDeductions;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          {data.logoUrl ? (
            <Image src={data.logoUrl} style={styles.logo} />
          ) : (
            <View style={styles.logo} />
          )}
          
          <View style={styles.headerCenter}>
            <Text style={styles.republique}>REPUBLIQUE DE GUINEE</Text>
            <Text style={styles.devise}>Travail - Justice - Solidarite</Text>
            <Text style={styles.ecoleTitle}>ECOLE INTERNATIONALE LES ENFANTS DU FUTUR</Text>
            <Text style={styles.documentTitle}>LISTE DE PAIE DETAILLEE</Text>
          </View>
          
          <View style={{ width: 60 }} /> {/* Spacer to balance logo */}
        </View>

        <Text style={styles.periodeText}>Periode : {data.periode}</Text>

        {/* Employee Info Banner */}
        <View style={styles.employeeBanner}>
          <Text>
            1. {data.employe.nom.toUpperCase()} {data.employe.prenom.toUpperCase()} — {data.employe.poste.toUpperCase()} {data.employe.groupePedagogique ? `(GROUPE PÉDAGOGIQUE ${data.employe.groupePedagogique})` : ''}
          </Text>
          <Text>Net : {netAPayer.toLocaleString()} FG</Text>
        </View>

        {/* Salary Summary Table */}
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Salaire Brut</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Total Deductions</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Net a payer</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCellRight}>{data.salaireBrut.toLocaleString()} FG</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellRight}>{totalDeductions.toLocaleString()} FG</Text></View>
            <View style={styles.tableCol}><Text style={[styles.tableCellRight, { fontWeight: 'bold' }]}>{netAPayer.toLocaleString()} FG</Text></View>
          </View>
        </View>

        {/* Deductions Details */}
        <View style={styles.detailsTable}>
          <View style={styles.detailsHeaderRow}>
            <Text style={[styles.colDate, { fontWeight: 'bold', fontSize: 10 }]}>Date</Text>
            <Text style={[styles.colType, { fontWeight: 'bold', fontSize: 10 }]}>Type</Text>
            <Text style={[styles.colMotif, { fontWeight: 'bold', fontSize: 10 }]}>Motif</Text>
            <Text style={[styles.colMontant, { fontWeight: 'bold', fontSize: 10, color: 'black' }]}>Montant</Text>
          </View>
          
          {data.deductions.map((deduction, index) => (
            <View key={index} style={styles.detailsRow}>
              <Text style={[styles.colDate, { fontSize: 10 }]}>{deduction.date}</Text>
              <Text style={[styles.colType, { fontSize: 10 }]}>{deduction.type}</Text>
              <Text style={[styles.colMotif, { fontSize: 10 }]}>{deduction.motif}</Text>
              <Text style={[styles.colMontant, { fontSize: 10 }]}>- {deduction.montant.toLocaleString()} FG</Text>
            </View>
          ))}
          {data.deductions.length === 0 && (
             <View style={styles.detailsRow}>
                <Text style={{ fontSize: 10, fontStyle: 'italic', color: '#6B7280', width: '100%', textAlign: 'center' }}>Aucune déduction enregistrée</Text>
             </View>
          )}
        </View>

        {/* Totals Section */}
        <View style={styles.totauxBanner}>
          <Text style={styles.col1}>TOTAUX GENERAUX</Text>
          <Text style={[styles.col2, { color: 'white' }]}>Brut</Text>
          <Text style={[styles.col3, { color: 'white' }]}>Deductions</Text>
          <Text style={[styles.col4, { color: 'white' }]}>Net a payer</Text>
        </View>
        <View style={styles.totauxRow}>
          <Text style={[styles.col1, { fontSize: 10 }]}>1 employe(s)</Text>
          <Text style={[styles.col2, { fontSize: 10 }]}>{data.salaireBrut.toLocaleString()} FG</Text>
          <Text style={[styles.col3, { fontSize: 10 }]}>{totalDeductions.toLocaleString()} FG</Text>
          <Text style={[styles.col4, { fontSize: 10 }]}>{netAPayer.toLocaleString()} FG</Text>
        </View>

        {/* Footer & Signature */}
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureText}>Document genere automatiquement - ECOLE INTERNATIONALE LES ENFANTS DU FUTUR</Text>
          <Text style={styles.signatureText}>Date d'emission : {data.dateEmission}</Text>
        </View>

        <Text style={styles.signatureTitle}>Directeur</Text>
        <Text style={styles.signatureName}>{data.directeurNom}</Text>
        <Text style={styles.signatureDate}>Date de signature : {data.dateEmission}</Text>

        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>Signature et cachet</Text>

      </Page>
    </Document>
  );
};
