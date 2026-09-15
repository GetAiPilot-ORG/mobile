import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/components/AppScreen';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
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
      <AppScreen safeArea={false} backgroundColor={colors.background}>
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedTitle}>Admin Access Required</Text>
          <Text style={styles.deniedSubtitle}>
            The Monetize and Revenue engine is restricted to authenticated system administrators.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Return to Safety</Text>
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
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Admin Hub</Text>
          </Pressable>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMINISTRATION • MONETIZE</Text>
          </View>
          <Text style={styles.title}>Monetize & Earnings</Text>
          <Text style={styles.subtitle}>
            Manage digital products, store bio links, and real-time revenue analytics.
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'earnings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={[styles.tabText, activeTab === 'earnings' && styles.tabTextActive]}>
              Earnings
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'links' && styles.tabButtonActive]}
            onPress={() => setActiveTab('links')}
          >
            <Text style={[styles.tabText, activeTab === 'links' && styles.tabTextActive]}>
              Products ({products.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'design' && styles.tabButtonActive]}
            onPress={() => setActiveTab('design')}
          >
            <Text style={[styles.tabText, activeTab === 'design' && styles.tabTextActive]}>
              Store Design
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: EARNINGS & REVENUE */}
        {activeTab === 'earnings' && (
          <View>
            {/* Gateway Card */}
            <View style={styles.gatewayCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={styles.gatewayTitleRow}>
                  <Text style={styles.gatewayTitle}>Payment Gateway Status</Text>
                  <StatusBadge status={paymentsConnected ? 'active' : 'inactive'} />
                </View>
                <Text style={styles.gatewaySubtitle}>
                  {paymentsConnected
                    ? 'Stripe & Razorpay gateways connected and processing live client checkouts.'
                    : 'Payment settlement is paused. Checkouts will show offline notice.'}
                </Text>
              </View>
              <Switch
                value={paymentsConnected}
                onValueChange={setPaymentsConnected}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Gross Revenue</Text>
                <Text style={styles.metricValue}>${totalGross.toLocaleString()}</Text>
                <Text style={styles.metricSub}>+18.4% this month</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Orders</Text>
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {totalSales}
                </Text>
                <Text style={styles.metricSub}>Across {products.length} live products</Text>
              </View>
              <View style={[styles.metricCard, { width: '100%' }]}>
                <Text style={styles.metricLabel}>Net Payout Balance</Text>
                <Text style={[styles.metricValue, { color: '#16b882' }]}>
                  ${netEarnings.toLocaleString()}
                </Text>
                <Text style={styles.metricSub}>Next automatic settlement on 15th</Text>
              </View>
            </View>

            {/* Top Products Performance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Revenue Generators</Text>
              {products.map((p) => (
                <View key={p.id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productMeta}>
                      {p.category} • ${p.price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.productSales}>${(p.price * p.salesCount).toLocaleString()}</Text>
                    <Text style={styles.productOrders}>{p.salesCount} orders</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: PRODUCTS / LINKS */}
        {activeTab === 'links' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Store Catalog</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => setIsAddingProduct(!isAddingProduct)}
              >
                <Text style={styles.addButtonText}>
                  {isAddingProduct ? 'Close Form' : '+ Add Product'}
                </Text>
              </Pressable>
            </View>

            {isAddingProduct && (
              <View style={styles.addFormCard}>
                <Text style={styles.formTitle}>New Store Item</Text>
                <Text style={styles.inputLabel}>Product Title</Text>
                <TextInput
                  style={styles.input}
                  value={newProdName}
                  onChangeText={setNewProdName}
                  placeholder="e.g. AI Workflow Template"
                  placeholderTextColor={colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Price (USD)</Text>
                <TextInput
                  style={styles.input}
                  value={newProdPrice}
                  onChangeText={setNewProdPrice}
                  placeholder="49.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.mutedForeground}
                />

                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={newProdCategory}
                  onChangeText={setNewProdCategory}
                  placeholder="e.g. Digital Download, Service, Consulting"
                  placeholderTextColor={colors.mutedForeground}
                />

                <Pressable style={styles.submitBtn} onPress={handleAddProduct}>
                  <Text style={styles.submitBtnText}>Publish to Store</Text>
                </Pressable>
              </View>
            )}

            {products.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.productCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productCardTitle}>{item.name}</Text>
                    <Text style={styles.productCardPrice}>
                      ${item.price.toFixed(2)} • {item.category}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleToggleProduct(item.id)}
                  >
                    <Text style={styles.actionBtnText}>
                      {item.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                    onPress={() => handleDeleteProduct(item.id, item.name)}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.destructive }]}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: STORE DESIGN */}
        {activeTab === 'design' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Public Store Bio & Branding</Text>
            <Text style={styles.cardDesc}>
              Configure the storefront banner, bio headline, and brand elements for public buyers.
            </Text>

            <Text style={styles.inputLabel}>Storefront Headline</Text>
            <TextInput
              style={styles.input}
              value={storeTitle}
              onChangeText={setStoreTitle}
              placeholder="Store title"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={styles.inputLabel}>Short Bio / Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={storeBio}
              onChangeText={setStoreBio}
              multiline
              placeholder="Store description"
              placeholderTextColor={colors.mutedForeground}
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.rowTitle}>Display GetAIPilot Verified Badge</Text>
                <Text style={styles.rowSubtitle}>Show official brand authentication seal on checkout</Text>
              </View>
              <Switch
                value={showBranding}
                onValueChange={setShowBranding}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <Pressable
              style={styles.saveBtn}
              onPress={() => Alert.alert('Saved', 'Storefront styling and branding preferences updated.')}
            >
              <Text style={styles.saveBtnText}>Save Storefront</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22, 184, 130, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 130, 0.35)',
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
  gatewayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gatewayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gatewayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  gatewaySubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  metricSub: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addButtonText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 12,
  },
  addFormCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.foreground,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  submitBtnText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  productCardPrice: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  productMeta: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  productSales: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16b882',
  },
  productOrders: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 14,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 14,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 14,
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
    color: colors.destructive,
    marginBottom: 8,
  },
  deniedSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});
