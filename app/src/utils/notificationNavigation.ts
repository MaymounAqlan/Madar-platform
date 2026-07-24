import type { NotificationItem } from '@/types/api.types';

function stringValue(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function internalPath(value: unknown): string {
  const path = stringValue(value);
  return path.startsWith('/') && !path.startsWith('//') ? path : '';
}

function withEntityId(path: string, key: string, value: string): string {
  if (!value || path.includes(`${key}=`)) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

export function getNotificationTarget(notification: NotificationItem, fallbackPath?: string | null): string | null {
  const data = notification.data ?? {};
  const jobId = stringValue(data.topJobId) || stringValue(data.jobId);
  const recommendationId = stringValue(data.recommendationId);
  const applicationId = stringValue(data.relatedEntityType) === 'application'
    ? stringValue(data.relatedEntityId)
    : stringValue(data.applicationId);
  let target = internalPath(notification.actionUrl) || internalPath(fallbackPath);

  if (notification.type === 'match') {
    target = target || '/student/recommendations';
    if (jobId) target = withEntityId(target, 'jobId', jobId);
    if (recommendationId) target = withEntityId(target, 'recommendationId', recommendationId);
    return target;
  }

  if (applicationId && target?.includes('/applications')) {
    return withEntityId(target, 'applicationId', applicationId);
  }

  if (jobId) {
    target = target || '/student/jobs';
    return withEntityId(target, 'jobId', jobId);
  }

  return target || null;
}
