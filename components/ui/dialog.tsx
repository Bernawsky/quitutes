"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm transition-opacity duration-200 print:hidden",
          "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        )}
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Mobile: folha que sobe do rodapé, colada nas bordas inferiores (padrão de app).
          "safe-bottom fixed inset-x-0 bottom-0 z-50 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5 pt-3 shadow-xl transition-transform duration-300 ease-out print:hidden",
          "data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
          // A partir de sm: modal centralizado tradicional (limpa left/right/bottom herdados do inset-x-0/bottom-0).
          "sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[90vh] sm:w-auto sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pt-5",
          "sm:data-[ending-style]:translate-y-0 sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0",
          "sm:data-[starting-style]:translate-y-0 sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        {/* Alça de arraste — só faz sentido na folha mobile */}
        <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden="true" />
        {children}
        <DialogPrimitive.Close
          aria-label="Fechar"
          className="tap absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:bg-secondary"
        >
          <X className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("mb-3 flex flex-col gap-1.5 pr-6", className)} {...props} />
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-lg font-bold text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }
