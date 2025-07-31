"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PlusCircle,
  Network,
  Lightbulb,
  Brain,
  Code,
  Eye,
  Users,
  Shield,
  FileTextIcon,
  GraduationCapIcon,
  MessageSquare,
  Layers,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScoreCard } from "@/components/ui/score-card"

// Define mock data for scoringCategories and recentScores directly
const scoringCategories = [
  { name: "设计贡献", icon: Brain, color: "text-blue-500" },
  { name: "开发贡献", icon: Code, color: "text-green-500" },
  { name: "代码审查", icon: Eye, color: "text-red-500" },
  { name: "社区参与", icon: Users, color: "text-purple-500" },
  { name: "Bug 修复", icon: Shield, color: "text-yellow-500" },
  { name: "文档", icon: FileTextIcon, color: "text-indigo-500" },
  { name: "指导", icon: GraduationCapIcon, color: "text-pink-500" },
  { name: "研究与创新", icon: Lightbulb, color: "text-orange-500" },
  { name: "团队协作", icon: Network, color: "text-teal-500" },
  { name: "客户支持", icon: MessageSquare, color: "text-cyan-500" },
  { name: "项目管理", icon: Layers, color: "text-lime-500" },
];

const recentScores = [
  {
    id: 1,
    user: "当前用户",
    avatar: "/placeholder-user.jpg",
    category: "开发贡献",
    points: 15,
    description: "完成了新的用户认证模块的开发",
    date: "2023-10-26T10:00:00Z",
    likes: ["张明", "李华"],
    comments: [{ user: "王芳", text: "很棒的模块！" }],
  },
  {
    id: 2,
    user: "张明",
    avatar: "/placeholder-user.jpg",
    category: "代码审查",
    points: 8,
    description: "审查了后端 API 的拉取请求，并提供了宝贵建议",
    date: "2023-10-25T14:30:00Z",
    likes: ["当前用户"],
    comments: [],
  },
  {
    id: 3,
    user: "李华",
    avatar: "/placeholder-user.jpg",
    category: "社区参与",
    points: 10,
    description: "在社区论坛积极回答用户问题，提升了品牌形象",
    date: "2023-10-24T09:00:00Z",
    likes: [],
    comments: [],
  },
];

const avatars: { [key: string]: string } = {
  "当前用户": "/placeholder-user.jpg",
  "张明": "/placeholder-user.jpg", 
  "李华": "/placeholder-user.jpg",
  "王芳": "/placeholder-user.jpg",
  // 添加更多用户及其头像路径
};

// 获取分类图标
function getCategoryIcon(category: string) {
  const categoryObj = scoringCategories.find((c) => c.name === category)
  if (!categoryObj) return null

  const IconComponent = categoryObj.icon
  return <IconComponent className="h-4 w-4" />
}

