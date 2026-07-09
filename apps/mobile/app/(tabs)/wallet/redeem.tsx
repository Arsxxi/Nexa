import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert, ActivityIndicator, Modal, Image, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

const COLORS = {
  primary: '#FFC800',
  dark: '#18181B',
  border: '#E4E4E7',
  text: '#18181B',
  textSecondary: '#71717A',
  bgCard: '#FFFFFF',
  bgInput: '#F4F4F5',
  bgInfo: '#FDF6E3',
  textInfo: '#52525B',
  success: '#059669',
  successBg: '#D1FAE5',
};

const BANK_LOGOS: Record<string, any> = {
  bca: require('../../../assets/images/bank-central-asia-(bca)-logo.svg'),
  mandiri: require('../../../assets/images/bank-mandiri-logo.svg'),
  bni: require('../../../assets/images/bank-negara-indonesia-(bni)-logo.svg'),
  bri: require('../../../assets/images/bank-rakyat-indonesia-(bri)-logo.svg'),
  cimb: require('../../../assets/images/bank-cimb-niaga-logo.svg'),
};

const BANKS = [
  { id: 'bca', name: 'BCA - Bank Central Asia', code: 'bca', logo: BANK_LOGOS.bca },
  { id: 'mandiri', name: 'Mandiri - Bank Mandiri', code: 'mandiri', logo: BANK_LOGOS.mandiri },
  { id: 'bni', name: 'BNI - Bank Negara Indonesia', code: 'bni', logo: BANK_LOGOS.bni },
  { id: 'bri', name: 'BRI - Bank Rakyat Indonesia', code: 'bri', logo: BANK_LOGOS.bri },
  { id: 'cimb', name: 'CIMB Niaga', code: 'cimb', logo: BANK_LOGOS.cimb },
];

