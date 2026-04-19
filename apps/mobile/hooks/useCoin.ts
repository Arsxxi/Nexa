import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

export function useCoin() {
  // Get current user for balance and to provide userId to mutations
  const user = useQuery(api.users.getCurrentUser);
  const balance = useQuery(api.coins.getCoinBalance);
  const coinHistory = useQuery(api.coins.getCoinHistory);
  const addCoinsMutation = useMutation(api.coins.addCoins);
  const spendCoinsMutation = useMutation(api.coins.spendCoins);

  const currentBalance = balance ?? (user?.coinBalance || 0);
  const loading = balance === undefined || user === undefined;
  const transactions = coinHistory ?? [];

  const addCoins = async (amount: number, reason: string, type: 'course_complete' | 'quiz_bonus' | 'streak_bonus' = 'quiz_bonus', courseId?: string) => {
    if (!user) throw new Error('User not found');
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      const newBalance = await addCoinsMutation({
        userId: user._id,
        amount,
        type,
        courseId: courseId as any,
        note: reason,
      });
      return newBalance;
    } catch (error) {
      console.error('Failed to add coins:', error);
      throw error;
    }
  };

  const spendCoins = async (amount: number, reason: string, courseId?: string) => {
    if (!user) throw new Error('User not found');
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    try {
      const newBalance = await spendCoinsMutation({
        userId: user._id,
        amount,
        courseId: courseId as any,
        note: reason,
      });
      return newBalance;
    } catch (error) {
      console.error('Failed to spend coins:', error);
      throw error;
    }
  };

  return { balance: currentBalance, loading, transactions, addCoins, spendCoins };
}
