import { useRouter } from 'expo-router';
import { WhatsAppContactsScreen } from '../../../src/features/whatsapp/screens/WhatsAppContactsScreen';

export default function WhatsAppContactsRoute() {
  const router = useRouter();
  return (
    <WhatsAppContactsScreen
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
