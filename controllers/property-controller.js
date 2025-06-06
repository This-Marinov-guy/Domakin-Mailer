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

export const getPropertyById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const property_data = await fetchPropertyById(id);

    res.json(property_data);
  } catch (err) {
    return next(new HttpError(err.message || err, 500));
  }
};
