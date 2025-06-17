'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Code, FileText, GitCommit, MessageSquare } from "lucide-react"

const activities = [
  {
    id: 1,
    user: {
      name: "张明",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "张",
    },
    activity: "完成了算法偏见检测任务",
    timestamp: "刚刚",
    points: 15,
    type: "task",
  },
  {
    id: 2,
    user: {
      name: "李华",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "李",
    },
    activity: "提交了数据隐私审计报告",
    timestamp: "2小时前",
    points: 25,
    type: "report",
  },
  {
    id: 3,
    user: {
      name: "王芳",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "王",
    },
    activity: "参与了道德委员会讨论",
    timestamp: "昨天",
    points: 10,
    type: "discussion",
  },
  {
    id: 4,
    user: {
      name: "赵伟",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "赵",
    },
    activity: "完成了透明度报告",
    timestamp: "2天前",
    points: 20,
    type: "report",
  },
  {
    id: 5,
    user: {
      name: "刘洋",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "刘",
    },
    activity: "提出了创新治理框架",
    timestamp: "3天前",
    points: 30,
    extraPoints: 5,
    type: "code",
  },
]

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
  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div
          className="flex items-center p-3 rounded-lg hover:bg-muted/20 transition-colors duration-300"
          key={activity.id}
        >
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
            <p className="text-sm text-muted-foreground">{activity.activity}</p>
            <div className="flex items-center">
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              <span className="mx-1 text-muted-foreground">•</span>
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0 h-4 transition-colors duration-300 dark:border-white/10 border-black/5 shadow-sm"
              >
                <GitCommit className="mr-1 h-3 w-3 text-primary" />
                任务 #{activity.id}
              </Badge>
            </div>
          </div>
          <div className="ml-auto font-medium">
            <div className="data-pill bg-primary/10 text-primary shadow-sm">
              +{activity.points} 积分
              {activity.extraPoints && <span className="ml-1 text-green-400">+5 团队</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

