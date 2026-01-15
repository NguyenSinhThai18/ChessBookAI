// src/ai/aiSchema.ts

export type PageType = 'theory' | 'example' | 'exercise' | 'solution';

export interface AIChessboard {
  color1: string;
  color2: string;
}

export interface AIChessPiece {
  piece: {
    id: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
    name: string;
  };
  side: 'a' | 'b';
  chessboardId: string;
  row: number;
  col: number;
}

export interface AIChessMarker {
  marker: {
    id: 'dot' | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right';
    name: string;
    color: 'green' | 'blue';
  };
  chessboardId: string;
  row: number;
  col: number;
}

export interface AIPageElement {
  id: string;
  type: 'chessboard' | 'chess-piece' | 'chess-marker';
  position: { x: number; y: number };
  size: { width: number; height: number };
  layer: number;
  visible: boolean;
  data: AIChessboard | AIChessPiece | AIChessMarker;
}

export interface AIPage {
  id: number;
  type: PageType;
  title: string;
  description: string;
  elements: AIPageElement[];
}

export interface AIBookResult {
  book: {
    title: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
  };
  pages: AIPage[];
}
