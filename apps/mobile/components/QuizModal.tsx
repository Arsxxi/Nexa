import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

interface QuizModalProps {
  visible: boolean;
  quiz: QuizQuestion[];
  onClose: () => void;
  onComplete: (score: number, total: number, answers: QuizAnswer[]) => void;
}

export function QuizModal({ visible, quiz, onClose, onComplete }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (visible && quiz && quiz.length > 0) {
      setCurrentIndex(0);
      setAnswers(new Array(quiz.length).fill(null));
      setShowResult(false);
      setCorrectCount(0);
    }
  }, [visible, quiz]);

  const currentQuestion = quiz[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const letters = ['A', 'B', 'C', 'D', 'E'];

  const handleSelectAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      let correct = 0;
      answers.forEach((answer, idx) => {
        if (answer === quiz[idx].correctIndex) {
          correct++;
        }
      });
      setCorrectCount(correct);
      setShowResult(true);
    }
  };

  const handleFinish = () => {
    const quizAnswers: QuizAnswer[] = answers.map((selected, idx) => ({
      questionIndex: idx,
      selectedIndex: selected ?? -1,
      correctIndex: quiz[idx].correctIndex,
      isCorrect: selected === quiz[idx].correctIndex,
    }));
    const score = Math.round((correctCount / quiz.length) * 100);
    onComplete(score, quiz.length, quizAnswers);
  };

  if (showResult) {
    const score = Math.round((correctCount / quiz.length) * 100);
    const isPassing = score >= 70;

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View style={styles.bottomSheet}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.resultContainer}>
              <View style={[styles.resultCircle, isPassing ? styles.resultPass : styles.resultFail]}>
                <Text style={styles.resultScore}>{score}%</Text>
              </View>

              <Text style={styles.resultTitle}>
                {isPassing ? 'Lulus!' : 'Coba Lagi'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {correctCount} dari {quiz.length} soal benar
              </Text>

              <View style={styles.resultDetails}>
                {quiz.map((q, idx) => (
                  <View key={idx} style={styles.resultItem}>
                    <View style={[
                      styles.resultIcon,
                      answers[idx] === q.correctIndex ? styles.resultIconCorrect : styles.resultIconWrong
                    ]}>
                      <Text style={styles.resultIconText}>
                        {answers[idx] === q.correctIndex ? '✓' : '✗'}
                      </Text>
                    </View>
                    <Text style={styles.resultQuestion} numberOfLines={2}>
                      {idx + 1}. {q.question}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                <Text style={styles.finishButtonText}>
                  {isPassing ? 'Selesai' : 'Ulangi'}
                </Text>
                <Feather name="arrow-right" size={20} color="#18181B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={styles.bottomSheet}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerText}>
              KUIS · SOAL {currentIndex + 1} DARI {quiz.length}
            </Text>
            <View style={styles.progressDots}>
              {quiz.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentIndex && styles.dotActive,
                    answers[idx] !== null && styles.dotAnswered,
                  ]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.questionText}>{currentQuestion?.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion?.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelectAnswer(idx)}
                  activeOpacity={0.8}
                >
                  {isSelected && <View style={styles.selectedBorder} />}
                  <Text style={styles.optionLetter}>{letters[idx]}</Text>
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

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedAnswer === null && styles.submitButtonDisabled,
              ]}
              onPress={handleNext}
            >
              <Text style={styles.submitButtonText}>
                {currentIndex < quiz.length - 1 ? 'LANJUT' : 'SELESAI'}
              </Text>
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
    justifyContent: 'flex-end',
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
  dotAnswered: {
    backgroundColor: '#FFC800',
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
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultPass: {
    backgroundColor: '#D1FAE5',
  },
  resultFail: {
    backgroundColor: '#FEE2E2',
  },
  resultScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#18181B',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#52525B',
    marginBottom: 24,
  },
  resultDetails: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIconCorrect: {
    backgroundColor: '#D1FAE5',
  },
  resultIconWrong: {
    backgroundColor: '#FEE2E2',
  },
  resultIconText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultQuestion: {
    flex: 1,
    fontSize: 13,
    color: '#3F3F46',
  },
  finishButton: {
    backgroundColor: '#FFC800',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
});