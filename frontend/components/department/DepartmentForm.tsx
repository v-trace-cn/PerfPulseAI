import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Department, DepartmentFormData } from '@/hooks/useDepartmentManagement';

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DepartmentFormData) => void;
  department?: Department | null;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function DepartmentForm({
  open,
  onOpenChange,
  onSubmit,
  department,
  isLoading = false,
  mode,
}: DepartmentFormProps) {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<DepartmentFormData>>({});

  // 当部门数据变化时更新表单
  useEffect(() => {
    if (mode === 'edit' && department) {
      setFormData({
        name: department.name,
        description: department.description || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
      });
    }
    setErrors({});
  }, [department, mode, open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DepartmentFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '部门名称不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof DepartmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '创建新部门' : '编辑部门信息'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? '填写部门基本信息，创建后可以邀请成员加入。'
              : '修改部门的基本信息。'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">部门名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入部门名称"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">部门描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入部门描述（可选）"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '处理中...' : (mode === 'create' ? '创建' : '更新')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
