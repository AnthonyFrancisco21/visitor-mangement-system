import ActiveVisitorsDashboard from "@/app/components/dashboard/ActiveVisitorsDashboard";

export const metadata = {
  title: "Admin Live Dashboard — VisitorPass",
};

export default function AdminDashboardPage() {
  return <ActiveVisitorsDashboard roleBadge="Admin" rolePath="admin" />;
}
