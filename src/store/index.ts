import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ArchiveRequest,
  ApprovalNode,
  ReminderLog,
  QueueNumber,
  OvertimeRecord,
  AuditLog,
  AuditAction,
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
  mockAuditLogs,
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
  auditLogs: AuditLog[];
  nextSequence: number;

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

  acknowledgeReminder: (reminderId: string) => void;
  triggerEscalation: (nodeId: string) => void;
  checkAndAutoRemind: () => void;

  takeNumber: (requestId: string, userId: string, userName: string) => { success: boolean; numberCode?: string; message: string };
  callNextNumber: (windowNo: number) => QueueNumber | null;
  recallNumber: (queueId: string) => void;
  confirmProcessing: (queueId: string) => void;
  completeProcessing: (queueId: string) => void;
  markOvertime: (queueId: string) => { status: 'requeued' | 'invalid'; count: number };
  requeueNumber: (queueId: string, handledBy: string) => QueueNumber;

  setCurrentUser: (userId: string) => void;
  resetData: () => void;
}

function addLog(
  state: { auditLogs: AuditLog[] },
  requestId: string,
  action: AuditAction,
  operatorId: string,
  operatorName: string,
  detail: string,
  nodeOrder?: number,
  nodeName?: string
): AuditLog[] {
  const log: AuditLog = {
    id: generateId('a'),
    requestId,
    action,
    operatorId,
    operatorName,
    timestamp: Date.now(),
    detail,
    nodeOrder,
    nodeName,
  };
  return [...state.auditLogs, log];
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
      auditLogs: mockAuditLogs,
      nextSequence: mockNextSequence,

      createRequest: (data) => {
        const user = mockUsers.find((u) => u.id === data.userId);
        if (!user) {
          return { success: false, message: '用户不存在' };
        }

        const clearance = checkClearance(user.clearanceLevel, data.secrecyLevel);
        if (!clearance.pass) {
          const now = Date.now();
          const requestId = generateId('r');
          const failedRequest: ArchiveRequest = {
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
            status: 'rejected',
            currentNode: 0,
            createdAt: now,
            rejectionReason: clearance.reason,
          };
          set((state) => ({
            archiveRequests: [...state.archiveRequests, failedRequest],
            auditLogs: addLog(state, requestId, 'create_request', user.id, user.name, `${user.name}（${user.department}）发起调卷申请：${data.title}`)
              .concat(addLog({ auditLogs: [] }, requestId, 'check_clearance_fail', user.id, '系统', clearance.reason || '权限不足')[0] ? [{ ...addLog({ auditLogs: [] }, requestId, 'check_clearance_fail', user.id, '系统', clearance.reason || '权限不足')[0] }] : []),
          }));
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
          status: idx === 0 ? 'active' as NodeStatus : 'pending' as NodeStatus,
          startedAt: idx === 0 ? now : undefined,
          deadline: idx === 0 ? now + config.timeoutMinutes * 60 * 1000 : undefined,
          timeoutMinutes: config.timeoutMinutes,
        }));

        set((state) => {
          let logs = addLog(state, requestId, 'create_request', user.id, user.name, `${user.name}（${user.department}）发起调卷申请：${data.title}`);
          logs = addLog({ auditLogs: logs }, requestId, 'check_clearance_pass', user.id, '系统', `用户权限等级（${user.clearanceLevel}）≥ 档案密级（${data.secrecyLevel}），核验通过`);
          logs = addLog({ auditLogs: logs }, requestId, 'node_start', newNodes[0].approverId, '系统', `节点1"${newNodes[0].nodeName}"开始计时，超时时限${newNodes[0].timeoutMinutes}分钟`, 1, newNodes[0].nodeName);
          return {
            archiveRequests: [...state.archiveRequests, newRequest],
            approvalNodes: [...state.approvalNodes, ...newNodes],
            auditLogs: logs,
          };
        });

        return { success: true, message: '调卷申请已提交，进入审批流程', requestId };
      },

      approveNode: (requestId, nodeOrder, opinion) => {
        const now = Date.now();
        const state = get();
        const request = state.archiveRequests.find((r) => r.id === requestId);
        if (!request) return;

        const node = state.approvalNodes.find((n) => n.requestId === requestId && n.nodeOrder === nodeOrder);
        if (!node) return;

        const totalNodes = state.approvalNodes.filter((n) => n.requestId === requestId).length;
        const isLastNode = nodeOrder >= totalNodes;

        set((state) => {
          let logs = addLog(state, requestId, 'node_approve', node.approverId, node.approverName, `${node.approverName}（${node.approverTitle}）通过节点${nodeOrder}"${node.nodeName}"${opinion ? `，意见：${opinion}` : ''}`, nodeOrder, node.nodeName);

          const updatedNodes = state.approvalNodes.map((n) => {
            if (n.requestId === requestId && n.nodeOrder === nodeOrder) {
              return { ...n, status: 'approved' as NodeStatus, handledAt: now, opinion };
            }
            if (!isLastNode && n.requestId === requestId && n.nodeOrder === nodeOrder + 1) {
              return { ...n, status: 'active' as NodeStatus, startedAt: now, deadline: now + n.timeoutMinutes * 60 * 1000 };
            }
            return n;
          });

          if (!isLastNode) {
            const nextNode = state.approvalNodes.find((n) => n.requestId === requestId && n.nodeOrder === nodeOrder + 1);
            if (nextNode) {
              logs = addLog({ auditLogs: logs }, requestId, 'node_start', nextNode.approverId, '系统', `节点${nodeOrder + 1}"${nextNode.nodeName}"开始计时，超时时限${nextNode.timeoutMinutes}分钟`, nodeOrder + 1, nextNode.nodeName);
            }
          }

          return {
            approvalNodes: updatedNodes,
            archiveRequests: state.archiveRequests.map((r) => {
              if (r.id !== requestId) return r;
              if (isLastNode) {
                return { ...r, status: 'approved' as RequestStatus, currentNode: nodeOrder, approvedAt: now };
              }
              return { ...r, currentNode: nodeOrder + 1 };
            }),
            auditLogs: logs,
          };
        });
      },

      rejectNode: (requestId, nodeOrder, opinion) => {
        const now = Date.now();
        const state = get();
        const node = state.approvalNodes.find((n) => n.requestId === requestId && n.nodeOrder === nodeOrder);
        if (!node) return;

        set((state) => {
          const logs = addLog(state, requestId, 'node_reject', node.approverId, node.approverName, `${node.approverName}（${node.approverTitle}）驳回节点${nodeOrder}"${node.nodeName}"，理由：${opinion}`, nodeOrder, node.nodeName);
          return {
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
            auditLogs: logs,
          };
        });
      },

      acknowledgeReminder: (reminderId) => {
        const now = Date.now();
        const state = get();
        const reminder = state.reminderLogs.find((r) => r.id === reminderId);
        if (!reminder) return;

        const node = state.approvalNodes.find((n) => n.id === reminder.nodeId);

        set((state) => {
          const logs = addLog(state, reminder.requestId, 'reminder_acknowledge', reminder.handlerId, reminder.handlerName, `${reminder.handlerName}签收了Lv.${reminder.escalationLevel}催办${reminder.escalationLevel > 1 ? '升级' : ''}通知`, node?.nodeOrder, node?.nodeName);
          return {
            reminderLogs: state.reminderLogs.map((r) =>
              r.id === reminderId ? { ...r, acknowledged: true, acknowledgedAt: now } : r
            ),
            auditLogs: logs,
          };
        });
      },

      triggerEscalation: (nodeId) => {
        const state = get();
        const node = state.approvalNodes.find((n) => n.id === nodeId);
        if (!node) return;

        const request = state.archiveRequests.find((r) => r.id === node.requestId);
        if (!request || request.currentNode !== node.nodeOrder) return;

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

        set((state) => {
          const actionType: AuditAction = nextLevel === 1 ? 'reminder_auto' : 'reminder_escalate';
          const logs = addLog(state, node.requestId, actionType, handler.handlerId, '系统',
            nextLevel === 1
              ? `节点${node.nodeOrder}"${node.nodeName}"已超时，自动生成催办提醒（Lv.${nextLevel}），责任人：${handler.handlerName}（${handler.handlerTitle}）`
              : `节点${node.nodeOrder}持续超时，催办升级至Lv.${nextLevel}，责任人：${handler.handlerName}（${handler.handlerTitle}）`,
            node.nodeOrder, node.nodeName
          );
          return {
            reminderLogs: [...state.reminderLogs, newReminder],
            approvalNodes: state.approvalNodes.map((n) =>
              n.id === nodeId ? { ...n, status: nextLevel >= 2 ? 'escalated' : 'timeout' } : n
            ),
            auditLogs: logs,
          };
        });
      },

      checkAndAutoRemind: () => {
        const state = get();
        const now = Date.now();

        state.approvalNodes.forEach((node) => {
          if (node.status !== 'active' && node.status !== 'timeout' && node.status !== 'escalated') return;

          const request = state.archiveRequests.find((r) => r.id === node.requestId);
          if (!request || request.currentNode !== node.nodeOrder) return;

          if (!node.deadline || now < node.deadline) return;

          const existingReminders = state.reminderLogs.filter((r) => r.nodeId === node.id);
          const escalationLevel = existingReminders.length;

          if (escalationLevel === 0) {
            get().triggerEscalation(node.id);
          } else {
            const lastReminder = existingReminders[existingReminders.length - 1];
            const escalateInterval = escalationLevel === 1 ? 30 * 60 * 1000 : 15 * 60 * 1000;
            if (lastReminder && !lastReminder.acknowledged && now - lastReminder.triggeredAt >= escalateInterval) {
              if (escalationLevel < 3) {
                get().triggerEscalation(node.id);
              }
            } else if (lastReminder && lastReminder.acknowledged && now - (lastReminder.acknowledgedAt || lastReminder.triggeredAt) >= escalateInterval) {
              if (escalationLevel < 3) {
                get().triggerEscalation(node.id);
              }
            }
          }
        });
      },

      takeNumber: (requestId, userId, userName) => {
        const state = get();
        const request = state.archiveRequests.find((r) => r.id === requestId);
        if (request && request.status !== 'approved' && request.status !== 'queuing') {
          return { success: false, message: '审批未通过，无法取号' };
        }

        const existingQueue = state.queueNumbers.find(
          (q) => q.requestId === requestId && (q.status === 'waiting' || q.status === 'calling' || q.status === 'processing')
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

        set((state) => {
          const logs = addLog(state, requestId, 'take_number', userId, userName, `${userName}取号排队，号码 ${numberCode}`);
          return {
            nextSequence: nextSeq + 1,
            queueNumbers: [...state.queueNumbers, newQueue],
            archiveRequests: state.archiveRequests.map((r) =>
              r.id === requestId ? { ...r, status: 'queuing' as RequestStatus } : r
            ),
            auditLogs: logs,
          };
        });

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

        set((state) => {
          const logs = addLog(state, next.requestId, 'call_number', 'u007', '周管理', `叫号 ${next.numberCode}，窗口${windowNo}`);
          return {
            queueNumbers: state.queueNumbers.map((q) =>
              q.id === next.id ? { ...q, status: 'calling' as QueueStatus, calledAt: now, windowNo } : q
            ),
            auditLogs: logs,
          };
        });

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
        const state = get();
        const queue = state.queueNumbers.find((q) => q.id === queueId);
        if (!queue) return;

        set((state) => {
          const logs = addLog(state, queue.requestId, 'confirm_arrival', queue.userId, queue.userName, `${queue.userName}确认到场，号码 ${queue.numberCode} 开始办理`);
          return {
            queueNumbers: state.queueNumbers.map((q) =>
              q.id === queueId ? { ...q, status: 'processing' as QueueStatus } : q
            ),
            auditLogs: logs,
          };
        });
      },

      completeProcessing: (queueId) => {
        const state = get();
        const queue = state.queueNumbers.find((q) => q.id === queueId);
        if (!queue) return;

        const now = Date.now();

        set((state) => {
          let logs = addLog(state, queue.requestId, 'complete_processing', 'u007', '周管理', `号码 ${queue.numberCode} 办理完成`);

          if (queue.requestId) {
            logs = addLog({ auditLogs: logs }, queue.requestId, 'complete_processing', 'u007', '周管理', `调卷业务办理完成，申请单号 ${queue.requestId}`);
          }

          return {
            queueNumbers: state.queueNumbers.map((q) =>
              q.id === queueId ? { ...q, status: 'completed' as QueueStatus, completedAt: now } : q
            ),
            archiveRequests: state.archiveRequests.map((r) =>
              r.id === queue.requestId ? { ...r, status: 'completed' as RequestStatus } : r
            ),
            auditLogs: logs,
          };
        });
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

        set((state) => {
          const logs = addLog(state, queue.requestId, 'mark_overtime', 'u007', '周管理', `号码 ${queue.numberCode} 第${newCount}次过号${isInvalid ? '，已作废' : ''}`);
          return {
            queueNumbers: state.queueNumbers.map((q) =>
              q.id === queueId
                ? isInvalid
                  ? { ...q, status: 'invalid' as QueueStatus, overtimeCount: newCount }
                  : { ...q, overtimeCount: newCount }
                : q
            ),
            overtimeRecords: [...state.overtimeRecords, record],
            auditLogs: logs,
          };
        });

        return { status: isInvalid ? 'invalid' : 'requeued', count: newCount };
      },

      requeueNumber: (queueId, handledBy) => {
        const state = get();
        const queue = state.queueNumbers.find((q) => q.id === queueId);
        if (!queue) return queue as unknown as QueueNumber;

        const maxSequence = Math.max(...state.queueNumbers.map((q) => q.sequence));
        const newSequence = maxSequence + 1;

        set((state) => {
          const logs = addLog(state, queue.requestId, 'requeue', handledBy, handledBy, `号码 ${queue.numberCode} 重新排至队尾，新序号 ${newSequence}`);
          return {
            queueNumbers: state.queueNumbers.map((q) =>
              q.id === queueId
                ? { ...q, status: 'waiting' as QueueStatus, sequence: newSequence, calledAt: undefined, windowNo: undefined }
                : q
            ),
            overtimeRecords: state.overtimeRecords.map((o) =>
              o.queueId === queueId && !o.handledBy ? { ...o, handledBy } : o
            ),
            auditLogs: logs,
          };
        });

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
          auditLogs: mockAuditLogs,
          nextSequence: mockNextSequence,
        });
      },
    }),
    {
      name: 'archive-approval-system',
    }
  )
);
