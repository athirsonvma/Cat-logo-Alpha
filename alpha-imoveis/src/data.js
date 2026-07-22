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

// onSnapshot mantém tudo sincronizado em tempo real entre corretores.
function subscribeCollection(name, sortKey, onData, onError) {
  const q = query(collection(db, name));
  return onSnapshot(q, snap => {
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
    onData(items);
  }, onError);
}

export function subscribeProperties(onData, onError) {
  return subscribeCollection('properties', 'createdAt', onData, onError);
}

export function subscribeSelections(onData, onError) {
  return subscribeCollection('selections', 'createdAt', onData, onError);
}

export function subscribeLeads(onData, onError) {
  return subscribeCollection('leads', 'updatedAt', onData, onError);
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

export async function saveLead(lead) {
  await setDoc(doc(db, 'leads', lead.id), lead);
}

export async function deleteLead(id) {
  await deleteDoc(doc(db, 'leads', id));
}
