import { create } from "zustand"

type ViewportDnDState = {
  isVariableDragActive: boolean
  beginVariableDrag: () => void
  endVariableDrag: () => void
}

export const useViewportDnDStore = create<ViewportDnDState>((set) => ({
  isVariableDragActive: false,
  beginVariableDrag: () => set({ isVariableDragActive: true }),
  endVariableDrag: () => set({ isVariableDragActive: false }),
}))
