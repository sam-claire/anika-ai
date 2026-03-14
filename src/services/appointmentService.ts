import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Appointment, ClinicInfo, OperationType, FirestoreErrorInfo } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || '',
        email: provider.email || '',
        photoUrl: provider.photoURL || ''
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const appointmentService = {
  async bookAppointment(appointment: Omit<Appointment, 'id'>) {
    const path = 'appointments';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...appointment,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, 'create', path);
    }
  },

  subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
    const path = 'appointments';
    const q = query(collection(db, path), orderBy('date', 'asc'), orderBy('time', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      callback(appointments);
    }, (error) => {
      handleFirestoreError(error, 'list', path);
    });
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']) {
    const path = `appointments/${id}`;
    try {
      const docRef = doc(db, 'appointments', id);
      await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, 'update', path);
    }
  },

  subscribeToClinicInfo(callback: (info: ClinicInfo | null) => void) {
    const path = 'clinic_info';
    // We assume there's only one clinic info doc, or we take the first one
    const q = query(collection(db, path));
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        callback({
          id: doc.id,
          ...doc.data()
        } as ClinicInfo);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, 'list', path);
    });
  },

  async updateClinicInfo(id: string | undefined, info: Partial<ClinicInfo>) {
    const path = id ? `clinic_info/${id}` : 'clinic_info';
    try {
      if (id) {
        const docRef = doc(db, 'clinic_info', id);
        await updateDoc(docRef, info);
      } else {
        await addDoc(collection(db, 'clinic_info'), info);
      }
    } catch (error) {
      handleFirestoreError(error, id ? 'update' : 'create', path);
    }
  },

  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }
};
