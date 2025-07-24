import React, { ReactNode } from 'react';
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

export interface BaseFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'number' | 'select' | 'custom';
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => string | undefined;
  options?: Array<{ value: string; label: string }>; // for select type
  customComponent?: ReactNode; // for custom type
  rows?: number; // for textarea
}

export interface BaseFormProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: T) => void;
  title: string;
  description?: string;
  fields: BaseFormField[];
  initialData?: Partial<T>;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
}

/**
 * 通用表单组件
 * 支持多种字段类型和验证
 */
export function BaseForm<T extends Record<string, any>>({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  fields,
  initialData = {},
  isLoading = false,
  submitText = "提交",
  cancelText = "取消",
}: BaseFormProps<T>) {
  const [formData, setFormData] = React.useState<Partial<T>>(initialData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // 当初始数据或对话框状态变化时重置表单
  React.useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
    }
  }, [initialData, open]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // 清除该字段的错误
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name];
      
      // 必填验证
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        newErrors[field.name] = `${field.label}不能为空`;
        isValid = false;
        return;
      }

      // 自定义验证
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData as T);
  };

  const renderField = (field: BaseFormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const commonProps = {
      id: field.name,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleFieldChange(field.name, e.target.value),
      placeholder: field.placeholder,
      className: error ? 'border-red-500' : '',
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={field.rows || 3}
          />
        );
      
      case 'select':
        return (
          <select
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
          >
            <option value="">{field.placeholder || `请选择${field.label}`}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'custom':
        return field.customComponent;
      
      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
              {errors[field.name] && (
                <p className="text-sm text-red-500">{errors[field.name]}</p>
              )}
            </div>
          ))}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '处理中...' : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 常用验证函数
 */
export const validators = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? undefined : '请输入有效的邮箱地址';
  },
  
  minLength: (min: number) => (value: string) => {
    return value.length >= min ? undefined : `至少需要${min}个字符`;
  },
  
  maxLength: (max: number) => (value: string) => {
    return value.length <= max ? undefined : `最多${max}个字符`;
  },
  
  required: (value: any) => {
    return value && value.toString().trim() ? undefined : '此字段为必填项';
  },
  
  url: (value: string) => {
    try {
      new URL(value);
      return undefined;
    } catch {
      return '请输入有效的URL地址';
    }
  },
  
  phone: (value: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value) ? undefined : '请输入有效的手机号码';
  },
  
  number: (value: string) => {
    return !isNaN(Number(value)) ? undefined : '请输入有效的数字';
  },
  
  positiveNumber: (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num > 0 ? undefined : '请输入大于0的数字';
  },
};
