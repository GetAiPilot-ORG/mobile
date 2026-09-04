import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

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
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="UPI Payment Link Generator" subtitle="Instant Collection Links" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Payment Link</Text>
          <Text style={styles.cardSubtitle}>
            Generate instant UPI deep links compatible with Google Pay, PhonePe, Paytm, and BHIM.
          </Text>

          <Text style={styles.inputLabel}>Recipient UPI ID / VPA</Text>
          <TextInput
            style={styles.input}
            placeholder="merchant@okhdfcbank"
            placeholderTextColor={colors.mutedForeground}
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Payee / Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Acme Services"
            placeholderTextColor={colors.mutedForeground}
            value={payeeName}
            onChangeText={setPayeeName}
          />

          <Text style={styles.inputLabel}>Amount (INR)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1500"
            placeholderTextColor={colors.mutedForeground}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Payment Note / Reference (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Invoice #1042"
            placeholderTextColor={colors.mutedForeground}
            value={note}
            onChangeText={setNote}
          />

          <Pressable style={styles.generateBtn} onPress={handleGenerate}>
            <Text style={styles.generateBtnText}>Generate Payment Link 💳</Text>
          </Pressable>
        </View>

        {generatedUri ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Payment Request Ready</Text>
            <Text style={styles.resultAmount}>₹{amount}</Text>
            <Text style={styles.resultSub}>Payable to: {payeeName} ({upiId})</Text>

            <View style={styles.btnRow}>
              <Pressable style={styles.actionBtnShare} onPress={handleShare}>
                <Text style={styles.btnText}>Share Details 📤</Text>
              </Pressable>
              <Pressable style={styles.actionBtnPay} onPress={handleOpenUPI}>
                <Text style={styles.btnText}>Launch UPI App ⚡</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 12,
  },
  generateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16B882',
  },
  resultTitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: '700',
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 4,
  },
  resultSub: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtnShare: {
    flex: 1,
    backgroundColor: colors.muted,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPay: {
    flex: 1,
    backgroundColor: '#16B882',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
