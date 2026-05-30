import {
  useGetMarket,
  usePlaceBet,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

type GameType = 'jantri' | 'open' | 'crossing' | 'no_to_no';

interface BetEntry {
  number: string;
  amount: string;
}

interface Market {
  id: number;
  name: string;
  openTime: string;
  closeTime: string;
  status: string;
  minBet: string;
  maxBet: string;
  isBettingOpen?: boolean;
  todayResult?: {
    openNumber?: string | null;
    closeNumber?: string | null;
    jodiNumber?: string | null;
  } | null;
}

const GAME_TYPES: { key: GameType; label: string; desc: string }[] = [
  { key: 'jantri', label: 'Jantri', desc: 'Single digit 0-9' },
  { key: 'open', label: 'Open', desc: '3-digit number' },
  { key: 'crossing', label: 'Crossing', desc: 'Two numbers crossed' },
  { key: 'no_to_no', label: 'No-to-No', desc: 'Number range' },
];

function numberPlaceholder(gameType: GameType) {
  if (gameType === 'jantri') return 'Single digit (0-9)';
  if (gameType === 'open') return '3-digit number (e.g. 456)';
  if (gameType === 'crossing') return 'Two numbers (e.g. 12 34)';
  return 'Number range';
}

export default function MarketDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const qc = useQueryClient();

  const marketId = parseInt(id ?? '0', 10);
  const { data: marketData, isLoading } = useGetMarket(marketId);
  const market = marketData as Market | undefined;

  const { mutateAsync: placeBet, isPending: isPlacing } = usePlaceBet();

  const [activeGame, setActiveGame] = useState<GameType>('jantri');
  const [entries, setEntries] = useState<BetEntry[]>([]);
  const [numInput, setNumInput] = useState('');
  const [amtInput, setAmtInput] = useState('');

  useEffect(() => {
    if (market?.name) {
      navigation.setOptions({ title: market.name });
    }
  }, [market?.name]);

  const totalAmount = entries.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0,
  );

  function addEntry() {
    if (!numInput.trim()) {
      Alert.alert('Error', 'Enter a number');
      return;
    }
    if (!amtInput || parseFloat(amtInput) <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (market?.minBet && parseFloat(amtInput) < parseFloat(market.minBet)) {
      Alert.alert('Error', `Minimum bet is ₹${market.minBet}`);
      return;
    }
    if (market?.maxBet && parseFloat(amtInput) > parseFloat(market.maxBet)) {
      Alert.alert('Error', `Maximum bet is ₹${market.maxBet}`);
      return;
    }
    setEntries((prev) => [
      ...prev,
      { number: numInput.trim(), amount: amtInput },
    ]);
    setNumInput('');
    setAmtInput('');
    void Haptics.selectionAsync();
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePlaceBet() {
    if (entries.length === 0) {
      Alert.alert('Error', 'Add at least one bet entry');
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await placeBet({
        data: {
          marketId,
          gameType: activeGame,
          numbers: entries,
          totalAmount: totalAmount.toFixed(2),
        },
      });
      Alert.alert('Success!', `Bet placed for ₹${totalAmount.toFixed(2)}`, [
        {
          text: 'OK',
          onPress: () => {
            setEntries([]);
            void qc.invalidateQueries({ queryKey: ['getMyBets'] });
            void qc.invalidateQueries({ queryKey: ['getBalance'] });
          },
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place bet';
      Alert.alert('Error', msg);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    marketInfo: {
      margin: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    infoBlock: { alignItems: 'center', flex: 1 },
    infoLabel: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      letterSpacing: 0.8,
      marginBottom: 3,
    },
    infoValue: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
      gap: 8,
    },
    resultLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    resultValue: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.ring,
      letterSpacing: 2,
    },
    gameTypeTabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
    },
    gameTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    gameTabText: {
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
    },
    inputCard: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addBtn: {
      backgroundColor: colors.secondary,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    addBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    entryNum: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    entryAmt: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginRight: 12,
    },
    removeBtn: {
      padding: 4,
    },
    removeBtnText: {
      fontSize: 16,
      color: colors.destructive,
    },
    totalBar: {
      marginHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    totalLabel: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    totalAmount: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.ring,
    },
    placeBtn: {
      marginHorizontal: 16,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16),
    },
    placeBtnDisabled: { opacity: 0.6 },
    placeBtnText: {
      fontSize: 17,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryForeground,
    },
    closedBanner: {
      margin: 16,
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    closedText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.destructive,
    },
  });

  if (isLoading) {
    return (
      <View style={[s.container, s.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isClosed = market?.status !== 'active' && !market?.isBettingOpen;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {market && (
          <View style={s.marketInfo}>
            <View style={s.infoRow}>
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>OPEN TIME</Text>
                <Text style={s.infoValue}>{market.openTime}</Text>
              </View>
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>CLOSE TIME</Text>
                <Text style={s.infoValue}>{market.closeTime}</Text>
              </View>
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>BET RANGE</Text>
                <Text style={s.infoValue}>
                  ₹{market.minBet}–₹{market.maxBet}
                </Text>
              </View>
            </View>
            {market.todayResult && (
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Today's Result:</Text>
                <Text style={s.resultValue}>
                  {market.todayResult.openNumber ?? '?'}-
                  {market.todayResult.jodiNumber ?? '??'}-
                  {market.todayResult.closeNumber ?? '?'}
                </Text>
              </View>
            )}
          </View>
        )}

        {isClosed ? (
          <View style={s.closedBanner}>
            <Text style={s.closedText}>Betting is currently closed</Text>
          </View>
        ) : (
          <>
            <View style={s.gameTypeTabs}>
              {GAME_TYPES.map((g) => {
                const active = activeGame === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    style={[
                      s.gameTab,
                      active && { backgroundColor: colors.card },
                    ]}
                    onPress={() => {
                      setActiveGame(g.key);
                      setEntries([]);
                      setNumInput('');
                      setAmtInput('');
                    }}
                  >
                    <Text
                      style={[
                        s.gameTabText,
                        { color: active ? colors.primary : colors.mutedForeground },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.inputCard}>
              <View style={s.inputRow}>
                <TextInput
                  style={[s.input, { flex: 1.5 }]}
                  value={numInput}
                  onChangeText={setNumInput}
                  placeholder={numberPlaceholder(activeGame)}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="default"
                  maxLength={activeGame === 'jantri' ? 1 : 10}
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={amtInput}
                  onChangeText={setAmtInput}
                  placeholder={`₹${market?.minBet ?? '10'}`}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
                <Pressable style={s.addBtn} onPress={addEntry}>
                  <Text style={s.addBtnText}>ADD</Text>
                </Pressable>
              </View>

              {entries.map((entry, i) => (
                <View key={i} style={s.entryRow}>
                  <Text style={s.entryNum}>{entry.number}</Text>
                  <Text style={s.entryAmt}>₹{entry.amount}</Text>
                  <Pressable style={s.removeBtn} onPress={() => removeEntry(i)}>
                    <Text style={s.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {entries.length > 0 && (
              <View style={s.totalBar}>
                <Text style={s.totalLabel}>
                  {entries.length} bet{entries.length !== 1 ? 's' : ''} · Total
                </Text>
                <Text style={s.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                s.placeBtn,
                (isPlacing || entries.length === 0) && s.placeBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handlePlaceBet}
              disabled={isPlacing || entries.length === 0}
            >
              {isPlacing ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={s.placeBtnText}>
                  Place Bet{entries.length > 0 ? ` · ₹${totalAmount.toFixed(2)}` : ''}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
