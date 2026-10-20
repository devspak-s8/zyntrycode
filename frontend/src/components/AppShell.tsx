import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AgentState,
  WorkspaceMode,
  RoutingMode,
  ExecutionMode,
  TaskSession,
  ChatMessage,
  ToolActivityItem,
  RoutingInfo,
} from '../types';
import {
  api,
  isBackendConfigured,
  friendlyError,
  mapPlanSteps,
  mapExecutionStages,
  mapVerificationChecks,
  mapRouting,
  mapDiffFiles,
  mapEvidencePack,
  mapToolActivities,
  buildAssistantSummaryMessage,
  executionAgentState,
} from '../api/client';
import { narrateEvent } from '../api/narration';
import { TopBar, NavTab } from './TopBar';
import { ConversationView } from './ConversationView';
import { Composer } from './Composer';
import { EmptyState } from './EmptyState';
import { DiffReview } from './DiffReview';
import { VerificationPanel } from './VerificationPanel';
import { InlineApproval, ApprovalVariant } from './InlineApproval';
import { PlanReview } from './PlanReview';
import { PlanView } from './PlanView';
import { StatusBadge } from './StatusBadge';
import { SettingsView } from './SettingsView';
import { ConstitutionView } from './ConstitutionView';
import { WorkspaceSetupLoader } from './WorkspaceSetupLoader';
import { RepoIngestButton } from './RepoIngestButton';
import { WorkspaceDialog } from './WorkspaceDialog';
import { BackendBadge } from './BackendBadge';
import { CommandPalette, PaletteAction, PALETTE_NAV_ICONS, MODE_ICONS, PALETTE_EXTRAS } from './CommandPalette';
import { DeliverPanel } from './DeliverPanel';
import { RunnerPanel } from './RunnerPanel';
import { SearchRepoPanel } from './SearchRepoPanel';
import { BackendWorkspace, BackendSummary } from '../api/client';
import { downloadTranscript, downloadTranscriptMarkdown } from '../api/transcript';
import { RepoFilePayload } from '../api/repoWalk';
import { ExecutionTarget } from './Composer';
import { CheckCircle2, RotateCcw, FileDown, Undo2 } from 'lucide-react';

const INITIAL_ROUTING: RoutingInfo = {
  provider: '',
  model: 'auto',
  routingMode: 'auto',
  estimatedCost: 0,
  actualCost: 0,
  latencyMs: 0,
  reason: '',
  retryCount: 0,
  fallbackStatus: 'nominal',
  taskBudget: 1.0,
};

const SESSIONS_KEY = 'zyntry.sessions.v1';
const ACTIVE_SESSION_KEY = 'zyntry.activeSession.v1';
const ONBOARDED_KEY = 'zyntry.onboarded.v1';
const MAX_PERSISTED_SESSIONS = 20;

/** States that make no sense after a reload (the run is gone). */
const INTERRUPTED_STATES = new Set([
  'planning',
  'working',
  'verifying',
  'applying_changes',
  'awaiting_approval',
]);

function loadPersistedSessions(): TaskSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [createBlankSession()];
    const parsed = JSON.parse(raw) as Partial<TaskSession>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [createBlankSession()];
    // Normalize sessions persisted by older builds: they may be missing fields
    // that later tabs render (routing, diffFiles, planSteps, …). Merge every
    // session over a blank one so opening any page can never crash on missing
    // data. Mid-run sessions become idle again, except cloud executions, which
    // keep running durably and resume polling.
    return parsed.map((s) => {
      const state = s.state ?? 'idle';
      return {
        ...createBlankSession(),
        ...s,
        routing: s.routing ? { ...INITIAL_ROUTING, ...s.routing } : { ...INITIAL_ROUTING },
        messages: Array.isArray(s.messages) ? s.messages : [],
        diffFiles: Array.isArray(s.diffFiles) ? s.diffFiles : [],
        verificationChecks: Array.isArray(s.verificationChecks) ? s.verificationChecks : [],
        planSteps: Array.isArray(s.planSteps) ? s.planSteps : [],
        toolActivities: Array.isArray(s.toolActivities) ? s.toolActivities : [],
        executionStages: Array.isArray(s.executionStages) ? s.executionStages : [],
        state:
          s.cloudExecution && s.backendTaskId && INTERRUPTED_STATES.has(state)
            ? 'working'
            : INTERRUPTED_STATES.has(state)
            ? 'idle'
            : state,
      } as TaskSession;
    });
  } catch {
    return [createBlankSession()];
  }
}

function createBlankSession(): TaskSession {
  const id = `task-${Date.now()}`;
  return {
    id,
    title: 'New Engineering Task',
    createdAt: new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    mode: 'agent',
    state: 'idle',
    branch: 'main',
    executionMode: 'auto',
    taskBudget: 1.0,
    backendTaskId: undefined,
    backendExecutionId: undefined,
    messages: [],
    diffFiles: [],
    verificationChecks: [],
    routing: { ...INITIAL_ROUTING },
    planSteps: [],
    toolActivities: [],
    executionStages: [],
  };
}

