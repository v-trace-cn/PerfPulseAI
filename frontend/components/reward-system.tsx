"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gift, Award, Trophy, Zap, Sparkles, Cpu } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

// 数据定义...
const rewards = [
  {
    id: 1,
    title: "额外休假日",
    description: "获得一天带薪休假",
    points: 750,
    category: "休闲",
    icon: Gift,
    likes: 85, // 添加喜爱度
  },
  {
    id: 2,
    title: "专业发展基金",
    description: "获得用于专业发展的资金支持",
    points: 1000,
    category: "职业发展",
    icon: Award,
    likes: 92, // 添加喜爱度
  },
  {
    id: 3,
    title: "技术书籍补贴",
    description: "获得用于购买专业技术书籍的补贴",
    points: 650,
    category: "职业发展",
    icon: Trophy,
    likes: 78, // 添加喜爱度
  },
  {
    id: 6,
    title: "健身房会员",
    description: "一个月的健身房会员资格",
    points: 450,
    category: "健康",
    icon: Gift,
    likes: 65, // 添加喜爱度
  },
  {
    id: 7,
    title: "京东购物卡",
    description: "获得价值200元的京东电子购物卡",
    points: 500,
    category: "休闲",
    icon: Gift,
    likes: 88, // 添加喜爱度
  },
  {
    id: 8,
    title: "硬件设备补贴",
    description: "获得用于购买笔记本电脑、显示器等工作设备的补贴",
    points: 800,
    category: "硬件设备",
    icon: Gift,
    likes: 76, // 添加喜爱度
  },
  {
    id: 9,
    title: "智能办公设备",
    description: "获得智能办公设备（如智能音箱、智能灯等）",
    points: 600,
    category: "硬件设备",
    icon: Gift,
    likes: 70, // 添加喜爱度
  },
]

// 股权分配奖励数据
const equityRewards = [
  {
    id: 1,
    title: "初创项目股权",
    description: "获得公司AI创新项目100股股权",
    points: 5000,
    category: "股权分配",
    icon: Trophy,
    likes: 95, // 添加喜爱度
  },
  {
    id: 2,
    title: "技术专利股权",
    description: "获得技术专利项目50股股权收益权",
    points: 3500,
    category: "股权分配",
    icon: Award,
    likes: 88, // 添加喜爱度
  },
  {
    id: 3,
    title: "产品收益分成",
    description: "获得产品年收益的20股分成权益",
    points: 2800,
    category: "股权分配",
    icon: Gift,
    likes: 82, // 添加喜爱度
  },
  {
    id: 4,
    title: "虚拟股票期权",
    description: "获得公司30股虚拟股票期权，可在特定条件下兑换",
    points: 4200,
    category: "股权分配",
    icon: Trophy,
    likes: 90, // 添加喜爱度
  },
]

