import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WhatsAppTemplate } from '../types';

interface TemplateCardProps {
  template: WhatsAppTemplate;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const isApproved = template.status === 'APPROVED';
  const isPending = template.status === 'PENDING';
  const statusColor = isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';

  const bodyComponent = template.components?.find((c) => c.type === 'BODY');
  const previewText = bodyComponent?.text || 'Template message content preview';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={styles.subtext}>
            {template.category} • {template.language}
          </Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{template.status}</Text>
        </View>
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewText} numberOfLines={3}>
          {previewText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  previewContainer: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  previewText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
});
