"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, Users, Target, Bell, Shield, Trash2, Plus, Edit, Save } from "lucide-react"

interface DepartmentSettingsProps {
  department: {
    id: string
    name: string
    manager: string
    members: number
    performance: number
    projects: number
    status: string
  }
}

export function DepartmentSettings({ department }: DepartmentSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: department.name,
    description: "",
    manager: department.manager,
    budget: "500000",
    targetPerformance: department.performance?.toString() || "85",
  })

  const [notifications, setNotifications] = useState({
    performanceAlerts: true,
    projectUpdates: true,
    memberChanges: false,
    budgetAlerts: true,
  })

  const availableManagers = [
    { id: "1", name: "张三", role: "高级工程师" },
    { id: "2", name: "李四", role: "技术主管" },
    { id: "3", name: "王五", role: "项目经理" },
    { id: "4", name: "赵六", role: "产品经理" },
  ]

  const departmentGoals = [
    { id: 1, title: "提升代码质量", target: "95%", current: "92%", deadline: "2024-03-31" },
    { id: 2, title: "减少Bug数量", target: "< 10", current: "15", deadline: "2024-02-28" },
    { id: 3, title: "完成项目交付", target: "12个", current: "8个", deadline: "2024-06-30" },
  ]

  const handleSave = () => {
    // 保存设置逻辑

    setIsEditing(false)
  }

  return (
    <div className="w-full max-w-4xl">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="goals">目标设置</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
          <TabsTrigger value="permissions">权限管理</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>部门基本信息</span>
                </CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deptName">部门名称</Label>
                  <Input
                    id="deptName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">部门经理</Label>
                  <Select
                    value={formData.manager}
                    onValueChange={(value) => setFormData({ ...formData, manager: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.name}>
                          {manager.name} - {manager.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">部门描述</Label>
                <Textarea
                  id="description"
                  placeholder="请输入部门职责和描述..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">部门预算 (年度)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    disabled={!isEditing}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetPerf">目标绩效</Label>
                  <Input
                    id="targetPerf"
                    type="number"
                    value={formData.targetPerformance}
                    onChange={(e) => setFormData({ ...formData, targetPerformance: e.target.value })}
                    disabled={!isEditing}
                    placeholder="95"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>部门统计</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{department.members}</div>
                  <div className="text-sm text-gray-500">员工总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{department.performance}</div>
                  <div className="text-sm text-gray-500">当前绩效</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{department.projects}</div>
                  <div className="text-sm text-gray-500">进行项目</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-gray-500">目标完成率</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>部门目标管理</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  添加目标
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{goal.title}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>目标: {goal.target}</span>
                        <span>当前: {goal.current}</span>
                        <span>截止: {goal.deadline}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">进行中</Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>通知设置</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">绩效预警</div>
                  <div className="text-sm text-gray-500">当部门绩效低于目标时发送通知</div>
                </div>
                <Switch
                  checked={notifications.performanceAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, performanceAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">项目更新</div>
                  <div className="text-sm text-gray-500">项目状态变更时发送通知</div>
                </div>
                <Switch
                  checked={notifications.projectUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, projectUpdates: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">人员变动</div>
                  <div className="text-sm text-gray-500">员工入职或离职时发送通知</div>
                </div>
                <Switch
                  checked={notifications.memberChanges}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, memberChanges: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">预算预警</div>
                  <div className="text-sm text-gray-500">预算使用超过80%时发送通知</div>
                </div>
                <Switch
                  checked={notifications.budgetAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, budgetAlerts: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>权限管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">部门经理权限</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">查看所有成员信息</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">编辑成员绩效</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">分配项目任务</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">审批请假申请</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">成员权限</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">查看部门信息</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">提交工作报告</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">参与部门讨论</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">查看同事联系方式</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <span>危险操作</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-600 mb-2">删除部门</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    删除部门将移除所有相关数据，此操作不可撤销。请确保所有员工已转移到其他部门。
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除部门
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 