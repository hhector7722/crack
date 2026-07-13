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
  if (y + h > PAGE_H - M - 12) newPage();
}

function heading(text) {
  space(22);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#000").text(text, M, y, { width: W });
  y = doc.y + 8;
}

function step(n, text) {
  space(15);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000").text(`${n}.`, M, y, { width: 16 });
  doc.font("Helvetica").fontSize(8.5).fillColor("#222").text(text, M + 18, y, { width: W - 18, lineGap: 1 });
  y = doc.y + 4;
}

function pasteUrl(url) {
  space(12);
  doc.font("Helvetica").fontSize(8).fillColor("#333").text(url, M + 18, y, { width: W - 18 });
  y = doc.y + 6;
}

doc.font("Helvetica").fontSize(8).fillColor("#666").text("iOS 26.5", M, y);
y = doc.y + 4;
heading("Atajos iPhone para Crack");
doc.font("Helvetica").fontSize(9).fillColor("#444").text(
  "Cada paso es algo que ves o pulsas en el iPhone. Sigue el orden.",
  M,
  y,
  { width: W }
);
y = doc.y + 10;

heading("ATAJO 1: Guardar enlace en Crack");

heading("Crear el atajo");
step(1, "Abre Atajos.");
step(2, "Pulsa el más de arriba a la derecha.");
step(3, "Pulsa Nuevo atajo.");
step(4, "Pulsa Renombrar.");
step(5, "Escribe Guardar enlace en Crack.");
step(6, "Pulsa OK.");

heading("Mostrar al compartir");
step(7, "Pulsa Detalles.");
step(8, "Activa Mostrar al compartir.");
step(9, "Pulsa OK.");

heading("Qué recibe el atajo");
step(10, "En la acción de entrada, pulsa Cualquiera.");
step(11, "Deja activado solo Texto y Direcciones URL.");
step(12, "Pulsa OK.");
step(13, "Pulsa Continuar.");
step(14, "Vuelve a pulsar Continuar.");
step(15, "Pulsa OK.");

heading("Obtener texto de la entrada del atajo");
step(16, "Pulsa Añadir acción.");
step(17, "Escribe en el buscador: texto de la entrada");
step(18, "Pulsa Obtener texto de la entrada del atajo.");

heading("Diccionario");
step(19, "Pulsa Añadir acción.");
step(20, "Escribe en el buscador: Diccionario");
step(21, "Pulsa Diccionario.");
step(22, "En el hueco izquierdo escribe: url");
step(23, "En el hueco derecho elige la palabra azul Texto.");

heading("Obtener contenido de URL");
step(24, "Pulsa Añadir acción.");
step(25, "Escribe en el buscador: Obtener contenido de");
step(26, "Pulsa Obtener contenido de URL.");
step(27, "En URL pega:");
pasteUrl(SHARE);
step(28, "Pulsa Mostrar más.");
step(29, "En Método elige POST.");
step(30, "Pulsa Cabeceras.");
step(31, "Primera fila: Authorization en el primer hueco. Bearer y tu token en el segundo.");
step(32, "Segunda fila: Content-Type en el primer hueco. application/json en el segundo.");
step(33, "En Cuerpo de la solicitud elige JSON.");
step(34, "Pulsa Añadir nuevo campo.");
step(35, "Fila nueva: izquierda url, derecha Texto. Si ya lo tienes, ve al paso 36.");

newPage();
heading("Obtener diccionario de la entrada");
step(36, "Pulsa Añadir acción.");
step(37, "Escribe en el buscador: Obtener diccionario de");
step(38, "Pulsa Obtener diccionario de la entrada.");
step(39, "Elige la palabra azul Contenido de URL.");

heading("Si");
step(40, "Pulsa Añadir acción.");
step(41, "Escribe en el buscador: Si");
step(42, "Pulsa Si.");
step(43, "Toca Diccionario a la izquierda. No toques tiene algún valor.");
step(44, "Baja en el menú hasta el final.");
step(45, "En Obtener valor de clave escribe ok.");
step(46, "Toca tiene algún valor y cámbialo a es.");
step(47, "Elige verdadero.");

heading("Cuando funciona");
step(49, "Dentro del Si, pulsa Añadir acción.");
step(50, "Pulsa Mostrar notificación.");
step(51, "Escribe Enlace guardado en Crack.");

heading("Cuando falla");
step(52, "En De lo contrario, pulsa Añadir acción.");
step(53, "Pulsa Mostrar resultado.");
step(54, "Elige Contenido de URL.");

heading("Probar");
step(55, "Pulsa OK.");
step(56, "Comparte un enlace desde Safari y elige tu atajo.");

heading("ATAJO 2: Enviar a Drop");
doc.font("Helvetica").fontSize(9).fillColor("#222").text(
  "Repite el Atajo 1. Cambia solo el nombre, el Diccionario, la URL y el mensaje:",
  M,
  y,
  { width: W }
);
y = doc.y + 8;

step(1, "Nombre: Enviar a Drop");
step(2, "Diccionario hueco izquierdo: content");
step(3, "URL:");
pasteUrl(DROP);
step(4, "Mensaje: Drop enviado");

doc.end();

await new Promise((resolve, reject) => {
  doc.on("end", resolve);
  doc.on("error", reject);
});

console.log(`PDF generado: ${pdfPath}`);
