import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const MAX_PDF_BYTES = 60 * 1024 * 1024;
export const MAX_PDF_PAGES = 150;
export type PdfExtractedPage = { page_number:number; text_content:string; extraction_method:"text" };

export function isOwnedPdfPath(path:string|undefined|null, userId:string):boolean {
  return typeof path==="string" && path.startsWith(userId+"/files/")
    && /^[-0-9a-f]+\.pdf$/i.test(path.split("/").at(-1)??"");
}
export function isPdfBytes(bytes:Uint8Array):boolean {
  if(bytes.length<50 || bytes.length>MAX_PDF_BYTES)return false;
  return new TextDecoder().decode(bytes.slice(0,512)).includes("%PDF-");
}
export function mergeTextItems(items:unknown[]):string {
  const lines:string[]=[];
  let line="";
  for(const row of items){
    if(!row||typeof row!=="object"||!("str" in row))continue;
    const text=String((row as {str?:string}).str??"").trim();
    if(!text)continue;
    line+=(line?" ":"")+text;
    if((row as {hasEOL?:boolean}).hasEOL){lines.push(line);line="";}
  }
  if(line)lines.push(line);
  return lines.join("\n").replace(/[ \t]+/g," ").trim().slice(0,20000);
}
export async function extractPdfText(bytes:Uint8Array):Promise<{
  total_pages:number;pages:PdfExtractedPage[];needs_ocr_pages:number[];
}> {
  if(!isPdfBytes(bytes))throw new Error("El archivo no es un PDF válido o supera 60 MB.");
  const task=getDocument({data:new Uint8Array(bytes),disableFontFace:true,useSystemFonts:true,isEvalSupported:false});
  let document:Awaited<typeof task.promise>|null=null;
  try{
    document=await task.promise;
    if(document.numPages>MAX_PDF_PAGES)throw new Error("Máximo 150 páginas por PDF.");
    const pages:PdfExtractedPage[]=[];
    const needs_ocr_pages:number[]=[];
    for(let p=1;p<=document.numPages;p++){
      const page=await document.getPage(p);
      const content=await page.getTextContent();
      const text=mergeTextItems(content.items);
      if(text.replace(/\s/g,"").length<12){
        needs_ocr_pages.push(p);
      }else{
        pages.push({page_number:p,text_content:text,extraction_method:"text"});
      }
      page.cleanup();
    }
    return {total_pages:document.numPages,pages,needs_ocr_pages};
  }finally{
    await document?.destroy().catch(()=>{});
    if(!document)await task.destroy().catch(()=>{});
  }
}
