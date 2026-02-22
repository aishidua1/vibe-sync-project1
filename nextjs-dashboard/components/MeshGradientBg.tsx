"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

export default function MeshGradientBg() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted) return null;

  return (
    <div className="shader-bg">
      <MeshGradient
        width={dimensions.width}
        height={dimensions.height}
        colors={[
          "#e040fb",
          "#b388ff",
          "#40c4ff",
          "#00e676",
          "#7c3aed",
          "#060610",
        ]}
        distortion={0.8}
        swirl={0.6}
        grainMixer={0}
        grainOverlay={0}
        speed={0.25}
        offsetX={0.08}
      />
      <div className="shader-veil" />
    </div>
  );
}
