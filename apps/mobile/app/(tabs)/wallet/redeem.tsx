import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Warna Nexa
const COLORS = {
  primary: '#FFC800', // Kuning Nexa
  dark: '#18181B',
  border: '#E4E4E7',
  text: '#18181B',
  textSecondary: '#71717A',
  bgCard: '#FFFFFF',
  bgInput: '#F4F4F5',
};

// Mock Bank Data
const BANKS = [
  { id: 'bca', name: 'BCA - Bank Central Asia', icon: '🏦' },
  { id: 'mandiri', name: 'Mandiri', icon: '🏦' },
  { id: 'bni', name: 'BNI', icon: '🏦' },
];

export default function RedeemCoinModal() {
  const router = useRouter();
  const [coinAmount, setCoinAmount] = useState('5000');
  const [accountNumber, setAccountNumber] = useState('8726351928');
  const [accountName, setAccountName] = useState('JOHN DOE');
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);

  // Simulasi kalkulasi nilai Rupiah (Asumsi 1 Koin = Rp 10)
  const calculateRupiah = (coins: string) => {
    const coinNum = parseInt(coins, 10);
    if (isNaN(coinNum)) return 'Rp 0';
    return `Rp ${(coinNum * 10).toLocaleString('id-ID')}`;
  };

  const handleAjukanRedeem = () => {
    // Validasi dasar
    if (parseInt(coinAmount) < 1000) {
      Alert.alert('Error', 'Minimum redeem adalah 1.000 koin.');
      return;
    }
    if (!accountNumber || !accountName) {
      Alert.alert('Error', 'Mohon lengkapi data rekening.');
      return;
    }

    // Simulasi sukses
    Alert.alert(
      'Redeem Diajukan',
      `Anda mengajukan penukaran ${coinAmount} koin ke Rp ${calculateRupiah(coinAmount)}. Mohon tunggu proses validasi.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Handle Bar (Visual Modal) */}
        <View style={styles.handleBar} />
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>FORM REDEEM</Text>
          <Text style={styles.headerTitle}>REDEEM KOIN</Text>
        </View>

        {/* Input Jumlah Koin */}
        <View style={styles.section}>
          <Text style={styles.label}>JUMLAH KOIN</Text>
          <View style={styles.inputKoinRow}>
            <TextInput
              style={styles.inputKoin}
              value={coinAmount}
              onChangeText={setCoinAmount}
              keyboardType="numeric"
              placeholder="Min. 1000"
            />
            <Text style={styles.koinSuffix}>KOIN</Text>
          </View>
          <Text style={styles.konversiText}>= {calculateRupiah(coinAmount)}</Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            MINIMUM REDEEM ADALAH 1.000 KOIN ({calculateRupiah('1000')}). BIAYA ADMIN RP 2.500 AKAN DIPOTONG DARI TOTAL TRANSFER.
          </Text>
        </View>

        {/* Pilih Bank */}
        <View style={styles.section}>
          <Text style={styles.label}>PILIH BANK</Text>
          <TouchableOpacity style={styles.bankDropdown}>
            <View style={styles.bankInfo}>
              <Text style={styles.bankIcon}>{selectedBank.icon}</Text>
              <Text style={styles.bankName}>{selectedBank.name}</Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Nomor Rekening */}
        <View style={styles.section}>
          <Text style={styles.label}>NOMOR REKENING</Text>
          <TextInput
            style={styles.inputGeneral}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            placeholder="Masukkan nomor rekening"
          />
        </View>

        {/* Nama Rekening */}
        <View style={styles.section}>
          <Text style={styles.label}>NAMA REKENING</Text>
          <TextInput
            style={styles.inputGeneral}
            value={accountName}
            onChangeText={setAccountName}
            autoCapitalize="characters"
            placeholder="Masukkan nama pemilik rekening"
          />
        </View>
        
        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 40 }} />

        {/* Tombol Ajukan */}
        <TouchableOpacity style={styles.btnAjukan} onPress={handleAjukanRedeem}>
          <Text style={styles.btnAjukanText}>AJUKAN REDEEM →</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    flexGrow: 1,
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4E4E7',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  
  // Header
  header: { marginBottom: 32 },
  headerSub: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },

  // Sections
  section: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
  
  // Koin Input
  inputKoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  inputKoin: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  koinSuffix: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
  konversiText: { fontSize: 14, fontWeight: '700', color: '#8A6D3B', marginTop: 12 },

  // Info Box
  infoBox: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE047',
    marginBottom: 24,
  },
  infoIcon: { fontSize: 16, marginRight: 12, marginTop: 2 },
  infoText: { flex: 1, fontSize: 10, color: '#92400E', fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },

  // Dropdown & Input General
  bankDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  bankInfo: { flexDirection: 'row', alignItems: 'center' },
  bankIcon: { marginRight: 12 },
  bankName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dropdownArrow: { fontSize: 10, color: COLORS.textSecondary, fontWeight: 'bold' },

  inputGeneral: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Tombol Utama
  btnAjukan: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  btnAjukanText: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
});