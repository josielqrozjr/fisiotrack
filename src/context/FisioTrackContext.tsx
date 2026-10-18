'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Athlete } from '@/types/fisiotrack';
import { INITIAL_ATHLETES } from '@/data/mockAthletes';
import { evaluateClinicalSummary } from '@/lib/clinicalEngine';

const STORAGE_KEY = 'fisiotrack_athletes_v1';

interface FisioTrackContextType {
  athletes: Athlete[];
  isLoaded: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addAthlete: (newAthleteData: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>) => Athlete;
  deleteAthlete: (id: string) => void;
  getAthleteById: (id: string) => Athlete | undefined;
  restoreDemoData: () => void;
}

const FisioTrackContext = createContext<FisioTrackContextType | undefined>(undefined);

export function FisioTrackProvider({ children }: { children: React.ReactNode }) {
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAthletes(parsed);
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ATHLETES));
          setAthletes(INITIAL_ATHLETES);
        }
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ATHLETES));
        setAthletes(INITIAL_ATHLETES);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      setAthletes(INITIAL_ATHLETES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const persistAthletes = (updated: Athlete[]) => {
    setAthletes(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  };

  const addAthlete = (
    newAthleteData: Omit<Athlete, 'id' | 'createdAt' | 'clinicalSummary'>
  ): Athlete => {
    const slugBase = newAthleteData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `${slugBase || 'atleta'}-${Date.now().toString().slice(-4)}`;
    const createdAt = new Date().toISOString();
    const clinicalSummary = evaluateClinicalSummary(newAthleteData);

    const created: Athlete = {
      ...newAthleteData,
      id,
      createdAt,
      clinicalSummary,
    };

    const updated = [created, ...athletes];
    persistAthletes(updated);
    return created;
  };

  const deleteAthlete = (id: string) => {
    const updated = athletes.filter((a) => a.id !== id);
    persistAthletes(updated);
  };

  const getAthleteById = (id: string) => {
    return athletes.find((a) => a.id === id);
  };

  const restoreDemoData = () => {
    persistAthletes(INITIAL_ATHLETES);
  };

  return (
    <FisioTrackContext.Provider
      value={{
        athletes,
        isLoaded,
        searchQuery,
        setSearchQuery,
        addAthlete,
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
