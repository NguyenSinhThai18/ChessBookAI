import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function fetchBackgrounds() {
  const snap = await getDoc(doc(db, "resources", "backgrounds"));
  return snap.exists() ? snap.data().items : [];
}
