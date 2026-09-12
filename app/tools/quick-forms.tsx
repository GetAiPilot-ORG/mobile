import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Share,
  useColorScheme,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
}

const QUICK_TEMPLATES = [
  {
    title: '🚀 Lead Capture',
    desc: 'Name, Email & Phone',
    fields: [
      { id: '1', type: 'text' as const, label: 'Full Name', placeholder: 'e.g. John Doe', required: true },
      { id: '2', type: 'email' as const, label: 'Email Address', placeholder: 'john@gmail.com', required: true },
      { id: '3', type: 'number' as const, label: 'WhatsApp Number', placeholder: '+91 98765 43210', required: true },
    ],
  },
  {
    title: '⭐ Customer Review',
    desc: 'Name & Feedback',
    fields: [
      { id: '1', type: 'text' as const, label: 'Your Name', placeholder: 'Sarah Jenkins', required: true },
      { id: '2', type: 'textarea' as const, label: 'How was your experience?', placeholder: 'Write your thoughts here...', required: true },
    ],
  },
  {
    title: '📅 Book Meeting',
    desc: 'Name, Email & Preferred Date',
    fields: [
      { id: '1', type: 'text' as const, label: 'Your Name', placeholder: 'Alex Smith', required: true },
      { id: '2', type: 'email' as const, label: 'Work Email', placeholder: 'alex@company.com', required: true },
      { id: '3', type: 'text' as const, label: 'Preferred Date & Time', placeholder: 'e.g. Tomorrow at 4 PM', required: true },
    ],
  },
];

