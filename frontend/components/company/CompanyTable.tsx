import React, { memo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
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
  Building, 
  Users, 
  Building2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus 
} from 'lucide-react';
import { Company } from '@/hooks/useCompanyManagement';

interface CompanyTableProps {
  companies: Company[];
  currentUserCompanyId?: number;
  onJoinCompany: (company: Company) => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (company: Company) => void;
  showActions?: boolean;
}

export const CompanyTable = memo<CompanyTableProps>(({
  companies,
  currentUserCompanyId,
  onJoinCompany,
  onEditCompany,
  onDeleteCompany,
  showActions = true,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const isUserInCompany = (companyId: number) => {
    return currentUserCompanyId === companyId;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>公司名称</TableHead>
          <TableHead>域名</TableHead>
          <TableHead>加入公司</TableHead>
          <TableHead>员工数</TableHead>
          <TableHead>部门数</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          {showActions && <TableHead>操作</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.id}>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{company.name}</div>
                  {company.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {company.description}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {company.domain ? (
                <Badge variant="outline">{company.domain}</Badge>
              ) : (
                <span className="text-gray-400">未设置</span>
              )}
            </TableCell>
            <TableCell>
              {isUserInCompany(company.id) ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  已加入
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onJoinCompany(company)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <UserPlus className="mr-1 h-3 w-3" />
                  加入
                </Button>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{company.userCount}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span>{company.departmentCount}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant={company.isActive ? "default" : "secondary"}
                className={company.isActive ? "bg-green-100 text-green-800" : ""}
              >
                {company.isActive ? "活跃" : "停用"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {formatDate(company.createdAt)}
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
                    <DropdownMenuItem onClick={() => onEditCompany(company)}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteCompany(company)}
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
});

CompanyTable.displayName = 'CompanyTable';
