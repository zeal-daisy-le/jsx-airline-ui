import { useErrorStore } from "@/stores/errorStore"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toast, dismissToast } = useErrorStore()

  return (
    <ToastProvider>
      {toast && (
        <Toast
          open
          onOpenChange={(open) => {
            if (!open) dismissToast()
          }}
        >
          <div className="grid gap-1">
            <ToastTitle>Connection issue</ToastTitle>
            <ToastDescription>{toast.message}</ToastDescription>
          </div>
          {toast.onRetry && (
            <ToastAction
              altText="Retry this action"
              onClick={toast.onRetry}
            >
              Retry
            </ToastAction>
          )}
          <ToastClose />
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  )
}
