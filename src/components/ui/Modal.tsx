import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/50 backdrop-blur-sm p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-full rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto",
              wide ? "max-w-2xl" : "max-w-md",
            )}
          >
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
              <h3 className="font-display text-xl font-semibold text-navy-800">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700 cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
