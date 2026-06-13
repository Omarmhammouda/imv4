"use client";

import { useRef, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@/lib/useGSAP";

/**
 * Generic on-scroll reveal. Animates the element (or its direct children when
 * `stagger` is set) up + in. Fully skipped under reduced motion.
 */
export default function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  y = 28,
  stagger,
  start = "top 84%",
}: {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.FC<{
    className?: string;
    children?: React.ReactNode;
    ref?: React.Ref<HTMLElement>;
  }>;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets =
          stagger != null ? ref.current!.children : ref.current!;
        gsap.from(targets, {
          y,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          delay,
          stagger: stagger ?? 0,
          scrollTrigger: { trigger: ref.current, start },
        });
        return () => ScrollTrigger.getAll().forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
