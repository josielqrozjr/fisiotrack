'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Athlete } from '@/types/fisiotrack';
import {
  createAthleteAction,
  deleteAthleteAction,
  getAthletesAction,
  resetDemoDataAction,
  updateAthleteAction,
} from '@/app/actions/athleteActions';

interface FisioTrackContextType {
  athletes: Athlete[];
  isLoaded: boolean;
  isMutating: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refreshAthletes: () => Promise<void>;
  addAthlete: (
    newAthleteData: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
  ) => Promise<Athlete>;
  updateAthlete: (
    id: string,
    updatedData: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
  ) => Promise<Athlete>;
  deleteAthlete: (id: string) => Promise<void>;
  getAthleteById: (id: string) => Athlete | undefined;
  restoreDemoData: () => Promise<void>;
}

const FisioTrackContext = createContext<FisioTrackContextType | undefined>(undefined);

export function FisioTrackProvider({ children }: { children: React.ReactNode }) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshAthletes = useCallback(async () => {
    try {
      const dbAthletes = await getAthletesAction();
      setAthletes(dbAthletes);
    } catch (error) {
      console.error('Erro ao buscar atletas do banco SQLite (Prisma):', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshAthletes();
  }, [refreshAthletes]);

  const addAthlete = async (
    newAthleteData: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
  ): Promise<Athlete> => {
    setIsMutating(true);
    try {
      const created = await createAthleteAction(newAthleteData);
      setAthletes((prev) => [created, ...prev]);
      return created;
    } finally {
      setIsMutating(false);
    }
  };

  const updateAthlete = async (
    id: string,
    updatedData: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
  ): Promise<Athlete> => {
    setIsMutating(true);
    try {
      const updated = await updateAthleteAction(id, updatedData);
      setAthletes((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteAthlete = async (id: string): Promise<void> => {
    setIsMutating(true);
    try {
      await deleteAthleteAction(id);
      setAthletes((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setIsMutating(false);
    }
  };

  const getAthleteById = (id: string) => {
    return athletes.find((a) => a.id === id);
  };

  const restoreDemoData = async (): Promise<void> => {
    setIsMutating(true);
    try {
      const fresh = await resetDemoDataAction();
      setAthletes(fresh);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <FisioTrackContext.Provider
      value={{
        athletes,
        isLoaded,
        isMutating,
        searchQuery,
        setSearchQuery,
        refreshAthletes,
        addAthlete,
        updateAthlete,
        deleteAthlete,
        getAthleteById,
        restoreDemoData,
      }}
    >
      {children}
    </FisioTrackContext.Provider>
  );
}

export function useFisioTrack() {
  const context = useContext(FisioTrackContext);
  if (!context) {
    throw new Error('useFisioTrack deve ser utilizado dentro de um FisioTrackProvider');
  }
  return context;
}
