"use client";

import Dashboard from "@/components/Dashboard";
import MeshGradientBg from "@/components/MeshGradientBg";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLowPower, setIsLowPower] = useState(true);

  useEffect(() => {
    // Use the same breakpoint as the compact CSS so React + CSS stay in sync.
    // Also flag weak-GPU ARM/Linux boxes and anything that looks like a Raspberry Pi.
    const mq = window.matchMedia("(max-width: 900px)");
    const ua = navigator.userAgent;
    const weakGpu =
      /arm(v\d|64)?|aarch64|raspberry/i.test(ua) ||
      /Linux/i.test(ua) && !/Android/i.test(ua) && window.innerWidth <= 1280;

    const update = () => setIsLowPower(mq.matches || weakGpu);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      {!isLowPower && <MeshGradientBg />}
      <Dashboard disableGlow={isLowPower} />
    </>
  );
}
