export type ResourceType = "icon" | "background";

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: ResourceType;
  isPreset: boolean; // true = mock cũ
}
