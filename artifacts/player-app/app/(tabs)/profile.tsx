import {
  useGetProfile,
  useGetUserAnalytics,
  useGetUserNotifications,
  useMarkAllNotificationsRead,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Analytics {
  totalBets: number;
  totalWagered: string;
  totalWon: string;
  winRate: number;
  profitLoss: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [notifExpanded, setNotifExpanded] = useState(false);

  const { data: profile, refetch: refetchProfile, isRefetching } = useGetProfile();
  const { data: analytics } = useGetUserAnalytics();
  const { data: notifications, refetch: refetchNotifs } = useGetUserNotifications();
  const { mutateAsync: markAllRead } = useMarkAllNotificationsRead();

  const notifs = (notifications ?? []) as Notification[];
  const unreadCount = notifs.filter((n) => !n.isRead).length;
  const stats = analytics as Analytics | undefined;

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          qc.clear();
        },
      },
    ]);
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      void refetchNotifs();
    } catch {
      // ignore
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
    profileCard: {
      margin: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
    },
    name: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    phone: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    referralRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      padding: 10,
      backgroundColor: colors.muted,
      borderRadius: 8,
      gap: 8,
    },
    referralLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    referralCode: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: colors.ring,
      letterSpacing: 1,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 16,
      gap: 8,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statLabel: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    sectionCard: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    notifBadge: {
      backgroundColor: colors.destructive,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    notifBadgeText: {
      fontSize: 11,
      fontFamily: 'Inter_700Bold',
      color: '#fff',
    },
    markReadBtn: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.primary,
    },
    notifRow: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    notifTitle: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    notifMsg: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    notifDate: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 4,
    },
    logoutBtn: {
      marginHorizontal: 16,
      backgroundColor: colors.muted,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.destructive,
      marginBottom: 8,
    },
    logoutText: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.destructive,
    },
    supportCard: {
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 12,
    },
    supportTitle: {
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      letterSpacing: 0.8,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    supportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    supportBtnLast: {
      borderBottomWidth: 0,
    },
    supportEmoji: {
      fontSize: 22,
    },
    supportBtnText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    supportBtnSub: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 1,
    },
  });

  const displayUser = profile ?? user;
  const initials = ((displayUser as { fullName?: string } | null)?.fullName ?? user?.fullName ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={!!isRefetching}
            onRefresh={() => { void refetchProfile(); void refetchNotifs(); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 80),
        }}
      >
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>
            {(displayUser as { fullName?: string } | null)?.fullName ?? user?.fullName ?? 'Player'}
          </Text>
          <Text style={s.phone}>
            {(displayUser as { phone?: string } | null)?.phone ?? user?.phone ?? ''}
          </Text>
          {((displayUser as { referralCode?: string } | null)?.referralCode ?? user?.referralCode) ? (
            <View style={s.referralRow}>
              <Text style={s.referralLabel}>Referral Code</Text>
              <Text style={s.referralCode}>
                {(displayUser as { referralCode?: string } | null)?.referralCode ?? user?.referralCode}
              </Text>
            </View>
          ) : null}
        </View>

        {stats && (
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>TOTAL BETS</Text>
              <Text style={s.statValue}>{stats.totalBets}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>WIN RATE</Text>
              <Text style={[s.statValue, { color: colors.primary }]}>
                {stats.winRate.toFixed(1)}%
              </Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>TOTAL WON</Text>
              <Text style={[s.statValue, { color: '#4ade80' }]}>₹{stats.totalWon}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>WAGERED</Text>
              <Text style={s.statValue}>₹{stats.totalWagered}</Text>
            </View>
          </View>
        )}

        <View style={s.sectionCard}>
          <TouchableOpacity
            style={s.sectionHeader}
            onPress={() => setNotifExpanded((v) => !v)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.sectionTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={handleMarkAllRead}>
              <Text style={s.markReadBtn}>Mark all read</Text>
            </Pressable>
          </TouchableOpacity>

          {notifExpanded && notifs.length > 0 ? (
            notifs.slice(0, 10).map((n) => (
              <View
                key={n.id}
                style={[
                  s.notifRow,
                  !n.isRead && { backgroundColor: colors.muted },
                ]}
              >
                <Text style={s.notifTitle}>{n.title}</Text>
                <Text style={s.notifMsg}>{n.message}</Text>
                <Text style={s.notifDate}>{formatDate(n.createdAt)}</Text>
              </View>
            ))
          ) : notifExpanded ? (
            <View style={{ padding: 14 }}>
              <Text style={[s.notifMsg, { textAlign: 'center' }]}>No notifications</Text>
            </View>
          ) : null}
        </View>

        <View style={s.supportCard}>
          <Text style={s.supportTitle}>SUPPORT</Text>
          <TouchableOpacity
            style={s.supportBtn}
            onPress={() => {
              const num = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? '919999999999';
              void Linking.openURL(`https://wa.me/${num}`);
            }}
          >
            <Text style={s.supportEmoji}>💬</Text>
            <View>
              <Text style={s.supportBtnText}>WhatsApp Support</Text>
              <Text style={s.supportBtnSub}>Chat with us for instant help</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.supportBtn, s.supportBtnLast]}
            onPress={() => {
              const link = process.env.EXPO_PUBLIC_TELEGRAM_LINK ?? 'https://t.me/ourempire';
              void Linking.openURL(link);
            }}
          >
            <Text style={s.supportEmoji}>✈️</Text>
            <View>
              <Text style={s.supportBtnText}>Telegram Channel</Text>
              <Text style={s.supportBtnSub}>Join for results & announcements</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
