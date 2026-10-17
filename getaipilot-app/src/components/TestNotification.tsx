import { useNotifications } from '@/contexts/NotificationContext';
import { Pressable, Text } from 'react-native';

export function TestNotificationButton() {
    const { sendTestNotification, expoPushToken } = useNotifications();

    return (
        <Pressable
            onPress={async () => {
                console.log("Current Push Token:", expoPushToken);
                await sendTestNotification(
                    "Test Lead Alert! 🚀",
                    "Naya prospect GetAiPilot par aaya hai. Click karke dekhein.",
                    "leads",
                    "/crm/contacts"
                );
            }}
            style={{ padding: 12, backgroundColor: '#10B981', borderRadius: 8, alignItems: 'center' }}
        >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Send Test Notification</Text>
        </Pressable>
    );
}
