import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Background {
  id: string;
  name: string;
  url: string;
}

const colRef = collection(db, "backgrounds");

export async function fetchBackgrounds(): Promise<Background[]> {
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Background, "id">),
  }));
}

export async function addBackground(
  name: string,
  url: string
): Promise<Background> {
  const docRef = await addDoc(colRef, {
    name,
    url,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, name, url };
}

export async function deleteBackground(id: string) {
  await deleteDoc(doc(db, "backgrounds", id));
}
