"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import { burstVertex, burstFragment } from "@/lib/shaders/burst";
import { useExperience } from "@/lib/store";

/**
 * GPU paint-mist burst. Lives at the nozzle (passed via `position`) and fires
 * whenever the store's `sprayTick` increments (chapter transitions / start).
 */
export default function SprayBurst({
  position = [0, 0, 0],
  count = 600,
}: {
  position?: [number, number, number];
  count?: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const lastTick = useRef(0);
  const { gl } = useThree();

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3); // all start at local origin
    const dirs = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // cone around +Y (nozzle points up)
      const theta = Math.random() * Math.PI * 2;
      const spread = Math.pow(Math.random(), 0.6) * 0.6; // tighter at center
      const dx = Math.sin(spread) * Math.cos(theta);
      const dz = Math.sin(spread) * Math.sin(theta);
      const dy = Math.cos(spread);
      dirs[i * 3 + 0] = dx;
      dirs[i * 3 + 1] = dy;
      dirs[i * 3 + 2] = dz;
      scales[i] = Math.random() * 0.7 + 0.3;
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);

    const u = {
      uProgress: { value: 1 }, // start spent (invisible)
      uSize: { value: 34 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color("#ff2233") },
      uColor2: { value: new THREE.Color("#fff1f1") },
    };
    return { geometry: g, uniforms: u };
  }, [count]);

  // fire when sprayTick changes
  useEffect(() => {
    const unsub = useExperience.subscribe((state) => {
      if (state.sprayTick !== lastTick.current) {
        lastTick.current = state.sprayTick;
        if (!matRef.current) return;
        if (pointsRef.current) pointsRef.current.visible = true;
        gsap.fromTo(
          matRef.current.uniforms.uProgress,
          { value: 0 },
          {
            value: 1,
            duration: 1.25,
            ease: "none",
            onComplete: () => {
              if (pointsRef.current) pointsRef.current.visible = false;
            },
          },
        );
      }
    });
    return unsub;
  }, []);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} position={position} visible={false} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={burstVertex}
        fragmentShader={burstFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
