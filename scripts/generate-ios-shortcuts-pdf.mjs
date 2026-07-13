import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "..", "docs", "atajos-ios-crack.pdf");

const SHARE = "https://crackdecracks.vercel.app/api/share-link";
const DROP = "https://crackdecracks.vercel.app/api/drop";

const M = 42;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const W = PAGE_W - M * 2;

const doc = new PDFDocument({
  size: "A4",
  margins: { top: M, bottom: M, left: M, right: M },
  info: { Title: "Atajos iPhone para Crack", Author: "Crack" },
});

doc.pipe(createWriteStream(pdfPath));

let y = M;

function newPage() {
  doc.addPage();
  y = M;
}

function space(h) {
  if (y + h > PAGE_H - M - 10) newPage();
}

function title(text) {
  space(28);
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#000").text(text, M, y, { width: W });
  y = doc.y + 10;
}

function section(text) {
  space(22);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000").text(text, M, y, { width: W });
  y = doc.y + 6;
}

function step(n, text) {
  space(18);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#000").text(`${n}.`, M, y, { width: 18 });
  doc.font("Helvetica").fontSize(9).fillColor("#222").text(text, M + 20, y, { width: W - 20, lineGap: 1 });
  y = doc.y + 5;
}

function note(text) {
  space(24);
  doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#555").text(text, M + 10, y, { width: W - 20, lineGap: 1 });
  y = doc.y + 8;
}

function line(text) {
  space(14);
  doc.font("Courier").fontSize(8).fillColor("#333").text(text, M + 10, y, { width: W - 20 });
  y = doc.y + 6;
}

// ─── PORTADA ───
title("Atajos iPhone para Crack");
doc.font("Helvetica").fontSize(10).fillColor("#444").text(
  "Sigue cada paso en orden. Los nombres son los de la app Atajos en español.",
  M,
  y,
  { width: W }
);
y = doc.y + 14;

step(0, "Antes de empezar: abre Crack → Perfil → Generar token. Copia el token.");

section("Vas a crear dos atajos");
doc.font("Helvetica").fontSize(9).fillColor("#222");
[
  "· Guardar enlace en Crack  →  el enlace queda en Enlaces",
  "· Enviar a Drop  →  va al chat de Drop (48 h)",
].forEach((t) => {
  space(14);
  doc.text(t, M, y, { width: W });
  y = doc.y + 3;
});
y += 8;

title("ATAJO 1: Guardar enlace en Crack");

section("1. Crear el atajo vacío");
step(1, "Abre la app Atajos.");
step(2, "Pulsa el + de abajo a la derecha.");
step(3, "Pulsa Crear atajo.");
step(4, 'Arriba, donde pone Nuevo atajo, escribe: Guardar enlace en Crack');

section("2. Que salga al compartir");
step(5, "Pulsa el ⓘ de arriba a la derecha (pantalla Detalles).");
step(6, "Activa Mostrar en el menú Compartir (o Mostrar en la hoja para compartir).");
step(7, "Pulsa Atrás para volver al atajo.");

section("3. Bloque Recibir (arriba del todo)");
step(8, "Pulsa donde pone el tipo de contenido (Apps, Ninguno, etc.).");
step(9, "Elige Compartir (o Hoja para compartir).");
step(10, "Activa solo Texto y URLs.");
step(11, "Si no hay datos de entrada: déjalo en Continuar.");

section("4. Obtener texto de la entrada del atajo");
step(12, "Pulsa el + de abajo.");
step(13, 'En el buscador escribe: texto de la entrada');
step(14, "Pulsa la acción Obtener texto de la entrada del atajo.");
note('Verás: Obtener texto de [Entrada de atajo] (palabra azul). No toques nada más.');

// page 2
newPage();
section("5. Diccionario");
step(15, "Pulsa el + de abajo.");
step(16, "Busca: Diccionario");
step(17, "Pulsa la acción Diccionario.");
step(18, "En el hueco de la IZQUIERDA de la fila, escribe: url");
step(19, "En el hueco de la DERECHA, pulsa sobre él.");
step(20, "En el menú, elige la palabra azul Texto (del bloque anterior).");
note("Debe quedar: url  →  Texto");

