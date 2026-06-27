'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, PartyPopper } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { ApiResponse, Assessment, AssessmentResult } from '@/types';

export default function AssessmentPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AssessmentResult | null>(null);

  function load() {
    setLoading(true);
    setResult(null);
    setAnswers({});
    api
      .get<ApiResponse<Assessment>>('/sales-rep/assessment')
      .then(({ data }) => setAssessment(data.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submit() {
    if (!assessment) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post<ApiResponse<AssessmentResult>>('/sales-rep/assessment/submit', {
        answers,
      });
      setResult(data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── Result screen ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto max-w-md py-6">
        <Card className="text-center">
          {result.passed ? (
            <>
              <PartyPopper className="mx-auto text-primary" size={44} />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">You passed! 🎉</h1>
              <p className="mt-2 text-[15px] text-body">
                You scored {result.scorePct}% — welcome to the team.
              </p>
              {result.code && (
                <div className="mt-6 rounded-2xl bg-mint-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-forest/60">
                    Your referral code
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-wide text-forest">{result.code}</p>
                </div>
              )}
              <Button size="lg" className="mt-6 w-full" onClick={() => router.replace('/dashboard')}>
                Go to dashboard
              </Button>
            </>
          ) : (
            <>
              <XCircle className="mx-auto text-danger" size={44} />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Not quite there</h1>
              <p className="mt-2 text-[15px] text-body">
                You scored {result.scorePct}%. You need {result.passMark}% to pass — you can retake it
                as many times as you like.
              </p>
              <Button size="lg" className="mt-6 w-full" onClick={load}>
                Retake assessment
              </Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────────
  const questions = assessment?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-faint">Assessment</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Show what you’ve learned</h1>
      <p className="mt-1 text-sm text-body">Pass mark: {assessment?.passMark ?? 70}%</p>

      <div className="mt-6 flex flex-col gap-5">
        {questions.map((q, qi) => (
          <Card key={q.id}>
            <p className="font-semibold text-ink">
              {qi + 1}. {q.prompt}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                      selected
                        ? 'border-primary bg-mint-soft text-forest'
                        : 'border-line bg-white text-body hover:bg-section',
                    )}
                  >
                    <CheckCircle2
                      size={18}
                      className={selected ? 'text-primary' : 'text-line'}
                    />
                    {opt}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <Button
        size="lg"
        className="mt-6 w-full"
        loading={submitting}
        disabled={!allAnswered}
        onClick={submit}
      >
        {allAnswered ? 'Submit answers' : 'Answer all questions to submit'}
      </Button>
    </div>
  );
}
