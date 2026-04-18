"use client";

import Dashboard from "@/components/Dashboard";
import MeshGradientBg from "@/components/MeshGradientBg";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    // Detect small screens (Pi 7" touchscreen is 800x480)
    const small = window.innerWidth <= 800;
    // Also check for weak GPU via user agent
    const isPi = /Linux\s+armv|aarch64/.test(navigator.userAgent);
    setIsLowPower(small || isPi);
  }, []);

  return (
    <>
      {!isLowPower && <MeshGradientBg />}
      <Dashboard disableGlow={isLowPower} />
    </>
  );
}