// 只使用默认导出，不使用命名导出
const RewardSystem = () => {
  const { toast } = useToast()
  const [userPoints, setUserPoints] = useState(1250)
  const [activeTab, setActiveTab] = useState("rewards")
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false)
  const [suggestionType, setSuggestionType] = useState("point_value")
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [suggestionText, setSuggestionText] = useState("")
  const [suggestedValue, setSuggestedValue] = useState("")

  const handleOpenSuggestion = (reward: any) => {
    setSelectedReward(reward)
    setSuggestedValue(reward ? reward.points.toString() : "")
    setAiSuggestionOpen(true)
  }

  const handleSubmitSuggestion = () => {
    if (!suggestionText.trim()) {
      toast({
        title: "请输入建议内容",
        description: "建议内容不能为空",
        variant: "destructive",
      })
      return
    }

    if (suggestionType === "point_value" && (!suggestedValue.trim() || isNaN(Number(suggestedValue)))) {
      toast({
        title: "请输入有效的积分值",
        description: "积分值必须是数字",
        variant: "destructive",
      })
      return
    }

    // 提交建议逻辑
    toast({
      title: "建议已提交",
      description: "AI系统已收到您的建议，将在下一个积分周期评估",
    })

    // 重置表单
    setSuggestionText("")
    setSuggestedValue("")
    setAiSuggestionOpen(false)
  }

  const handleLikeReward = (rewardId: number) => {
    // 更新rewards数组中对应奖励的likes数量
    const updatedRewards = rewards.map((reward) => {
      if (reward.id === rewardId) {
        return { ...reward, likes: reward.likes + 1 }
      }
      return reward
    })

    // 更新equityRewards数组中对应奖励的likes数量
    const updatedEquityRewards = equityRewards.map((reward) => {
      if (reward.id === rewardId) {
        return { ...reward, likes: reward.likes + 1 }
      }
      return reward
    })

    // 显示提示
    toast({
      title: "点赞成功",
      description: "感谢您的反馈，这将帮助我们改进奖励系统",
    })
  }

  const filteredRewards =
    activeTab === "rewards"
      ? [...rewards]
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 6) // 按喜爱度排序并只展示前6个
      : activeTab === "股权分配"
        ? equityRewards
        : rewards.filter((reward) => reward.category.toLowerCase() === activeTab)

  return (
    // 组件渲染...
    <div className="space-y-6">
      <div
        className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-lg hover:bg-primary/10 transition-all cursor-pointer group"
        onClick={() => {
          setSelectedReward(null)
          setSuggestionType("general")
          setAiSuggestionOpen(true)
        }}
      >
        <div className="flex items-start space-x-3">
          <Cpu className="h-5 w-5 text-primary mt-0.5 group-hover:text-primary/80" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium">向AI提建议</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              团队成员可对AI设置的积分值提出建议，但最终决策权归AI系统。AI将基于数据分析、历史兑换记录和系统平衡性评估每项建议，并提供详细的采纳或拒绝理由。所有变更将在系统评估后的下一个积分周期生效。
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rewards" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-10 p-1 bg-muted/30 backdrop-blur-sm rounded-lg shadow-sm">
          <TabsTrigger
            value="rewards"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span>概览</span>
          </TabsTrigger>
          <TabsTrigger
            value="职业发展"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
          >
            <Zap className="mr-2 h-3.5 w-3.5" />
            <span>职业发展</span>
          </TabsTrigger>
          <TabsTrigger
            value="休闲"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
          >
            <Gift className="mr-2 h-3.5 w-3.5" />
            <span>休闲健康</span>
          </TabsTrigger>
          <TabsTrigger
            value="硬件设备"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-3.5 w-3.5"
            >
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <line x1="8" x2="16" y1="21" y2="21" />
              <line x1="12" x2="12" y1="17" y2="21" />
            </svg>
            <span>硬件设备</span>
          </TabsTrigger>
          <TabsTrigger
            value="股权分配"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-3.5 w-3.5"
            >
              <path d="M18 21v-2a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M22 12h-4"></path>
              <path d="M6 12H2"></path>
              <path d="M17 7h.01"></path>
              <path d="M7 7h.01"></path>
            </svg>
            <span>股权分配</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="tech-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                  <CardTitle className="text-md font-medium">{reward.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div
                      className="flex items-center text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLikeReward(reward.id)
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-0.5"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      {reward.likes}
                    </div>
                    <reward.icon className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardDescription className="min-h-[40px]">{reward.description}</CardDescription>
                  <Badge className="mt-2 bg-muted/30 text-foreground transition-colors duration-300 dark:border-white/10">
                    {reward.category}
                  </Badge>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="font-semibold flex items-center">
                    <Award className="h-4 w-4 text-primary mr-1" />
                    {reward.points}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs font-medium"
                      onClick={() => handleOpenSuggestion(reward)}
                    >
                      建议
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={userPoints < reward.points}
                      className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {userPoints >= reward.points ? "兑换" : "积分不足"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="职业发展" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards
              .filter((reward) => reward.category === "职业发展")
              .map((reward) => (
                <Card key={reward.id} className="tech-card overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                    <CardTitle className="text-md font-medium">{reward.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div
                        className="flex items-center text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLikeReward(reward.id)
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-0.5"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        {reward.likes}
                      </div>
                      <reward.icon className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardDescription className="min-h-[40px]">{reward.description}</CardDescription>
                    <Badge className="mt-2 bg-muted/30 text-foreground transition-colors duration-300 dark:border-white/10">
                      {reward.category}
                    </Badge>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="font-semibold flex items-center">
                      <Award className="h-4 w-4 text-primary mr-1" />
                      {reward.points}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => handleOpenSuggestion(reward)}
                      >
                        建议
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={userPoints < reward.points}
                        className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {userPoints >= reward.points ? "兑换" : "积分不足"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="休闲" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards
              .filter((reward) => reward.category === "休闲" || reward.category === "健康")
              .map((reward) => (
                <Card key={reward.id} className="tech-card overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                    <CardTitle className="text-md font-medium">{reward.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div
                        className="flex items-center text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLikeReward(reward.id)
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-0.5"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        {reward.likes}
                      </div>
                      <reward.icon className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardDescription className="min-h-[40px]">{reward.description}</CardDescription>
                    <Badge className="mt-2 bg-muted/30 text-foreground transition-colors duration-300 dark:border-white/10">
                      {reward.category}
                    </Badge>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="font-semibold flex items-center">
                      <Award className="h-4 w-4 text-primary mr-1" />
                      {reward.points}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => handleOpenSuggestion(reward)}
                      >
                        建议
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={userPoints < reward.points}
                        className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {userPoints >= reward.points ? "兑换" : "积分不足"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="硬件设备" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards
              .filter((reward) => reward.category === "硬件设备")
              .map((reward) => (
                <Card key={reward.id} className="tech-card overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                    <CardTitle className="text-md font-medium">{reward.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div
                        className="flex items-center text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLikeReward(reward.id)
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-0.5"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        {reward.likes}
                      </div>
                      <reward.icon className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardDescription className="min-h-[40px]">{reward.description}</CardDescription>
                    <Badge className="mt-2 bg-muted/30 text-foreground transition-colors duration-300 dark:border-white/10">
                      {reward.category}
                    </Badge>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="font-semibold flex items-center">
                      <Award className="h-4 w-4 text-primary mr-1" />
                      {reward.points}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => handleOpenSuggestion(reward)}
                      >
                        建议
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={userPoints < reward.points}
                        className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {userPoints >= reward.points ? "兑换" : "积分不足"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="股权分配" className="mt-0">
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-600 dark:text-amber-500 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div>
                <p className="text-sm font-medium mb-1 text-amber-800 dark:text-amber-400">高级奖励兑换提示</p>
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  股权分配为高级奖励，兑换后需要签署正式协议。股权分配受公司治理委员会审核，通常在7个工作日内完成审批。
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equityRewards.map((reward) => (
              <Card key={reward.id} className="tech-card overflow-hidden border-amber-200 dark:border-amber-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-100/80 to-transparent dark:from-amber-900/30">
                  <CardTitle className="text-md font-medium">{reward.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div
                      className="flex items-center text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLikeReward(reward.id)
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-0.5"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      {reward.likes}
                    </div>
                    <reward.icon className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardDescription className="min-h-[40px]">{reward.description}</CardDescription>
                  <Badge className="mt-2 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 transition-colors duration-300 dark:border-amber-800/50">
                    高级奖励
                  </Badge>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="font-semibold flex items-center">
                    <Award className="h-4 w-4 text-amber-600 dark:text-amber-500 mr-1" />
                    {reward.points}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-800/50"
                      onClick={() => handleOpenSuggestion(reward)}
                    >
                      建议
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={userPoints < reward.points}
                      className="h-8 text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                    >
                      {userPoints >= reward.points ? "申请兑换" : "积分不足"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      {/* AI建议对话框 */}
      <Dialog open={aiSuggestionOpen} onOpenChange={setAiSuggestionOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>向AI提出建议</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {!selectedReward && (
              <div className="grid grid-cols-12 items-center gap-4">
                <Label htmlFor="suggestionType" className="text-right col-span-3">
                  建议类型
                </Label>
                <div className="col-span-9">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="general"
                        name="suggestionType"
                        value="general"
                        checked={suggestionType === "general"}
                        onChange={() => setSuggestionType("general")}
                        className="mr-2"
                      />
                      <Label htmlFor="general">一般建议</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="new_reward"
                        name="suggestionType"
                        value="new_reward"
                        checked={suggestionType === "new_reward"}
                        onChange={() => setSuggestionType("new_reward")}
                        className="mr-2"
                      />
                      <Label htmlFor="new_reward">新增奖励</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(suggestionType === "point_value" || selectedReward) && (
              <div className="grid grid-cols-12 items-center gap-4">
                <Label htmlFor="suggestedValue" className="text-right col-span-3">
                  建议积分值
                </Label>
                <Input
                  id="suggestedValue"
                  type="number"
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  className="col-span-9"
                />
              </div>
            )}

            {suggestionType === "new_reward" && (
              <>
                <div className="grid grid-cols-12 items-center gap-4">
                  <Label htmlFor="rewardTitle" className="text-right col-span-3">
                    奖励名称
                  </Label>
                  <Input id="rewardTitle" placeholder="输入新奖励名称" className="col-span-9" />
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <Label htmlFor="rewardDescription" className="text-right col-span-3">
                    奖励描述
                  </Label>
                  <Input id="rewardDescription" placeholder="输入奖励描述" className="col-span-9" />
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <Label htmlFor="rewardCategory" className="text-right col-span-3">
                    奖励类别
                  </Label>
                  <select
                    id="rewardCategory"
                    className="col-span-9 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="职业发展">职业发展</option>
                    <option value="休闲">休闲</option>
                    <option value="健康">健康</option>
                  </select>
                </div>
                <div className="grid grid-cols-12 items-center gap-4">
                  <Label htmlFor="rewardPoints" className="text-right col-span-3">
                    建议积分值
                  </Label>
                  <Input id="rewardPoints" type="number" placeholder="输入积分值" className="col-span-9" />
                </div>
              </>
            )}

            <div className="grid grid-cols-12 items-start gap-4">
              <Label htmlFor="suggestionReason" className="text-right col-span-3 mt-2">
                建议理由
              </Label>
              <Textarea
                id="suggestionReason"
                placeholder="请详细说明您的建议理由..."
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                className="col-span-9 min-h-[120px]"
              />
            </div>

            <div className="mt-2 bg-muted/20 p-3 rounded-md">
              <p className="text-xs font-medium mb-1">AI将基于以下因素评估您的建议:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-muted-foreground">
                <li>历史兑换数据和用户偏好</li>
                <li>积分经济平衡性</li>
                <li>与其他奖励的价值对比</li>
                <li>实际成本和可行性</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiSuggestionOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitSuggestion}>提交建议</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 只使用默认导出
export default RewardSystem

