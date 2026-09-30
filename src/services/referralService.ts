import { supabase } from '@/lib/supabase';

export const getMyReferral = async (userId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', userId)
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const createReferral = async (
    referralCode: string
) => {
    const { data, error } = await supabase.rpc(
        'create_referral',
        {
            p_referral_code: referralCode,
        }
    );

    if (error) {
        throw error;
    }

    return data;
};