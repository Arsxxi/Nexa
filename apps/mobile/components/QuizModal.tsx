import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface QuizModalProps {
  visible: boolean;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  onClose: () => void;
  onComplete: (correct: boolean) => void;
}

export function QuizModal({ visible, quiz, onClose, onComplete }: QuizModalProps) {
  // Fungsi dan State Anda (TIDAK DIUBAH)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedAnswer === null) {
      Alert.alert('Error', 'Please select an answer');
      return;
    }

    const isCorrect = selectedAnswer === quiz.correctAnswer;
    onComplete(isCorrect);

    if (isCorrect) {
      Alert.alert('Correct!', 'Great job! You earned coins.');
    } else {
      Alert.alert('Incorrect', `The correct answer was: ${quiz.options[quiz.correctAnswer]}`);
    }

    setSelectedAnswer(null);
  };

  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Menyentuh area background redup akan memanggil onClose (menggantikan tombol Skip) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={styles.bottomSheet}>
          {/* Handle bar di bagian atas */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>KUIS · SOAL 1 DARI 5</Text>
            <View style={styles.progressDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          {/* Pertanyaan */}
          <Text style={styles.questionText}>{quiz?.question}</Text>

          {/* Pilihan Jawaban */}
          <View style={styles.optionsContainer}>
            {quiz?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedAnswer(index)}
                  activeOpacity={0.8}
                >
                  {/* Garis kuning saat dipilih */}
                  {isSelected && <View style={styles.selectedBorder} />}
                  
                  <Text style={styles.optionLetter}>{letters[index]}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tombol Submit / Jawab */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedAnswer === null && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>JAWAB</Text>
              <Feather name="arrow-right" size={20} color="#18181B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end', // Membuatnya menjadi bottom sheet
  },
  bottomSheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: Dimensions.get('window').height * 0.9,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E4E4E7',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
    letterSpacing: 1,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#E4E4E7',
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: '#18181B',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#18181B',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  optionCardSelected: {
    backgroundColor: '#E7E5E0',
  },
  selectedBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFC800',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3F3F46',
    width: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#27272A',
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#18181B',
  },
  footer: {
    marginTop: 'auto',
  },
  submitButton: {
    backgroundColor: '#FFC800',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
});