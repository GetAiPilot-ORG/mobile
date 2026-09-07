import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';

// ─── Direct Port of Web CardShell Component ─────────────────────────────────────
interface DashboardCardProps {
  num: string;
  title: string;
  description: string;
  statusBadge?: React.ReactNode;
  onAction: () => void;
  visualNode: React.ReactNode;
}

function DashboardCard({
  num,
  title,
  description,
  statusBadge,
  onAction,
  visualNode,
}: DashboardCardProps) {
  return (
    <Pressable style={styles.cardShell} onPress={onAction}>
      {/* Right-side visual illustration container */}
      <View style={styles.visualContainer}>{visualNode}</View>

      {/* Left-side content */}
      <View style={styles.contentContainer}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardNum}>{num}</Text>
          {statusBadge}
        </View>

        <View style={styles.cardTextGroup}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {description}
          </Text>
        </View>

        <Pressable style={styles.actionCircle} onPress={onAction}>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function StatusChip({ active }: { active?: boolean }) {
  if (active === false) {
    return (
      <View style={styles.statusChipUpgrade}>
        <Text style={styles.statusChipUpgradeText}>Upgrade</Text>
      </View>
    );
  }
  return null;
}

function GridSectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.gridSectionHeader}>
      <Text style={styles.gridSectionLabel}>{label}</Text>
      <View style={styles.gridSectionDivider} />
    </View>
  );
}

// ─── Direct Port of Web Card Visual Mockups ─────────────────────────────────────

/** Telegram Channel & Auto-Forward Feed Mockup */
function MockupTelegram() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#e0f2fe' }]}>
      <View style={styles.mockupHeader}>
        <View style={[styles.avatarDot, { backgroundColor: '#0284c7' }]}>
          <Text style={styles.dotText}>TG</Text>
        </View>
        <Text style={styles.mockupTitle}>Telegram Bot</Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Active</Text>
        </View>
      </View>
      <View style={styles.mockupInner}>
        <Text style={styles.mockupInnerTitle}>📢 Channel Forwarder</Text>
        <Text style={styles.mockupInnerSub}>Forwarded to 12 channels</Text>
      </View>
    </View>
  );
}

/** WhatsApp Broadcast & AI Assistant Mockup */
function MockupWhatsApp() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#dcfce7' }]}>
      <View style={styles.mockupHeader}>
        <View style={[styles.avatarDot, { backgroundColor: '#16a34a' }]}>
          <Text style={styles.dotText}>WA</Text>
        </View>
        <Text style={styles.mockupTitle}>WhatsApp Suite</Text>
        <View style={[styles.activePill, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.activePillText, { color: '#16a34a' }]}>Online</Text>
        </View>
      </View>
      <View style={[styles.mockupInner, { backgroundColor: '#f0fdf4' }]}>
        <Text style={[styles.mockupInnerTitle, { color: '#166534' }]}>⚡ Meta Cloud API</Text>
        <Text style={styles.mockupInnerSub}>Auto-reply trigger active</Text>
      </View>
    </View>
  );
}

/** Voice AI Agent Console Mockup */
function MockupVoice() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ede9fe', backgroundColor: '#1e1b4b' }]}>
      <View style={styles.mockupHeader}>
        <Text style={[styles.mockupTitle, { color: '#e9d5ff' }]}>AI Voice Agent</Text>
        <View style={[styles.activePill, { backgroundColor: 'rgba(22, 184, 130, 0.2)' }]}>
          <Text style={[styles.activePillText, { color: '#4ade80' }]}>Live Call</Text>
        </View>
      </View>
      <View style={styles.voiceWaveRow}>
        {[40, 80, 100, 65, 90, 50, 85, 30].map((h, i) => (
          <View key={i} style={[styles.voiceWaveBar, { height: (h / 100) * 16 }]} />
        ))}
      </View>
      <Text style={styles.voiceTimerText}>01:24 • Transcribing...</Text>
    </View>
  );
}

