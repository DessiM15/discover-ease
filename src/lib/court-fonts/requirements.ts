/**
 * Court Font Requirements Database
 * Contains font requirements for various courts and jurisdictions
 */

export interface FontRequirement {
  id: string;
  name: string;
  type: "federal" | "state" | "local";
  parentId?: string; // For hierarchical jurisdictions
  allowedFonts: string[];
  preferredFonts?: string[];
  disallowedFonts?: string[];
  minFontSize: number;
  maxFontSize?: number;
  footnoteMinSize?: number;
  lineSpacing?: string;
  documentTypes?: string[]; // Specific document types this applies to
  sourceUrl?: string;
  notes?: string;
}

// Font family equivalencies for matching
export const FONT_EQUIVALENCIES: Record<string, string[]> = {
  "Times New Roman": ["Times", "TimesNewRoman", "TimesNewRomanPS", "TimesNewRomanPSMT", "Times-Roman"],
  "Century Schoolbook": ["CenturySchoolbook", "CenturySchlbk", "Century Schoolbook L"],
  "Century": ["Century", "CenturyMT"],
  "Arial": ["Arial", "ArialMT", "Arial-Regular"],
  "Courier New": ["CourierNew", "Courier", "CourierNewPSMT"],
  "Courier": ["Courier", "CourierStd"],
  "Bookman Old Style": ["BookmanOldStyle", "Bookman", "BookAntiqua"],
  "Book Antiqua": ["BookAntiqua", "Palatino"],
  "Palatino": ["Palatino", "PalatinoLinotype", "Palatino-Roman"],
  "Garamond": ["Garamond", "GaramondPremrPro", "AGaramond"],
  "Georgia": ["Georgia", "Georgia-Regular"],
  "Verdana": ["Verdana", "Verdana-Regular"],
  "Calibri": ["Calibri", "Calibri-Regular"],
  "Cambria": ["Cambria", "Cambria-Regular"],
};

// Normalize font name by removing common suffixes and prefixes
export function normalizeFontName(fontName: string): string {
  if (!fontName) return "";

  // Remove subset prefix (e.g., "ABCDEF+")
  let normalized = fontName.replace(/^[A-Z]{6}\+/, "");

  // Remove common suffixes
  const suffixesToRemove = [
    "-Bold", "-Italic", "-BoldItalic", "-Regular", "-Light", "-Medium",
    "Bold", "Italic", "Regular", "Light", "Medium", "Oblique",
    "MT", "PS", "PSMt", "PSMT", "-Roman", "Std"
  ];

  for (const suffix of suffixesToRemove) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length);
    }
  }

  return normalized.trim();
}

// Find the canonical font name from a detected font
export function getCanonicalFontName(detectedFont: string): string {
  const normalized = normalizeFontName(detectedFont);

  for (const [canonical, variants] of Object.entries(FONT_EQUIVALENCIES)) {
    if (variants.some(v =>
      v.toLowerCase() === normalized.toLowerCase() ||
      normalized.toLowerCase().includes(v.toLowerCase())
    )) {
      return canonical;
    }
  }

  return normalized;
}

