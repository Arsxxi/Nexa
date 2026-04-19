import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#FFC800',
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#18181B',
  textSecondary: '#71717A',
  border: '#E4E4E7',
  pillBg: '#F4F4F5',
  darkCard: '#18181B',
  premiumBg: '#F3E8FF',
  premiumText: '#9333EA',
  freeBg: '#DCFCE7',
  freeText: '#166534',
  errorRed: '#DC2626',
};

const CATEGORIES = ['SEMUA', 'TEKNOLOGI', 'DESAIN', 'BISNIS', 'MARKETING'];

export default function HomeScreen() {
  const router = useRouter();
  
  const [activeCategory, setActiveCategory] = useState('SEMUA');
  const [refreshing, setRefreshing] = useState(false);

  const courses = useQuery(api.courses.getCourses, { 
    type: activeCategory === 'SEMUA' ? undefined : activeCategory.toLowerCase() === 'free' ? 'free' : activeCategory.toLowerCase() === 'premium' ? 'premium' : undefined,
    category: activeCategory === 'SEMUA' ? undefined : activeCategory,
  });
  
  const currentUser = useQuery(api.users.getCurrentUser);

  const isLoading = courses === undefined;
  const error = courses === null;
  const coursesData = courses || [];
  const isEmpty = coursesData.length === 0;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // --- RENDERERS ---

  const renderHeaderBar = (isMinimal = false, coinBalance = 0, userName = 'User') => {
    if (isMinimal) {
      return (
        <View style={styles.minimalHeader}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.brandText}>NEXA</Text>
          </View>
          <View style={styles.coinPill}>
            <Text style={styles.coinTextMinimal}>{coinBalance}_COINS</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.welcomeSub}>SELAMAT DATANG · NEXA</Text>
          <Text style={styles.welcomeTitle}>Halo, {userName}! 👋</Text>
        </View>
        <View style={styles.coinPillPrimary}>
          <View style={styles.coinIcon} />
          <Text style={styles.coinTextPrimary}>{coinBalance}</Text>
        </View>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.container}>
      {renderHeaderBar(true)}
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonTextLong} />
            <View style={styles.skeletonTextMedium} />
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonPill} />
              <View style={styles.skeletonPill} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderError = () => (
    <View style={styles.container}>
      {renderHeaderBar(true)}
      <View style={styles.centerContent}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 32 }}>⚠</Text>
        </View>
        <Text style={styles.stateTitle}>GAGAL MEMUAT</Text>
        <Text style={styles.stateDesc}>
          Koneksi ke server utama terputus. Silakan periksa jaringan Anda atau coba hubungkan kembali.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onRefresh}>
          <Text style={styles.primaryButtonText}>COBA LAGI</Text>
        </TouchableOpacity>
        
        <View style={styles.errorCodeBox}>
          <View style={styles.redDot} />
          <Text style={styles.errorCodeText}>ERR_SYS_042</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.container}>
      {renderHeaderBar(true)}
      <View style={styles.centerContent}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 32 }}>📋</Text>
        </View>
        <Text style={styles.stateTitle}>BELUM ADA COURSE</Text>
        <Text style={styles.stateDesc}>
          Coba cari topik lain atau kembali lagi nanti.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onRefresh}>
          <Text style={styles.primaryButtonText}>⚲ CARI_COURSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListHeader = () => {
    const featured = coursesData.slice(0, 2);
    return (
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
        >
          {featured.map((course: any) => (
            <TouchableOpacity 
              key={course._id} 
              style={styles.featuredCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/course/${course._id}`)}
            >
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>{course.type.toUpperCase()}</Text>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>{course.title}</Text>
                <Text style={styles.featuredSub}>{course.totalLessons} LESSON · ⛃ {course.coinReward} COIN</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>KATEGORI</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCourseItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listCard} 
      activeOpacity={0.7}
      onPress={() => router.push(`/course/${item._id}`)}
    >
      <View style={styles.listCardImage} />
      <View style={styles.listCardContent}>
        <Text style={styles.listCardTitle}>{item.title}</Text>
        <Text style={styles.listCardSub}>{item.totalLessons} LESSON</Text>
        
        <View style={styles.listCardFooter}>
          <View style={[
            styles.typeBadge, 
            item.type === 'premium' ? styles.badgePremium : styles.badgeFree
          ]}>
            <Text style={[
              styles.typeBadgeText,
              item.type === 'premium' ? styles.textPremium : styles.textFree
            ]}>
              {item.type.toUpperCase()} {item.type === 'premium' && `· ⛃ ${item.price}`}
            </Text>
          </View>
          
          <View style={styles.ratingBox}>
             {[...Array(5)].map((_, i) => (
               <View key={i} style={styles.ratingDot} />
             ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- MAIN RENDER LOGIC ---
  if (isLoading) return renderLoading();
  if (error) return renderError();
  if (isEmpty) return renderEmpty();

  return (
    <View style={styles.container}>
      {renderHeaderBar(false, currentUser?.coinBalance || 0, currentUser?.name?.split(' ')[0] || 'User')}
      <FlatList
        data={coursesData}
        keyExtractor={(item: any) => item._id}
        renderItem={renderCourseItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // --- HEADERS ---
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E4E7',
    marginRight: 12,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  coinPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinTextMinimal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 1,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  welcomeSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  coinPillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    borderRadius: 6,
    marginRight: 6,
  },
  coinTextPrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  // --- STATE SCREENS (ERROR/EMPTY) ---
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -60, // adjust visual center
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.pillBg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  errorCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.errorRed,
    marginRight: 8,
  },
  errorCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },

  // --- SKELETON LOADING ---
  skeletonContainer: {
    paddingHorizontal: 24,
    gap: 20,
  },
  skeletonCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonImage: {
    height: 120,
    backgroundColor: COLORS.pillBg,
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonTextLong: {
    height: 16,
    width: '80%',
    backgroundColor: COLORS.pillBg,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonTextMedium: {
    height: 16,
    width: '50%',
    backgroundColor: COLORS.pillBg,
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skeletonPill: {
    height: 24,
    width: 60,
    backgroundColor: COLORS.pillBg,
    borderRadius: 12,
  },

  // --- DEFAULT LAYOUT ---
  listContent: {
    paddingBottom: 40,
  },
  featuredScroll: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  featuredCard: {
    width: width * 0.75,
    height: 180,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
  },
  featuredBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  featuredContent: {
    gap: 6,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  featuredSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A1A1AA',
    letterSpacing: 1,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  categoryPill: {
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: COLORS.text,
  },
  
  // --- LIST CARD ---
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listCardImage: {
    width: 80,
    height: 80,
    backgroundColor: '#3F3F46',
    borderRadius: 12,
    marginRight: 16,
  },
  listCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  listCardSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  listCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgePremium: {
    backgroundColor: COLORS.premiumBg,
  },
  badgeFree: {
    backgroundColor: COLORS.freeBg,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  textPremium: {
    color: COLORS.premiumText,
  },
  textFree: {
    color: COLORS.freeText,
  },
  ratingBox: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingDot: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  ratingDotActive: {
    backgroundColor: COLORS.primary,
  },
});