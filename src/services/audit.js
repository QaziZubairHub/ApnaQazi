import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logAuditEvent = async (userId, action, section, oldValue, newValue) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      action,
      section,
      oldValue,
      newValue,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};
