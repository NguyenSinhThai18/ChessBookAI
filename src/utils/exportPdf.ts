import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type PageSize = "a4" | "a5";
type PageOrientation = "portrait" | "landscape";

interface ExportPdfOptions {
  bookTitle: string;
  pages: { id: string }[];
  pageRefs: Record<string, HTMLDivElement | null>;
  pageSize: PageSize;
  orientation: PageOrientation;
}

/* ================= CORE ================= */

export async function exportBookToPdf({
  bookTitle,
  pages,
  pageRefs,
  pageSize,
  orientation,
}: ExportPdfOptions) {
  // Try to match the real rendered page size instead of a fixed preset.
  // This keeps element positions identical between the editor preview and the PDF.
  const format = getRenderedPageFormat(pages, pageRefs, pageSize, orientation);

  const pdf = new jsPDF({
    orientation: orientation === "portrait" ? "p" : "l",
    unit: "px",
    format,
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pageRefs[pages[i].id];
    if (!pageEl) continue;

    const canvas = await html2canvas(pageEl, {
      scale: 3, // ⭐ PDF IN SÁCH: 300 DPI ~ scale 3
      backgroundColor: "#ffffff",
      useCORS: true,

      onclone: (clonedDoc) => {
        const clonedPage = clonedDoc.querySelector(
          `[data-page-id="${pages[i].id}"]`
        ) as HTMLElement | null;

        if (!clonedPage) return;

        // Remove editor-only UI artifacts (page number, empty state, selection borders, etc.)
        sanitizePageForExport(clonedPage);

        // ✅ Remove oklch in raw styles (style tags + inline) before html2canvas parses them
        stripOklchInStyleTags(clonedDoc);
        stripOklchInlineStyles(clonedDoc.body || clonedPage);

        // ✅ FIX oklch – sanitize the whole cloned document to avoid parse errors
        // when html2canvas walks through inherited CSS variables/colors.
        forceSafeColors(clonedDoc.body || clonedPage);
        // Preserve actual rendered colors (use computed RGB instead of black fallback).
        preserveComputedColors(clonedDoc.body || clonedPage);

        // ✅ REMOVE grid overlay
        clonedPage
          .querySelectorAll("[style*='linear-gradient']")
          .forEach((el) => {
            (el as HTMLElement).style.backgroundImage = "none";
          });
      },
    });

    const img = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage();

    pdf.addImage(
      img,
      "PNG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight(),
      undefined,
      "FAST"
    );
  }

  pdf.save(`${bookTitle}.pdf`);
}

/**
 * Xuất từng trang thành file PNG để giữ nguyên art như trên màn hình.
 */
export async function exportBookImages({
  bookTitle,
  pages,
  pageRefs,
  pageSize,
  orientation,
}: ExportPdfOptions) {
  // Dùng kích thước trang đang render để giữ đúng layout
  const format = getRenderedPageFormat(pages, pageRefs, pageSize, orientation);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageEl = pageRefs[page.id];
    if (!pageEl) continue;

    const canvas = await html2canvas(pageEl, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      onclone: (clonedDoc) => {
        const clonedPage = clonedDoc.querySelector(
          `[data-page-id="${page.id}"]`
        ) as HTMLElement | null;
        if (!clonedPage) return;

        // Remove editor-only UI artifacts
        sanitizePageForExport(clonedPage);

        // Giữ màu và tránh lỗi oklch
        stripOklchInStyleTags(clonedDoc);
        stripOklchInlineStyles(clonedDoc.body || clonedPage);
        forceSafeColors(clonedDoc.body || clonedPage);
        preserveComputedColors(clonedDoc.body || clonedPage);

        // Nếu muốn bỏ lưới khi xuất ảnh
        clonedPage
          .querySelectorAll("[style*='linear-gradient']")
          .forEach((el) => {
            (el as HTMLElement).style.backgroundImage = "none";
          });
      },
    });

    // Đảm bảo cùng kích thước với format nếu cần (canvas đã theo DOM)
    const img = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = img;
    link.download = `${bookTitle}-trang-${i + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/* ================= HELPERS ================= */

function getRenderedPageFormat(
  pages: { id: string }[],
  pageRefs: Record<string, HTMLDivElement | null>,
  size: PageSize,
  orientation: PageOrientation
): [number, number] {
  // Prefer real DOM size to avoid scaling/cropping mismatch.
  const firstPageEl =
    pages
      .map((p) => pageRefs[p.id])
      .find((el): el is HTMLDivElement => Boolean(el)) ?? null;

  if (firstPageEl) {
    const rect = firstPageEl.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    return [width, height];
  }

  // Fallback to known presets (pixels at 72dpi-ish, kept close to the UI ratios).
  const presets: Record<PageSize, [number, number]> = {
    a4: [595, 842],
    a5: [420, 595],
  };
  const base = presets[size];
  return orientation === "portrait" ? base : [base[1], base[0]];
}

/**
 * html2canvas không hỗ trợ oklch → ép về RGB
 */
function forceSafeColors(root: HTMLElement | Document | null) {
  if (!root) return;

  const elements =
    root instanceof Document
      ? Array.from(root.querySelectorAll<HTMLElement>("*"))
      : Array.from(root.querySelectorAll<HTMLElement>("*"));

  elements.forEach((el) => {
    const style = window.getComputedStyle(el);

    const fixProp = (prop: string, fallback: string) => {
      const val = style.getPropertyValue(prop);
      if (val && val.toLowerCase().includes("oklch")) {
        el.style.setProperty(prop, fallback);
      }
    };

    fixProp("color", "rgb(0,0,0)");
    fixProp("backgroundColor", "rgb(255,255,255)");
    fixProp("borderColor", "rgb(0,0,0)");
    fixProp("outlineColor", "rgb(0,0,0)");
    fixProp("fill", "rgb(0,0,0)");
    fixProp("stroke", "rgb(0,0,0)");
  });
}

/**
 * Re-apply computed RGB values for properties that were originally oklch.
 * This keeps the real colors instead of turning everything black/white.
 */
function preserveComputedColors(root: HTMLElement | Document | null) {
  if (!root) return;

  const elements =
    root instanceof Document
      ? Array.from(root.querySelectorAll<HTMLElement>("*"))
      : Array.from(root.querySelectorAll<HTMLElement>("*"));

  elements.forEach((el) => {
    const style = window.getComputedStyle(el);

    const copyIfOklch = (prop: string) => {
      const declared = el.style.getPropertyValue(prop);
      if (declared && declared.toLowerCase().includes("oklch")) {
        const computed = style.getPropertyValue(prop);
        if (computed) el.style.setProperty(prop, computed);
      }
    };

    copyIfOklch("color");
    copyIfOklch("backgroundColor");
    copyIfOklch("borderColor");
    copyIfOklch("outlineColor");
    copyIfOklch("fill");
    copyIfOklch("stroke");
  });
}

/**
 * Replace oklch() values inside <style> tags to prevent parser errors.
 */
function stripOklchInStyleTags(doc: Document) {
  doc.querySelectorAll("style").forEach((styleEl) => {
    const cssText = styleEl.textContent;
    if (!cssText || !cssText.toLowerCase().includes("oklch")) return;
    styleEl.textContent = cssText.replace(/oklch\([^)]*\)/gi, "rgb(0,0,0)");
  });
}

/**
 * Replace oklch() values in inline styles quickly.
 */
function stripOklchInlineStyles(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const styleAttr = el.getAttribute("style");
    if (!styleAttr || !styleAttr.toLowerCase().includes("oklch")) return;
    el.setAttribute(
      "style",
      styleAttr.replace(/oklch\([^)]*\)/gi, "rgb(0,0,0)")
    );
  });
}

/**
 * Remove UI-only decorations from the page DOM (these exist in the editor but
 * should not appear in exported PDF/PNG).
 */
function sanitizePageForExport(pageRoot: HTMLElement) {
  // 1) Remove page number / delete button overlays (z-10 UI)
  pageRoot.querySelectorAll("button[title='Xóa trang này']").forEach((el) => el.remove());

  // "Trang {n}" label (top-right)
  pageRoot
    .querySelectorAll<HTMLElement>("div.absolute")
    .forEach((el) => {
      const t = (el.textContent || "").trim();
      if (t.startsWith("Trang ")) el.remove();
    });

  // 2) Remove empty-page helper overlay ("{page.content}" + click hint)
  pageRoot
    .querySelectorAll<HTMLElement>("p")
    .forEach((p) => {
      const t = (p.textContent || "").trim().toLowerCase();
      if (t.includes("click để chọn trang này")) {
        p.closest("div")?.remove();
      }
    });

  // 3) Remove selection/hover borders on the page container itself
  pageRoot.style.border = "none";
  pageRoot.style.boxShadow = "none";

  // 4) Remove ring/outline artifacts for selected elements (common tailwind rings)
  pageRoot.querySelectorAll<HTMLElement>("*").forEach((el) => {
    // remove tailwind ring classes if present
    Array.from(el.classList).forEach((cls) => {
      if (cls.startsWith("ring-")) el.classList.remove(cls);
    });

    // remove inline focus/selection styles that often show as borders
    const ce = el.getAttribute("contenteditable");
    if (ce === "true") {
      el.style.outline = "none";
      el.style.boxShadow = "none";
      // border is usually editor-only; keep art borders elsewhere
      el.style.border = "none";
    }
  });

  // 5) Remove chessboard coordinate labels that appear only when selected
  // These are small (10px) absolute overlays with A-H / 1-8.
  pageRoot.querySelectorAll<HTMLElement>("div").forEach((el) => {
    const fs = el.style.fontSize;
    const text = (el.textContent || "").trim();
    const isTiny = fs === "10px" || el.className.includes("text-[10px]");
    const isCoord = /^[A-H]$/.test(text) || /^[1-8]$/.test(text);
    if (isTiny && isCoord) el.remove();
  });
}
