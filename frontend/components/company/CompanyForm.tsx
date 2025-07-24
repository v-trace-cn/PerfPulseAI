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
import { Company, CompanyFormData } from '@/hooks/useCompanyManagement';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompanyFormData) => void;
  company?: Company | null;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function CompanyForm({
  open,
  onOpenChange,
  onSubmit,
  company,
  isLoading = false,
  mode,
}: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    domain: '',
  });

  const [errors, setErrors] = useState<Partial<CompanyFormData>>({});

  // 当公司数据变化时更新表单
  useEffect(() => {
    if (mode === 'edit' && company) {
      setFormData({
        name: company.name,
        description: company.description || '',
        domain: company.domain || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        domain: '',
      });
    }
    setErrors({});
  }, [company, mode, open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CompanyFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '公司名称不能为空';
    }
    
    if (formData.domain && formData.domain.trim()) {
      // 简单的域名格式验证
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(formData.domain.trim())) {
        newErrors.domain = '请输入有效的域名格式';
      }
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

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
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
            {mode === 'create' ? '创建新公司' : '编辑公司信息'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? '填写公司基本信息，创建后您将成为该公司的超级管理员。'
              : '修改公司的基本信息。'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">公司名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入公司名称"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">公司描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入公司描述（可选）"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">公司域名</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => handleInputChange('domain', e.target.value)}
              placeholder="例如：example.com（可选）"
              className={errors.domain ? 'border-red-500' : ''}
            />
            {errors.domain && (
              <p className="text-sm text-red-500">{errors.domain}</p>
            )}
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