/** CRM Kanban Pipeline Mockup */
function MockupCRM() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#e0e7ff' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Sales Deals</Text>
        <Text style={[styles.mockupTitle, { color: '#4f46e5' }]}>$41.5k</Text>
      </View>
      <View style={styles.crmStagesRow}>
        <View style={[styles.crmStageCard, { backgroundColor: '#eef2ff' }]}>
          <Text style={[styles.crmStageTag, { color: '#4338ca' }]}>Lead</Text>
          <Text style={styles.crmStageVal}>$4.2k</Text>
        </View>
        <View style={[styles.crmStageCard, { backgroundColor: '#f5f3ff' }]}>
          <Text style={[styles.crmStageTag, { color: '#6d28d9' }]}>Won</Text>
          <Text style={styles.crmStageVal}>$24k</Text>
        </View>
      </View>
    </View>
  );
}

/** Social Media Scheduler Mockup */
function MockupSocial() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ffe4e6' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Auto Post</Text>
        <View style={styles.socialIconsRow}>
          <Text style={{ fontSize: 9, color: '#ec4899', fontWeight: 'bold' }}>IG</Text>
          <Text style={{ fontSize: 9, color: '#2563eb', fontWeight: 'bold' }}>IN</Text>
          <Text style={{ fontSize: 9, color: '#0f172a', fontWeight: 'bold' }}>X</Text>
        </View>
      </View>
      <View style={[styles.mockupInner, { backgroundColor: '#fff1f2' }]}>
        <Text style={[styles.mockupInnerTitle, { color: '#9f1239' }]}>Weekly Campaign</Text>
        <Text style={styles.mockupInnerSub}>Auto-publishing queue...</Text>
      </View>
    </View>
  );
}

/** Connected Platforms & Multi-Inbox Mockup */
function MockupConnectedChats() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#a7f3d0' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Connected Hub</Text>
        <View style={[styles.activePill, { backgroundColor: '#d1fae5' }]}>
          <Text style={[styles.activePillText, { color: '#065f46' }]}>5 Live</Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <View style={styles.connectedRow}>
          <View style={[styles.miniDot, { backgroundColor: '#0284c7' }]}>
            <Text style={styles.miniDotText}>TG</Text>
          </View>
          <View style={styles.miniLine} />
          <Text style={styles.miniStatus}>Active</Text>
        </View>
        <View style={styles.connectedRow}>
          <View style={[styles.miniDot, { backgroundColor: '#16a34a' }]}>
            <Text style={styles.miniDotText}>WA</Text>
          </View>
          <View style={styles.miniLine} />
          <Text style={styles.miniStatus}>Active</Text>
        </View>
      </View>
    </View>
  );
}

/** My Designs Palette Mockup */
function MockupMyDesigns() {
  const swatches = ['#818cf8', '#38bdf8', '#34d399', '#f472b6', '#fb923c', '#a78bfa'];
  return (
    <View style={[styles.mockupBox, { borderColor: '#ede9fe' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Visual Assets</Text>
        <View style={[styles.activePill, { backgroundColor: '#f3e8ff' }]}>
          <Text style={[styles.activePillText, { color: '#7e22ce' }]}>9 Files</Text>
        </View>
      </View>
      <View style={styles.swatchGrid}>
        {swatches.map((c, i) => (
          <View key={i} style={[styles.swatchItem, { backgroundColor: c }]} />
        ))}
      </View>
    </View>
  );
}

/** Mobile Phone Bio Page Mockup */
function MockupBio() {
  return (
    <View style={styles.bioPhone}>
      <View style={styles.bioNotch} />
      <View style={styles.bioAvatar} />
      <View style={styles.bioContent}>
        <View style={styles.bioBar} />
        <View style={styles.bioBar} />
        <View style={styles.bioBtn}>
          <Text style={styles.bioBtnText}>Link in Bio</Text>
        </View>
      </View>
    </View>
  );
}

/** Landing Builder Window Mockup */
function MockupLandingPages() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ddd6fe', padding: 0, overflow: 'hidden' }]}>
      <View style={styles.browserHeader}>
        <View style={[styles.windowDot, { backgroundColor: '#f87171' }]} />
        <View style={[styles.windowDot, { backgroundColor: '#fbbf24' }]} />
        <View style={[styles.windowDot, { backgroundColor: '#34d399' }]} />
      </View>
      <View style={{ padding: 8, gap: 4 }}>
        <View style={styles.landingHeroBar} />
        <View style={styles.landingSubBar} />
        <View style={styles.landingCta}>
          <Text style={styles.landingCtaText}>High Converting Page</Text>
        </View>
      </View>
    </View>
  );
}

/** Landing Templates Fan Mockup */
function MockupLandingTemplates() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#bae6fd' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Webinar Template</Text>
        <View style={[styles.activePill, { backgroundColor: '#e0f2fe' }]}>
          <Text style={[styles.activePillText, { color: '#0369a1' }]}>V1</Text>
        </View>
      </View>
      <View style={{ gap: 4, marginTop: 4 }}>
        <View style={{ height: 6, width: '80%', backgroundColor: '#0f172a', borderRadius: 2 }} />
        <View style={{ height: 12, width: '100%', backgroundColor: '#0284c7', borderRadius: 4 }} />
      </View>
    </View>
  );
}

