import { useRouter } from 'expo-router';
import { WhatsAppTemplatesScreen } from '../../../src/features/whatsapp/screens/WhatsAppTemplatesScreen';

export default function WhatsAppTemplatesRoute() {
  const router = useRouter();
  return (
    <WhatsAppTemplatesScreen
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
