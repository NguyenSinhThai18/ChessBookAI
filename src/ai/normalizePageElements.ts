// src/ai/normalizePageElements.ts

export function normalizePageElements(elements: any[]) {
  const chessboard = elements.find(e => e.type === 'chessboard');
  if (!chessboard) return elements;

  const cellSize = chessboard.size.width / 8;

  const occupied = new Set<string>();

  return elements.map(el => {
    // 🎯 PIECE
    if (el.type === 'chess-piece') {
      const { row, col } = el.data;

      // ép vào ô cờ
      const x =
        chessboard.position.x +
        col * cellSize +
        cellSize / 2 -
        el.size.width / 2;

      const y =
        chessboard.position.y +
        row * cellSize +
        cellSize / 2 -
        el.size.height / 2;

      const key = `${row}-${col}`;
      if (occupied.has(key)) {
        // nếu trùng ô → đẩy nhẹ (debug-friendly)
        return {
          ...el,
          position: { x: x + 8, y: y + 8 },
        };
      }

      occupied.add(key);

      return {
        ...el,
        position: { x, y },
        layer: 5,
      };
    }

    // 🎯 MARKER
    if (el.type === 'chess-marker') {
      const { row, col } = el.data;

      const x =
        chessboard.position.x +
        col * cellSize +
        cellSize / 2 -
        el.size.width / 2;

      const y =
        chessboard.position.y +
        row * cellSize +
        cellSize / 2 -
        el.size.height / 2;

      return {
        ...el,
        position: { x, y },
        layer: 10,
      };
    }

    return el;
  });
}
