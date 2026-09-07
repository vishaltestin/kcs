"use server";

import { searchSuggestions } from "@/lib/queries/catalog";

/**
 * Navbar live search — a server action rather than an API route, so the
 * client never talks to a bespoke HTTP endpoint.
 */
export async function searchSuggestionsAction(query: string) {
  return searchSuggestions(query);
}
