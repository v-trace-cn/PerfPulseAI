import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Activity } from 'lucide-react';
import { RecentActivities } from '@/components/recent-activities';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  date: string;
}

interface UserData {
  achievements?: Achievement[];
}

interface ProfileAchievementsProps {
  userData: UserData;
}

export function ProfileAchievements({ userData }: ProfileAchievementsProps) {
  return (
    <Card className="tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp md:col-span-2 pb-6">
      <CardHeader>
        <CardTitle>个人成就与活动</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activities" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/30 backdrop-blur-sm rounded-lg shadow-sm">
            <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
            >
              <Trophy className="mr-2 h-3.5 w-3.5" />
              <span>成就徽章</span>
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
            >
              <Activity className="mr-2 h-3.5 w-3.5" />
              <span>最近个人活动</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(userData.achievements || []).map((achievement: Achievement) => (
                <Card key={achievement.id} className="tech-card overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-md font-medium">{achievement.title}</CardTitle>
                    <div className="text-2xl">{achievement.icon}</div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-muted-foreground">{achievement.date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <RecentActivities />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
