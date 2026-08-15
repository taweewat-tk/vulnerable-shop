// src/views/render.ts
export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h1>${title}</h1>
${body}
</body>
</html>`;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
