import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Animated,
} from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, APPLE_GLASS_STYLE } from '../theme';
import { getDashboard, clearHistory, pingServer } from '../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [error, setError] = useState(null);

  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 5 ? 'Late Night' : currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : currentHour < 21 ? 'Good Evening' : 'Good Night';
  const timeEmoji = currentHour < 5 ? '🌙' : currentHour < 12 ? '☀️' : currentHour < 17 ? '🌤️' : currentHour < 21 ? '🌅' : '🌙';

  const loadData = useCallback(async () => {
    try {
      const online = await pingServer();
      setServerOnline(online);
      if (online) {
        const dashboardData = await getDashboard();
        setData(dashboardData);
        setHistory(dashboardData.recent_history || []);
        setError(null);
      } else {
        setError('Server offline. Start Flask API and check Settings.');
      }
    } catch (err) {
      console.warn(err);
      setError('Connection failed. Check WiFi and server IP in Settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleClearHistory = async () => {
    try { await clearHistory(); onRefresh(); } catch (err) { console.warn(err); }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.appleWallpaperOrbPurple} />
        <View style={styles.appleWallpaperOrbIndigo} />
        <ActivityIndicator size="large" color={COLORS.appleBlue} animating />
        <Text style={styles.loadingText}>Connecting to Neural Matrix...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
        <View style={styles.orbEmerald} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.centerContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.appleBlue} />}
        >
          <View style={[styles.appleGlassCard, { alignItems: 'center', gap: 12 }]}>
            <MaterialCommunityIcons name="wifi-strength-off-outline" size={48} color={COLORS.appleRed} />
            <Text style={styles.errorTitle}>Server Unreachable</Text>
            <Text style={styles.errorText}>{error || 'Could not connect to Flask API server'}</Text>
            <TouchableOpacity onPress={loadData} style={styles.appleActionButton}>
              <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>Retry Connection</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.secondaryActionBtn}>
              <MaterialCommunityIcons name="cog-outline" size={16} color={COLORS.appleBlue} />
              <Text style={{ color: COLORS.appleBlue, fontWeight: '600', fontSize: 13 }}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const { total_people, total_photos, photos_per_person, requires_retrain, models_loaded, history_stats } = data;
  const { total_predictions, success_count, error_count } = history_stats;
  const successRate = total_predictions > 0 ? Math.round((success_count / total_predictions) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
      <View style={styles.orbEmerald} />
      <View style={styles.orbCyan} />
      <View style={styles.orbWhite} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.appleBlue} />}
      >
        {/* Retrain Warning */}
        {requires_retrain && (
          <TouchableOpacity style={styles.syncBanner} onPress={() => navigation.navigate('Models')}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.appleOrange} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.appleOrange, fontWeight: '700', fontSize: 13 }}>
                Retraining Required
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                Dataset changed. Tap to retrain models.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.appleOrange} />
          </TouchableOpacity>
        )}

        {/* Hero Greeting Card */}
        <View style={styles.appleHeroWidget}>
          <View style={styles.heroHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingText}>{timeEmoji} {timeGreeting}</Text>
              <Text style={styles.heroTitleText}>RMS Face AI</Text>
              <Text style={styles.heroSubtitleText}>Side-angle face recognition system</Text>
            </View>
            <View style={[styles.livePulseBadge, !serverOnline && { backgroundColor: 'rgba(255, 69, 58, 0.15)', borderColor: 'rgba(255, 69, 58, 0.35)' }]}>
              <View style={[styles.pulseDot, !serverOnline && { backgroundColor: COLORS.appleRed }]} />
              <Text style={[styles.liveBadgeText, !serverOnline && { color: COLORS.appleRed }]}>
                {serverOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {/* Quick Stats Row inside Hero */}
          <View style={styles.heroStatsRow}>
            <HeroStat icon="account-group" value={total_people} label="Subjects" color={COLORS.appleBlue} />
            <View style={styles.heroStatDivider} />
            <HeroStat icon="image-filter-center-focus-weak" value={total_photos} label="Samples" color={COLORS.applePurple} />
            <View style={styles.heroStatDivider} />
            <HeroStat icon="radar" value={total_predictions} label="Scans" color={COLORS.appleCyan} />
            <View style={styles.heroStatDivider} />
            <HeroStat icon="shield-check" value={`${successRate}%`} label="Accuracy" color={COLORS.appleGreen} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="camera-iris" label="Scan Face" color={COLORS.appleBlue}
            onPress={() => navigation.navigate('Recognize')}
          />
          <QuickAction
            icon="account-plus" label="Register" color={COLORS.applePurple}
            onPress={() => navigation.navigate('AddPerson')}
          />
          <QuickAction
            icon="cube-send" label="Export" color={COLORS.appleOrange}
            onPress={() => navigation.navigate('Models')}
          />
          <QuickAction
            icon="cog" label="Settings" color={COLORS.appleCyan}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        {/* Model Status Cards */}
        <Text style={styles.sectionHeaderTitle}>ENGINE STATUS</Text>
        <View style={styles.modelStatusRow}>
          <ModelStatusCard
            name="DeepFace" subtitle="Facenet512 Embeddings"
            icon="brain" loaded={models_loaded.deepface}
          />
          <ModelStatusCard
            name="MobileNetV2" subtitle="Side-Face Classifier"
            icon="cellphone-cog" loaded={models_loaded.sota}
          />
        </View>

        {/* Registered Subjects */}
        <Text style={styles.sectionHeaderTitle}>
          REGISTERED SUBJECTS ({Object.keys(photos_per_person || {}).length})
        </Text>
        {Object.keys(photos_per_person || {}).length === 0 ? (
          <TouchableOpacity
            style={[styles.appleGlassCard, { alignItems: 'center', paddingVertical: SPACING.xl }]}
            onPress={() => navigation.navigate('AddPerson')}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No subjects registered yet</Text>
            <Text style={{ color: COLORS.appleBlue, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
              Tap to add your first subject →
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.appleGlassCard}>
            {Object.keys(photos_per_person || {}).map((name, idx, arr) => {
              const count = photos_per_person[name] || 0;
              return (
                <View key={name}>
                  <TouchableOpacity
                    style={styles.profileRow}
                    onPress={() => navigation.navigate('ManagePerson', { personName: name })}
                  >
                    <View style={styles.avatarGlassCircle}>
                      <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.profileName}>{name.replace(/_/g, ' ')}</Text>
                      <Text style={styles.profileSub}>{count} dataset photos</Text>
                    </View>
                    <View style={styles.photoCountBadge}>
                      <Text style={styles.photoCountText}>{count}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                  {idx < arr.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Scan Logs */}
        <View style={styles.logHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>RECENT SCANS ({history.length})</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearLogBtn}>
              <MaterialCommunityIcons name="delete-outline" size={14} color={COLORS.appleRed} />
              <Text style={{ color: COLORS.appleRed, fontSize: 11, fontWeight: '600' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <TouchableOpacity
            style={[styles.appleGlassCard, { alignItems: 'center', paddingVertical: SPACING.xl }]}
            onPress={() => navigation.navigate('Recognize')}
          >
            <MaterialCommunityIcons name="camera-outline" size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No scans performed yet</Text>
            <Text style={{ color: COLORS.appleBlue, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
              Tap to scan your first face →
            </Text>
          </TouchableOpacity>
        ) : (
          history.slice(0, 10).map((item, idx) => {
            const isSuccess = item.status === 'success';
            const isError = item.status === 'error';
            const badgeColor = isError ? COLORS.appleRed : isSuccess ? COLORS.appleGreen : COLORS.appleOrange;
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const confPercent = Math.round((item.confidence || 0) * 100);

            return (
              <View key={idx} style={styles.logGlassCard}>
                <View style={[styles.logStatusIndicator, { backgroundColor: badgeColor }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.logLabel}>{(item.label || 'Unknown').replace(/_/g, ' ')}</Text>
                    <Text style={[styles.logConfBadge, { color: badgeColor }]}>{confPercent}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <Text style={styles.logTime}>{timeStr}</Text>
                    <View style={styles.logDotSep} />
                    <Text style={styles.logMethod}>{item.agreement || 'single'}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function HeroStat({ icon, value, label, color }) {
  return (
    <View style={styles.heroStatItem}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIconBox, { backgroundColor: color + '18', borderColor: color + '35' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ModelStatusCard({ name, subtitle, icon, loaded }) {
  return (
    <View style={styles.modelCard}>
      <View style={styles.modelCardHeader}>
        <View style={[styles.modelIconBox, { borderColor: loaded ? 'rgba(48, 209, 88, 0.35)' : 'rgba(255, 69, 58, 0.35)' }]}>
          <MaterialCommunityIcons name={icon} size={18} color={loaded ? COLORS.appleGreen : COLORS.appleRed} />
        </View>
        <View style={[styles.modelStatusDot, { backgroundColor: loaded ? COLORS.appleGreen : COLORS.appleRed }]} />
      </View>
      <Text style={styles.modelName}>{name}</Text>
      <Text style={styles.modelSub}>{subtitle}</Text>
      <Text style={[styles.modelStatusText, { color: loaded ? COLORS.appleGreen : COLORS.appleRed }]}>
        {loaded ? '● Active' : '○ Not Found'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  loadingText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  orbEmerald: {
    position: 'absolute', top: -120, right: -100,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  orbCyan: {
    position: 'absolute', top: 250, left: -120,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(50, 173, 230, 0.15)',
  },
  orbWhite: {
    position: 'absolute', bottom: -60, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(0, 122, 255, 0.10)',
  },
  centerContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  appleGlassCard: { ...APPLE_GLASS_STYLE, marginBottom: SPACING.md },
  errorTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 4 },
  errorText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  appleActionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.appleBlue, marginTop: 8,
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  secondaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  syncBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.warningContainer,
    borderWidth: 1, borderColor: 'rgba(255, 159, 10, 0.35)',
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  // Hero Widget
  appleHeroWidget: { ...APPLE_GLASS_STYLE, padding: SPACING.lg, marginBottom: SPACING.md },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetingText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  heroTitleText: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 2 },
  heroSubtitleText: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },
  livePulseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(48, 209, 88, 0.35)',
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.appleGreen },
  liveBadgeText: { color: COLORS.appleGreen, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  heroStatsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    marginTop: SPACING.lg, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  heroStatItem: { alignItems: 'center', gap: 3 },
  heroStatValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  heroStatLabel: { color: COLORS.textTertiary, fontSize: 10, fontWeight: '600' },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(0, 0, 0, 0.08)' },
  // Quick Actions
  quickActionsContainer: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  quickActionCard: {
    flex: 1, ...APPLE_GLASS_STYLE,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  quickActionIconBox: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  quickActionText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700' },
  // Model Status
  modelStatusRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  modelCard: {
    flex: 1, ...APPLE_GLASS_STYLE, padding: SPACING.md,
  },
  modelCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modelIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center',
  },
  modelStatusDot: { width: 8, height: 8, borderRadius: 4 },
  modelName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  modelSub: { color: COLORS.textTertiary, fontSize: 10, marginTop: 2 },
  modelStatusText: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  // Section Headers
  sectionHeaderTitle: {
    color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginTop: SPACING.xs, marginBottom: SPACING.sm,
  },
  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearLogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  emptyText: { color: COLORS.textTertiary, fontSize: 13, marginTop: 8 },
  // Profiles
  profileRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  avatarGlassCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.30)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: COLORS.appleBlue, fontSize: 16, fontWeight: '800' },
  profileName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  profileSub: { color: COLORS.textTertiary, fontSize: 11, marginTop: 1 },
  photoCountBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 6,
  },
  photoCountText: { color: COLORS.appleBlue, fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.06)', marginHorizontal: SPACING.md },
  // Logs
  logGlassCard: {
    ...APPLE_GLASS_STYLE,
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  logStatusIndicator: { width: 4, height: 36, borderRadius: 2 },
  logLabel: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  logConfBadge: { fontWeight: '800', fontSize: 15 },
  logTime: { color: COLORS.textTertiary, fontSize: 11 },
  logDotSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textTertiary },
  logMethod: { color: COLORS.textTertiary, fontSize: 11 },
});
