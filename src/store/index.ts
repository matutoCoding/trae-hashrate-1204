import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ArchiveRequest,
  ApprovalNode,
  ReminderLog,
  QueueNumber,
  OvertimeRecord,
  RequestStatus,
  NodeStatus,
  SecrecyLevel,
  QueueStatus,
} from '@/types';
import {
  mockArchiveRequests,
  mockApprovalNodes,
  mockReminderLogs,
  mockQueueNumbers,
  mockOvertimeRecords,
  mockNextSequence,
  mockUsers,
} from '@/data/mockData';
import {
  checkClearance,
  generateId,
  getApprovalNodesBySecrecy,
  getEscalationHandler,
  generateQueueNumber,
} from '@/utils';

interface AppState {
  currentUserId: string;
  archiveRequests: ArchiveRequest[];
  approvalNodes: ApprovalNode[];
  reminderLogs: ReminderLog[];
  queueNumbers: QueueNumber[];
  overtimeRecords: OvertimeRecord[];
  nextSequence: number;

  // Actions - 调卷审批
  createRequest: (data: {
    title: string;
    archiveNo: string;
    archiveName: string;
    secrecyLevel: SecrecyLevel;
    reason: string;
    borrowPeriod: string;
    userId: string;
  }) => { success: boolean; message: string; requestId?: string };

  approveNode: (requestId: string, nodeOrder: number, opinion: string) => void;
  rejectNode: (requestId: string, nodeOrder: number, opinion: string) => void;

  // Actions - 催办
  acknowledgeReminder: (reminderId: string) => void;
  triggerEscalation: (nodeId: string) => void;

  // Actions - 队列
  takeNumber: (requestId: string, userId: string, userName: string) => { success: boolean; numberCode?: string; message: string };
  callNextNumber: (windowNo: number) => QueueNumber | null;
  recallNumber: (queueId: string) => void;
  confirmProcessing: (queueId: string) => void;
  markOvertime: (queueId: string) => { status: 'requeued' | 'invalid'; count: number };
  requeueNumber: (queueId: string, handledBy: string) => QueueNumber;

  // Actions - 设置用户
  setCurrentUser: (userId: string) => void;

  // Actions - 重置数据
  resetData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUserId: 'u004',
      archiveRequests: mockArchiveRequests,
      approvalNodes: mockApprovalNodes,
      reminderLogs: mockReminderLogs,
      queueNumbers: mockQueueNumbers,
      overtimeRecords: mockOvertimeRecords,
      nextSequence: mockNextSequence,

      createRequest: (data) => {
        const user = mockUsers.find((u) => u.id === data.userId);
        if (!user) {
          return { success: false, message: '用户不存在' };
        }

        const clearance = checkClearance(user.clearanceLevel, data.secrecyLevel);
        if (!clearance.pass) {
          return { success: false, message: clearance.reason || '权限不足' };
        }

        const requestId = generateId('r');
        const now = Date.now();

        const newRequest: ArchiveRequest = {
          id: requestId,
          title: data.title,
          archiveNo: data.archiveNo,
          archiveName: data.archiveName,
          secrecyLevel: data.secrecyLevel,
          reason: data.reason,
          borrowPeriod: data.borrowPeriod,
          userId: data.userId,
          userName: user.name,
          userDepartment: user.department,
          userClearance: user.clearanceLevel,
          status: 'approving',
          currentNode: 1,
          createdAt: now,
        };

        const nodeConfigs = getApprovalNodesBySecrecy(data.secrecyLevel);
        const newNodes: ApprovalNode[] = nodeConfigs.map((config, idx) => ({
          id: generateId('n'),
          requestId,
          nodeOrder: config.nodeOrder,
          nodeName: config.nodeName,
          approverId: config.approverId,
          approverName: config.approverName,
          approverTitle: config.approverTitle,
          status: idx === 0 ? 'pending' : 'pending',
          deadline: now + config.timeoutMinutes * 60 * 1000,
          timeoutMinutes: config.timeoutMinutes,
        }));

        set((state) => ({
          archiveRequests: [...state.archiveRequests, newRequest],
          approvalNodes: [...state.approvalNodes, ...newNodes],
        }));

        return { success: true, message: '调卷申请已提交，进入审批流程', requestId };
      },

