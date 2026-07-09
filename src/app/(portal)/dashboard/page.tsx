'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Share2, Banknote, Users, Store } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { formatNaira, formatDate, statusTone, titleCase } from '@/lib/utils';
import type { ApiResponse, Dashboard } from '@/types';

// Referrals point vendors to the vendor registration portal. The rep's code is
// appended as ?ref= and the vendor signup form auto-fills it.
const VENDOR_URL = (process.env.NEXT_PUBLIC_VENDOR_URL ?? 'https://vendor.washermann.com').replace(/\/+$/, '');

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<Dashboard>>('/sales-rep/dashboard')
      .then(({ data: res }) => {
        const d = res.data;
        // Onboarding gate — finish tutorial + assessment first.
        if (!d.profile.assessmentPassed) {
          router.replace('/tutorial');
          return;
        }
        setData(d);
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(load, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-primary">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error) return <Card className="text-sm text-danger">{error}</Card>;
  if (!data) return null;

  const { referral, payouts } = data;
  const code = referral.code ?? '—';
  const shareLink = referral.code ? `${VENDOR_URL}/signup?ref=${referral.code}` : '';
  const available = referral.payout.available;
  const hasOpenPayout = payouts.some((p) => p.status === 'pending' || p.status === 'processing');

  async function copy() {
    try {
      await navigator.clipboard.writeText(referral.code ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Your dashboard</h1>
        <p className="mt-1 text-sm text-body">Track referrals and cash out your earnings.</p>
      </div>

      {/* ── Referral code ── */}
      <div className="rounded-3xl bg-forest-deep p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-mint/70">Your referral code</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold tracking-wide text-mint">{code}</span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-mint/70">
            <Share2 size={14} /> Your vendor sign-up link — share it; the code fills in automatically
          </p>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate text-sm text-white/90">{shareLink || '—'}</span>
            <button
              onClick={copyLink}
              disabled={!shareLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-mint px-3 py-1.5 text-sm font-semibold text-forest-deep hover:bg-mint/90 disabled:opacity-50"
            >
              {linkCopied ? <Check size={15} /> : <Copy size={15} />}
              {linkCopied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Earnings ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Available</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(available)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Pending</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(referral.payout.pending)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Paid out</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(referral.payout.paid)}</p>
        </Card>
      </div>

      <div>
        <Button
          size="lg"
          disabled={available <= 0 || hasOpenPayout}
          onClick={() => setPayoutOpen(true)}
        >
          <Banknote size={18} /> Request payout
        </Button>
        {hasOpenPayout && (
          <p className="mt-2 text-sm text-warn">You already have a payout in progress.</p>
        )}
        {available <= 0 && !hasOpenPayout && (
          <p className="mt-2 text-sm text-faint">No available balance yet — keep referring!</p>
        )}
      </div>

      {/* ── Referrals ── */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Your referrals</h2>
          <div className="flex gap-4 text-sm text-body">
            <span className="flex items-center gap-1.5">
              <Users size={15} /> {referral.counts.available + referral.counts.pending + referral.counts.paid} total
            </span>
          </div>
        </div>

        {referral.referrals.length === 0 ? (
          <p className="mt-4 text-sm text-faint">
            No referrals yet. Share your code to start earning.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {referral.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-section text-body">
                    {r.referredType === 'vendor' ? <Store size={16} /> : <Users size={16} />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{r.referredName ?? `${titleCase(r.referredType)} referral`}</p>
                    <p className="text-xs text-faint">{titleCase(r.referredType)} · {formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.rewardAmount != null && r.status !== 'pending' && (
                    <span className="text-sm font-semibold text-ink">{formatNaira(r.rewardAmount)}</span>
                  )}
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Payout history ── */}
      <Card>
        <h2 className="font-semibold text-ink">Payout history</h2>
        {payouts.length === 0 ? (
          <p className="mt-4 text-sm text-faint">No payouts yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{formatNaira(p.amountNaira)}</p>
                  <p className="text-xs text-faint">
                    {formatDate(p.createdAt)} · {p.accountName} · {p.accountNumber}
                  </p>
                </div>
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {payoutOpen && (
        <PayoutModal
          defaults={data.profile.bank}
          onClose={() => setPayoutOpen(false)}
          onDone={() => {
            setPayoutOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function PayoutModal({
  defaults,
  onClose,
  onDone,
}: {
  defaults: { bankCode: string | null; accountNumber: string | null; accountName: string | null };
  onClose: () => void;
  onDone: () => void;
}) {
  const [bankCode, setBankCode] = useState(defaults.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState(defaults.accountNumber ?? '');
  const [accountName, setAccountName] = useState(defaults.accountName ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/sales-rep/payouts/request', {
        bankCode: bankCode.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-ink">Request a payout</h3>
        <p className="mt-1 text-sm text-body">
          We’ll pay out your available balance to this account. Our finance team reviews and
          disburses payouts.
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <Input
            label="Bank code"
            required
            placeholder="e.g. 044"
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
          />
          <Input
            label="Account number"
            required
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <Input
            label="Account name"
            required
            placeholder="Your account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-1 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Request payout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
