import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, Award } from 'lucide-react';
import { UnifiedAvatar } from '@/components/ui/unified-avatar';
import { formatPoints } from '@/lib/types/points';

interface User {
  name: string;
  email: string;
  department: string;
  position: string;
  phone: string;
  points: number;
  level: number;
  skills: string[];
  joinDate: string;
}

interface ColleagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColleague: User | null;
  mounted: boolean;
}

export function ColleagueDialog({ 
  open, 
  onOpenChange, 
  selectedColleague, 
  mounted 
}: ColleagueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>同事资料</DialogTitle>
          <DialogDescription>查看团队成员的详细信息</DialogDescription>
        </DialogHeader>
        {selectedColleague && (
          <div className="py-4">
            <div className="flex flex-col items-center mb-4">
              <UnifiedAvatar
                name={selectedColleague.name}
                email={selectedColleague.email}
                size="xl"
                showBorder={true}
                borderStyle="heavy"
                className="mb-2"
              />
              <h2 className="text-xl font-bold">{selectedColleague.name}</h2>
              <Badge className="mt-1 bg-primary/10 text-primary border-none">
                {selectedColleague.department} · {selectedColleague.position}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">联系方式</h4>
                <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedColleague.email}</span>
                </div>
                <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedColleague.phone}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">积分等级</h4>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <div className="text-lg font-bold">{formatPoints(selectedColleague.points)}</div>
                  <Badge className="ml-auto bg-primary/10 text-primary">
                    {mounted ? `Lv.${selectedColleague.level}` : null}
                  </Badge>
                </div>
                <Progress
                  value={(selectedColleague.points / 2000) * 100}
                  className="h-2 bg-muted/50"
                  indicatorClassName="progress-indicator"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">专业技能</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedColleague.skills as string[] || []).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-muted/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-4">
                加入时间: {selectedColleague.joinDate}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
