import ActiveVisitorsDashboard from "@/app/components/dashboard/ActiveVisitorsDashboard";

export const metadata = {
  title: "Receptionist Live Dashboard — VisitorPass",
};

export default function ReceptionistDashboardPage() {
  return <ActiveVisitorsDashboard roleBadge="Receptionist" rolePath="receptionist" />;
}
