import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemProduct, SystemSettings, SystemMaintenanceLog } from '../../src/types/database';

export default function AdminMaintenanceScreen() {
  const { user } = useAuth();
  const { isAdmin } = usePlatformSubscription();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [selectedProduct, setSelectedProduct] = useState<SystemProduct | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [blockFrontend, setBlockFrontend] = useState(true);
  const [blockApi, setBlockApi] = useState(false);

  // Global Settings
  const {
    data: globalSettings,
    isLoading: loadingGlobal,
    refetch: refetchGlobal,
    isRefetching: refetchingGlobal,
  } = useQuery<SystemSettings | null>({
    queryKey: ['admin-system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        return {
          id: 'default',
          global_maintenance_enabled: false,
          title: 'System Operational',
        } as SystemSettings;
      }
      return data as SystemSettings;
    },
    enabled: !!isAdmin,
  });

  // Products
  const {
    data: products,
    isLoading: loadingProducts,
    refetch: refetchProducts,
    isRefetching: refetchingProducts,
  } = useQuery<SystemProduct[]>({
    queryKey: ['admin-system-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_products')
        .select('*')
        .order('product_name');

      if (error) {
        return [
          { id: '1', product_key: 'whatsapp', product_name: 'GAP WhatsApp Hub', status: 'operational', maintenance_enabled: false },
          { id: '2', product_key: 'telegram', product_name: 'GAP Telegram Auto-Forwarder', status: 'operational', maintenance_enabled: false },
          { id: '3', product_key: 'voice_ai', product_name: 'GAP AI Voice Agent', status: 'operational', maintenance_enabled: false },
          { id: '4', product_key: 'social', product_name: 'GAP Social Hub', status: 'operational', maintenance_enabled: false },
          { id: '5', product_key: 'crm', product_name: 'GAP Smart CRM', status: 'operational', maintenance_enabled: false },
        ] as SystemProduct[];
      }
      return data as SystemProduct[];
    },
    enabled: !!isAdmin,
  });

  // Audit Logs
  const {
    data: logs,
    isLoading: loadingLogs,
    refetch: refetchLogs,
    isRefetching: refetchingLogs,
  } = useQuery<SystemMaintenanceLog[]>({
    queryKey: ['admin-maintenance-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_maintenance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) return [];
      return data as SystemMaintenanceLog[];
    },
    enabled: !!isAdmin,
  });

  // Toggle Global
  const globalMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (globalSettings?.id && globalSettings.id !== 'default') {
        const { error } = await supabase
          .from('system_settings')
          .update({
            global_maintenance_enabled: enabled,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('id', globalSettings.id);

        if (error) throw error;
      }

      await supabase.from('system_maintenance_logs').insert({
        action: enabled ? 'Global Maintenance Enabled' : 'Global Maintenance Disabled',
        changed_by: user?.id,
        reason: enabled ? 'Manual toggle in Maintenance Control' : 'Restored live service',
      });

      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance-logs'] });
      Alert.alert(
        'Updated',
        enabled
          ? 'Global Maintenance has been ENABLED across all services.'
          : 'Global Maintenance has been DISABLED. Services are live.'
      );
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update global maintenance.');
    },
  });

  // Update Product
  const updateProductMutation = useMutation({
    mutationFn: async (payload: Partial<SystemProduct> & { id: string }) => {
      const oldState = products?.find((p) => p.id === payload.id);

      const { error } = await supabase
        .from('system_products')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', payload.id);

      if (error) throw error;

      let action = 'Maintenance Updated';
      if (!oldState?.maintenance_enabled && payload.maintenance_enabled) action = 'Maintenance Enabled';
      if (oldState?.maintenance_enabled && !payload.maintenance_enabled) action = 'Maintenance Disabled';

      await supabase.from('system_maintenance_logs').insert({
        product_key: payload.product_key,
        action,
        previous_state: oldState,
        new_state: payload,
        changed_by: user?.id,
        reason: payload.internal_note || action,
      });

      return payload;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance-logs'] });
      setIsManageOpen(false);
      Alert.alert('Success', `Updated settings for ${data.product_name || 'product'}.`);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update product maintenance.');
    },
  });

  const handleManageClick = (product: SystemProduct) => {
    setSelectedProduct(product);
    setMaintenanceTitle(product.maintenance_title || 'Service Upgrade in Progress');
    setMaintenanceMessage(
      product.maintenance_message ||
        'We are currently upgrading server infrastructure. Service will resume shortly.'
    );
    setInternalNote(product.internal_note || '');
    setBlockFrontend(product.block_frontend ?? true);
    setBlockApi(product.block_api ?? false);
    setIsManageOpen(true);
  };

  const handleSaveManage = () => {
    if (!selectedProduct) return;
    updateProductMutation.mutate({
      id: selectedProduct.id,
      product_key: selectedProduct.product_key,
      product_name: selectedProduct.product_name,
      maintenance_enabled: selectedProduct.maintenance_enabled,
      maintenance_title: maintenanceTitle,
      maintenance_message: maintenanceMessage,
      internal_note: internalNote,
      block_frontend: blockFrontend,
      block_api: blockApi,
    });
  };

  const handleQuickToggle = (product: SystemProduct, nextVal: boolean) => {
    updateProductMutation.mutate({
      id: product.id,
      product_key: product.product_key,
      product_name: product.product_name,
      maintenance_enabled: nextVal,
      internal_note: nextVal ? 'Quick toggle enable' : 'Quick toggle disable',
    });
  };

  const onRefresh = () => {
    refetchGlobal();
    refetchProducts();
    refetchLogs();
  };

  if (!isAdmin) {
    return (
      <AppScreen safeArea={false} backgroundColor={colors.background}>
        <AppTopBar title="Maintenance Control" showBack={true} />
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedTitle}>Access Restricted</Text>
          <Text style={styles.deniedSubtitle}>
            Admin credentials required to view central service controls.
          </Text>
        </View>
      </AppScreen>
    );
  }

  const isGlobalActive = Boolean(globalSettings?.global_maintenance_enabled);

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Maintenance Control" subtitle="Central Availability Hub" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refetchingGlobal || refetchingProducts || refetchingLogs}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Global Maintenance Card */}
        <View
          style={[
            styles.globalCard,
            isGlobalActive && styles.globalCardAlert,
          ]}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.globalHeader}>
              <Text style={[styles.globalTitle, isGlobalActive && { color: '#ef4444' }]}>
                GLOBAL MAINTENANCE
              </Text>
              {globalMutation.isPending && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
            <Text style={styles.globalDesc}>
              {isGlobalActive
                ? 'All GetAIPilot products are in maintenance mode.'
                : 'Enabling will place ALL GetAIPilot products into maintenance mode immediately.'}
            </Text>
          </View>
          <Switch
            value={isGlobalActive}
            onValueChange={(val) => {
              Alert.alert(
                val ? 'Enable Global Maintenance?' : 'Restore Live Access?',
                val
                  ? 'This places all products into maintenance for public users.'
                  : 'This restores live operations.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => globalMutation.mutate(val) },
                ]
              );
            }}
            trackColor={{ false: '#333', true: '#ef4444' }}
            thumbColor="#fff"
          />
        </View>

        {/* Tab selector */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabChip, activeTab === 'overview' && styles.tabChipActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabChipText, activeTab === 'overview' && styles.tabChipTextActive]}>
              Services Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabChip, activeTab === 'history' && styles.tabChipActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabChipText, activeTab === 'history' && styles.tabChipTextActive]}>
              Maintenance History ({logs?.length || 0})
            </Text>
          </Pressable>
        </View>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionHeading}>Product Services</Text>

            {loadingProducts ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              products?.map((p) => {
                const isUnder = Boolean(p.maintenance_enabled) || isGlobalActive;
                return (
                  <View key={p.id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>{p.product_name}</Text>
                        <Text style={styles.serviceKey}>Key: {p.product_key}</Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: isUnder
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(22, 184, 130, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: isUnder ? '#ef4444' : '#16b882' },
                          ]}
                        >
                          {isUnder ? 'MAINTENANCE' : 'OPERATIONAL'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.serviceActions}>
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Maintenance</Text>
                        <Switch
                          value={Boolean(p.maintenance_enabled)}
                          onValueChange={(v) => handleQuickToggle(p, v)}
                          trackColor={{ false: '#333', true: '#ef4444' }}
                          thumbColor="#fff"
                        />
                      </View>
                      <Pressable style={styles.manageBtn} onPress={() => handleManageClick(p)}>
                        <Text style={styles.manageBtnText}>Manage Settings</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <View>
            <Text style={styles.sectionHeading}>Audit Activity Logs</Text>

            {loadingLogs ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logAction}>{log.action}</Text>
                    <Text style={styles.logDate}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {log.product_key && (
                    <Text style={styles.logKey}>Product: {log.product_key.toUpperCase()}</Text>
                  )}
                  {log.reason && <Text style={styles.logReason}>{log.reason}</Text>}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No logs found.</Text>
              </View>
            )}
          </View>
        )}

        {/* Manage Dialog Modal */}
        <Modal
          visible={isManageOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsManageOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Configure {selectedProduct?.product_name}</Text>
              <Text style={styles.modalSubtitle}>Update maintenance message and options</Text>

              <Text style={styles.fieldLabel}>Notice Title</Text>
              <TextInput
                style={styles.fieldInput}
                value={maintenanceTitle}
                onChangeText={setMaintenanceTitle}
                placeholder="Scheduled Maintenance"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.fieldLabel}>Public Explanation</Text>
              <TextInput
                style={[styles.fieldInput, { height: 75, textAlignVertical: 'top' }]}
                value={maintenanceMessage}
                onChangeText={setMaintenanceMessage}
                multiline
                placeholder="Message for users visiting the service"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.fieldLabel}>Internal Log Reason</Text>
              <TextInput
                style={styles.fieldInput}
                value={internalNote}
                onChangeText={setInternalNote}
                placeholder="Reason for audit"
                placeholderTextColor={colors.mutedForeground}
              />

              <View style={styles.modalRow}>
                <Text style={styles.modalRowText}>Block App Frontend</Text>
                <Switch
                  value={blockFrontend}
                  onValueChange={setBlockFrontend}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.btnRow}>
                <Pressable style={styles.cancelBtn} onPress={() => setIsManageOpen(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.saveBtn}
                  onPress={handleSaveManage}
                  disabled={updateProductMutation.isPending}
                >
                  <Text style={styles.saveBtnText}>Save Configuration</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  globalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  globalCardAlert: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  globalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  globalDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabChipTextActive: {
    color: colors.primaryForeground,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  serviceKey: {
    fontSize: 11.5,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  manageBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  logCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logAction: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.foreground,
  },
  logDate: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  logKey: {
    fontSize: 11.5,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  logReason: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 13.5,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  deniedSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.foreground,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  modalRowText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.foreground,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 13.5,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.primaryForeground,
    fontWeight: '800',
    fontSize: 13.5,
  },
});
