import {
  collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, query
} from 'firebase/firestore';
import { db } from './firebase.js';

const DEFAULT_SETTINGS = { teamPasscode: 'equipe2026', agencyName: 'Alpha Imóveis', whatsappNumber: '' };

export async function getSettings() {
  const ref = doc(db, 'settings', 'main');
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  await setDoc(ref, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings) {
  await setDoc(doc(db, 'settings', 'main'), settings);
}

// onSnapshot mantém tudo sincronizado em tempo real entre corretores —
// se alguém muda o status de uma casa no celular, todo mundo vê na hora,
// sem precisar recarregar a página.
export function subscribeProperties(onData, onError) {
  const q = query(collection(db, 'properties'));
  return onSnapshot(q, snap => {
    const props = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    onData(props);
  }, onError);
}

export function subscribeSelections(onData, onError) {
  const q = query(collection(db, 'selections'));
  return onSnapshot(q, snap => {
    const sels = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    onData(sels);
  }, onError);
}

export async function saveProperty(property) {
  await setDoc(doc(db, 'properties', property.id), property);
}

export async function deleteProperty(id) {
  await deleteDoc(doc(db, 'properties', id));
}

export async function saveSelection(selection) {
  await setDoc(doc(db, 'selections', selection.id), selection);
}

export async function deleteSelection(id) {
  await deleteDoc(doc(db, 'selections', id));
}