// Federal Court Requirements
export const FEDERAL_COURTS: FontRequirement[] = [
  {
    id: "us-supreme-court",
    name: "U.S. Supreme Court",
    type: "federal",
    allowedFonts: ["Century Schoolbook", "Century"],
    preferredFonts: ["Century Schoolbook"],
    disallowedFonts: ["Times New Roman", "Arial", "Courier"],
    minFontSize: 12,
    footnoteMinSize: 10,
    sourceUrl: "https://www.supremecourt.gov/filingandrules/rules_guidance.aspx",
    notes: "Rule 33: Briefs must use Century family fonts. Times New Roman is NOT acceptable.",
  },
  {
    id: "federal-appellate-rule32",
    name: "Federal Courts of Appeals (Rule 32)",
    type: "federal",
    allowedFonts: ["Century Schoolbook", "Century", "Book Antiqua", "Bookman Old Style", "Palatino", "Garamond"],
    preferredFonts: ["Century Schoolbook", "Bookman Old Style"],
    disallowedFonts: [],
    minFontSize: 14,
    footnoteMinSize: 10,
    lineSpacing: "double",
    sourceUrl: "https://www.law.cornell.edu/rules/frap/rule_32",
    notes: "Proportionally spaced fonts must include serifs. Monospaced: max 10.5 chars/inch.",
  },
  {
    id: "7th-circuit",
    name: "U.S. Court of Appeals - 7th Circuit",
    type: "federal",
    parentId: "federal-appellate-rule32",
    allowedFonts: ["Century Schoolbook", "Bookman Old Style", "Caslon", "Georgia", "Palatino"],
    preferredFonts: ["Century Schoolbook", "Bookman Old Style"],
    disallowedFonts: ["Times New Roman"],
    minFontSize: 14,
    footnoteMinSize: 11,
    sourceUrl: "https://www.ca7.uscourts.gov/forms/Practitioner-Guide.pdf",
    notes: "7th Circuit explicitly discourages Times New Roman - 'readers scan rather than read it'.",
  },
  {
    id: "4th-circuit",
    name: "U.S. Court of Appeals - 4th Circuit",
    type: "federal",
    parentId: "federal-appellate-rule32",
    allowedFonts: ["Century Schoolbook", "Bookman Old Style", "Book Antiqua", "Palatino", "Garamond"],
    preferredFonts: ["Century Schoolbook"],
    minFontSize: 14,
    sourceUrl: "https://www.ca4.uscourts.gov/",
    notes: "Published preferred typeface recommendations December 2024.",
  },
  {
    id: "middle-district-florida",
    name: "U.S. District Court - Middle District of Florida",
    type: "federal",
    allowedFonts: ["Times New Roman"],
    minFontSize: 14,
    footnoteMinSize: 12,
    sourceUrl: "https://www.flmd.uscourts.gov/local-rules",
    notes: "Local Rule 1.08: Times New Roman, 14pt for main text, 12pt for footnotes.",
  },
  {
    id: "central-district-california",
    name: "U.S. District Court - Central District of California",
    type: "federal",
    allowedFonts: ["Times New Roman", "Courier New", "Arial", "Century Schoolbook"],
    minFontSize: 14,
    sourceUrl: "https://www.cacd.uscourts.gov/",
    notes: "Proportionally spaced font, 14-point or larger.",
  },
];

// State Court Requirements
export const STATE_COURTS: FontRequirement[] = [
  // California
  {
    id: "california-state",
    name: "California State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Courier", "Arial"],
    minFontSize: 12,
    lineSpacing: "double",
    sourceUrl: "https://www.courts.ca.gov/cms/rules/index.cfm?title=two",
    notes: "Rule 2.104-2.105: Fonts 'essentially equivalent' to Courier, Times New Roman, or Arial.",
  },
  {
    id: "california-supreme",
    name: "California Supreme Court",
    type: "state",
    parentId: "california-state",
    allowedFonts: ["Times New Roman", "Century Schoolbook", "Book Antiqua"],
    minFontSize: 13,
    sourceUrl: "https://www.courts.ca.gov/12425.htm",
    notes: "13-point proportionally spaced or 12-point monospaced.",
  },
  // Florida
  {
    id: "florida-state",
    name: "Florida State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Courier New"],
    minFontSize: 14,
    sourceUrl: "https://www.floridabar.org/rules/ctproc/",
    notes: "Rule 9.210: Times New Roman 14pt or Courier New 12pt.",
  },
  {
    id: "florida-supreme",
    name: "Florida Supreme Court",
    type: "state",
    parentId: "florida-state",
    allowedFonts: ["Bookman Old Style", "Arial"],
    minFontSize: 14,
    sourceUrl: "https://www.floridasupremecourt.org/",
    notes: "Bookman Old Style or Arial, 14-point.",
  },
  // New York
  {
    id: "new-york-state",
    name: "New York State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Courier", "Arial"],
    minFontSize: 12,
    sourceUrl: "https://www.nycourts.gov/",
    notes: "Standard readable font, 12-point minimum.",
  },
  {
    id: "new-york-appellate-1st",
    name: "NY Appellate Division - 1st Department",
    type: "state",
    parentId: "new-york-state",
    allowedFonts: ["Times New Roman", "Century Schoolbook", "Bookman Old Style"],
    minFontSize: 14,
    footnoteMinSize: 12,
    sourceUrl: "https://www.nycourts.gov/courts/ad1/",
    notes: "Proportionally spaced: minimum 14-point. Footnotes: 12-point minimum.",
  },
  // Texas
  {
    id: "texas-state",
    name: "Texas State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Century Schoolbook", "Courier", "Arial", "Verdana", "Cambria", "Georgia"],
    minFontSize: 12,
    sourceUrl: "https://www.txcourts.gov/rules-forms/rules-standards/",
    notes: "TRAP 9.4: Conventional typeface in standard size. No specific font mandated.",
  },
  {
    id: "texas-supreme",
    name: "Texas Supreme Court",
    type: "state",
    parentId: "texas-state",
    allowedFonts: ["Times New Roman", "Century Schoolbook", "Courier"],
    preferredFonts: ["Century Schoolbook"],
    minFontSize: 14,
    sourceUrl: "https://www.txcourts.gov/supreme/",
    notes: "14-point proportionally spaced recommended.",
  },
  // Illinois
  {
    id: "illinois-state",
    name: "Illinois State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Arial", "Courier"],
    minFontSize: 12,
    sourceUrl: "https://www.illinoiscourts.gov/",
    notes: "Standard readable font, minimum 12-point.",
  },
  // Pennsylvania
  {
    id: "pennsylvania-state",
    name: "Pennsylvania State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Arial", "Courier New"],
    minFontSize: 12,
    sourceUrl: "https://www.pacourts.us/",
    notes: "Pa.R.A.P. 2135: 14-point proportionally spaced.",
  },
  // Ohio
  {
    id: "ohio-state",
    name: "Ohio State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Courier", "Arial"],
    minFontSize: 12,
    sourceUrl: "https://www.supremecourt.ohio.gov/",
    notes: "Standard readable typeface.",
  },
  // Georgia
  {
    id: "georgia-state",
    name: "Georgia State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Courier New", "Arial"],
    minFontSize: 12,
    sourceUrl: "https://www.gasupreme.us/",
    notes: "12-point minimum for most documents.",
  },
  // Minnesota
  {
    id: "minnesota-state",
    name: "Minnesota State Courts",
    type: "state",
    allowedFonts: ["Times New Roman", "Century Schoolbook", "Arial", "Courier"],
    minFontSize: 13,
    sourceUrl: "https://www.mncourts.gov/",
    notes: "Proportional fonts: minimum 13-point. Monospaced: max 10.5 chars/inch.",
  },
];

