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