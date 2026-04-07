import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RedeemScreen() {
  const [code, setCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a redeem code');
      return;
    }

    setProcessing(true);
    try {
      // TODO: Call Convex mutation to validate and redeem code
      Alert.alert('Success', 'Code redeemed successfully!');
      setCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid code');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Redeem Code</Text>
        <Text style={styles.subtitle}>Enter your premium code to unlock access</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="ticket" size={24} color="#6b7280" />
          <TextInput
            style={styles.input}
            placeholder="Enter redeem code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, processing && styles.buttonDisabled]}
          onPress={handleRedeem}
          disabled={processing}
        >
          <Text style={styles.buttonText}>
            {processing ? 'Processing...' : 'Redeem'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Ionicons name="information-circle" size={20} color="#6b7280" />
        <Text style={styles.infoText}>
          Contact admin to get your redeem code
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
});
