import React from 'react';
import { Text } from 'react-native';

export interface SlaInfo {
  isOverdue: boolean;
  isWarning: boolean;
  label: string;
}

/**
 * Returns formatted smart time: '2m', '1h', 'Yesterday', 'Oct 23'
 */
export function formatSmartTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    if (diffHours < 12) return `${diffHours}h`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: '2-digit' });
}

/**
 * Calculates customer SLA wait time for inbound unread messages
 */
export function calculateSlaStatus(
  dateStr?: string,
  unreadCount = 0,
  direction?: 'inbound' | 'outbound'
): SlaInfo {
  if (!dateStr || unreadCount === 0 || direction === 'outbound') {
    return { isOverdue: false, isWarning: false, label: '' };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { isOverdue: false, isWarning: false, label: '' };
  }

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));

  // SLA thresholds: Warning after 15m, Overdue after 60m
  if (diffMin >= 60) {
    return { isOverdue: true, isWarning: false, label: `${Math.floor(diffMin / 60)}h wait` };
  }
  if (diffMin >= 15) {
    return { isOverdue: false, isWarning: true, label: `${diffMin}m wait` };
  }

  return { isOverdue: false, isWarning: false, label: '' };
}

/**
 * Highlights text matches when searching
 */
export function renderHighlightedText(
  text: string,
  query: string,
  baseStyle: any,
  highlightStyle: any
) {
  if (!query || !query.trim()) {
    return React.createElement(Text, { style: baseStyle, numberOfLines: 1 }, text);
  }

  const trimmed = query.trim();
  const regex = new RegExp(`(${trimmed.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return React.createElement(
    Text,
    { style: baseStyle, numberOfLines: 1 },
    ...parts.map((part, i) => {
      const isMatch = part.toLowerCase() === trimmed.toLowerCase();
      return isMatch
        ? React.createElement(Text, { key: i, style: highlightStyle }, part)
        : part;
    })
  );
}


