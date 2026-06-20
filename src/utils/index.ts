import { SECRECY_LEVEL_MAP, type SecrecyLevel, type RequestStatus, type ReminderHandlerType } from '@/types';

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (diff < 0) {
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  } else {
    if (minutes < 1) return '即将到期';
    if (minutes < 60) return `剩余${minutes}分钟`;
    if (hours < 24) return `剩余${hours}小时${minutes % 60}分`;
    return `剩余${days}天`;
  }
}

export function formatCountdown(deadline: number): { text: string; isOverdue: boolean; isWarning: boolean } {
  const diff = deadline - Date.now();
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);
  const totalSeconds = Math.floor(absDiff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const text = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const isWarning = !isOverdue && diff < 1000 * 60 * 10;
  return { text, isOverdue, isWarning };
}

export function checkClearance(userClearance: SecrecyLevel, archiveSecrecy: SecrecyLevel): { pass: boolean; reason?: string } {
  const userLevel = SECRECY_LEVEL_MAP[userClearance].level;
  const archiveLevel = SECRECY_LEVEL_MAP[archiveSecrecy].level;
  if (userLevel >= archiveLevel) {
    return { pass: true };
  }
  return {
    pass: false,
    reason: `用户权限等级（${SECRECY_LEVEL_MAP[userClearance].label}）低于档案密级（${SECRECY_LEVEL_MAP[archiveSecrecy].label}），无权调阅`,
  };
}

export function generateId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function generateQueueNumber(sequence: number): string {
  return `A${String(sequence).padStart(3, '0')}`;
}

export function getApprovalNodesBySecrecy(secrecy: SecrecyLevel): Array<{
  nodeOrder: number;
  nodeName: string;
  approverId: string;
  approverName: string;
  approverTitle: string;
  timeoutMinutes: number;
}> {
  const level = SECRECY_LEVEL_MAP[secrecy].level;
  if (level <= 0) {
    return [
      { nodeOrder: 1, nodeName: '档案科登记', approverId: 'u004', approverName: '赵科长', approverTitle: '档案科科长', timeoutMinutes: 15 },
    ];
  }
  if (level === 1) {
    return [
      { nodeOrder: 1, nodeName: '档案科初审', approverId: 'u004', approverName: '赵科长', approverTitle: '档案科科长', timeoutMinutes: 30 },
      { nodeOrder: 2, nodeName: '办公室复核', approverId: 'u005', approverName: '钱处长', approverTitle: '办公室副主任', timeoutMinutes: 45 },
    ];
  }
  if (level === 2) {
    return [
      { nodeOrder: 1, nodeName: '档案科初审', approverId: 'u004', approverName: '赵科长', approverTitle: '档案科科长', timeoutMinutes: 30 },
      { nodeOrder: 2, nodeName: '办公室复审', approverId: 'u005', approverName: '钱处长', approverTitle: '办公室副主任', timeoutMinutes: 60 },
    ];
  }
  return [
    { nodeOrder: 1, nodeName: '档案科初审', approverId: 'u004', approverName: '赵科长', approverTitle: '档案科科长', timeoutMinutes: 30 },
    { nodeOrder: 2, nodeName: '局领导审批', approverId: 'u006', approverName: '孙局长', approverTitle: '分管副局长', timeoutMinutes: 60 },
    { nodeOrder: 3, nodeName: '机要处登记', approverId: 'u003', approverName: '王五', approverTitle: '机要员', timeoutMinutes: 20 },
  ];
}

export function getEscalationHandler(
  level: number,
  nodeApprover?: { approverId: string; approverName: string; approverTitle: string }
): { handlerType: ReminderHandlerType; handlerId: string; handlerName: string; handlerTitle: string } {
  if (level === 1 && nodeApprover) {
    return {
      handlerType: 'self',
      handlerId: nodeApprover.approverId,
      handlerName: nodeApprover.approverName,
      handlerTitle: nodeApprover.approverTitle,
    };
  }
  if (level === 2) {
    return { handlerType: 'supervisor', handlerId: 'u005', handlerName: '钱处长', handlerTitle: '办公室副主任' };
  }
  return { handlerType: 'director', handlerId: 'u006', handlerName: '孙局长', handlerTitle: '分管副局长' };
}

export const REMINDER_HANDLER_TYPE_LABEL: Record<ReminderHandlerType, { label: string; color: string; bgColor: string }> = {
  self: { label: '提醒本人', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200' },
  supervisor: { label: '上级督办', color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-200' },
  director: { label: '领导督办', color: 'text-red-700', bgColor: 'bg-red-100 border-red-200' },
};

export const REQUEST_STATUS_FILTERS: Array<{ key: RequestStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'checking', label: '核验中' },
  { key: 'approving', label: '审批中' },
  { key: 'approved', label: '审批通过' },
  { key: 'queuing', label: '排队中' },
  { key: 'rejected', label: '已驳回' },
  { key: 'completed', label: '已完成' },
];
