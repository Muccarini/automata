import type { MouseEvent } from "react"
import { Trash2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAutomaGraphStore } from "@/store/automaGraphStore"

export function NodeDeletionDialog() {
  const pendingNodeDeletionId = useAutomaGraphStore((state) => state.pendingNodeDeletionId)
  const nodes = useAutomaGraphStore((state) => state.nodes)
  const edges = useAutomaGraphStore((state) => state.edges)
  const confirmNodeRemoval = useAutomaGraphStore((state) => state.confirmNodeRemoval)
  const cancelNodeRemoval = useAutomaGraphStore((state) => state.cancelNodeRemoval)

  const node = nodes.find((item) => item.id === pendingNodeDeletionId) ?? null
  const connectionCount = node
    ? edges.filter((edge) => edge.source === node.id || edge.target === node.id).length
    : 0
  const connectionLabel = connectionCount === 1 ? "connection" : "connections"

  const stopDialogEventPropagation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  const handleConfirmNodeRemoval = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    confirmNodeRemoval()
  }

  return (
    <AlertDialog
      open={Boolean(node)}
      onOpenChange={(open) => {
        if (!open) {
          cancelNodeRemoval()
        }
      }}
    >
      <AlertDialogContent
        size="sm"
        onPointerDown={stopDialogEventPropagation}
        onPointerUp={stopDialogEventPropagation}
        onClick={stopDialogEventPropagation}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this node?</AlertDialogTitle>
          <AlertDialogDescription>
            {node
              ? `The node "${node.data.label}" will be removed together with ${connectionCount} connected ${connectionLabel}.`
              : "The selected node will be removed together with its connected edges."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onPointerDown={stopDialogEventPropagation}
            onPointerUp={stopDialogEventPropagation}
            onClick={stopDialogEventPropagation}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onPointerDown={stopDialogEventPropagation}
            onPointerUp={stopDialogEventPropagation}
            onClick={handleConfirmNodeRemoval}
          >
            Delete node
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}