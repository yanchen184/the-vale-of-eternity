/**
 * Lobby state store using Zustand
 * @version 1.0.0
 */
console.log('[stores/useLobbyStore.ts] v1.0.0 loaded')

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { RoomInfo } from '@/types'

interface LobbyStore {
  // State
  rooms: RoomInfo[]
  currentRoom: RoomInfo | null
  isLoading: boolean
  error: string | null
  playerName: string
  isConnected: boolean

  // Actions
  setRooms: (rooms: RoomInfo[]) => void
  addRoom: (room: RoomInfo) => void
  updateRoom: (roomId: string, updates: Partial<RoomInfo>) => void
  removeRoom: (roomId: string) => void
  setCurrentRoom: (room: RoomInfo | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setPlayerName: (name: string) => void
  setConnected: (isConnected: boolean) => void

  // Reset
  resetLobby: () => void
}

const initialState = {
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,
  playerName: '',
  isConnected: false,
}

export const useLobbyStore = create<LobbyStore>()(
  devtools(
    set => ({
      ...initialState,

      setRooms: rooms => set({ rooms }),

      addRoom: room =>
        set(state => ({
          rooms: [...state.rooms.filter(r => r.id !== room.id), room],
        })),

      updateRoom: (roomId, updates) =>
        set(state => ({
          rooms: state.rooms.map(r => (r.id === roomId ? { ...r, ...updates } : r)),
          currentRoom:
            state.currentRoom?.id === roomId
              ? { ...state.currentRoom, ...updates }
              : state.currentRoom,
        })),

      removeRoom: roomId =>
        set(state => ({
          rooms: state.rooms.filter(r => r.id !== roomId),
          currentRoom: state.currentRoom?.id === roomId ? null : state.currentRoom,
        })),

      setCurrentRoom: room => set({ currentRoom: room }),

      setLoading: isLoading => set({ isLoading }),

      setError: error => set({ error }),

      setPlayerName: name => set({ playerName: name }),

      setConnected: isConnected => set({ isConnected }),

      resetLobby: () => set(initialState),
    }),
    { name: 'lobby-store' }
  )
)

export default useLobbyStore
