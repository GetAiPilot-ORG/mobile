import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lead } from '../types';
import { LeadValueBadge } from './LeadValueBadge';

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
  onAdvanceStage?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  lead: '#94a3b8',
  qualified: '#818cf8',
  proposal: '#f59e0b',
  negotiation: '#ec4899',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPress, onAdvanceStage }) => {
  const stageColor = STAGE_COLORS[lead.stage_id] || '#94a3b8';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {lead.name}
          </Text>
          {lead.company ? (
            <Text style={styles.company} numberOfLines={1}>
              {lead.company}
            </Text>
          ) : null}
        </View>
        <LeadValueBadge value={lead.value} currency={lead.currency} />
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.stageBadge, { backgroundColor: `${stageColor}20` }]}>
          <Text style={[styles.stageText, { color: stageColor }]}>{lead.stage_name}</Text>
        </View>

        <View style={styles.ownerBox}>
          <Text style={styles.ownerText}>👤 {lead.owner?.name || 'Unassigned'}</Text>
        </View>
      </View>

      {lead.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          "{lead.notes}"
        </Text>
      ) : null}

      {onAdvanceStage && lead.stage_id !== 'closed_won' && lead.stage_id !== 'closed_lost' && (
        <Pressable style={styles.advanceButton} onPress={onAdvanceStage}>
          <Text style={styles.advanceButtonText}>Advance Stage →</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardPressed: {
    opacity: 0.8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  company: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ownerBox: {
    alignItems: 'flex-end',
  },
  ownerText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  notes: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  advanceButton: {
    marginTop: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  advanceButtonText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
});
