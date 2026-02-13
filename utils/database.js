import { supabase } from "./config.js";

export const subscribedNewsletterClients = async ({
  cities = [],
  language = null,
  year = null,
  createdAtNull = false,
} = {}) => {
  try {
    let query = supabase
      .from("newsletters")
      .select("id, email, cities, language, created_at, year");

    // Apply conditional filters
    if (language) {
      query = query.eq("language", language);
    }

    if (year) {
      query = query.eq("year", year);
    }

    if (createdAtNull) {
      query = query.is("created_at", null);
    }

    // Fetch data
    let { data, error } = await query;

    if (error) {
      throw error;
    }

    // Filter by cities if provided
    if (cities.length > 0) {
      data = data.filter((client) => {
        const clientCities = client.cities
          ?.split(",")
          .map((c) => c.trim().toLowerCase());
        return (
          Array.isArray(clientCities) &&
          cities.some((city) => clientCities.includes(city.toLowerCase()))
        );
      });
    }

    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching newsletter clients:", error);
  }
};

/**
 * Returns all recipients (id, email) that have the given city in newsletters.cities or search_renting.
 * City matching is case-insensitive; newsletters use comma-separated cities; search_renting uses city or cities.
 */
export const getEmailsByCity = async (city) => {
  if (!city || typeof city !== "string") return [];

  // const normalizedCity = city.trim().toLowerCase();
  // const newsletterRows = await subscribedNewsletterClients({ cities: [normalizedCity] });
  const { data: searchRentingRows, error: searchError } = await supabase
    .from("search_rentings")
    .select("id, email, city");    

  // const fromNewsletters = (newsletterRows || []).map((r) => ({ id: String(r.id), email: r.email }));
  // const searchList = searchError || !searchRentingRows ? [] : searchRentingRows;
  const fromSearchRenting = searchRentingRows
    .filter((r) => {
      return r.city.toLowerCase().includes(city.toLowerCase());
    });
    
  const byEmail = new Map();
  // fromNewsletters.forEach((r) => byEmail.set(r.email.toLowerCase(), r));
  fromSearchRenting.forEach((r) => byEmail.set(r.email.toLowerCase(), r));
  return Array.from(byEmail.values());
};