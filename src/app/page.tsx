import {
  CreateOrganization,
  OrganizationProfile,
  OrganizationSwitcher,
  Show,
  SignIn,
  SignUp,
  UserButton,
} from '@clerk/nextjs';
import { getCurrentAppUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentAppUser();
  console.log(user);

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <h1 className="text-2xl font-semibold">Turnout</h1>

      <Show when="signed-out">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start">
          <SignIn routing="hash" />
          <SignUp routing="hash" />
        </div>
      </Show>

      <Show when="signed-in">
        <CreateOrganization routing="hash" />
        <div className="flex items-center gap-4">
          {user.status === 'platform-admin' && <OrganizationSwitcher />}
          <UserButton />
        </div>
        {(user.status === 'platform-admin' ||
          (user.status === 'active' && user.role === 'admin')) && (
          <OrganizationProfile routing="hash" />
        )}
      </Show>
    </div>
  );
}
