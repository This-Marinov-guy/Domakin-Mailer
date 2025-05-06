import { supabase } from "./config.js";

export const subscribedNewsletterClients = async (cities = []) => {
  try {
    let { data, error } = await supabase
      .from("newsletters")
      .select("id, email, cities"); // Ensure 'cities' is selected

    if (error) {
      throw error;
    }

    if (cities.length > 0) {
      data = data.filter((client) => {
        const clientCities = client.cities
          ?.split(",") // split string by comma
          .map((c) => c.trim().toLowerCase()); // clean up each city

        return (
          Array.isArray(clientCities) &&
          cities.some((city) => clientCities.includes(city.toLowerCase()))
        );
      });
    }

    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching newsletter clients", error);
  }
};
