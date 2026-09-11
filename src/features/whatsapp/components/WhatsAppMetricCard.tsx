import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface WhatsAppMetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  trend?: string;
}

export const WhatsAppMetricCard: React.FC<WhatsAppMetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>{label}</Text>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
      <Text style={[styles.value, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{value}</Text>
      {subtext ? <Text style={[styles.subtext, { color: isDark ? '#64748b' : '#94a3b8' }]}>{subtext}</Text> : null}
      {trend ? <Text style={styles.trend}>{trend}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    marginBottom: 10,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  icon: {
    fontSize: 16,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 11,
  },
  trend: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
