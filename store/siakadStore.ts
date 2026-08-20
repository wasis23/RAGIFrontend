import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mahasiswa } from '@/types/siakad.types';

interface SiakadState {
    activeTahunAkademikId: number | null;
    selectedMahasiswa: Mahasiswa | null;
}

interface SiakadActions {
    setActiveTahunAkademik: (id: number) => void;
    setSelectedMahasiswa: (mhs: Mahasiswa | null) => void;
    clearState: () => void;
}

type SiakadStore = SiakadState & SiakadActions;

const initialState: SiakadState = {
    activeTahunAkademikId: null,
    selectedMahasiswa: null,
};

export const useSiakadStore = create<SiakadStore>()(
    persist(
        (set) => ({
            ...initialState,
            setActiveTahunAkademik: (id) => set({ activeTahunAkademikId: id }),
            setSelectedMahasiswa: (mhs) => set({ selectedMahasiswa: mhs }),
            clearState: () => set(initialState),
        }),
        {
            name: 'siakad-storage',
        }
    )
);
