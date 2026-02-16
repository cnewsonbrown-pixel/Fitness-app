'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, DollarSign, RefreshCw, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { billingApi, PaymentMethod, Subscription } from '@/lib/api/billing.api';
import { membersApi } from '@/lib/api/members.api';
import { Payment } from '@/types';
import { formatCurrency } from '@/lib/utils';

const subscriptionStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  PAST_DUE: 'bg-red-100 text-red-800',
};

const paymentStatusColors: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function MemberBillingPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const { data: member, isLoading: memberLoading, error: memberError } = useQuery({
    queryKey: ['members', memberId],
    queryFn: () => membersApi.getById(memberId),
  });

  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ['billing', 'members', memberId],
    queryFn: () => billingApi.getMemberBilling(memberId),
    enabled: !!member,
  });

  const isLoading = memberLoading || billingLoading;

  if (isLoading) return <LoadingPage />;
  if (memberError || !member) return <ErrorPage message="Member not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${member.firstName} ${member.lastName}`}
          description="Billing & Payment History"
        >
          <Button variant="outline" onClick={() => router.push(`/members/${memberId}`)}>
            View Profile
          </Button>
        </PageHeader>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Spent"
          value={formatCurrency(billing?.totalSpent || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Active Subscriptions"
          value={billing?.subscriptions.filter((s) => s.status === 'ACTIVE').length || 0}
          icon={RefreshCw}
        />
        <StatCard
          title="Payment Methods"
          value={billing?.paymentMethods.length || 0}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billing?.paymentMethods && billing.paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {billing.paymentMethods.map((pm: PaymentMethod) => (
                  <div key={pm.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {pm.brand || pm.type} •••• {pm.last4}
                        </p>
                        {pm.expiryMonth && pm.expiryYear && (
                          <p className="text-sm text-muted-foreground">
                            Expires {pm.expiryMonth}/{pm.expiryYear}
                          </p>
                        )}
                      </div>
                    </div>
                    {pm.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment methods on file</p>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billing?.subscriptions && billing.subscriptions.length > 0 ? (
              <div className="space-y-3">
                {billing.subscriptions.map((sub: Subscription) => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{sub.membershipTypeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(sub.amount)}/{sub.interval.toLowerCase().slice(0, -2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.cancelAtPeriodEnd
                          ? `Cancels ${format(new Date(sub.currentPeriodEnd), 'MMM d')}`
                          : `Renews ${format(new Date(sub.currentPeriodEnd), 'MMM d')}`}
                      </p>
                    </div>
                    <StatusBadge status={sub.status} colorMap={subscriptionStatusColors} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No active subscriptions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billing?.recentPayments && billing.recentPayments.length > 0 ? (
            <div className="space-y-3">
              {billing.recentPayments.map((payment: Payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <StatusBadge status={payment.status} colorMap={paymentStatusColors} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payment history</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
