import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { StatusBadge } from '../../../components/admin/StatusBadge';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

const COLORS = {
  bg: '#F5F3EF',
  card: '#FFFFFF',
  dark: '#18181B',
  muted: '#71717A',
  border: '#E4E4E7',
  darkCard: '#27272A',
  primary: '#FFC800',
  danger: '#DC2626',
  success: '#059669',
  warning: '#F59E0B',
};

const RISK_COLORS = {
  HIGH: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  MEDIUM: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  LOW: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const allRequests = useQuery(api.coins.getAllRedeems, { status: 'all' });
  const request = allRequests?.find((r: any) => r._id === id) as any;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoningModal, setAiReasoningModal] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const investigateRedeem = useAction(api.aiInvestigation.investigateRedeemRequest as any);

  const handleAulaInvestigate = async () => {
    if (!id) return;
    setAiLoading(true);
    setAiExpanded(true);
    try {
      await investigateRedeem({ redeemId: id });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal analisa AI. Coba lagi.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' · ' + new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const rows = [
    { label: 'USER ID', value: `USR-${request.userId.slice(-6).toUpperCase()}` },
    { label: 'KOIN', value: `${request.coinAmount.toLocaleString('id-ID')}` },
    { label: 'NOMINAL', value: `Rp ${request.rupiahAmount.toLocaleString('id-ID')}` },
    { label: 'BANK', value: request.bankName },
    { label: 'NO. REKENING', value: request.accountNumber },
    { label: 'NAMA REK', value: request.accountHolderName },
    { label: 'TGL REQUEST', value: formatDate(request.requestedAt) },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeArea} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.reqLabel}>DETAIL REQUEST · #{request._id.slice(-6).toUpperCase()}</Text>

        <View style={styles.usernameSection}>
          <Text style={styles.username}>@{request.userName}</Text>
          <StatusBadge status={request.status as any} />
        </View>

        <View style={styles.darkCard}>
          {rows.map((row, i) => (
            <View key={i} style={styles.darkRow}>
              <Text style={styles.darkLabel}>{row.label}</Text>
              <Text style={[styles.darkValue, row.label === 'TGL REQUEST' && styles.darkValueMuted]}>
                {row.value}
              </Text>
            </View>
          ))}
          {request.status === 'rejected' && request.rejectionReason && (
            <View style={styles.darkRow}>
              <Text style={styles.darkLabel}>ALASAN</Text>
              <Text style={[styles.darkValue, styles.darkValueMuted]}>{request.rejectionReason}</Text>
            </View>
          )}
        </View>

        {!request.aiRiskLevel && (
          <TouchableOpacity
            style={[styles.aiButton, aiLoading && styles.aiButtonDisabled]}
            onPress={handleAulaInvestigate}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color={COLORS.dark} />
            ) : (
              <Text style={styles.aiButtonText}>🔍 ANALISA AI</Text>
            )}
          </TouchableOpacity>
        )}

        {request.aiRiskLevel && (
          <View style={styles.aiCard}>
            <TouchableOpacity
              style={styles.aiCardHeader}
              onPress={() => setAiExpanded(!aiExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.aiHeaderLeft}>
                <Text style={styles.aiHeaderText}>ANALISA AI</Text>
              </View>
              <View style={styles.aiHeaderRight}>
                <View style={[
                  styles.riskBadge,
                  {
                    backgroundColor: RISK_COLORS[request.aiRiskLevel as keyof typeof RISK_COLORS]?.bg || COLORS.muted,
                    borderColor: RISK_COLORS[request.aiRiskLevel as keyof typeof RISK_COLORS]?.border || COLORS.border,
                  }
                ]}>
                  <Text style={[
                    styles.riskBadgeText,
                    { color: RISK_COLORS[request.aiRiskLevel as keyof typeof RISK_COLORS]?.text || COLORS.dark }
                  ]}>
                    {request.aiRiskLevel}
                  </Text>
                </View>
                <Text style={styles.aiChevron}>{aiExpanded ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {aiExpanded && (
              <ScrollView
                style={styles.aiCardBody}
                contentContainerStyle={styles.aiCardBodyContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.aiRecommendationRow}>
                  <Text style={styles.aiLabel}>REKOMENDASI</Text>
                  <View style={[
                    styles.recommendationBadge,
                    {
                      backgroundColor: (request as any).aiRecommendation === 'REJECT' ? COLORS.danger
                        : (request as any).aiRecommendation === 'APPROVE' ? COLORS.success
                        : COLORS.warning,
                    }
                  ]}>
                    <Text style={styles.recommendationText}>
                      {(request as any).aiRecommendation || 'HOLD'}
                    </Text>
                  </View>
                </View>

                <View style={styles.aiDivider} />

                <View style={styles.aiReasoningSection}>
                  <Text style={styles.aiLabel}>REASONING</Text>
                  <Text style={styles.aiReasoningText}>{(request as any).aiReasoning}</Text>
                </View>

                {(request as any).aiAnalyzedAt && (
                  <Text style={styles.aiTimestamp}>
                    Dianalisa: {new Date((request as any).aiAnalyzedAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })} {new Date((request as any).aiAnalyzedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit', minute: '2-digit',
                    })} WIB
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.tutupBtn} onPress={() => router.back()}>
          <Text style={styles.tutupBtnText}>TUTUP</Text>
        </TouchableOpacity>

        <Modal
          visible={aiReasoningModal}
          transparent
          animationType="fade"
          onRequestClose={() => setAiReasoningModal(false)}
        >
          <TouchableOpacity
            style={styles.reasoningOverlay}
            activeOpacity={1}
            onPress={() => setAiReasoningModal(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.reasoningSheet} onPress={() => {}}>
              <View style={styles.reasoningHandle} />
              <View style={[
                styles.reasoningHeader,
                {
                  backgroundColor: (request as any).aiRiskLevel === 'HIGH' ? '#FEE2E2'
                    : (request as any).aiRiskLevel === 'MEDIUM' ? '#FEF3C7'
                    : '#D1FAE5',
                }
              ]}>
                <Text style={styles.reasoningHeaderText}>ANALISA AI</Text>
              </View>

              <View style={styles.reasoningBody}>
                <View style={styles.reasoningRow}>
                  <Text style={styles.reasoningLabel}>TINGKAT RISIKO</Text>
                  <View style={[
                    styles.reasoningRiskBadge,
                    {
                      backgroundColor: (request as any).aiRiskLevel === 'HIGH' ? '#FEE2E2'
                        : (request as any).aiRiskLevel === 'MEDIUM' ? '#FEF3C7'
                        : '#D1FAE5',
                      borderColor: (request as any).aiRiskLevel === 'HIGH' ? '#FCA5A5'
                        : (request as any).aiRiskLevel === 'MEDIUM' ? '#FCD34D'
                        : '#6EE7B7',
                    }
                  ]}>
                    <Text style={[
                      styles.reasoningRiskText,
                      {
                        color: (request as any).aiRiskLevel === 'HIGH' ? '#991B1B'
                          : (request as any).aiRiskLevel === 'MEDIUM' ? '#92400E'
                          : '#065F46',
                      }
                    ]}>{(request as any).aiRiskLevel}</Text>
                  </View>
                </View>

                <View style={styles.reasoningDivider} />

                <View style={styles.reasoningSection}>
                  <Text style={styles.reasoningSectionLabel}>ALASAN</Text>
                  <Text style={styles.reasoningText}>{(request as any).aiReasoning}</Text>
                </View>

                <View style={styles.reasoningDivider} />

                <View style={styles.reasoningRow}>
                  <Text style={styles.reasoningLabel}>REKOMENDASI</Text>
                  <View style={[
                    styles.recommendationBadge,
                    {
                      backgroundColor: (request as any).aiRecommendation === 'REJECT' ? COLORS.danger
                        : (request as any).aiRecommendation === 'APPROVE' ? COLORS.success
                        : COLORS.warning,
                    }
                  ]}>
                    <Text style={styles.recommendationText}>{(request as any).aiRecommendation}</Text>
                  </View>
                </View>

                {(request as any).aiAnalyzedAt && (
                  <Text style={styles.reasoningTimestamp}>
                    Dianalisa: {new Date((request as any).aiAnalyzedAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })} {new Date((request as any).aiAnalyzedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit', minute: '2-digit',
                    })} WIB
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.reasoningCloseBtn}
                  onPress={() => setAiReasoningModal(false)}
                >
                  <Text style={styles.reasoningCloseText}>TUTUP</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {request.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => router.push(`/(admin)/redeem/reject/${request._id}` as any)}
            >
              <Text style={styles.rejectBtnText}>✕ REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => router.push(`/(admin)/redeem/approve/${request._id}` as any)}
            >
              <Text style={styles.approveBtnText}>✓ APPROVE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  closeArea: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  reqLabel: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10, fontWeight: '700', color: COLORS.muted, letterSpacing: 2,
    marginBottom: 12, textAlign: 'center',
  },
  usernameSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20,
  },
  username: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 18, fontWeight: '800', color: COLORS.dark,
  },
  darkCard: {
    backgroundColor: COLORS.darkCard, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  darkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#3f3f46',
  },
  darkLabel: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10, fontWeight: '700', color: '#71717A', letterSpacing: 1,
  },
  darkValue: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 12, fontWeight: '700', color: COLORS.primary,
  },
  darkValueMuted: { color: '#A1A1AA', fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadingText: { fontSize: 16, color: COLORS.muted },
  tutupBtn: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  tutupBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 1,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: {
    flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.danger, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  rejectBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '800', color: COLORS.danger, letterSpacing: 1,
  },
  approveBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  approveBtnText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 1,
  },
  aiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  aiHeaderLeft: {
    flex: 1,
  },
  aiHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiChevron: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 12,
    color: COLORS.muted,
  },
