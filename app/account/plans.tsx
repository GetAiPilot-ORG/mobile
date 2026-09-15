import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

const TIERS = [
  {
    id: 'starter',
    name: 'GAP Core',
    subtitle: 'Essential AI Automations for Creators & SMBs',
    monthlyPrice: 2499,
    annualPrice: 1999,
    badge: 'Popular',
    badgeColor: '#10B981',
    features: [
      { text: '1 Active Telegram Auto-Forwarder', highlight: true },
      { text: 'WhatsApp Meta Cloud API Gateway (5k msgs/mo)', highlight: false },
      { text: '500 Free AI Telecalling Voice Minutes', highlight: false },
      { text: 'Smart CRM (Up to 250 Active Leads)', highlight: false },
      { text: '10 Growth Automation Tools Included', highlight: true },
      { text: 'Standard 24h Ticket Support', highlight: false },
    ],
    quotas: [
      { label: 'Voice Minutes', value: '500 min/mo' },
      { label: 'WhatsApp Msgs', value: '5,000 /mo' },
      { label: 'CRM Leads', value: '250 Max' },
    ],
  },
  {
    id: 'pro',
    name: 'GAP Pro Max',
    subtitle: 'Full Enterprise Scale with Multi-Engine Sync',
    monthlyPrice: 5999,
    annualPrice: 4799,
    badge: 'Enterprise Choice',
    badgeColor: '#00D2B4',
    features: [
      { text: 'Unlimited Telegram Channel Forwarders & Bots', highlight: true },
      { text: 'WhatsApp Mass Broadcasts & Webhook Triggers', highlight: true },
      { text: '2,500 Autonomous AI Telecaller Voice Minutes', highlight: true },
      { text: 'Omnichannel Social Pilot Sync (6 Networks)', highlight: true },
      { text: 'Smart CRM Unlimited Leads & Pipelines', highlight: false },
      { text: 'Custom Bio & High-Conversion Landing Pages', highlight: false },
      { text: 'Dedicated 1-on-1 WhatsApp Priority Support', highlight: true },
    ],
    quotas: [
      { label: 'Voice Minutes', value: '2,500 min/mo' },
      { label: 'WhatsApp Msgs', value: 'Unlimited' },
      { label: 'Forwarding Bots', value: 'Unlimited' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Enterprise',
    subtitle: 'Dedicated Cloud Infrastructure & Custom AI LLM Finetuning',
    monthlyPrice: null,
    annualPrice: null,
    badge: 'Dedicated SLA',
    badgeColor: '#8B5CF6',
    features: [
      { text: 'Dedicated Supabase & Redis Infrastructure', highlight: true },
      { text: 'Custom Fine-Tuned Voice Models & Prompt Engineering', highlight: true },
      { text: 'Unlimited Multi-Tenant Agent Accounts', highlight: true },
      { text: 'Direct CPaaS Carrier Trunking (India/Global)', highlight: false },
      { text: 'Custom Security & SSO Auth Integration', highlight: false },
      { text: '99.99% Uptime SLA Guarantee', highlight: true },
    ],
    quotas: [
      { label: 'Voice Minutes', value: 'Custom Quota' },
      { label: 'Dedicated Account', value: 'Assigned Eng.' },
      { label: 'SLA Support', value: '< 15 min' },
    ],
  },
];

export default function PlansPricingScreen() {
  const { planLabel } = usePlatformSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedTier, setSelectedTier] = useState<string>('pro');

  const handleCycleChange = (cycle: 'monthly' | 'annual') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBillingCycle(cycle);
  };

  const handleSelectTier = (tierId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTier(tierId);
  };

  const handleUpgrade = (tierName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Plan Upgrade Request',
      `You selected ${tierName} (${billingCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'}). A GetAIPilot billing specialist will activate your enterprise quota within minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Activate',
          onPress: () => {
            Alert.alert('Request Received', 'Your upgrade request has been queued. Verification link sent to your email.');
          },
        },
      ]
    );
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Plans & Quotas" subtitle="Enterprise Subscriptions & Scaling" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Active Status Glass Banner */}
        <View className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#071612] p-5 mb-5">
          <View className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/10" />
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                ACTIVE SUBSCRIPTION
              </Text>
            </View>
            <Text className="text-xs text-slate-400">Renews 1st of next month</Text>
          </View>
          <Text className="text-2xl font-black text-white tracking-tight">
            {planLabel || 'GAP Pro Max (Active)'}
          </Text>
          <Text className="text-xs text-slate-300 mt-1 leading-4">
            All 5 automation engines & 10 growth utilities operating at unrestricted speed.
          </Text>
        </View>

        {/* Billing Cycle Toggle */}
        <View className="flex-row rounded-xl border border-[#262930] bg-[#111317] p-1 mb-5">
          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-1.5 ${
              billingCycle === 'annual' ? 'bg-[#1F242F]' : ''
            }`}
            onPress={() => handleCycleChange('annual')}
          >
            <Text className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
              Annual (Save 20%)
            </Text>
            <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded">
              <Text className="text-[9px] font-black text-emerald-400">SAVE 20%</Text>
            </View>
          </Pressable>
          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-1.5 ${
              billingCycle === 'monthly' ? 'bg-[#1F242F]' : ''
            }`}
            onPress={() => handleCycleChange('monthly')}
          >
            <Text className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </Text>
          </Pressable>
        </View>

        {/* Tier Cards */}
        <View className="gap-4">
          {TIERS.map((tier) => {
            const isCurrent = selectedTier === tier.id;
            const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;

            return (
              <Pressable
                key={tier.id}
                className={`rounded-2xl p-5 border ${
                  isCurrent ? 'bg-[#0F161A] border-emerald-500/60' : 'bg-[#181A1F] border-[#262930]'
                }`}
                onPress={() => handleSelectTier(tier.id)}
              >
                {/* Header */}
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-black text-white tracking-tight">{tier.name}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5 leading-4">{tier.subtitle}</Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded-md border"
                    style={{
                      backgroundColor: `${tier.badgeColor}22`,
                      borderColor: `${tier.badgeColor}55`,
                    }}
                  >
                    <Text className="text-[10px] font-extrabold uppercase" style={{ color: tier.badgeColor }}>
                      {tier.badge}
                    </Text>
                  </View>
                </View>

                {/* Price Display */}
                <View className="flex-row items-baseline my-3">
                  {price !== null ? (
                    <>
                      <Text className="text-lg font-bold text-emerald-400 mr-0.5">₹</Text>
                      <Text className="text-3xl font-black text-white tracking-tight">
                        {price.toLocaleString()}
                      </Text>
                      <Text className="text-xs text-slate-400 ml-1.5">/ month</Text>
                    </>
                  ) : (
                    <Text className="text-xl font-black text-purple-400">Custom SLA Quote</Text>
                  )}
                </View>

                {/* Quota Strip */}
                <View className="flex-row rounded-xl p-2.5 mb-4 justify-between bg-[#111317] border border-[#262930]">
                  {tier.quotas.map((q, idx) => (
                    <View key={idx} className="flex-1 items-center">
                      <Text className="text-xs font-extrabold text-white">{q.value}</Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">{q.label}</Text>
                    </View>
                  ))}
                </View>

                <View className="h-px bg-[#262930] mb-4" />

                {/* Features List */}
                <View className="gap-2.5 mb-5">
                  {tier.features.map((feat, fIdx) => (
                    <View key={fIdx} className="flex-row items-center gap-2.5">
                      <View
                        className={`w-5 h-5 rounded-full items-center justify-center ${
                          feat.highlight ? 'bg-emerald-500/20' : 'bg-[#262930]'
                        }`}
                      >
                        <Text className={`text-[11px] font-black ${feat.highlight ? 'text-emerald-400' : 'text-slate-400'}`}>
                          ✓
                        </Text>
                      </View>
                      <Text
                        className={`text-xs flex-1 leading-4 ${
                          feat.highlight ? 'text-slate-100 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {feat.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action CTA */}
                <Pressable
                  className={`py-3.5 rounded-xl items-center justify-center ${
                    isCurrent ? 'bg-emerald-500' : 'border border-[#383D48] bg-transparent'
                  }`}
                  onPress={() => handleUpgrade(tier.name)}
                >
                  <Text className={`text-sm font-extrabold ${isCurrent ? 'text-black' : 'text-white'}`}>
                    {tier.id === 'custom' ? 'Talk to Enterprise Team →' : `Upgrade to ${tier.name} →`}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Security & Guarantee Note */}
        <View className="flex-row items-center gap-3.5 rounded-2xl p-4 mt-6 border border-[#262930] bg-[#181A1F]">
          <Text className="text-2xl">🛡️</Text>
          <View className="flex-1">
            <Text className="text-xs font-bold text-white">Bank-Grade 256-Bit SSL Encryption</Text>
            <Text className="text-[11px] text-slate-400 mt-0.5 leading-4">
              Cancel or adjust quotas anytime. Enterprise invoices include GST compliance and instant billing receipt downloads.
            </Text>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
