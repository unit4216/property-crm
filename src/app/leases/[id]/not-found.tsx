import { NotFoundCard } from "@/components/not-found-card";

export default function NotFound() {
  return (
    <NotFoundCard entity="Lease" backHref="/leases" backLabel="Back to leases" />
  );
}
