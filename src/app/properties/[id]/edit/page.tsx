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
    <div>
      <Link
        href={`/properties/${property.id}`}
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back to property
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold tracking-tight">
        Edit property
      </h1>
      <PropertyForm
        action={action}
        property={property}
        submitLabel="Save changes"
        cancelHref={`/properties/${property.id}`}
      />
    </div>
  );
}
