"use client";

import Dashboard from "@/components/Dashboard";

export default function Home() {
  // Shader background removed everywhere for performance; card border glow
  // also stays off because the glow component does not work on small screens.
  return <Dashboard disableGlow={true} />;
}
