"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ambientVertex, ambientFragment } from "@/lib/shaders/particles";
import { useExperience } from "@/lib/store";

export default function AmbientParticles({ count = 1100 }: { count?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1;
      scales[i] = Math.random() * 0.8 + 0.2;
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const u = {
      uTime: { value: 0 },
      uSize: { value: 26 },
      uPixelRatio: { value: 1 },
      uDrift: { value: 1 },
      uColor: { value: new THREE.Color("#cfcfcf") },
      uAccent: { value: new THREE.Color("#ff2233") },
      uOpacity: { value: 0.55 },
    };
    return { geometry: g, uniforms: u };
  }, [count]);

  useFrame((state, delta) => {
    const reduced = useExperience.getState().reducedMotion;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta * (reduced ? 0.15 : 1);
      matRef.current.uniforms.uPixelRatio.value = Math.min(
        state.gl.getPixelRatio(),
        2,
      );
    }
  });

  // keep field roughly framed to viewport
  const scale = Math.max(1, viewport.width / 8);

  return (
    <points geometry={geometry} scale={scale} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={ambientVertex}
        fragmentShader={ambientFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
