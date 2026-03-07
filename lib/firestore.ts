// lib/firestore.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface FirestoreDocument {
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createDocument<T extends FirestoreDocument>(
  collectionName: string, 
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating document: ", error);
    throw error;
  }
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: Parameters<typeof query>[1][] = []
): Promise<(T & { id: string })[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
}

export async function getDocument<T>(
  collectionName: string, 
  documentId: string
): Promise<(T & { id: string }) | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as T & { id: string };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document: ", error);
    throw error;
  }
}

export async function updateDocument<T extends FirestoreDocument>(
  collectionName: string, 
  documentId: string, 
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string, 
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
}

export async function getDocumentsByField<T>(
  collectionName: string,
  fieldName: string,
  fieldValue: any
): Promise<(T & { id: string })[]> {
  try {
    const q = query(
      collection(db, collectionName), 
      where(fieldName, "==", fieldValue)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T & { id: string }));
  } catch (error) {
    console.error("Error getting documents by field: ", error);
    throw error;
  }
}