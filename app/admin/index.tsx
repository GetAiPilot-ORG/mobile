import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Redirect /admin to /(tabs)/admin to prevent 404s when navigating to /admin root
 */
export default function AdminIndexRedirect() {
  return <Redirect href={"/(tabs)/admin" as any} />;
}
