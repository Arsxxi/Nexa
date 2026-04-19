import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

const COLORS = {
  primary: '#FFC800',
  dark: '#18181B',
  border: '#E4E4E7',
  text: '#18181B',
  textSecondary: '#71717A',
  bgCard: '#FFFFFF',
  bgInput: '#F4F4F5',
};

const BANKS = [
  { id: 'bca', name: 'BCA - Bank Central Asia', code: 'bca', icon: '🏦' },
  { id: 'mandiri', name: 'Mandiri', code: 'mandiri', icon: '🏦' },
  { id: 'bni', name: 'BNI', code: 'bni', icon: '🏦' },
  { id: 'bri', name: 'BRI', code: 'bri', icon: '🏦' },
  { id: 'cimb', name: 'CIMB Niaga', code: 'cimb', icon: '🏦' },
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
  const [modalVisible, setModalVisible] = useState(true);
  const panRef = useRef(null);

  const balance = useQuery(api.coins.getCoinBalance);
  const requestRedeemMutation = useMutation(api.coins.requestRedeem);

  const parseCoinAmount = (value: string) => {
    const coinNum = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(coinNum) ? coinNum : 0;
  };

  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    const amount = parseCoinAmount(coinAmount);
    if (amount < 5000) {
      newErrors.coinAmount = 'Minimum redeem 5.000 koin';
    }
    if (balance !== undefined && amount > balance) {
      newErrors.coinAmount = 'Saldo koin tidak cukup';
    }
    if (!coinAmount.trim()) {
      newErrors.coinAmount = 'Jumlah koin harus diisi';
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

  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    // Handle pan gesture for dragging down to close
  };

  const onPanHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY } = event.nativeEvent;
      if (translationY > 100) { // If dragged down more than 100px
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setTimeout(() => router.back(), 300); // Delay to allow animation
  };

  const coinAmountNumber = parseCoinAmount(coinAmount);
  const grossAmount = coinAmountNumber * 10;
  const adminFee = 2500;
  const totalTransfer = Math.max(0, grossAmount - adminFee);

  const handleAjukanRedeem = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await requestRedeemMutation({
        coinAmount: parseCoinAmount(coinAmount),
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountName.trim(),
        bankName: selectedBank.name,
      });
      
      Alert.alert(
        'Redeem Diajukan',
        `Anda mengajukan penukaran ${parseCoinAmount(coinAmount).toLocaleString()} koin ke ${formatRupiah(grossAmount)}. Mohon tunggu proses validasi.`,
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal mengajukan redeem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Handle Bar for dragging */}
              <View style={styles.handleContainer}>
                <View style={styles.handleBar} />
              </View>
              
              {/* Header Section */}
              <View style={styles.header}>
                <Text style={styles.headerSub}>FORM REDEEM</Text>
                <Text style={styles.headerTitle}>REDEEM KOIN</Text>
                <Text style={styles.balanceInfo}>
                  Saldo Anda: {balance !== undefined ? `${balance.toLocaleString('id-ID')} koin` : 'Memuat...'}
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {/* Coin Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>JUMLAH KOIN</Text>
                  <TextInput
                    style={[styles.input, errors.coinAmount && styles.inputError]}
                    value={coinAmount}
                    onChangeText={(text) => {
                      setCoinAmount(text);
                      if (errors.coinAmount) setErrors({...errors, coinAmount: ''});
                    }}
                    placeholder="5000"
                    keyboardType="numeric"
                    placeholderTextColor="#A1A1AA"
                  />
                  {errors.coinAmount && <Text style={styles.errorText}>{errors.coinAmount}</Text>}
                  <Text style={styles.helperText}>
                    Minimum: 5.000 koin • Rate: 1 koin = Rp 100
                  </Text>
                </View>

                {/* Bank Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BANK TUJUAN</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setBankMenuOpen(!bankMenuOpen)}
                  >
                    <Text style={styles.dropdownText}>{selectedBank.name}</Text>
                    <Text style={styles.dropdownArrow}>{bankMenuOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {bankMenuOpen && (
                    <View style={styles.dropdownMenu}>
                      {BANKS.map((bank) => (
                        <TouchableOpacity
                          key={bank.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedBank(bank);
                            setBankMenuOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{bank.icon} {bank.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Account Number Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOMOR REKENING</Text>
                  <TextInput
                    style={[styles.input, errors.accountNumber && styles.inputError]}
                    value={accountNumber}
                    onChangeText={(text) => {
                      setAccountNumber(text);
                      if (errors.accountNumber) setErrors({...errors, accountNumber: ''});
                    }}
                    placeholder="1234567890"
                    keyboardType="numeric"
                    placeholderTextColor="#A1A1AA"
                  />
                  {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
                </View>

                {/* Account Holder Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NAMA PEMILIK REKENING</Text>
                  <TextInput
                    style={[styles.input, errors.accountName && styles.inputError]}
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

                {/* Summary Box */}
                {coinAmountNumber >= 5000 && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>RINGKASAN</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Jumlah Koin:</Text>
                      <Text style={styles.summaryValue}>{coinAmountNumber.toLocaleString()} koin</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Nilai Tukar:</Text>
                      <Text style={styles.summaryValue}>{formatRupiah(grossAmount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Biaya Admin:</Text>
                      <Text style={styles.summaryValue}>-{formatRupiah(adminFee)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabelTotal}>Total Transfer:</Text>
                      <Text style={styles.summaryValueTotal}>{formatRupiah(totalTransfer)}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.btnCancel} 
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.btnCancelText}>BATAL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.btnSubmit, submitting && styles.btnDisabled]} 
                  onPress={handleAjukanRedeem}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.btnSubmitText}>AJUKAN REDEEM</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </PanGestureHandler>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: 190,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  scrollContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    flexGrow: 1,
    paddingTop: 12,
    maxHeight: '90%',
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
  
  // Header
  header: { marginBottom: 32 },
  headerSub: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  balanceInfo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },

  // Form
  formContainer: { marginBottom: 3 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.bgInput,
    color: COLORS.text,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Dropdown
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.bgInput,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dropdownArrow: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.bgCard,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text,
  },

  // Summary
  summaryBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  summaryLabelTotal: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  summaryValueTotal: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  btnSubmit: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    padding: 15,
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
  bankOptions: { marginTop: 12, backgroundColor: COLORS.bgInput, borderRadius: 8, overflow: 'hidden' },
  bankOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E4E4E7' },
  bankOptionSelected: { backgroundColor: '#F8F3D9' },
  bankOptionText: { fontSize: 14, color: COLORS.text },

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
  btnAjukanDisabled: {
    opacity: 0.6,
  },
  btnAjukanText: { fontSize: 14, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
});