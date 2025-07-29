import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Building, 
  Code, 
  Award, 
  Cpu 
} from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/unified-avatar';
import { formatPoints } from '@/lib/types/points';

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

interface ProfileCardProps {
  userData: UserData;
  setUserData: (userData: UserData) => void;
  mounted: boolean;
}

export function ProfileCard({ userData, setUserData, mounted }: ProfileCardProps) {
  const [showPhone, setShowPhone] = useState(false);

  return (
    <Card className="tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp md:col-span-1">
      <CardHeader className="flex flex-col items-center text-center pb-2 bg-gradient-to-r from-primary/10 to-transparent rounded-t-xl overflow-hidden">
        <div className="relative mb-2">
          <ProfileAvatar
            name={userData.name}
            email={userData.email}
          />
          <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">{userData.name}</CardTitle>
        <div className="flex flex-col items-center gap-1 mt-1">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
            {userData.department} · {userData.position}
          </Badge>
          <p className="text-sm text-muted-foreground">加入时间: {userData.joinDate}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">联系方式</h4>
            </div>
            <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{userData.email}</span>
            </div>
            <div className="grid grid-cols-[20px_1fr_auto] gap-2 items-center">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm transition-all duration-300">
                {showPhone ? (
                  <span className="text-foreground font-medium">{userData.phone}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {userData.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                  </span>
                )}
              </span>
              <button
                onClick={() => setShowPhone(!showPhone)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                {showPhone ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>隐藏手机号</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>显示手机号</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <Separator />

          {/* 公司信息 */}
          {userData.companyName && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">公司</h4>
              <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{userData.companyName}</span>
              </div>
            </div>
          )}

          {userData.companyName && <Separator />}

          {/* GitHub 账号 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">GitHub 地址</h4>
            <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
              <Code className="h-4 w-4 text-muted-foreground" />
              {userData.githubUrl ? (
                <a
                  href={userData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {userData.githubUrl}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {userData.githubUrl}
                </span>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">积分等级</h4>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div className="text-lg font-bold">{formatPoints(userData.points)}</div>
              <Badge className="ml-auto bg-primary/10 text-primary">{mounted ? `Lv.${userData.level}` : null}</Badge>
            </div>
            <Progress
              value={(userData.points / 2000) * 100}
              className="h-2 bg-muted/50"
              indicatorClassName="progress-indicator"
            />
            <p className="text-xs text-muted-foreground text-right">
              距离下一级别还需 <span className="text-primary">{formatPoints(2000 - userData.points)}</span> 积分
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">专业技能</h4>
            <div className="flex flex-wrap gap-2">
              {(userData.skills as string[] || []).map((skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-muted/30 pr-1 pl-2 flex items-center gap-1 group"
                >
                  {skill}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setUserData({
                        ...userData,
                        skills: (userData.skills as string[]).filter((_, i) => i !== index),
                      })
                    }}
                    className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
