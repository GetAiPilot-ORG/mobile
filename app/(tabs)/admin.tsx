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
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SystemProduct, SystemSettings, SystemMaintenanceLog } from '../../src/types/database';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = usePlatformSubscription();
  const queryClient = useQueryClient();

  // Admin Tab selection
  const [adminTab, setAdminTab] = useState<'maintenance' | 'products' | 'logs'>('maintenance');

  // Modal state for editing product maintenance
  const [selectedProduct, setSelectedProduct] = useState<SystemProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [blockFrontend, setBlockFrontend] = useState(true);
  const [blockApi, setBlockApi] = useState(false);

  // 1. Fetch Global System Settings
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
        console.warn('system_settings notice:', error.message);
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

  // 2. Fetch System Products
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
        console.warn('system_products notice:', error.message);
        return [
          {
            id: '1',
            product_key: 'whatsapp',
            product_name: 'GAP WhatsApp Hub',
            status: 'operational',
            maintenance_enabled: false,
          },
          {
            id: '2',
            product_key: 'telegram',
            product_name: 'GAP Telegram Auto-Forwarder',
            status: 'operational',
            maintenance_enabled: false,
          },
          {
            id: '3',
            product_key: 'voice_ai',
            product_name: 'GAP AI Voice Agent',
            status: 'operational',
            maintenance_enabled: false,
          },
          {
            id: '4',
            product_key: 'social',
            product_name: 'GAP Social Hub',
            status: 'operational',
            maintenance_enabled: false,
          },
          {
            id: '5',
            product_key: 'crm',
            product_name: 'GAP Smart CRM',
            status: 'operational',
            maintenance_enabled: false,
          },
        ] as SystemProduct[];
      }
      return data as SystemProduct[];
    },
    enabled: !!isAdmin,
  });

  // 3. Fetch Maintenance Audit Logs
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
        .limit(20);

      if (error) {
        console.warn('system_maintenance_logs notice:', error.message);
        return [];
      }
      return data as SystemMaintenanceLog[];
    },
    enabled: !!isAdmin,
  });

  // Global Maintenance Toggle Mutation
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

      // Log it
      await supabase.from('system_maintenance_logs').insert({
        action: enabled ? 'Global Maintenance Enabled' : 'Global Maintenance Disabled',
        changed_by: user?.id,
        reason: enabled ? 'Admin toggled global emergency maintenance' : 'Admin restored full platform access',
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

  // Update Product Maintenance Mutation
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
      setIsModalOpen(false);
      Alert.alert('Success', `Updated settings for ${data.product_name || 'product'}.`);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update product maintenance.');
    },
  });

  const handleToggleGlobal = (nextVal: boolean) => {
    Alert.alert(
      nextVal ? 'Enable Global Maintenance?' : 'Disable Global Maintenance?',
      nextVal
        ? 'This will place the entire GetAIPilot platform in maintenance mode for all end-users.'
        : 'This will restore public access to all services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextVal ? 'Enable Mode' : 'Restore Live',
          style: nextVal ? 'destructive' : 'default',
          onPress: () => globalMutation.mutate(nextVal),
        },
      ]
    );
  };

  const handleOpenConfig = (product: SystemProduct) => {
    setSelectedProduct(product);
    setMaintenanceTitle(product.maintenance_title || 'Service Upgrade in Progress');
    setMaintenanceMessage(
      product.maintenance_message ||
        'We are currently upgrading server infrastructure. Service will resume shortly.'
    );
    setInternalNote(product.internal_note || '');
    setBlockFrontend(product.block_frontend ?? true);
    setBlockApi(product.block_api ?? false);
    setIsModalOpen(true);
  };

  const handleSaveProductConfig = () => {
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

  const handleQuickToggleProduct = (product: SystemProduct, nextVal: boolean) => {
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
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedTitle}>Access Restricted</Text>
          <Text style={styles.deniedSubtitle}>
            You do not have administrative privileges to view or manage platform maintenance controls.
          </Text>
        </View>
      </AppScreen>
    );
  }

  const isGlobalActive = Boolean(globalSettings?.global_maintenance_enabled);
  const totalProductsCount = products?.length || 0;
  const inMaintenanceCount = products?.filter((p) => p.maintenance_enabled).length || 0;
  const operationalCount = totalProductsCount - inMaintenanceCount;

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
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
        {/* Admin Header */}
        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>SUPERADMIN CONSOLE</Text>
          </View>
          <Text style={styles.title}>System Control Hub</Text>
          <Text style={styles.subtitle}>
            Manage global maintenance modes, service health, and audit logs.
          </Text>
        </View>

        {/* System Health Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Platform Status</Text>
            <Text
              style={[
                styles.metricValue,
                { color: isGlobalActive ? '#ef4444' : '#16b882' },
              ]}
            >
              {isGlobalActive ? 'MAINTENANCE' : 'LIVE'}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Operational Services</Text>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {operationalCount}/{totalProductsCount}
            </Text>
          </View>
        </View>

        {/* Sales Leads Quick Access */}
        <Pressable
          style={styles.leadsBtn}
          onPress={() => router.push('/admin/sales-leads' as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.leadsBtnTitle}>👥 Sales Leads & Outreach CRM</Text>
            <Text style={styles.leadsBtnSub}>Manage prospective clients, signups, and follow-ups</Text>
          </View>
          <Text style={styles.leadsBtnArrow}>→</Text>
        </Pressable>

        {/* Global Maintenance Kill Switch Card */}
        <View
          style={[
            styles.killSwitchCard,
            isGlobalActive ? styles.killSwitchCardAlert : null,
          ]}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.killSwitchHeader}>
              <Text
                style={[
                  styles.killSwitchTitle,
                  isGlobalActive ? { color: '#ef4444' } : { color: colors.foreground },
                ]}
              >
                Global Platform Maintenance
              </Text>
              {globalMutation.isPending && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
            <Text style={styles.killSwitchDesc}>
              {isGlobalActive
                ? 'All web/app services are currently showing maintenance splash to public visitors.'
                : 'Turn ON to route all traffic to the maintenance page for urgent platform maintenance.'}
            </Text>
          </View>
          <Switch
            value={isGlobalActive}
            onValueChange={handleToggleGlobal}
            disabled={globalMutation.isPending}
            trackColor={{ false: '#333', true: '#ef4444' }}
            thumbColor="#fff"
          />
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabButton, adminTab === 'maintenance' && styles.tabButtonActive]}
            onPress={() => setAdminTab('maintenance')}
          >
            <Text style={[styles.tabText, adminTab === 'maintenance' && styles.tabTextActive]}>
              Products ({products?.length || 0})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, adminTab === 'logs' && styles.tabButtonActive]}
            onPress={() => setAdminTab('logs')}
          >
            <Text style={[styles.tabText, adminTab === 'logs' && styles.tabTextActive]}>
              Audit Logs ({logs?.length || 0})
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: PER PRODUCT MAINTENANCE */}
        {adminTab === 'maintenance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Services & Status</Text>

            {loadingProducts ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              products?.map((item) => {
                const isUnderMaintenance = Boolean(item.maintenance_enabled) || isGlobalActive;
                return (
                  <View key={item.id} style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        <Text style={styles.productKey}>ID: {item.product_key}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isUnderMaintenance
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(22, 184, 130, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isUnderMaintenance ? '#ef4444' : '#16b882' },
                          ]}
                        >
                          {isUnderMaintenance ? 'MAINTENANCE' : 'OPERATIONAL'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.productDivider} />

                    <View style={styles.productActions}>
                      <View style={styles.switchWrapper}>
                        <Text style={styles.switchLabel}>Maintenance Mode</Text>
                        <Switch
                          value={Boolean(item.maintenance_enabled)}
                          onValueChange={(val) => handleQuickToggleProduct(item, val)}
                          trackColor={{ false: '#333', true: '#ef4444' }}
                          thumbColor="#fff"
                        />
                      </View>
                      <Pressable
                        style={styles.configButton}
                        onPress={() => handleOpenConfig(item)}
                      >
                        <Text style={styles.configButtonText}>Configure Notice</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* SECTION 2: AUDIT LOGS */}
        {adminTab === 'logs' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maintenance Activity History</Text>

            {loadingLogs ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logTop}>
                    <Text style={styles.logAction}>{log.action}</Text>
                    <Text style={styles.logDate}>
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {log.product_key && (
                    <Text style={styles.logTarget}>Target: {log.product_key.toUpperCase()}</Text>
                  )}
                  {log.reason && <Text style={styles.logReason}>Note: {log.reason}</Text>}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No maintenance logs recorded yet.</Text>
              </View>
            )}
          </View>
        )}

        {/* PRODUCT CONFIGURATION MODAL */}
        <Modal
          visible={isModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Configure: {selectedProduct?.product_name}
              </Text>
              <Text style={styles.modalSubtitle}>
                Customize message shown to users when accessing this service.
              </Text>

              <Text style={styles.inputLabel}>Notice Title</Text>
              <TextInput
                style={styles.input}
                value={maintenanceTitle}
                onChangeText={setMaintenanceTitle}
                placeholder="Notice headline"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>User Notice Message</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={maintenanceMessage}
                onChangeText={setMaintenanceMessage}
                multiline
                placeholder="Explanation message for users"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={styles.inputLabel}>Internal Admin Reason</Text>
              <TextInput
                style={styles.input}
                value={internalNote}
                onChangeText={setInternalNote}
                placeholder="Reason for audit logs"
                placeholderTextColor={colors.mutedForeground}
              />

              <View style={styles.modalSwitchRow}>
                <Text style={styles.modalSwitchLabel}>Block App Frontend Access</Text>
                <Switch
                  value={blockFrontend}
                  onValueChange={setBlockFrontend}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.modalButtonRow}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setIsModalOpen(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveButton,
                    updateProductMutation.isPending && { opacity: 0.7 },
                  ]}
                  onPress={handleSaveProductConfig}
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Notice</Text>
                  )}
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
  header: {
    marginBottom: 20,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22, 184, 130, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 130, 0.4)',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16b882',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  killSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  killSwitchCardAlert: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  killSwitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  killSwitchTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  killSwitchDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  productKey: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  productDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  configButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  configButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logAction: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  logDate: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  logTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
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
    fontSize: 14,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  deniedSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalSwitchLabel: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '600',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  leadsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16B882',
  },
  leadsBtnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  leadsBtnSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  leadsBtnArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16B882',
    marginLeft: 8,
  },
});
