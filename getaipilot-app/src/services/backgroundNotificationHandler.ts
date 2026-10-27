// Safely load expo-notifications without crashing if native module is absent (e.g. Expo Go / unlinked build)
let Notifications: typeof import('expo-notifications') | undefined;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = undefined;
}

// ------------------------------------------------------------------
// 1. Foreground handler
//
// Expo uses this handler to decide presentation while the app is foregrounded.
// Keep foreground alerts enabled; suppressing them would hide valid pushes
// without preventing duplicate sends from independent backend processes.
// ------------------------------------------------------------------
if (Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        // Allow Expo to present the notification while the app is foregrounded.
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  } catch (handlerErr) {
    console.warn('[BackgroundNotificationHandler] setNotificationHandler error:', handlerErr);
  }
}

// ------------------------------------------------------------------
// 2. Optional headless background task
//
// This log-only task is defined but not registered because the app currently
// needs no headless notification processing. Task registration alone does not
// demonstrate duplicate presentation; any future task must avoid scheduling a
// second local notification for a push already presented by the system.
// ------------------------------------------------------------------
export const BACKGROUND_NOTIFICATION_TASK = 'GETAIPILOT_BACKGROUND_NOTIFICATION_TASK';

try {
  const TaskManager = require('expo-task-manager');
  if (TaskManager?.defineTask && !TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: any) => {
      if (error) {
        console.error('[BackgroundNotificationTask] Task error:', error);
        return;
      }
      console.log('[BackgroundNotificationTask] Background payload (log only):', data);
    });
  }
  // 🚫 Do NOT call Notifications.registerTaskAsync here.
} catch {
  // expo-task-manager native module is not present in the current build.
  // Standard notifications still display via FCM + system channels.
}