aiCardBody: {
    maxHeight: 280,
  },
  aiCardBodyContent: {
    paddingBottom: 4,
  },
  aiDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  aiHeaderText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  aiRecommendationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16, // <-- TAMBAHKAN INI: Memberikan batas aman di kiri dan kanan
    width: '100%',         // Memastikan baris ini tidak melebihi lebar layar
  },
  aiLabel: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
    flexShrink: 1,
  },
  recommendationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendationText: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    // paddingHorizontal: 12, <-- HAPUS INI, karena parent (iReasoningSection) sudah punya padding
    color: COLORS.card,
    letterSpacing: 1,
    flexShrink: 1,         // Mencegah teks terpotong jika terlalu panjang
  },
  aiReasoningSection: {
    marginBottom: 8,
    flexDirection: 'column',
    paddingHorizontal: 16, // KUNCI UTAMA: Berikan jarak kiri-kanan di sini agar semua isi di dalamnya rapi
    width: '100%',         // Pastikan section ini tidak melebar melebihi layar
  },
 aiReasoningText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 12,  // Memberikan jarak aman dari sisi kiri dan kanan agar tidak mepet
    flexShrink: 1,          // INI KUNCINYA: Memaksa teks turun ke bawah jika sudah mencapai batas layar
    textAlign: 'left',      // Gunakan rata kiri agar lebih rapi saat dibaca di layar HP
  },
aiTimestamp: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10,
    color: COLORS.muted,
    flexShrink: 1,
    marginTop: 8,            // Sedikit diperbesar agar jarak dari teks kesimpulan lebih lega
    paddingHorizontal: 16,   // <-- TAMBAHKAN INI: Agar sejajar dengan teks di atasnya dan tidak mepet kiri
    marginBottom: 16,        // <-- TAMBAHKAN INI: Memberikan ruang di bawah teks sebelum tombol "TUTUP"
  },
  aiButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: 1,
  },
  reasoningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  reasoningSheet: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  reasoningHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  reasoningHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reasoningHeaderText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: 2,
  },
  reasoningBody: {
    padding: 16,
  },
  reasoningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reasoningLabel: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
  },
  reasoningRiskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasoningRiskText: {
    fontFamily: TYPOGRAPHY.h1.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reasoningDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  reasoningSection: {
    marginBottom: 4,
  },
  reasoningSectionLabel: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  reasoningText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 22,
  },
  reasoningTimestamp: {
    fontFamily: TYPOGRAPHY.h2.fontFamily,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  reasoningCloseBtn: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  reasoningCloseText: {
    fontFamily: TYPOGRAPHY.h3.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.card,
    letterSpacing: 1,
  },
});