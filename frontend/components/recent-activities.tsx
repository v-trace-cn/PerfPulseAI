'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Code, FileText, GitCommit, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/lib/auth-context"
import { getRelativeDate } from "@/lib/utils"
import { directActivityApi } from "@/lib/direct-api"

interface Activity {
  id: string;
  show_id: string;
  title: string;
  description: string;
  points: number;
  user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  type: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "task":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
    case "report":
      return <FileText className="h-3.5 w-3.5 text-blue-400" />
    case "discussion":
      return <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
    case "code":
      return <Code className="h-3.5 w-3.5 text-yellow-400" />
    default:
      return <GitCommit className="h-3.5 w-3.5 text-gray-400" />
  }
}

export function RecentActivities() {
  const { execute: fetchActivitiesApi } = useApi(directActivityApi.getRecentActivities);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: userLoading } = useAuth();

  useEffect(() => {
    const fetchActivities = async () => {
      if (userLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchActivitiesApi(user.id);
        if (response && response.success) {
          const fetchedActivities: Activity[] = response.data.map((activity: any) => ({
            id: activity.id,
            show_id: activity.show_id,
            title: activity.title,
            description: activity.description,
            points: activity.points,
            user_id: activity.user_id,
            status: activity.status,
            created_at: activity.created_at,
            completed_at: activity.completed_at,
            user: {
              name: activity.user ? activity.user.name : "未知用户",
              avatar: activity.user ? activity.user.avatar : "/placeholder-user.jpg",
              initials: activity.user ? (activity.user.name ? activity.user.name[0] : "无") : "无",
            },
            type: activity.status || "default",
          }));
          setActivities(fetchedActivities.slice(0, 5));
        } else {
          setError(response?.message || "Failed to fetch activities");
        }
      } catch (err: any) {
        setError("Error fetching activities: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [fetchActivitiesApi, user, userLoading]);

  if (loading) {
    return <div className="text-center text-muted-foreground">加载中...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive">错误: {error}</div>;
  }

  if (activities.length === 0) {
    return <div className="text-center text-muted-foreground">暂无最新活动。</div>;
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <Link href={`/activities/${activity.show_id}`} key={activity.id}>
          <div className="flex items-center p-3 rounded-lg hover:bg-muted/20 transition-colors duration-300">
            <div className="relative">
              <Avatar className="h-9 w-9 border transition-colors duration-300 dark:border-white/10 border-black/5 shadow-sm">
                <AvatarImage src={activity.user.avatar} alt="Avatar" />
                <AvatarFallback className="bg-primary/10 text-primary">{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{activity.user.name}</p>
              <p className="text-sm text-muted-foreground">{activity.title}</p>
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground">
                  {getRelativeDate(activity.created_at)}
                </p>
              </div>
            </div>
            <div className="ml-auto font-medium">
              <div className="data-pill bg-primary/10 text-primary shadow-sm">
                +{activity.points} 积分
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

