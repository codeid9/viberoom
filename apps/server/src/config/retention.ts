export const RETENTION_CONFIG = {
  // Days to keep messages before automatic deletion
  MESSAGE_RETENTION_DAYS: parseInt(process.env.MESSAGE_RETENTION_DAYS || '30', 10),

  // Days of inactivity before a room and its messages are permanently deleted
  ROOM_RETENTION_DAYS: parseInt(process.env.ROOM_RETENTION_DAYS || '30', 10),

  // Interval in hours between automated cleanup cycles
  CLEANUP_INTERVAL_HOURS: parseInt(process.env.CLEANUP_INTERVAL_HOURS || '24', 10),
};