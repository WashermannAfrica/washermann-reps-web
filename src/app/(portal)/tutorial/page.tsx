'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiResponse, TutorialStep } from '@/types';

export default function TutorialPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<ApiResponse<TutorialStep[]>>('/sales-rep/tutorial')
      .then(({ data }) => setSteps(data.data ?? []))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) return <Card className="text-sm text-danger">{error}</Card>;
  if (steps.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-body">No tutorial is available right now.</p>
        <Button className="mt-4" onClick={() => router.push('/assessment')}>
          Continue to assessment
        </Button>
      </Card>
    );
  }

  const step = steps[i];
  const isLast = i === steps.length - 1;

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-faint">
        Onboarding · Step {i + 1} of {steps.length}
      </p>

      {/* progress dots */}
      <div className="mt-4 flex gap-1.5">
        {steps.map((s, idx) => (
          <span
            key={s.id}
            className={`h-1.5 flex-1 rounded-full ${idx <= i ? 'bg-primary' : 'bg-section'}`}
          />
        ))}
      </div>

      <Card className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{step.title}</h1>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-body">{step.body}</p>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>
          <ArrowLeft size={16} /> Back
        </Button>
        {isLast ? (
          <Button onClick={() => router.push('/assessment')}>
            Start assessment <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}>
            Next <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
