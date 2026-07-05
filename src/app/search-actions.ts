"use server";

import { universalSearch, type UniversalSearchResults } from "@/db/queries";

export async function searchAction(q: string): Promise<UniversalSearchResults> {
  return universalSearch(q);
}
