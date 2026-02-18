/**
 * Example context objects for each email template.
 * Use with renderEmailTemplate() or sendTemplatedEmail().
 * Asset URLs come from utils/images.js (Cloudinary).
 */

import { BACKGROUNDS, LOGOS, ICONS, SOCIAL_ICONS } from "./images.ts";

const BASE_URL = process.env.HOST_URL || "https://domakin.nl";

/** Shared defaults for all templates (assets from utils/images.js, footer, unsubscribe) */
const shared = {
  base_url: BASE_URL,
  hero_background_url: BACKGROUNDS[1],
  logo_url: LOGOS.domakin,
  home_url: "https://www.domakin.nl",
  contact_url: "https://www.domakin.nl/contact",
  linkedin_icon_url: SOCIAL_ICONS.linkedin,
  instagram_icon_url: SOCIAL_ICONS.instagram,
  facebook_icon_url: SOCIAL_ICONS.facebook,
  icon_documents_url: ICONS.documents,
  icon_user_url: ICONS.user,
  icon_house_url: ICONS.house,
  icon_cash_url: ICONS.cash,
  icon_location_url: ICONS.location,
  icon_calendar_url: ICONS.calendar,
  icon_box_url: ICONS.box,
  icon_payment_url: ICONS.payment,
  unsubscribe_text: "Changed your mind? You can",
  unsubscribe_link_text: "unsubscribe at any time.",
};

/**
 * departure-list-your-room.html
 * Variables: user_name, departure_date, room_address, room_city, days_left, list_room_url, unsubscribe_link + shared
 */
export function departureListYourRoomData(receiver, overrides = {}) {
  const unsubscribeLink = `${BASE_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id || ""}`;
  return {
    ...shared,
    hero_title: "Your departure date is approaching!",
    hero_subtitle: "List your room and help the next tenant find their home.",
    user_name: receiver.name || "there",
    departure_date: overrides.departure_date || "2025-03-01",
    room_address: overrides.room_address || "Sample Street 123",
    room_city: overrides.room_city || "Amsterdam",
    days_left: overrides.days_left ?? 14,
    body_message:
      "Leaving your rental? List your room now so your landlord can find a replacement on time — and help a fellow tenant settle in smoothly.",
    benefit_1_title: "Free listing",
    benefit_1_text: "It takes less than 5 minutes to publish your room",
    benefit_2_title: "Reach verified tenants",
    benefit_2_text: "Your listing reaches students and professionals looking for housing",
    benefit_3_title: "Smooth handover",
    benefit_3_text: "We help coordinate the transition with your landlord",
    list_room_url: overrides.list_room_url || "https://www.domakin.nl/list-room",
    cta_button_text: "List your room now",
    footer_heading: "Have questions about listing your room?",
    footer_text: "Our team can guide you through the process and help with the handover!",
    contact_button_text: "Contact us",
    unsubscribe_link: unsubscribeLink,
    ...overrides,
  };
}

/**
 * new-rooms-for-criteria.html
 * Variables: criteria_*, rooms (array: image, title, rent, location, city, period, flatmates, match_percentage, url), view_all_rooms_url, unsubscribe_link + shared
 */
export function newRoomsForCriteriaData(receiver, overrides = {}) {
  const unsubscribeLink = `${BASE_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id || ""}`;
  return {
    ...shared,
    hero_title: "New rooms matching your search!",
    hero_subtitle: "We found rooms that fit your preferences. Don't miss out!",
    criteria_heading: "Your search criteria",
    criteria_city: overrides.criteria_city || "Amsterdam",
    criteria_rent_label: overrides.criteria_rent_label || "Max 800 €/m",
    criteria_move_in_label: overrides.criteria_move_in_label || "From 2025-03-01",
    new_ribbon_text: "NEW",
    match_label: "match",
    rooms: overrides.rooms || [
      {
        image: BACKGROUNDS[2],
        title: "Bright room in city center",
        rent: 750,
        location: "Jordaan",
        city: "Amsterdam",
        period: "From March 2025",
        flatmates: "2 flatmates",
        match_percentage: 95,
        url: "https://www.domakin.nl/properties/sample-room-1",
      },
    ],
    view_all_rooms_url: overrides.view_all_rooms_url || "https://www.domakin.nl/services/renting",
    cta_button_text: "View all matching rooms",
    footer_heading: "Need assistance with searching for housing?",
    footer_text: "We offer remote viewings, help with applications, and searching for a suitable place!",
    contact_button_text: "Contact us",
    unsubscribe_link: unsubscribeLink,
    ...overrides,
  };
}

/**
 * finish-your-listing.html
 * Variables: user_name, progress_percentage, continue_listing_url, step_*_done (boolean), unsubscribe_link + shared
 */
export function finishYourListingData(receiver, overrides = {}) {
  const unsubscribeLink = `${BASE_URL}/callback/newsletter/unsubscribe?email=${encodeURIComponent(receiver.email)}&id=${receiver.id || ""}`;
  return {
    ...shared,
    hero_title: "Your listing is almost ready!",
    hero_subtitle: "You're just a few steps away from finding your next flatmate.",
    card_heading: "finish your listing",
    card_intro:
      "You started listing your room but didn't complete it yet. Pick up where you left off and get your room in front of potential tenants.",
    user_name: receiver.name || "there",
    progress_percentage: overrides.progress_percentage ?? 50,
    progress_label: "completed",
    step_1_label: "Room details",
    step_2_label: "Upload photos",
    step_3_label: "Set preferences",
    step_4_label: "Publish listing",
    step_details_done: overrides.step_details_done ?? true,
    step_photos_done: overrides.step_photos_done ?? false,
    step_preferences_done: overrides.step_preferences_done ?? false,
    step_publish_done: overrides.step_publish_done ?? false,
    continue_listing_url: overrides.continue_listing_url || "https://www.domakin.nl/dashboard/listings/continue",
    cta_button_text: "Continue your listing",
    footer_heading: "Need help creating your listing?",
    footer_text: "Our team can assist you with photos, descriptions, and more!",
    contact_button_text: "Contact us",
    unsubscribe_link: unsubscribeLink,
    ...overrides,
  };
}
