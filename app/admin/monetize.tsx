import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/components/AppScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { StatusBadge } from '../../src/components/StatusBadge';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  status: 'active' | 'draft';
  category: string;
  salesCount: number;
}

export default function AdminMonetizeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = usePlatformSubscription();

  const [activeTab, setActiveTab] = useState<'links' | 'design' | 'earnings'>('earnings');
  const [paymentsConnected, setPaymentsConnected] = useState(true);
  const [currency, setCurrency] = useState('USD');

  // Sample Monetize Products
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'prod-1',
      name: 'GAP Premium Prompt Vault',
      price: 49.0,
      currency: 'USD',
      status: 'active',
      category: 'Digital Download',
      salesCount: 142,
    },
    {
      id: 'prod-2',
      name: '1-on-1 AI Automation Audit (60m)',
      price: 199.0,
      currency: 'USD',
      status: 'active',
      category: 'Consulting',
      salesCount: 28,
    },
    {
      id: 'prod-3',
      name: 'Custom WhatsApp Bot Setup Package',
      price: 349.0,
      currency: 'USD',
      status: 'active',
      category: 'Service',
      salesCount: 19,
    },
  ]);

  // Form State for new product
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Digital');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Design state
  const [storeTitle, setStoreTitle] = useState('GetAIPilot Official Store');
  const [storeBio, setStoreBio] = useState('Exclusive workflows, custom bots, and premium enterprise tooling.');
  const [showBranding, setShowBranding] = useState(true);

  if (!isAdmin) {
    return (
      <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-xl font-bold text-red-500 mb-2">Admin Access Required</Text>
          <Text className="text-xs text-slate-400 text-center mb-5">
            The Monetize and Revenue engine is restricted to authenticated system administrators.
          </Text>
          <Pressable
            className="px-4 py-2 rounded-lg border border-[#262930] bg-[#181A1F]"
            onPress={() => router.back()}
          >
            <Text className="text-xs font-bold text-white">Return to Safety</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const handleAddProduct = () => {
    if (!newProdName.trim() || !newProdPrice.trim()) {
      Alert.alert('Required', 'Please enter a product title and price.');
      return;
    }
    const priceNum = parseFloat(newProdPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid numeric amount.');
      return;
    }

    const newItem: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      price: priceNum,
      currency,
      status: 'active',
      category: newProdCategory,
      salesCount: 0,
    };

    setProducts([newItem, ...products]);
    setNewProdName('');
    setNewProdPrice('');
    setIsAddingProduct(false);
    Alert.alert('Success', `Created product "${newItem.name}".`);
  };

  const handleToggleProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'draft' : 'active' } : p
      )
    );
  };

  const handleDeleteProduct = (id: string, name: string) => {
    Alert.alert('Delete Product', `Remove "${name}" from store?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setProducts((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  const totalGross = products.reduce((acc, p) => acc + p.price * p.salesCount, 0);
  const totalSales = products.reduce((acc, p) => acc + p.salesCount, 0);
  const netEarnings = totalGross * 0.95; // 5% gateway reserve

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-5">
          <Pressable
            className="self-start py-1.5 px-3 rounded-lg border border-[#262930] bg-[#181A1F] mb-3"
            onPress={() => router.back()}
          >
            <Text className="text-xs font-bold text-white">← Admin Hub</Text>
          </Pressable>
          <View className="self-start bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 mb-1.5">
            <Text className="text-[10px] font-black text-emerald-400 tracking-wider">ADMINISTRATION • MONETIZE</Text>
          </View>
          <Text className="text-2xl font-black text-white">Monetize & Earnings</Text>
          <Text className="text-xs text-slate-400 mt-1 leading-4">
            Manage digital products, store bio links, and real-time revenue analytics.
          </Text>
        </View>

        {/* Tab Selector */}
        <View className="flex-row rounded-xl p-1 mb-5 border border-[#262930] bg-[#111317]">
          <Pressable
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'earnings' ? 'bg-[#0084FF]' : ''}`}
            onPress={() => setActiveTab('earnings')}
          >
            <Text className={`text-xs font-bold ${activeTab === 'earnings' ? 'text-white' : 'text-slate-400'}`}>
              Earnings
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'links' ? 'bg-[#0084FF]' : ''}`}
            onPress={() => setActiveTab('links')}
          >
            <Text className={`text-xs font-bold ${activeTab === 'links' ? 'text-white' : 'text-slate-400'}`}>
              Products ({products.length})
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'design' ? 'bg-[#0084FF]' : ''}`}
            onPress={() => setActiveTab('design')}
          >
            <Text className={`text-xs font-bold ${activeTab === 'design' ? 'text-white' : 'text-slate-400'}`}>
              Store Design
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: EARNINGS & REVENUE */}
        {activeTab === 'earnings' && (
          <View>
            {/* Gateway Card */}
            <View className="flex-row items-center rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-xs font-bold text-white">Payment Gateway Status</Text>
                  <StatusBadge status={paymentsConnected ? 'active' : 'inactive'} />
                </View>
                <Text className="text-[11px] text-slate-400 leading-4">
                  {paymentsConnected
                    ? 'Stripe & Razorpay gateways connected and processing live client checkouts.'
                    : 'Payment settlement is paused. Checkouts will show offline notice.'}
                </Text>
              </View>
              <Switch
                value={paymentsConnected}
                onValueChange={setPaymentsConnected}
                trackColor={{ false: '#262930', true: '#0084FF' }}
                thumbColor="#fff"
              />
            </View>

            {/* Metrics */}
            <View className="flex-row flex-wrap gap-3 mb-5">
              <View className="w-[48%] rounded-2xl p-3.5 border border-[#262930] bg-[#181A1F]">
                <Text className="text-[11px] text-slate-400">Gross Revenue</Text>
                <Text className="text-xl font-black text-[#0084FF] mt-1">${totalGross.toLocaleString()}</Text>
                <Text className="text-[10px] text-slate-400 mt-1">+18.4% this month</Text>
              </View>
              <View className="w-[48%] rounded-2xl p-3.5 border border-[#262930] bg-[#181A1F]">
                <Text className="text-[11px] text-slate-400">Total Orders</Text>
                <Text className="text-xl font-black text-white mt-1">{totalSales}</Text>
                <Text className="text-[10px] text-slate-400 mt-1">Across {products.length} live products</Text>
              </View>
              <View className="w-full rounded-2xl p-3.5 border border-[#262930] bg-[#181A1F]">
                <Text className="text-[11px] text-slate-400">Net Payout Balance</Text>
                <Text className="text-xl font-black text-emerald-400 mt-1">${netEarnings.toLocaleString()}</Text>
                <Text className="text-[10px] text-slate-400 mt-1">Next automatic settlement on 15th</Text>
              </View>
            </View>

            {/* Top Products Performance */}
            <View className="mb-5">
              <Text className="text-sm font-black text-white mb-2.5">Top Revenue Generators</Text>
              {products.map((p) => (
                <View key={p.id} className="flex-row items-center justify-between rounded-xl p-3.5 mb-2 border border-[#262930] bg-[#181A1F]">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">{p.name}</Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">
                      {p.category} • ${p.price.toFixed(2)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-bold text-emerald-400">${(p.price * p.salesCount).toLocaleString()}</Text>
                    <Text className="text-[10px] text-slate-400 mt-0.5">{p.salesCount} orders</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: PRODUCTS / LINKS */}
        {activeTab === 'links' && (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-black text-white">Store Catalog</Text>
              <Pressable
                className="px-3 py-1.5 rounded-lg bg-[#0084FF]"
                onPress={() => setIsAddingProduct(!isAddingProduct)}
              >
                <Text className="text-xs font-bold text-white">
                  {isAddingProduct ? 'Close Form' : '+ Add Product'}
                </Text>
              </Pressable>
            </View>

            {isAddingProduct && (
              <View className="rounded-2xl p-4 mb-4 border border-[#0084FF] bg-[#181A1F]">
                <Text className="text-sm font-black text-white mb-2">New Store Item</Text>
                <Text className="text-xs font-bold text-slate-300 mb-1">Product Title</Text>
                <TextInput
                  className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-2"
                  value={newProdName}
                  onChangeText={setNewProdName}
                  placeholder="e.g. AI Workflow Template"
                  placeholderTextColor="#64748B"
                />

                <Text className="text-xs font-bold text-slate-300 mb-1">Price (USD)</Text>
                <TextInput
                  className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-2"
                  value={newProdPrice}
                  onChangeText={setNewProdPrice}
                  placeholder="49.00"
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />

                <Text className="text-xs font-bold text-slate-300 mb-1">Category</Text>
                <TextInput
                  className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
                  value={newProdCategory}
                  onChangeText={setNewProdCategory}
                  placeholder="e.g. Digital Download, Service, Consulting"
                  placeholderTextColor="#64748B"
                />

                <Pressable className="py-3 rounded-xl items-center bg-[#0084FF]" onPress={handleAddProduct}>
                  <Text className="text-xs font-bold text-white">Publish to Store</Text>
                </Pressable>
              </View>
            )}

            {products.map((item) => (
              <View key={item.id} className="rounded-2xl p-4 mb-3 border border-[#262930] bg-[#181A1F]">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-black text-white">{item.name}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      ${item.price.toFixed(2)} • {item.category}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View className="flex-row gap-2.5 border-t border-[#262930] pt-2.5">
                  <Pressable
                    className="px-3 py-1.5 rounded-lg border border-[#262930] bg-[#111317]"
                    onPress={() => handleToggleProduct(item.id)}
                  >
                    <Text className="text-xs font-bold text-white">
                      {item.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Text>
                  </Pressable>
                  <Pressable
                    className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10"
                    onPress={() => handleDeleteProduct(item.id, item.name)}
                  >
                    <Text className="text-xs font-bold text-red-400">Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: STORE DESIGN */}
        {activeTab === 'design' && (
          <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F]">
            <Text className="text-sm font-black text-white mb-1">Public Store Bio & Branding</Text>
            <Text className="text-xs text-slate-400 mb-3.5 leading-4">
              Configure the storefront banner, bio headline, and brand elements for public buyers.
            </Text>

            <Text className="text-xs font-bold text-slate-300 mb-1">Storefront Headline</Text>
            <TextInput
              className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
              value={storeTitle}
              onChangeText={setStoreTitle}
              placeholder="Store title"
              placeholderTextColor="#64748B"
            />

            <Text className="text-xs font-bold text-slate-300 mb-1">Short Bio / Description</Text>
            <TextInput
              className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3 h-20"
              value={storeBio}
              onChangeText={setStoreBio}
              multiline
              textAlignVertical="top"
              placeholder="Store description"
              placeholderTextColor="#64748B"
            />

            <View className="flex-row items-center justify-between py-3 border-t border-[#262930] mt-2">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-bold text-white">Display GetAIPilot Verified Badge</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5">Show official brand authentication seal on checkout</Text>
              </View>
              <Switch
                value={showBranding}
                onValueChange={setShowBranding}
                trackColor={{ false: '#262930', true: '#0084FF' }}
                thumbColor="#fff"
              />
            </View>

            <Pressable
              className="py-3 rounded-xl items-center bg-[#0084FF] mt-3.5"
              onPress={() => Alert.alert('Saved', 'Storefront styling and branding preferences updated.')}
            >
              <Text className="text-xs font-extrabold text-white">Save Storefront</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