export function ScoringSystem() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [commentingScoreId, setCommentingScoreId] = useState<number | null>(null)
  const [commentText, setCommentText] = useState("")
  const [objectionDialogOpen, setObjectionDialogOpen] = useState(false)
  const [objectingScoreId, setObjectingScoreId] = useState<number | null>(null)
  const [objectionReason, setObjectionReason] = useState("")
  const [requestedPoints, setRequestedPoints] = useState("")
  const [localScores, setLocalScores] = useState(recentScores)
  const [activeTab, setActiveTab] = useState("all")
  // 在组件的 state 部分添加一个新的状态变量
  const [showCollaborationAnalysis, setShowCollaborationAnalysis] = useState(false)

  // 点赞/取消点赞
  const handleLike = (scoreId: number) => {
    setLocalScores((prev) =>
      prev.map((score) => {
        if (score.id === scoreId) {
          const currentUser = "当前用户"
          const isLiked = score.likes.includes(currentUser)

          if (isLiked) {
            const newLikes = score.likes.filter((user) => user !== currentUser)
            toast({
              title: "已取消点赞",
              description: `已从${score.user}的任务中移除您的点赞`,
            })
            return { ...score, likes: newLikes }
          } else {
            const newLikes = [...score.likes, currentUser]
            toast({
              title: "点赞成功",
              description: `已为${score.user}的任务添加点赞`,
            })
            return { ...score, likes: newLikes }
          }
        }
        return score
      }),
    )
  }

  const openCommentDialog = (scoreId: number) => {
    setCommentingScoreId(scoreId)
    setCommentDialogOpen(true)
  }

  const openObjectionDialog = (scoreId: number) => {
    const score = localScores.find((s) => s.id === scoreId)
    if (score && score.user !== "当前用户") {
      toast({
        title: "无法提交异议",
        description: "您只能对自己的评分提出异议",
        variant: "destructive",
      })
      return
    }

    setObjectingScoreId(scoreId)
    setObjectionDialogOpen(true)
  }

  // 添加这个 useEffect 来处理 requestedPoints 的设置
  React.useEffect(() => {
    if (objectingScoreId !== null) {
      const currentScore = localScores.find((s) => s.id === objectingScoreId)?.points || 0
      setRequestedPoints((currentScore + 5).toString())
    }
  }, [objectingScoreId, localScores])

  const filteredScores = activeTab === "all" ? localScores : localScores.filter((score) => score.category === activeTab)

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card rounded-xl shadow-lg">
        {/* 修改 CardHeader 部分，添加点击事件 */}
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <CardTitle className="cursor-pointer hover:text-primary transition-colors flex items-center">
                    添加贡献
                    <PlusCircle className="ml-2 h-4 w-4" />
                  </CardTitle>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
                  style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                  <DialogHeader>
                    <DialogTitle>添加治理记录</DialogTitle>
                    <DialogDescription>记录团队成员的治理贡献</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="contributionType" className="text-right">
                        贡献类型
                      </Label>
                      <div className="col-span-3">
                        <div className="flex space-x-4">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="singleContributor"
                              name="contributionType"
                              value="single"
                              defaultChecked
                              className="mr-2"
                              onChange={() => {
                                const multiSection = document.getElementById("multiContributorSection")
                                const contributorSelect = document.getElementById("contributor")
                                if (multiSection && contributorSelect) {
                                  multiSection.style.display = "none"
                                  contributorSelect.parentElement.parentElement.style.display = "grid"
                                }
                              }}
                            />
                            <Label htmlFor="singleContributor">个人贡献</Label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="multiContributor"
                              name="contributionType"
                              value="multi"
                              className="mr-2"
                              onChange={() => {
                                const multiSection = document.getElementById("multiContributorSection")
                                const contributorSelect = document.getElementById("contributor")
                                if (multiSection && contributorSelect) {
                                  multiSection.style.display = "grid"
                                  contributorSelect.parentElement.parentElement.style.display = "none"
                                }
                              }}
                            />
                            <Label htmlFor="multiContributor">团队贡献</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4" id="contributorSelectSection">
                      <Label htmlFor="contributor" className="text-right">
                        贡献者
                      </Label>
                      <div className="col-span-3">
                        <select
                          id="contributor"
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue="当前用户"
                        >
                          <option value="当前用户">当前用户（我）</option>
                          <option value="张明">张明</option>
                          <option value="李华">李华</option>
                          <option value="王芳">王芳</option>
                          <option value="赵伟">赵伟</option>
                          <option value="刘洋">刘洋</option>
                        </select>
                      </div>
                    </div>

                    <div
                      id="multiContributorSection"
                      className="grid grid-cols-4 items-center gap-4"
                      style={{ display: "none" }}
                    >
                      <Label htmlFor="teamContributors" className="text-right">
                        团队成员
                      </Label>
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1.5 p-1.5 border rounded-md min-h-[70px] items-center">
                          <Badge className="bg-primary/10 text-primary flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-normal h-5 leading-none">
                            当前用户（我）
                            <button className="ml-0.5 text-primary hover:text-primary/80 h-3 w-3 inline-flex items-center justify-center text-[10px]">
                              ×
                            </button>
                          </Badge>
                          <div className="relative" id="teamMemberSelector">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-5 px-1.5 py-0 text-[10px] font-normal"
                              id="addTeamMemberBtn"
                            >
                              <PlusCircle className="h-2.5 w-2.5 mr-0.5" />
                              添加成员
                            </Button>
                            <div
                              className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-10 hidden"
                              id="teamMemberDropdown"
                            >
                              <div className="p-2">
                                <div className="mb-2">
                                  <Input
                                    type="text"
                                    placeholder="搜索成员..."
                                    className="h-7 text-xs"
                                    id="teamMemberSearch"
                                  />
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1" id="teamMemberList">
                                  <div className="flex items-center px-2 py-1 hover:bg-muted/50 rounded-sm cursor-pointer text-xs">
                                    <span>张明</span>
                                  </div>
                                  <div className="flex items-center px-2 py-1 hover:bg-muted/50 rounded-sm cursor-pointer text-xs">
                                    <span>李华</span>
                                  </div>
                                  <div className="flex items-center px-2 py-1 hover:bg-muted/50 rounded-sm cursor-pointer text-xs">
                                    <span>王芳</span>
                                  </div>
                                  <div className="flex items-center px-2 py-1 hover:bg-muted/50 rounded-sm cursor-pointer text-xs">
                                    <span>赵伟</span>
                                  </div>
                                  <div className="flex items-center px-2 py-1 hover:bg-muted/50 rounded-sm cursor-pointer text-xs">
                                    <span>刘洋</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            已选择 <span id="selectedMemberCount">1</span> 名成员
                          </p>
                          <div className="text-xs text-muted-foreground">
                            <Label htmlFor="contributionDistribution" className="mr-2">
                              贡献分配:
                            </Label>
                            <select
                              id="contributionDistribution"
                              className="inline-flex h-6 text-xs rounded-md border border-input bg-background px-2 py-1 ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="equal">平均分配</option>
                              <option value="custom">自定义分配</option>
                              <option value="leader">主导者优先</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        贡献类别
                      </Label>
                      <div className="col-span-3">
                        <select
                          id="category"
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">选择类别</option>
                          <option value="创新贡献">创新贡献</option>
                          <option value="知识分享">知识分享</option>
                          <option value="团队协作">团队协作</option>
                          <option value="效率提升">效率提升</option>
                          <option value="任务完成">任务完成</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="method" className="text-right">
                        贡献方式
                      </Label>
                      <div className="col-span-3">
                        <select
                          id="method"
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">选择方式</option>
                          <option value="文档编写">文档编写</option>
                          <option value="代码贡献">代码贡献</option>
                          <option value="会议组织">会议组织</option>
                          <option value="培训讲解">培训讲解</option>
                          <option value="问题解决">问题解决</option>
                          <option value="流程优化">流程优化</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date" className="text-right">
                        贡献日期
                      </Label>
                      <div className="col-span-3 relative">
                        <Input
                          id="date"
                          type="date"
                          className="w-full h-10 pl-10 cursor-pointer"
                          defaultValue={new Date().toISOString().split("T")[0]}
                        />
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
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        详细描述
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="详细描述贡献内容、影响和价值..."
                        className="col-span-3 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="resources" className="text-right">
                        相关资料
                      </Label>
                      <div className="col-span-3 space-y-2">
                        <Input id="resources" type="text" placeholder="相关文档、链接或资源" />
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Button variant="outline" size="sm" className="h-7 mr-2">
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            添加更多
                          </Button>
                          支持文档链接、代码仓库、会议记录等
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="impact" className="text-right">
                        影响范围
                      </Label>
                      <div className="col-span-3">
                        <select
                          id="impact"
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">选择影响范围</option>
                          <option value="个人">个人</option>
                          <option value="团队">团队</option>
                          <option value="部门">部门</option>
                          <option value="公司">公司</option>
                          <option value="行业">行业</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="points" className="text-right">
                        建议积分
                      </Label>
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <Input
                            id="points"
                            type="number"
                            placeholder="输入建议积分值"
                            className="w-24"
                            min="1"
                            max="100"
                            defaultValue="10"
                          />
                          <span className="text-xs text-muted-foreground">(最终积分由AI系统根据贡献评估确定)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <script
                    type="text/javascript"
                    dangerouslySetInnerHTML={{
                      __html: `
  document.addEventListener('DOMContentLoaded', function() {
    // 团队成员选择器功能
    const addTeamMemberBtn = document.getElementById('addTeamMemberBtn');
    const teamMemberDropdown = document.getElementById('teamMemberDropdown');
    const teamMemberSearch = document.getElementById('teamMemberSearch');
    const teamMemberList = document.getElementById('teamMemberList');
    const selectedMemberCount = document.getElementById('selectedMemberCount');
    
    if (addTeamMemberBtn && teamMemberDropdown) {
      // 点击添加成员按钮显示下拉菜单
      addTeamMemberBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        teamMemberDropdown.classList.toggle('hidden');
        if (!teamMemberDropdown.classList.contains('hidden')) {
          teamMemberSearch.focus();
        }
      });
      
      // 点击其他地方关闭下拉菜单
      document.addEventListener('click', function(e) {
        if (!teamMemberDropdown.contains(e.target) && e.target !== addTeamMemberBtn) {
          teamMemberDropdown.classList.add('hidden');
        }
      });
      
      // 搜索功能
      if (teamMemberSearch && teamMemberList) {
        teamMemberSearch.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase();
          const members = teamMemberList.querySelectorAll('div');
          
          members.forEach(member => {
            const memberName = member.textContent.trim().toLowerCase();
            if (memberName.includes(searchTerm)) {
              member.style.display = 'flex';
            } else {
              member.style.display = 'none';
            }
          });
        });
      }
      
      // 点击成员添加到已选列表
      if (teamMemberList) {
        const members = teamMemberList.querySelectorAll('div');
        members.forEach(member => {
          member.addEventListener('click', function() {
            const memberName = this.textContent.trim();
            const teamContributorsDiv = document.querySelector('#multiContributorSection .flex-wrap');
            
            // 检查是否已经添加
            const existingMembers = teamContributorsDiv.querySelectorAll('span');
            let alreadyAdded = false;
            existingMembers.forEach(existing => {
              if (existing.textContent.includes(memberName)) {
                alreadyAdded = true;
              }
            });
            
            if (!alreadyAdded) {
              const badge = document.createElement('div');
              badge.className = 'bg-primary/10 text-primary flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-normal h-5 leading-none';
              badge.innerHTML = memberName + '<button class="ml-0.5 text-primary hover:text-primary/80 h-3 w-3 inline-flex items-center justify-center text-[10px]">×</button>';
              
              // 添加到按钮前面
              teamContributorsDiv.insertBefore(badge, addTeamMemberBtn.parentNode);
              
              // 更新计数
              if (selectedMemberCount) {
                selectedMemberCount.textContent = parseInt(selectedMemberCount.textContent) + 1;
              }
              
              // 添加删除功能
              const deleteBtn = badge.querySelector('button');
              if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                  e.stopPropagation();
                  badge.remove();
                  if (selectedMemberCount) {
                    selectedMemberCount.textContent = parseInt(selectedMemberCount.textContent) - 1;
                  }
                });
              }
            }
            
            // 隐藏下拉菜单
            teamMemberDropdown.classList.add('hidden');
          });
        });
      }
    }
    
    // 贡献类型切换
    const singleRadio = document.getElementById('singleContributor');
    const multiRadio = document.getElementById('multiContributor');
    const multiSection = document.getElementById('multiContributorSection');
    const contributorSelect = document.getElementById('contributor');
    
    function toggleContributorSection() {
      if (multiRadio && multiRadio.checked) {
        if (multiSection) multiSection.style.display = 'grid';
        if (contributorSelect) contributorSelect.parentElement.parentElement.style.display = 'none';
      } else {
        if (multiSection) multiSection.style.display = 'none';
        if (contributorSelect) contributorSelect.parentElement.parentElement.style.display = 'grid';
      }
    }
    
    if (singleRadio) singleRadio.addEventListener('change', toggleContributorSection);
    if (multiRadio) multiRadio.addEventListener('change', toggleContributorSection);
  });
`,
                    }}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                      提交记录
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="flex flex-wrap gap-2">
                {scoringCategories.map((category) => (
                  <Badge key={category.name} variant="outline" className={`${category.color} text-xs`}>
                    <category.icon className="h-3 w-3 mr-1" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* 添加可点击的协作分析标题 */}
          <div
            className="flex justify-between items-center mt-4 cursor-pointer hover:bg-muted/20 p-2 rounded-md transition-colors"
            onClick={() => setShowCollaborationAnalysis(!showCollaborationAnalysis)}
          >
            <div className="flex items-center">
              <Network className="h-4 w-4 text-primary mr-2" />
              <h3 className="text-sm font-medium">团队协作分析</h3>
            </div>
            <div className="flex items-center">
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
                className={`transition-transform duration-200 ${showCollaborationAnalysis ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </CardHeader>

        {/* 修改 CardContent 部分，根据状态变量条件渲染内容 */}
        <CardContent>
          {showCollaborationAnalysis && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <select
                      className="text-xs bg-muted/30 border border-input rounded-md px-2 py-1"
                      defaultValue="month"
                    >
                      <option value="week">本周</option>
                      <option value="month">本月</option>
                      <option value="quarter">本季度</option>
                      <option value="year">本年度</option>
                    </select>
                    <Badge variant="outline" className="bg-primary/5 text-primary text-xs">
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
                        className="mr-1"
                      >
                        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c-2.5 0-4.9-1-6.7-2.8M3 12a9 9 0 0 1 9-9m-9 9c0-2.5 1-4.9 2.8-6.7" />
                      </svg>
                      实时数据
                    </Badge>
                  </div>
                </div>

                {/* 协作网络可视化 */}
                <div className="bg-muted/10 border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium">团队协作网络</h4>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      查看详情
                    </Button>
                  </div>
                  <div className="relative h-[180px] w-full bg-card/50 rounded-md flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-[300px] h-[150px]">
                        {/* 中心节点 */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10">
                          <span className="text-xs font-medium">您</span>
                        </div>

                        {/* 连接线和节点 */}
                        <div className="absolute top-[30%] left-[20%] w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 flex items-center justify-center">
                          <span className="text-xs">张明</span>
                        </div>
                        <div className="absolute top-[70%] left-[30%] w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center justify-center">
                          <span className="text-xs">李华</span>
                        </div>
                        <div className="absolute top-[20%] left-[70%] w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 flex items-center justify-center">
                          <span className="text-xs">王芳</span>
                        </div>
                        <div className="absolute top-[60%] left-[80%] w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-center justify-center">
                          <span className="text-xs">赵伟</span>
                        </div>

                        {/* SVG连接线 */}
                        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <line x1="150" y1="75" x2="70" y2="45" stroke="rgba(79, 70, 229, 0.3)" strokeWidth="2" />
                          <line x1="150" y1="75" x2="90" y2="105" stroke="rgba(79, 70, 229, 0.5)" strokeWidth="3" />
                          <line x1="150" y1="75" x2="220" y2="30" stroke="rgba(79, 70, 229, 0.4)" strokeWidth="2" />
                          <line x1="150" y1="75" x2="240" y2="90" stroke="rgba(79, 70, 229, 0.2)" strokeWidth="1" />
                        </svg>
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 flex space-x-2">
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-primary mr-1"></div>
                        <span>强协作</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <div className="w-2 h-2 rounded-full bg-primary/30 mr-1"></div>
                        <span>弱协作</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-2">
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
                        className="text-blue-500"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <h4 className="text-sm font-medium">协作频率图谱</h4>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span>与张明</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: "85%" }}></div>
                        </div>
                        <span className="text-blue-500 font-medium">85%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>与李华</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: "62%" }}></div>
                        </div>
                        <span className="text-blue-500 font-medium">62%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>与王芳</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: "45%" }}></div>
                        </div>
                        <span className="text-blue-500 font-medium">45%</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs h-8">
                      查看详情
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-2">
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
                        className="text-purple-500"
                      >
                        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c-2.5 0-4.9-1-6.7-2.8M3 12a9 9 0 0 1 9-9m-9 9c0-2.5 1-4.9 2.8-6.7" />
                      </svg>
                      <h4 className="text-sm font-medium">跨部门合作热图</h4>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span>研发部</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: "78%" }}></div>
                        </div>
                        <span className="text-purple-500 font-medium">78%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>数据部</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: "92%" }}></div>
                        </div>
                        <span className="text-purple-500 font-medium">92%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>伦理部</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: "35%" }}></div>
                        </div>
                        <span className="text-purple-500 font-medium">35%</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs h-8">
                      查看详情
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 mb-2">
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
                        className="text-green-500"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <path d="M12 17h.01" />
                      </svg>
                      <h4 className="text-sm font-medium">专业知识网络</h4>
                    </div>
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-100 text-xs">
                          AI算法
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100 text-xs">
                          数据分析
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-100 text-xs">
                          伦理框架
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100 text-xs">
                          治理模型
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        您在AI算法和数据分析领域的贡献最为突出，建议加强伦理框架方面的协作。
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs h-8">
                      查看详情
                    </Button>
                  </div>
                </div>

                {/* 协作建议 */}
                <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
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
                      className="text-primary mt-0.5"
                    >
                      <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"></path>
                      <path d="M12 13v8"></path>
                      <path d="M5 13v6a2 2 0 0 0 2 2h8"></path>
                    </svg>
                    <div>
                      <p className="text-sm font-medium mb-1">AI协作建议</p>
                      <p className="text-xs text-muted-foreground">
                        基于您的协作模式分析，AI建议您与伦理部的王芳加强合作，共同解决当前项目中的伦理挑战。您的技术专长与王芳的伦理框架知识结合，将有助于提高项目的整体质量。
                      </p>
                      <div className="flex mt-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
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
                            className="mr-1"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" x2="12" y1="15" y2="3"></line>
                          </svg>
                          保存建议
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs ml-2">
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
                            className="mr-1"
                          >
                            <path d="M9 18l6-6-6-6"></path>
                          </svg>
                          查看更多建议
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-7 h-10">
                <TabsTrigger value="all" className="text-xs">
                  全部
                </TabsTrigger>
                {scoringCategories.map((category) => (
                  <TabsTrigger key={category.name} value={category.name} className="text-xs">
                    {React.createElement(category.icon, { className: "h-3.5 w-3.5 mr-1" })}
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              {filteredScores.map((score) => {
                const isLikedByCurrentUser = score.likes.includes("当前用户")
                const avatar = avatars[score.user]
                const hasObjections = score.objections && score.objections.length > 0
                const isCurrentUserScore = score.user === "当前用户"

                return (
                  <ScoreCard
                    key={score.id}
                    score={score}
                    avatar={avatar}
                    isLikedByCurrentUser={isLikedByCurrentUser}
                    isCurrentUserScore={isCurrentUserScore}
                    maxBonusReached={false}
                    hasObjections={hasObjections}
                    onLike={handleLike}
                    onComment={openCommentDialog}
                    onObjection={openObjectionDialog}
                    getCategoryIcon={getCategoryIcon}
                  />
                )
              })}

              {filteredScores.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">暂无相关积分记录</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 同时提供命名导出和默认导出
export { ScoringSystem as default }