export const AppShell: React.FC = () => {
  // Workspace state — persisted to localStorage (no auth yet, so local is the store).
  const [sessions, setSessions] = useState<TaskSession[]>(() => loadPersistedSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
    const first = sessions[0]?.id ?? '';
    return stored && sessions.some((s) => s.id === stored) ? stored : first;
  });
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const stored = localStorage.getItem('zyntry.tab');
    return stored === 'chat' ||
      stored === 'changes' ||
      stored === 'verification' ||
      stored === 'constitution' ||
      stored === 'history' ||
      stored === 'settings'
      ? (stored as NavTab)
      : 'chat';
  });
  const [mode, setMode] = useState<WorkspaceMode>(() => {
    const stored = localStorage.getItem('zyntry.mode');
    return stored === 'ask' || stored === 'edit' || stored === 'plan' ? stored : 'agent';
  });
  const [deepReasoning, setDeepReasoning] = useState<boolean>(
    () => localStorage.getItem('zyntry.deepReasoning') !== '0'
  );
  const [routingMode, setRoutingMode] = useState<RoutingMode>(() => {
    const stored = localStorage.getItem('zyntry.routingMode');
    return stored === 'fast' || stored === 'balanced' || stored === 'quality' ? stored : 'auto';
  });
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(() => {
    return localStorage.getItem('zyntry.executionMode') === 'custom' ? 'custom' : 'auto';
  });
  const [taskBudget, setTaskBudget] = useState<number>(() => {
    const stored = Number(localStorage.getItem('zyntry.taskBudget'));
    return Number.isFinite(stored) && stored > 0 ? stored : 1.0;
  });
  const [showApprovalDialog, setShowApprovalDialog] = useState<boolean>(false);
  const [isChangesApplied, setIsChangesApplied] = useState<boolean>(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);
  const [composerSeedText, setComposerSeedText] = useState<string>('');
  const [isSettingUpWorkspace, setIsSettingUpWorkspace] = useState<boolean>(false);
  const [pendingApprovalTask, setPendingApprovalTask] = useState<string | null>(null);
  const [liveToolActivities, setLiveToolActivities] = useState<ToolActivityItem[]>([]);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [executionTarget, setExecutionTarget] = useState<ExecutionTarget>(() =>
    localStorage.getItem('zyntry.executionTarget') === 'cloud' ? 'cloud' : 'local'
  );
  const [workflowAvailable, setWorkflowAvailable] = useState<boolean>(false);
  // First launch: the original workspace-setup splash plays once, then chat.
  // No onboarding screen — the splash is the only first-run experience.
  const [isBooting, setIsBooting] = useState<boolean>(
    () => localStorage.getItem(ONBOARDED_KEY) !== '1'
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pollTimersRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  // Fetch backend capabilities (cloud workflow availability) once on mount.
  useEffect(() => {
    api
      .health()
      .then((h) => setWorkflowAvailable(Boolean(h.workflow?.available)))
      .catch(() => setWorkflowAvailable(false));
  }, []);

  // Apply persisted theme on startup.
  useEffect(() => {
    const stored = localStorage.getItem('zyntry.theme');
    if (!stored) return;
    const root = document.documentElement;
    root.setAttribute('data-zyntry-theme', stored);
    root.style.filter =
      stored === 'light'
        ? 'invert(1) hue-rotate(180deg)'
        : stored === 'oled'
        ? 'brightness(0.72) contrast(1.08)'
        : stored === 'midnight'
        ? 'saturate(1.25) hue-rotate(12deg)'
        : '';
  }, []);

  // Command palette: Cmd/Ctrl+K opens, Esc closes (the palette also handles it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Resume cloud polling for the active session after a reload.
  useEffect(() => {
    if (currentSession?.cloudExecution && currentSession.backendTaskId && currentSession.state === 'working') {
      setRunStartedAt(Date.now());
      pollCloudTask(currentSession.backendTaskId, currentSession.messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up cloud polling timers on unmount.
  useEffect(() => {
    const timers = pollTimersRef.current;
    return () => {
      timers.forEach((t) => clearInterval(t));
      timers.clear();
    };
  }, []);

  // Persist sessions + UI state on every change.
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_PERSISTED_SESSIONS)));
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    localStorage.setItem('zyntry.tab', currentTab);
  }, [currentTab]);
  useEffect(() => {
    localStorage.setItem('zyntry.mode', mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem('zyntry.deepReasoning', deepReasoning ? '1' : '0');
  }, [deepReasoning]);
  useEffect(() => {
    localStorage.setItem('zyntry.routingMode', routingMode);
  }, [routingMode]);
  useEffect(() => {
    localStorage.setItem('zyntry.executionMode', executionMode);
  }, [executionMode]);
  useEffect(() => {
    localStorage.setItem('zyntry.taskBudget', String(taskBudget));
  }, [taskBudget]);
  useEffect(() => {
    localStorage.setItem('zyntry.executionTarget', executionTarget);
  }, [executionTarget]);

  // Active session helper
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Set mode when active session changes
  useEffect(() => {
    if (currentSession) {
      setMode(currentSession.mode);
      setIsChangesApplied(currentSession.state === 'complete');
      if (currentSession.executionMode) setExecutionMode(currentSession.executionMode);
      if (currentSession.taskBudget) setTaskBudget(currentSession.taskBudget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // Update session state helper
  const updateSessionById = (id: string, updater: Partial<TaskSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updater } : s)));
  };
  const updateCurrentSession = (updater: Partial<TaskSession>) =>
    updateSessionById(activeSessionId, updater);

  // Human-in-the-loop: approve a high-risk task, or authorize applied changes.
  // apply-changes receives the per-file selection: files the developer
  // unchecked are scheduled for git restore instead of being authorized.
  const handleConfirmApproval = (approvedPaths?: string[]) => {
    // High-risk task approval path (real backend mode).
    if (pendingApprovalTask) {
      const taskId = pendingApprovalTask;
      setPendingApprovalTask(null);
      setIsSubmittingApproval(true);
      setShowApprovalDialog(false);
      updateCurrentSession({ state: 'working' });
      api
        .approveTask(taskId, false)
        .then(async () => {
          await runExecution(taskId, currentSession.messages);
          setIsSubmittingApproval(false);
        })
        .catch((err) => {
          setIsSubmittingApproval(false);
          updateCurrentSession({
            state: 'failed',
            messages: [
              ...currentSession.messages,
              {
                id: `m-err-${Date.now()}`,
                role: 'assistant',
                content: `Approval failed: ${friendlyError(err)}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          });
        });
      return;
    }

    // Post-execution change authorization: the workspace changes were already
    // applied by the runner; this marks them as reviewed and approved. Files
    // the developer excluded are queued for git restore (approval-gated).
    const rejectedPaths = approvedPaths
      ? currentSession.diffFiles
          .map((f) => f.path)
          .filter((p) => !approvedPaths.includes(p))
      : [];
    setIsSubmittingApproval(true);
    setShowApprovalDialog(false);
    updateCurrentSession({ state: 'applying_changes' });
    const taskId = currentSession.backendTaskId;
    const restorePromise = taskId && rejectedPaths.length > 0
      ? api.rollbackTask(taskId, rejectedPaths).catch(() => null)
      : Promise.resolve(null);
    restorePromise.then((restored) => {
      setTimeout(() => {
        setIsSubmittingApproval(false);
        setIsChangesApplied(true);
        updateCurrentSession({
          state: 'complete',
          messages: [
            ...currentSession.messages,
            {
              id: `m-applied-${Date.now()}`,
              role: 'assistant',
              content:
                '✓ Changes authorized. Workspace state recorded for the execution.' +
                (restored
                  ? ` ${restored.paths.length} unchecked file(s) queued for git restore — approve the request in the Runner panel to revert them.`
                  : ''),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        });
      }, 600);
    });
  };

  // Reject from the inline approval prompt.
  const handleRejectApproval = () => {
    // Pre-execution high-risk rejection: cancel the task on the backend.
    if (pendingApprovalTask) {
      const taskId = pendingApprovalTask;
      setPendingApprovalTask(null);
      setIsSubmittingApproval(true);
      setShowApprovalDialog(false);
      api
        .rejectTask(taskId)
        .then(() => {
          setIsSubmittingApproval(false);
          updateCurrentSession({
            state: 'idle',
            planSteps: [],
            messages: [
              ...currentSession.messages,
              {
                id: `m-cancelled-${Date.now()}`,
                role: 'assistant',
                content:
                  'Task cancelled by developer before execution. Start a new task to continue.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          });
        })
        .catch((err) => {
          setIsSubmittingApproval(false);
          updateCurrentSession({
            state: 'failed',
            messages: [
              ...currentSession.messages,
              {
                id: `m-err-${Date.now()}`,
                role: 'assistant',
                content: `Cancellation failed: ${friendlyError(err)}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          });
        });
      return;
    }

    // Post-execution change rejection: discard the proposed diff.
    setShowApprovalDialog(false);
    handleRejectChanges();
  };

  // Reject proposed changes
  const handleRejectChanges = () => {
    const updatedMessages: ChatMessage[] = [
      ...currentSession.messages,
      {
        id: `m-reject-${Date.now()}`,
        role: 'user',
        content: 'Changes rejected by developer. Please revise the approach.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `m-reject-ack-${Date.now()}`,
        role: 'assistant',
        content: 'Proposed changes discarded from review. The execution record remains in history.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    updateCurrentSession({
      state: 'idle',
      diffFiles: [],
      messages: updatedMessages,
    });
  };

  // Re-run the task against the backend.
  const handleRetryVerification = () => {
    const taskId = currentSession.backendTaskId;
    if (!taskId) {
      updateCurrentSession({
        messages: [
          ...currentSession.messages,
          {
            id: `m-err-${Date.now()}`,
            role: 'assistant',
            content: 'No backend task attached to this session — start a new task first.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
      return;
    }
    updateCurrentSession({ state: 'working' });
    runExecution(taskId, currentSession.messages);
  };

  // Retry only the failed stage(s): the backend re-runs them (plus everything
  // downstream) and reuses the persisted outputs of the already-succeeded
  // stages as context.
  const handleRetryStages = async (stageIds: string[]) => {
    const taskId = currentSession.backendTaskId;
    if (!taskId || stageIds.length === 0) return;
    updateCurrentSession({ state: 'working' });
    try {
      const summary = await api.retryStages(taskId, stageIds);
      await applyExecutionSummary(summary, currentSession.messages, []);
    } catch (err) {
      updateCurrentSession({
        state: 'failed',
        messages: [
          ...currentSession.messages,
          {
            id: `m-err-${Date.now()}`,
            role: 'assistant',
            content: `Retry failed to start: ${friendlyError(err)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    }
  };

  const handleRetryFailedStages = () => {
    const failed = (currentSession.executionStages ?? [])
      .filter((s) => s.status === 'failed')
      .map((s) => s.id)
      .filter(Boolean);
    if (failed.length === 0) return;
    handleRetryStages(failed);
  };

  // Revert this task's changes: queues a git restore for its recorded files
  // (approval-gated in the Runner panel).
  const handleRollback = async () => {
    const taskId = currentSession.backendTaskId;
    if (!taskId) return;
    try {
      const resp = await api.rollbackTask(taskId);
      updateCurrentSession({
        messages: [
          ...currentSession.messages,
          {
            id: `m-rollback-${Date.now()}`,
            role: 'assistant',
            content:
              `Rollback queued: git restore for ${resp.paths.length} file(s) — ` +
              `approve the request in the Runner panel to revert the changes.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    } catch (err) {
      updateCurrentSession({
        messages: [
          ...currentSession.messages,
          {
            id: `m-err-${Date.now()}`,
            role: 'assistant',
            content: `Rollback unavailable: ${friendlyError(err)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    }
  };

  // Ask mode only: turn the completed answer into a Plan-mode task ("Plan a fix").
  const handlePlanFix = () => {
    const firstUserMessage = currentSession.messages.find((m) => m.role === 'user');
    const prompt = firstUserMessage?.content?.trim() || currentSession.title;
    const newSession = createBlankSession();
    newSession.mode = 'plan';
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setCurrentTab('chat');
    setMode('plan');
    setIsChangesApplied(false);
    handleSendMessage(`${prompt}\n\nPlan the fix for the issues found above.`, [], {
      mode: 'plan',
      target: newSession,
    });
  };

  // Escalation is automatic in the backend; re-running surfaces the result.
  const handleEscalateModel = () => {
    const taskId = currentSession.backendTaskId;
    if (!taskId) {
      updateCurrentSession({
        messages: [
          ...currentSession.messages,
          {
            id: `m-err-${Date.now()}`,
            role: 'assistant',
            content: 'No backend task attached — escalation happens automatically during backend execution.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
      return;
    }
    updateCurrentSession({ state: 'working' });
    runExecution(taskId, currentSession.messages);
  };

  // Start execution for a planned task: auto-approve high-risk tasks (tasks
  // must start immediately), then dispatch the cloud workflow or stream locally.
  const startExecution = async (taskId: string, baseMessages: ChatMessage[]) => {
    try {
      const taskState = await api.getTask(taskId);
      if (taskState.task.status === 'awaiting_approval') {
        await api.approveTask(taskId, false).catch(() => undefined);
      }
    } catch {
      /* best-effort; execute will surface any real error */
    }

    // Cloud execution: durable Workers workflow — runs even if this tab closes.
    if (executionTarget === 'cloud' && workflowAvailable) {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => undefined);
      }
      const dispatched = await api.executeTaskWorkflow(taskId);
      const cloudMessages: ChatMessage[] = [
        ...baseMessages,
        {
          id: `m-cloud-${Date.now()}`,
          role: 'assistant',
          content:
            `Dispatched to cloud workflow ${dispatched.workflow_instance_id.slice(0, 8)} — ` +
            `it runs durably in the cloud. You can close this tab; come back and the results will appear here.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      updateCurrentSession({
        state: 'working',
        messages: cloudMessages,
        cloudExecution: true,
      });
      setRunStartedAt(Date.now());
      pollCloudTask(taskId, cloudMessages);
      return;
    }

    await runExecution(taskId, baseMessages);
  };

  // Send message from composer — real backend pipeline only.
  const handleSendMessage = async (
    text: string,
    attachedFiles: RepoFilePayload[],
    opts?: { mode?: WorkspaceMode; target?: TaskSession }
  ) => {
    const session = opts?.target ?? currentSession;
    const effectiveMode = opts?.mode ?? mode;
    const updateSession = (updater: Partial<TaskSession>) =>
      updateSessionById(session.id, updater);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFiles: attachedFiles.map((f) => f.path),
    };

    const newMessages = [...session.messages, userMsg];
    const isFirstMessage = session.messages.length === 0;

    // Mid-execution steering: if the agent is running and this task already
    // exists, send the message conversationally ("wait, do X instead") and
    // let the backend fold it into the remaining stages.
    if (isAgentRunning && session.backendTaskId) {
      updateSession({ messages: newMessages });
      try {
        await api.sendTaskMessage(session.backendTaskId, text);
        updateSession({
          messages: [
            ...newMessages,
            {
              id: `m-steer-${Date.now()}`,
              role: 'assistant',
              content:
                'Got it — noted. I\'ll fold that into what I do next and keep going.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        });
      } catch (err) {
        updateSession({
          messages: [
            ...newMessages,
            {
              id: `m-steer-err-${Date.now()}`,
              role: 'assistant',
              content: `I couldn't register that mid-run instruction: ${friendlyError(err)}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        });
      }
      return;
    }

    updateSession({
      state: 'planning',
      messages: newMessages,
      ...(isFirstMessage
        ? { title: text.length > 72 ? `${text.slice(0, 72).trimEnd()}…` : text }
        : {}),
    });
    setIsChangesApplied(false);

    if (!isBackendConfigured()) {
      updateSession({
        state: 'idle',
        messages: [
          ...newMessages,
          {
            id: `m-connect-${Date.now()}`,
            role: 'assistant',
            content:
              'Connect the Zyntry backend first — click the "Not connected" badge (bottom-right) and enter the backend URL (e.g. http://localhost:8787).',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
      return;
    }

    try {
      const created = await api.createTask(text, {
        budget_usd: taskBudget,
        max_attempts_per_stage: 2,
        mode: effectiveMode,
        routing_mode: routingMode,
        deep_reasoning: deepReasoning,
      });

      // Wire the composer's attached files to the real backend repo snapshot.
      let liveMessages = newMessages;
      if (attachedFiles.length > 0) {
        try {
          const ingested = await api.ingestRepo(created.task.id, attachedFiles);
          liveMessages = [
            ...newMessages,
            {
              id: `m-ingest-${Date.now()}`,
              role: 'assistant',
              content: `Attached ${ingested.files_ingested} file(s) — they are now part of the task's repo snapshot and will be used for planning and prompts.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        } catch {
          /* ingestion failure is non-fatal; execution continues */
        }
      }

      updateSession({
        backendTaskId: created.task.id,
        planSteps: mapPlanSteps(created.plan.stages),
        planSummary: created.plan.summary,
        mode: effectiveMode,
        messages: liveMessages,
      });

      // Plan mode is the only flow that stops for plan review: open the full
      // implementation plan in its own tab. Every other mode runs immediately.
      if (effectiveMode === 'plan') {
        const plannedMessages: ChatMessage[] = [
          ...liveMessages,
          {
            id: `m-plan-${Date.now()}`,
            role: 'assistant',
            content:
              `I drafted a complete implementation plan with ${created.plan.stages.length} ` +
              `stages — it's open in the Plan tab. Uncheck any stage you don't want, ` +
              `then run it here or from the Plan tab.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
        updateSession({
          planPendingReview: true,
          state: 'planning',
          messages: plannedMessages,
        });
        setCurrentTab('plan');
        return;
      }

      await startExecution(created.task.id, liveMessages);
    } catch (err) {
      const detail = friendlyError(err);
      updateSession({
        state: 'failed',
        messages: [
          ...newMessages,
          {
            id: `m-err-${Date.now()}`,
            role: 'assistant',
            content: `Backend error: ${detail}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    }
  };

  // Materialize a finished execution summary into the session (shared by the
  // local SSE path and the cloud-workflow polling path).
  const applyExecutionSummary = (
    summary: BackendSummary,
    baseMessages: ChatMessage[],
    live: ToolActivityItem[]
  ) => {
    const changes = [] as import('../api/client').BackendChange[];
    return api
      .getChanges(summary.execution.id)
      .catch(() => ({ changes }))
      .then((resp) => {
        const endState = executionAgentState(summary);
        const diffFiles = mapDiffFiles(resp.changes);
        const summaryMessage: ChatMessage = {
          ...buildAssistantSummaryMessage(summary),
          diffFiles,
          blastRadius: currentSession.blastRadius,
        };
        updateCurrentSession({
          state: endState,
          backendExecutionId: summary.execution.id,
          executionStages: mapExecutionStages(summary.stages),
          planSteps: mapPlanSteps(summary.stages),
          planSummary: summary.plan?.summary ?? currentSession.planSummary,
          verificationChecks: mapVerificationChecks(summary),
          routing: mapRouting(summary),
          diffFiles,
          evidencePack: mapEvidencePack(summary),
          toolActivities: [...live, ...mapToolActivities(summary)].slice(0, 30),
          messages: [...baseMessages, summaryMessage],
        });
        setLiveToolActivities([]);
        setRunStartedAt(null);
        notify(
          `Zyntry: task ${summary.task.status}`,
          `"${currentSession.title}" finished (${summary.task.status}) — $${summary.cost.estimated_usd.toFixed(4)}`
        );
      });
  };

  // Browser notification for terminal states (governed by Settings toggles).
  const notify = (title: string, body: string) => {
    try {
      if (typeof Notification === 'undefined') return;
      let prefs: Record<string, boolean> = {};
      try {
        prefs = JSON.parse(localStorage.getItem('zyntry.notify') || '{}');
      } catch {
        /* defaults */
      }
      if (prefs.notifyTaskCompleted === false) return;
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch {
      /* notifications unavailable */
    }
  };

  // Poll a cloud workflow execution until the task reaches a terminal state,
  // then materialize the summary — works across page reloads.
  const pollCloudTask = (taskId: string, baseMessages: ChatMessage[]) => {
    const timer = setInterval(async () => {
      try {
        const t = await api.getTask(taskId);
        const status = String(t.task.status);
        if (['completed', 'failed', 'cancelled'].includes(status)) {
          clearInterval(timer);
          pollTimersRef.current.delete(timer);
          const execId = (t as unknown as { latest_execution_id?: string }).latest_execution_id;
          if (!execId) {
            updateCurrentSession({
              state: 'failed',
              messages: [
                ...baseMessages,
                {
                  id: `m-cloud-${Date.now()}`,
                  role: 'assistant',
                  content: `Cloud workflow finished (${status}) but produced no execution record.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ],
            });
            return;
          }
          const summary = await api.getExecution(execId);
          await applyExecutionSummary(summary, baseMessages, []);
        }
      } catch {
        /* transient network error — keep polling */
      }
    }, 4000);
    pollTimersRef.current.add(timer);
  };

  // Run the reviewed plan (optionally with excluded stages).
  const handleRunPlan = async (excludedStageIds: string[]) => {
    const taskId = currentSession.backendTaskId;
    if (!taskId) return;
    updateCurrentSession({ planPendingReview: false, state: 'working' });
    setCurrentTab('chat');
    try {
      if (excludedStageIds.length > 0) {
        await api.updateTaskConstraints(taskId, { exclude_stage_ids: excludedStageIds });
      }
      await startExecution(taskId, currentSession.messages);
    } catch (err) {
      const detail = friendlyError(err);
      updateCurrentSession({
        state: 'failed',
        messages: [
          ...currentSession.messages,
          {
            id: `m-err-${Date.now()}`,
            role: 'assistant',
            content: `Execution failed to start: ${detail}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    }
  };

  // Cancel the pending plan review.
  const handleCancelPlan = () => {
    updateCurrentSession({ planPendingReview: false, state: 'idle' });
    setCurrentTab('chat');
  };

  // Real execution: stream stage events, then materialize the full summary.
  const runExecution = async (taskId: string, baseMessages: ChatMessage[]) => {
    updateCurrentSession({ state: 'working' });
    setRunStartedAt(Date.now());
    const live: ToolActivityItem[] = [];
    let firstEventMs: number | null = null;
    const summary = await api.streamTask(taskId, (event) => {
      const type = String(event.type ?? '');

      // Token-level streaming: live model output, not a stage event.
      if (type === 'token') {
        const chunk = String((event.data as Record<string, unknown>)?.text ?? event.message ?? '');
        setStreamingText((prev) => (prev + chunk).slice(-8000));
        return;
      }
      if (type === 'stage_started' || type === 'stage_succeeded' || type === 'stage_failed' || type === 'stage_skipped') {
        setStreamingText('');
      }

      // Elapsed time since the first event (backend clock), per event.
      let durationMs: number | undefined;
      try {
        const iso = String(event.created_at ?? '');
        if (iso) {
          const ts = new Date(iso).getTime();
          if (firstEventMs === null) firstEventMs = ts;
          durationMs = Math.max(0, ts - (firstEventMs ?? ts));
        }
      } catch {
        /* ignore */
      }
      const narration = narrateEvent({
        type,
        message: event.message as string | undefined,
        data: event.data as Record<string, unknown>,
      });
      const label =
        narration ??
        (type === 'stage_succeeded'
          ? String(event.message ?? 'stage completed')
          : type === 'verification_failed'
          ? 'verification failed'
          : type === 'agent_tool_call'
          ? `tool: ${String((event.data as Record<string, unknown>)?.tool ?? '')}`
          : String(event.message ?? type));
      // Prefer the backend event timestamp so the log reflects real time.
      let stamp: string;
      try {
        const iso = String(event.created_at ?? '');
        stamp = iso
          ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      live.unshift({
        id: `t-live-${live.length}-${Date.now()}`,
        name: label,
        action: type,
        target: typeof event.stage_id === 'string' ? event.stage_id : undefined,
        status:
          type === 'verification_failed' || type === 'attempt_failed' ? 'failed' : 'complete',
        timestamp: stamp,
        durationMs,
      });
      setLiveToolActivities([...live.slice(0, 20)]);
      if (type === 'verification_failed' || type === 'verification_limited') {
        updateCurrentSession({ state: 'verifying' });
      }
    });

    const changes = await api.getChanges(summary.execution.id).catch(() => ({ changes: [] }));
    const endState = executionAgentState(summary);
    const diffFiles = mapDiffFiles(changes.changes);
    const summaryMessage: ChatMessage = {
      ...buildAssistantSummaryMessage(summary),
      diffFiles,
      blastRadius: currentSession.blastRadius,
    };
    updateCurrentSession({
      state: endState,
      backendExecutionId: summary.execution.id,
      executionStages: mapExecutionStages(summary.stages),
      planSteps: mapPlanSteps(summary.stages),
      planSummary: summary.plan?.summary ?? currentSession.planSummary,
      verificationChecks: mapVerificationChecks(summary),
      routing: mapRouting(summary),
      diffFiles,
      evidencePack: mapEvidencePack(summary),
      toolActivities: [...live, ...mapToolActivities(summary)].slice(0, 30),
      messages: [...baseMessages, summaryMessage],
    });
    setLiveToolActivities([]);
    setRunStartedAt(null);
    setStreamingText('');
    notify(
      `Zyntry: task ${summary.task.status}`,
      `"${currentSession.title}" finished (${summary.task.status}) — $${summary.cost.estimated_usd.toFixed(4)}`
    );
  };

  // Stop running agent
  const handleStopAgent = () => {
    updateCurrentSession({ state: 'idle' });
  };

  // Create new task
  const handleNewTask = () => {
    const newTask = createBlankSession();
    setSessions([newTask, ...sessions]);
    setActiveSessionId(newTask.id);
    setCurrentTab('chat');
    setIsChangesApplied(false);
  };

  const isAgentRunning =
    ['working', 'verifying', 'applying_changes'].includes(currentSession.state) ||
    (currentSession.state === 'planning' && !currentSession.planPendingReview);

  // Cmd+K palette actions — pure navigation/state switches.
  const paletteActions: PaletteAction[] = [
    { id: 'new-task', label: 'New Task', hint: 'Start a fresh session', group: 'session', icon: PALETTE_EXTRAS.newTask, run: handleNewTask },
    { id: 'chat', label: 'Chat', group: 'pages', icon: PALETTE_NAV_ICONS.chat, run: () => setCurrentTab('chat') },
    { id: 'plan', label: 'Implementation Plan', group: 'pages', icon: PALETTE_NAV_ICONS.plan, run: () => setCurrentTab('plan') },
    { id: 'changes', label: 'Changes', group: 'pages', icon: PALETTE_NAV_ICONS.changes, run: () => setCurrentTab('changes') },
    { id: 'verification', label: 'Verification', group: 'pages', icon: PALETTE_NAV_ICONS.verification, run: () => setCurrentTab('verification') },
    { id: 'settings', label: 'Settings', group: 'pages', icon: PALETTE_NAV_ICONS.settings, run: () => setCurrentTab('settings') },
    { id: 'mode-agent', label: 'Mode: Agent', keywords: 'autonomous execute', group: 'mode', icon: MODE_ICONS.agent, run: () => { setMode('agent'); updateCurrentSession({ mode: 'agent' }); } },
    { id: 'mode-plan', label: 'Mode: Plan', keywords: 'review plan before run', group: 'mode', icon: MODE_ICONS.plan, run: () => { setMode('plan'); updateCurrentSession({ mode: 'plan' }); } },
    { id: 'mode-edit', label: 'Mode: Edit', keywords: 'targeted diff', group: 'mode', icon: MODE_ICONS.edit, run: () => { setMode('edit'); updateCurrentSession({ mode: 'edit' }); } },
    { id: 'mode-ask', label: 'Mode: Ask', keywords: 'questions analysis', group: 'mode', icon: MODE_ICONS.ask, run: () => { setMode('ask'); updateCurrentSession({ mode: 'ask' }); } },
    { id: 'deep-reasoning', label: deepReasoning ? 'Deep reasoning: off' : 'Deep reasoning: on', group: 'routing', icon: PALETTE_EXTRAS.deepReasoning, run: () => setDeepReasoning((v) => !v) },
  ];

  // First launch: the original splash screen (the workspace-setup loader) plays
  // once, then the app goes straight to chat — no onboarding screen.
  if (isBooting) {
    return (
      <WorkspaceSetupLoader
        repoName="zyntry-core-engine"
        branch={currentSession.branch}
        onFinished={() => {
          localStorage.setItem(ONBOARDED_KEY, '1');
          setIsBooting(false);
        }}
      />
    );
  }

  // Standalone Workspace Setup Loading screen
  if (isSettingUpWorkspace) {
    return (
      <WorkspaceSetupLoader
        onFinished={() => {
          setIsSettingUpWorkspace(false);
          setCurrentTab('chat');
        }}
        repoName="zyntry-core-engine"
        branch={currentSession.branch}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D1217] text-[#F2F6F4]"
    >
      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-transparent">
        {/* TopBar — brand, new task, pages dropdown, history dropdown, routing */}
        <TopBar
          repoName="zyntry-core-engine"
          branch={currentSession.branch}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setCurrentTab('chat');
          }}
          onNewTask={handleNewTask}
          routingMode={routingMode}
          onRoutingModeChange={(rm) => {
            setRoutingMode(rm);
            updateCurrentSession({
              routing: { ...currentSession.routing, routingMode: rm },
            });
          }}
          deepReasoning={deepReasoning}
          onDeepReasoningChange={setDeepReasoning}
          routingInfo={currentSession.routing}
        />

        {/* Tab Views - Single Unified Scroll Container without separate scroll traps */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-transparent">
          {/* Main scrollable view for all content */}
          <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
            {/* 1. CHAT TAB */}
            {currentTab === 'chat' &&
              (currentSession.messages.length === 0 ? (
                <EmptyState
                  repoName="zyntry-core-engine"
                  branch={currentSession.branch}
                />
              ) : (
                <ConversationView
                  messages={currentSession.messages}
                  agentState={currentSession.state}
                  liveActivities={liveToolActivities}
                  isAgentRunning={isAgentRunning}
                  runStartedAt={runStartedAt}
                  streamingText={streamingText}
                  onApplyChanges={() => setShowApprovalDialog(true)}
                  onRejectChanges={handleRejectChanges}
                  onRetryVerification={handleRetryVerification}
                  onEscalateModel={handleEscalateModel}
                  onSeedComposer={(text) => setComposerSeedText(text)}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  isChangesApplied={isChangesApplied}
                  onRetryFailedStages={
                    currentSession.backendTaskId ? handleRetryFailedStages : undefined
                  }
                  onPlanFix={currentSession.mode === 'ask' ? handlePlanFix : undefined}
                  isAskMode={currentSession.mode === 'ask'}
                />
              ))}

            {/* 2. PLAN TAB — the full implementation plan (Plan mode review) */}
            {currentTab === 'plan' && (
              <PlanView
                steps={currentSession.planSteps}
                summary={currentSession.planSummary}
                isPendingReview={Boolean(currentSession.planPendingReview)}
                isRunning={isAgentRunning}
                onRun={handleRunPlan}
                onCancel={handleCancelPlan}
                onRetryStage={
                  currentSession.backendTaskId && !isAgentRunning
                    ? (stageId) => handleRetryStages([stageId])
                    : undefined
                }
              />
            )}

            {/* 3. CHANGES TAB */}
            {currentTab === 'changes' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 sm:px-10 md:px-16 lg:px-20 xl:px-24 py-6 sm:py-8 space-y-6 w-full pb-16"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#F2F6F4] tracking-tight">
                      Workspace Changes
                    </h2>
                    <p className="text-xs text-[#A3AEAA] mt-0.5">
                      Unified diff review comparing working tree against HEAD
                    </p>
                  </div>
                  {currentSession.state === 'awaiting_approval' && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setCurrentTab('chat');
                        setShowApprovalDialog(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-900 hover:bg-zinc-200 border border-white/30 rounded-full text-xs font-semibold cursor-pointer shadow-md active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={14} />
                      <span>Authorize Changes</span>
                    </motion.button>
                  )}
                  <div className="flex items-center gap-2">
                    {currentSession.ciStatus && (
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono ${
                          currentSession.ciStatus.status === 'success'
                            ? 'bg-[#0E2A1C] border-[#55E6A5]/40 text-[#55E6A5]'
                            : currentSession.ciStatus.status === 'failed'
                            ? 'bg-[#2A150F] border-[#F87171]/40 text-[#F87171]'
                            : 'bg-white/5 border-white/10 text-[#A3AEAA]'
                        }`}
                        title={currentSession.ciStatus.url ?? 'CI status from the delivery webhook'}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        CI {currentSession.ciStatus.status}
                      </span>
                    )}
                    {currentSession.backendTaskId && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleRollback}
                        title="Queue a git restore of this task's files (approval-gated in the Runner panel)"
                        className="flex items-center gap-2 px-4 py-2 bg-white/6 hover:bg-white/10 text-[#F2F6F4] border border-white/10 rounded-full text-xs font-medium cursor-pointer shadow-xs"
                      >
                        <Undo2 size={13} className="text-[#FF7D7D]" />
                        <span>Revert changes</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                <DiffReview
                  files={currentSession.diffFiles}
                  onApplyChanges={() => {
                    setCurrentTab('chat');
                    setShowApprovalDialog(true);
                  }}
                  onRejectChanges={handleRejectChanges}
                  isApplied={isChangesApplied}
                />
              </motion.div>
            )}

            {/* 4. VERIFICATION TAB */}
            {currentTab === 'verification' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 sm:px-10 md:px-16 lg:px-20 xl:px-24 py-6 sm:py-8 space-y-6 w-full pb-16"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#F2F6F4] tracking-tight">
                      Quality & Safety Matrix
                    </h2>
                    <p className="text-xs text-[#A3AEAA] mt-0.5">
                      Verification results from the execution — passed, failed, or
                      reported as limitations (never claimed verified).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleRetryVerification}
                      className="flex items-center gap-2 px-4 py-2 bg-white/6 hover:bg-white/10 text-[#F2F6F4] border border-white/10 rounded-full text-xs font-medium cursor-pointer shadow-xs"
                    >
                      <RotateCcw size={13} className="text-[#82B9FF]" />
                      <span>Re-run Task</span>
                    </motion.button>
                  </div>
                </div>

                <VerificationPanel
                  checks={currentSession.verificationChecks}
                  onRetry={handleRetryVerification}
                  onEscalate={handleEscalateModel}
                  defaultExpanded={true}
                />
              </motion.div>
            )}

            {/* 5. CONSTITUTION TAB */}
            {currentTab === 'constitution' && <ConstitutionView />}

            {/* 6. HISTORY TAB */}
            {currentTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 sm:px-10 md:px-16 lg:px-20 xl:px-24 py-6 sm:py-8 space-y-6 w-full pb-16"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#F2F6F4] tracking-tight">
                    Task History & Evidence
                  </h2>
                  <p className="text-xs text-[#A3AEAA] mt-0.5">
                    Audit log of previous reasoning sessions, patches, and model allocations
                  </p>
                </div>

                <div className="space-y-3.5">
                  {sessions.map((sess) => (
                    <motion.div
                      key={sess.id}
                      whileHover={{ y: -2 }}
                      onClick={() => {
                        setActiveSessionId(sess.id);
                        setCurrentTab('chat');
                      }}
                      className="p-5 bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-white/20 rounded-[22px] transition-all cursor-pointer space-y-3 shadow-xl backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs sm:text-sm text-[#F2F6F4]">
                          {sess.title}
                        </span>
                        <StatusBadge state={sess.state} />
                      </div>

                      <div className="flex items-center gap-4 text-[11px] font-mono text-[#6F7B77] tabular-nums">
                        <span>Created {sess.createdAt}</span>
                        <span>·</span>
                        <span>Branch: {sess.branch}</span>
                        <span>·</span>
                        <span className="text-[#93C5FD] font-semibold">
                          ${sess.routing.actualCost.toFixed(4)}
                        </span>
                        {sess.backendTaskId && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-[#6F7B77]">
                              task: {sess.backendTaskId.slice(0, 8)}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 7. SETTINGS TAB */}
            {currentTab === 'settings' && (
              <SettingsView
                repoName="zyntry-core-engine"
                branch={currentSession.branch}
                onBranchChange={(newBranch) => {
                  updateCurrentSession({ branch: newBranch });
                }}
                taskBudget={taskBudget}
                onTaskBudgetChange={(tb) => {
                  setTaskBudget(tb);
                  updateCurrentSession({ taskBudget: tb });
                }}
                onSave={() => {
                  localStorage.setItem('zyntry.taskBudget', String(taskBudget));
                  localStorage.setItem('zyntry.branch', currentSession.branch);
                }}
              />
            )}
          </div>

          {/* Floating Solitary Rounded Input */}
          {currentTab === 'chat' && (
            <>
              {/* Toolbar: runner, repo ingest, workspace, deliver, transcript (with a backend task or any chat) */}
              {(currentSession.backendTaskId || currentSession.messages.length > 0) && (
                <div className="flex items-center gap-2 px-4 sm:px-6 pb-2">
                  {currentSession.backendTaskId && (
                    <button
                      onClick={() => setRunnerOpen(true)}
                      title="Execution runner bridge — attach the VS Code runner so tests actually run in your repo"
                      className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#55E6A5]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer shadow-lg backdrop-blur-xl"
                    >
                      Runner
                    </button>
                  )}
                  {currentSession.backendTaskId && (
                    <button
                      onClick={() => setSearchOpen(true)}
                      title="Search the task's ingested repo snapshot"
                      className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#F4C76A]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer shadow-lg backdrop-blur-xl"
                    >
                      Search repo
                    </button>
                  )}
                  {currentSession.planSteps.length > 0 && (
                    <button
                      onClick={() => setCurrentTab('plan')}
                      title="Open the full implementation plan"
                      className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#82B9FF]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer shadow-lg backdrop-blur-xl"
                    >
                      Plan
                    </button>
                  )}
                  {currentSession.backendTaskId && <RepoIngestButton taskId={currentSession.backendTaskId} compact />}
                  <button
                    onClick={() => setWorkspaceDialogOpen(true)}
                    title="Create an execution workspace (runner target) for this task"
                    className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#82B9FF]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer shadow-lg backdrop-blur-xl"
                  >
                    {currentSession.backendWorkspaceId ? 'Workspace ✓' : 'Workspace'}
                  </button>
                  <button
                    onClick={() => setDeliverOpen(true)}
                    disabled={!currentSession.backendWorkspaceId}
                    title={
                      currentSession.backendWorkspaceId
                        ? 'Commit → push → PR (approval-gated)'
                        : 'Create a workspace first'
                    }
                    className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#55E6A5]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer disabled:opacity-40 shadow-lg backdrop-blur-xl"
                  >
                    Deliver
                  </button>
                  <button
                    onClick={() => {
                      downloadTranscriptMarkdown(currentSession);
                    }}
                    disabled={currentSession.messages.length === 0}
                    title="Export the session transcript as Markdown"
                    className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#93C5FD]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer disabled:opacity-40 shadow-lg backdrop-blur-xl"
                  >
                    MD
                  </button>
                  <button
                    onClick={() => downloadTranscript(currentSession)}
                    disabled={currentSession.messages.length === 0}
                    title="Export the full session transcript to a single JSON file"
                    className="px-3 py-1.5 rounded-full bg-[#121820]/95 hover:bg-[#151D28] border border-white/10 hover:border-[#93C5FD]/40 text-[#F2F6F4] text-xs font-medium cursor-pointer disabled:opacity-40 shadow-lg backdrop-blur-xl"
                  >
                    Transcript
                  </button>
                </div>
              )}
              {showApprovalDialog ? (
                <InlineApproval
                  isOpen={showApprovalDialog}
                  variant={
                    (pendingApprovalTask ? 'pre-execution' : 'apply-changes') as ApprovalVariant
                  }
                  files={currentSession.diffFiles}
                  planSteps={currentSession.planSteps}
                  isSubmitting={isSubmittingApproval}
                  onApprove={handleConfirmApproval}
                  onReject={handleRejectApproval}
                  onDismiss={() => {
                    if (isSubmittingApproval) return;
                    handleRejectApproval();
                  }}
                />
              ) : currentSession.planPendingReview ? (
                <PlanReview
                  isOpen
                  steps={currentSession.planSteps}
                  onRun={handleRunPlan}
                  onCancel={handleCancelPlan}
                />
              ) : (
                <Composer
                  onSendMessage={handleSendMessage}
                  onStopAgent={handleStopAgent}
                  isRunning={isAgentRunning}
                  mode={mode}
                  onModeChange={(newMode) => {
                    setMode(newMode);
                    updateCurrentSession({ mode: newMode });
                  }}
                  initialText={composerSeedText}
                  executionTarget={executionTarget}
                  onExecutionTargetChange={setExecutionTarget}
                  cloudAvailable={workflowAvailable}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Approval is handled inline at the input side (Codex-style) */}
      <SearchRepoPanel
        isOpen={searchOpen}
        taskId={currentSession.backendTaskId}
        workspaceId={currentSession.backendWorkspaceId}
        onClose={() => setSearchOpen(false)}
      />
      <RunnerPanel
        isOpen={runnerOpen}
        taskId={currentSession.backendTaskId}
        workspaceId={currentSession.backendWorkspaceId}
        onClose={() => setRunnerOpen(false)}
        onAttached={(ws: BackendWorkspace) => {
          updateCurrentSession({ backendWorkspaceId: ws.id });
        }}
      />
      <WorkspaceDialog
        isOpen={workspaceDialogOpen}
        taskId={currentSession.backendTaskId}
        onClose={() => setWorkspaceDialogOpen(false)}
        onCreated={(ws: BackendWorkspace) => {
          updateCurrentSession({ backendWorkspaceId: ws.id });
        }}
      />
      <DeliverPanel
        isOpen={deliverOpen}
        workspaceId={currentSession.backendWorkspaceId}
        title={currentSession.title}
        onClose={() => setDeliverOpen(false)}
        onDelivered={({ workspace_id }) => {
          updateCurrentSession({
            messages: [
              ...currentSession.messages,
              {
                id: `m-ci-${Date.now()}`,
                role: 'assistant',
                content:
                  `Delivery queued on workspace ${workspace_id.slice(0, 8)}: commit runs now, push + PR await your approval. ` +
                  `Once pushed, CI runs on the branch — its status will appear here via the webhook.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          });
          // Poll for the CI webhook status (posted by CI after the push).
          const taskId = currentSession.backendTaskId;
          if (taskId) {
            let polls = 0;
            const timer = setInterval(async () => {
              polls += 1;
              if (polls > 40) clearInterval(timer);
              try {
                const t = await api.getTask(taskId);
                if (t.ci && t.ci.status !== 'pending' && t.ci.status !== 'running') {
                  clearInterval(timer);
                  updateCurrentSession({
                    ciStatus: { status: t.ci.status, url: t.ci.url, detail: t.ci.detail },
                    messages: [
                      ...currentSession.messages,
                      {
                        id: `m-ci-status-${Date.now()}`,
                        role: 'assistant',
                        content: `CI reported ${t.ci.status}${t.ci.url ? ` — ${t.ci.url}` : ''}.`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ],
                  });
                } else if (t.ci) {
                  updateCurrentSession({
                    ciStatus: { status: t.ci.status, url: t.ci.url, detail: t.ci.detail },
                  });
                }
              } catch {
                /* transient — keep polling */
              }
            }, 6000);
          }
        }}
      />
      <CommandPalette
        isOpen={paletteOpen}
        actions={paletteActions}
        onClose={() => setPaletteOpen(false)}
      />
      <BackendBadge />
    </motion.div>
  );
};