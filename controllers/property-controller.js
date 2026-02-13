import { supabase } from "../utils/config.js";

import HttpError from "../models/Http-error.js";
import { extractStreetName } from "../utils/helpers.js";

export const fetchPropertyById = async (id, language = "en") => {
  if (!id) throw new Error("No property id provided");

  const { data, error } = await supabase
    .from("property_data")
    .select("title, city, address, rent, flatmates, period, images")
    .eq("property_id", id)
    .single();
  if (error) throw new Error(error.message || "Failed to fetch property");

  return {
    room_title: data.title[language],
    room_city: data.city,
    room_location: extractStreetName(data.address),
    room_rent: data.rent,
    room_period: data.period[language],
    room_flatmates: data.flatmates[language],
    room_image_src: data.images.split(",")[0],
  };
};

/**
 * Fetches one property from the database (for emails, etc.).
 * Returns same room_* shape as fetchPropertyById plus room_link.
 */
export const fetchOneProperty = async (language = "en") => {
  const { data, error } = await supabase
    .from("properties")
    .select("property_data(id, title, city, address, rent, flatmates, period, images), link")
    .limit(1)
    .single();
  if (error || !data) throw new Error(error?.message || "No property found");  

  
  return {
    room_title: data.property_data[0].title[language],
    room_city: data.property_data[0].city,
    room_location: extractStreetName(data.property_data[0].address),
    room_rent: data.property_data[0].rent,
    room_period: data.property_data[0].period[language],
    room_flatmates: data.property_data[0].flatmates[language],
    room_image_src: (data.property_data[0].images || "").split(",")[0],
    room_link: data.link,
  };
};

/**
 * Fetches all properties that have link and status = 2.
 * Returns array of { link, room_link, room_title, room_city, room_location, room_rent, room_period, room_flatmates, room_image_src } for each.
 */
export const fetchAllPropertiesWithLinkAndStatus2 = async (language = "en") => {
  const { data: rows, error } = await supabase
    .from("properties")
    .select("link, property_data(id, title, city, address, rent, flatmates, period, images)")
    .eq("status", 2)
    .not("link", "is", null);

  if (error) throw new Error(error.message || "Failed to fetch properties");
  if (!rows || rows.length === 0) return [];

  return rows
    .filter((r) => r.link && r.property_data && (Array.isArray(r.property_data) ? r.property_data[0] : r.property_data))
    .map((r) => {
      const pd = Array.isArray(r.property_data) ? r.property_data[0] : r.property_data;
      return {
        link: r.link,
        room_link: r.link,
        room_title: pd.title?.[language],
        room_city: pd.city,
        room_location: extractStreetName(pd.address),
        room_rent: pd.rent,
        room_period: pd.period?.[language],
        room_flatmates: pd.flatmates?.[language],
        room_image_src: (pd.images || "").split(",")[0],
      };
    });
};

export const getPropertyById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const property_data = await fetchPropertyById(id);

    res.json(property_data);
  } catch (err) {
    return next(new HttpError(err.message || err, 500));
  }
};
