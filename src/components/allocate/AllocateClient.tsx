'use client';

// 振り分けウィザード（PROJECTSPEC §5.1「振り分け」/ 隔月収入対応）。
//
// 振り分けは「期間」単位で行う。隔月収入の世帯では偶数月（入金月）を起点に
// 当月＋翌奇数月の 2 ヶ月分をまとめて振り分ける（calc/allocationView）。
//
// 2 ステップ:
//   STEP1 予定ヒアリング … 収入・各支出の「予定額」を確認/調整（マスタ額をプリフィル）
//   STEP2 振り分け       … 「実際にいくら？」を入力して確保。差額は余りに自動補完。
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  accountRepository,
  expenseRepository,
  incomeRepository,
  monthlyIncomeRepository,
  monthlyTaskRepository,
} from '@/lib/db/repositories';
import {
  calcReconciledRemaining,
  generateMonthlyIncomeDrafts,
  generateMonthlyTaskDrafts,
  getAllocationPeriod,
  hasBimonthlyIncome,
} from '@/lib/calc';
import type { RemainingStatus } from '@/lib/calc';
import { formatYen, monthNumber } from '@/lib/format';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { MonthlyIncome, MonthlyTask } from '@/types';
import { CatPhoto } from '@/components/cat';
import { Input } from '@/components/ui/Input';
import { CatToast } from '@/components/checklist/CatToast';

// --- view models -----------------------------------------------------------

type Loaded = {
  // 期間の入金月（収入レコードはこの月のみ）
  incomeMonth: string;
  periodMonths: string[];
  isBimonthly: boolean;
  monthlyIncomes: MonthlyIncome[];
  tasks: MonthlyTask[];
  incomeNames: Map<string, string>; // incomeId -> name
  expenseNames: Map<string, string>; // expenseId -> name
  accountNames: Map<string, string>; // accountId -> name
};

type State =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'ready'; data: Loaded }
  | { phase: 'error'; message: string };

type Step = 1 | 2;

const STATUS_TO_COLOR: Record<RemainingStatus, string> = {
  comfortable: 'text-status-comfortable',
  tight: 'text-status-tight',
  over: 'text-status-over',
};

