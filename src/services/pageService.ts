import {
  collection,
  doc,
  setDoc,
  writeBatch,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/* =======================
   FETCH ALL PAGES OF BOOK
======================= */
export async function fetchPages(bookId: string) {
  const pagesRef = collection(db, "books", bookId, "pages");
  const q = query(pagesRef, orderBy("order", "asc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/* =======================
   SAVE ALL PAGES (BATCH)
======================= */
export async function saveAllPages(bookId: string, pages: any[]) {
  const batch = writeBatch(db);

  pages.forEach((page, index) => {
    const ref = doc(collection(db, "books", bookId, "pages"), String(page.id));
    batch.set(ref, {
      order: index + 1,
      content: page.content,
      elements: page.elements,
    });
  });

  await batch.commit();
}
