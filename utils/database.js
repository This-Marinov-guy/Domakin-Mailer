import { supabase } from "./config.js";

export const subscribedNewsletterClients = async (withCity = false) => {
  try {
    const { data, error } = await supabase
      .from("newsletters")
      .select("id, email");
    
    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching newsletter clients", error);
  }
};
