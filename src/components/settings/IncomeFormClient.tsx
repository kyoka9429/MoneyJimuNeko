'use client';

// Income create/edit form client component.
// Validates with incomeDraftSchema (Zod) before writing to IndexedDB.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { incomeRepository } from '@/lib/db/repositories';
import { incomeDraftSchema } from '@/types';
import type { IncomeDraft } from '@/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

type FormErrors = Partial<Record<keyof IncomeDraft | '_form', string>>;

type Props =
  | { mode: 'create'; incomeId?: never }
  | { mode: 'edit'; incomeId: string };

export function IncomeFormClient({ mode, incomeId }: Props): React.JSX.Element {
  const router = useRouter();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [payDay, setPayDay] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !incomeId) return;
    let cancelled = false;
    incomeRepository.findById(incomeId).then((income) => {
      if (cancelled || !income) return;
      setName(income.name);
      setAmount(String(income.amount));
      setPayDay(String(income.payDay));
      setSource(income.source);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, incomeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const draft: IncomeDraft = {
      name: name.trim(),
      amount: parseInt(amount, 10),
      payDay: parseInt(payDay, 10),
      source: source.trim(),
    };

    const result = incomeDraftSchema.safeParse(draft);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof IncomeDraft;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && incomeId) {
        await incomeRepository.update(incomeId, result.data);
      } else {
        await incomeRepository.create(result.data);
      }
      router.push('/settings/incomes');
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setErrors({ _form: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <Field label="名称" htmlFor="income-name" error={errors.name} required>
        <Input
          id="income-name"
          type="text"
          placeholder="例: 月給"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          maxLength={40}
        />
      </Field>

      {/* Amount */}
      <Field label="金額（円）" htmlFor="income-amount" error={errors.amount} required>
        <Input
          id="income-amount"
          type="number"
          inputMode="numeric"
          placeholder="例: 280000"
          min={0}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!errors.amount}
        />
      </Field>

      {/* Pay day */}
      <Field label="入金日" htmlFor="income-pay-day" error={errors.payDay} required>
        <Input
          id="income-pay-day"
          type="number"
          inputMode="numeric"
          placeholder="例: 25"
          min={1}
          max={31}
          step={1}
          value={payDay}
          onChange={(e) => setPayDay(e.target.value)}
          aria-invalid={!!errors.payDay}
        />
      </Field>

      {/* Source */}
      <Field label="収入源" htmlFor="income-source" error={errors.source} required>
        <Input
          id="income-source"
          type="text"
          placeholder="例: 給与"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          aria-invalid={!!errors.source}
          maxLength={40}
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
        disabled={isSubmitting}
        size="lg"
        className="mt-2 w-full"
      >
        {isSubmitting
          ? '保存中…'
          : mode === 'edit'
            ? '変更を保存'
            : '収入項目を追加'}
      </Button>
    </form>
  );
}
