const countries = [
  { code: "+971", flag: "ae", name: "United Arab Emirates", placeholder: "800 444444" },
  { code: "+91", flag: "in", name: "India", placeholder: "98765 43210" },
  { code: "+966", flag: "sa", name: "Saudi Arabia", placeholder: "50 123 4567" },
  { code: "+968", flag: "om", name: "Oman", placeholder: "9123 4567" },
  { code: "+974", flag: "qa", name: "Qatar", placeholder: "5012 3456" },
  { code: "+965", flag: "kw", name: "Kuwait", placeholder: "5012 3456" },
  { code: "+973", flag: "bh", name: "Bahrain", placeholder: "3123 4567" },
  { code: "+1", flag: "us", name: "United States", placeholder: "201 555 0123" },
  { code: "+44", flag: "gb", name: "United Kingdom", placeholder: "7700 900077" },
];

// Maps backend country identifiers (e.g. spd_country_codes_for_phone: ["UAE", "IN"])
// to this list's `flag` (ISO-2) values, since the backend doesn't always send
// standard ISO-2 codes (e.g. "UAE" instead of "AE").
export const countryCodeAliasMap = {
  UAE: "ae",
  AE: "ae",
  IN: "in",
  SA: "sa",
  OM: "om",
  QA: "qa",
  KW: "kw",
  BH: "bh",
  US: "us",
  USA: "us",
  GB: "gb",
  UK: "gb",
};

export default countries;