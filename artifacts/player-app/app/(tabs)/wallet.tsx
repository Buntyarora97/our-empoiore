import {
  useGetBalance,
  useGetTransactions,
  useGetUpiInfo,
  useRequestAddMoney,
  useRequestWithdrawal,
} from '@workspace/api-client-react';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type WalletTab = 'deposit' | 'withdraw' | 'history';

interface Transaction {
  id: number;
  type: string;
  amount: string;
  status: string;
  utrNumber?: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function txStatusColor(status: string, colors: ReturnType<typeof useColors>) {
  if (status === 'approved' || status === 'completed') return '#4ade80';
  if (status === 'rejected') return colors.destructive;
  return '#f59e0b';
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<WalletTab>('deposit');

  const [depositAmount, setDepositAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');

  const { data: balanceData, refetch: refetchBalance } = useGetBalance();
  const { data: upiInfo } = useGetUpiInfo();
  const { data: transactions, refetch: refetchTx, isRefetching } = useGetTransactions({
    limit: 50,
  });

  const { mutateAsync: requestDeposit, isPending: isDepositing } = useRequestAddMoney();
  const { mutateAsync: requestWithdrawal, isPending: isWithdrawing } = useRequestWithdrawal();

  const balance = (balanceData as { balance: string } | undefined)?.balance ?? '0.00';
  const upiIdToDisplay = (upiInfo as { upiId: string } | undefined)?.upiId ?? '';
  const txList = (transactions ?? []) as Transaction[];

  async function handleDeposit() {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (!utrNumber.trim()) {
      Alert.alert('Error', 'Enter UTR/Transaction number');
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await requestDeposit({
        data: {
          amount: depositAmount,
          utrNumber: utrNumber.trim(),
          method: 'upi',
        },
      });
      Alert.alert('Success', 'Deposit request submitted. Awaiting admin approval.');
      setDepositAmount('');
      setUtrNumber('');
      void refetchBalance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deposit failed';
      Alert.alert('Error', msg);
    }
  }

  async function handleWithdraw() {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (!upiId.trim()) {
      Alert.alert('Error', 'Enter your UPI ID');
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await requestWithdrawal({
        data: {
          amount: withdrawAmount,
          method: 'upi',
          upiId: upiId.trim(),
        },
      });
      Alert.alert('Success', 'Withdrawal request submitted. Processing soon.');
      setWithdrawAmount('');
      setUpiId('');
      void refetchBalance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      Alert.alert('Error', msg);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12),
      paddingBottom: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    balanceCard: {
      margin: 16,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    balanceLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.primary,
      letterSpacing: 1,
    },
    balanceAmount: {
      fontSize: 36,
      fontFamily: 'Inter_700Bold',
      color: colors.ring,
      marginTop: 4,
    },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    tabText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    content: {
      paddingHorizontal: 16,
    },
    upiBox: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    upiLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    upiId: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
    },
    upiNote: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 4,
    },
    field: { marginBottom: 14 },
    label: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
    },
    txCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    txLeft: { flex: 1 },
    txType: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      textTransform: 'capitalize',
    },
    txDate: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    txRight: { alignItems: 'flex-end' },
    txAmount: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    txStatus: {
      fontSize: 10,
      fontFamily: 'Inter_600SemiBold',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      paddingVertical: 40,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Wallet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={() => { void refetchBalance(); void refetchTx(); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 80),
        }}
      >
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={s.balanceAmount}>₹{balance}</Text>
        </View>

        <View style={s.tabs}>
          {(['deposit', 'withdraw', 'history'] as WalletTab[]).map((t) => {
            const active = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  s.tab,
                  active && { backgroundColor: colors.card },
                ]}
                onPress={() => setActiveTab(t)}
              >
                <Text
                  style={[
                    s.tabText,
                    { color: active ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.content}>
          {activeTab === 'deposit' && (
            <>
              {upiIdToDisplay ? (
                <View style={s.upiBox}>
                  <Text style={s.upiLabel}>PAY TO UPI ID</Text>
                  <Text style={s.upiId}>{upiIdToDisplay}</Text>
                  <Text style={s.upiNote}>
                    Transfer money, then enter the UTR number below
                  </Text>
                </View>
              ) : null}

              <View style={s.field}>
                <Text style={s.label}>Amount (₹)</Text>
                <TextInput
                  style={s.input}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
              <View style={s.field}>
                <Text style={s.label}>UTR / Transaction Number</Text>
                <TextInput
                  style={s.input}
                  value={utrNumber}
                  onChangeText={setUtrNumber}
                  placeholder="12-digit UTR number"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={[s.submitBtn, isDepositing && s.submitBtnDisabled]}
                onPress={handleDeposit}
                disabled={isDepositing}
              >
                {isDepositing ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={s.submitBtnText}>Submit Deposit</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'withdraw' && (
            <>
              <View style={s.field}>
                <Text style={s.label}>Amount (₹)</Text>
                <TextInput
                  style={s.input}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
              <View style={s.field}>
                <Text style={s.label}>Your UPI ID</Text>
                <TextInput
                  style={s.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <TouchableOpacity
                style={[s.submitBtn, isWithdrawing && s.submitBtnDisabled, { backgroundColor: colors.accent }]}
                onPress={handleWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[s.submitBtnText, { color: '#fff' }]}>Request Withdrawal</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'history' && (
            <>
              {txList.length === 0 ? (
                <Text style={s.emptyText}>No transactions yet</Text>
              ) : (
                txList.map((tx) => (
                  <View key={tx.id} style={s.txCard}>
                    <View style={s.txLeft}>
                      <Text style={s.txType}>{tx.type}</Text>
                      <Text style={s.txDate}>{formatDate(tx.createdAt)}</Text>
                    </View>
                    <View style={s.txRight}>
                      <Text
                        style={[
                          s.txAmount,
                          {
                            color:
                              tx.type === 'deposit'
                                ? '#4ade80'
                                : colors.foreground,
                          },
                        ]}
                      >
                        {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount}
                      </Text>
                      <Text
                        style={[
                          s.txStatus,
                          { color: txStatusColor(tx.status, colors) },
                        ]}
                      >
                        {tx.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
