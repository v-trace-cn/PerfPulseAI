import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Department {
  id: number;
  name: string;
}

interface UserData {
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  githubUrl: string;
  joinDate: string;
  points: number;
  level: number;
  companyName?: string;
  skills: string[];
}

interface User {
  id?: number;
  companyId?: number;
}

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData;
  setUserData: (userData: UserData) => void;
  selectedDepartment?: string;
  setSelectedDepartment: (departmentId: string | undefined) => void;
  departments: Department[];
  isLoadingDepartments: boolean;
  user?: User;
  onSave: (e: React.FormEvent) => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  userData,
  setUserData,
  selectedDepartment,
  setSelectedDepartment,
  departments,
  isLoadingDepartments,
  user,
  onSave
}: ProfileEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
          <DialogDescription>
            更新您的个人信息和偏好设置
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSave}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                姓名
              </Label>
              <Input
                id="edit-name"
                name="edit-name"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-department" className="text-right">
                组织
              </Label>
              <Select
                key={`dept-select-${isLoadingDepartments}-${departments.length}`}
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
                disabled={!user?.companyId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={user?.companyId ? "选择组织" : "请先加入公司"} />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {!user?.companyId ? (
                    <SelectItem value="no-company" disabled>请先加入公司</SelectItem>
                  ) : isLoadingDepartments ? (
                    <SelectItem value="loading" disabled>加载中...</SelectItem>
                  ) : departments.length === 0 ? (
                    <SelectItem value="no-orgs" disabled>暂无组织</SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-position" className="text-right">
                职位
              </Label>
              <Input
                id="edit-position"
                name="edit-position"
                value={userData.position}
                onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                邮箱
              </Label>
              <Input
                id="edit-email"
                name="edit-email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                手机
              </Label>
              <Input
                id="edit-phone"
                name="edit-phone"
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-github" className="text-right">
                GitHub 地址
              </Label>
              <Input
                id="edit-github"
                name="edit-github"
                value={userData.githubUrl}
                onChange={(e) => setUserData({ ...userData, githubUrl: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">保存更改</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
