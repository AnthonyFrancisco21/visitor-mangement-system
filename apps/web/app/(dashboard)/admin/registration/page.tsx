import RegistrationDashboard from "@/app/components/dashboard/RegistrationDashboard";

export const metadata = {
  title: "Visitor Registration — VisitorPass",
};

export default function AdminRegistrationPage() {
  return <RegistrationDashboard roleBadge="Admin" />;
}
