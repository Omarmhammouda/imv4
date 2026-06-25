import { marked } from "marked";

// Blog post bodies are authored as Markdown in Supabase and rendered to HTML at
// build time. Content is the studio's own (trusted), so no sanitisation step.
marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(md: string): string {
  return marked.parse(md ?? "", { async: false }) as string;
}
