"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sound";
import { getSupabase } from "@/lib/supabase";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import styles from "./ContactForm.module.css";

type Status = "idle" | "submitting" | "success" | "error";
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
const SURFACES = [
  "Not sure",
  "Brick",
  "Concrete / cinderblock",
  "Stucco / plaster",
  "Wood",
  "Metal",
  "Glass",
  "Other",
];
const PLACEMENTS = ["Exterior", "Interior", "Not sure"];
const PERMISSIONS = [
  "I own the wall",
  "I have the owner's permission",
  "Permission still to arrange",
  "Not sure",
];
const TIMELINES = [
  "Flexible / no rush",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Has a fixed deadline",
];
const HEARD = ["Instagram", "Word of mouth", "Saw a mural", "Search", "Other"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE = 20 * 1024 * 1024; // 20MB
const STUDIO_EMAIL = "info@insomniamurals.com";

// Browsers sometimes report an empty file.type (HEIC, some pickers); supabase-js
// then defaults to text/plain, which the bucket rejects. Infer a real image type.
const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", heic: "image/heic", heif: "image/heif", avif: "image/avif",
  bmp: "image/bmp", tif: "image/tiff", tiff: "image/tiff",
};
function imageContentType(file: File): string {
  if (file.type && file.type.startsWith("image/")) return file.type;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return TYPE_BY_EXT[ext] || "image/jpeg";
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { scrollTo, lenis } = useLenis();

  // On a successful submit, scroll back to the top so the confirmation is seen.
  useEffect(() => {
    if (status !== "success") return;
    if (lenis) scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, [status, scrollTo, lenis]);

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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE) {
      setFileError("That image is over 20MB — please pick a smaller one.");
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    setFileError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    const get = (k: string) => String(data.get(k) ?? "").trim();
    const sb = getSupabase();

    if (sb) {
      // Optional wall photo → Supabase Storage (failure never blocks the inquiry)
      let wallPhotoUrl = "";
      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("wall-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false, contentType: imageContentType(file) });
        if (!upErr) {
          wallPhotoUrl = sb.storage.from("wall-photos").getPublicUrl(path).data.publicUrl;
        } else {
          console.error("wall photo upload failed", upErr);
        }
      }

      const { error } = await sb.from("inquiries").insert({
        name: get("name"),
        email: get("email"),
        phone: get("phone") || null,
        project_type: get("type"),
        budget: get("budget"),
        location: get("location") || null,
        wall_size: get("size") || null,
        surface: get("surface") || null,
        placement: get("placement") || null,
        permission: get("permission") || null,
        timeline: get("timeline") || null,
        heard_about: get("heard") || null,
        message: get("message"),
        wall_photo_url: wallPhotoUrl || null,
      });
      if (error) {
        console.error("inquiry insert failed", error);
        setStatus("error");
        return;
      }
    } else {
      // No Supabase configured yet — simulate a send so the flow still works.
      await new Promise((r) => window.setTimeout(r, 700));
    }

    // Add/update the contact in Brevo + add to the list (triggers the email
    // automation). Handled server-side at /api/contact so the API key stays
    // secret. Best-effort: a Brevo hiccup never blocks a received inquiry.
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: get("email"), name: get("name") }),
      });
      if (!res.ok) {
        console.error("Brevo contact sync failed", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Brevo contact sync error", err);
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <span className={styles.successMark} aria-hidden="true">
          ✓
        </span>
        <h2 className={styles.successTitle}>Inquiry received.</h2>
        <p className={styles.successBody}>
          Thanks — that&rsquo;s exactly what we need to get started. We&rsquo;ll reply within
          two working days. For anything urgent, email us at {STUDIO_EMAIL}.
        </p>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            setStatus("idle");
            setErrors({});
            clearFile();
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
      {/* ---------------- You ---------------- */}
      <fieldset className={styles.section}>
        <legend className={styles.legend}>You</legend>

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

        <div className={styles.row2}>
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
          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              Phone <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className={styles.input}
            />
          </div>
        </div>
      </fieldset>

      {/* ---------------- The wall ---------------- */}
      <fieldset className={styles.section}>
        <legend className={styles.legend}>The wall</legend>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="location" className={styles.label}>
              Location <span className={styles.optional}>(city / area)</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className={styles.input}
              placeholder="e.g. Brooklyn, NY"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="size" className={styles.label}>
              Approx. size <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="size"
              name="size"
              type="text"
              className={styles.input}
              placeholder="e.g. 20ft × 12ft"
            />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="surface" className={styles.label}>
              Surface
            </label>
            <select id="surface" name="surface" className={styles.input} defaultValue={SURFACES[0]}>
              {SURFACES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="placement" className={styles.label}>
              Placement
            </label>
            <select id="placement" name="placement" className={styles.input} defaultValue={PLACEMENTS[0]}>
              {PLACEMENTS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="permission" className={styles.label}>
            Wall permission
          </label>
          <select id="permission" name="permission" className={styles.input} defaultValue={PERMISSIONS[3]}>
            {PERMISSIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            Photo of the wall <span className={styles.optional}>(optional)</span>
          </span>
          <input
            ref={fileRef}
            id="wallphoto"
            name="wallphoto"
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={onFileChange}
          />
          {file ? (
            <div className={styles.fileChosen}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.fileIcon}>
                <path d="M4 7h6l2 2h8v9H4z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span className={styles.fileName}>{file.name}</span>
              <button type="button" className={styles.fileRemove} onClick={clearFile} aria-label="Remove photo" data-cursor="link">
                Remove
              </button>
            </div>
          ) : (
            <label htmlFor="wallphoto" className={styles.upload} data-cursor="link">
              <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.uploadIcon}>
                <path d="M12 16V4M7 9l5-5 5 5M5 20h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
              </svg>
              <span>
                <u>Browse</u> or drop a photo — JPG/PNG, up to 10MB
              </span>
            </label>
          )}
          {fileError && <span className={styles.error}>{fileError}</span>}
        </div>
      </fieldset>

      {/* ---------------- The project ---------------- */}
      <fieldset className={styles.section}>
        <legend className={styles.legend}>The project</legend>

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
          <label htmlFor="timeline" className={styles.label}>
            Timeline
          </label>
          <select id="timeline" name="timeline" className={styles.input} defaultValue={TIMELINES[0]}>
            {TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Your vision <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className={`${styles.input} ${styles.textarea}`}
            placeholder="What should the mural say or show? Any subject, colours, references, or mood you're chasing?"
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={errors.message ? "err-message" : undefined}
          />
          {errors.message && (
            <span id="err-message" className={styles.error}>
              {errors.message}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="heard" className={styles.label}>
            How did you hear about us? <span className={styles.optional}>(optional)</span>
          </label>
          <select id="heard" name="heard" className={styles.input} defaultValue="">
            <option value="">Select one…</option>
            {HEARD.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </div>
      </fieldset>

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
      {status === "error" ? (
        <p className={styles.error} role="alert">
          Couldn&rsquo;t send that just now. Please email us directly at {STUDIO_EMAIL}.
        </p>
      ) : (
        <p className={styles.note}>We reply within two working days. No spam, ever.</p>
      )}
    </form>
  );
}
