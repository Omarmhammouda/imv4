"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { mq } from "@/lib/motion";
import CanRig from "./CanRig";
import SprayCan from "./SprayCan";
import AmbientParticles from "./AmbientParticles";
import Effects from "./Effects";
import styles from "./HeroScene.module.css";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function HeroScene() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<"high" | "low">("high");

  useEffect(() => {
    setSupported(hasWebGL());
    setProfile(mq.isMobile() || mq.isTablet() ? "low" : "high");
  }, []);

  if (supported === false) return null;
  if (supported === null) return null;

  const particleCount = profile === "low" ? 420 : 1100;
  const dprMax = profile === "low" ? 1.5 : 2;

  return (
    <div className={styles.canvas} aria-hidden="true">
      <Canvas
        dpr={[1, dprMax]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        camera={{ position: [0, 0, 6.4], fov: 32 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.setClearAlpha(0);
        }}
      >
        {/* in-memory studio environment for true metal reflections */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={2.2} position={[0, 2.5, 3]} scale={[7, 7, 1]} color="#ffffff" />
          <Lightformer intensity={1.3} position={[-5, 1, -2]} scale={[4, 9, 1]} color="#aebfff" />
          <Lightformer intensity={1.4} position={[5, -1, 1]} scale={[3, 7, 1]} color="#ffd2bd" />
          <Lightformer intensity={0.5} position={[0, -4, -3]} scale={[10, 10, 1]} color="#404048" />
        </Environment>

        <ambientLight intensity={0.18} />
        <directionalLight position={[3, 5, 4]} intensity={2.4} color="#ffffff" />
        <directionalLight position={[-4, 2, -4]} intensity={1.5} color="#9fb4ff" />
        <pointLight position={[1.5, 2.6, 1.5]} intensity={6} distance={8} color="#ff2233" />

        <CanRig>
          <SprayCan />
        </CanRig>

        <AmbientParticles count={particleCount} />

        <Effects quality={profile} />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
