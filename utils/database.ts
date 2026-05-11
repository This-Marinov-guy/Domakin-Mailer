import { supabase } from "./config.js";
import type { NewsletterRow, RentingRow, SearchRentingRow } from "../types/index.js";

export const subscribedNewsletterClients = async ({
  cities = [],
  language = null,
  year = null,
  createdAtNull = false,
}: {
  cities?: string[];
  language?: string | null;
  year?: number | null;
  createdAtNull?: boolean;
} = {}): Promise<NewsletterRow[] | undefined> => {
  try {
    let query = supabase
      .from("newsletters")
      .select("id, email, cities, language, created_at, year");

    if (language) {
      query = query.eq("language", language);
    }

    if (year) {
      query = query.eq("year", year);
    }

    if (createdAtNull) {
      query = query.is("created_at", null);
    }

    let { data, error } = await query;

    if (error) {
      throw error;
    }

    if (cities.length > 0) {
      data = (data ?? []).filter((client) => {
        const clientCities = client.cities
          ?.split(",")
          .map((c: string) => c.trim().toLowerCase());
        return (
          Array.isArray(clientCities) &&
          cities.some((city) => clientCities.includes(city.toLowerCase()))
        );
      });
    }

    console.log(data);
    return data as NewsletterRow[];
  } catch (error) {
    console.error("Error fetching newsletter clients:", error);
  }
};

/**
 * Returns all recipients (id, email) that have the given city in newsletters.cities or search_renting.
 */
export const getEmailsByCity = async (
  city: string,
  interfaceName: string | null = null
): Promise<(NewsletterRow | SearchRentingRow)[]> => {
  if (!city || typeof city !== "string") return [];

  let searchRentingQuery = supabase
    .from("search_rentings")
    .select("id, email, city");
  if (interfaceName) {
    searchRentingQuery = searchRentingQuery.eq("interface", interfaceName);
  }
  const { data: searchRentingRows } = await searchRentingQuery;

  const { data: newsletterRows } = await supabase
    .from("newsletters")
    .select("id, email, cities");

  const fromSearchRenting: SearchRentingRow[] = (searchRentingRows ?? []).filter(
    (r: SearchRentingRow) => r.city.toLowerCase().includes(city.toLowerCase())
  );

  const fromNewsletters: NewsletterRow[] = (newsletterRows ?? []).filter(
    (r: NewsletterRow) => r.cities.toLowerCase().includes(city.toLowerCase())
  );

  const byEmail = new Map<string, NewsletterRow | SearchRentingRow>();
  fromNewsletters.forEach((r) => byEmail.set(r.email.toLowerCase(), r));
  fromSearchRenting.forEach((r) => byEmail.set(r.email.toLowerCase(), r));
  return Array.from(byEmail.values());
};

export const getAllSearchRentingEmails = async (): Promise<SearchRentingRow[]> => {
  const { data, error } = await supabase
    .from("search_rentings")
    .select("id, email, city");
  if (error) throw new Error(error.message || "Failed to fetch search_rentings");
  return (data ?? []) as SearchRentingRow[];
};

export const getSearchRentingEmailsCreatedBefore = async (
  isoDate: string
): Promise<SearchRentingRow[]> => {
  const { data, error } = await supabase
    .from("search_rentings")
    .select("id, email, city")
    .lt("created_at", isoDate);
  if (error) throw new Error(error.message || "Failed to fetch search_rentings");
  return (data ?? []) as SearchRentingRow[];
};

export const getRentingEmailsCreatedBefore = async (
  isoDate: string
): Promise<RentingRow[]> => {
  const { data, error } = await supabase
    .from("rentings")
    .select("id, email")
    .lt("created_at", isoDate);
  if (error) throw new Error(error.message || "Failed to fetch rentings");
  return (data ?? []) as RentingRow[];
};

export const getNewsletterEmailsBeforeYear = async (
  year: number
): Promise<NewsletterRow[]> => {
  const { data, error } = await supabase
    .from("newsletters")
    .select("id, email, cities, language, created_at, year")
    .lt("year", year);
  if (error) throw new Error(error.message || "Failed to fetch newsletters");
  return (data ?? []) as NewsletterRow[];
};
