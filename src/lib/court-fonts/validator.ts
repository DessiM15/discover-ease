/**
 * Font Compliance Validator
 * Validates document fonts against court requirements
 */

import {
  FontRequirement,
  getCourtById,
  getCanonicalFontName,
  FONT_EQUIVALENCIES,
} from "./requirements";

export interface DetectedFont {
  name: string;
  normalizedName: string;
  size: number;
  pages: number[];
  isBody?: boolean; // True if likely body text (based on frequency)
  isFootnote?: boolean; // True if likely footnote (smaller size)
}

export interface FontIssue {
  type: "FONT_NOT_ALLOWED" | "FONT_SIZE_TOO_SMALL" | "FONT_SIZE_TOO_LARGE" | "PREFERRED_FONT_AVAILABLE";
  severity: "error" | "warning" | "info";
  font: string;
  detectedSize?: number;
  requiredSize?: number;
  pages: number[];
  message: string;
  suggestion?: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  courtId: string;
  courtName: string;
  documentName: string;
  fontsDetected: DetectedFont[];
  issues: FontIssue[];
  requirements: {
    allowedFonts: string[];
    preferredFonts?: string[];
    disallowedFonts?: string[];
    minFontSize: number;
    maxFontSize?: number;
    footnoteMinSize?: number;
    notes?: string;
    sourceUrl?: string;
  };
  summary: string;
}

// Check if a font is allowed for the court
function isFontAllowed(fontName: string, court: FontRequirement): boolean {
  const canonical = getCanonicalFontName(fontName);

  // Check if explicitly disallowed
  if (court.disallowedFonts?.some(f =>
    getCanonicalFontName(f).toLowerCase() === canonical.toLowerCase()
  )) {
    return false;
  }

  // Check if in allowed list (or if allowed list is very permissive)
  return court.allowedFonts.some(allowed => {
    const allowedCanonical = getCanonicalFontName(allowed);
    return allowedCanonical.toLowerCase() === canonical.toLowerCase();
  });
}

// Find the closest allowed font to suggest
function findClosestAllowedFont(fontName: string, allowedFonts: string[]): string | undefined {
  const canonical = getCanonicalFontName(fontName);

  // Simple matching: if it's a serif font, suggest a serif; if sans-serif, suggest sans-serif
  const serifFonts = ["Times New Roman", "Century Schoolbook", "Century", "Bookman Old Style", "Book Antiqua", "Palatino", "Garamond", "Georgia"];
  const sansSerifFonts = ["Arial", "Verdana", "Calibri"];
  const monospacedFonts = ["Courier", "Courier New"];

  const isSerif = serifFonts.some(f => canonical.toLowerCase().includes(f.toLowerCase()));
  const isSansSerif = sansSerifFonts.some(f => canonical.toLowerCase().includes(f.toLowerCase()));
  const isMonospaced = monospacedFonts.some(f => canonical.toLowerCase().includes(f.toLowerCase()));

  if (isSerif) {
    return allowedFonts.find(f => serifFonts.includes(f));
  } else if (isSansSerif) {
    return allowedFonts.find(f => sansSerifFonts.includes(f)) || allowedFonts[0];
  } else if (isMonospaced) {
    return allowedFonts.find(f => monospacedFonts.includes(f)) || allowedFonts[0];
  }

  return allowedFonts[0]; // Default to first allowed font
}

