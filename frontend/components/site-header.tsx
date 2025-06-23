"use client"

import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, LogIn, LogOut, Settings, User, UserPlus, Search, LayoutGrid } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useAuthDialog } from "@/lib/auth-dialog-context"

interface SiteHeaderProps {
  onHelpClick: () => void;
  onSettingsClick: () => void;
}

export default function SiteHeader({ onHelpClick, onSettingsClick }: SiteHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const { openLoginDialog, openRegisterDialog } = useAuthDialog()

  return (
    <header className="border-b backdrop-blur-sm bg-background/70 sticky top-0 z-50 transition-colors duration-300 dark:border-primary/10 border-black/5">
      <div className="container flex h-16 items-center justify-between py-4 dark:bg-background/40 dark:backdrop-blur-md dark:border-primary/5 dark:shadow-[0_4px_20px_rgba(79,70,229,0.1)] rounded-b-lg">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src="/logo.ico" alt="Logo" width={24} height={24} className="animate-pulse-slow" />
          <h1 className="text-xl font-bold tracking-tight">
            <span className="cyber-text">PerfPulseAI</span>
          </h1>
        </Link>
        <div className="relative ml-8">
          <Input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-2 w-48 border-primary/20 focus-visible:ring-primary focus-visible:ring-offset-0"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <LayoutGrid className="h-5 w-5 text-primary cursor-pointer hover:opacity-80 transition-opacity" />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 data-pill hover:bg-muted/50 transition-colors duration-300 relative ml-2">
              {isAuthenticated ? (
                <>
                  <Avatar className="h-6 w-6 border-2 border-primary/20">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.name || "用户"} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.name ? user.name.charAt(0) : "用"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-medium">{user?.name || "未知用户"}</span>
                    <span className="text-[10px] text-muted-foreground">{user?.department || user?.email || "未知部门"}</span>
                  </div>
                  <Badge className="h-5 ml-1 mr-6 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                    <span className="text-[10px]">Lv. {user?.level || '1'}</span>
                  </Badge>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 text-primary" />
                  <span className="text-sm">登录</span>
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem onClick={() => router.push("/?tab=profile")}>
                    <User className="mr-2 h-4 w-4" /> 个人中心
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSettingsClick}> <Settings className="mr-2 h-4 w-4" /> 设置</DropdownMenuItem>
                  <DropdownMenuItem onClick={onHelpClick}> <HelpCircle className="mr-2 h-4 w-4" /> AI 帮助与支持</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500"> <LogOut className="mr-2 h-4 w-4" /> 退出登录</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={openLoginDialog}> <LogIn className="mr-2 h-4 w-4" /> 登录系统</DropdownMenuItem>
                  <DropdownMenuItem onClick={openRegisterDialog}> <UserPlus className="mr-2 h-4 w-4" /> 注册账号</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 