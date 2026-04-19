import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export default function PaymentScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const course = useQuery(api.courses.getCourseDetails, { courseId: courseId as any });
  const currentUser = useQuery(api.users.getCurrentUser);

  const isLoading = course === undefined;
  
  const handlePayment = async () => {
    if (!course || !currentUser) return;
    
    setProcessing(true);
    try {
      // TODO: Replace with your Convex deployment URL
      const CONVEX_URL = 'https://limitless-ermine-877.convex.cloud';
      const response = await fetch(`${CONVEX_URL}/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: courseId,
          userId: currentUser._id,
        }),
      });

      const data = await response.json();
      
      if (data.redirectUrl) {
        Linking.openURL(data.redirectUrl);
      } else if (data.snapToken) {
        Alert.alert(
          'Payment Token Received',
          `Token: ${data.snapToken.substring(0, 20)}...\n\nIn production, this would open the Midtrans payment modal.`,
          [{ text: 'OK', onPress: () => router.replace(`/course/${courseId}`) }]
        );
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading || !course) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.courseCard}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.price}>
            {course.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
          </Text>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.paymentMethod} onPress={handlePayment} disabled={processing}>
            <Ionicons name="card" size={24} color="#6366f1" />
            <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.paymentMethod} onPress={handlePayment} disabled={processing}>
            <Ionicons name="wallet" size={24} color="#6366f1" />
            <Text style={styles.paymentMethodText}>E-Wallet</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.paymentMethod} onPress={handlePayment} disabled={processing}>
            <Ionicons name="business" size={24} color="#6366f1" />
            <Text style={styles.paymentMethodText}>Bank Transfer</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  paymentMethods: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
  },
  payButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
