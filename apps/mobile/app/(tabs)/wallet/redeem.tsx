import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Linking } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
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
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'waiting'>('form');
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [redeemId, setRedeemId] = useState<string | null>(null);
  const panRef = useRef(null);

  const balance = useQuery(api.coins.getCoinBalance);
  const requestRedeemAction = useAction(api.coins.requestRedeem);
  const confirmRedeemPaymentAction = useAction(api.coins.confirmRedeemPayment);

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
  const grossAmount = coinAmountNumber * 10; // Using conversion rate: 1 coin = Rp 10
  const adminFee = 2500;
  const totalTransfer = Math.max(0, grossAmount - adminFee);

  // ✅ REFACTORED: Submit form → Midtrans payment immediately
  const handleAjukanRedeem = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Call requestRedeem ACTION (not mutation anymore)
      // This creates redeem request AND Midtrans payment
      const result = await requestRedeemAction({
        coinAmount: parseCoinAmount(coinAmount),
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountName.trim(),
        bankName: selectedBank.name,
      });

      console.log('Redeem + Payment created:', result);
      setRedeemId(result.redeemId);
      setSnapToken(result.snapToken);
      setRedirectUrl(result.redirectUrl);

      Alert.alert(
        'Redeem terkirim',
        'Permintaan redeem sedang menunggu verifikasi. Silakan lanjutkan pembayaran untuk menyelesaikan proses.',
      );
      
      // Go straight to payment page
      setPaymentStep('payment');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal membuat pembayaran. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ UPDATED: After user completes Midtrans payment
  const handlePaymentSuccess = async () => {
    if (!redeemId) {
      Alert.alert('Error', 'Redeem ID not found');
      return;
    }

    setSubmitting(true);
    try {
      // Confirm payment with Midtrans
      const confirmResult = await confirmRedeemPaymentAction({
        redeemId,
      });

      if (confirmResult.success && confirmResult.paymentStatus === 'paid') {
        // Payment confirmed - now waiting for admin approval
        Alert.alert(
          'Redeem waiting for verification',
          'Pembayaran sudah diterima. Permintaan redeem Anda sekarang menunggu verifikasi admin.',
        );
        setPaymentStep('waiting');
      } else {
        Alert.alert(
          'Pembayaran Gagal',
          confirmResult.message || 'Pembayaran dibatalkan. Silakan coba lagi.'
        );
        setPaymentStep('form');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal memverifikasi pembayaran.');
      setPaymentStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ UPDATED: Handle payment cancel (user closes payment page)
  const handlePaymentCancel = () => {
    Alert.alert(
      'Batal Pembayaran?',
      'Jika Anda keluar tanpa menyelesaikan pembayaran, request ini akan hangus.',
      [
        { text: 'Lanjutkan Bayar', style: 'cancel' },
        {
          text: 'Batal',
          style: 'destructive',
          onPress: () => {
            setPaymentStep('form');
            setSnapToken(null);
            setRedirectUrl(null);
            setRedeemId(null);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {/* Screen 1: Midtrans Payment Page */}
      {paymentStep === 'payment' && snapToken && redirectUrl ? (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          {/* Payment Header */}
          <View style={styles.paymentHeader}>
            <TouchableOpacity 
              onPress={handlePaymentCancel}
              disabled={submitting}
            >
              <Text style={styles.backButtonText}>← Batal</Text>
            </TouchableOpacity>
            <Text style={styles.paymentTitle}>PEMBAYARAN MIDTRANS</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Midtrans Payment Page via WebView */}
          <WebView
            source={{ uri: redirectUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFC800" />
                <Text style={styles.loadingText}>Memuat halaman pembayaran...</Text>
              </View>
            )}
            onNavigationStateChange={(navState: WebViewNavigation) => {
              // Check if payment is completed
              if (navState.url && (navState.url.includes('finish') || navState.url.includes('success'))) {
                handlePaymentSuccess();
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
          />

          {/* Manual Confirm Button (fallback) */}
          <View style={styles.paymentFooter}>
            <TouchableOpacity 
              style={[styles.btnSubmit, submitting && styles.btnDisabled]}
              onPress={handlePaymentSuccess}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnSubmitText}>KONFIRMASI PEMBAYARAN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : paymentStep === 'waiting' ? (
        // Screen 2: Waiting for Admin Approval
        <View style={[styles.modalContainer, styles.waitingContainer]}>
          <View style={styles.waitingContent}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingTitle}>Pembayaran Dikonfirmasi!</Text>
            <Text style={styles.waitingSubtitle}>Menunggu persetujuan admin...</Text>
            <Text style={styles.waitingDescription}>
              Pembayaran Anda sebesar {formatRupiah(grossAmount)} telah kami terima.{'\n\n'}
              Admin akan mereview dan menyetujui dalam waktu singkat. Anda akan menerima notifikasi ketika dana ditransfer ke rekening Anda.
            </Text>
            <TouchableOpacity 
              style={styles.btnOk}
              onPress={handleClose}
            >
              <Text style={styles.btnOkText}>TUTUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Screen 3: Form view
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
                    Minimum: 5.000 koin • Rate: 1 koin = Rp 10
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

                {/* Info Box - Payment Flow */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                  <Text style={styles.infoText}>Klik tombol di bawah untuk melanjutkan ke halaman pembayaran Midtrans. Setelah membayar, admin akan mereview dan mentransfer dana ke rekening Anda.</Text>
                </View>
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
                    <Text style={styles.btnSubmitText}>LANJUT KE PEMBAYARAN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
        </PanGestureHandler>
      )}
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
  headerSub: { fontSize: 10, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  balanceInfo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },

  // Form
  formContainer: { marginBottom: 3 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
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
    fontFamily: TYPOGRAPHY.h1.fontFamily,
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
    fontFamily: TYPOGRAPHY.h1.fontFamily,
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
    fontFamily: TYPOGRAPHY.h1.fontFamily,
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

  // ✅ NEW: Payment page styles
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFC800',
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  paymentFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },

  // ✅ NEW: Waiting for admin approval screen
  waitingContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  waitingContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    width: '100%',
  },
  waitingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  waitingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btnOk: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  btnOkText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontWeight: '700',
    color: COLORS.text,
  },
});