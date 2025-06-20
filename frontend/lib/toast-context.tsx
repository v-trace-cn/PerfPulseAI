"use client"

import * as React from "react"
import { genId, reducer, Action, ToasterToast, State, TOAST_LIMIT, TOAST_REMOVE_DELAY, addToRemoveQueue } from "@/lib/toast-utils"

interface ToastContextType extends State {
  toast: (props: Omit<ToasterToast, "id">) => {
    id: string
    dismiss: () => void
    update: (props: ToasterToast) => void
  }
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] })

  React.useEffect(() => {
    console.log("ToastProvider State Updated:", state.toasts);
  }, [state.toasts]);

  const toast = React.useCallback((props: Omit<ToasterToast, "id">) => {
    const id = genId()
    const update = (props: ToasterToast) =>
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...props, id },
      })
    const dismiss = () => dispatch({
        type: "DISMISS_TOAST",
        toastId: id,
      })

    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
      },
    })

    return {
      id: id,
      dismiss,
      update,
    }
  }, [])

  const dismissAll = React.useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS_TOAST", toastId })
  }, [])

  const value = React.useMemo(() => ({
    ...state,
    toast,
    dismiss: dismissAll,
  }), [state, toast, dismissAll])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = React.useContext(ToastContext)
  console.log("useToastContext: Context value received:", context);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
} 