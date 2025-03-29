'use client'

import { Home, User, PenSquare, Images } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function Navbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Showcase', url: '/showcase', icon: Images },
    { name: 'Create', url: '/create', icon: PenSquare },
    { name: 'Portfolio', url: '/portfolio', icon: User },
  ]

  return <NavBar items={navItems} />
}