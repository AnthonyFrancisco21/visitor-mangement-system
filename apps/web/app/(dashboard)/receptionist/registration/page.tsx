import RegistrationDashboard from "@/app/components/dashboard/RegistrationDashboard";

export const metadata = {
  title: "Visitor Registration — VisitorPass",
};

export default function ReceptionistRegistrationPage() {
  return <RegistrationDashboard roleBadge="Receptionist" />;
}
