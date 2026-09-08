import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      {trend ? <Text style={styles.trend}>{trend}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  icon: {
    fontSize: 16,
  },
  value: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtext: {
    color: '#64748b',
    fontSize: 11,
  },
  trend: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
