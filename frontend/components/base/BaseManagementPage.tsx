import React, { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataLoader } from '@/components/ui/data-loader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search } from 'lucide-react';

export interface BaseEntity {
  id: number | string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseManagementPageProps<T extends BaseEntity> {
  title: string;
  icon: ReactNode;
  data: T[] | undefined;
  isLoading: boolean;
  error: any;
  searchPlaceholder?: string;
  onCreateClick: () => void;
  onEditItem: (item: T) => void;
  onDeleteItem: (item: T) => void;
  onViewItem?: (item: T) => void;
  renderTable: (items: T[], actions: {
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    onView?: (item: T) => void;
  }) => ReactNode;
  renderForm?: ReactNode;
  renderDeleteDialog?: ReactNode;
  additionalActions?: ReactNode;
  children?: ReactNode;
}

/**
 * 基础管理页面组件
 * 提供通用的CRUD界面模式，包括搜索、创建、编辑、删除功能
 */
export function BaseManagementPage<T extends BaseEntity>({
  title,
  icon,
  data,
  isLoading,
  error,
  searchPlaceholder = "搜索...",
  onCreateClick,
  onEditItem,
  onDeleteItem,
  onViewItem,
  renderTable,
  renderForm,
  renderDeleteDialog,
  additionalActions,
  children,
}: BaseManagementPageProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  // Filter data based on search term
  const filteredData = data?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteClick = (item: T) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const tableActions = {
    onEdit: onEditItem,
    onDelete: handleDeleteClick,
    onView: onViewItem,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <h3 className="text-3xl font-bold tracking-tight flex items-center">
              {icon}
              {title}
            </h3>
          </div>
          <div className="flex space-x-2">
            {additionalActions}
            <Button onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              创建
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>{title}列表</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataLoader
              data={filteredData}
              isLoading={isLoading}
              error={error}
            >
              {(data) => renderTable(data, tableActions)}
            </DataLoader>
          </CardContent>
        </Card>

        {/* Forms and Dialogs */}
        {renderForm}

        {/* Default Delete Dialog */}
        {!renderDeleteDialog && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除 "{itemToDelete?.name}" 吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Custom Delete Dialog */}
        {renderDeleteDialog}

        {/* Additional Content */}
        {children}
      </main>
    </div>
  );
}

/**
 * 基础表格操作Hook
 * 提供通用的表格操作状态管理
 */
export function useBaseTableActions<T extends BaseEntity>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const handleCreate = () => {
    setSelectedItem(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (item: T) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedItem(null);
  };

  return {
    selectedItem,
    isCreateDialogOpen,
    isEditDialogOpen,
    setCreateDialogOpen,
    setEditDialogOpen,
    handleCreate,
    handleEdit,
    handleCloseDialogs,
  };
}

/**
 * 基础表单Hook
 * 提供通用的表单状态管理和验证
 */
export function useBaseForm<T>(initialData: T, validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const updateField = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    if (!validationRules) return true;
    
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, validator]) => {
      const error = validator(formData[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = (data?: T) => {
    setFormData(data || initialData);
    setErrors({});
  };

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    setFormData,
  };
}
