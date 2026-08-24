import type React from 'react';

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold">Marketing Layout</h1>
      {children}
    </div>
  );
}
