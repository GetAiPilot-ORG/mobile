import { useRouter } from 'expo-router';
import { PipelineScreen } from '../../../src/features/crm/screens/PipelineScreen';

export default function CRMPipelineRoute() {
  const router = useRouter();
  return (
    <PipelineScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products/crm');
        }
      }}
    />
  );
}
