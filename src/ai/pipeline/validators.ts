import type { AiBookJson, AiJsonPage, ValidationError } from './types';

/* ================= Utils ================= */

export function extractJsonFromModelText(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text.trim();
  }
  return text.slice(firstBrace, lastBrace + 1).trim();
}

export function isValidSquare(square: any): square is string {
  if (typeof square !== 'string' || square.length !== 2) return false;
  const [file, rank] = square;
  return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
}

/* ================= Chess Rules ================= */

function validatePiecesUniqueness(
  page: AiJsonPage,
  pageIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Set<string>();

  for (const p of page.pieces ?? []) {
    if (!isValidSquare(p.square)) {
      errors.push({
        code: 'INVALID_SQUARE',
        message: `Invalid square: ${String(p.square)}`,
        pageIndex,
        details: { square: p.square },
      });
      continue;
    }

    if (seen.has(p.square)) {
      errors.push({
        code: 'DUPLICATE_PIECE_SQUARE',
        message: `Duplicate piece square: ${p.square}`,
        pageIndex,
        details: { square: p.square },
      });
    }

    seen.add(p.square);
  }

  return errors;
}

function validateKingsPresent(
  page: AiJsonPage,
  pageIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  const hasWhiteKing = page.pieces?.some(
    (p) => p.type === 'king' && p.color === 'white'
  );

  const hasBlackKing = page.pieces?.some(
    (p) => p.type === 'king' && p.color === 'black'
  );

  if (!hasWhiteKing || !hasBlackKing) {
    errors.push({
      code: 'MISSING_KING',
      message: `Missing king(s): ${!hasWhiteKing ? 'white ' : ''}${!hasBlackKing ? 'black' : ''}`.trim(),
      pageIndex,
    });
  }

  return errors;
}

/* ================= Chess Rule Validator ================= */

export function validateChessRuleConstraints(
  aiJson: AiBookJson
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!aiJson || !Array.isArray(aiJson.pages)) {
    return [{ code: 'MISSING_PAGES', message: 'Missing pages array' }];
  }

  aiJson.pages.forEach((page, idx) => {
    if (page.type !== 'guide' && page.type !== 'exercise') {
      errors.push({
        code: 'INVALID_PAGE_TYPE',
        message: `Invalid page type: ${String((page as any).type)}`,
        pageIndex: idx,
      });
      return;
    }

    if (page.type === 'exercise' && 'points' in (page as any)) {
      errors.push({
        code: 'EXERCISE_HAS_POINTS',
        message: 'Exercise page must NOT contain points',
        pageIndex: idx,
      });
    }

    if (page.type === 'guide') {
      const pts = (page as any).points;
      if (!Array.isArray(pts)) {
        errors.push({
          code: 'GUIDE_MISSING_POINTS',
          message: 'Guide page must contain points array',
          pageIndex: idx,
        });
      } else {
        for (const sq of pts) {
          if (!isValidSquare(sq)) {
            errors.push({
              code: 'INVALID_SQUARE',
              message: `Invalid point square: ${String(sq)}`,
              pageIndex: idx,
              details: { square: sq },
            });
          }
        }
      }
    }

    errors.push(...validatePiecesUniqueness(page, idx));
    errors.push(...validatePiecePointConflicts(page, idx));
    errors.push(...validateKingsPresent(page, idx));
  });

  return errors;
}

function validatePiecePointConflicts(
  page: AiJsonPage,
  pageIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(page.pieces) || !Array.isArray((page as any).points)) {
    return errors;
  }

  const pieceSquares = new Set(
    page.pieces
      .map((p) => p.square)
      .filter((sq) => isValidSquare(sq))
  );

  for (const sq of (page as any).points) {
    if (pieceSquares.has(sq)) {
      errors.push({
        code: 'PIECE_POINT_CONFLICT',
        message: `Square ${sq} contains both chess piece and point marker`,
        pageIndex,
        details: { square: sq },
      });
    }
  }

  return errors;
}


/* ================= Pedagogy Validator ================= */

export function validatePedagogyMinimal(
  aiJson: AiBookJson
): ValidationError[] {
  const errors: ValidationError[] = [];

  const firstGuideIndex = aiJson.pages.findIndex(
    (p) => p.type === 'guide'
  );

  if (firstGuideIndex !== 0) {
    errors.push({
      code: 'LESSON_SEQUENCE_ERROR',
      message: 'First page must be a guide',
      pageIndex: firstGuideIndex === -1 ? 0 : firstGuideIndex,
    });
  }

  const lessonMap = new Map<string, number>();

  aiJson.pages.forEach((page, idx) => {
    const lessonId = page.lessonId ?? 'default';

    if (!lessonMap.has(lessonId)) {
      lessonMap.set(lessonId, idx);

      if (page.type !== 'guide') {
        errors.push({
          code: 'LESSON_SEQUENCE_ERROR',
          message: `Lesson "${lessonId}" must start with a guide page`,
          pageIndex: idx,
        });
      }
    }
  });

  return errors;
}
