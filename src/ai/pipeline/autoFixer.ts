import type { AiBookJson, ValidationError } from './types';
import { isValidSquare } from './validators';

// Auto-fixer: "minimal patch" approach. No regeneration here.
export function autoFix(aiJson: AiBookJson, errors: ValidationError[]): {
  fixed: AiBookJson;
  changed: boolean;
} {
  let changed = false;
  const fixed: AiBookJson = {
    ...aiJson,
    pages: (aiJson.pages ?? []).map((p) => ({ ...p })) as any,
  };

  // Apply safe, deterministic fixes.
  fixed.pages.forEach((page: any) => {
    // Enforce exercise no points
    if (page.type === 'exercise' && 'points' in page) {
      delete page.points;
      changed = true;
    }

    // Enforce guide has points array
    if (page.type === 'guide' && !Array.isArray(page.points)) {
      page.points = [];
      changed = true;
    }

    // Remove invalid points
    if (page.type === 'guide' && Array.isArray(page.points)) {
      const before = page.points.length;
      page.points = page.points.filter((sq: any) => isValidSquare(sq));
      if (page.points.length !== before) changed = true;
    }

    // Remove invalid piece squares
    if (Array.isArray(page.pieces)) {
      const before = page.pieces.length;
      page.pieces = page.pieces.filter((pc: any) => isValidSquare(pc.square));
      if (page.pieces.length !== before) changed = true;

      // De-dup squares (keep first)
      const seen = new Set<string>();
      const before2 = page.pieces.length;
      page.pieces = page.pieces.filter((pc: any) => {
        if (seen.has(pc.square)) return false;
        seen.add(pc.square);
        return true;
      });
      if (page.pieces.length !== before2) changed = true;
    }
  });

  // NOTE: We do NOT invent missing kings here (that would be "create content").
  // If kings are missing, orchestrator should regenerate content stage for those pages.
  return { fixed, changed };
}



