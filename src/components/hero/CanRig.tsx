"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import { chapters } from "@/lib/chapters";

/**
 * Drives the can group every frame from the store: idle spin + bob, scroll
 * scrub (rotation + dolly), pointer parallax, and a glide to the side OPPOSITE
 * the active chapter's text — so the can sweeps across at each transition and
 * never sits under the copy. Reads state via getState() (no React re-renders).
 */
export default function CanRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const damp = THREE.MathUtils.damp;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const { pointer, scrollProgress, started, reducedMotion, activeChapter } =
      useExperience.getState();

    const dt = Math.min(delta, 1 / 30);
    spin.current += dt * (reducedMotion ? 0.04 : 0.16);

    const portrait = state.viewport.aspect < 0.9;
    const align = chapters[activeChapter]?.align ?? "left";
    const dir = align === "left" ? 1 : -1; // text left → can right

    const targetRotY = spin.current + scrollProgress * Math.PI * 2.0 + pointer.x * 0.4;
    const targetRotX =
      (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.04) -
      pointer.y * 0.26 +
      scrollProgress * 0.22;

    g.rotation.y = damp(g.rotation.y, targetRotY, 6, dt);
    g.rotation.x = damp(g.rotation.x, targetRotX, 6, dt);

    const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.07;
    // portrait: float the can centred + high + back so the copy (anchored low)
    // never fights it. landscape: glide to the side opposite the text.
    // portrait: dead-centre, no pointer parallax (touch has no hover cursor)
    const targetX = portrait ? 0 : dir * 1.6 + pointer.x * 0.3;
    const targetY = bob - scrollProgress * 0.5; // vertically centred on all sizes
    const targetZ = -scrollProgress * 1.5 - (portrait ? 3.2 : 0);

    // gentle glide on X so the can sweeps between chapters
    g.position.x = damp(g.position.x, targetX, 2.6, dt);
    g.position.y = damp(g.position.y, targetY, 5, dt);
    g.position.z = damp(g.position.z, targetZ, 4, dt);

    const baseScale = portrait ? 0.46 : 1;
    const targetScale = (started ? baseScale : baseScale * 0.85);
    const sc = damp(g.scale.x, targetScale, 4, dt);
    g.scale.setScalar(sc);
  });

  return (
    <group ref={group} scale={0.85}>
      {children}
    </group>
  );
}
