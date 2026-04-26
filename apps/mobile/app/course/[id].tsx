import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ImageBackground
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

// ==========================================
// MAIN COMPONENT (LOGIC & ROUTING)
// ==========================================
export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // --- BACKEND FUNCTIONS & QUERIES ---
  const courseData = useQuery(api.courses.getCourseDetails, { courseId: id as any });
  const lessonsData = useQuery(api.lessons.getLessonsByCourse, { courseId: id as any });
  const currentUser = useQuery(api.users.getCurrentUser);
  const enrollMutation = useMutation(api.courses.enrollFreeCourse);

  // Refetch progress when returning from lesson screen
  useFocusEffect(
    useCallback(() => {
      // Convex queries auto-refetch on focus - this ensures fresh progress data
    }, [])
  );

  const isLoading = courseData === undefined || lessonsData === undefined;
  const error = courseData === null;

  const course = courseData;
  const lessons = lessonsData || [];

  const handleEnrollFree = async () => {
    try {
      if (currentUser) {
        await enrollMutation({ userId: currentUser._id, courseId: id as any });
      }
    } catch (err) {
      console.error('Enroll failed:', err);
    }
  };

  const handleLessonPress = (lesson: any, index: number) => {
    // Check if lesson is locked (not yet unlocked because previous lessons not completed)
    const completedLessons = course?.completedLessons || 0;
    const isLocked = index > completedLessons;
    
    if (isLocked) {
      // Cannot access locked lesson - show alert or do nothing
      return;
    }
    
    if (lesson.isFree || course?.isEnrolled || index === 0) {
      router.push(`/course/lesson/${lesson._id}`);
    } else {
      router.push(`/payment/${id}`);
    }
  };

  // --- LOADING & ERROR STATES ---
  if (isLoading) {
    return (
      <SafeAreaView style={[commonStyles.safeArea, commonStyles.center]}>
        <Text style={commonStyles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={[commonStyles.safeArea, commonStyles.center]}>
        <Text style={commonStyles.errorText}>Course not found</Text>
      </SafeAreaView>
    );
  }

  // --- CONDITIONAL RENDERING ---
  // 1. Jika User Sudah Enroll -> Tampilkan Enrolled UI
  if (course.isEnrolled) {
    return (
      <EnrolledView 
        course={course} 
        lessons={lessons} 
        router={router} 
        onLessonPress={handleLessonPress} 
      />
    );
  }

  // 2. Jika Belum Enroll & Course Premium -> Tampilkan Premium UI
  if (course.type === 'premium') {
    return (
      <PremiumView 
        course={course} 
        lessons={lessons} 
        router={router} 
      />
    );
  }

  // 3. Jika Belum Enroll & Course Free -> Tampilkan Free UI
  return (
    <FreeView 
      course={course} 
      lessons={lessons} 
      router={router} 
      onEnroll={handleEnrollFree} 
    />
  );
}

