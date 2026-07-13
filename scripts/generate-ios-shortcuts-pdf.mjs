import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "..", "docs", "atajos-ios-crack.pdf");

const M = 48;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - M * 2;
const COL2 = (CONTENT_W - 12) / 2;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: M, bottom: M, left: M, right: M },
  info: {
    Title: "Atajos iOS — Crack",
    Author: "Crack",
    Subject: "Guía para configurar atajos iPhone",
  },
});

doc.pipe(createWriteStream(pdfPath));

function newPage() {
  doc.addPage();
  y = M;
}

let y = M;

function ensureSpace(h) {
  if (y + h > PAGE_H - M) newPage();
}

function sectionTitle(text) {
  ensureSpace(36);
  doc
    .moveTo(M, y)
    .lineTo(M + CONTENT_W, y)
    .lineWidth(2)
    .strokeColor("#18181b")
    .stroke();
  y += 10;
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#18181b").text(text, M, y, {
    width: CONTENT_W,
  });
  y = doc.y + 10;
}

function subTitle(text) {
  ensureSpace(24);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#18181b").text(text, M, y, {
    width: CONTENT_W,
  });
  y = doc.y + 6;
}

function label(text) {
  ensureSpace(16);
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#71717a").text(text.toUpperCase(), M, y);
  y = doc.y + 4;
}

function body(text, opts = {}) {
  ensureSpace(20);
  doc
    .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(opts.size ?? 9.5)
    .fillColor(opts.color ?? "#3f3f46")
    .text(text, M, y, { width: CONTENT_W, lineGap: 2 });
  y = doc.y + (opts.gap ?? 8);
}

function badge(text, x, bg, fg) {
  const w = doc.font("Helvetica-Bold").fontSize(8).widthOfString(text) + 12;
  doc.roundedRect(x, y, w, 16, 3).fill(bg);
  doc.fillColor(fg).text(text, x + 6, y + 4);
  return w;
}

function drawTable(headers, rows, colWidths) {
  const rowH = 22;
  const totalH = rowH * (rows.length + 1) + 4;
  ensureSpace(totalH);

  let x = M;
  const startY = y;

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#18181b");
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], rowH).fillAndStroke("#f4f4f5", "#d4d4d8");
    doc.fillColor("#18181b").text(h, x + 6, y + 7, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });
  y += rowH;

  rows.forEach((row, ri) => {
    x = M;
    const bg = ri % 2 === 0 ? "#ffffff" : "#fafafa";
    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], rowH).fillAndStroke(bg, "#d4d4d8");
      doc.font("Helvetica").fontSize(8.5).fillColor("#3f3f46").text(String(cell), x + 6, y + 7, {
        width: colWidths[i] - 10,
      });
      x += colWidths[i];
    });
    y += rowH;
  });

  y = startY + rowH * (rows.length + 1) + 10;
}

function configBox(rows) {
  const boxH = 16 + rows.length * 22;
  ensureSpace(boxH);
  const startY = y;
  doc.roundedRect(M, y, CONTENT_W, boxH, 6).fill("#18181b");
  y += 10;
  rows.forEach(([k, v]) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#a1a1aa").text(k, M + 12, y, { width: 110 });
    doc.font("Courier").fontSize(7.5).fillColor("#fafafa").text(v, M + 125, y, { width: CONTENT_W - 140 });
    y += 20;
  });
  y = startY + boxH + 10;
}

function alertBox(text, type = "warn") {
  const colors = {
    warn: { border: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
    danger: { border: "#dc2626", bg: "#fef2f2", text: "#991b1b" },
    ok: { border: "#16a34a", bg: "#f0fdf4", text: "#166534" },
  };
  const c = colors[type];
  ensureSpace(50);
  const startY = y;
  doc.rect(M, y, 4, 44).fill(c.border);
  doc.rect(M + 4, y, CONTENT_W - 4, 44).fill(c.bg);
  doc.font("Helvetica").fontSize(8.5).fillColor(c.text).text(text, M + 14, y + 8, {
    width: CONTENT_W - 24,
    lineGap: 1,
  });
  y = startY + 52;
}

function stepList(steps) {
  steps.forEach((step, i) => {
    ensureSpace(28);
    const numColor = step.key ? "#2563eb" : "#18181b";
    doc.circle(M + 10, y + 8, 9).fill(numColor);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff").text(String(i + 1), M + 7, y + 4);
    doc.font(step.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor("#3f3f46").text(step.text, M + 28, y + 2, {
      width: CONTENT_W - 32,
      lineGap: 1,
    });
    y = doc.y + 8;
  });
  y += 4;
}

function flowBar(items) {
  ensureSpace(42);
  const itemW = (CONTENT_W - (items.length - 1) * 14) / items.length;
  let x = M;
  items.forEach((item, i) => {
    doc.roundedRect(x, y, itemW, 34, 4).fillAndStroke("#f4f4f5", "#d4d4d8");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#18181b").text(item.title, x + 4, y + 6, {
      width: itemW - 8,
      align: "center",
    });
    doc.font("Helvetica").fontSize(7).fillColor("#71717a").text(item.sub, x + 4, y + 18, {
      width: itemW - 8,
      align: "center",
    });
    x += itemW;
    if (i < items.length - 1) {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#a1a1aa").text("→", x, y + 10);
      x += 14;
    }
  });
  y += 44;
}