function num(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// --- main -------------------------------------------------------------------

export function AllocateClient(): React.JSX.Element {
  const yearMonth = useUiStore((s) => s.yearMonth);
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [step, setStep] = useState<Step>(1);

  // 編集中の金額（文字列で保持し、空欄入力を許容）。recordId -> string
  const [plannedDraft, setPlannedDraft] = useState<Record<string, string>>({});
  const [actualDraft, setActualDraft] = useState<Record<string, string>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [accounts, incomes, expenses] = await Promise.all([
          accountRepository.list(),
          incomeRepository.list(),
          expenseRepository.list(),
        ]);
        if (cancelled) return;

        if (accounts.length === 0 || (incomes.length === 0 && expenses.length === 0)) {
          setState({ phase: 'empty' });
          return;
        }

        const period = getAllocationPeriod(yearMonth, hasBimonthlyIncome(incomes));

        // 期間内の各月の支出タスク・入金月の収入レコードを（重複なく）用意する。
        await Promise.all(
          period.periodMonths.map((m) =>
            monthlyTaskRepository.ensureDraftsForMonth(
              m,
              generateMonthlyTaskDrafts(expenses, m),
            ),
          ),
        );
        await monthlyIncomeRepository.ensureDraftsForMonth(
          period.incomeMonth,
          generateMonthlyIncomeDrafts(incomes, period.incomeMonth),
        );
        if (cancelled) return;

        const tasksByMonth = await Promise.all(
          period.periodMonths.map((m) =>
            monthlyTaskRepository.listByYearMonth(m),
          ),
        );
        const tasks = tasksByMonth.flat();
        const monthlyIncomes = await monthlyIncomeRepository.listByYearMonth(
          period.incomeMonth,
        );
        if (cancelled) return;

        const data: Loaded = {
          incomeMonth: period.incomeMonth,
          periodMonths: period.periodMonths,
          isBimonthly: period.isBimonthly,
          monthlyIncomes,
          tasks,
          incomeNames: new Map(incomes.map((i) => [i.id, i.name])),
          expenseNames: new Map(expenses.map((e) => [e.id, e.name])),
          accountNames: new Map(accounts.map((a) => [a.id, a.name])),
        };

        // 金額ドラフトの初期化
        const planned: Record<string, string> = {};
        const actual: Record<string, string> = {};
        for (const mi of monthlyIncomes) {
          planned[mi.id] = String(mi.plannedAmount);
          actual[mi.id] = String(mi.status === 'done' ? mi.actualAmount : mi.plannedAmount);
        }
        for (const t of tasks) {
          planned[t.id] = String(t.plannedAmount);
          actual[t.id] = String(t.status === 'done' ? t.actualAmount : t.plannedAmount);
        }

        setPlannedDraft(planned);
        setActualDraft(actual);
        setStep(1);
        setState({ phase: 'ready', data });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'データ取得に失敗しました';
        setState({ phase: 'error', message });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  // 余りはドラフト + 確保状態から実績補完して算出（差額補完）。
  const remaining = useMemo(() => {
    if (state.phase !== 'ready') return null;
    const { monthlyIncomes, tasks } = state.data;
    const incomesForCalc = monthlyIncomes.map((mi) => ({
      ...mi,
      plannedAmount: num(plannedDraft[mi.id] ?? String(mi.plannedAmount)),
      actualAmount: num(actualDraft[mi.id] ?? String(mi.actualAmount)),
    }));
    const tasksForCalc = tasks.map((t) => ({
      ...t,
      plannedAmount: num(plannedDraft[t.id] ?? String(t.plannedAmount)),
      actualAmount: num(actualDraft[t.id] ?? String(t.actualAmount)),
    }));
    return calcReconciledRemaining(incomesForCalc, tasksForCalc);
  }, [state, plannedDraft, actualDraft]);

  // STEP1 → STEP2: 予定額を永続化してから進む。
  const goToStep2 = useCallback(async () => {
    if (state.phase !== 'ready') return;
    setSaving(true);
    try {
      const { monthlyIncomes, tasks } = state.data;
      await Promise.all([
        ...monthlyIncomes.map((mi) =>
          monthlyIncomeRepository.updatePlanned(mi.id, num(plannedDraft[mi.id])),
        ),
        ...tasks.map((t) =>
          monthlyTaskRepository.update(t.id, {
            plannedAmount: num(plannedDraft[t.id]),
          }),
        ),
      ]);
      // ローカルの records にも反映（STEP2 のプリフィル/集計用）
      setState((prev) => {
        if (prev.phase !== 'ready') return prev;
        return {
          phase: 'ready',
          data: {
            ...prev.data,
            monthlyIncomes: prev.data.monthlyIncomes.map((mi) => ({
              ...mi,
              plannedAmount: num(plannedDraft[mi.id]),
            })),
            tasks: prev.data.tasks.map((t) => ({
              ...t,
              plannedAmount: num(plannedDraft[t.id]),
            })),
          },
        };
      });
      setStep(2);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : '予定額の保存に失敗しました',
      });
    } finally {
      setSaving(false);
    }
  }, [state, plannedDraft]);

  // STEP2: 収入の実際額を確定/解除
  const confirmIncome = useCallback(
    async (id: string, nextDone: boolean) => {
      if (state.phase !== 'ready') return;
      const amount = num(actualDraft[id]);
      // optimistic
      setState((prev) => {
        if (prev.phase !== 'ready') return prev;
        return {
          phase: 'ready',
          data: {
            ...prev.data,
            monthlyIncomes: prev.data.monthlyIncomes.map((mi) =>
              mi.id === id
                ? {
                    ...mi,
                    status: nextDone ? 'done' : 'pending',
                    actualAmount: nextDone ? amount : 0,
                  }
                : mi,
            ),
          },
        };
      });
      if (nextDone) setToastOpen(true);
      try {
        if (nextDone) await monthlyIncomeRepository.confirmActual(id, amount);
        else await monthlyIncomeRepository.reset(id);
      } catch (err) {
        console.error('[Allocate] income confirm failed:', err);
      }
    },
    [state, actualDraft],
  );

  // STEP2: 支出タスクの実際額を確保/解除
  const confirmTask = useCallback(
    async (id: string, nextDone: boolean) => {
      if (state.phase !== 'ready') return;
      const amount = num(actualDraft[id]);
      setState((prev) => {
        if (prev.phase !== 'ready') return prev;
        return {
          phase: 'ready',
          data: {
            ...prev.data,
            tasks: prev.data.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: nextDone ? 'done' : 'pending',
                    actualAmount: nextDone ? amount : 0,
                  }
                : t,
            ),
          },
        };
      });
      if (nextDone) setToastOpen(true);
      try {
        if (nextDone) await monthlyTaskRepository.markDone(id, amount);
        else await monthlyTaskRepository.markPending(id);
      } catch (err) {
        console.error('[Allocate] task confirm failed:', err);
      }
    },
    [state, actualDraft],
  );

  if (state.phase === 'loading') return <LoadingView />;
  if (state.phase === 'error') return <ErrorView message={state.message} />;
  if (state.phase === 'empty') return <EmptyView />;

  const { data } = state;

  return (
    <div className="flex flex-col gap-4">
      <StepHeader step={step} isBimonthly={data.isBimonthly} />

      {remaining && (
        <RemainingBanner
          step={step}
          amount={remaining.remaining}
          status={remaining.status}
        />
      )}

      {step === 1 ? (
        <Step1
          data={data}
          plannedDraft={plannedDraft}
          onChange={(id, v) => setPlannedDraft((p) => ({ ...p, [id]: v }))}
        />
      ) : (
        <Step2
          data={data}
          actualDraft={actualDraft}
          onChangeActual={(id, v) => setActualDraft((p) => ({ ...p, [id]: v }))}
          onConfirmIncome={confirmIncome}
          onConfirmTask={confirmTask}
        />
      )}

      {/* footer actions */}
      {step === 1 ? (
        <button
          onClick={goToStep2}
          disabled={saving}
          className="mt-1 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground transition-opacity active:opacity-70 disabled:opacity-50"
        >
          {saving ? '保存中…' : '次へ：振り分けへ'}
        </button>
      ) : (
        <button
          onClick={() => {
            setStep(1);
            window.scrollTo({ top: 0 });
          }}
          className="mt-1 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-border px-6 text-sm font-medium text-muted-foreground transition-colors active:opacity-70"
        >
          ← 予定の確認に戻る
        </button>
      )}

      <CatToast open={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}

// --- sub views --------------------------------------------------------------

function StepHeader({
  step,
  isBimonthly,
}: {
  step: Step;
  isBimonthly: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      {/* 作業猫さん = 振り分けの相棒 */}
      <CatPhoto
        character="sagyo"
        variant={step === 2 ? 'smile' : 'neutral'}
        className="size-14 shrink-0"
        alt="作業猫さん"
      />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className={step === 1 ? 'text-primary' : 'text-muted-foreground'}>
            STEP 1 予定
          </span>
          <span className="text-border">→</span>
          <span className={step === 2 ? 'text-primary' : 'text-muted-foreground'}>
            STEP 2 振り分け
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {step === 1
            ? 'まず予定額を確認します。違う項目だけ直してください。'
            : '実際にいくらだったか入れて、確保していきましょう。'}
          {isBimonthly && ' （2 ヶ月分）'}
        </p>
      </div>
    </div>
  );
}

function RemainingBanner({
  step,
  amount,
  status,
}: {
  step: Step;
  amount: number;
  status: RemainingStatus;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-muted-foreground">
        {step === 1 ? '予定のあと余り' : 'いまのあと余り'}
      </span>
      <span
        className={cn(
          'text-2xl font-bold tabular-nums',
          STATUS_TO_COLOR[status],
        )}
        aria-live="polite"
      >
        {formatYen(amount)}
      </span>
    </div>
  );
}

// 金額入力欄（円）。inputMode numeric 必須（PROJECTSPEC §0）。
function YenInput({
  id,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-muted-foreground">¥</span>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 text-right tabular-nums"
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <h2 className="mt-1 px-1 text-xs font-bold tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

// STEP1: 予定額の確認/調整
function Step1({
  data,
  plannedDraft,
  onChange,
}: {
  data: Loaded;
  plannedDraft: Record<string, string>;
  onChange: (id: string, v: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>収入の予定</SectionTitle>
      <ul className="flex flex-col gap-2">
        {data.monthlyIncomes.map((mi) => (
          <li
            key={mi.id}
            className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm"
          >
            <span className="flex-1 truncate text-sm font-medium text-foreground">
              {data.incomeNames.get(mi.incomeId) ?? '(収入)'}
            </span>
            <YenInput
              id={`planned-${mi.id}`}
              value={plannedDraft[mi.id] ?? ''}
              onChange={(v) => onChange(mi.id, v)}
              ariaLabel={`${data.incomeNames.get(mi.incomeId) ?? '収入'} の予定額`}
            />
          </li>
        ))}
        {data.monthlyIncomes.length === 0 && <EmptyHint>収入が登録されていません</EmptyHint>}
      </ul>

      {data.periodMonths.map((month) => {
        const monthTasks = data.tasks.filter((t) => t.yearMonth === month);
        if (monthTasks.length === 0) return null;
        return (
          <div key={month} className="flex flex-col gap-2">
            <SectionTitle>
              {monthNumber(month)} 月分の支出の予定
            </SectionTitle>
            <ul className="flex flex-col gap-2">
              {monthTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {data.expenseNames.get(t.expenseId) ?? '(支出)'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {data.accountNames.get(t.accountId) ?? ''}
                    </span>
                  </div>
                  <YenInput
                    id={`planned-${t.id}`}
                    value={plannedDraft[t.id] ?? ''}
                    onChange={(v) => onChange(t.id, v)}
                    ariaLabel={`${data.expenseNames.get(t.expenseId) ?? '支出'} の予定額`}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// STEP2: 実際額の入力 + 確保
function Step2({
  data,
  actualDraft,
  onChangeActual,
  onConfirmIncome,
  onConfirmTask,
}: {
  data: Loaded;
  actualDraft: Record<string, string>;
  onChangeActual: (id: string, v: string) => void;
  onConfirmIncome: (id: string, nextDone: boolean) => void;
  onConfirmTask: (id: string, nextDone: boolean) => void;
}): React.JSX.Element {
  const allDone =
    data.monthlyIncomes.every((mi) => mi.status === 'done') &&
    data.tasks.every((t) => t.status === 'done') &&
    data.monthlyIncomes.length + data.tasks.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>実際の入金</SectionTitle>
      <ul className="flex flex-col gap-2">
        {data.monthlyIncomes.map((mi) => (
          <AllocateRow
            key={mi.id}
            label={data.incomeNames.get(mi.incomeId) ?? '(収入)'}
            subLabel="実際にいくら入った？"
            planned={mi.plannedAmount}
            done={mi.status === 'done'}
            actualValue={actualDraft[mi.id] ?? ''}
            onChangeActual={(v) => onChangeActual(mi.id, v)}
            onToggle={(next) => onConfirmIncome(mi.id, next)}
          />
        ))}
      </ul>

      {data.periodMonths.map((month) => {
        const monthTasks = data.tasks.filter((t) => t.yearMonth === month);
        if (monthTasks.length === 0) return null;
        return (
          <div key={month} className="flex flex-col gap-2">
            <SectionTitle>{monthNumber(month)} 月分の支出</SectionTitle>
            <ul className="flex flex-col gap-2">
              {monthTasks.map((t) => (
                <AllocateRow
                  key={t.id}
                  label={data.expenseNames.get(t.expenseId) ?? '(支出)'}
                  subLabel={data.accountNames.get(t.accountId) ?? ''}
                  planned={t.plannedAmount}
                  done={t.status === 'done'}
                  actualValue={actualDraft[t.id] ?? ''}
                  onChangeActual={(v) => onChangeActual(t.id, v)}
                  onToggle={(next) => onConfirmTask(t.id, next)}
                />
              ))}
            </ul>
          </div>
        );
      })}

      {allDone && <AllDoneView />}
    </div>
  );
}

// STEP2 の 1 行: ラベル + 実際額入力 + 確保トグル
function AllocateRow({
  label,
  subLabel,
  planned,
  done,
  actualValue,
  onChangeActual,
  onToggle,
}: {
  label: string;
  subLabel: string;
  planned: number;
  done: boolean;
  actualValue: string;
  onChangeActual: (v: string) => void;
  onToggle: (nextDone: boolean) => void;
}): React.JSX.Element {
  return (
    <li
      className={cn(
        'flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 shadow-sm transition-colors',
        done ? 'bg-status-comfortable/10' : 'bg-card',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            'truncate text-sm font-medium',
            done ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {label}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {subLabel} ・ 予定 {formatYen(planned)}
        </span>
      </div>

      {done ? (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-status-comfortable">
          {formatYen(num(actualValue))}
        </span>
      ) : (
        <YenInput
          id={`actual-${label}`}
          value={actualValue}
          onChange={onChangeActual}
          ariaLabel={`${label} の実際額`}
        />
      )}

      <button
        onClick={() => onToggle(!done)}
        aria-pressed={done}
        aria-label={done ? `${label} の確保を解除` : `${label} を確保`}
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl border-2 transition-colors active:opacity-70',
          done ? 'border-accent bg-accent text-white' : 'border-border text-muted-foreground',
        )}
      >
        {done ? (
          <svg viewBox="0 0 12 12" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        ) : (
          <span className="text-xs font-bold">確保</span>
        )}
      </button>
    </li>
  );
}

function AllDoneView(): React.JSX.Element {
  return (
    <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-8 text-center shadow-sm">
      <CatPhoto character="sagyo" variant="smile" className="size-24" alt="作業猫さん" />
      <p className="font-semibold text-foreground">今月の振り分けはおわり</p>
      <p className="text-sm text-muted-foreground">お疲れさまでした</p>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <li className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
      {children}
    </li>
  );
}

function LoadingView(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex flex-col items-center gap-3 py-16 text-muted-foreground"
    >
      <CatPhoto
        variant="neutral"
        className="size-12 text-brown animate-pulse motion-reduce:animate-none"
      />
      <span className="text-sm">読み込み中…</span>
    </div>
  );
}

function ErrorView({ message }: { message: string }): React.JSX.Element {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl bg-card px-5 py-8 text-center shadow-sm"
    >
      <CatPhoto variant="worried" className="size-14 text-status-over" />
      <p className="text-sm text-status-over">{message}</p>
    </div>
  );
}

function EmptyView(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-5 py-10 text-center shadow-sm">
      <CatPhoto variant="neutral" className="size-16 text-brown" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">まだ登録がありません</p>
        <p className="text-sm text-muted-foreground">
          設定画面から口座・収入・支出を登録してください
        </p>
      </div>
      <Link
        href="/settings"
        className="mt-1 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity active:opacity-70"
      >
        設定画面へ
      </Link>
    </div>
  );
}
