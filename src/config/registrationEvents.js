/**
 * Registration event configs.
 * Add a new entry here to enable registration for a new Eid event.
 *
 * eventId   — unique key, used in the URL (/register/:eventId) and stored in the DB
 * title     — displayed as the page heading
 * subtitle  — displayed below the heading
 * sessions  — array of { value, time }; value must be unique within the event
 * seoDesc   — meta description for the page
 */
export const REGISTRATION_EVENTS = {
  "eid-fitr-1447": {
    eventId: "eid-fitr-1447",
    title: "Eid Al-Fitr 1447H Prayer Registration",
    subtitle:
      "Eid Al-Fitr 1447H is confirmed on Saturday, 21st March 2026. Please register your attendance to help us prepare the space for each session.",
    seoDesc:
      "Register for Eid Al-Fitr 1447H prayer on Saturday, 21st March 2026 at Kanazawa Umar bin Al-Khattab Mosque. Choose from three sessions at 6:30, 7:30, or 8:30 AM.",
    sessions: [
      { value: "1", time: "6:30 AM" },
      { value: "2", time: "7:30 AM" },
      { value: "3", time: "8:30 AM" },
    ],
  },

  // Template for future events — copy, uncomment, and fill in:
  //
  // "eid-adha-1446": {
  //   eventId: "eid-adha-1446",
  //   title: "Eid Al-Adha 1446H Prayer Registration",
  //   subtitle: "...",
  //   seoDesc: "...",
  //   sessions: [
  //     { value: "1", time: "7:00 AM" },
  //     { value: "2", time: "8:00 AM" },
  //   ],
  // },
};
