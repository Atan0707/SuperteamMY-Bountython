'use client'

import { Home, User, Briefcase } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function Navbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Showcase', url: '/showcase', icon: User },
    { name: 'Create', url: '/create', icon: Briefcase },
  ]

  return <NavBar items={navItems} />
}