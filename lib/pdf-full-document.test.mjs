import { test } from "node:test";
import assert from "node:assert/strict";
import { extractPdfText } from "./pdf-extract.ts";
import { pdfUploadKind } from "./pdf-upload-validation.ts";

function multipagePdf(texts){
  const n=texts.length;
  const fontNo=3+2*n;
  const objects=[
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Count ${n} /Kids [${texts.map((_,i)=>`${3+2*i} 0 R`).join(" ")}] >>`,
  ];
  for(let i=0;i<n;i++){
    const pageNo=3+2*i;
    const streamNo=pageNo+1;
    const escaped=texts[i].replace(/[\\()]/g,c=>"\\"+c);
    const stream=`BT /F1 16 Tf 50 720 Td (${escaped}) Tj ET`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontNo} 0 R >> >> /Contents ${streamNo} 0 R >>`,
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    );
  }
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let output="%PDF-1.4\n";
  const offsets=[0];
  objects.forEach((object,index)=>{
    offsets.push(Buffer.byteLength(output));
    output+=`${index+1} 0 obj\n${object}\nendobj\n`;
  });
  const xref=Buffer.byteLength(output);
  output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++)output+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  output+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(output));
}
test("extrae TODAS las páginas de un documento PDF de varias páginas",async()=>{
  const pdf=multipagePdf([
    "Reglamento completo: primera pagina con introduccion.",
    "Segunda pagina: cambios, pruebas y sustituciones.",
    "Tercera pagina: anexos y criterios finales.",
  ]);
  const result=await extractPdfText(pdf);
  assert.equal(result.total_pages,3);
  assert.deepEqual(result.pages.map(p=>p.page_number),[1,2,3]);
  assert.match(result.pages[1].text_content,/Segunda pagina/);
  assert.match(result.pages[2].text_content,/Tercera pagina/);
  assert.deepEqual(result.needs_ocr_pages,[]);
});
test("iPhone: detecta PDF completo incluso si el MIME era image/jpeg",()=>{
  const pdf=multipagePdf(["primera pagina", "segunda pagina"]);
  const kind=pdfUploadKind("manual.pdf","image/jpeg",pdf);
  assert.deepEqual(kind,{isPdf:true,extension:"pdf",mime:"application/pdf"});
});
test("iPhone: no guarda miniatura JPEG con extensión PDF como documento",()=>{
  const jpeg=new Uint8Array([0xff,0xd8,0xff,0xe0,0,1,2,3,4,5]);
  assert.throws(()=>pdfUploadKind("manual.pdf","image/jpeg",jpeg),/primera página/);
});
