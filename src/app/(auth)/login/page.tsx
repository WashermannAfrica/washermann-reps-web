'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { BASE_URL, apiErrorMessage } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthBody, AuthHeading } from '@/components/ui/AuthShell';
import type { LoginResponse } from '@/types';

const SALES_REP_ROLE = 'sales_rep';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.replace(searchParams.get('next') ?? '/dashboard');
  }, [isAuthenticated, router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post<LoginResponse>(`${BASE_URL}/auth/login`, {
        identifier: identifier.trim(),
        password,
      });
      const { user, accessToken, refreshToken } = data.data;

      if (!user.roles?.includes(SALES_REP_ROLE)) {
        setError('This account is not a Washermann Rep.');
        return;
      }

      login(user, accessToken, refreshToken);
      router.replace(searchParams.get('next') ?? '/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBody>
      <AuthHeading
        line1="Welcome back"
        line2="Rep"
        subtitle="Sign in to track your referrals and earnings."
      />

      <form onSubmit={handleSubmit} className="mt-12 space-y-5">
        <Input
          label="Email or phone"
          required
          placeholder="you@email.com"
          leftIcon={<Mail size={16} />}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
        />
        <Input
          label="Password"
          required
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          rightIcon={
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-faint hover:text-body">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-body">
        New here? Apply on the{' '}
        {/* Deep-links to the landing's "Who it's for" section with the Sales Rep
            application form auto-opened (WhoItsFor reads ?apply=sales-rep). */}
        <a
          href={`${(process.env.NEXT_PUBLIC_LANDING_PAGE_URL ?? 'https://www.washermann.com').replace(/\/+$/, '')}/?apply=sales-rep#who`}
          className="font-semibold text-primary hover:underline"
        >
          Washermann site
        </a>
        .
      </p>
    </AuthBody>
  );
}
