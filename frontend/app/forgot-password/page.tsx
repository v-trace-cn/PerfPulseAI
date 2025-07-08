"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" })
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "", passwordMatch: "" })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
    if (errors[id as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [id]: "" }))
    }
    if ((id === "password" || id === "confirmPassword") && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, passwordMatch: "两次输入的密码不一致" }))
      } else {
        setErrors(prev => ({ ...prev, passwordMatch: "" }))
      }
    }
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { ...errors }
    if (!formData.email.trim()) {
      newErrors.email = "邮箱不能为空"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址"
      valid = false
    }
    if (!formData.password) {
      newErrors.password = "密码不能为空"
      valid = false
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "请确认密码"
      valid = false
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "两次输入的密码不一致"
      valid = false
    }
    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      // TODO: 调用密码重置 API
      toast({ title: "重置成功", description: "请使用新密码登录系统", variant: "default" })
      router.push("/")
    } catch (err) {
      console.error(err)
      toast({ title: "重置失败", description: "请稍后再试", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md bg-card p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-4">重置密码</h1>
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="email" className="text-right">邮箱</Label>
            <Input
              id="email"
              type="email"
              className="col-span-3"
              value={formData.email}
              onChange={handleInputChange}
            />
            {errors.email && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="password" className="text-right">新密码</Label>
            <Input
              id="password"
              type="password"
              className="col-span-3"
              value={formData.password}
              onChange={handleInputChange}
            />
            {errors.password && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.password}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label htmlFor="confirmPassword" className="text-right">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="col-span-3"
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.confirmPassword}</p>}
          </div>
          {errors.passwordMatch && <p className="text-red-500 text-xs text-center">{errors.passwordMatch}</p>}
        </div>
        <Button
          className="w-full mt-4"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "重置中..." : "重置密码"}
        </Button>
      </div>
    </main>
  )
} 