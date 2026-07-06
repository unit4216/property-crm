import { NotFoundCard } from "@/components/not-found-card";

export default function NotFound() {
  return (
    <NotFoundCard
      entity="Property"
      backHref="/properties"
      backLabel="Back to properties"
    />
  );
}
