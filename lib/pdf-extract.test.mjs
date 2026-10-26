import {test} from "node:test";
import assert from "node:assert/strict";
import {extractPdfText,isPdfBytes,isOwnedPdfPath,mergeTextItems} from "./pdf-extract.ts";

function pdfWithText(text){
  const escaped=text.replace(/[\\()]/g,c=>"\\"+c);
  const stream="BT /F1 14 Tf 65 720 Td ("+escaped+") Tj ET";
  const objects=[
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    "<< /Length "+Buffer.byteLength(stream)+" >>\nstream\n"+stream+"\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let str="%PDF-1.4\n";
  const starts=[0];
  for(let i=0;i<objects.length;i++){
    starts.push(Buffer.byteLength(str));
    str+=(i+1)+" 0 obj\n"+objects[i]+"\nendobj\n";
  }
  const xref=Buffer.byteLength(str);
  str+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
  for(let i=1;i<starts.length;i++)str+=String(starts[i]).padStart(10,"0")+" 00000 n \n";
  str+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";
  return new Uint8Array(Buffer.from(str));
}

test("no autoriza rutas a PDF ajenos, carpetas privadas o otros tipos",()=>{
  const owner="11111111-1111-4111-8111-111111111111";
  assert.equal(isOwnedPdfPath(owner+"/files/22222222-2222-4222-8222-222222222222.pdf",owner),true);
  assert.equal(isOwnedPdfPath("otro-usuario/files/22222222-2222-4222-8222-222222222222.pdf",owner),false);
  assert.equal(isOwnedPdfPath(owner+"/drops/22222222-2222-4222-8222-222222222222.pdf",owner),false);
  assert.equal(isOwnedPdfPath(owner+"/files/bad.txt",owner),false);
});

test("rechaza bytes falsos aunque el nombre termine en .pdf",()=>{
  assert.equal(isPdfBytes(new Uint8Array(200)),false);
});

test("extrae página con su número para citas y sin OCR de pago",async()=>{
  const bytes=pdfWithText("Reglas de juego y descansos de quince minutos.");
  assert.equal(isPdfBytes(bytes),true);
  const result=await extractPdfText(bytes);
  assert.equal(result.total_pages,1);
  assert.deepEqual(result.needs_ocr_pages,[]);
  assert.equal(result.pages[0].page_number,1);
  assert.equal(result.pages[0].extraction_method,"text");
  assert.match(result.pages[0].text_content,/descansos de quince minutos/);
});

test("respeta líneas de texto y no introduce espacios irrelevantes",()=>{
  assert.equal(mergeTextItems([
    {str:"Capítulo uno",hasEOL:true},
    {str:"Pausa",hasEOL:false},
    {str:"15 minutos",hasEOL:true},
  ]),"Capítulo uno\nPausa 15 minutos");
});