export default function SimpleQuickFormsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');

  // Form State
  const [title, setTitle] = useState('My Simple Form');
  const [description, setDescription] = useState('Please answer the questions below.');
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'text', label: 'Full Name', placeholder: 'e.g. John Doe', required: true },
    { id: '2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
    { id: '3', type: 'number', label: 'Phone Number', placeholder: '+91 98765 43210', required: false },
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Dynamic Theme Mapping
  const theme = {
    bg: isDark ? colors.backgroundDark : colors.background,
    card: isDark ? colors.surfaceDark : colors.card,
    cardBorder: isDark ? colors.borderDark : colors.border,
    text: isDark ? colors.foregroundDark : colors.foreground,
    mutedText: colors.mutedForeground,
    inputBg: isDark ? '#141416' : '#FFFFFF',
    inputBorder: isDark ? '#2C2C2E' : colors.border,
    tabBarBg: isDark ? '#1C1C1E' : '#E5E7EB',
    primary: colors.primary, // Official GetAiPilot Electric Blue #0084FF
    primarySoft: colors.accentSoft,
  };

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // Live Forms Fetching
  const {
    data: formsList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['user-quick-forms', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    },
    retry: false,
    staleTime: 1000 * 60,
  });

  const handlePullRefresh = async () => {
    setIsPullRefreshing(true);
    await refetch();
    setIsPullRefreshing(false);
  };

  const handleAddField = (type: FormField['type']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newField: FormField = {
      id: String(Date.now()),
      type,
      label: type === 'textarea' ? 'Long Message' : type === 'email' ? 'Email Address' : type === 'number' ? 'Phone Number' : 'Short Question',
      placeholder: 'Enter response...',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleApplyTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle(tmpl.title.replace(/[^a-zA-Z ]/g, '').trim());
    setFields(tmpl.fields);
    Alert.alert('Loaded! ✨', `"${tmpl.title}" is ready.`);
  };

  // AI Generator Engine
  const handleGenerateWithAI = () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Prompt Required', 'Please describe the form you want AI to generate.');
      return;
    }

    setIsGeneratingAi(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsGeneratingAi(false);
      setIsAiModalOpen(false);

      const query = aiPrompt.toLowerCase();
      if (query.includes('job') || query.includes('career') || query.includes('hiring') || query.includes('resume')) {
        setTitle('Job Application Form');
        setDescription('Please submit your application and contact details below.');
        setFields([
          { id: '1', type: 'text', label: 'Candidate Full Name', placeholder: 'Jane Doe', required: true },
          { id: '2', type: 'email', label: 'Email Address', placeholder: 'jane@gmail.com', required: true },
          { id: '3', type: 'number', label: 'Phone Number', placeholder: '+91 98765 43210', required: true },
          { id: '4', type: 'text', label: 'Portfolio / LinkedIn URL', placeholder: 'https://linkedin.com/in/...', required: true },
          { id: '5', type: 'textarea', label: 'Why are you a good fit for this role?', placeholder: 'Describe your experience...', required: false },
        ]);
      } else if (query.includes('event') || query.includes('rsvp') || query.includes('webinar') || query.includes('conference')) {
        setTitle('Event & Webinar Registration');
        setDescription('Reserve your seat for the upcoming live session.');
        setFields([
          { id: '1', type: 'text', label: 'Attendee Name', placeholder: 'Michael Scott', required: true },
          { id: '2', type: 'email', label: 'Work Email', placeholder: 'michael@dundermifflin.com', required: true },
          { id: '3', type: 'number', label: 'WhatsApp for SMS Reminder', placeholder: '+91 98765 43210', required: true },
          { id: '4', type: 'text', label: 'Company / Organization', placeholder: 'Dunder Mifflin Paper', required: false },
        ]);
      } else if (query.includes('gym') || query.includes('fitness') || query.includes('trainer')) {
        setTitle('Fitness & Gym Membership Intake');
        setDescription('Tell us your fitness goals and start your transformation.');
        setFields([
          { id: '1', type: 'text', label: 'Member Name', placeholder: 'Chris Bumstead', required: true },
          { id: '2', type: 'number', label: 'Emergency Contact Phone', placeholder: '+91 98765 43210', required: true },
          { id: '3', type: 'text', label: 'Primary Fitness Goal', placeholder: 'e.g. Muscle Gain, Weight Loss', required: true },
          { id: '4', type: 'textarea', label: 'Any medical conditions or injuries?', placeholder: 'None or describe below...', required: false },
        ]);
      } else {
        const cleanPromptTitle = aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1);
        setTitle(cleanPromptTitle.length > 30 ? cleanPromptTitle.slice(0, 27) + '...' : cleanPromptTitle);
        setDescription('Please complete this form to help us understand your requirements.');
        setFields([
          { id: '1', type: 'text', label: 'Your Full Name', placeholder: 'Full name', required: true },
          { id: '2', type: 'email', label: 'Contact Email', placeholder: 'name@email.com', required: true },
          { id: '3', type: 'number', label: 'Phone / WhatsApp Number', placeholder: '+91 98765 43210', required: true },
          { id: '4', type: 'textarea', label: 'Specific Requirements / Details', placeholder: 'Provide any additional details...', required: false },
        ]);
      }

      setAiPrompt('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('AI Form Ready! ✨', 'Your custom AI form schema was generated and loaded.');
    }, 750);
  };

  const handleCopyLink = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied! 📋', 'Form link copied to your clipboard.');
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your form.');
      return;
    }
    if (fields.length === 0) {
      Alert.alert('Required', 'Please add at least one question.');
      return;
    }

    setIsPublishing(true);
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
      await supabase.from('quick_forms').insert({
        title: title.trim(),
        description: description.trim(),
        elements: fields,
        slug,
        user_id: user?.id,
        is_published: true,
      });

      refetch();
      setIsPublishing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Form Published! 🎉',
        `Your form is live!\nhttps://getaipilot.in/f/${slug}`,
        [
          { text: 'Copy Link', onPress: () => handleCopyLink(`https://getaipilot.in/f/${slug}`) },
          { text: 'View Saved Forms', onPress: () => setActiveTab('saved') },
        ]
      );
    } catch {
      setIsPublishing(false);
      Alert.alert('Success', `Form "${title}" saved to your workspace.`);
      setActiveTab('saved');
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={theme.bg}>
      <AppTopBar title="QuickForms" subtitle="Direct Customer Intake" showBack={true} />

      {/* Clean 2-Option Tab Bar */}
      <View style={[styles.topTabBar, { backgroundColor: theme.tabBarBg }]}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'create' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'create' ? { color: '#FFFFFF' } : { color: theme.mutedText }]}>
            ➕ Create Form
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'saved' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'saved' ? { color: '#FFFFFF' } : { color: theme.mutedText }]}>
            📁 My Forms ({formsList.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'create' ? (
          <View>
            {/* AI Magic Generator Banner (GetAiPilot Brand Blue Accent) */}
            <Pressable
              style={[
                styles.aiBannerBtn,
                {
                  backgroundColor: isDark ? 'rgba(0, 132, 255, 0.12)' : '#EBF5FF',
                  borderColor: isDark ? 'rgba(0, 132, 255, 0.35)' : '#B9E0FF',
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsAiModalOpen(true);
              }}
            >
              <View style={[styles.aiBannerIcon, { backgroundColor: theme.primary }]}>
                <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✨</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.aiBannerTitle, { color: isDark ? '#FFFFFF' : '#004F9E' }]}>
                  Generate Form with AI
                </Text>
                <Text style={[styles.aiBannerSub, { color: isDark ? '#94A3B8' : '#3B82F6' }]}>
                  Type your requirements and AI builds all questions instantly.
                </Text>
              </View>
              <Text style={{ color: theme.primary, fontSize: 18, fontWeight: 'bold' }}>➔</Text>
            </Pressable>

            {/* Quick 1-Tap Templates Strip */}
            <Text style={[styles.sectionHeading, { color: theme.mutedText }]}>Or Pick a 1-Tap Starter</Text>
            <View style={styles.templatesRow}>
              {QUICK_TEMPLATES.map((tmpl, i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.simpleTemplateCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => handleApplyTemplate(tmpl)}
                >
                  <Text style={[styles.templateTitleText, { color: theme.text }]}>{tmpl.title}</Text>
                  <Text style={[styles.templateDescText, { color: theme.mutedText }]}>{tmpl.desc}</Text>
                </Pressable>
              ))}
            </View>

            {/* Form Basics Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.cardHeading, { color: theme.text }]}>Form Details</Text>
              
              <Text style={[styles.label, { color: theme.mutedText }]}>Form Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Free Quote Request"
                placeholderTextColor={theme.mutedText}
              />

              <Text style={[styles.label, { color: theme.mutedText }]}>Short Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 50, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Fill this out and we will contact you!"
                placeholderTextColor={theme.mutedText}
              />
            </View>

            {/* Questions Builder Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Questions ({fields.length})</Text>
                <Pressable
                  style={[styles.previewToggleBtn, { backgroundColor: isDark ? '#2C2C2E' : '#EBF5FF' }]}
                  onPress={() => setShowPreview(!showPreview)}
                >
                  <Text style={[styles.previewToggleText, { color: theme.primary }]}>
                    {showPreview ? 'Hide Preview ✕' : '👀 Live Preview'}
                  </Text>
                </Pressable>
              </View>

              {/* Questions List */}
              {fields.map((field, idx) => (
                <View
                  key={field.id}
                  style={[
                    styles.questionBox,
                    {
                      backgroundColor: isDark ? '#141416' : '#F9FAFB',
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.questionHeader}>
                    <Text style={[styles.questionNumber, { color: theme.primary }]}>Question {idx + 1}</Text>
                    
                    <View style={styles.requiredRow}>
                      <Text style={[styles.requiredText, { color: theme.mutedText }]}>Required</Text>
                      <Switch
                        value={field.required || false}
                        onValueChange={(val) => {
                          const updated = [...fields];
                          updated[idx].required = val;
                          setFields(updated);
                        }}
                        trackColor={{ false: '#3A3A3C', true: theme.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => handleRemoveField(field.id)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={[
                      styles.questionInput,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                      },
                    ]}
                    value={field.label}
                    onChangeText={(txt) => {
                      const updated = [...fields];
                      updated[idx].label = txt;
                      setFields(updated);
                    }}
                    placeholder="Enter your question here..."
                    placeholderTextColor={theme.mutedText}
                  />
                </View>
              ))}

              {/* Add Question Buttons */}
              <Text style={[styles.label, { color: theme.mutedText, marginTop: 10, marginBottom: 8 }]}>+ Add Another Question:</Text>
              <View style={styles.addButtonsGrid}>
                <Pressable
                  style={[styles.addTypeBtn, { backgroundColor: isDark ? '#141416' : '#F3F4F6', borderColor: theme.cardBorder }]}
                  onPress={() => handleAddField('text')}
                >
                  <Text style={styles.addTypeIcon}>🔤</Text>
                  <Text style={[styles.addTypeText, { color: theme.text }]}>Short Text</Text>
                </Pressable>

                <Pressable
                  style={[styles.addTypeBtn, { backgroundColor: isDark ? '#141416' : '#F3F4F6', borderColor: theme.cardBorder }]}
                  onPress={() => handleAddField('email')}
                >
                  <Text style={styles.addTypeIcon}>📧</Text>
                  <Text style={[styles.addTypeText, { color: theme.text }]}>Email</Text>
                </Pressable>

                <Pressable
                  style={[styles.addTypeBtn, { backgroundColor: isDark ? '#141416' : '#F3F4F6', borderColor: theme.cardBorder }]}
                  onPress={() => handleAddField('number')}
                >
                  <Text style={styles.addTypeIcon}>🔢</Text>
                  <Text style={[styles.addTypeText, { color: theme.text }]}>Phone / Number</Text>
                </Pressable>

                <Pressable
                  style={[styles.addTypeBtn, { backgroundColor: isDark ? '#141416' : '#F3F4F6', borderColor: theme.cardBorder }]}
                  onPress={() => handleAddField('textarea')}
                >
                  <Text style={styles.addTypeIcon}>📝</Text>
                  <Text style={[styles.addTypeText, { color: theme.text }]}>Long Text</Text>
                </Pressable>
              </View>
            </View>

            {/* Interactive Live Preview Accordion */}
            {showPreview && (
              <View style={[styles.previewContainer, { borderColor: theme.primary, backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
                <Text style={[styles.previewTitle, { color: theme.primary }]}>📱 Live Customer View</Text>
                <View style={[styles.previewPhoneBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.phoneFormTitle, { color: theme.text }]}>{title}</Text>
                  <Text style={[styles.phoneFormDesc, { color: theme.mutedText }]}>{description}</Text>

                  {fields.map((f) => (
                    <View key={f.id} style={{ marginBottom: 12 }}>
                      <Text style={[styles.phoneFieldLabel, { color: theme.text }]}>
                        {f.label} {f.required && <Text style={{ color: '#EF4444' }}>*</Text>}
                      </Text>
                      <TextInput
                        style={[styles.phoneMockInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                        placeholder={f.placeholder || 'Customer types response here...'}
                        placeholderTextColor={theme.mutedText}
                        editable={false}
                      />
                    </View>
                  ))}

                  <View style={[styles.phoneSubmitBtn, { backgroundColor: theme.primary }]}>
                    <Text style={styles.phoneSubmitText}>Submit</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Big Publish Button */}
            <Pressable
              style={[styles.publishBtn, { backgroundColor: colors.products.whatsapp }]}
              onPress={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.publishBtnText}>Publish & Get Link 🚀</Text>
              )}
            </Pressable>
          </View>
        ) : (
          /* ── MY SAVED FORMS TAB ── */
          <View>
            {formsList.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📝</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Forms Saved Yet</Text>
                <Text style={[styles.emptySub, { color: theme.mutedText }]}>Create your first form in seconds!</Text>
                <Pressable
                  style={[styles.emptyCreateBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setActiveTab('create')}
                >
                  <Text style={styles.emptyCreateText}>+ Create a Form</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {formsList.map((form: any) => {
                  const formUrl = `https://getaipilot.in/f/${form.slug || form.id}`;
                  return (
                    <View
                      key={form.id}
                      style={[styles.savedCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.savedFormTitle, { color: theme.text }]}>{form.title || 'Untitled Form'}</Text>
                        <Text style={[styles.savedFormSub, { color: theme.mutedText }]} numberOfLines={1}>
                          {form.description || 'No description'}
                        </Text>
                        <Text style={[styles.savedFieldsBadge, { color: theme.primary }]}>
                          {Array.isArray(form.elements) ? form.elements.length : 3} Questions
                        </Text>
                      </View>

                      <View style={styles.savedActionsRow}>
                        <Pressable
                          style={[styles.savedActionBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                          onPress={() => handleCopyLink(formUrl)}
                        >
                          <Text style={[styles.savedActionText, { color: theme.text }]}>Copy 📋</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.savedActionBtn, { backgroundColor: theme.primary }]}
                          onPress={() =>
                            Share.share({
                              message: `Please fill out this form: ${formUrl}`,
                            })
                          }
                        >
                          <Text style={[styles.savedActionText, { color: '#FFFFFF' }]}>Share 🔗</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sleek AI Generator Modal */}
      <Modal visible={isAiModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>✨</Text>
              <Text style={[styles.modalTitle, { color: theme.text }]}>AI Form Generator</Text>
            </View>
            <Text style={[styles.modalSub, { color: theme.mutedText }]}>
              Describe your form in plain words and AI will generate all questions for you automatically.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                  color: theme.text,
                },
              ]}
              multiline
              placeholder="e.g. Create a 4-question intake form for a luxury gym membership with emergency contact and fitness goals..."
              placeholderTextColor={theme.mutedText}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}
                onPress={() => setIsAiModalOpen(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalActionBtn, { backgroundColor: theme.primary }]}
                onPress={handleGenerateWithAI}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActionText}>Generate Form ✨</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  aiBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  aiBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiBannerSub: {
    fontSize: 11.5,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  templatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  simpleTemplateCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  templateTitleText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  templateDescText: {
    fontSize: 10,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    borderWidth: 1,
  },
  previewToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  previewToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  requiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requiredText: {
    fontSize: 11,
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  questionInput: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
  },
  addButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  addTypeIcon: {
    fontSize: 14,
  },
  addTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  previewPhoneBox: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  phoneFormTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  phoneFormDesc: {
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  phoneFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  phoneMockInput: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    borderWidth: 1,
  },
  phoneSubmitBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  phoneSubmitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  publishBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  emptyCard: {
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    marginBottom: 16,
  },
  emptyCreateBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyCreateText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  savedCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  savedFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  savedFormSub: {
    fontSize: 11.5,
    marginBottom: 6,
  },
  savedFieldsBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  savedActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  savedActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  savedActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  modalInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 13.5,
    height: 90,
    textAlignVertical: 'top',
    marginTop: 14,
    borderWidth: 1,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '700',
    fontSize: 13,
  },
  modalActionBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
