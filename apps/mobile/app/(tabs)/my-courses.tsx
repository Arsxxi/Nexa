import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// --- MOCK DATA ---
const MOCK_LEARNING = [
  { id: 'c1', title: 'Kubernetes Fundament...', tag: 'DEVOPS', totalLessons: 8, completedLessons: 3, progressText: '37%', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Thumb' },
  { id: 'c2', title: 'Zero Trust Architecture', tag: 'SECURITY', totalLessons: 8, completedLessons: 5, progressText: '62%', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Thumb' },
  { id: 'c3', title: 'Machinist UI Patterns', tag: 'DESIGN SYSTEMS', totalLessons: 8, completedLessons: 8, progressText: 'SELESAI ✓', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Thumb', isDone: true },
];

const MOCK_COMPLETED = [
  { id: 'c4', title: 'Advanced CSS Architecture', meta: '8 LESSON • 4 JAM', coinEarned: 500, image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Thumb' },
  { id: 'c5', title: 'Intro to Machine Learning', meta: '12 LESSON • 6 JAM', coinEarned: 750, image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Thumb' },
  { id: 'c6', title: 'UI/UX Systems Design', meta: '10 LESSON • 5 JAM', coinEarned: 600, image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Thumb' },
];

export default function MyCoursesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LEARNING' | 'COMPLETED'>('LEARNING');
  const [isLoading, setIsLoading] = useState(true);

  // Simulasi fetch data dari Convex
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Tampil loading 1.5 detik
    return () => clearTimeout(timer);
  }, []);

  // --- COMPONENTS ---

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.iconBox}>
          <Text style={{ fontSize: 20 }}>⊞</Text> 
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>MY COURSES</Text>
          <Text style={styles.headerSubtitle}>KURSUS SAYA</Text>
        </View>
      </View>
      <View style={styles.coinBadge}>
        <Text style={styles.coinText}>🪙 500_CR</Text>
      </View>
    </View>
  );

  const Tabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity onPress={() => setActiveTab('LEARNING')} style={styles.tabBtn}>
        <Text style={[styles.tabText, activeTab === 'LEARNING' && styles.tabTextActive]}>SEDANG BELAJAR</Text>
        {activeTab === 'LEARNING' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setActiveTab('COMPLETED')} style={styles.tabBtn}>
        <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>SELESAI</Text>
        {activeTab === 'COMPLETED' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );

  const RenderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <Text style={styles.skeletonStatus}>SYO_DATA_FETCH_IN_PROGRESS</Text>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonLineLong} />
            <View style={styles.skeletonLineShortest} />
          </View>
        </View>
      ))}
    </View>
  );

  const RenderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <View style={styles.gridDots}>
          {[...Array(9)].map((_, i) => (
            <View key={i} style={[styles.dot, i === 4 || i === 5 || i === 7 ? { backgroundColor: '#FFC800' } : {}]} />
          ))}
        </View>
      </View>
      <Text style={styles.emptyLabel}>BELUM ADA COURSE</Text>
      <Text style={styles.emptyDivider}>. . . . . . . .</Text>
      <Text style={styles.emptyTitle}>Mulai jelajahi course{'\n'}sekarang</Text>
      <TouchableOpacity style={styles.btnExplore} onPress={() => router.push('/')}>
        <Text style={styles.btnExploreText}>EXPLORE COURSE →</Text>
      </TouchableOpacity>
    </View>
  );

  const RenderLearningCard = ({ item }: { item: typeof MOCK_LEARNING[0] }) => {
    // Generate segmented progress bar
    const segments = Array.from({ length: item.totalLessons });
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/course/${item.id}`)}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.tagBox}><Text style={styles.tagText}>{item.tag}</Text></View>
          <Text style={styles.courseTitle} numberOfLines={1}>{item.title}</Text>
          
          {item.isDone ? (
            <Text style={styles.doneText}>{item.progressText}</Text>
          ) : (
            <Text style={styles.progressText}>{item.completedLessons}/{item.totalLessons} · {item.progressText}</Text>
          )}

          <View style={styles.progressBarContainer}>
            {segments.map((_, index) => {
              const isCompleted = index < item.completedLessons;
              return (
                <View 
                  key={index} 
                  style={[
                    styles.progressSegment, 
                    { backgroundColor: isCompleted ? '#8A6D3B' : '#E4E4E7' } // Warna emas kecoklatan untuk progress
                  ]} 
                />
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const RenderCompletedCard = ({ item }: { item: typeof MOCK_COMPLETED[0] }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/course/${item.id}`)}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.courseTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.metaText}>{item.meta}</Text>
        
        <View style={styles.badgeRow}>
          <View style={styles.badgeSertifikat}>
            <Text style={styles.badgeSertifikatText}>🏆 SERTIFIKAT TERSEDIA</Text>
          </View>
          <Text style={styles.doneTextSmall}>SELESAI ✓</Text>
        </View>

        <View style={styles.badgeCoin}>
          <Text style={styles.badgeCoinText}>🪙 {item.coinEarned} DIPEROLEH</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- MAIN RENDER ---
  const currentData = activeTab === 'LEARNING' ? MOCK_LEARNING : MOCK_COMPLETED;

  return (
    <View style={styles.container}>
      <Header />
      
      {isLoading ? (
        <RenderSkeleton />
      ) : (
        <>
          <Tabs />
          {currentData.length === 0 ? (
            <RenderEmpty />
          ) : (
            <FlatList
              data={currentData}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                if (activeTab === 'LEARNING') {
                  return <RenderLearningCard item={item as typeof MOCK_LEARNING[0]} />;
                } else {
                  return <RenderCompletedCard item={item as typeof MOCK_COMPLETED[0]} />;
                }
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  
  // Header
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#18181B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontWeight: '600', color: '#71717A', letterSpacing: 1.5, marginTop: 2 },
  coinBadge: { backgroundColor: '#F3F0E6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  coinText: { fontSize: 12, fontWeight: '800', color: '#D97706' },

  // Tabs
  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#E4E4E7', marginBottom: 16 },
  tabBtn: { marginRight: 24, paddingBottom: 12, position: 'relative' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#A1A1AA', letterSpacing: 1 },
  tabTextActive: { color: '#18181B' },
  activeIndicator: { position: 'absolute', bottom: -1, left: 0, width: 24, height: 3, backgroundColor: '#8A6D3B', borderRadius: 2 },

  listContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 16 },

  // Card General
  card: { backgroundColor: '#F4F4F5', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  cardImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#18181B' },
  cardContent: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#18181B', marginBottom: 4 },

  // Learning Card Specifics
  tagBox: { backgroundColor: '#E4E4E7', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  tagText: { fontSize: 8, fontWeight: '800', color: '#71717A', letterSpacing: 1 },
  progressText: { fontSize: 11, color: '#71717A', fontWeight: '600', marginBottom: 8 },
  doneText: { fontSize: 11, color: '#8A6D3B', fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  progressBarContainer: { flexDirection: 'row', gap: 2, height: 4 },
  progressSegment: { flex: 1, borderRadius: 2 },

  // Completed Card Specifics
  metaText: { fontSize: 10, color: '#71717A', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badgeSertifikat: { backgroundColor: '#E4E4E7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeSertifikatText: { fontSize: 8, fontWeight: '800', color: '#3F3F46' },
  doneTextSmall: { fontSize: 10, color: '#8A6D3B', fontWeight: '800' },
  badgeCoin: { backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeCoinText: { fontSize: 8, fontWeight: '800', color: '#D97706' },

  // Skeleton Loading
  skeletonContainer: { flex: 1, paddingHorizontal: 24 },
  skeletonStatus: { fontSize: 10, color: '#A1A1AA', fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  skeletonCard: { backgroundColor: '#F4F4F5', borderRadius: 16, padding: 12, flexDirection: 'row', marginBottom: 16, height: 104 },
  skeletonImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E4E4E7' },
  skeletonLineShort: { height: 12, width: '40%', backgroundColor: '#E4E4E7', borderRadius: 4, marginBottom: 8, marginLeft: 16 },
  skeletonLineLong: { height: 12, width: '80%', backgroundColor: '#E4E4E7', borderRadius: 4, marginBottom: 8, marginLeft: 16 },
  skeletonLineShortest: { height: 12, width: '20%', backgroundColor: '#E4E4E7', borderRadius: 4, marginLeft: 16 },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -60 },
  emptyIconBox: { width: 80, height: 80, backgroundColor: '#F4F4F5', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  gridDots: { width: 32, height: 32, flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', alignContent: 'center' },
  dot: { width: 8, height: 8, backgroundColor: '#E4E4E7', borderRadius: 2 },
  emptyLabel: { fontSize: 12, fontWeight: '700', color: '#3F3F46', letterSpacing: 2 },
  emptyDivider: { fontSize: 14, color: '#A1A1AA', marginVertical: 12, letterSpacing: 4 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#18181B', textAlign: 'center', marginBottom: 32 },
  btnExplore: { backgroundColor: '#FFC800', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 8 },
  btnExploreText: { fontSize: 12, fontWeight: '800', color: '#18181B', letterSpacing: 1 },
});