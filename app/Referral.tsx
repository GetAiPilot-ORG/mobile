import * as Clipboard from 'expo-clipboard';
import {
    CheckCircle2,
    ChevronRight,
    Clock3,
    Copy,
    Gift,
    Link as LinkIcon,
    Share2,
    Users,
    Wallet,
} from 'lucide-react-native';
import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { getColors } from '@/theme/colors';
import { useTheme } from '../src/theme';

type ReferralStatus =
    | 'pending'
    | 'completed'
    | 'rewarded'
    | 'cancelled';

interface Referral {
    id: string;
    referral_code: string;
    status: ReferralStatus;
    reward_amount: number;
    created_at: string;
    completed_at: string | null;
    rewarded_at: string | null;
}

interface ReferralScreenProps {
    userId?: string;
}

const APP_REFERRAL_URL =
    Platform.OS === 'web'
        ? 'https://getaipilot.in/register'
        : 'https://getaipilot.in/register';

export default function ReferralScreen() {
    const { isDark } = useTheme();
    const colors = getColors(isDark);
    const [referralCode, setReferralCode] =
        useState<string>('');

    const [referrals, setReferrals] =
        useState<Referral[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    /**
     * ---------------------------------------------
     * Get referral code from profiles table
     * ---------------------------------------------
     */
    const getReferralCode = async () => {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Unable to get authenticated user:', authError);
            return;
        }

        const userId = user.id;

        const { data, error } = await supabase
            .from('profiles')
            .select('referral_code')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Failed to get referral code:', error);
            return;
        }

        console.log('Referral code:', data.referral_code);

        setReferralCode(data.referral_code ?? '');
    };
    /**
     * ---------------------------------------------
     * Get referrals made by current user
     * ---------------------------------------------
     */
    const getReferrals = async () => {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (!user?.id) {
            return;
        }

        const {
            data,
            error: referralError,
        } = await supabase
            .from('referrals')
            .select(
                `
          id,
          referral_code,
          status,
          reward_amount,
          created_at,
          completed_at,
          rewarded_at
        `
            )
            .eq('referrer_id', user?.id)
            .order('created_at', {
                ascending: false,
            });

        if (referralError) {
            console.error(
                'Failed to get referrals:',
                referralError
            );

            throw referralError;
        }

        setReferrals(data ?? []);
    };

    /**
     * ---------------------------------------------
     * Load all referral information
     * ---------------------------------------------
     */
    const loadReferralData = async () => {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setError(null);

            await Promise.all([
                getReferralCode(),
                getReferrals(),
            ]);
        } catch (err: any) {
            console.error(
                'Failed to load referral data:',
                err
            );

            setError(
                err?.message ||
                'Unable to load referral information.'
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * ---------------------------------------------
     * Load on screen mount
     * ---------------------------------------------
     */
    useEffect(() => {
        loadReferralData();
    }, []);

    /**
     * ---------------------------------------------
     * Pull to refresh
     * ---------------------------------------------
     */
    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            await loadReferralData();
        } finally {
            setRefreshing(false);
        }
    }, []);

    /**
     * ---------------------------------------------
     * Copy referral code
     * ---------------------------------------------
     */
    const copyReferralCode = async () => {
        if (!referralCode) {
            Alert.alert(
                'Referral code unavailable',
                'Your referral code is not available yet.'
            );

            return;
        }

        try {
            await Clipboard.setStringAsync(
                referralCode
            );

            Alert.alert(
                'Copied',
                'Your referral code has been copied.'
            );
        } catch (err) {
            console.error(
                'Copy referral code error:',
                err
            );
        }
    };

    /**
     * ---------------------------------------------
     * Share referral link
     * ---------------------------------------------
     */
    const shareReferral = async () => {
        if (!referralCode) {
            Alert.alert(
                'Referral code unavailable',
                'Your referral code is not available yet.'
            );

            return;
        }

        const referralLink =
            `${APP_REFERRAL_URL}?ref=${encodeURIComponent(
                referralCode
            )}`;

        try {
            await Share.share({
                title: 'Invite friends to GetAiPilot',

                message:
                    `Join me on GetAiPilot!\n\n` +
                    `Use my referral link:\n` +
                    `${referralLink}\n\n` +
                    `Referral Code: ${referralCode}`,
            });
        } catch (err) {
            console.error(
                'Share referral error:',
                err
            );
        }
    };

    /**
     * ---------------------------------------------
     * Format date
     * ---------------------------------------------
     */
    const formatDate = (
        date: string
    ) => {
        return new Date(
            date
        ).toLocaleDateString(
            'en-IN',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        );
    };

    /**
     * ---------------------------------------------
     * Referral statistics
     * ---------------------------------------------
     */
    const pendingCount =
        referrals.filter(
            item =>
                item.status ===
                'pending'
        ).length;

    const totalCount =
        referrals.length;

    const totalRewards =
        referrals.reduce(
            (total, item) => {
                if (
                    item.status ===
                    'completed' ||
                    item.status ===
                    'rewarded'
                ) {
                    return (
                        total +
                        Number(
                            item.reward_amount ||
                            0
                        )
                    );
                }

                return total;
            },
            0
        );

    /**
     * ---------------------------------------------
     * Status configuration
     * ---------------------------------------------
     */
    const getStatusConfig = (
        status: ReferralStatus
    ) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pending',
                    icon: Clock3,
                };

            case 'completed':
                return {
                    label: 'Completed',
                    icon: CheckCircle2,
                };

            case 'rewarded':
                return {
                    label: 'Rewarded',
                    icon: Gift,
                };

            case 'cancelled':
                return {
                    label: 'Cancelled',
                    icon: Clock3,
                };

            default:
                return {
                    label: status,
                    icon: Clock3,
                };
        }
    };

    /**
     * ---------------------------------------------
     * Loading state
     * ---------------------------------------------
     */
    if (loading) {
        return (
            <SafeAreaView
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:
                            colors.background,
                    },
                ]}
            >
                <View
                    style={
                        styles.loadingContainer
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color={
                            colors.primary
                        }
                    />

                    <Text
                        style={[
                            styles.loadingText,
                            {
                                color:
                                    colors.text,
                            },
                        ]}
                    >
                        Loading referrals...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    /**
     * ---------------------------------------------
     * Error state
     * ---------------------------------------------
     */
    if (error) {
        return (
            <SafeAreaView
                style={[
                    styles.safeArea,
                    {
                        backgroundColor:
                            colors.background,
                    },
                ]}
            >
                <View
                    style={
                        styles.errorContainer
                    }
                >
                    <View
                        style={[
                            styles.errorIcon,
                            {
                                backgroundColor:
                                    colors.primaryMuted,
                            },
                        ]}
                    >
                        <Gift
                            size={30}
                            color={
                                colors.primary
                            }
                        />
                    </View>

                    <Text
                        style={[
                            styles.errorTitle,
                            {
                                color:
                                    colors.text,
                            },
                        ]}
                    >
                        Unable to load referrals
                    </Text>

                    <Text
                        style={[
                            styles.errorMessage,
                            {
                                color:
                                    colors.textSecondary,
                            },
                        ]}
                    >
                        {error}
                    </Text>

                    <Pressable
                        onPress={
                            loadReferralData
                        }
                        style={[
                            styles.retryButton,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.retryText,
                                {
                                    color:
                                        colors.primaryForeground,
                                },
                            ]}
                        >
                            Try Again
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                {
                    backgroundColor:
                        colors.background,
                },
            ]}
            edges={['top']}
        >
            <FlatList
                data={referrals}
                keyExtractor={item =>
                    item.id
                }
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={
                    styles.content
                }
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                        tintColor={
                            colors.primary
                        }
                    />
                }
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View
                            style={
                                styles.header
                            }
                        >
                            <View>
                                <Text
                                    style={[
                                        styles.title,
                                        {
                                            color:
                                                colors.text,
                                        },
                                    ]}
                                >
                                    Refer & Earn
                                </Text>

                                <Text
                                    style={[
                                        styles.subtitle,
                                        {
                                            color:
                                                colors.textSecondary,
                                        },
                                    ]}
                                >
                                    Invite friends and
                                    earn rewards
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.headerIcon,
                                    {
                                        backgroundColor:
                                            colors.primaryMuted,
                                    },
                                ]}
                            >
                                <Gift
                                    size={24}
                                    color={
                                        colors.primary
                                    }
                                />
                            </View>
                        </View>

                        {/* Referral Code Card */}
                        <View
                            style={[
                                styles.codeCard,
                                {
                                    backgroundColor:
                                        colors.surface,
                                    borderColor:
                                        colors.border,
                                },
                            ]}
                        >
                            <View
                                style={
                                    styles.codeHeader
                                }
                            >
                                <View
                                    style={[
                                        styles.smallIcon,
                                        {
                                            backgroundColor:
                                                colors.primaryMuted,
                                        },
                                    ]}
                                >
                                    <LinkIcon
                                        size={18}
                                        color={
                                            colors.primary
                                        }
                                    />
                                </View>

                                <View
                                    style={
                                        styles.codeHeaderText
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.cardLabel,
                                            {
                                                color:
                                                    colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        YOUR REFERRAL CODE
                                    </Text>

                                    <Text
                                        style={[
                                            styles.code,
                                            {
                                                color:
                                                    colors.text,
                                            },
                                        ]}
                                    >
                                        {referralCode ||
                                            '---'}
                                    </Text>
                                </View>

                                <Pressable
                                    onPress={
                                        copyReferralCode
                                    }
                                    hitSlop={10}
                                    style={[
                                        styles.copyButton,
                                        {
                                            backgroundColor:
                                                colors.primaryMuted,
                                        },
                                    ]}
                                >
                                    <Copy
                                        size={18}
                                        color={
                                            colors.primary
                                        }
                                    />
                                </Pressable>
                            </View>

                            <Text
                                style={[
                                    styles.codeDescription,
                                    {
                                        color:
                                            colors.textSecondary,
                                    },
                                ]}
                            >
                                Share your code with
                                friends. When they
                                join using your
                                referral, you can earn
                                rewards.
                            </Text>

                            <Pressable
                                onPress={
                                    shareReferral
                                }
                                style={({
                                    pressed,
                                }) => [
                                        styles.shareButton,
                                        {
                                            backgroundColor:
                                                colors.primary,
                                            opacity: pressed
                                                ? 0.85
                                                : 1,
                                        },
                                    ]}
                            >
                                <Share2
                                    size={19}
                                    color={
                                        colors.primaryForeground
                                    }
                                />

                                <Text
                                    style={[
                                        styles.shareButtonText,
                                        {
                                            color:
                                                colors.primaryForeground,
                                        },
                                    ]}
                                >
                                    Share Referral Link
                                </Text>
                            </Pressable>
                        </View>

                        {/* Statistics */}
                        <View
                            style={
                                styles.statsRow
                            }
                        >
                            <StatCard
                                icon={Clock3}
                                label="Pending"
                                value={String(
                                    pendingCount
                                )}
                                colors={colors}
                            />

                            <StatCard
                                icon={Users}
                                label="Total Referrals"
                                value={String(
                                    totalCount
                                )}
                                colors={colors}
                            />

                            <StatCard
                                icon={Wallet}
                                label="Total Rewards"
                                value={`₹${totalRewards.toFixed(
                                    2
                                )}`}
                                colors={colors}
                            />
                        </View>

                        {/* Activity Header */}
                        <View
                            style={
                                styles.sectionHeader
                            }
                        >
                            <View>
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        {
                                            color:
                                                colors.text,
                                        },
                                    ]}
                                >
                                    Recent Activity
                                </Text>

                                <Text
                                    style={[
                                        styles.sectionSubtitle,
                                        {
                                            color:
                                                colors.textSecondary,
                                        },
                                    ]}
                                >
                                    Track your referral
                                    activity
                                </Text>
                            </View>

                            <ChevronRight
                                size={20}
                                color={
                                    colors.textSecondary
                                }
                            />
                        </View>
                    </View>
                }
                renderItem={({
                    item,
                }) => {
                    const statusConfig =
                        getStatusConfig(
                            item.status
                        );

                    const StatusIcon =
                        statusConfig.icon;

                    return (
                        <View
                            style={[
                                styles.referralItem,
                                {
                                    backgroundColor:
                                        colors.surface,
                                    borderColor:
                                        colors.border,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.referralIcon,
                                    {
                                        backgroundColor:
                                            colors.primaryMuted,
                                    },
                                ]}
                            >
                                <Users
                                    size={19}
                                    color={
                                        colors.primary
                                    }
                                />
                            </View>

                            <View
                                style={
                                    styles.referralInfo
                                }
                            >
                                <Text
                                    style={[
                                        styles.referralTitle,
                                        {
                                            color:
                                                colors.text,
                                        },
                                    ]}
                                >
                                    Referral #
                                    {item.id.slice(
                                        0,
                                        6
                                    )}
                                </Text>

                                <Text
                                    style={[
                                        styles.referralDate,
                                        {
                                            color:
                                                colors.textSecondary,
                                        },
                                    ]}
                                >
                                    {formatDate(
                                        item.created_at
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.referralRight
                                }
                            >
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                colors.primaryMuted,
                                        },
                                    ]}
                                >
                                    <StatusIcon
                                        size={13}
                                        color={
                                            colors.primary
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.statusText,
                                            {
                                                color:
                                                    colors.primary,
                                            },
                                        ]}
                                    >
                                        {
                                            statusConfig.label
                                        }
                                    </Text>
                                </View>

                                {Number(
                                    item.reward_amount
                                ) > 0 && (
                                        <Text
                                            style={[
                                                styles.rewardAmount,
                                                {
                                                    color:
                                                        colors.text,
                                                },
                                            ]}
                                        >
                                            ₹
                                            {Number(
                                                item.reward_amount
                                            ).toFixed(
                                                2
                                            )}
                                        </Text>
                                    )}
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View
                        style={[
                            styles.emptyContainer,
                            {
                                backgroundColor:
                                    colors.surface,
                                borderColor:
                                    colors.border,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.emptyIcon,
                                {
                                    backgroundColor:
                                        colors.primaryMuted,
                                },
                            ]}
                        >
                            <Users
                                size={28}
                                color={
                                    colors.primary
                                }
                            />
                        </View>

                        <Text
                            style={[
                                styles.emptyTitle,
                                {
                                    color:
                                        colors.text,
                                },
                            ]}
                        >
                            No referrals yet
                        </Text>

                        <Text
                            style={[
                                styles.emptyText,
                                {
                                    color:
                                        colors.textSecondary,
                                },
                            ]}
                        >
                            Share your referral
                            link with friends and
                            start earning rewards.
                        </Text>

                        <Pressable
                            onPress={
                                shareReferral
                            }
                            style={[
                                styles.emptyButton,
                                {
                                    backgroundColor:
                                        colors.primary,
                                },
                            ]}
                        >
                            <Share2
                                size={17}
                                color={
                                    colors.primaryForeground
                                }
                            />

                            <Text
                                style={[
                                    styles.emptyButtonText,
                                    {
                                        color:
                                            colors.primaryForeground,
                                    },
                                ]}
                            >
                                Invite Friends
                            </Text>
                        </Pressable>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

/**
 * ---------------------------------------------
 * Statistics Card
 * ---------------------------------------------
 */
function StatCard({
    icon: Icon,
    label,
    value,
    colors,
}: {
    icon: React.ComponentType<{
        size?: number;
        color?: string;
        strokeWidth?: number;
    }>;
    label: string;
    value: string;
    colors: ReturnType<
        typeof getColors
    >;
}) {
    return (
        <View
            style={[
                styles.statCard,
                {
                    backgroundColor:
                        colors.surface,
                    borderColor:
                        colors.border,
                },
            ]}
        >
            <View
                style={[
                    styles.statIcon,
                    {
                        backgroundColor:
                            colors.primaryMuted,
                    },
                ]}
            >
                <Icon
                    size={17}
                    color={
                        colors.primary
                    }
                />
            </View>

            <Text
                style={[
                    styles.statValue,
                    {
                        color:
                            colors.text,
                    },
                ]}
                numberOfLines={1}
            >
                {value}
            </Text>

            <Text
                style={[
                    styles.statLabel,
                    {
                        color:
                            colors.textSecondary,
                    },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 18,
        paddingBottom: 40,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },

    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },

    errorContainer: {
        flex: 1,
        paddingHorizontal: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },

    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },

    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },

    errorMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },

    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },

    retryText: {
        fontSize: 14,
        fontWeight: '700',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },

    subtitle: {
        fontSize: 14,
        marginTop: 5,
    },

    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },

    codeCard: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
    },

    codeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    smallIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },

    codeHeaderText: {
        flex: 1,
        marginLeft: 12,
    },

    cardLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },

    code: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 2,
        marginTop: 3,
    },

    copyButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    codeDescription: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: 16,
    },

    shareButton: {
        minHeight: 50,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 9,
        marginTop: 18,
    },

    shareButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },

    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },

    statCard: {
        flex: 1,
        minHeight: 115,
        borderRadius: 17,
        borderWidth: 1,
        padding: 12,
    },

    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    statValue: {
        fontSize: 17,
        fontWeight: '800',
    },

    statLabel: {
        fontSize: 11,
        marginTop: 4,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },

    sectionSubtitle: {
        fontSize: 12,
        marginTop: 3,
    },

    referralItem: {
        minHeight: 76,
        borderWidth: 1,
        borderRadius: 17,
        paddingHorizontal: 13,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
    },

    referralIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },

    referralInfo: {
        flex: 1,
        marginLeft: 12,
    },

    referralTitle: {
        fontSize: 14,
        fontWeight: '600',
    },

    referralDate: {
        fontSize: 11,
        marginTop: 5,
    },

    referralRight: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 5,
    },

    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },

    rewardAmount: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 5,
    },

    emptyContainer: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
    },

    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },

    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
    },

    emptyText: {
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        marginTop: 6,
        maxWidth: 280,
    },

    emptyButton: {
        marginTop: 18,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    emptyButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
