import React from 'react';
import { useRouter } from 'expo-router';
import { TasksScreen } from '../../src/features/crm/screens/TasksScreen';

export default function TasksPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <TasksScreen onBack={handleBack} />;
}