      approveNode: (requestId, nodeOrder, opinion) => {
        const now = Date.now();
        const state = get();
        const request = state.archiveRequests.find((r) => r.id === requestId);
        if (!request) return;

        const totalNodes = state.approvalNodes.filter((n) => n.requestId === requestId).length;
        const isLastNode = nodeOrder >= totalNodes;

        set((state) => ({
          approvalNodes: state.approvalNodes.map((n) => {
            if (n.requestId === requestId && n.nodeOrder === nodeOrder) {
              return { ...n, status: 'approved' as NodeStatus, handledAt: now, opinion };
            }
            return n;
          }),
          archiveRequests: state.archiveRequests.map((r) => {
            if (r.id !== requestId) return r;
            if (isLastNode) {
              return { ...r, status: 'approved' as RequestStatus, currentNode: nodeOrder, approvedAt: now };
            }
            return { ...r, currentNode: nodeOrder + 1 };
          }),
        }));

        if (!isLastNode) {
          const nextNode = get().approvalNodes.find(
            (n) => n.requestId === requestId && n.nodeOrder === nodeOrder + 1
          );
          if (nextNode) {
            set((state) => ({
              approvalNodes: state.approvalNodes.map((n) => {
                if (n.id === nextNode.id) {
                  return { ...n, deadline: now + n.timeoutMinutes * 60 * 1000 };
                }
                return n;
              }),
            }));
          }
        }
      },

      rejectNode: (requestId, nodeOrder, opinion) => {
        const now = Date.now();
        set((state) => ({
          approvalNodes: state.approvalNodes.map((n) => {
            if (n.requestId === requestId && n.nodeOrder === nodeOrder) {
              return { ...n, status: 'rejected' as NodeStatus, handledAt: now, opinion };
            }
            return n;
          }),
          archiveRequests: state.archiveRequests.map((r) => {
            if (r.id !== requestId) return r;
            return { ...r, status: 'rejected' as RequestStatus, rejectionReason: opinion };
          }),
        }));
      },

      acknowledgeReminder: (reminderId) => {
        const now = Date.now();
        set((state) => ({
          reminderLogs: state.reminderLogs.map((r) =>
            r.id === reminderId ? { ...r, acknowledged: true, acknowledgedAt: now } : r
          ),
        }));
      },

      triggerEscalation: (nodeId) => {
        const state = get();
        const node = state.approvalNodes.find((n) => n.id === nodeId);
        if (!node) return;

        const existingEscalations = state.reminderLogs.filter(
          (r) => r.nodeId === nodeId
        );
        const nextLevel = existingEscalations.length + 1;
        if (nextLevel > 3) return;

        const handler = getEscalationHandler(nextLevel);

        const newReminder: ReminderLog = {
          id: generateId('m'),
          requestId: node.requestId,
          nodeId,
          escalationLevel: nextLevel,
          handlerId: handler.handlerId,
          handlerName: handler.handlerName,
          handlerTitle: handler.handlerTitle,
          triggeredAt: Date.now(),
          content:
            nextLevel === 1
              ? `【超时提醒】审批节点"${node.nodeName}"已到时限，请${handler.handlerName}（${handler.handlerTitle}）及时处理。`
              : nextLevel === 2
              ? `【升级催办】${node.approverName}超时未处理，已升级至${handler.handlerName}（${handler.handlerTitle}）督办。`
              : `【紧急督办】连续升级两次仍未处理，请${handler.handlerName}（${handler.handlerTitle}）立即处理并报备。`,
          acknowledged: false,
        };

        set((state) => ({
          reminderLogs: [...state.reminderLogs, newReminder],
          approvalNodes: state.approvalNodes.map((n) =>
            n.id === nodeId ? { ...n, status: nextLevel >= 2 ? 'escalated' : 'timeout' } : n
          ),
        }));
      },

