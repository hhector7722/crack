"use client";
import { createClient } from "@/lib/supabase/client";

type IndexResult={
  total_pages:number;
  indexed_pages:number;
  needs_ocr_pages:number[];
  error?:string;
};

async function ocrMissingPages(blob:Blob,itemId:string,missing:number[],
  onPage?: (page:number,done:number,total:number)=>void):Promise<number>{
  if(!missing.length)return 0;
  // Procesamiento privado en el navegador: no se suben imágenes a Groq ni a OCR SaaS.
  const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc=new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url
  ).toString();
  const tesseract=await import("tesseract.js");
  const pdf=await pdfjs.getDocument({
    data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,
  }).promise;
  let worker:Awaited<ReturnType<typeof tesseract.createWorker>>|undefined;
  let finished=0;
  try{
    worker=await tesseract.createWorker(["spa","eng"],1);
    for(const pageNum of missing){
      if(pageNum<1||pageNum>pdf.numPages)continue;
      const page=await pdf.getPage(pageNum);
      const viewport=page.getViewport({scale:1.7});
      const scale=Math.min(1,2400/Math.max(viewport.width,viewport.height));
      const display=page.getViewport({scale:1.7*scale});
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.ceil(display.width));
      canvas.height=Math.max(1,Math.ceil(display.height));
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      if(!ctx)throw new Error("No se pudo preparar el OCR en este navegador.");
      await page.render({canvasContext:ctx,viewport:display}).promise;
      const {data}=await worker.recognize(canvas);
      const text=data.text.trim().slice(0,20000);
      if(text.length>=10){
        const response=await fetch("/api/pdf/pages",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({item_id:itemId,pages:[{page_number:pageNum,text_content:text}]}),
        });
        if(!response.ok){
          const error=await response.json().catch(()=>({}));
          throw new Error(error.error||"No se pudo guardar el OCR.");
        }
        finished++;
      }
      canvas.width=canvas.height=0;
      page.cleanup();
      onPage?.(pageNum,finished,missing.length);
    }
  }finally{
    await worker?.terminate();
    await pdf.destroy();
  }
  return finished;
}

export async function indexStoredPdf(
  itemId:string,
  file?:Blob,
  onPage?:(page:number,done:number,total:number)=>void,
):Promise<{total_pages:number;indexed_pages:number;ocr_pages:number}>{
  const res=await fetch("/api/pdf/index",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({item_id:itemId}),
  });
  const result=await res.json() as IndexResult;
  if(!res.ok)throw new Error(result.error||"No se pudo leer el PDF.");
  let ocrPages=0;
  if(result.needs_ocr_pages.length){
    let blob=file;
    if(!blob){
      const supabase=createClient();
      const {data:item,error}=await supabase.from("items")
        .select("file_url").eq("id",itemId).single();
      if(error||!item?.file_url)throw new Error("No se ha encontrado el PDF para hacer OCR.");
      const {data,error:downloadError}=await supabase.storage.from("crack-files").download(item.file_url);
      if(downloadError||!data)throw new Error("No se pudo descargar el PDF para OCR.");
      blob=data;
    }
    ocrPages=await ocrMissingPages(blob,itemId,result.needs_ocr_pages,onPage);
  }
  return {total_pages:result.total_pages,indexed_pages:result.indexed_pages,ocr_pages:ocrPages};
}

export async function indexExistingPdfs(
  progress:(message:string)=>void,
):Promise<{processed:number;failed:number}>{
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)throw new Error("Necesitas iniciar sesión.");
  const {data,error}=await supabase.from("items")
    .select("id,title,file_url,metadata")
    .eq("user_id",user.id).eq("type","file")
    .order("created_at",{ascending:false}).limit(300);
  if(error)throw new Error("No se pudo consultar la biblioteca.");
  const pdfs=(data??[]).filter(item=>
    item.file_url?.toLowerCase().endsWith(".pdf") &&
    item.file_url.startsWith(user.id+"/files/") &&
    item.metadata?.extra!==true &&
    (!item.metadata?.pdf_indexed_at||Number(item.metadata?.pdf_needs_ocr)>0)
  );
  if(!pdfs.length){progress("Todos los PDF disponibles ya están indexados.");return {processed:0,failed:0};}
  let processed=0,failed=0;
  for(let i=0;i<pdfs.length;i++){
    const item=pdfs[i];
    progress(`Leyendo PDF ${i+1}/${pdfs.length}: ${item.title||"Sin título"}`);
    try{
      await indexStoredPdf(item.id,undefined,(_page,done,total)=>
        progress(`OCR de ${item.title||"PDF"}: ${done}/${total} páginas reconocidas`));
      processed++;
    }catch(e){
      console.warn("[pdf:backfill]",e instanceof Error?e.message:"unknown");
      failed++;
      progress(`No se pudo indexar ${item.title||"PDF"}: ${e instanceof Error?e.message:"error"}`);
    }
  }
  progress(`PDF procesados: ${processed}. Errores: ${failed}.`);
  return {processed,failed};
}
