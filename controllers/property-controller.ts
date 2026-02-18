import type { Request, Response, NextFunction } from "express";
import { supabase } from "../utils/config.js";
import HttpError from "../models/Http-error.js";
import { extractStreetName } from "../utils/helpers.js";
import type { RoomEmailData } from "../types/index.js";

export const fetchPropertyById = async (
  id: string,
  language = "en"
): Promise<RoomEmailData> => {
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
    room_link: "",
  };
};

export const fetchOneProperty = async (language = "en"): Promise<RoomEmailData> => {
  const { data, error } = await supabase
    .from("properties")
    .select("property_data(id, title, city, address, rent, flatmates, period, images), link")
    .limit(1)
    .single();

  if (error || !data) throw new Error(error?.message || "No property found");

  const pd = Array.isArray(data.property_data) ? data.property_data[0] : data.property_data;

  return {
    room_title: pd.title[language],
    room_city: pd.city,
    room_location: extractStreetName(pd.address),
    room_rent: pd.rent,
    room_period: pd.period[language],
    room_flatmates: pd.flatmates[language],
    room_image_src: (pd.images || "").split(",")[0],
    room_link: (data as Record<string, unknown>).link as string,
  };
};

export const fetchAllPropertiesWithLinkAndStatus2 = async (
  language = "en"
): Promise<RoomEmailData[]> => {
  const { data: rows, error } = await supabase
    .from("properties")
    .select("link, property_data(id, title, city, address, rent, flatmates, period, images)")
    .eq("status", 2)
    .not("link", "is", null);

  if (error) throw new Error(error.message || "Failed to fetch properties");
  if (!rows || rows.length === 0) return [];

  return rows
    .filter((r) => {
      const pd = Array.isArray(r.property_data) ? r.property_data[0] : r.property_data;
      return r.link && pd;
    })
    .map((r) => {
      const pd = Array.isArray(r.property_data) ? r.property_data[0] : r.property_data;
      return {
        link: r.link,
        room_link: r.link as string,
        room_title: pd.title?.[language],
        room_city: pd.city,
        room_location: extractStreetName(pd.address),
        room_rent: pd.rent,
        room_period: pd.period?.[language],
        room_flatmates: pd.flatmates?.[language],
        room_image_src: (pd.images || "").split(",")[0],
      } as RoomEmailData;
    });
};

export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return next(new HttpError("Missing property id", 400));

  try {
    const property_data = await fetchPropertyById(id);
    res.json(property_data);
  } catch (err) {
    return next(new HttpError((err as Error).message || String(err), 500));
  }
};