export default function RedeemCoinModal() {
  const router = useRouter();
  const [coinAmount, setCoinAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [bankMenuOpen, setBankMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ redeemId: string; coinAmount: number; rupiahAmount: number } | null>(null);

  const balance = useQuery(api.coins.getCoinBalance);
  const requestRedeem = useAction(api.coins.requestRedeem);

  const submittedRef = useRef(false);
  useEffect(() => { submittedRef.current = submitted; }, [submitted]);

  useEffect(() => {
    if (balance !== undefined) setIsLoading(false);
  }, [balance]);

  

  const parseCoinAmount = (value: string) => {
    const coinNum = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(coinNum) ? coinNum : 0;
  };

  const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    const amount = parseCoinAmount(coinAmount);
    if (!coinAmount.trim()) {
      newErrors.coinAmount = 'Jumlah koin harus diisi';
    } else if (amount < 5000) {
      newErrors.coinAmount = 'Minimum redeem adalah 5.000 koin (Rp 50.000)';
    } else if (balance !== undefined && amount > balance) {
      newErrors.coinAmount = 'Saldo koin tidak cukup';
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Nomor rekening harus diisi';
    } else if (!/^\d+$/.test(accountNumber.replace(/\s/g, ''))) {
      newErrors.accountNumber = 'Nomor rekening hanya boleh angka';
    }
    if (!accountName.trim()) {
      newErrors.accountName = 'Nama rekening harus diisi';
    } else if (accountName.length < 3) {
      newErrors.accountName = 'Nama rekening minimal 3 karakter';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = useCallback(() => {
    // Jika sudah sukses submit, langsung tutup
    if (submittedRef.current) {
      router.back();
      return;
    }

    // Cek apakah user sudah mengisi salah satu input
    const isFormDirty = coinAmount.trim() !== '' || accountNumber.trim() !== '' || accountName.trim() !== '';

    if (!isFormDirty) {
      // Jika masih kosong, langsung tutup tanpa peringatan
      router.back();
    } else {
      // Jika sudah ada isinya, munculkan konfirmasi
      Alert.alert('Batal?', 'Data yang sudah diisi akan hilang.', [
        { text: 'Lanjutkan Isi', style: 'cancel' },
        { 
          text: 'Batal', 
          style: 'destructive', 
          // ✅ KEY FIX: Gunakan setTimeout agar transisi tutup Alert tidak bentrok dengan router.back()
          onPress: () => setTimeout(() => router.back(), 100) 
        },
      ]);
    }
  }, [router, coinAmount, accountNumber, accountName]);

  const handleAjukanRedeem = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const result = await requestRedeem({
        coinAmount: parseCoinAmount(coinAmount),
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountName.trim(),
        bankName: selectedBank.name,
      });
      setRedeemResult(result);
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal mengajukan redeem. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const coinAmountNumber = parseCoinAmount(coinAmount);
  const grossAmount = coinAmountNumber * 10;

  if (isLoading) {
    return (
      <View style={[styles.modalBackdrop, styles.loadingScreen]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      {/* KEY FIX: pointerEvents="box-none" pada backdrop supaya touch tidak terserap View hitam */}
      <View style={styles.modalBackdrop} pointerEvents="box-none">

        {submitted && redeemResult ? (
          /* Success screen — bottomSheet menerima semua touch secara normal */
          <View style={styles.bottomSheet}>
            <View style={styles.successContainer}>
              <View style={styles.handleContainer}>
                <View style={styles.handleBar} />
              </View>

              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✅</Text>
              </View>

              <Text style={styles.successTitle}>Request Terkirim!</Text>
              <Text style={styles.successDescription}>
                Request redeem Anda sedang menunggu persetujuan admin.
                Dana akan ditransfer ke rekening {selectedBank.name} setelah disetujui.
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>JUMLAH KOIN</Text>
                  <Text style={styles.summaryValue}>
                    {redeemResult.coinAmount.toLocaleString('id-ID')} KOIN
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>NOMINAL</Text>
                  <Text style={styles.summaryValuePrimary}>
                    {formatRupiah(redeemResult.rupiahAmount)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>REKENING</Text>
                  <Text style={styles.summaryValue}>{selectedBank.name.split(' - ')[0]}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.btnSubmit} onPress={() => router.back()}>
                <Text style={styles.btnSubmitText}>TUTUP</Text>
              </TouchableOpacity>

              <Text style={styles.noteText}>
                Estimated transfer: 1-3 hari kerja setelah approval
              </Text>
            </View>
          </View>
        ) : (
          /* Form screen */
          <View style={styles.bottomSheet}>
            <View style={styles.handleContainer}>
              <View style={styles.handleBar} />
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {/* Header dengan zIndex tinggi supaya tidak tertutup dropdown */}
              <View style={[styles.header, { zIndex: 1001 ,elevation: 10 }]}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.headerBackArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerSub}>FORM REDEEM</Text>
                  <Text style={styles.headerTitle}>REDEEM KOIN</Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>JUMLAH KOIN</Text>
                  <View style={[styles.inputWrapper, errors.coinAmount && styles.inputError]}>
                    <TextInput
                      style={styles.inputText}
                      value={coinAmount}
                      onChangeText={(text) => {
                        setCoinAmount(text);
                        if (errors.coinAmount) setErrors({...errors, coinAmount: ''});
                      }}
                      placeholder="5000"
                      keyboardType="numeric"
                      placeholderTextColor="#A1A1AA"
                    />
                    <Text style={styles.inputSuffix}>KOIN</Text>
                  </View>
                  {errors.coinAmount && <Text style={styles.errorText}>{errors.coinAmount}</Text>}
                  <Text style={styles.conversionText}>= {formatRupiah(grossAmount)}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                  <Text style={styles.infoText}>
                    MINIMUM REDEEM ADALAH 5.000 KOIN (RP 50.000). PENCAIRAN AKAN DIPROSES SETELAH ADMIN MENYETUJUI.
                  </Text>
                </View>

                {/* Dropdown bank — zIndex hanya aktif saat terbuka */}
                <View style={[styles.bankInputGroup, bankMenuOpen ? { zIndex: 1000, elevation: 1000 } : { zIndex: 1, elevation: 1 }]}>
                  <Text style={styles.inputLabel}>PILIH BANK</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setBankMenuOpen(!bankMenuOpen)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.bankSelectRow}>
                      {selectedBank.logo ? (
                        <Image source={selectedBank.logo} style={styles.bankLogo} />
                      ) : (
                        <Text style={styles.bankIconPlaceholder}>🏛️</Text>
                      )}
                      <Text style={styles.dropdownText}>{selectedBank.name}</Text>
                    </View>
                    <Text style={styles.dropdownArrow}>{bankMenuOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {bankMenuOpen && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                        {BANKS.map((bank) => (
                          <TouchableOpacity
                            key={bank.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedBank(bank);
                              setBankMenuOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            {bank.logo && <Image source={bank.logo} style={styles.bankLogoSmall} />}
                            <Text style={styles.dropdownItemText}>{bank.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={{ zIndex: 1, elevation: 1 }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NOMOR REKENING</Text>
                    <TextInput
                      style={[styles.inputSingle, errors.accountNumber && styles.inputError]}
                      value={accountNumber}
                      onChangeText={(text) => {
                        setAccountNumber(text);
                        if (errors.accountNumber) setErrors({...errors, accountNumber: ''});
                      }}
                      placeholder="8726351928"
                      keyboardType="numeric"
                      placeholderTextColor="#A1A1AA"
                    />
                    {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NAMA REKENING</Text>
                    <TextInput
                      style={[styles.inputSingle, errors.accountName && styles.inputError]}
                      value={accountName}
                      onChangeText={(text) => {
                        setAccountName(text);
                        if (errors.accountName) setErrors({...errors, accountName: ''});
                      }}
                      placeholder="Nama Lengkap"
                      placeholderTextColor="#A1A1AA"
                      autoCapitalize="words"
                    />
                    {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, submitting && styles.btnDisabled]}
                onPress={handleAjukanRedeem}
                disabled={submitting}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.btnSubmitText}>AJUKAN REDEEM →</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    // TIDAK ada pointerEvents di sini — diset langsung di JSX sebagai prop
  },
  loadingScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingHorizontal: 24,
    overflow: 'visible',
  },
  successContainer: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4E4E7',
    borderRadius: 2,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackArrow: { fontSize: 24, color: COLORS.text },
  headerTextContainer: { flex: 1 },
  headerSub: { fontSize: 10, fontFamily: TYPOGRAPHY.h2.fontFamily, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontFamily: TYPOGRAPHY.h1.fontFamily, color: COLORS.text, letterSpacing: -0.5 },
  formContainer: { marginBottom: 12 },
  inputGroup: { marginBottom: 20 },
  bankInputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontFamily: TYPOGRAPHY.h2.fontFamily, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.text,
  },
  inputSuffix: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    color: '#A1A1AA',
    marginLeft: 8,
  },
  inputSingle: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.text,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
  },
  conversionText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: '#854D0E',
  },
  infoBox: {
    backgroundColor: COLORS.bgInfo,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 14, marginRight: 10, color: COLORS.textInfo },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    color: COLORS.textInfo,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  dropdown: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconPlaceholder: { fontSize: 16, marginRight: 10 },
  bankLogo: { width: 24, height: 24, marginRight: 10, resizeMode: 'contain' },
  bankLogoSmall: { width: 20, height: 20, marginRight: 8, resizeMode: 'contain' },
  dropdownText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.text,
  },
  dropdownArrow: { fontSize: 12, color: COLORS.textSecondary },
  dropdownMenu: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    position: 'absolute',
    top: 85,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.text,
  },
  btnSubmit: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnSubmitText: {
    fontSize: 15,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: '#000000',
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successEmoji: { fontSize: 36 },
  successTitle: {
    fontSize: 22,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.dark,
    fontWeight: '800',
    marginBottom: 10,
  },
  successDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.dark,
    fontWeight: '600',
  },
  summaryValuePrimary: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    color: COLORS.primary,
    fontWeight: '800',
  },
  noteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});