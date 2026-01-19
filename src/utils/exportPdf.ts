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
  const pdf = new jsPDF({
    orientation: orientation === "portrait" ? "p" : "l",
    unit: "px",
    format: getPdfFormat(pageSize, orientation),
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pageRefs[pages[i].id];
    if (!pageEl) continue;

    const clone = pageEl.cloneNode(true) as HTMLElement;

    // ⭐ bắt buộc: fix Tailwind oklch
    forceSafeColors(clone);

    // remove grid overlay
    clone.querySelectorAll("[style*='linear-gradient']").forEach((el) => {
      (el as HTMLElement).style.backgroundImage = "none";
    });

    const canvas = await html2canvas(clone, {
      scale: 3, // ⭐ PDF IN SÁCH: 300 DPI ~ scale 3
      backgroundColor: "#ffffff",
      useCORS: true,
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

/* ================= HELPERS ================= */

function getPdfFormat(size: PageSize, orientation: PageOrientation): [number, number] {
  const A4: [number, number] = [595, 842];
  const A5: [number, number] = [420, 595];

  const base = size === "a4" ? A4 : A5;
  return orientation === "portrait" ? base : [base[1], base[0]];
}

/**
 * html2canvas không hỗ trợ oklch → ép về RGB
 */
function forceSafeColors(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const style = window.getComputedStyle(el);
    [
      "color",
      "backgroundColor",
      "borderColor",
      "outlineColor",
      "fill",
      "stroke",
    ].forEach((prop) => {
      const val = style.getPropertyValue(prop);
      if (val && val.includes("oklch")) {
        el.style.setProperty(prop, "rgb(0,0,0)");
      }
    });
  });
}
