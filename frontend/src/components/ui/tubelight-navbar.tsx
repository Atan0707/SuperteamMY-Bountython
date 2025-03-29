"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50",
        isMobile ? "bottom-0 py-4" : "top-0 pt-6",
        className,
      )}
    >
      <div className={cn(
        "flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg",
        isMobile && "w-[95%] justify-around"
      )}>
        {items.map((item) => {
          const Icon = item.icon    
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-white hover:text-primary",
                isActive && "bg-muted text-primary",
                isMobile && "px-3"
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-8 h-1 bg-primary",
                    isMobile ? "bottom-[calc(100%-4px)] rounded-b-full" : "-top-2 rounded-t-full"
                  )}>
                    <div className={cn(
                      "absolute w-12 h-6 bg-primary/20 rounded-full blur-md",
                      isMobile ? "-bottom-2 -left-2" : "-top-2 -left-2"
                    )} />
                    <div className={cn(
                      "absolute w-8 h-6 bg-primary/20 rounded-full blur-md",
                      isMobile ? "-bottom-1" : "-top-1"
                    )} />
                    <div className={cn(
                      "absolute w-4 h-4 bg-primary/20 rounded-full blur-sm left-2",
                      isMobile ? "bottom-0" : "top-0"
                    )} />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
