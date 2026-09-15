import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';

export default function PaymentLinkGeneratorScreen() {
  const [upiId, setUpiId] = useState('getaipilot@upi');
  const [payeeName, setPayeeName] = useState('GetAIPilot Hub');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [generatedUri, setGeneratedUri] = useState('');

  const handleGenerate = () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid UPI VPA (e.g. yourname@upi).');
      return;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    const encodedName = encodeURIComponent(payeeName.trim());
    const encodedNote = encodeURIComponent(note.trim() || 'Service Payment');
    const uri = `upi://pay?pa=${upiId.trim()}&pn=${encodedName}&am=${amount.trim()}&cu=INR&tn=${encodedNote}`;
    setGeneratedUri(uri);
  };

  const handleOpenUPI = () => {
    if (generatedUri) {
      Linking.openURL(generatedUri).catch(() => {
        Alert.alert('Notice', 'No UPI payment application (GPay, PhonePe, Paytm) found on device.');
      });
    }
  };

  const handleShare = async () => {
    if (!generatedUri) return;
    try {
      await Share.share({
        message: `Payment Request of ₹${amount} for ${payeeName}. Pay via UPI: ${upiId}`,
        title: 'UPI Payment Request',
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="UPI Payment Link Generator" subtitle="Instant Collection Links" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-base font-black text-white mb-1">Create Payment Link</Text>
          <Text className="text-xs text-slate-400 leading-4 mb-4">
            Generate instant UPI deep links compatible with Google Pay, PhonePe, Paytm, and BHIM.
          </Text>

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Recipient UPI ID / VPA</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-3"
            placeholder="merchant@okhdfcbank"
            placeholderTextColor="#64748B"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Payee / Business Name</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-3"
            placeholder="e.g. Acme Services"
            placeholderTextColor="#64748B"
            value={payeeName}
            onChangeText={setPayeeName}
          />

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Amount (INR)</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-3"
            placeholder="e.g. 1500"
            placeholderTextColor="#64748B"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <Text className="text-xs font-bold text-slate-300 mb-1.5">Payment Note / Reference (Optional)</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2.5 text-xs text-white mb-4"
            placeholder="e.g. Invoice #1042"
            placeholderTextColor="#64748B"
            value={note}
            onChangeText={setNote}
          />

          <Pressable className="py-3.5 rounded-xl items-center bg-[#0084FF]" onPress={handleGenerate}>
            <Text className="text-xs font-extrabold text-white">Generate Payment Link 💳</Text>
          </Pressable>
        </View>

        {generatedUri ? (
          <View className="rounded-2xl p-5 items-center border border-emerald-500/40 bg-[#181A1F]">
            <Text className="text-xs font-bold text-slate-400">Payment Request Ready</Text>
            <Text className="text-3xl font-black text-[#0084FF] my-1">₹{amount}</Text>
            <Text className="text-xs text-slate-400 mb-4">Payable to: {payeeName} ({upiId})</Text>

            <View className="flex-row gap-2.5 w-full">
              <Pressable className="flex-1 py-3 rounded-xl items-center border border-[#262930] bg-[#111317]" onPress={handleShare}>
                <Text className="text-xs font-bold text-white">Share Details 📤</Text>
              </Pressable>
              <Pressable className="flex-1 py-3 rounded-xl items-center bg-emerald-500" onPress={handleOpenUPI}>
                <Text className="text-xs font-extrabold text-black">Launch UPI App ⚡</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
