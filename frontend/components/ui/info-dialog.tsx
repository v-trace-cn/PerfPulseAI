/**
 * 统一的信息提示弹窗组件
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

export interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  onConfirm?: () => void;
}

export function InfoDialog({
  open,
  onOpenChange,
  title,
  message,
  type = 'info',
  confirmText = '确定',
  onConfirm,
}: InfoDialogProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      default:
        return 'text-blue-900';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <DialogTitle className={getHeaderColor()}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useInfoDialog() {
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showDialog = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    onConfirm?: () => void
  ) => {
    setDialog({
      open: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  const hideDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  const DialogComponent = () => (
    <InfoDialog
      open={dialog.open}
      onOpenChange={hideDialog}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      onConfirm={dialog.onConfirm}
    />
  );

  return {
    showDialog,
    hideDialog,
    DialogComponent,
    showSuccess: (title: string, message: string, onConfirm?: () => void) => 
      showDialog(title, message, 'success', onConfirm),
    showError: (title: string, message: string, onConfirm?: () => void) => 
      showDialog(title, message, 'error', onConfirm),
    showWarning: (title: string, message: string, onConfirm?: () => void) => 
      showDialog(title, message, 'warning', onConfirm),
    showInfo: (title: string, message: string, onConfirm?: () => void) => 
      showDialog(title, message, 'info', onConfirm),
  };
}
