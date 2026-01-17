// src/ai/mapAiJsonToPages.ts

type PageElement = {
  id: string;
  type: "background" | "chessboard" | "chess-piece" | "chess-marker";
  position: { x: number; y: number };
  size: { width: number; height: number };
  layer: number;
  data: any;
  visible: boolean;
};

type Page = {
  id: number;
  content: string;
  elements: PageElement[];
};

const BOARD_X = 60;
const BOARD_Y = 180;
const BOARD_SIZE = 400;
const CELL = BOARD_SIZE / 8;

/* =======================
   SAFE UTILS
======================= */

function isValidSquare(square: any): square is string {
  if (typeof square !== "string") return false;
  if (square.length !== 2) return false;

  const file = square[0];
  const rank = square[1];

  return (
    file >= "a" &&
    file <= "h" &&
    rank >= "1" &&
    rank <= "8"
  );
}

function squareToPositionSafe(square: any) {
  if (!isValidSquare(square)) {
    console.warn("❌ Invalid square:", square);
    return null;
  }

  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1]);

  return {
    x: BOARD_X + col * CELL + CELL / 2 - 20,
    y: BOARD_Y + row * CELL + CELL / 2 - 20,
    row,
    col,
  };
}

/* =======================
   TEMPLATE
======================= */

function extractChessboardStyle(template: PageElement[]) {
  const board = template.find(e => e.type === "chessboard");
  return board?.data ?? {
    color1: "#f0d9b5",
    color2: "#b58863",
  };
}

/* =======================
   MAIN MAPPER
======================= */

export function mapAiJsonToPages(
  aiJson: any,
  template: PageElement[]
): Page[] {
  const boardStyle = extractChessboardStyle(template);

  return (aiJson.pages ?? []).map((aiPage: any, index: number) => {
    const elements: PageElement[] = [];

    /* 1️⃣ CHESSBOARD */
    const chessboardId = `chessboard-${Date.now()}-${index}`;
    elements.push({
      id: chessboardId,
      type: "chessboard",
      position: { x: BOARD_X, y: BOARD_Y },
      size: { width: BOARD_SIZE, height: BOARD_SIZE },
      layer: 1,
      data: {
        color1: boardStyle.color1,
        color2: boardStyle.color2,
      },
      visible: true,
    });

    /* 2️⃣ PIECES */
    (aiPage.pieces ?? []).forEach((p: any, i: number) => {
      const squareInfo = squareToPositionSafe(p.square);
      if (!squareInfo) return;

      elements.push({
        id: `piece-${Date.now()}-${i}`,
        type: "chess-piece",
        position: {
          x: squareInfo.x,
          y: squareInfo.y,
        },
        size: { width: 40, height: 40 },
        layer: 5,
        data: {
          pieceId: p.type, 
          side: p.color === "white" ? "a" : "b",
          chessboardId,
          row: squareInfo.row,
          col: squareInfo.col,
        },
        visible: true,
      });
    });

    /* 3️⃣ POINTS → MARKERS (CHỈ GUIDE) */
    if (aiPage.type === "guide" && Array.isArray(aiPage.points)) {
      aiPage.points
        .map(squareToPositionSafe)
        .filter(Boolean)
        .forEach((pos: any, i: number) => {
          elements.push({
            id: `marker-${Date.now()}-${i}`,
            type: "chess-marker",
            position: {
              x: pos.x,
              y: pos.y,
            },
            size: { width: 30, height: 30 },
            layer: 10,
            data: {
              markerId: "dot",
              chessboardId,
              row: pos.row,
              col: pos.col,
            },
            visible: true,
          });
        });
    }

    return {
      id: Date.now() + index,
      content:
        aiPage.type === "guide"
          ? "Trang hướng dẫn"
          : "Bài tập",
      elements,
    };
  });
}
