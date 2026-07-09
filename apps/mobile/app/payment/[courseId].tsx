import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, ScrollView, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

const PAYMENT_IMAGES: Record<string, any> = {
  'TRANSFER BANK': require('../../assets/images/bank.png'),
  'GOPAY': require('../../assets/images/gopay-logo.svg'),
  'OVO': require('../../assets/images/ovo-logo.png'),
  'QRIS': require('../../assets/images/qris-logo.svg'),
};

export default function PaymentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('TRANSFER BANK');
  const [promoCode, setPromoCode] = useState('');

  const course = useQuery(api.courses.getCourseDetails, { courseId: courseId as any });
  const currentUser = useQuery(api.users.getCurrentUser);
  const createPayment = useAction(api.payments.createPaymentOrder);

  const isLoading = course === undefined;
  
  const handlePayment = async () => {
    if (!course || !currentUser) return;
    
    setProcessing(true);
    try {
      const result = await createPayment({
        userId: currentUser._id,
        courseId: courseId as any,
        paymentMethod: selectedMethod,
      });
      
      if (result.redirectUrl) {
        Linking.openURL(result.redirectUrl);
      } else if (result.snapToken) {
        Alert.alert(
          'Payment Token Received',
          `Token: ${result.snapToken.substring(0, 20)}...\n\nIn production, this would open the Midtrans payment modal.`,
          [{ text: 'OK', onPress: () => router.replace(`/course/${courseId}`) }]
        );
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading || !course) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  // Simulasi Harga Coret/Diskon untuk UI (Menyesuaikan dengan total bayar asli)
  const finalPrice = course.price || 0;
  const originalPrice = finalPrice * 2;
  const discount = finalPrice;

  const formatRupiah = (number: number) => {
    return number.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).replace('Rp', 'Rp ');
  };

  const PaymentOption = ({ title, iconName }: { title: string, iconName: any }) => {
    const isSelected = selectedMethod === title;
    const ImageSource = PAYMENT_IMAGES[title];
    return (
      <TouchableOpacity 
        style={styles.paymentMethod} 
        onPress={() => setSelectedMethod(title)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View style={styles.checkboxOuter}>
            {isSelected && <View style={styles.checkboxInner} />}
          </View>
        </View>
        <Text style={styles.paymentMethodText}>{title}</Text>
        {ImageSource ? (
          <Image source={ImageSource} style={styles.paymentMethodImage} resizeMode="contain" />
        ) : (
          <Ionicons name={iconName} size={24} color="#D1D5DB" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KONFIRMASI PEMBAYARAN</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ORDER SUMMARY CARD */}
        <View style={styles.orderSummaryCard}>
          <Text style={styles.orderSummaryLabel}>ORDER SUMMARY</Text>
          
          <View style={styles.courseRow}>
            {/* Thumbnail */}
            {course.thumbnailUrl ? (
              <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumbnail} resizeMode="cover" />
            ) : (
              <View style={styles.courseThumbnail}>
                <Ionicons name="image-outline" size={32} color="#0EA5E9" />
              </View>
            )}
            <View style={styles.courseInfo}>
              <Text style={styles.courseCategory}>{course.category?.toUpperCase()}</Text>
              <Text style={styles.courseTitle} numberOfLines={2}>{course.title.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.dividerDark} />

          <Text style={styles.totalLabel}>TOTAL</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalAmount}>{formatRupiah(finalPrice)}</Text>
            <View style={styles.coinBadge}>
              <Ionicons name="ellipse" size={8} color="#9CA3AF" style={{ marginRight: 4 }} />
              <Text style={styles.coinText}>+500 KOIN SETELAH{"\n"}SELESAI</Text>
            </View>
          </View>
        </View>

        {/* METODE PEMBAYARAN */}
        <Text style={styles.sectionTitle}>METODE PEMBAYARAN</Text>
        <View style={styles.sectionContainer}>
          <PaymentOption title="TRANSFER BANK" iconName="business-outline" />
          <PaymentOption title="GOPAY" iconName="wallet-outline" />
          <PaymentOption title="OVO" iconName="wallet-outline" />
          <PaymentOption title="QRIS" iconName="qr-code-outline" />
        </View>

        {/* KODE PROMO */}
        <Text style={styles.sectionTitle}>KODE PROMO</Text>
        <View style={styles.promoContainer}>
          <TextInput
            style={styles.promoInput}
            placeholder="MASUKKAN KODE"
            placeholderTextColor="#D1D5DB"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity>
            <Text style={styles.promoApplyText}>PAKAI <Ionicons name="arrow-forward" size={12} /></Text>
          </TouchableOpacity>
        </View>

        {/* RINCIAN HARGA */}
        <View style={styles.rincianContainer}>
          <Text style={styles.rincianTitle}>RINCIAN HARGA</Text>
          
          <View style={styles.rincianRow}>
            <Text style={styles.rincianLabel}>Harga Course</Text>
            <Text style={styles.rincianValue}>{formatRupiah(originalPrice)}</Text>
          </View>
          <View style={styles.rincianRow}>
            <Text style={styles.rincianLabel}>Diskon</Text>
            <Text style={styles.rincianDiscount}>- {formatRupiah(discount)}</Text>
          </View>

          <View style={styles.dividerLight} />

          <View style={styles.rincianRow}>
            <Text style={styles.rincianTotalLabel}>Total</Text>
            <Text style={styles.rincianTotalValue}>{formatRupiah(finalPrice)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.payButtonText}>BAYAR SEKARANG</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FCFCFC',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000',
    // fontFamily: TYPOGRAPHY.h2.fontFamily, // Aktifkan jika font sudah di-load
  },
  scrollContent: {
    paddingBottom: 40,
  },
  orderSummaryCard: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
  },
  orderSummaryLabel: {
    color: '#C6A87C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseThumbnail: {
    width: 130,
    height: 130,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  courseInfo: {
    flex: 1,
    marginLeft: 16,
  },
  courseCategory: {
    color: '#9CA3AF',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  courseTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerDark: {
    height: 1,
    backgroundColor: '#4B4B4B',
    width: 40,
    alignSelf: 'center',
    marginVertical: 24,
  },
  totalLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  coinBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFC800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  coinText: {
    color: '#18181B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionContainer: {
    marginHorizontal: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxContainer: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  checkboxOuter: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#FFCC00',
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    letterSpacing: 1,
  },
  paymentMethodImage: {
    width: 60,
    height: 24,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    letterSpacing: 1,
  },
  promoApplyText: {
    color: '#927342',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  rincianContainer: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 8,
  },
  rincianTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  rincianRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rincianLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'monospace', // Menggunakan fallback monospace
  },
  rincianValue: {
    color: '#4B5563',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  rincianDiscount: {
    color: '#927342',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: 40,
    alignSelf: 'center',
    marginVertical: 16,
  },
  rincianTotalLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rincianTotalValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FCFCFC',
  },
  payButton: {
    backgroundColor: '#FFCC00',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});