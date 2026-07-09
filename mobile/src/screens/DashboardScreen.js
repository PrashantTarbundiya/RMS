import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { getDashboard, clearHistory, pingServer } from '../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [error, setError] = useState(null);

  async function loadData() {
    try {
      const online = await pingServer();
      setServerOnline(online);
      if (online) {
        const dashboardData = await getDashboard();
        setData(dashboardData);
        setHistory(dashboardData.recent_history || []);
        setError(null);
      } else {
        setError('Server is offline. Ensure Flask API is running.');
      }
    } catch (err) {
      console.warn(err);
      setError('Failed to fetch dashboard. Check connection Settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      onRefresh();
    } catch (err) {
      console.warn(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard data...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorText}>{error || 'Could not load stats'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const { total_people, total_photos, photos_per_person, requires_retrain, models_loaded, history_stats } = data;
  const { total_predictions, success_count, error_count } = history_stats;
  const successRate = total_predictions > 0 ? Math.round((success_count / total_predictions) * 100) : 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Sync Warning Banner */}
      {requires_retrain && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncIcon}>⚠️</Text>
          <View style={styles.syncTextContainer}>
            <Text style={styles.syncTitle}>Models Out of Sync</Text>
            <Text style={styles.syncDesc}>A person was deleted or added. Retraining is required to update CNN/SOTA classifiers.</Text>
          </View>
        </View>
      )}

      {/* KPI Cards Grid */}
      <View style={styles.grid}>
        <KpiCard title="People" value={total_people} desc="Registered classes" icon="👤" />
        <KpiCard title="Cleaned Photos" value={total_photos} desc={`${total_people > 0 ? Math.round(total_photos / total_people) : 0} avg / person`} icon="🖼️" />
        <KpiCard title="Predictions" value={total_predictions} desc="Total logs" icon="⏱️" />
        <KpiCard title="Success Rate" value={`${successRate}%`} desc={`${success_count} recognized / ${error_count} unknown`} icon="✅" />
      </View>

      {/* Model Loaded Status Card */}
      <Text style={styles.sectionTitle}>Model Status</Text>
      <View style={styles.card}>
        <StatusRow label="DeepFace (Facenet512)" loaded={models_loaded.deepface} />
        <StatusRow label="Custom CNN (Classifier)" loaded={models_loaded.custom_cnn} />
        <StatusRow label="SOTA (MobileNetV2)" loaded={models_loaded.sota} />
      </View>

      {/* Registered Profiles */}
      <Text style={styles.sectionTitle}>Registered Profiles</Text>
      {Object.keys(photos_per_person || {}).length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No profiles registered yet.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {Object.keys(photos_per_person || {}).map((name, idx, arr) => {
            const count = photos_per_person[name] || 0;
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.profileRow,
                  idx === arr.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => navigation.navigate('ManagePerson', { personName: name })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>👤</Text>
                  <Text style={styles.profileName}>{name.replace(/_/g, ' ')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.profileCount}>{count} photos</Text>
                  <Text style={{ fontSize: 12, color: COLORS.primaryLight }}>✏️</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Recent History Table */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Recognition Logs</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearText}>Clear Logs</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No recent scans logged yet.</Text>
        </View>
      ) : (
        history.map((item, idx) => {
          let badgeColor = COLORS.success;
          if (item.status === 'warning') badgeColor = COLORS.warning;
          else if (item.status === 'error') badgeColor = COLORS.error;

          const date = new Date(item.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <View key={idx} style={styles.logCard}>
              <View style={styles.logLeft}>
                <Text style={styles.logTime}>{timeStr}</Text>
                <View style={[styles.badge, { backgroundColor: badgeColor + '15', borderColor: badgeColor + '30' }]}>
                  <Text style={[styles.badgeText, { color: badgeColor }]}>
                    {item.label.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.logRight}>
                <Text style={styles.logConf}>{Math.round(item.confidence * 100)}% Conf.</Text>
                <Text style={styles.logMethod}>{item.agreement}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function KpiCard({ title, value, desc, icon }) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiIcon}>{icon}</Text>
        <Text style={styles.kpiTitle} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiDesc} numberOfLines={1}>{desc}</Text>
    </View>
  );
}

function StatusRow({ label, loaded }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={[styles.statusBadge, { backgroundColor: loaded ? COLORS.success + '15' : COLORS.error + '15', borderColor: loaded ? COLORS.success + '30' : COLORS.error + '30' }]}>
        <Text style={[styles.statusBadgeText, { color: loaded ? COLORS.success : COLORS.error }]}>
          {loaded ? 'LOADED' : 'NOT FOUND'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  syncBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  syncIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  syncTextContainer: {
    flex: 1,
  },
  syncTitle: {
    color: COLORS.warning,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  syncDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    width: (width - SPACING.md * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kpiIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  kpiTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  kpiDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  clearText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.sm,
  },
  logCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTime: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.sm,
    width: 60,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  logRight: {
    alignItems: 'flex-end',
  },
  logConf: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  logMethod: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  profileCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
});
