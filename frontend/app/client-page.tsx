"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { authApi } from "@/lib/api"
import { useAuthDialog } from "@/lib/auth-dialog-context"
import { Loader2 } from "lucide-react"

export default function ClientPage() {
  const { user, isAuthenticated, isLoading, error, login, register, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    passwordMatch: "",
  })
  const [registrationStatus, setRegistrationStatus] = useState<string>("");

  useEffect(() => {
    if (registrationStatus) {
      const timer = setTimeout(() => setRegistrationStatus(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [registrationStatus]);

  const { authDialogOpen, authMode, setAuthDialogOpen, setAuthMode, openResetPasswordDialog } = useAuthDialog();

  useEffect(() => {
    setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
    setErrors({ email: "", password: "", confirmPassword: "", passwordMatch: "" });
  }, [authMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const newFormData = { ...formData, [id]: value };
    setFormData(newFormData);

    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }

    if (id === "password" || id === "confirmPassword") {
      if (newFormData.password && newFormData.confirmPassword && newFormData.password !== newFormData.confirmPassword) {
        setErrors((prev) => ({ ...prev, passwordMatch: "两次输入的密码不一致" }));
      } else {
        setErrors((prev) => ({ ...prev, passwordMatch: "" }));
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    if (!formData.email.trim()) {
      newErrors.email = "邮箱不能为空";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址";
      isValid = false;
    } else {
      newErrors.email = "";
    }
    if (!formData.password && (authMode === "login" || authMode === "register" || authMode === "reset-password")) {
      newErrors.password = "密码不能为空";
      isValid = false;
    } else {
      newErrors.password = "";
    }
    if (authMode === "register" || authMode === "reset-password") {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "请确认密码";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.passwordMatch = "两次输入的密码不一致";
        isValid = false;
      } else {
        newErrors.confirmPassword = "";
        newErrors.passwordMatch = "";
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (authMode === "login") {
        const success = await login(formData.email, formData.password);
        if (success) {
          toast({ title: "登录成功", description: "欢迎回来！", variant: "default" });
          setAuthDialogOpen(false);
        } else {
          toast({ title: "登录失败", description: error || "请检查您的邮箱和密码", variant: "destructive" });
        }
      } else if (authMode === "register") {
        const success = await register(formData.email, formData.password, user?.name);
        if (success) {
          toast({ title: "注册成功", description: "账号已创建，欢迎加入！", variant: "default" });
          setRegistrationStatus("注册成功，3秒后自动关闭。");
          setTimeout(() => setAuthDialogOpen(false), 3000);
        } else {
          toast({ title: "注册失败", description: error || "请稍后再试", variant: "destructive" });
          setRegistrationStatus(`注册失败: ${error || "未知错误"}`);
        }
      } else if (authMode === "reset-password") {
        const response = await authApi.resetPassword(formData.email, formData.password);
        if (response.success) {
          toast({ title: "密码重置成功", description: "您的密码已成功重置。", variant: "default" });
          setAuthDialogOpen(false);
        } else {
          toast({ title: "密码重置失败", description: response.message || "请稍后再试。", variant: "destructive" });
        }
      }
    } catch (err: any) {
      console.error("Auth action error:", err);
      toast({ title: "操作失败", description: err.message || "请稍后再试。", variant: "destructive" });
    }
  };

  return (
    <>
      {/* Login/Register/Reset Password Dialogs */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{authMode === "login" ? "登录系统" : authMode === "register" ? "注册账号" : "重置密码"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="info@v-trace.cn" value={formData.email} onChange={handleInputChange} required />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            {(authMode === "login" || authMode === "register" || authMode === "reset-password") && (
              <div className="grid gap-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
              </div>
            )}
            {(authMode === "register" || authMode === "reset-password") && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                {errors.passwordMatch && <p className="text-red-500 text-sm">{errors.passwordMatch}</p>}
              </div>
            )}
            {authMode === "login" && (
              <Button variant="link" className="text-sm text-primary p-0 h-auto self-start justify-self-end" onClick={openResetPasswordDialog}>
                忘记密码？
              </Button>
            )}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div>
              {authMode === "login" && (
                <Button
                  variant="link"
                  className="text-sm text-primary p-0 h-auto"
                  onClick={() => setAuthMode("register")}
                >
                  还没有账号，立即去注册
                </Button>
              )}
              {authMode === "register" && (
                <Button
                  variant="link"
                  className="text-sm text-primary p-0 h-auto"
                  onClick={() => setAuthMode("login")}
                >
                  已经有账号，现在就去登录
                </Button>
              )}
              {authMode === "reset-password" && (
                <Button
                  variant="link"
                  className="text-sm text-primary p-0 h-auto"
                  onClick={() => setAuthMode("login")}
                >
                  记起密码，去登录
                </Button>
              )}
            </div>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {authMode === "login" ? "登录" : authMode === "register" ? "注册" : "重置密码"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