// Local Court Requirements (samples - can be expanded)
export const LOCAL_COURTS: FontRequirement[] = [
  {
    id: "los-angeles-superior",
    name: "Los Angeles County Superior Court",
    type: "local",
    parentId: "california-state",
    allowedFonts: ["Times New Roman", "Courier", "Arial"],
    minFontSize: 12,
    sourceUrl: "https://www.lacourt.org/",
    notes: "Follows California state court rules.",
  },
  {
    id: "cook-county-circuit",
    name: "Cook County Circuit Court (Chicago)",
    type: "local",
    parentId: "illinois-state",
    allowedFonts: ["Times New Roman", "Arial", "Courier"],
    minFontSize: 12,
    sourceUrl: "https://www.cookcountycourt.org/",
    notes: "Follows Illinois state court rules.",
  },
  {
    id: "harris-county-district",
    name: "Harris County District Courts (Houston)",
    type: "local",
    parentId: "texas-state",
    allowedFonts: ["Times New Roman", "Century Schoolbook", "Courier", "Arial"],
    minFontSize: 12,
    sourceUrl: "https://www.justex.net/",
    notes: "Follows Texas state court rules.",
  },
  {
    id: "miami-dade-circuit",
    name: "Miami-Dade County Circuit Court",
    type: "local",
    parentId: "florida-state",
    allowedFonts: ["Times New Roman", "Courier New"],
    minFontSize: 14,
    sourceUrl: "https://www.jud11.flcourts.org/",
    notes: "Follows Florida state court rules.",
  },
];

// Combine all courts
export const ALL_COURTS: FontRequirement[] = [
  ...FEDERAL_COURTS,
  ...STATE_COURTS,
  ...LOCAL_COURTS,
];

// Get court by ID
export function getCourtById(id: string): FontRequirement | undefined {
  return ALL_COURTS.find(court => court.id === id);
}

// Get courts by type
export function getCourtsByType(type: "federal" | "state" | "local"): FontRequirement[] {
  return ALL_COURTS.filter(court => court.type === type);
}

// Search courts by name
export function searchCourts(query: string): FontRequirement[] {
  const lowerQuery = query.toLowerCase();
  return ALL_COURTS.filter(court =>
    court.name.toLowerCase().includes(lowerQuery) ||
    court.id.toLowerCase().includes(lowerQuery)
  );
}

// Get grouped courts for UI display
export function getGroupedCourts(): {
  federal: FontRequirement[];
  state: FontRequirement[];
  local: FontRequirement[];
} {
  return {
    federal: getCourtsByType("federal"),
    state: getCourtsByType("state"),
    local: getCourtsByType("local"),
  };
}
