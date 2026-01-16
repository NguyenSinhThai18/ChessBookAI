import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export async function testFirebase() {
  console.log("👉 testFirebase called");

  const ref = await addDoc(collection(db, "test"), {
    message: "Firebase OK",
    createdAt: serverTimestamp(),
  });

  console.log("🔥 Firebase OK, docId =", ref.id);
}
