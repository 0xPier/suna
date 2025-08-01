import { flag } from 'flags/next';
import { getAll } from '@vercel/edge-config';

export type IMaintenanceNotice =
  | {
      enabled: true;
      startTime: Date;
      endTime: Date;
    }
  | {
      enabled: false;
      startTime?: undefined;
      endTime?: undefined;
    };

export const maintenanceNoticeFlag = flag({
  key: 'maintenance-notice',
  async decide() {
    try {
      if (!process.env.EDGE_CONFIG) {
        console.log('🔍 Edge config is not set, maintenance notice disabled');
        return { enabled: false } as const;
      }

      const flags = await getAll([
        'maintenance-notice_start-time',
        'maintenance-notice_end-time',
        'maintenance-notice_enabled',
      ]);

      if (!flags['maintenance-notice_enabled']) {
        console.log('🔍 Maintenance notice is disabled in edge config');
        return { enabled: false } as const;
      }

      const startTime = new Date(flags['maintenance-notice_start-time']);
      const endTime = new Date(flags['maintenance-notice_end-time']);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('🔍 Invalid maintenance notice start or end time');
        throw new Error(
          `Invalid maintenance notice start or end time: ${flags['maintenance-notice_start-time']} or ${flags['maintenance-notice_end-time']}`,
        );
      }

      console.log('🔍 Maintenance notice is enabled:', { startTime, endTime });
      return {
        enabled: true,
        startTime,
        endTime,
      } as const;
    } catch (cause) {
      console.error(
        new Error('Failed to get maintenance notice flag', { cause }),
      );
      return { enabled: false } as const;
    }
  },
});
