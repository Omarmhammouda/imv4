"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { sfx } from "@/lib/sound";
import styles from "./Cta.module.css";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}

type AsLink = BaseProps & {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};
type AsButton = BaseProps & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

type Props = AsLink | AsButton;

const Arrow = () => (
  <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M4 12h15M13 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

export const Cta = forwardRef<HTMLAnchorElement | HTMLButtonElement, Props>(
  function Cta(
    { variant = "outline", size = "md", arrow = true, className = "", children, ...rest },
    ref,
  ) {
    const cls = [styles.cta, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        <span className={styles.label}>{children}</span>
        {arrow && <Arrow />}
      </>
    );

    if ("href" in rest && rest.href !== undefined) {
      const { href, onClick } = rest as AsLink;
      const external = href.startsWith("http") || href.startsWith("mailto");
      const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        sfx.select();
        onClick?.(e);
      };
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={cls}
            data-cursor="link"
            onMouseEnter={() => sfx.hover()}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cls}
          data-cursor="link"
          onMouseEnter={() => sfx.hover()}
          onClick={handleClick}
        >
          {content}
        </Link>
      );
    }

    const { type = "button", disabled, onClick } = rest as AsButton;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled}
        className={cls}
        data-cursor="link"
        onMouseEnter={() => sfx.hover()}
        onClick={(e) => {
          sfx.select();
          onClick?.(e);
        }}
      >
        {content}
      </button>
    );
  },
);
