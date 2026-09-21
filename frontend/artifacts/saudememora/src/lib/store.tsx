import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { initialActivities, initialDocuments, initialProfile, initialRecord } from './mock-data';
import type { Activity, MedicalDocument, MedicalRecord, UserProfile } from './types';

type Store = {
  isAuthenticated: boolean;
  profile: UserProfile;
  record: MedicalRecord;
  documents: MedicalDocument[];
  activities: Activity[];
  signIn: (name?: string) => void;
  signOut: () => void;
  updateProfile: (profile: UserProfile) => void;
  updateRecord: (record: MedicalRecord) => void;
  addDocument: (document: MedicalDocument) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [record, setRecord] = useState(initialRecord);
  const [documents, setDocuments] = useState(initialDocuments);
  const [activities, setActivities] = useState(initialActivities);
  const value = useMemo<Store>(() => ({
    isAuthenticated,
    profile,
    record,
    documents,
    activities,
    signIn: (name) => { if (name) setProfile((old) => ({ ...old, name })); setAuthenticated(true); },
    signOut: () => setAuthenticated(false),
    updateProfile: (next) => {
      setProfile(next);
      setActivities((old) => [{ id: `act-${Date.now()}`, label: 'Perfil de saúde atualizado', timestamp: 'Agora', type: 'profile' }, ...old]);
    },
    updateRecord: (next) => {
      setRecord(next);
      setActivities((old) => [{ id: `act-${Date.now()}`, label: 'Anamnese revisada', timestamp: 'Agora', type: 'edit' }, ...old]);
    },
    addDocument: (document) => {
      setDocuments((old) => [document, ...old]);
      setActivities((old) => [{ id: `act-${Date.now()}`, label: `${document.title} adicionado`, timestamp: 'Agora', type: 'upload' }, ...old]);
    },
  }), [isAuthenticated, profile, record, documents, activities]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}