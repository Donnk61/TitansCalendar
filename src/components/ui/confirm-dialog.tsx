import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function ConfirmDialog({
  body,
  confirmLabel,
  open = false,
  title,
}: {
  body: ReactNode;
  confirmLabel: string;
  open?: boolean;
  title: string;
}) {
  return (
    <Dialog open={open} title={title}>
      <div className="grid gap-5">
        <div className="flex gap-3 text-sm leading-6 text-text-secondary">
          <AlertTriangle
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-warning"
          />
          <div>{body}</div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}
