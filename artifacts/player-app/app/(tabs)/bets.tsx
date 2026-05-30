import { useGetMyBets } from '@workspace/api-client-react';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

interface Bet {
  id: number;
  marketId: number;
  marketName?: string;
  gameType: string;
  numbers: Array<{ number: string; amount: string }>;
  totalAmount: string;
  status: string;
  winAmount?: string;
  createdAt: string;
}

const FILTERS = ['All', 'Pending', 'Won', 'Lost'] as const;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusColor(status: string, colors: ReturnType<typeof useColors>) {
  if (status === 'won') return '#4ade80';
  if (status === 'lost') return colors.destructive;
  return colors.mutedForeground;
}

function BetCard({ bet }: { bet: Bet }) {
  const colors = useColors();
  const sColor = statusColor(bet.status, colors);
  const numbersStr = bet.numbers.map((n) => n.number).join(', ');

  return (
    <View style={[bcStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={bcStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[bcStyles.market, { color: colors.foreground }]} numberOfLines={1}>
            {bet.marketName ?? `Market ${bet.marketId}`}
          </Text>
          <Text style={[bcStyles.gameType, { color: colors.mutedForeground }]}>
            {bet.gameType.toUpperCase().replace('_', '-')}
          </Text>
        </View>
        <View style={[bcStyles.badge, { backgroundColor: colors.muted }]}>
          <Text style={[bcStyles.badgeText, { color: sColor }]}>
            {bet.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[bcStyles.sep, { backgroundColor: colors.border }]} />

      <View style={bcStyles.row}>
        <Text style={[bcStyles.label, { color: colors.mutedForeground }]}>Numbers</Text>
        <Text style={[bcStyles.value, { color: colors.foreground }]} numberOfLines={2}>
          {numbersStr}
        </Text>
      </View>

      <View style={bcStyles.row}>
        <Text style={[bcStyles.label, { color: colors.mutedForeground }]}>Amount</Text>
        <Text style={[bcStyles.amount, { color: colors.foreground }]}>₹{bet.totalAmount}</Text>
      </View>

      {bet.winAmount && parseFloat(bet.winAmount) > 0 && (
        <View style={bcStyles.row}>
          <Text style={[bcStyles.label, { color: colors.mutedForeground }]}>Won</Text>
          <Text style={[bcStyles.winAmount, { color: '#4ade80' }]}>₹{bet.winAmount}</Text>
        </View>
      )}

      <View style={bcStyles.row}>
        <Text style={[bcStyles.label, { color: colors.mutedForeground }]}>Date</Text>
        <Text style={[bcStyles.date, { color: colors.mutedForeground }]}>
          {formatDate(bet.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const bcStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  market: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  gameType: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  sep: {
    height: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    maxWidth: '70%',
    textAlign: 'right',
  },
  amount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  winAmount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

export default function BetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const statusParam = activeFilter === 'All' ? undefined : activeFilter.toLowerCase();
  const { data, isLoading, refetch, isRefetching } = useGetMyBets({
    status: statusParam,
    limit: 50,
  });
  const bets = (data ?? []) as Bet[];

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
    filters: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterBtnText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
    },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    listContent: {
      paddingTop: 8,
      paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 80),
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Bets</Text>
      </View>

      <View style={s.filters}>
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                s.filterBtn,
                {
                  backgroundColor: active ? colors.secondary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  s.filterBtnText,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : bets.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>No bets found</Text>
        </View>
      ) : (
        <FlatList
          data={bets}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BetCard bet={item} />}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={!!isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
