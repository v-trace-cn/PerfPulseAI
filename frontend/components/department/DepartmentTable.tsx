import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Department } from '@/hooks/useDepartmentManagement';

interface DepartmentTableProps {
  departments: Department[];
  currentUserDepartmentId?: number;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (department: Department) => void;
  onViewMembers: (department: Department) => void;
  showActions?: boolean;
}

export function DepartmentTable({
  departments,
  currentUserDepartmentId,
  onEditDepartment,
  onDeleteDepartment,
  onViewMembers,
  showActions = true,
}: DepartmentTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const handleDepartmentClick = async (departmentId: number) => {
    try {
      // 发送 POST 请求获取访问令牌
      const response = await fetch('/api/department-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentId }),
      });

      const data = await response.json();

      if (data.success) {
        // 使用令牌导航到部门详情页面
        router.push(data.redirectUrl);
      } else {
        console.error('获取访问令牌失败:', data.error);
      }
    } catch (error) {
      console.error('导航失败:', error);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>部门名称</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>成员数</TableHead>
          <TableHead>创建时间</TableHead>
          {showActions && <TableHead>操作</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map((department) => (
          <TableRow key={department.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div>
                  <button
                    onClick={() => handleDepartmentClick(department.id)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                  >
                    {department.name}
                  </button>
                  {department.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {department.description}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant={department.isActive ? "default" : "secondary"}
                className={department.isActive ? "bg-green-100 text-green-800" : ""}
              >
                {department.isActive ? "活跃" : "停用"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{department.memberCount}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {formatDate(department.createdAt)}
            </TableCell>
            {showActions && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewMembers(department)}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看成员
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditDepartment(department)}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteDepartment(department)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
