"use client"

import { useToastContext } from "@/lib/toast-context"
import { ToasterToast } from "@/lib/toast-utils";

export function useToast() {
  return useToastContext()
}
