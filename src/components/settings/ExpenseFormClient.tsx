'use client';

// Expense create/edit form client component.
// Validates with expenseDraftSchema (Zod) before writing to IndexedDB.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accountRepository, expenseRepository } from '@/lib/db/repositories';
import {
  expenseDraftSchema,
  EXPENSE_CATEGORIES,
  EXPENSE_FREQUENCIES,
} from '@/types';
import type { Account, ExpenseDraft } from '@/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCY_LABELS,
} from '@/components/settings/labels';

type FormErrors = Partial<Record<keyof ExpenseDraft | '_form', string>>;

type Props =
  | { mode: 'create'; expenseId?: never }
  | { mode: 'edit'; expenseId: string };

export function ExpenseFormClient({ mode, expenseId }: Props): React.JSX.Element {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [category, setCategory] = useState<ExpenseDraft['category']>('other');
  const [frequency, setFrequency] = useState<ExpenseDraft['frequency']>('monthly');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const accs = await accountRepository.list();
      if (cancelled) return;
      setAccounts(accs);

      if (mode === 'edit' && expenseId) {
        const expense = await expenseRepository.findById(expenseId);
        if (cancelled) return;
        if (expense) {
          setName(expense.name);
          setAmount(String(expense.amount));
          setAccountId(expense.accountId);
          setDueDay(expense.dueDay !== undefined ? String(expense.dueDay) : '');
          setCategory(expense.category);
          setFrequency(expense.frequency);
        }
      } else if (accs.length > 0) {
        // Default to first account for new records
        setAccountId(accs[0].id);
      }
      setIsLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, expenseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsedAmount = parseInt(amount, 10);
    const parsedDueDay = dueDay ? parseInt(dueDay, 10) : undefined;

    const draft: ExpenseDraft = {
      name: name.trim(),
      amount: parsedAmount,
      accountId,
      dueDay: parsedDueDay,
      category,
      frequency,
    };

    const result = expenseDraftSchema.safeParse(draft);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ExpenseDraft;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && expenseId) {
        await expenseRepository.update(expenseId, result.data);
      } else {
        await expenseRepository.create(result.data);
      }
      router.push('/settings/expenses');
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setErrors({ _form: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // No accounts — prompt to create one
  if (isLoaded && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-5 py-10 text-center shadow-sm">
        <p className="font-semibold text-foreground">口座が登録されていません</p>
        <p className="text-sm text-muted-foreground">
          支出項目を追加するには、先に口座を登録してください
        </p>
        <Link
          href="/settings/accounts/new"
          className="mt-1 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity active:opacity-70"
        >
          口座を追加する
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <Field label="名称" htmlFor="expense-name" error={errors.name} required>
        <Input
          id="expense-name"
          type="text"
          placeholder="例: 電気代"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          maxLength={40}
        />
      </Field>

      {/* Amount */}
      <Field label="金額（円）" htmlFor="expense-amount" error={errors.amount} required>
        <Input
          id="expense-amount"
          type="number"
          inputMode="numeric"
          placeholder="例: 8000"
          min={0}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!errors.amount}
        />
      </Field>

      {/* Account */}
      <Field label="引き落とし口座" htmlFor="expense-account" error={errors.accountId} required>
        <Select
          id="expense-account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          aria-invalid={!!errors.accountId}
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </Select>
      </Field>

      {/* Category */}
      <Field label="カテゴリ" htmlFor="expense-category" error={errors.category} required>
        <Select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseDraft['category'])}
          aria-invalid={!!errors.category}
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {EXPENSE_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>
      </Field>

      {/* Frequency */}
      <Field label="周期" htmlFor="expense-frequency" error={errors.frequency} required>
        <Select
          id="expense-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as ExpenseDraft['frequency'])}
          aria-invalid={!!errors.frequency}
        >
          {EXPENSE_FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {EXPENSE_FREQUENCY_LABELS[freq]}
            </option>
          ))}
        </Select>
      </Field>

      {/* Due day (optional) */}
      <Field label="引き落とし日（任意）" htmlFor="expense-due-day" error={errors.dueDay}>
        <Input
          id="expense-due-day"
          type="number"
          inputMode="numeric"
          placeholder="例: 27"
          min={1}
          max={31}
          step={1}
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          aria-invalid={!!errors.dueDay}
        />
      </Field>

      {errors._form && (
        <p role="alert" className="text-sm text-status-over">
          {errors._form}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting || !isLoaded}
        size="lg"
        className="mt-2 w-full"
      >
        {isSubmitting
          ? '保存中…'
          : mode === 'edit'
            ? '変更を保存'
            : '支出項目を追加'}
      </Button>
    </form>
  );
}