section("6. Obtener contenido de URL");
step(21, "Pulsa el + de abajo.");
step(22, "Busca: Obtener contenido de");
step(23, "Pulsa Obtener contenido de URL.");
step(24, "En la línea URL, pega:");
line(SHARE);
step(25, "Pulsa Mostrar más (dentro de ese bloque).");
step(26, "En Método, elige POST.");
step(27, "Pulsa Cabeceras para desplegarlas.");
step(28, "Añade una cabecera: Authorization  →  Bearer [tu token de Perfil]");
step(29, "Añade otra cabecera: Content-Type  →  application/json");
step(30, "En Solicitar cuerpo, elige JSON.");
step(31, "En el campo Solicitar cuerpo de abajo, elige la palabra azul Diccionario.");

section("7. Obtener diccionario de");
step(32, "Pulsa el + de abajo.");
step(33, "Busca: Obtener diccionario de");
step(34, "Pulsa Obtener diccionario de.");
step(35, "Pulsa el campo y elige la palabra azul Contenido de URL.");

section("8. Si");
step(36, "Pulsa el + de abajo.");
step(37, "Busca: Si");
step(38, "Pulsa la acción Si.");
step(39, "Pulsa la condición del Si.");
step(40, "Elige Diccionario (del paso anterior).");
step(41, "Pulsa Obtener valor del diccionario (o Obtener Valor para).");
step(42, "Escribe: ok");
step(43, "Pulsa es → elige verdadero (o true).");

// page 3
newPage();
section("9. Si ha ido bien (dentro del Si, arriba)");
step(44, "Pulsa el + que sale DENTRO del Si.");
step(45, "Busca: Mostrar notificación");
step(46, "Pulsa Mostrar notificación.");
step(47, "Escribe: Enlace guardado en Crack");

section("10. Si ha fallado (De lo contrario)");
step(48, "Pulsa el + dentro de De lo contrario.");
step(49, "Busca: Mostrar resultado");
step(50, "Pulsa Mostrar resultado.");
step(51, "Elige Contenido de URL para ver el error.");

section("11. Probar");
step(52, "Pulsa ▶ abajo, o comparte un enlace desde Safari → Compartir → tu atajo.");

title("ATAJO 2: Enviar a Drop");
doc.font("Helvetica").fontSize(9).fillColor("#222").text(
  "Repite TODO el Atajo 1 con un atajo nuevo. Solo cambia esto:",
  M,
  y,
  { width: W }
);
y = doc.y + 10;

space(80);
const tableY = y;
const c1 = 155;
const c2 = W - c1;
const rows = [
  ["Nombre del atajo", "Enviar a Drop"],
  ["Paso 18 — hueco izquierdo", "content (no url)"],
  ["Paso 24 — URL", DROP],
  ["Paso 47 — notificación", "Drop enviado"],
];
rows.forEach(([a, b], i) => {
  doc.rect(M, tableY + i * 20, c1, 20).stroke("#ccc");
  doc.rect(M + c1, tableY + i * 20, c2, 20).stroke("#ccc");
  doc.font("Helvetica").fontSize(8.5).fillColor("#000").text(a, M + 4, tableY + i * 20 + 6, { width: c1 - 8 });
  doc.font("Helvetica-Bold").fontSize(8).text(b, M + c1 + 4, tableY + i * 20 + 6, { width: c2 - 8 });
});
y = tableY + rows.length * 20 + 16;

section("Orden final de bloques (de arriba a abajo)");
[
  "Recibir",
  "Obtener texto de la entrada del atajo",
  "Diccionario",
  "Obtener contenido de URL",
  "Obtener diccionario de",
  "Si → Mostrar notificación / De lo contrario → Mostrar resultado",
].forEach((t, i) => {
  step(i + 1, t);
});

section("Si algo falla");
[
  "Token inválido → Regenerar en Perfil, cambiar paso 28",
  "No sale al compartir → Paso 6: Mostrar en el menú Compartir",
  "No pasa nada → Falta Mostrar notificación dentro del Si",
].forEach((t, i) => {
  step(i + 1, t);
});

doc.font("Helvetica").fontSize(7).fillColor("#999").text("crackdecracks.vercel.app", M, PAGE_H - M - 8, {
  width: W,
  align: "center",
});

doc.end();

await new Promise((resolve, reject) => {
  doc.on("end", resolve);
  doc.on("error", reject);
});

console.log(`PDF generado: ${pdfPath}`);
