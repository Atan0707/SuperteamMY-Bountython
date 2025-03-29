"use client";

import React from "react";
import { Hero } from "../ui/animated-hero";
export function Header() {
  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: "url('/bg-image.jpg')" }}>
      <div className="absolute inset-0 bg-black/40 z-0"></div>
 
      <div className="relative z-10">
        <Hero />
        
      </div>
    </div>
  );
}
