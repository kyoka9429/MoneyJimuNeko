'use client';

// Account create/edit form client component.
// Validates with accountDraftSchema (Zod) before writing to IndexedDB.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountRepository } from '@/lib/db/repositories';
import { accountDraftSchema, ACCOUNT_TYPES } from '@/types';
import type { AccountDraft } from '@/types';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/button';
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_COLOR_PRESETS,
} from '@/components/settings/labels';
import { cn } from '@/lib/utils';

const DEFAULT_COLOR = ACCOUNT_COLOR_PRESETS[0];

type FormErrors = Partial<Record<keyof AccountDraft | '_form', string>>;

type Props =
  | { mode: 'create'; accountId?: never }
  | { mode: 'edit'; accountId: string };

export function AccountFormClient({ mode, accountId }: Props): React.JSX.Element {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountDraft['type']>('bank');
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data for edit mode（unmount 後の setState を防ぐため cancelled flag を使う）
  useEffect(() => {
    if (mode !== 'edit' || !accountId) return;
    let cancelled = false;
    accountRepository.findById(accountId).then((account) => {
      if (cancelled || !account) return;
      setName(account.name);
      setType(account.type);
      setColor(account.color);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, accountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const draft: AccountDraft = { name: name.trim(), type, color };
    const result = accountDraftSchema.safeParse(draft);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AccountDraft;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && accountId) {
        await accountRepository.update(accountId, result.data);
      } else {
        await accountRepository.create(result.data);
      }
      router.push('/settings/accounts');
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
      <Field label="口座名" htmlFor="account-name" error={errors.name} required>
        <Input
          id="account-name"
          type="text"
          placeholder="例: みずほ銀行"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          maxLength={40}
        />
      </Field>

      {/* Type */}
      <Field label="種別" htmlFor="account-type" error={errors.type} required>
        <Select
          id="account-type"
          value={type}
          onChange={(e) => setType(e.target.value as AccountDraft['type'])}
          aria-invalid={!!errors.type}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>

      {/* Color */}
      <Field label="カラー" htmlFor="account-color" error={errors.color}>
        <div className="flex flex-col gap-3">
          {/* Preset chips */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="カラーのプリセット">
            {ACCOUNT_COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={`カラー ${preset}`}
                aria-pressed={color === preset}
                onClick={() => setColor(preset)}
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform',
                  color === preset && 'scale-110',
                )}
              >
                <span
                  className={cn(
                    'block h-7 w-7 rounded-full border-2',
                    color === preset
                      ? 'border-foreground'
                      : 'border-transparent',
                  )}
                  style={{ backgroundColor: preset }}
                />
              </button>
            ))}
          </div>
          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <input
              id="account-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="カスタムカラー"
              className="h-9 w-9 cursor-pointer rounded border border-border bg-card"
            />
            <span className="font-mono text-sm text-muted-foreground">{color}</span>
          </div>
        </div>
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
            : '口座を追加'}
      </Button>
    </form>
  );
}
