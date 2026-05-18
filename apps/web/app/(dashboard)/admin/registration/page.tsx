import PendingRegistrations from "@/app/components/dashboard/PendingRegistrations";

export const metadata = {
  title: "Pending Registrations — VisitorPass",
};

export default function AdminRegistrationPage() {
  return <PendingRegistrations roleBadge="Admin" />;
}
