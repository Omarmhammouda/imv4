"use client";

import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { useMemo } from "react";

/**
 * Cinematic grade applied to the 3D layer ONLY (canvas). All DOM text sits
 * above this canvas, so grain/bloom/aberration never degrade legibility.
 */
export default function Effects({
  quality = "high",
}: {
  quality?: "high" | "low";
}) {
  const caOffset = useMemo(() => new Vector2(0.0006, 0.0009), []);

  if (quality === "low") {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.28} darkness={0.85} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField focusDistance={0.012} focalLength={0.04} bokehScale={2.6} />
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        offset={caOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.06} />
      <Vignette eskil={false} offset={0.26} darkness={0.92} />
    </EffectComposer>
  );
}
