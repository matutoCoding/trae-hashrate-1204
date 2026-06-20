export type SecrecyLevel = 'public' | 'internal' | 'secret' | 'top-secret';

export type UserRole = 'requester' | 'approver' | 'admin';

export type NodeStatus = 'pending' | 'active' | 'approved' | 'rejected' | 'timeout' | 'escalated';

export type RequestStatus = 'draft' | 'checking' | 'approving' | 'approved' | 'rejected' | 'queuing' | 'completed';

export type QueueStatus = 'waiting' | 'calling' | 'processing' | 'completed' | 'passed' | 'invalid';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  clearanceLevel: SecrecyLevel;
  department: string;
  title?: string;
}

export interface ArchiveRequest {
  id: string;
  title: string;
  archiveNo: string;
  archiveName: string;
  secrecyLevel: SecrecyLevel;
  reason: string;
  borrowPeriod: string;
  userId: string;
  userName: string;
  userDepartment: string;
  userClearance: SecrecyLevel;
  status: RequestStatus;
  currentNode: number;
  createdAt: number;
  approvedAt?: number;
  rejectionReason?: string;
}

export interface ApprovalNode {
  id: string;
  requestId: string;
  nodeOrder: number;
  nodeName: string;
  approverId: string;
  approverName: string;
  approverTitle: string;
  status: NodeStatus;
  startedAt?: number;
  deadline?: number;
  handledAt?: number;
  opinion?: string;
  timeoutMinutes: number;
}

export interface ReminderLog {
  id: string;
  requestId: string;
  nodeId: string;
  escalationLevel: number;
  handlerId: string;
  handlerName: string;
  handlerTitle: string;
  triggeredAt: number;
  content: string;
  acknowledged: boolean;
  acknowledgedAt?: number;
}

export type AuditAction =
  | 'create_request'
  | 'check_clearance_pass'
  | 'check_clearance_fail'
  | 'node_start'
  | 'node_approve'
  | 'node_reject'
  | 'reminder_auto'
  | 'reminder_escalate'
  | 'reminder_acknowledge'
  | 'take_number'
  | 'call_number'
  | 'confirm_arrival'
  | 'complete_processing'
  | 'mark_overtime'
  | 'requeue';

export interface AuditLog {
  id: string;
  requestId: string;
  action: AuditAction;
  operatorId: string;
  operatorName: string;
  timestamp: number;
  detail: string;
  nodeOrder?: number;
  nodeName?: string;
}

export interface QueueNumber {
  id: string;
  requestId: string;
  numberCode: string;
  sequence: number;
  status: QueueStatus;
  userId: string;
  userName: string;
  overtimeCount: number;
  calledAt?: number;
  takenAt: number;
  completedAt?: number;
  windowNo?: number;
}

export interface OvertimeRecord {
  id: string;
  queueId: string;
  numberCode: string;
  userName: string;
  userId: string;
  count: number;
  status: 'requeued' | 'invalid';
  createdAt: number;
  remark: string;
  handledBy?: string;
}

export const SECRECY_LEVEL_MAP: Record<SecrecyLevel, { label: string; level: number; color: string; bgColor: string }> = {
  'public': { label: '公开', level: 0, color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  'internal': { label: '内部', level: 1, color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  'secret': { label: '秘密', level: 2, color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  'top-secret': { label: '绝密', level: 3, color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
};

export const REQUEST_STATUS_MAP: Record<RequestStatus, { label: string; color: string; bgColor: string }> = {
  'draft': { label: '草稿', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'checking': { label: '核验中', color: 'text-cyan-700', bgColor: 'bg-cyan-50' },
  'approving': { label: '审批中', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  'approved': { label: '审批通过', color: 'text-green-700', bgColor: 'bg-green-50' },
  'rejected': { label: '已驳回', color: 'text-red-700', bgColor: 'bg-red-50' },
  'queuing': { label: '排队中', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  'completed': { label: '已完成', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
};

export const NODE_STATUS_MAP: Record<NodeStatus, { label: string; color: string; dotColor: string }> = {
  'pending': { label: '待处理', color: 'text-slate-500', dotColor: 'bg-slate-400' },
  'active': { label: '处理中', color: 'text-blue-600', dotColor: 'bg-blue-500' },
  'approved': { label: '已通过', color: 'text-green-600', dotColor: 'bg-green-500' },
  'rejected': { label: '已驳回', color: 'text-red-600', dotColor: 'bg-red-500' },
  'timeout': { label: '已超时', color: 'text-orange-600', dotColor: 'bg-orange-500' },
  'escalated': { label: '已升级', color: 'text-red-700', dotColor: 'bg-red-600' },
};

export const QUEUE_STATUS_MAP: Record<QueueStatus, { label: string; color: string; bgColor: string }> = {
  'waiting': { label: '等待中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'calling': { label: '叫号中', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  'processing': { label: '办理中', color: 'text-green-700', bgColor: 'bg-green-50' },
  'completed': { label: '已办结', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  'passed': { label: '已过号', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  'invalid': { label: '已作废', color: 'text-red-700', bgColor: 'bg-red-50' },
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, { label: string; icon: string; color: string }> = {
  'create_request': { label: '发起调卷申请', icon: 'FileText', color: 'text-brand-600' },
  'check_clearance_pass': { label: '密级权限核验通过', icon: 'ShieldCheck', color: 'text-emerald-600' },
  'check_clearance_fail': { label: '密级权限核验未通过', icon: 'ShieldX', color: 'text-red-600' },
  'node_start': { label: '节点开始计时', icon: 'Timer', color: 'text-blue-600' },
  'node_approve': { label: '审批通过', icon: 'CheckCircle', color: 'text-emerald-600' },
  'node_reject': { label: '审批驳回', icon: 'XCircle', color: 'text-red-600' },
  'reminder_auto': { label: '自动催办提醒', icon: 'Bell', color: 'text-amber-600' },
  'reminder_escalate': { label: '催办升级', icon: 'ArrowUpRight', color: 'text-orange-600' },
  'reminder_acknowledge': { label: '催办签收', icon: 'BellRing', color: 'text-emerald-600' },
  'take_number': { label: '取号排队', icon: 'Ticket', color: 'text-purple-600' },
  'call_number': { label: '叫号', icon: 'Volume2', color: 'text-amber-600' },
  'confirm_arrival': { label: '确认到场', icon: 'UserCheck', color: 'text-emerald-600' },
  'complete_processing': { label: '办理完成', icon: 'CheckCircle2', color: 'text-emerald-700' },
  'mark_overtime': { label: '判定过号', icon: 'AlertTriangle', color: 'text-orange-600' },
  'requeue': { label: '重排队尾', icon: 'RotateCcw', color: 'text-blue-600' },
};
