// src/ai/aiParser.ts
import { AIBookResult } from './aiSchema';

export function parseAIResultToPages(
  aiResult: AIBookResult,
  startPageId: number
) {
  return aiResult.pages.map((p, index) => ({
    id: startPageId + index,
    content: p.title,
    elements: p.elements.map(el => ({
      ...el,
      id: `${el.type}-${Date.now()}-${Math.random()}`,
    })),
  }));
}
