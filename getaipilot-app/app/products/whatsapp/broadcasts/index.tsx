import { useRouter } from 'expo-router';
import { WhatsAppBroadcastsScreen } from '../../../../src/features/whatsapp/screens/WhatsAppBroadcastsScreen';

export default function WhatsAppBroadcastsRoute() {
  const router = useRouter();
  return (
    <WhatsAppBroadcastsScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products/whatsapp');
        }
      }}
    />
  );
}