/** QuickForms Builder Mockup */
function MockupQuickForms() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ccfbf1' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>QuickForm</Text>
        <View style={[styles.activePill, { backgroundColor: '#ccfbf1' }]}>
          <Text style={[styles.activePillText, { color: '#0f766e' }]}>No Code</Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <View style={styles.formInputMock}>
          <Text style={styles.formInputText}>Your Email</Text>
        </View>
        <View style={styles.formBtnMock}>
          <Text style={styles.formBtnText}>Submit Response</Text>
        </View>
      </View>
    </View>
  );
}

/** Link Shortener Analytics Mockup */
function MockupShortLinks() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#dbeafe' }]}>
      <View style={styles.mockupHeader}>
        <Text style={[styles.mockupTitle, { color: '#2563eb', fontSize: 9 }]}>gap.in/s/promo</Text>
        <Text style={{ fontSize: 8, color: '#16a34a', fontWeight: 'bold' }}>↑ 1,420</Text>
      </View>
      <View style={styles.barChartRow}>
        {[30, 45, 28, 60, 42, 72, 55, 90].map((v, i) => (
          <View key={i} style={[styles.chartBar, { height: (v / 90) * 20 }]} />
        ))}
      </View>
    </View>
  );
}

/** File Linker Storage Mockup */
function MockupFileLinker() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#fef3c7' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>File Storage</Text>
        <View style={[styles.activePill, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.activePillText, { color: '#b45309' }]}>50MB</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4 }}>
        {['.pdf', '.mp4', '.zip'].map((ext) => (
          <View key={ext} style={styles.fileExtBadge}>
            <Text style={styles.fileExtText}>{ext}</Text>
          </View>
        ))}
      </View>
      <View style={styles.fileBtnMock}>
        <Text style={styles.fileBtnText}>Download Link</Text>
      </View>
    </View>
  );
}

/** Event Links Calendar Mockup */
function MockupEventLinks() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ffe4e6' }]}>
      <View style={styles.mockupHeader}>
        <Text style={[styles.mockupTitle, { color: '#e11d48' }]}>Event Page</Text>
        <Text style={{ fontSize: 8, color: '#94a3b8' }}>July 2026</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={styles.eventSlotBadge}>
          <Text style={styles.eventSlotText}>10:00 AM</Text>
        </View>
        <View style={styles.eventBookBtn}>
          <Text style={styles.eventBookText}>Book Now</Text>
        </View>
      </View>
    </View>
  );
}

/** Speech Transcription Mockup */
function MockupSpeech() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#ede9fe' }]}>
      <View style={styles.mockupHeader}>
        <Text style={[styles.mockupTitle, { color: '#7c3aed' }]}>AI Speech-to-Text</Text>
        <View style={[styles.activePill, { backgroundColor: '#ede9fe' }]}>
          <Text style={[styles.activePillText, { color: '#6d28d9' }]}>EN→ES</Text>
        </View>
      </View>
      <View style={{ gap: 3, marginTop: 2 }}>
        <View style={{ height: 4, width: '100%', backgroundColor: '#c4b5fd', borderRadius: 2 }} />
        <View style={{ height: 4, width: '80%', backgroundColor: '#ddd6fe', borderRadius: 2 }} />
        <View style={{ height: 4, width: '65%', backgroundColor: '#ede9fe', borderRadius: 2 }} />
      </View>
    </View>
  );
}

/** Branded QR Code Mockup */
function MockupQRCode() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }]}>
      <View style={styles.qrGrid}>
        {[1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1].map(
          (bit, idx) => (
            <View
              key={idx}
              style={[
                styles.qrPixel,
                { backgroundColor: bit ? '#4f46e5' : '#f1f5f9' },
              ]}
            />
          ),
        )}
      </View>
    </View>
  );
}

