import { supabase } from "./config.js";
import type { NewsletterRow, SearchRentingRow } from "../types/index.js";

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
  city: string
): Promise<(NewsletterRow | SearchRentingRow)[]> => {
  if (!city || typeof city !== "string") return [];

  const { data: searchRentingRows } = await supabase
    .from("search_rentings")
    .select("id, email, city");

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
