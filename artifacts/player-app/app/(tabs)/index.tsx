import { useGetMarkets, useGetRecentResults } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

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
  marketName?: string;
  date: string;
  openNumber?: string | null;
  closeNumber?: string | null;
  jodiNumber?: string | null;
}

function StatusBadge({ status, isBettingOpen }: { status: string; isBettingOpen?: boolean }) {
  const colors = useColors();
  const isOpen = isBettingOpen || status === 'active';
  return (
    <View
      style={[
        badgeStyles.badge,
        { backgroundColor: isOpen ? colors.secondary : colors.muted },
      ]}
    >
      <View
        style={[
          badgeStyles.dot,
          { backgroundColor: isOpen ? colors.primary : colors.mutedForeground },
        ]}
      />
      <Text
        style={[
          badgeStyles.text,
          { color: isOpen ? colors.primary : colors.mutedForeground },
        ]}
      >
        {isOpen ? 'OPEN' : 'CLOSED'}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});

function MarketCard({ market }: { market: Market }) {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => router.push(`/market/${market.id}`)}
    >
      <View style={cardStyles.row}>
        <Text style={[cardStyles.name, { color: colors.foreground }]}>
          {market.name}
        </Text>
        <StatusBadge status={market.status} isBettingOpen={market.isBettingOpen} />
      </View>

      <View style={cardStyles.timesRow}>
        <View style={cardStyles.timeBlock}>
          <Text style={[cardStyles.timeLabel, { color: colors.mutedForeground }]}>OPEN</Text>
          <Text style={[cardStyles.timeValue, { color: colors.foreground }]}>
            {market.openTime}
          </Text>
        </View>
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />
        <View style={cardStyles.timeBlock}>
          <Text style={[cardStyles.timeLabel, { color: colors.mutedForeground }]}>CLOSE</Text>
          <Text style={[cardStyles.timeValue, { color: colors.foreground }]}>
            {market.closeTime}
          </Text>
        </View>
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />
        <View style={cardStyles.timeBlock}>
          <Text style={[cardStyles.timeLabel, { color: colors.mutedForeground }]}>TODAY</Text>
          {market.todayResult ? (
            <Text style={[cardStyles.resultValue, { color: colors.ring }]}>
              {market.todayResult.openNumber ?? '?'}-{market.todayResult.jodiNumber ?? '??'}-{market.todayResult.closeNumber ?? '?'}
            </Text>
          ) : (
            <Text style={[cardStyles.resultDash, { color: colors.mutedForeground }]}>
              ?-??-?
            </Text>
          )}
        </View>
      </View>

      <View style={cardStyles.betRange}>
        <Text style={[cardStyles.betRangeText, { color: colors.mutedForeground }]}>
          Bet: ₹{market.minBet} – ₹{market.maxBet}
        </Text>
        <Text style={[cardStyles.betNow, { color: colors.primary }]}>
          Bet Now →
        </Text>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  timeValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  resultDash: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
  divider: {
    width: 1,
    height: 30,
    marginHorizontal: 8,
  },
  betRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  betRangeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  betNow: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});

function RecentResultRow({ result }: { result: Result }) {
  const colors = useColors();
  return (
    <View
      style={[
        rrStyles.row,
        { borderBottomColor: colors.border },
      ]}
    >
      <Text style={[rrStyles.market, { color: colors.foreground }]} numberOfLines={1}>
        {result.marketName ?? `Market ${result.marketId}`}
      </Text>
      <Text style={[rrStyles.date, { color: colors.mutedForeground }]}>
        {result.date}
      </Text>
      <Text style={[rrStyles.result, { color: colors.ring }]}>
        {result.openNumber ?? '?'}-{result.jodiNumber ?? '??'}-{result.closeNumber ?? '?'}
      </Text>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  market: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginRight: 12,
  },
  result: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    minWidth: 80,
    textAlign: 'right',
  },
});

export default function MarketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: markets, isLoading, refetch, isRefetching } = useGetMarkets();
  const { data: recentResults } = useGetRecentResults();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12),
      paddingBottom: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: 0.5,
    },
    headerSub: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 1,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    resultsCard: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 80),
    },
  });

  if (isLoading) {
    return (
      <View style={[s.container, s.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const marketList = (markets ?? []) as Market[];
  const resultList = ((recentResults ?? []) as Result[]).slice(0, 10);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Our Empire</Text>
        <Text style={s.headerSub}>Satta Matka Platform</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>LIVE MARKETS</Text>
        </View>

        {marketList.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No markets available</Text>
          </View>
        ) : (
          marketList.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))
        )}

        {resultList.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>RECENT RESULTS</Text>
            </View>
            <View style={s.resultsCard}>
              {resultList.map((r) => (
                <RecentResultRow key={r.id} result={r} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
