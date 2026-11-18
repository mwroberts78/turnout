import { CalendarCheck, History } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { Button } from '@/components/base-ui/button';
import { Card, CardContent } from '@/components/base-ui/card';
import { findSignUpsForUser } from '@/lib/dal/signUp';
import { MySignupCard } from './my-signup-card';

function SignupGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

export async function MySignupsSection({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const signUps = await findSignUpsForUser(tenantId, userId);
  const now = new Date();

  const upcoming = signUps.filter((s) => s.opportunity.startTime > now);
  // Most recent first for history.
  const past = signUps.filter((s) => s.opportunity.startTime <= now).reverse();

  return (
    <div className="space-y-8">
      <SignupGroup
        title="Upcoming"
        icon={<CalendarCheck className="size-4 text-muted-foreground" />}
      >
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted-foreground">
              You don't have any upcoming signups.
              <Button
                size="sm"
                render={<Link href="/opportunities" />}
                nativeButton={false}
              >
                Browse opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcoming.map((signUp) => (
              <MySignupCard key={signUp.id} signUp={signUp} isUpcoming />
            ))}
          </div>
        )}
      </SignupGroup>

      <SignupGroup
        title="Past"
        icon={<History className="size-4 text-muted-foreground" />}
      >
        {past.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Opportunities you've taken part in will show up here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {past.map((signUp) => (
              <MySignupCard
                key={signUp.id}
                signUp={signUp}
                isUpcoming={false}
              />
            ))}
          </div>
        )}
      </SignupGroup>
    </div>
  );
}
