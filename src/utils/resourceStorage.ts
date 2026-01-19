export function loadResources(key: string) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function saveResources(key: string, data: any[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
