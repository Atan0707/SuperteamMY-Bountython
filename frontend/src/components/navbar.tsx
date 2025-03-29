'use client'

import { Home, User, Briefcase, PenSquare } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function Navbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Showcase', url: '/showcase', icon: User },
    { name: 'Create', url: '/create', icon: Briefcase },
    { name: 'Portfolio', url: '/portfolio', icon: PenSquare },
  ]

  return <NavBar items={navItems} />
}