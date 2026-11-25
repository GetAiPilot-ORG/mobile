import assert from 'node:assert/strict';
import { test } from 'node:test';

// Supply inert configuration before importing the service. No network is used.
process.env.JWT_SECRET = 'test';
process.env.SUPABASE_ANON_KEY = 'test';
for (const key of ['SUPABASE_URL', 'SOCIAL_SERVICE_URL', 'VOICE_SERVICE_URL',
  'WHATSAPP_SERVICE_URL', 'TELEGRAM_SERVICE_URL', 'CRM_BASE_URL']) {
  process.env[key] = 'http://localhost:1';
}

test('shared claim prevents concurrent dispatch and dispatch after a process restart', async () => {
  const { NotificationService } = await import('../src/services/notification.service.js');
  const service = NotificationService as any;
  const claims = new Set<string>();
  let sends = 0;
  service.processedRowIds = new Set();
  service.adminSupabase = {
    from: (table: string) => {
      assert.equal(table, 'notification_push_claims');
      return {
        insert: async ({ notification_id }: { notification_id: string }) => {
          if (claims.has(notification_id)) return { error: { code: '23505' } };
          claims.add(notification_id);
          return { error: null };
        },
      };
    },
  };
  service.sendToAllUsers = async () => { sends++; };
  // Avoid the local five-minute cache timer: the shared database must suffice.
  const originalTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
    const timer = originalTimeout(...args);
    timer.unref();
    return timer;
  }) as typeof setTimeout;
  try {
    const row = { id: 'broadcast-1', title: 'Announcement' };
    await Promise.all([service.processNotificationRow(row), service.processNotificationRow(row)]);
    assert.equal(sends, 1);
    service.processedRowIds.clear();
    await service.processNotificationRow(row);
    assert.equal(sends, 1);

    service.adminSupabase.from = () => ({ insert: async () => ({ error: { code: '42P01' } }) });
    await service.processNotificationRow({ id: 'unclaimed-row' });
    await service.processNotificationRow({ title: 'Missing id' });
    assert.equal(sends, 1, 'never send without a durable claim');
  } finally {
    globalThis.setTimeout = originalTimeout;
  }
});

test('registration rejects a profile update that matches no user', async () => {
  const { NotificationService } = await import('../src/services/notification.service.js');
  let savedProfile: { id: string } | null = null;
  const builder: any = {
    update: () => builder,
    eq: () => builder,
    neq: async () => ({ error: null }),
    select: () => builder,
    maybeSingle: async () => ({ data: savedProfile, error: null }),
  };
  (NotificationService as any).adminSupabase = { from: () => builder };
  const payload = { push_token: 'ExponentPushToken[test]' };
  await assert.rejects(NotificationService.registerUserPushToken('user-1', payload), /No profile found/);
  savedProfile = { id: 'user-1' };
  assert.equal((await NotificationService.registerUserPushToken('user-1', payload)).success, true);
});
