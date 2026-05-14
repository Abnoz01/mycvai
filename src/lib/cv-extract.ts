// Client-side CV text extraction for PDF / DOCX / TXT
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite worker import
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

if (typeof window !== "undefined") {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
}

async function extractPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const Y_TOL = 3;
    const lines = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as any[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5] / Y_TOL) * Y_TOL;
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y)!.push({ x: item.transform[4], str: item.str });
    }
    const text = Array.from(lines.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => items.sort((a, b) => a.x - b.x).map((i) => i.str).join(" "))
      .join("\n");
    pages.push(text);
  }
  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const r = await mammoth.extractRawText({ arrayBuffer: buf });
  return r.value || "";
}

export async function extractCvText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") return await extractPdf(file);
    if (name.endsWith(".docx")) return await extractDocx(file);
    if (name.endsWith(".txt") || file.type.startsWith("text/")) {
      return (await file.text()).replace(/\u0000/g, "");
    }
  } catch (e) {
    console.error("CV extract failed", e);
  }
  return "";
}
