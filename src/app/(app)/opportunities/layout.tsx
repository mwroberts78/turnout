export default function OpportunitiesLayout({
  children,
  sheet,
}: {
  children: React.ReactNode;
  sheet: React.ReactNode;
}) {
  return (
    <>
      {children}
      {sheet}
    </>
  );
}
