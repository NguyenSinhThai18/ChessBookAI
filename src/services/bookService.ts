
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Book {
  id: string;
  title: string;
  coverUrl: string;
  createdAt: any;
  pageSize: "a4" | "a5";
  orientation: "portrait" | "landscape";
}


/* ================= BOOK LIST ================= */

export async function fetchBooks(): Promise<Book[]> {
  const snap = await getDocs(collection(db, "books"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}
export async function updateBook(
  bookId: string,
  data: Partial<Book>
) {
  await updateDoc(doc(db, "books", bookId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}


export async function createBook(title: string, coverUrl: string) {
  const ref = await addDoc(collection(db, "books"), {
    title,
    coverUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    pageSize: "a4",
    orientation: "portrait",
  });

  // tạo page đầu tiên
  await addDoc(collection(db, "books", ref.id, "pages"), {
    order: 1,
    content: "Trang 1",
    elements: [],
  });

  return ref.id;
}

export async function deleteBook(bookId: string) {
  await deleteDoc(doc(db, "books", bookId));
}