function card(x, w, num, title, desc, meta, dark = false) {
  const h = 72;
  ensureSpace(h + 4);
  const startY = y;
  doc.roundedRect(x, y, w, h, 6).lineWidth(dark ? 2 : 1.5).strokeColor(dark ? "#18181b" : "#a1a1aa").stroke();
  doc.circle(x + 16, y + 16, 9).fill(dark ? "#18181b" : "#52525b");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#fff").text(num, x + 13.5, y + 12);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#18181b").text(title, x + 32, y + 10, { width: w - 40 });
  doc.font("Helvetica").fontSize(8).fillColor("#52525b").text(desc, x + 12, y + 28, { width: w - 24 });
  doc.rect(x + 10, y + 50, w - 20, 16).fill("#f4f4f5");
  doc.font("Courier").fontSize(7).fillColor("#3f3f46").text(meta, x + 14, y + 54);
  if (x === M) y = startY + h + 10;
}

// ─── PORTADA ───
doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
badge("GUÍA RÁPIDA · IPHONE", M, "#18181b", "#ffffff");
y += 22;

doc.font("Helvetica-Bold").fontSize(26).fillColor("#18181b").text("Atajos iOS", M, y);
y = doc.y + 2;
doc.text("para Crack", M, y);
y = doc.y + 12;

body(
  "Configura dos atajos en la app Atajos de iPhone para compartir desde Safari, YouTube y cualquier app directamente a Crack.",
  { size: 11, color: "#52525b", gap: 16 }
);

sectionTitle("Mapa general");
drawTable(
  ["Atajo", "API", "Destino", "Duración"],
  [
    ["1 · Guardar enlace", "POST /api/share-link", "Pestaña Enlaces", "Permanente"],
    ["2 · Enviar a Drop", "POST /api/drop", "Chat de Drop", "48 horas"],
  ],
  [130, 145, 115, CONTENT_W - 390]
);

card(M, COL2, "1", "Guardar enlace en Crack", "Artículos y páginas para conservar siempre.", "clave JSON: url", true);
card(M + COL2 + 12, COL2, "2", "Enviar a Drop", "Texto o enlaces al chat temporal.", "clave JSON: content");

alertBox(
  "Un solo token para ambos. Genera el token en Crack → Perfil → Generar token. Si lo regeneras, actualízalo en los dos atajos. NUNCA uses GET ni pongas el token en la URL.",
  "danger"
);

configBox([
  ["Dominio", "https://crackdecracks.vercel.app"],
  ["Auth", "Authorization: Bearer TU_TOKEN"],
  ["Método", "POST (siempre)"],
]);

// ─── PÁGINA 2 ───
newPage();
sectionTitle("Paso 0 — Token (una sola vez)");
stepList([
  { text: "Abre Crack en el iPhone → pestaña Perfil." },
  { text: "Pulsa Generar token (o Regenerar si ya tenías uno).", key: true, bold: true },
  { text: "Copia el token AHORA — no se vuelve a mostrar.", key: true, bold: true },
  { text: "Guárdalo hasta configurar los atajos." },
]);

sectionTitle("Atajo 1 — Guardar enlace en Crack");
body("Nombre sugerido: Guardar enlace en Crack", { bold: true, gap: 6 });

flowBar([
  { title: "Compartir", sub: "cualquier app" },
  { title: "Texto", sub: "entrada" },
  { title: "POST", sub: "share-link" },
  { title: "Enlaces", sub: "permanente" },
]);

subTitle("Ajustes del atajo");
drawTable(
  ["Ajuste", "Valor"],
  [
    ["Mostrar en hoja compartir", "Activado"],
    ["Tipos de entrada", "Texto + URLs"],
  ],
  [180, CONTENT_W - 180]
);

subTitle("Pasos (en orden)");
stepList([
  { text: "Obtener texto de entrada" },
  { text: "Diccionario → clave url = variable del paso anterior" },
  { text: "Obtener contenido de URL → ver configuración HTTP", key: true, bold: true },
  { text: "Obtener diccionario de → respuesta del paso 3" },
  { text: "Si → clave ok es true" },
  { text: "Verdadero → Mostrar notificación: «Enlace guardado»" },
  { text: "Falso → Mostrar resultado (para ver el error)" },
]);

subTitle("Configuración HTTP (paso 3)");
configBox([
  ["URL", "https://crackdecracks.vercel.app/api/share-link"],
  ["Método", "POST"],
  ["Authorization", "Bearer TU_TOKEN"],
  ["Content-Type", "application/json"],
  ["Cuerpo", "JSON → diccionario (paso 2)"],
]);