// Validate fonts against court requirements
export function validateFonts(
  fonts: DetectedFont[],
  courtId: string,
  documentName: string = "Document"
): ComplianceResult {
  const court = getCourtById(courtId);

  if (!court) {
    throw new Error(`Court not found: ${courtId}`);
  }

  const issues: FontIssue[] = [];

  // Analyze each font
  for (const font of fonts) {
    const canonical = getCanonicalFontName(font.name);

    // Check if font is allowed
    if (!isFontAllowed(font.name, court)) {
      const isExplicitlyDisallowed = court.disallowedFonts?.some(f =>
        getCanonicalFontName(f).toLowerCase() === canonical.toLowerCase()
      );

      const suggestion = findClosestAllowedFont(font.name, court.allowedFonts);

      issues.push({
        type: "FONT_NOT_ALLOWED",
        severity: "error",
        font: canonical,
        pages: font.pages,
        message: isExplicitlyDisallowed
          ? `${canonical} is explicitly prohibited by ${court.name}.`
          : `${canonical} is not in the list of allowed fonts for ${court.name}.`,
        suggestion: suggestion ? `Consider using ${suggestion} instead.` : undefined,
      });
    }

    // Check font size for body text
    if (!font.isFootnote && font.size < court.minFontSize) {
      issues.push({
        type: "FONT_SIZE_TOO_SMALL",
        severity: "error",
        font: canonical,
        detectedSize: font.size,
        requiredSize: court.minFontSize,
        pages: font.pages,
        message: `${canonical} at ${font.size}pt is smaller than the required minimum of ${court.minFontSize}pt.`,
        suggestion: `Increase font size to at least ${court.minFontSize}pt for body text.`,
      });
    }

    // Check footnote size
    if (font.isFootnote && court.footnoteMinSize && font.size < court.footnoteMinSize) {
      issues.push({
        type: "FONT_SIZE_TOO_SMALL",
        severity: "error",
        font: canonical,
        detectedSize: font.size,
        requiredSize: court.footnoteMinSize,
        pages: font.pages,
        message: `Footnote in ${canonical} at ${font.size}pt is smaller than the required minimum of ${court.footnoteMinSize}pt.`,
        suggestion: `Increase footnote font size to at least ${court.footnoteMinSize}pt.`,
      });
    }

    // Check max font size if specified
    if (court.maxFontSize && font.size > court.maxFontSize) {
      issues.push({
        type: "FONT_SIZE_TOO_LARGE",
        severity: "warning",
        font: canonical,
        detectedSize: font.size,
        requiredSize: court.maxFontSize,
        pages: font.pages,
        message: `${canonical} at ${font.size}pt exceeds the maximum of ${court.maxFontSize}pt.`,
        suggestion: `Reduce font size to ${court.maxFontSize}pt or less.`,
      });
    }

    // Check if a preferred font could be used instead
    if (
      court.preferredFonts &&
      court.preferredFonts.length > 0 &&
      isFontAllowed(font.name, court) &&
      !court.preferredFonts.some(p => getCanonicalFontName(p).toLowerCase() === canonical.toLowerCase())
    ) {
      issues.push({
        type: "PREFERRED_FONT_AVAILABLE",
        severity: "info",
        font: canonical,
        pages: font.pages,
        message: `${canonical} is allowed, but ${court.preferredFonts[0]} is preferred by ${court.name}.`,
        suggestion: `Consider using ${court.preferredFonts[0]} for better reception.`,
      });
    }
  }

  // Generate summary
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;

  let summary: string;
  if (errorCount === 0 && warningCount === 0) {
    summary = `Document is fully compliant with ${court.name} font requirements.`;
  } else if (errorCount === 0) {
    summary = `Document has ${warningCount} minor issue(s) but meets minimum requirements for ${court.name}.`;
  } else {
    summary = `Document has ${errorCount} compliance error(s) that must be fixed for ${court.name}.`;
  }

  return {
    isCompliant: errorCount === 0,
    courtId: court.id,
    courtName: court.name,
    documentName,
    fontsDetected: fonts,
    issues,
    requirements: {
      allowedFonts: court.allowedFonts,
      preferredFonts: court.preferredFonts,
      disallowedFonts: court.disallowedFonts,
      minFontSize: court.minFontSize,
      maxFontSize: court.maxFontSize,
      footnoteMinSize: court.footnoteMinSize,
      notes: court.notes,
      sourceUrl: court.sourceUrl,
    },
    summary,
  };
}
