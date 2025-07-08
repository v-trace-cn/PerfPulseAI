/**
 * Reusable User Profile Card Component
 * Used for displaying user information in various contexts
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Award, 
  Mail, 
  Phone, 
  Github, 
  Building2, 
  Calendar,
  Pencil,
  Camera,
  LucideIcon 
} from "lucide-react";
import { User } from "@/lib/types";

export interface UserProfileCardProps {
  user: User;
  isEditable?: boolean;
  showFullDetails?: boolean;
  onEdit?: () => void;
  onAvatarClick?: () => void;
  className?: string;
  maxPoints?: number;
}

export interface ContactInfoProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  href?: string;
  isClickable?: boolean;
}

function ContactInfo({ icon: Icon, label, value, href, isClickable = false }: ContactInfoProps) {
  if (!value) return null;

  const content = (
    <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className={cn(
        "text-sm",
        isClickable && "text-primary hover:underline cursor-pointer"
      )}>
        {value}
      </span>
    </div>
  );

  if (href && isClickable) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

export function UserProfileCard({
  user,
  isEditable = false,
  showFullDetails = true,
  onEdit,
  onAvatarClick,
  className,
  maxPoints = 2000,
}: UserProfileCardProps) {
  const pointsPercentage = user.points ? (user.points / maxPoints) * 100 : 0;
  const remainingPoints = maxPoints - (user.points || 0);

  return (
    <Card className={cn(
      "tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp",
      className
    )}>
      <CardHeader className="flex flex-col items-center text-center pb-2 bg-gradient-to-r from-primary/10 to-transparent rounded-t-xl overflow-hidden">
        <div className="relative mb-2">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {isEditable && onAvatarClick && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0 bg-primary/20 hover:bg-primary/30"
              onClick={onAvatarClick}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CardTitle className="text-xl font-bold">{user.name}</CardTitle>
        
        <div className="flex flex-col items-center gap-1 mt-1">
          {user.department && user.position && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
              {user.department} · {user.position}
            </Badge>
          )}
          {user.joinDate && (
            <p className="text-sm text-muted-foreground">
              加入时间: {user.joinDate}
            </p>
          )}
        </div>

        {isEditable && onEdit && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 bg-background/50 backdrop-blur-sm"
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            编辑资料
          </Button>
        )}
      </CardHeader>

      {showFullDetails && (
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">联系方式</h4>
              </div>
              <div className="space-y-2">
                <ContactInfo
                  icon={Mail}
                  label="邮箱"
                  value={user.email}
                  href={`mailto:${user.email}`}
                  isClickable
                />
                <ContactInfo
                  icon={Phone}
                  label="电话"
                  value={user.phone}
                  href={`tel:${user.phone}`}
                  isClickable
                />
                <ContactInfo
                  icon={Github}
                  label="GitHub"
                  value={user.githubUrl}
                  href={user.githubUrl}
                  isClickable
                />
                <ContactInfo
                  icon={Building2}
                  label="部门"
                  value={user.department}
                />
              </div>
            </div>

            <Separator />

            {/* Points and Level */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">积分等级</h4>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <div className="text-lg font-bold">{user.points || 0}</div>
                <Badge className="ml-auto bg-primary/10 text-primary">
                  Lv.{user.level || 1}
                </Badge>
              </div>
              <Progress
                value={pointsPercentage}
                className="h-2 bg-muted/50"
                indicatorClassName="progress-indicator"
              />
              <p className="text-xs text-muted-foreground text-right">
                距离下一级别还需 <span className="text-primary">{remainingPoints}</span> 积分
              </p>
            </div>

            {/* Additional Stats */}
            {(user.completedTasks !== undefined || user.pendingTasks !== undefined) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">任务统计</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    {user.completedTasks !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {user.completedTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">已完成</p>
                      </div>
                    )}
                    {user.pendingTasks !== undefined && (
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {user.pendingTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">进行中</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Simplified version for colleague cards
export function ColleagueCard({ 
  user, 
  onSelect 
}: { 
  user: User; 
  onSelect?: (user: User) => void;
}) {
  return (
    <Card 
      className={cn(
        "tech-card cursor-pointer hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]",
        onSelect && "hover:border-primary/50"
      )}
      onClick={() => onSelect?.(user)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {user.department} · {user.position}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Award className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium">{user.points || 0} 积分</span>
              <Badge variant="outline" className="text-xs">
                Lv.{user.level || 1}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserProfileCard;
