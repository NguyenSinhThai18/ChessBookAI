// src/services/iconService.ts

import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Icon {
  id?: string;
  url: string;
  name: string;
  createdAt?: number;
}

export async function addIcon(icon: { url: string; name: string }) {
  await addDoc(collection(db, "icons"), {
    ...icon,
    createdAt: Date.now(),
  });
}

export async function fetchIcons(): Promise<Icon[]> {
  const snap = await getDocs(collection(db, "icons"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Icon[];
}
