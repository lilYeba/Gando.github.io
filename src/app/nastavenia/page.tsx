import React from 'react';
import { getUserPreferences } from '@/lib/db/repository';
import { SettingsClient } from '@/components/settings/SettingsClient';


export default async function SettingsPage() {
  const preferences = getUserPreferences();

  return <SettingsClient initialPreferences={preferences} />;
}
