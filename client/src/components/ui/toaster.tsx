import React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  // Temporarily disabled to prevent React hooks error
  // const { toasts } = useToast()
  
  // Return empty div to prevent crashes
  return <div style={{ display: 'none' }} />;
  
  // return (
  //   <ToastProvider>
  //     {toasts.map(function ({ id, title, description, action, ...props }) {
  //       return (
  //         <Toast key={id} {...props}>
  //           <div className="grid gap-1">
  //             {title && <ToastTitle>{title}</ToastTitle>}
  //             {description && (
  //               <ToastDescription>{description}</ToastDescription>
  //             )}
  //           </div>
  //           {action}
  //           <ToastClose />
  //         </Toast>
  //       )
  //     })}
  //     <ToastViewport />
  //   </ToastProvider>
  // )
}