      takeNumber: (requestId, userId, userName) => {
        const state = get();
        const request = state.archiveRequests.find((r) => r.id === requestId);
        if (request && request.status !== 'approved' && request.status !== 'queuing') {
          return { success: false, message: '审批未通过，无法取号' };
        }

        const existingQueue = state.queueNumbers.find(
          (q) => q.requestId === requestId && (q.status === 'waiting' || q.status === 'calling')
        );
        if (existingQueue) {
          return { success: false, message: `已有排队号码 ${existingQueue.numberCode}，请勿重复取号` };
        }

        const nextSeq = state.nextSequence;
        const numberCode = generateQueueNumber(nextSeq);

        const newQueue: QueueNumber = {
          id: generateId('q'),
          requestId,
          numberCode,
          sequence: nextSeq,
          status: 'waiting',
          userId,
          userName,
          overtimeCount: 0,
          takenAt: Date.now(),
        };

        set((state) => ({
          nextSequence: nextSeq + 1,
          queueNumbers: [...state.queueNumbers, newQueue],
          archiveRequests: state.archiveRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'queuing' as RequestStatus } : r
          ),
        }));

        return { success: true, numberCode, message: '取号成功' };
      },

      callNextNumber: (windowNo) => {
        const state = get();
        const calling = state.queueNumbers.find((q) => q.status === 'calling');
        if (calling) {
          return null;
        }

        const waiting = [...state.queueNumbers]
          .filter((q) => q.status === 'waiting')
          .sort((a, b) => a.sequence - b.sequence);

        if (waiting.length === 0) {
          return null;
        }

        const next = waiting[0];
        const now = Date.now();

        set((state) => ({
          queueNumbers: state.queueNumbers.map((q) =>
            q.id === next.id ? { ...q, status: 'calling' as QueueStatus, calledAt: now, windowNo } : q
          ),
        }));

        return { ...next, status: 'calling' as QueueStatus, calledAt: now, windowNo };
      },

      recallNumber: (queueId) => {
        set((state) => ({
          queueNumbers: state.queueNumbers.map((q) =>
            q.id === queueId
              ? { ...q, status: 'calling' as QueueStatus, calledAt: Date.now() }
              : q
          ),
        }));
      },

      confirmProcessing: (queueId) => {
        set((state) => ({
          queueNumbers: state.queueNumbers.map((q) =>
            q.id === queueId ? { ...q, status: 'processing' as QueueStatus } : q
          ),
        }));
      },

      markOvertime: (queueId) => {
        const state = get();
        const queue = state.queueNumbers.find((q) => q.id === queueId);
        if (!queue) return { status: 'requeued', count: 0 };

        const newCount = queue.overtimeCount + 1;
        const isInvalid = newCount >= 3;

        const record: OvertimeRecord = {
          id: generateId('o'),
          queueId,
          numberCode: queue.numberCode,
          userName: queue.userName,
          userId: queue.userId,
          count: newCount,
          status: isInvalid ? 'invalid' : 'requeued',
          createdAt: Date.now(),
          remark: isInvalid
            ? `连续${newCount}次过号，号码已自动作废，请重新取号`
            : `第${newCount}次过号，${isInvalid ? '已作废' : '重新排至队尾'}`,
        };

        set((state) => ({
          queueNumbers: state.queueNumbers.map((q) =>
            q.id === queueId
              ? isInvalid
                ? { ...q, status: 'invalid' as QueueStatus, overtimeCount: newCount }
                : { ...q, overtimeCount: newCount }
              : q
          ),
          overtimeRecords: [...state.overtimeRecords, record],
        }));

        return { status: isInvalid ? 'invalid' : 'requeued', count: newCount };
      },

      requeueNumber: (queueId, handledBy) => {
        const state = get();
        const queue = state.queueNumbers.find((q) => q.id === queueId);
        if (!queue) return queue as unknown as QueueNumber;

        const maxSequence = Math.max(...state.queueNumbers.map((q) => q.sequence));
        const newSequence = maxSequence + 1;

        set((state) => ({
          queueNumbers: state.queueNumbers.map((q) =>
            q.id === queueId
              ? { ...q, status: 'waiting' as QueueStatus, sequence: newSequence, calledAt: undefined, windowNo: undefined }
              : q
          ),
          overtimeRecords: state.overtimeRecords.map((o) =>
            o.queueId === queueId && !o.handledBy ? { ...o, handledBy } : o
          ),
        }));

        return {
          ...queue,
          status: 'waiting' as QueueStatus,
          sequence: newSequence,
        };
      },

      setCurrentUser: (userId) => set({ currentUserId: userId }),

      resetData: () => {
        set({
          archiveRequests: mockArchiveRequests,
          approvalNodes: mockApprovalNodes,
          reminderLogs: mockReminderLogs,
          queueNumbers: mockQueueNumbers,
          overtimeRecords: mockOvertimeRecords,
          nextSequence: mockNextSequence,
        });
      },
    }),
    {
      name: 'archive-approval-system',
    }
  )
);
