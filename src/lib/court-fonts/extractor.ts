/**
 * PDF Font Extractor
 * Extracts font information from PDF documents using pdf.js
 */

// Use legacy build for Node.js compatibility (no DOMMatrix requirement)
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import { DetectedFont } from "./validator";
import { normalizeFontName, getCanonicalFontName } from "./requirements";

// Configure pdf.js for Node.js environment
GlobalWorkerOptions.workerSrc = "";

interface FontInfo {
  name: string;
  size: number;
  page: number;
}

// Type guard for TextItem
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return "str" in item && "fontName" in item;
}

/**
 * Extract fonts from a PDF buffer
 */
export async function extractFontsFromPDF(
  pdfBuffer: ArrayBuffer | Uint8Array | Buffer
): Promise<DetectedFont[]> {
  const fontMap = new Map<string, { sizes: Map<number, number[]>; totalChars: number }>();

  try {
    // Load PDF document
    const data = pdfBuffer instanceof Buffer
      ? new Uint8Array(pdfBuffer)
      : pdfBuffer;

    const loadingTask = getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      for (const item of textContent.items) {
        if (!isTextItem(item)) continue;

        const fontName = item.fontName || "Unknown";
        const fontSize = Math.round(item.height || 12); // Approximate font size from height
        const charCount = item.str?.length || 0;

        if (charCount === 0) continue;

        // Track font usage
        if (!fontMap.has(fontName)) {
          fontMap.set(fontName, { sizes: new Map(), totalChars: 0 });
        }

        const fontInfo = fontMap.get(fontName)!;
        fontInfo.totalChars += charCount;

        if (!fontInfo.sizes.has(fontSize)) {
          fontInfo.sizes.set(fontSize, []);
        }

        const pages = fontInfo.sizes.get(fontSize)!;
        if (!pages.includes(pageNum)) {
          pages.push(pageNum);
        }
      }
    }

    // Convert to DetectedFont array
    const detectedFonts: DetectedFont[] = [];
    let maxChars = 0;

    // Find the most used font (likely body text)
    for (const [_, info] of fontMap) {
      if (info.totalChars > maxChars) {
        maxChars = info.totalChars;
      }
    }

    for (const [fontName, info] of fontMap) {
      for (const [size, pages] of info.sizes) {
        // Skip very small samples (likely artifacts)
        if (pages.length === 1 && info.totalChars < 10) continue;

        const normalizedName = normalizeFontName(fontName);
        const canonicalName = getCanonicalFontName(fontName);

        // Determine if this is likely body text or footnotes
        const isBody = info.totalChars === maxChars && size >= 10;
        const isFootnote = size < 11 && !isBody;

        detectedFonts.push({
          name: fontName,
          normalizedName: canonicalName || normalizedName,
          size,
          pages: pages.sort((a, b) => a - b),
          isBody,
          isFootnote,
        });
      }
    }

    // Sort by page occurrence and size
    detectedFonts.sort((a, b) => {
      if (a.pages[0] !== b.pages[0]) return a.pages[0] - b.pages[0];
      return b.size - a.size;
    });

    return detectedFonts;
  } catch (error) {
    console.error("Error extracting fonts from PDF:", error);
    throw new Error(`Failed to extract fonts from PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get a summary of fonts in the document
 */
export function getFontSummary(fonts: DetectedFont[]): {
  primaryFont: string | null;
  footnoteFont: string | null;
  allFonts: string[];
  sizeRange: { min: number; max: number };
} {
  if (fonts.length === 0) {
    return {
      primaryFont: null,
      footnoteFont: null,
      allFonts: [],
      sizeRange: { min: 0, max: 0 },
    };
  }

  const bodyFonts = fonts.filter(f => f.isBody);
  const footnoteFonts = fonts.filter(f => f.isFootnote);

  const allFontNames = [...new Set(fonts.map(f => f.normalizedName))];
  const sizes = fonts.map(f => f.size);

  return {
    primaryFont: bodyFonts.length > 0 ? bodyFonts[0].normalizedName : fonts[0].normalizedName,
    footnoteFont: footnoteFonts.length > 0 ? footnoteFonts[0].normalizedName : null,
    allFonts: allFontNames,
    sizeRange: {
      min: Math.min(...sizes),
      max: Math.max(...sizes),
    },
  };
}
