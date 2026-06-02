import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountsDashboard from "@/app/components/dashboard/AccountsDashboard";

export const metadata = {
  title: "Admin Accounts Management — VisitorPass",
};

export default async function AdminAccountsPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <AccountsDashboard currentUserId={session.userId} initialUsers={users} />
  );
}