// ==========================================
// UI COMPONENT: ENROLLED
// ==========================================
const EnrolledView = ({ course, lessons, router, onLessonPress }: any) => {
  const totalLessons = lessons.length > 0 ? lessons.length : course.totalLessons || 0;
  const completedLessons = course.completedLessons || 0;
  const progressPercentage = course.progress || 0;

  return (
    <SafeAreaView style={stylesEnrolled.safeArea}>
      <View style={stylesEnrolled.header}>
        <TouchableOpacity onPress={() => router.back()} style={stylesEnrolled.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#18181B" />
        </TouchableOpacity>
        <Text style={stylesEnrolled.headerTitle}>NEXA</Text>
        <TouchableOpacity style={stylesEnrolled.iconButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#18181B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={stylesEnrolled.container} showsVerticalScrollIndicator={false}>
        <ImageBackground 
          source={{ uri: course.thumbnailUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000' }} 
          style={stylesEnrolled.bannerContainer}
          imageStyle={stylesEnrolled.bannerImage}
        >
          <View style={stylesEnrolled.bannerOverlay}>
            <View style={stylesEnrolled.tagDark}>
              <Text style={stylesEnrolled.tagDarkText}>ENROLLED</Text>
            </View>
            <Text style={stylesEnrolled.bannerTitle}>{course.title}</Text>
            <Text style={stylesEnrolled.bannerSubtitle}>{course.description?.substring(0, 80)}...</Text>
          </View>
        </ImageBackground>

        <View style={stylesEnrolled.progressContainer}>
          <View style={stylesEnrolled.progressHeader}>
            <Text style={stylesEnrolled.progressText}>{completedLessons} DARI {totalLessons} LESSON SELESAI</Text>
            <Text style={stylesEnrolled.progressPercentage}>{progressPercentage}%</Text>
          </View>
          <View style={stylesEnrolled.segmentsContainer}>
            {Array.from({ length: totalLessons }).map((_, index) => (
              <View 
                key={index} 
                style={[
                  stylesEnrolled.segment, 
                  index < completedLessons ? stylesEnrolled.segmentCompleted : stylesEnrolled.segmentIncomplete
                ]} 
              />
            ))}
          </View>
        </View>

        <View style={stylesEnrolled.syllabusSection}>
          <Text style={stylesEnrolled.sectionTitle}>SYLLABUS</Text>
          
          {lessons.map((lesson: any, index: number) => {
            // Logika status UI Lesson (Completed / Active / Locked)
            const isCompleted = index < completedLessons;
            const isActive = index === completedLessons;
            const isLocked = index > completedLessons;

            return (
              <TouchableOpacity 
                key={lesson._id} 
                onPress={() => onLessonPress(lesson, index)}
                disabled={isLocked}
                activeOpacity={isLocked ? 1 : 0.7}
              >
                {isActive ? (
                  <View style={stylesEnrolled.lessonItemActive}>
                    <View style={stylesEnrolled.iconBoxActive}>
                      <Ionicons name="play" size={18} color="#18181B" style={{ marginLeft: 2 }} />
                    </View>
                    <View style={stylesEnrolled.lessonContent}>
                      <Text style={stylesEnrolled.lessonSubtitleActive}>
                        {String(index + 1).padStart(2, '0')} // LESSON
                      </Text>
                      <Text style={stylesEnrolled.lessonTitleActive}>{lesson.title}</Text>
                      <Text style={stylesEnrolled.lessonDesc} numberOfLines={2}>
                        {lesson.description || 'Materi pembelajaran...'}
                      </Text>
                      <View style={stylesEnrolled.durationPill}>
                        <Text style={stylesEnrolled.durationPillText}>{Math.ceil((lesson.duration || 0) / 60)} MIN</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={stylesEnrolled.lessonItem}>
                    <View style={isCompleted ? stylesEnrolled.iconBoxCompleted : stylesEnrolled.iconBoxLocked}>
                      <Ionicons name={isCompleted ? "checkmark" : "lock-closed-outline"} size={16} color={isCompleted ? "#18181B" : "#A1A1AA"} />
                    </View>
                    <View style={stylesEnrolled.lessonContent}>
                      <Text style={isCompleted ? stylesEnrolled.lessonSubtitle : stylesEnrolled.lessonSubtitleLocked}>
                        {String(index + 1).padStart(2, '0')} // LESSON
                      </Text>
                      <Text style={isCompleted ? stylesEnrolled.lessonTitleCompleted : stylesEnrolled.lessonTitleLocked}>
                        {lesson.title}
                      </Text>
                      <Text style={isCompleted ? stylesEnrolled.lessonDuration : stylesEnrolled.lessonDurationLocked}>
                        {Math.ceil((lesson.duration || 0) / 60)} MIN
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={stylesEnrolled.bottomBar}>
        <TouchableOpacity 
          style={stylesEnrolled.primaryButton} 
          onPress={() => onLessonPress(lessons[completedLessons] || lessons[0], completedLessons)}
        >
          <Text style={stylesEnrolled.primaryButtonText}>
            {completedLessons >= totalLessons ? 'SEMUA SELESAI' : 'LANJUTKAN BELAJAR'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#18181B" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// UI COMPONENT: PREMIUM
// ==========================================
const PremiumView = ({ course, lessons, router }: any) => {
  const totalDuration = lessons.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0);
  const totalHours = Math.floor(totalDuration / 60);

  return (
    <SafeAreaView style={stylesPremium.safeArea}>
      <View style={stylesPremium.header}>
        <TouchableOpacity onPress={() => router.back()} style={stylesPremium.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#18181B" />
        </TouchableOpacity>
        <Text style={stylesPremium.headerTitle}>NEXA</Text>
        <TouchableOpacity style={stylesPremium.iconButton}>
          
        </TouchableOpacity>
      </View>

      <ScrollView style={stylesPremium.container} showsVerticalScrollIndicator={false}>
        <ImageBackground 
          source={{ uri: course.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000' }} 
          style={stylesPremium.bannerContainer}
          imageStyle={stylesPremium.bannerImage}
        >
          <View style={stylesPremium.bannerOverlay}>
            <View style={stylesPremium.tagDark}>
              <Text style={stylesPremium.tagDarkText}>
                {course.category ? course.category.toUpperCase() : 'PREMIUM'} • INTERMEDIATE
              </Text>
            </View>
            <Text style={stylesPremium.bannerTitle}>{course.title}</Text>
          </View>
        </ImageBackground>

        <View style={stylesPremium.content}>
          <View style={stylesPremium.pillsRow}>
            <View style={stylesPremium.pillLight}>
              <Ionicons name="book-outline" size={14} color="#52525B" />
              <Text style={stylesPremium.pillLightText}>{lessons.length} LESSON</Text>
            </View>
            <View style={stylesPremium.pillLight}>
              <Ionicons name="time-outline" size={14} color="#52525B" />
              <Text style={stylesPremium.pillLightText}>{totalHours > 0 ? `${totalHours} JAM` : `${totalDuration} MIN`}</Text>
            </View>
          </View>
          <View style={stylesPremium.pillsRow}>
            <View style={stylesPremium.pillLightAlt}>
              <Ionicons name="star-outline" size={14} color="#92400E" />
              <Text style={stylesPremium.pillLightAltText}>{course.rewardCoins || 1500} COIN REWARD</Text>
            </View>
            <View style={stylesPremium.pillDark}>
              <Ionicons name="pricetag-outline" size={14} color="#FFC700" />
              <Text style={stylesPremium.pillDarkText}>
                {course.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          <View style={stylesPremium.overviewSection}>
            <Text style={stylesPremium.sectionTitle}>COURSE_OVERVIEW</Text>
            <Text style={stylesPremium.description}>
              {course.description}
            </Text>
          </View>
        </View>

        <View style={stylesPremium.syllabusContainer}>
          <Text style={stylesPremium.syllabusHeader}>SYLLABUS // LOCKED</Text>
          {lessons.map((lesson: any, index: number) => (
            <View key={lesson._id} style={stylesPremium.syllabusItem}>
              <View style={stylesPremium.iconBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#71717A" />
              </View>
              <View style={stylesPremium.syllabusContent}>
                <Text style={stylesPremium.syllabusItemTitle}>{String(index + 1).padStart(2, '0')}. {lesson.title}</Text>
                <Text style={stylesPremium.syllabusItemSub}>VIDEO • {Math.ceil((lesson.duration || 0) / 60)} MIN</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={stylesPremium.bottomBar}>
        <TouchableOpacity style={stylesPremium.buyButton} onPress={() => router.push(`/payment/${course._id}`)}>
          <Text style={stylesPremium.buyButtonText}>
            BELI COURSE • {course.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
          </Text>
          <Ionicons name="cart-outline" size={20} color="#FFC700" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// UI COMPONENT: FREE
// ==========================================
const FreeView = ({ course, lessons, router, onEnroll }: any) => {
  const totalDuration = lessons.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0);
  const totalHours = Math.floor(totalDuration / 60);

  return (
    <SafeAreaView style={stylesFree.safeArea}>
      <View style={stylesFree.header}>
        <TouchableOpacity onPress={() => router.back()} style={stylesFree.backButton}>
          <Ionicons name="arrow-back" size={24} color="#18181B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={stylesFree.container} showsVerticalScrollIndicator={false}>
        <ImageBackground 
          source={{ uri: course.thumbnailUrl }} 
          style={stylesFree.bannerContainer}
          imageStyle={stylesFree.bannerImage}
        >
          <View style={stylesFree.bannerOverlay}>
            <View style={stylesFree.bannerTags}>
              <View style={stylesFree.tagDark}>
                <Text style={stylesFree.tagDarkText}>{course.category ? course.category.toUpperCase() : 'TEKNOLOGI'} • BEGINNER</Text>
              </View>
              <View style={stylesFree.tagGreen}>
                <Text style={stylesFree.tagGreenText}>FREE</Text>
              </View>
            </View>
            <Text style={stylesFree.bannerTitle}>{course.title}</Text>
          </View>
        </ImageBackground>

        <View style={stylesFree.infoPillsContainer}>
          <View style={stylesFree.pill}>
            <Ionicons name="book-outline" size={14} color="#52525B" />
            <Text style={stylesFree.pillText}>{lessons.length} LESSON</Text>
          </View>
          <View style={stylesFree.pill}>
            <Ionicons name="time-outline" size={14} color="#52525B" />
            <Text style={stylesFree.pillText}>{totalHours > 0 ? `${totalHours} JAM` : `${totalDuration} MNT`}</Text>
          </View>
          <View style={stylesFree.pillReward}>
            <Ionicons name="disc" size={14} color="#52525B" />
            <Text style={stylesFree.pillText}>{course.rewardCoins || 500} COIN REWARD</Text>
          </View>
        </View>

        <View style={stylesFree.sectionHeader}>
          <Text style={stylesFree.sectionTitle}>TENTANG COURSE</Text>
          <View style={stylesFree.dottedLine} />
        </View>
        <Text style={stylesFree.descriptionText}>{course.description}</Text>

        <View style={stylesFree.sectionHeader}>
          <Text style={stylesFree.sectionTitle}>SILABUS</Text>
          <View style={stylesFree.dottedLine} />
        </View>

        <View style={stylesFree.syllabusList}>
          {lessons.map((lesson: any, index: number) => {
            const isAccessible = lesson.isFree || index === 0;
            return (
              <View key={lesson._id} style={stylesFree.syllabusItem}>
                <View style={stylesFree.syllabusLeft}>
                  <View style={[stylesFree.iconWrapper, !isAccessible ? stylesFree.iconLocked : stylesFree.iconUnlocked]}>
                    <Ionicons name={!isAccessible ? "lock-closed" : "play"} size={20} color={!isAccessible ? "#A1A1AA" : "#18181B"} style={isAccessible && { marginLeft: 3 }} />
                  </View>
                  <View style={stylesFree.syllabusTextGroup}>
                    <Text style={stylesFree.lessonSubtitle}>LESSON {String(index + 1).padStart(2, '0')}</Text>
                    <Text style={[stylesFree.lessonTitle, !isAccessible && stylesFree.textMuted]}>{lesson.title}</Text>
                  </View>
                </View>
                <Text style={stylesFree.durationText}>{Math.ceil((lesson.duration || 0) / 60)}m</Text>
              </View>
            )
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={stylesFree.bottomBar}>
        <TouchableOpacity style={stylesFree.actionButton} onPress={onEnroll}>
          <Text style={stylesFree.actionButtonText}>MULAI BELAJAR GRATIS</Text>
          <Ionicons name="arrow-forward" size={20} color="#18181B" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// STYLES 
// ==========================================
const commonStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#71717A' },
  errorText: { fontSize: 16, color: '#EF4444', fontWeight: 'bold' },
});

const stylesEnrolled = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 16, letterSpacing: 2, color: '#18181B' },
  bannerContainer: { height: 220, backgroundColor: '#18181B' },
  bannerImage: { opacity: 0.4 },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24 },
  tagDark: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 12 },
  tagDarkText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  bannerTitle: { color: '#FFC700', fontSize: 28, fontFamily: TYPOGRAPHY.h1.fontFamily, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  bannerSubtitle: { color: '#E4E4E7', fontSize: 14 },
  progressContainer: { padding: 24, backgroundColor: '#FAFAFA' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, color: '#52525B' },
  progressPercentage: { fontSize: 12, fontWeight: 'bold', color: '#18181B' },
  segmentsContainer: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  segmentCompleted: { backgroundColor: '#18181B' },
  segmentIncomplete: { backgroundColor: '#E4E4E7' },
  syllabusSection: { padding: 24, backgroundColor: '#FFFFFF' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1, marginBottom: 24, color: '#18181B' },
  lessonItem: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  iconBoxCompleted: { width: 28, height: 28, backgroundColor: '#E4E4E7', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  iconBoxLocked: { width: 28, height: 28, borderWidth: 1, borderColor: '#E4E4E7', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  lessonContent: { flex: 1, gap: 4 },
  lessonSubtitle: { fontSize: 10, color: '#71717A', letterSpacing: 1, fontWeight: '600' },
  lessonTitleCompleted: { fontSize: 15, color: '#71717A', fontWeight: '500', textDecorationLine: 'line-through' },
  lessonDuration: { fontSize: 12, color: '#A1A1AA' },
  lessonSubtitleLocked: { fontSize: 10, color: '#A1A1AA', letterSpacing: 1, fontWeight: '600' },
  lessonTitleLocked: { fontSize: 15, color: '#A1A1AA', fontWeight: '500' },
  lessonDurationLocked: { fontSize: 12, color: '#D4D4D8' },
  lessonItemActive: { flexDirection: 'row', gap: 16, marginBottom: 24, backgroundColor: '#FAFAFA', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FFC700' },
  iconBoxActive: { width: 28, height: 28, backgroundColor: '#FFC700', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  lessonSubtitleActive: { fontSize: 10, color: '#B45309', letterSpacing: 1, fontWeight: 'bold' },
  lessonTitleActive: { fontSize: 16, color: '#18181B', fontWeight: 'bold', marginBottom: 4 },
  lessonDesc: { fontSize: 13, color: '#52525B', lineHeight: 20, marginBottom: 8 },
  durationPill: { backgroundColor: '#E4E4E7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  durationPillText: { fontSize: 10, color: '#52525B', fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 20, paddingBottom: 32 },
  primaryButton: { backgroundColor: '#FFC700', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 8, gap: 8 },
  primaryButtonText: { color: '#18181B', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});

const stylesPremium = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 16, letterSpacing: 2, color: '#18181B' },
  bannerContainer: { height: 200, backgroundColor: '#18181B' },
  bannerImage: { opacity: 0.5 },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24 },
  tagDark: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 12 },
  tagDarkText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  bannerTitle: { color: '#FFC700', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 20 },
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pillLight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F4F5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, gap: 6 },
  pillLightText: { fontSize: 12, fontWeight: '600', color: '#18181B', letterSpacing: 1 },
  pillLightAlt: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E4E4E7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, gap: 6 },
  pillLightAltText: { fontSize: 12, fontWeight: 'bold', color: '#18181B', letterSpacing: 1 },
  pillDark: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, gap: 6 },
  pillDarkText: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  overviewSection: { marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#18181B', letterSpacing: 1, marginBottom: 12 },
  description: { fontSize: 14, color: '#52525B', lineHeight: 22 },
  syllabusContainer: { backgroundColor: '#FAFAFA', marginHorizontal: 20, borderRadius: 16, padding: 20 },
  syllabusHeader: { fontSize: 12, letterSpacing: 2, color: '#52525B', marginBottom: 16 },
  syllabusItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 8, gap: 16 },
  iconBox: { width: 32, height: 32, backgroundColor: '#E4E4E7', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  syllabusContent: { flex: 1, gap: 4 },
  syllabusItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#71717A' },
  syllabusItemSub: { fontSize: 10, color: '#A1A1AA', letterSpacing: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F4F4F5' },
  buyButton: { backgroundColor: '#18181B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 8, gap: 8 },
  buyButtonText: { color: '#FFC700', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
});

const stylesFree = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 16 },
  backButton: { padding: 4 },
  bannerContainer: { borderRadius: 16, height: 200, marginBottom: 20, overflow: 'hidden', backgroundColor: '#27272A' },
  bannerImage: { borderRadius: 16, opacity: 0.6 },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' },
  bannerTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tagDark: { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: '#52525B', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  tagDarkText: { color: '#E4E4E7', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  tagGreen: { backgroundColor: '#4ADE80', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  tagGreenText: { color: '#14532D', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  bannerTitle: { color: '#FFC700', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  infoPillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F4F5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  pillReward: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E4E4E7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  pillText: { fontSize: 12, fontWeight: '600', color: '#52525B' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#52525B', letterSpacing: 2 },
  dottedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#D4D4D8', borderStyle: 'dotted' },
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#3F3F46', marginBottom: 32 },
  syllabusList: { gap: 12 },
  syllabusItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F4F5', padding: 16, borderRadius: 16 },
  syllabusLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  iconUnlocked: { backgroundColor: '#FFC700' },
  iconLocked: { backgroundColor: '#E4E4E7' },
  syllabusTextGroup: { gap: 4 },
  lessonSubtitle: { fontSize: 10, color: '#71717A', fontWeight: 'bold', letterSpacing: 1 },
  lessonTitle: { fontSize: 15, fontWeight: 'bold', color: '#18181B' },
  textMuted: { color: '#71717A' },
  durationText: { fontSize: 12, color: '#71717A' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FAFAFA', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#F4F4F5' },
  actionButton: { backgroundColor: '#FFC700', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#18181B', fontSize: 16, fontWeight: 'bold' },
});