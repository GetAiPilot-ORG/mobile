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
  useColorScheme,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SystemProduct, SystemSettings, SystemMaintenanceLog } from '../../src/types/database';
import { AdminTabSkeleton } from '../../src/components/skeletonScreen';

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  mobile_number?: string;
  account_status?: 'active' | 'suspended' | 'banned';
  subscription?: string;
  is_admin?: boolean;
  created_at?: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { isAdmin } = usePlatformSubscription();
  const queryClient = useQueryClient();

  const [adminTab, setAdminTab] = useState<'maintenance' | 'users' | 'logs'>('maintenance');

  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUserForPlan, setSelectedUserForPlan] = useState<UserProfile | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState('pro_monthly');
  const [customDays, setCustomDays] = useState('30');
  const [isUpdatingUser, setIsUpdatingUser] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<SystemProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [blockFrontend, setBlockFrontend] = useState(true);
  const [blockApi, setBlockApi] = useState(false);

  // 1. Global settings query
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

  // 2. System products query
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

  // 3. User profiles query
  const {
    data: userProfiles,
    isLoading: loadingUsers,
    refetch: refetchUsers,
    isRefetching: refetchingUsers,
  } = useQuery<UserProfile[]>({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, mobile_number, account_status, subscription, is_admin, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('profiles query error:', error.message);
        return [];
      }
      return (data || []) as UserProfile[];
    },
    enabled: !!isAdmin,
  });

  // 4. Logs query
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

  // Mutations
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

  const handleUpdateStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    setIsUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Status Updated', `User status changed to ${status.toUpperCase()}.`);
      refetchUsers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update user status.');
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUserForPlan) return;
    setIsUpdatingUser(selectedUserForPlan.id);

    try {
      let durationDays = 30;
      let planLabel = 'Premium Plan';

      if (selectedPlanType === 'free_trial') {
        durationDays = 7;
        planLabel = 'Free Trial';
      } else if (selectedPlanType === 'pro_monthly') {
        durationDays = 30;
        planLabel = 'Premium Monthly';
      } else if (selectedPlanType === 'pro_semi') {
        durationDays = 180;
        planLabel = 'Platinum 6-Month';
      } else if (selectedPlanType === 'yearly') {
        durationDays = 365;
        planLabel = 'Ultimate Yearly';
      } else if (selectedPlanType === 'custom') {
        durationDays = parseInt(customDays, 10) || 30;
        planLabel = `Custom Access (${durationDays} Days)`;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await supabase.from('app_user_subscriptions').upsert({
        user_id: selectedUserForPlan.id,
        plan_id: selectedPlanType,
        plan_label: planLabel,
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      await supabase.from('profiles').update({
        subscription: `${planLabel} (${durationDays} Days)`,
        updated_at: new Date().toISOString(),
      }).eq('id', selectedUserForPlan.id);

      setIsPlanModalOpen(false);
      setSelectedUserForPlan(null);
      Alert.alert('Success', `Assigned ${planLabel} to user.`);
      refetchUsers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to assign plan.');
    } finally {
      setIsUpdatingUser(null);
    }
  };

  const handleRevokePlan = async (userId: string) => {
    Alert.alert(
      'Revoke Plan?',
      'This will cancel active subscription access and return the user to the Free tier.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            setIsUpdatingUser(userId);
            try {
              await supabase.from('app_user_subscriptions').delete().eq('user_id', userId);
              await supabase.from('profiles').update({ subscription: 'Free' }).eq('id', userId);
              Alert.alert('Revoked', 'User subscription has been set to Free.');
              refetchUsers();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to revoke plan.');
            } finally {
              setIsUpdatingUser(null);
            }
          },
        },
      ]
    );
  };

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
    refetchUsers();
    refetchLogs();
  };

  if (!isAdmin) {
    return (
      <AppScreen safeArea={false}>
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-xl font-bold text-red-500 mb-2">Access Restricted</Text>
          <Text className="text-sm text-slate-400 text-center">
            You do not have administrative privileges to view or manage platform maintenance controls.
          </Text>
        </View>
      </AppScreen>
    );
  }

  const isGlobalActive = Boolean(globalSettings?.global_maintenance_enabled);

  const filteredUsers = (userProfiles || []).filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.mobile_number && u.mobile_number.includes(userSearch));

    const matchesStatus =
      userStatusFilter === 'all' || (u.account_status || 'active') === userStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AppScreen safeArea={false}>
      <ScrollView
        className={`flex-1 ${isDark ? "bg-[#0B0D10]" : "bg-[#F2F2F7]"}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refetchingGlobal || refetchingProducts || refetchingUsers || refetchingLogs}
            onRefresh={onRefresh}
            tintColor="#0284C7"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Header */}
        <View className="mb-5">
          <View className="self-start px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 mb-2">
            <Text className="text-[10px] font-bold text-emerald-400 tracking-wider">SUPERADMIN CONSOLE</Text>
          </View>
          <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}>System Control Hub</Text>
          <Text className="text-xs text-slate-400 mt-1 leading-4.5">
            Manage global maintenance modes, user accounts, and platform operations.
          </Text>
        </View>

        {/* System Health Metric Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className={`flex-1 p-3.5 rounded-2xl border ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
            <Text className="text-xs text-slate-400">Platform Status</Text>
            <Text className={`text-base font-extrabold mt-0.5 ${isGlobalActive ? 'text-red-500' : 'text-emerald-500'}`}>
              {isGlobalActive ? 'MAINTENANCE' : 'LIVE'}
            </Text>
          </View>
          <View className={`flex-1 p-3.5 rounded-2xl border ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
            <Text className="text-xs text-slate-400">Registered Users</Text>
            <Text className={`text-base font-extrabold mt-0.5 ${isDark ? "text-white" : "text-black"}`}>
              {userProfiles?.length || 0} Accounts
            </Text>
          </View>
        </View>

        {/* Sales Leads Quick Access */}
        <Pressable
          className={`flex-row items-center p-4 rounded-2xl border border-emerald-500 mb-4 ${
            isDark ? "bg-[#181A1F]" : "bg-white"
          }`}
          onPress={() => router.push('/admin/sales-leads' as any)}
        >
          <View className="flex-1">
            <Text className={`text-sm font-extrabold ${isDark ? "text-white" : "text-black"}`}>👥 Sales Leads & Outreach CRM</Text>
            <Text className="text-xs text-slate-400 mt-0.5">Manage prospective clients, signups, and follow-ups</Text>
          </View>
          <Text className="text-xl font-extrabold text-emerald-500 ml-2">→</Text>
        </Pressable>

        {/* Global Maintenance Kill Switch Card */}
        <View
          className={`flex-row items-center justify-between p-4 rounded-2xl border mb-4 ${
            isGlobalActive
              ? "bg-red-500/10 border-red-500/40"
              : isDark
              ? "bg-[#181A1F] border-[#262930]"
              : "bg-white border-gray-200"
          }`}
        >
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className={`text-sm font-bold ${isGlobalActive ? 'text-red-500' : isDark ? 'text-white' : 'text-black'}`}>
                Global Platform Maintenance
              </Text>
              {globalMutation.isPending && <ActivityIndicator size="small" color="#0284C7" />}
            </View>
            <Text className="text-xs text-slate-400 leading-4">
              {isGlobalActive
                ? 'All web/app services are currently showing maintenance splash to public visitors.'
                : 'Turn ON to route all traffic to the maintenance page for urgent platform upgrades.'}
            </Text>
          </View>
          <Switch
            value={isGlobalActive}
            onValueChange={handleToggleGlobal}
            disabled={globalMutation.isPending}
            trackColor={{ false: '#334155', true: '#ef4444' }}
            thumbColor="#fff"
          />
        </View>

        {/* Tab Buttons: Products | Users | Logs */}
        <View className="flex-row gap-2 mb-4">
          <Pressable
            className={`flex-1 py-2 rounded-xl items-center border ${
              adminTab === 'maintenance'
                ? 'bg-[#0284C7] border-[#0284C7]'
                : isDark
                ? 'bg-[#181A1F] border-[#262930]'
                : 'bg-white border-gray-200'
            }`}
            onPress={() => setAdminTab('maintenance')}
          >
            <Text
              className={`text-xs font-bold ${
                adminTab === 'maintenance' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Products ({products?.length || 0})
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2 rounded-xl items-center border ${
              adminTab === 'users'
                ? 'bg-[#0284C7] border-[#0284C7]'
                : isDark
                ? 'bg-[#181A1F] border-[#262930]'
                : 'bg-white border-gray-200'
            }`}
            onPress={() => setAdminTab('users')}
          >
            <Text
              className={`text-xs font-bold ${
                adminTab === 'users' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Users ({userProfiles?.length || 0})
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2 rounded-xl items-center border ${
              adminTab === 'logs'
                ? 'bg-[#0284C7] border-[#0284C7]'
                : isDark
                ? 'bg-[#181A1F] border-[#262930]'
                : 'bg-white border-gray-200'
            }`}
            onPress={() => setAdminTab('logs')}
          >
            <Text
              className={`text-xs font-bold ${
                adminTab === 'logs' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Audit Logs ({logs?.length || 0})
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: PER PRODUCT MAINTENANCE */}
        {adminTab === 'maintenance' && (
          <View className="gap-3">
            <Text className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>Product Services & Status</Text>

            {loadingProducts ? (
              <AdminTabSkeleton />
            ) : (
              products?.map((item) => {
                const isUnderMaintenance = Boolean(item.maintenance_enabled) || isGlobalActive;
                return (
                  <View
                    key={item.id}
                    className={`p-4 rounded-2xl border ${
                      isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>{item.product_name}</Text>
                        <Text className="text-xs text-slate-400">ID: {item.product_key}</Text>
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded-md ${
                          isUnderMaintenance ? 'bg-red-500/15' : 'bg-emerald-500/15'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isUnderMaintenance ? 'text-red-500' : 'text-emerald-500'
                          }`}
                        >
                          {isUnderMaintenance ? 'MAINTENANCE' : 'OPERATIONAL'}
                        </Text>
                      </View>
                    </View>

                    <View className={`h-[1px] mb-3 ${isDark ? "bg-[#262930]" : "bg-gray-100"}`} />

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-slate-400">Maintenance</Text>
                        <Switch
                          value={Boolean(item.maintenance_enabled)}
                          onValueChange={(val) => handleQuickToggleProduct(item, val)}
                          trackColor={{ false: '#334155', true: '#ef4444' }}
                          thumbColor="#fff"
                        />
                      </View>
                      <Pressable
                        className="bg-[#0284C7]/15 px-3 py-1.5 rounded-lg border border-[#0284C7]/30"
                        onPress={() => handleOpenConfig(item)}
                      >
                        <Text className="text-xs font-bold text-[#0284C7]">Configure Notice</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* SECTION 2: USERS MODERATION */}
        {adminTab === 'users' && (
          <View className="gap-3">
            <Text className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>User Accounts & Access Moderation</Text>

            <TextInput
              className={`px-3.5 py-2.5 rounded-xl border text-sm ${
                isDark ? "bg-[#181A1F] border-[#262930] text-white" : "bg-white border-gray-200 text-black"
              }`}
              placeholder="Search user by name, email, or phone..."
              placeholderTextColor="#94A3B8"
              value={userSearch}
              onChangeText={setUserSearch}
            />

            <View className="flex-row gap-2 mb-2">
              {(['all', 'active', 'suspended', 'banned'] as const).map((st) => (
                <Pressable
                  key={st}
                  className={`px-3 py-1 rounded-full border ${
                    userStatusFilter === st
                      ? 'bg-[#0284C7] border-[#0284C7]'
                      : isDark
                      ? 'bg-[#181A1F] border-[#262930]'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => setUserStatusFilter(st)}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      userStatusFilter === st ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {st.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {loadingUsers ? (
              <AdminTabSkeleton />
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const status = u.account_status || 'active';
                const statusColor =
                  status === 'active' ? '#10B981' : status === 'suspended' ? '#F59E0B' : '#EF4444';

                return (
                  <View
                    key={u.id}
                    className={`p-4 rounded-2xl border ${
                      isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
                    }`}
                  >
                    <View className="flex-row items-center mb-2.5">
                      <View className="w-9 h-9 rounded-full bg-[#0284C7]/20 justify-center items-center mr-2.5">
                        <Text className="text-sm font-bold text-[#0284C7]">
                          {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <Text className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>{u.full_name || 'Unnamed User'}</Text>
                          {u.is_admin && <Text className="text-[9px] font-extrabold text-amber-500 bg-amber-500/15 px-1 rounded">ADMIN</Text>}
                        </View>
                        <Text className="text-xs text-slate-400">{u.email || u.mobile_number || u.id.slice(0, 12)}</Text>
                      </View>
                      <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: `${statusColor}22` }}>
                        <Text className="text-[10px] font-bold" style={{ color: statusColor }}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs text-slate-400">Active Plan:</Text>
                      <Text className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>{u.subscription || 'Free Tier'}</Text>
                    </View>

                    <View className={`h-[1px] mb-2.5 ${isDark ? "bg-[#262930]" : "bg-gray-100"}`} />

                    {/* Moderation Actions */}
                    <View className="flex-row flex-wrap gap-2">
                      {status !== 'active' && (
                        <Pressable
                          className="bg-emerald-500/15 px-2.5 py-1 rounded-md"
                          onPress={() => handleUpdateStatus(u.id, 'active')}
                          disabled={isUpdatingUser === u.id}
                        >
                          <Text className="text-xs font-bold text-emerald-500">Activate</Text>
                        </Pressable>
                      )}

                      {status !== 'suspended' && (
                        <Pressable
                          className="bg-amber-500/15 px-2.5 py-1 rounded-md"
                          onPress={() => handleUpdateStatus(u.id, 'suspended')}
                          disabled={isUpdatingUser === u.id}
                        >
                          <Text className="text-xs font-bold text-amber-500">Suspend</Text>
                        </Pressable>
                      )}

                      {status !== 'banned' && (
                        <Pressable
                          className="bg-red-500/15 px-2.5 py-1 rounded-md"
                          onPress={() => handleUpdateStatus(u.id, 'banned')}
                          disabled={isUpdatingUser === u.id}
                        >
                          <Text className="text-xs font-bold text-red-500">Ban</Text>
                        </Pressable>
                      )}

                      <Pressable
                        className="bg-[#0284C7] px-2.5 py-1 rounded-md"
                        onPress={() => {
                          setSelectedUserForPlan(u);
                          setIsPlanModalOpen(true);
                        }}
                      >
                        <Text className="text-xs font-bold text-white">Assign Plan</Text>
                      </Pressable>

                      {u.subscription && u.subscription !== 'Free' && (
                        <Pressable
                          className="bg-slate-700/30 px-2.5 py-1 rounded-md"
                          onPress={() => handleRevokePlan(u.id)}
                        >
                          <Text className="text-xs font-bold text-slate-400">Revoke</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View className={`p-6 rounded-2xl border items-center ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
                <Text className="text-xs text-slate-400">No users matched your search criteria.</Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 3: AUDIT LOGS */}
        {adminTab === 'logs' && (
          <View className="gap-3">
            <Text className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>Maintenance Activity History</Text>

            {loadingLogs ? (
              <AdminTabSkeleton />
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <View
                  key={log.id}
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
                  }`}
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{log.action}</Text>
                    <Text className="text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {log.product_key && (
                    <Text className="text-xs text-sky-400">Target: {log.product_key.toUpperCase()}</Text>
                  )}
                  {log.reason && <Text className="text-xs text-slate-400 mt-0.5">Note: {log.reason}</Text>}
                </View>
              ))
            ) : (
              <View className={`p-6 rounded-2xl border items-center ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
                <Text className="text-xs text-slate-400">No maintenance logs recorded yet.</Text>
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
          <View className="flex-1 bg-black/70 justify-center p-5">
            <View className={`p-5 rounded-2xl border ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
              <Text className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>
                Configure: {selectedProduct?.product_name}
              </Text>
              <Text className="text-xs text-slate-400 mb-3">
                Customize message shown to users when accessing this service.
              </Text>

              <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>Notice Title</Text>
              <TextInput
                className={`px-3 py-2 rounded-xl border text-sm mb-3 ${
                  isDark ? "bg-[#121316] border-[#262930] text-white" : "bg-slate-50 border-gray-200 text-black"
                }`}
                value={maintenanceTitle}
                onChangeText={setMaintenanceTitle}
                placeholder="Notice headline"
                placeholderTextColor="#94A3B8"
              />

              <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>User Notice Message</Text>
              <TextInput
                className={`px-3 py-2 rounded-xl border text-sm mb-3 h-20 ${
                  isDark ? "bg-[#121316] border-[#262930] text-white" : "bg-slate-50 border-gray-200 text-black"
                }`}
                value={maintenanceMessage}
                onChangeText={setMaintenanceMessage}
                multiline
                placeholder="Explanation message for users"
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
              />

              <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>Internal Admin Reason</Text>
              <TextInput
                className={`px-3 py-2 rounded-xl border text-sm mb-3 ${
                  isDark ? "bg-[#121316] border-[#262930] text-white" : "bg-slate-50 border-gray-200 text-black"
                }`}
                value={internalNote}
                onChangeText={setInternalNote}
                placeholder="Reason for audit logs"
                placeholderTextColor="#94A3B8"
              />

              <View className="flex-row justify-between items-center my-3">
                <Text className={`text-xs font-semibold ${isDark ? "text-white" : "text-black"}`}>Block App Frontend Access</Text>
                <Switch
                  value={blockFrontend}
                  onValueChange={setBlockFrontend}
                  trackColor={{ false: '#334155', true: '#0284C7' }}
                  thumbColor="#fff"
                />
              </View>

              <View className="flex-row gap-3 mt-2">
                <Pressable
                  className="flex-1 py-2.5 rounded-xl items-center border border-gray-600/30"
                  onPress={() => setIsModalOpen(false)}
                >
                  <Text className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>Cancel</Text>
                </Pressable>
                <Pressable
                  className="flex-1 py-2.5 rounded-xl items-center bg-[#0284C7]"
                  style={updateProductMutation.isPending ? { opacity: 0.7 } : undefined}
                  onPress={handleSaveProductConfig}
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-xs font-bold text-white">Save Notice</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ASSIGN PLAN MODAL */}
        <Modal
          visible={isPlanModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPlanModalOpen(false)}
        >
          <View className="flex-1 bg-black/70 justify-center p-5">
            <View className={`p-5 rounded-2xl border ${isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"}`}>
              <Text className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>
                Assign Subscription Plan
              </Text>
              <Text className="text-xs text-slate-400 mb-3">
                Select tier duration for {selectedUserForPlan?.full_name || selectedUserForPlan?.email}.
              </Text>

              <View className="gap-2">
                {[
                  { id: 'free_trial', label: 'Free Trial (7 Days)' },
                  { id: 'pro_monthly', label: 'Premium (30 Days)' },
                  { id: 'pro_semi', label: 'Platinum (180 Days)' },
                  { id: 'yearly', label: 'Ultimate (365 Days)' },
                  { id: 'custom', label: 'Custom Days' },
                ].map((p) => (
                  <Pressable
                    key={p.id}
                    className={`py-2 px-3 rounded-xl border ${
                      selectedPlanType === p.id
                        ? 'bg-[#0284C7]/15 border-[#0284C7]'
                        : isDark
                        ? 'bg-[#121316] border-[#262930]'
                        : 'bg-slate-50 border-gray-200'
                    }`}
                    onPress={() => setSelectedPlanType(p.id)}
                  >
                    <Text
                      className={`text-xs ${
                        selectedPlanType === p.id
                          ? 'text-[#0284C7] font-bold'
                          : isDark
                          ? 'text-slate-300'
                          : 'text-slate-700'
                      }`}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {selectedPlanType === 'custom' && (
                <View className="mt-3">
                  <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>Custom Duration (Days)</Text>
                  <TextInput
                    className={`px-3 py-2 rounded-xl border text-sm ${
                      isDark ? "bg-[#121316] border-[#262930] text-white" : "bg-slate-50 border-gray-200 text-black"
                    }`}
                    value={customDays}
                    onChangeText={setCustomDays}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              <View className="flex-row gap-3 mt-4">
                <Pressable
                  className="flex-1 py-2.5 rounded-xl items-center border border-gray-600/30"
                  onPress={() => setIsPlanModalOpen(false)}
                >
                  <Text className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>Cancel</Text>
                </Pressable>
                <Pressable
                  className="flex-1 py-2.5 rounded-xl items-center bg-[#0284C7]"
                  onPress={handleAssignPlan}
                >
                  <Text className="text-xs font-bold text-white">Confirm Plan</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </AppScreen>
  );
}
