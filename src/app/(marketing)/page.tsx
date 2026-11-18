import { auth } from '@clerk/nextjs/server';
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';
import { Button } from '@/components/base-ui/button';
import { Card, CardContent } from '@/components/base-ui/card';
import { APP_NAME } from '@/lib/constants/app';

const features: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ClipboardList,
    title: 'Post opportunities',
    body: 'In-person, virtual, or skills-based. Set capacity, offer meals and t-shirts, and publish when you are ready.',
  },
  {
    icon: CalendarCheck,
    title: 'Sign up in seconds',
    body: 'Employees browse what is coming up, filter by type or open spots, and sign up from their laptop or phone.',
  },
  {
    icon: FolderKanban,
    title: 'Group into projects',
    body: 'Bundle related events, like a week of service, so people can find everything in one place.',
  },
  {
    icon: BarChart3,
    title: 'See your impact',
    body: 'Volunteers log their hours. Admins see participation, hours by opportunity, project, and person, and export to CSV.',
  },
];

const steps = [
  {
    title: 'Admins post',
    body: 'Create opportunities and projects for your company.',
  },
  {
    title: 'Employees join',
    body: 'Everyone in your organization can browse and sign up.',
  },
  {
    title: 'Everyone sees the results',
    body: 'Hours and participation roll up into reports automatically.',
  },
];

export default async function MarketingHomePage(): Promise<React.ReactNode> {
  const { userId } = await auth();

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Make it easy for your people to show up.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          {APP_NAME} gives your company one place to post volunteer
          opportunities, let employees sign up in a couple of clicks, and see
          the hours your teams give back.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {userId ? (
            <Button
              size="lg"
              render={<Link href="/dashboard" />}
              nativeButton={false}
            >
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                render={<Link href="/sign-up" />}
                nativeButton={false}
              >
                Get started
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/sign-in" />}
                nativeButton={false}
              >
                Sign in
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="space-y-3">
                <div className="w-fit rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="space-y-2 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
