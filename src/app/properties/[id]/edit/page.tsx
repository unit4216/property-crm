import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/db/queries";
import { updateProperty } from "../../actions";
import { PropertyForm } from "../../property-form";

export const metadata = { title: "Edit property · Property CRM" };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  // Bind the id so the form sees the standard (prevState, formData) signature.
  const action = updateProperty.bind(null, property.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/properties/${property.id}`}
        className="text-sm text-ink-muted hover:text-ink"
      >
        ← Back to property
      </Link>
      <h1 className="mb-6 mt-3 text-3xl font-semibold tracking-tight">
        Edit property
      </h1>
      <PropertyForm
        action={action}
        property={property}
        submitLabel="Save changes"
        cancelHref={`/properties/${property.id}`}
        successHref={`/properties/${property.id}`}
      />
    </div>
  );
}
