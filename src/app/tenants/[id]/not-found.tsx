import { NotFoundCard } from "@/components/not-found-card";

export default function NotFound() {
  return (
    <NotFoundCard
      entity="Tenant"
      backHref="/tenants"
      backLabel="Back to tenants"
    />
  );
}