/** Website Audit Scorecard Mockup */
function MockupWebsiteAudit() {
  return (
    <View style={[styles.mockupBox, { borderColor: '#cffafe' }]}>
      <View style={styles.mockupHeader}>
        <Text style={styles.mockupTitle}>Health Audit</Text>
        <View style={[styles.activePill, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.activePillText, { color: '#16a34a' }]}>89/100</Text>
        </View>
      </View>
      <View style={{ gap: 3 }}>
        <View style={styles.auditBarRow}>
          <Text style={styles.auditLabel}>SEO</Text>
          <Text style={styles.auditVal}>91%</Text>
        </View>
        <View style={[styles.auditBarTrack, { width: '91%', backgroundColor: '#10b981' }]} />
        <View style={styles.auditBarRow}>
          <Text style={styles.auditLabel}>Performance</Text>
          <Text style={styles.auditVal}>84%</Text>
        </View>
        <View style={[styles.auditBarTrack, { width: '84%', backgroundColor: '#06b6d4' }]} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { planLabel, hasTelegram, hasWhatsApp, hasVoice, hasCRM, hasSocial, refresh: refreshSub } = usePlatformSubscription();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real Workspace Telemetry from Supabase matching UserDashboardOverview.tsx
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ['workspace-telemetry-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return { landingPagesCount: 0, quickFormsCount: 0, shortLinksCount: 0, botsCount: 0 };

      const [j, tr, ch, fw, pg, fm, lk] = await Promise.all([
        supabase.from('tg_bot_join_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tg_tracker').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tg_chatbot_configs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tg_forward_mappings').select('id', { count: 'exact', head: true }),
        supabase.from('tg_landing_pages').select('id,title,created_at').eq('user_id', user.id).limit(3),
        supabase.from('quick_forms').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('short_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const jc = j.count ?? 0;
      const tc = tr.count ?? 0;
      const cc = ch.count ?? 0;

      return {
        joinLinksCount: jc,
        trackerBotsCount: tc,
        chatbotConfigsCount: cc,
        totalBotsCount: jc + tc + cc,
        forwardRulesCount: fw.count ?? 0,
        landingPagesCount: pg.data?.length ?? 0,
        quickFormsCount: fm.count ?? 0,
        shortLinksCount: lk.count ?? 0,
      };
    },
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    refreshSub();
    await refetchTelemetry();
    setIsRefreshing(false);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Pilot';

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar
        rightElement={
          <Pressable
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/account' as any)}
          >
            <Text style={styles.avatarBtnText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── PageIntro Header (Direct Web Port) ──────────────── */}
        <View style={styles.pageIntroHeader}>
          <Text style={styles.pageIntroEyebrow}>SERVICES</Text>
          <Text style={styles.pageIntroTitle}>Your AI Workspace</Text>
          <Text style={styles.pageIntroSubtitle}>powered by Get AI Pilot.</Text>
          
          <View style={styles.pageIntroMetaRow}>
            <Text style={styles.pageIntroDesc}>
              Launch, automate, and grow — every Get AI Pilot service from one unified workspace.
            </Text>
            <View style={styles.planBadgePill}>
              <Text style={styles.planBadgeText}>Plan: {planLabel || 'Free'}</Text>
            </View>
          </View>
        </View>

        {/* ── AUTOMATION SECTION ─────────────────────────────── */}
        <GridSectionHeader label="Automation" />

        {/* 01 Telegram Pilot */}
        <DashboardCard
          num="01"
          title={'Telegram\nPilot'}
          description="Auto-forward feeds, sub bots, and channel growth tools."
          statusBadge={<StatusChip active={hasTelegram} />}
          onAction={() => router.push('/products/telegram' as any)}
          visualNode={<MockupTelegram />}
        />

        {/* 02 WhatsApp Suite */}
        <DashboardCard
          num="02"
          title={'WhatsApp\nSuite'}
          description="Broadcast campaigns and 24/7 AI auto-responders via Meta Cloud API."
          statusBadge={<StatusChip active={hasWhatsApp} />}
          onAction={() => router.push('/products/whatsapp' as any)}
          visualNode={<MockupWhatsApp />}
        />

        {/* 03 Voice Pilot */}
        <DashboardCard
          num="03"
          title={'Voice\nPilot'}
          description="AI voice agents — speech-to-text, LLM logic, and TTS streaming."
          statusBadge={<StatusChip active={hasVoice} />}
          onAction={() => router.push('/products/voice' as any)}
          visualNode={<MockupVoice />}
        />

        {/* 04 Business CRM */}
        <DashboardCard
          num="04"
          title={'Business\nCRM'}
          description="Sales pipeline, deals, and multi-tenant CRM workspace."
          statusBadge={<StatusChip active={hasCRM} />}
          onAction={() => router.push('/products/crm' as any)}
          visualNode={<MockupCRM />}
        />

        {/* 05 Social Pilot */}
        <DashboardCard
          num="05"
          title={'Social\nPilot'}
          description="Automated content scheduling across Instagram, LinkedIn, Facebook & X."
          statusBadge={<StatusChip active={hasSocial} />}
          onAction={() => router.push('/products/social' as any)}
          visualNode={<MockupSocial />}
        />

        {/* 06 Connected Platforms & Users */}
        <DashboardCard
          num="06"
          title={'Connected Platforms\n& Users'}
          description="Manage your connected Telegram bots, WhatsApp instances, and subscriber directory."
          onAction={() => router.push('/(tabs)/activity' as any)}
          visualNode={<MockupConnectedChats />}
        />

        {/* ── FREE TOOLS SECTION ─────────────────────────────── */}
        <GridSectionHeader label="Free Tools" />

        {/* 06 My Designs */}
        <DashboardCard
          num="06"
          title={'My\nDesigns'}
          description="Browse, manage, and edit your saved visual assets and templates."
          onAction={() => router.push('/tools/my-designs' as any)}
          visualNode={<MockupMyDesigns />}
        />

        {/* 07 Bio Templates */}
        <DashboardCard
          num="07"
          title={'Bio\nTemplates'}
          description="Create beautiful link-in-bio pages with ready-to-use mobile-first templates."
          onAction={() => router.push('/tools/bio-templates' as any)}
          visualNode={<MockupBio />}
        />

        {/* 08 Landing Pages */}
        <DashboardCard
          num="08"
          title={'Landing\nPages'}
          description={`${telemetry?.landingPagesCount || 0}/10 pages used — drag-and-drop builder.`}
          onAction={() => router.push('/tools/landing-templates' as any)}
          visualNode={<MockupLandingPages />}
        />

        {/* 09 Landing Templates */}
        <DashboardCard
          num="09"
          title={'Landing\nTemplates'}
          description="High-converting page templates for webinars, lead gen, and products."
          onAction={() => router.push('/tools/landing-templates' as any)}
          visualNode={<MockupLandingTemplates />}
        />

        {/* 10 Quick Forms */}
        <DashboardCard
          num="10"
          title={'Quick\nForms'}
          description={`${telemetry?.quickFormsCount || 0} active forms — conversational, embeddable, zero-code.`}
          onAction={() => router.push('/tools/quick-forms' as any)}
          visualNode={<MockupQuickForms />}
        />

        {/* 11 Short Links */}
        <DashboardCard
          num="11"
          title={'Short\nLinks'}
          description={`${telemetry?.shortLinksCount || 0} links created — URL shortener with click analytics.`}
          onAction={() => router.push('/tools/link-shortener' as any)}
          visualNode={<MockupShortLinks />}
        />

        {/* 12 File Linker */}
        <DashboardCard
          num="12"
          title={'File\nLinker'}
          description="Upload documents or media up to 50 MB and share as a shortened link."
          onAction={() => router.push('/tools/file-linker' as any)}
          visualNode={<MockupFileLinker />}
        />

        {/* 13 Event Links */}
        <DashboardCard
          num="13"
          title={'Event\nLinks'}
          description="Smart event pages with booking slots and timezone-aware calendar invites."
          onAction={() => router.push('/tools/event-links' as any)}
          visualNode={<MockupEventLinks />}
        />

        {/* 14 AI Speech to Text */}
        <DashboardCard
          num="14"
          title={'AI Speech\nto Text'}
          description="Transcribe audio and video with multi-language support and subtitle export."
          onAction={() => router.push('/tools/speech-to-text' as any)}
          visualNode={<MockupSpeech />}
        />

        {/* 15 QR Code Generator */}
        <DashboardCard
          num="15"
          title={'QR Code\nGenerator'}
          description="Customizable, brand-themed QR codes for URLs, WiFi, vCards, and email."
          onAction={() => router.push('/tools/qr-code' as any)}
          visualNode={<MockupQRCode />}
        />

        {/* 16 AI Website Audit */}
        <DashboardCard
          num="16"
          title={'AI Website\nAudit'}
          description="Instantly audit SEO, performance, UX, and conversion with an AI health score."
          onAction={() => router.push('/tools/website-audit' as any)}
          visualNode={<MockupWebsiteAudit />}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: '#F5F4F0',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0A5C3D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 184, 130, 0.4)',
  },
  avatarBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // ─── PageIntro Editorial Styling ─────────────────────────────
  pageIntroHeader: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  pageIntroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pageIntroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  pageIntroSubtitle: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 12,
  },
  pageIntroMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  pageIntroDesc: {
    flex: 1,
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
  },
  planBadgePill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2dfd7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  // ─── GridSection Header ──────────────────────────────────────
  gridSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 14,
  },
  gridSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  gridSectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2dfd7',
  },
  // ─── Exact Web CardShell Styling ─────────────────────────────
  cardShell: {
    position: 'relative',
    height: 236,
    backgroundColor: '#ECEAE4',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2dfd7',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  visualContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  contentContainer: {
    flex: 1,
    width: '56%',
    padding: 18,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNum: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  statusChipUpgrade: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusChipUpgradeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#b45309',
    textTransform: 'uppercase',
  },
  cardTextGroup: {
    marginVertical: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 4,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionArrow: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ─── Visual Mockup Boxes ─────────────────────────────────────
  mockupBox: {
    width: 135,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 6,
  },
  avatarDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  mockupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  activePill: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  mockupInner: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.15)',
  },
  mockupInnerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  mockupInnerSub: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  voiceWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 20,
    marginVertical: 4,
  },
  voiceWaveBar: {
    width: 3,
    backgroundColor: '#c084fc',
    borderRadius: 2,
  },
  voiceTimerText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#d8b4fe',
    textAlign: 'center',
  },
  crmStagesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  crmStageCard: {
    flex: 1,
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  crmStageTag: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  crmStageVal: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 6,
  },
  miniDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDotText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  miniLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  miniStatus: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#10b981',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  swatchItem: {
    width: 34,
    height: 18,
    borderRadius: 4,
  },
  bioPhone: {
    width: 76,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#34d399',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioNotch: {
    width: 24,
    height: 3,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  bioAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
  },
  bioContent: {
    width: '100%',
    gap: 3,
  },
  bioBar: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  bioBtn: {
    height: 10,
    backgroundColor: '#10b981',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioBtnText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  browserHeader: {
    height: 14,
    backgroundColor: '#ede9fe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
  },
  windowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  landingHeroBar: {
    height: 6,
    width: '75%',
    backgroundColor: '#7c3aed',
    borderRadius: 2,
  },
  landingSubBar: {
    height: 4,
    width: '50%',
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  landingCta: {
    height: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landingCtaText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  formInputMock: {
    height: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  formInputText: {
    fontSize: 6,
    color: '#64748b',
  },
  formBtnMock: {
    height: 14,
    backgroundColor: '#0d9488',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 22,
    paddingTop: 2,
  },
  chartBar: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  fileExtBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  fileExtText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#b45309',
    fontFamily: 'monospace',
  },
  fileBtnMock: {
    height: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBtnText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eventSlotBadge: {
    flex: 1,
    backgroundColor: '#fff1f2',
    borderRadius: 4,
    padding: 3,
    alignItems: 'center',
  },
  eventSlotText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#e11d48',
  },
  eventBookBtn: {
    flex: 1,
    backgroundColor: '#f43f5e',
    borderRadius: 4,
    padding: 3,
    alignItems: 'center',
  },
  eventBookText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    gap: 1,
  },
  qrPixel: {
    width: 7,
    height: 7,
    borderRadius: 1,
  },
  auditBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditLabel: {
    fontSize: 6,
    color: '#475569',
  },
  auditVal: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#10b981',
  },
  auditBarTrack: {
    height: 3,
    borderRadius: 2,
  },
});

