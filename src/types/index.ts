export type SecrecyLevel = 'public' | 'internal' | 'secret' | 'top-secret';

export type UserRole = 'requester' | 'approver' | 'admin';

export type NodeStatus = 'pending' | 'approved' | 'rejected' | 'timeout' | 'escalated';

export type RequestStatus = 'draft' | 'checking' | 'approving' | 'approved' | 'rejected' | 'queuing' | 'completed';

export type QueueStatus = 'waiting' | 'calling' | 'processing' | 'passed' | 'invalid';

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
  deadline: number;
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
  'completed': { label: '已完成', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const NODE_STATUS_MAP: Record<NodeStatus, { label: string; color: string; dotColor: string }> = {
  'pending': { label: '待处理', color: 'text-slate-500', dotColor: 'bg-slate-400' },
  'approved': { label: '已通过', color: 'text-green-600', dotColor: 'bg-green-500' },
  'rejected': { label: '已驳回', color: 'text-red-600', dotColor: 'bg-red-500' },
  'timeout': { label: '已超时', color: 'text-orange-600', dotColor: 'bg-orange-500' },
  'escalated': { label: '已升级', color: 'text-red-700', dotColor: 'bg-red-600' },
};

export const QUEUE_STATUS_MAP: Record<QueueStatus, { label: string; color: string; bgColor: string }> = {
  'waiting': { label: '等待中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'calling': { label: '叫号中', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  'processing': { label: '办理中', color: 'text-green-700', bgColor: 'bg-green-50' },
  'passed': { label: '已过号', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  'invalid': { label: '已作废', color: 'text-red-700', bgColor: 'bg-red-50' },
};
