"use client";

import { useRef, useState } from "react";
import { sfx } from "@/lib/sound";
import styles from "./ContactForm.module.css";

type Status = "idle" | "submitting" | "success";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const PROJECT_TYPES = [
  "Mural (exterior)",
  "Mural (interior)",
  "Brand identity",
  "Environmental / wayfinding",
  "Festival / curation",
  "Something else",
];
const BUDGETS = ["Under $10k", "$10k – $25k", "$25k – $75k", "$75k+", "Not sure yet"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function validate(data: FormData): Errors {
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name) next.name = "Please tell us your name.";
    if (!email) next.email = "An email so we can reply.";
    else if (!EMAIL_RE.test(email)) next.email = "That email doesn't look right.";
    if (message.length < 10) next.message = "A sentence or two about the wall, please.";
    return next;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = validate(data);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    sfx.select();
    setStatus("submitting");
    // No backend in this build — simulate a send, then confirm.
    window.setTimeout(() => setStatus("success"), 900);
  }

  if (status === "success") {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <span className={styles.successMark} aria-hidden="true">
          ✓
        </span>
        <h2 className={styles.successTitle}>Message received.</h2>
        <p className={styles.successBody}>
          Thanks. We&rsquo;ll reply within two working days. For anything urgent, message us
          on WhatsApp and mention you just filled the form.
        </p>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            setStatus("idle");
            setErrors({});
            formRef.current?.reset();
          }}
          data-cursor="link"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className={styles.input}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "err-name" : undefined}
        />
        {errors.name && (
          <span id="err-name" className={styles.error}>
            {errors.name}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={styles.input}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? "err-email" : undefined}
        />
        {errors.email && (
          <span id="err-email" className={styles.error}>
            {errors.email}
          </span>
        )}
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="type" className={styles.label}>
            Project type
          </label>
          <select id="type" name="type" className={styles.input} defaultValue={PROJECT_TYPES[0]}>
            {PROJECT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="budget" className={styles.label}>
            Budget
          </label>
          <select id="budget" name="budget" className={styles.input} defaultValue={BUDGETS[4]}>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>
          About the wall <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className={`${styles.input} ${styles.textarea}`}
          placeholder="Where is it, how big, and what should it say?"
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? "err-message" : undefined}
        />
        {errors.message && (
          <span id="err-message" className={styles.error}>
            {errors.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={status === "submitting"}
        data-cursor="link"
        onMouseEnter={() => sfx.hover()}
      >
        <span>{status === "submitting" ? "Sending…" : "Send inquiry"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </button>
      <p className={styles.note}>
        We reply within two working days. No spam, ever.
      </p>
    </form>
  );
}
