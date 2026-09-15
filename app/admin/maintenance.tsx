import React, { useState } from 'react';
import {
  View,
  Text,
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
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemProduct, SystemSettings, SystemMaintenanceLog } from '../../src/types/database';
import { AdminTabSkeleton } from '../../src/components/skeletonScreen';

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
      <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
        <AppTopBar title="Maintenance Control" showBack={true} />
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-xl font-bold text-white mb-2">Access Restricted</Text>
          <Text className="text-xs text-slate-400 text-center">
            Admin credentials required to view central service controls.
          </Text>
        </View>
      </AppScreen>
    );
  }

  const isGlobalActive = Boolean(globalSettings?.global_maintenance_enabled);

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Maintenance Control" subtitle="Central Availability Hub" showBack={true} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refetchingGlobal || refetchingProducts || refetchingLogs}
            onRefresh={onRefresh}
            tintColor="#0084FF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Global Maintenance Card */}
        <View
          className={`flex-row items-center rounded-2xl p-4 mb-4 border ${
            isGlobalActive
              ? 'border-red-500/50 bg-red-500/10'
              : 'border-[#262930] bg-[#181A1F]'
          }`}
        >
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className={`text-sm font-black ${isGlobalActive ? 'text-red-400' : 'text-white'}`}>
                GLOBAL MAINTENANCE
              </Text>
              {globalMutation.isPending && <ActivityIndicator size="small" color="#0084FF" />}
            </View>
            <Text className="text-xs text-slate-400 leading-4">
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
            trackColor={{ false: '#262930', true: '#ef4444' }}
            thumbColor="#fff"
          />
        </View>

        {/* Tab selector */}
        <View className="flex-row gap-2.5 mb-4">
          <Pressable
            className={`flex-1 py-2.5 rounded-xl items-center border ${
              activeTab === 'overview' ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
            }`}
            onPress={() => setActiveTab('overview')}
          >
            <Text className={`text-xs font-bold ${activeTab === 'overview' ? 'text-white' : 'text-slate-400'}`}>
              Services Overview
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2.5 rounded-xl items-center border ${
              activeTab === 'history' ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#181A1F] border-[#262930]'
            }`}
            onPress={() => setActiveTab('history')}
          >
            <Text className={`text-xs font-bold ${activeTab === 'history' ? 'text-white' : 'text-slate-400'}`}>
              Maintenance History ({logs?.length || 0})
            </Text>
          </Pressable>
        </View>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View>
            <Text className="text-sm font-black text-white mb-3">Product Services</Text>

            {loadingProducts ? (
              <AdminTabSkeleton />
            ) : (
              products?.map((p) => {
                const isUnder = Boolean(p.maintenance_enabled) || isGlobalActive;
                return (
                  <View key={p.id} className="rounded-2xl p-4 mb-3 border border-[#262930] bg-[#181A1F]">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-extrabold text-white">{p.product_name}</Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">Key: {p.product_key}</Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded-md ${
                          isUnder ? 'bg-red-500/20' : 'bg-emerald-500/20'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black ${isUnder ? 'text-red-400' : 'text-emerald-400'}`}
                        >
                          {isUnder ? 'MAINTENANCE' : 'OPERATIONAL'}
                        </Text>
                      </View>
                    </View>

                    <View className="h-px bg-[#262930] my-3" />

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-slate-400 font-semibold">Maintenance</Text>
                        <Switch
                          value={Boolean(p.maintenance_enabled)}
                          onValueChange={(v) => handleQuickToggle(p, v)}
                          trackColor={{ false: '#262930', true: '#ef4444' }}
                          thumbColor="#fff"
                        />
                      </View>
                      <Pressable
                        className="px-3 py-1.5 rounded-lg border border-[#262930] bg-[#111317]"
                        onPress={() => handleManageClick(p)}
                      >
                        <Text className="text-xs font-bold text-white">Manage Settings</Text>
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
            <Text className="text-sm font-black text-white mb-3">Audit Activity Logs</Text>

            {loadingLogs ? (
              <AdminTabSkeleton />
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.id} className="rounded-xl p-3.5 mb-2.5 border border-[#262930] bg-[#181A1F]">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-white">{log.action}</Text>
                    <Text className="text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {log.product_key && (
                    <Text className="text-xs font-semibold text-blue-400 mt-1">
                      Product: {log.product_key.toUpperCase()}
                    </Text>
                  )}
                  {log.reason && <Text className="text-[11px] text-slate-400 mt-0.5">{log.reason}</Text>}
                </View>
              ))
            ) : (
              <View className="p-6 items-center rounded-xl bg-[#181A1F] border border-[#262930]">
                <Text className="text-xs text-slate-400">No logs found.</Text>
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
          <View className="flex-1 bg-black/70 justify-center p-4">
            <View className="rounded-3xl p-5 border border-[#262930] bg-[#181A1F]">
              <Text className="text-base font-black text-white">Configure {selectedProduct?.product_name}</Text>
              <Text className="text-xs text-slate-400 mt-1 mb-3">Update maintenance message and options</Text>

              <Text className="text-xs font-bold text-slate-300 mb-1 mt-2">Notice Title</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={maintenanceTitle}
                onChangeText={setMaintenanceTitle}
                placeholder="Scheduled Maintenance"
                placeholderTextColor="#64748B"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1 mt-2.5">Public Explanation</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white h-20"
                value={maintenanceMessage}
                onChangeText={setMaintenanceMessage}
                multiline
                textAlignVertical="top"
                placeholder="Message for users visiting the service"
                placeholderTextColor="#64748B"
              />

              <Text className="text-xs font-bold text-slate-300 mb-1 mt-2.5">Internal Log Reason</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={internalNote}
                onChangeText={setInternalNote}
                placeholder="Reason for audit"
                placeholderTextColor="#64748B"
              />

              <View className="flex-row items-center justify-between my-3.5">
                <Text className="text-xs font-semibold text-white">Block App Frontend</Text>
                <Switch
                  value={blockFrontend}
                  onValueChange={setBlockFrontend}
                  trackColor={{ false: '#262930', true: '#0084FF' }}
                  thumbColor="#fff"
                />
              </View>

              <View className="flex-row gap-2.5 mt-2">
                <Pressable
                  className="flex-1 py-3 rounded-xl items-center border border-[#262930] bg-[#111317]"
                  onPress={() => setIsManageOpen(false)}
                >
                  <Text className="text-xs font-bold text-white">Cancel</Text>
                </Pressable>
                <Pressable
                  className="flex-1 py-3 rounded-xl items-center bg-[#0084FF]"
                  onPress={handleSaveManage}
                  disabled={updateProductMutation.isPending}
                >
                  <Text className="text-xs font-extrabold text-white">Save Configuration</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </AppScreen>
  );
}
