import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // In a real app, you might fetch user details from DB here
  // For now we use role from session
  const userName = session.role === 'ADMIN' ? 'Admin User' : 'Receptionist';

  return (
    <DashboardLayout role={session.role} userName={userName}>
      {children}
    </DashboardLayout>
  );
}