alertBox(
  "Opcional: tras obtener el diccionario, extrae id y abre https://crackdecracks.vercel.app/?id=ID para refrescar la app.",
  "ok"
);

// ─── PÁGINA 3 ───
newPage();
sectionTitle("Atajo 2 — Enviar a Drop");
body("Nombre sugerido: Enviar a Drop", { bold: true, gap: 6 });

flowBar([
  { title: "Compartir", sub: "cualquier app" },
  { title: "Texto", sub: "entrada" },
  { title: "POST", sub: "/api/drop" },
  { title: "Drop", sub: "chat 48h" },
]);

subTitle("Pasos (en orden)");
stepList([
  { text: "Obtener texto de entrada" },
  { text: "Diccionario → clave content = variable del paso anterior" },
  { text: "Obtener contenido de URL → ver configuración HTTP", key: true, bold: true },
  { text: "Obtener diccionario de → respuesta del paso 3" },
  { text: "Si → clave ok es true" },
  { text: "Verdadero → Mostrar notificación: «Drop enviado»" },
  { text: "Falso → Mostrar resultado (para ver el error)" },
]);

subTitle("Configuración HTTP (paso 3)");
configBox([
  ["URL", "https://crackdecracks.vercel.app/api/drop"],
  ["Método", "POST"],
  ["Authorization", "Bearer TU_TOKEN"],
  ["Content-Type", "application/json"],
  ["Cuerpo", "JSON → diccionario (paso 2)"],
]);

subTitle("¿Cuál uso?");
drawTable(
  ["Situación", "Atajo"],
  [
    ["Artículo para leer después (permanente)", "Atajo 1 · Enlaces"],
    ["Link para revisar en el chat (48h)", "Atajo 2 · Drop"],
    ["Referencia con preview OG", "Atajo 1"],
    ["Nota rápida temporal", "Atajo 2"],
  ],
  [CONTENT_W * 0.65, CONTENT_W * 0.35]
);

subTitle("Diferencias clave");
drawTable(
  ["", "Atajo 1", "Atajo 2"],
  [
    ["Endpoint", "/api/share-link", "/api/drop"],
    ["Clave JSON", "url", "content"],
    ["Notificación OK", "Enlace guardado", "Drop enviado"],
    ["Destino en app", "Pestaña Enlaces", "Chat Drop"],
  ],
  [100, (CONTENT_W - 100) / 2, (CONTENT_W - 100) / 2]
);

// ─── PÁGINA 4 ───
newPage();
sectionTitle("Errores frecuentes");
drawTable(
  ["Mensaje", "Solución"],
  [
    ["Token inválido", "Regenerar en Perfil y actualizar ambos atajos"],
    ["Token requerido", "Añadir Authorization: Bearer TU_TOKEN"],
    ["No se encontró ninguna URL válida", "Usar Obtener texto de entrada (Atajo 1)"],
    ["content o un archivo requerido", "Verificar clave content en Atajo 2"],
    ["No pasa nada al final", "Añadir Mostrar notificación o Abrir URL"],
  ],
  [170, CONTENT_W - 170]
);

sectionTitle("Checklist final");
stepList([
  { text: "Token generado y copiado desde Perfil" },
  { text: "Atajo 1: «Guardar enlace en Crack»" },
  { text: "Atajo 2: «Enviar a Drop»" },
  { text: "Ambos con «Mostrar en hoja para compartir» activado" },
  { text: "Ambos usan POST (no GET)" },
  { text: "Token en cabecera Authorization (no en la URL)" },
  { text: "Atajo 1 → url · Atajo 2 → content" },
  { text: "Notificación de confirmación al final" },
  { text: "Prueba compartiendo un enlace desde Safari", key: true, bold: true },
]);

subTitle("Ejemplos JSON");
ensureSpace(60);
doc.font("Helvetica-Bold").fontSize(8).fillColor("#71717a").text("ATAJO 1", M, y);
doc.text("ATAJO 2", M + COL2 + 12, y);
y += 14;
doc.rect(M, y, COL2, 36).fill("#f4f4f5");
doc.rect(M + COL2 + 12, y, COL2, 36).fill("#f4f4f5");
doc.font("Courier").fontSize(8).fillColor("#3f3f46").text('{ "url": "https://ejemplo.com" }', M + 8, y + 12);
doc.text('{ "content": "Texto o enlace" }', M + COL2 + 20, y + 12);
y += 48;

alertBox(
  "Atajo 3 (opcional): para fotos, audio o vídeo a Drop, usa POST con cuerpo Formulario y campo file. Ver docs/ios-shortcuts.md.",
  "warn"
);

ensureSpace(20);
doc
  .font("Helvetica")
  .fontSize(7.5)
  .fillColor("#a1a1aa")
  .text("Crack · Atajos iOS · crackdecracks.vercel.app", M, PAGE_H - M - 10, {
    width: CONTENT_W,
    align: "center",
  });

doc.end();

await new Promise((resolve, reject) => {
  doc.on("end", resolve);
  doc.on("error", reject);
});

console.log(`PDF generado: ${pdfPath}`);
