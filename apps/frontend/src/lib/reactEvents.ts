import type { DragEvent } from "react"

type PropagationEvent = {
  stopPropagation: () => void
}

type CancelableEvent = PropagationEvent & {
  preventDefault: () => void
}

export function stopEventPropagation(event: PropagationEvent) {
  event.stopPropagation()
}

export function cancelEvent(event: CancelableEvent) {
  event.preventDefault()
  event.stopPropagation()
}

export function blockDragEvent(event: DragEvent<HTMLElement>, dropEffect: DataTransfer["dropEffect"] = "none") {
  cancelEvent(event)
  event.dataTransfer.dropEffect = dropEffect
}
