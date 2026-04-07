import { useState, useEffect } from 'react';

export function useCoin() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Convex query
    const fetchBalance = async () => {
      setLoading(true);
      try {
        setBalance(150);
      } catch (error) {
        console.error('Failed to fetch coin balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const addCoins = async (amount: number, reason: string) => {
    // TODO: Call Convex mutation
    setBalance((prev) => prev + amount);
  };

  const spendCoins = async (amount: number, reason: string) => {
    // TODO: Call Convex mutation
    if (balance >= amount) {
      setBalance((prev) => prev - amount);
      return true;
    }
    return false;
  };

  return { balance, loading, addCoins, spendCoins };
}
