import {
  useGetMarket,
  useListMarketResults,
  usePlaceBet,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

interface Result {
  id: number;
  marketId: number;
  date: string;
  openNumber?: string | null;
  closeNumber?: string | null;
  jodiNumber?: string | null;
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

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' });
  } catch {
    return dateStr;
  }
}

function NumberFrequencyChart({ results }: { results: Result[] }) {
  const colors = useColors();

  const freq = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach((r) => {
      if (r.jodiNumber) {
        const jodi = r.jodiNumber.trim();
        map.set(jodi, (map.get(jodi) ?? 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [results]);

  const maxCount = freq[0]?.[1] ?? 1;

  if (freq.length === 0) return null;

  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: colors.muted,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: 0.5 }}>
          🔥 HOT JODI NUMBERS
        </Text>
        <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedForeground }}>
          Last {results.length} records
        </Text>
      </View>
      <View style={{ padding: 14, gap: 8 }}>
        {freq.map(([num, count]) => (
          <View key={num} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{
              fontSize: 14,
              fontFamily: 'Inter_700Bold',
              color: colors.ring,
              width: 36,
              textAlign: 'center',
            }}>{num}</Text>
            <View style={{ flex: 1, height: 20, backgroundColor: colors.muted, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{
                height: '100%',
                width: `${(count / maxCount) * 100}%`,
                backgroundColor: colors.primary,
                borderRadius: 4,
              }} />
            </View>
            <Text style={{
              fontSize: 12,
              fontFamily: 'Inter_600SemiBold',
              color: colors.mutedForeground,
              width: 36,
              textAlign: 'right',
            }}>{count}×</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResultHistoryTable({ results, isLoading }: { results: Result[]; isLoading: boolean }) {
  const colors = useColors();

  const sorted = [...results].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: colors.muted,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: 0.5 }}>
          📅 COMPLETE RESULT HISTORY
        </Text>
        {sorted.length > 0 && (
          <View style={{ backgroundColor: colors.secondary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
              {sorted.length} records
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : sorted.length === 0 ? (
        <Text style={{ textAlign: 'center', padding: 24, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
          No results declared yet
        </Text>
      ) : (
        <>
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{ flex: 2, fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase' }}>Date</Text>
            <Text style={{ flex: 1, fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' }}>Open</Text>
            <Text style={{ flex: 1, fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' }}>Jodi</Text>
            <Text style={{ flex: 1, fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' }}>Close</Text>
          </View>
          {sorted.map((r, i) => (
            <View key={r.id} style={{
              flexDirection: 'row',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: i < sorted.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              alignItems: 'center',
              backgroundColor: i % 2 === 1 ? colors.muted : colors.card,
            }}>
              <Text style={{ flex: 2, fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.mutedForeground }}>
                {formatDate(r.date)}
              </Text>
              <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground, textAlign: 'center' }}>
                {r.openNumber ?? '?'}
              </Text>
              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.ring, textAlign: 'center', letterSpacing: 0.5 }}>
                {r.jodiNumber ?? '??'}
              </Text>
              <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground, textAlign: 'center' }}>
                {r.closeNumber ?? '?'}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function LuckyNumberWidget() {
  const colors = useColors();
  const [lucky, setLucky] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  async function generateLucky() {
    setIsSpinning(true);
    setLucky(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      const jodi = String(Math.floor(Math.random() * 100)).padStart(2, '0');
      setLucky(jodi);
      setIsSpinning(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  }

  return (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, letterSpacing: 0.8, marginBottom: 4 }}>
          🍀 LUCKY JODI
        </Text>
        {isSpinning ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : lucky ? (
          <Text style={{ fontSize: 32, fontFamily: 'Inter_700Bold', color: colors.ring, letterSpacing: 4 }}>
            {lucky}
          </Text>
        ) : (
          <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
            Tap to generate
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: colors.secondary,
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.primary,
        }}
        onPress={generateLucky}
        disabled={isSpinning}
      >
        <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.primary }}>
          {isSpinning ? '...' : lucky ? 'Retry' : 'Generate'}
        </Text>
      </TouchableOpacity>
    </View>
  );
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
  const { data: resultsData, isLoading: resultsLoading } = useListMarketResults(marketId);
  const results = (resultsData ?? []) as Result[];

  const { mutateAsync: placeBet, isPending: isPlacing } = usePlaceBet();

  const [activeGame, setActiveGame] = useState<GameType>('jantri');
  const [entries, setEntries] = useState<BetEntry[]>([]);
  const [numInput, setNumInput] = useState('');
  const [amtInput, setAmtInput] = useState('');
  const [activeTab, setActiveTab] = useState<'bet' | 'chart'>('bet');

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
    mainTabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: colors.muted,
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
    },
    mainTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 6,
    },
    mainTabText: {
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
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
    removeBtn: { padding: 4 },
    removeBtnText: { fontSize: 16, color: colors.destructive },
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
      marginBottom: 16,
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 90),
        }}
      >
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
                <Text style={s.infoValue}>₹{market.minBet}–₹{market.maxBet}</Text>
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

        {/* Main tabs: Bet | Chart */}
        <View style={s.mainTabs}>
          {(['bet', 'chart'] as const).map((t) => {
            const active = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[s.mainTab, active && { backgroundColor: colors.card }]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[s.mainTabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {t === 'bet' ? '🎯 Place Bet' : '📊 Result Chart'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'bet' ? (
          isClosed ? (
            <View style={s.closedBanner}>
              <Text style={s.closedText}>🔒 Betting is currently closed</Text>
            </View>
          ) : (
            <>
              <View style={s.gameTypeTabs}>
                {GAME_TYPES.map((g) => {
                  const active = activeGame === g.key;
                  return (
                    <TouchableOpacity
                      key={g.key}
                      style={[s.gameTab, active && { backgroundColor: colors.card }]}
                      onPress={() => { setActiveGame(g.key); setEntries([]); setNumInput(''); setAmtInput(''); }}
                    >
                      <Text style={[s.gameTabText, { color: active ? colors.primary : colors.mutedForeground }]}>
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
                  <Text style={s.totalLabel}>{entries.length} bet{entries.length !== 1 ? 's' : ''} · Total</Text>
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
          )
        ) : (
          <>
            <LuckyNumberWidget />
            <NumberFrequencyChart results={results} />
            <ResultHistoryTable results={results} isLoading={resultsLoading} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
