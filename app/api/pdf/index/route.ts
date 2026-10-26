import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText, isOwnedPdfPath, MAX_PDF_BYTES } from "@/lib/pdf-extract";

export const runtime="nodejs";
export const maxDuration=60;
const schema=z.object({item_id:z.string().uuid()});

export async function POST(req:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"No autenticado"},{status:401});
  const body=await req.json().catch(()=>null);
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"ID de documento inválido"},{status:400});
  const {data:item,error:lookupError}=await supabase.from("items")
    .select("id,user_id,type,file_url,metadata,title")
    .eq("id",parsed.data.item_id).eq("user_id",user.id).maybeSingle();
  if(lookupError)return NextResponse.json({error:"No se puede consultar el documento"},{status:500});
  if(!item)return NextResponse.json({error:"Documento no encontrado"},{status:404});
  if(item.metadata?.extra===true)return NextResponse.json({error:"Los archivos Extra no se indexan"},{status:403});
  if(item.type!=="file"||!isOwnedPdfPath(item.file_url,user.id))
    return NextResponse.json({error:"No es un PDF de tu biblioteca"},{status:400});

  const {data:blob,error:downloadError}=await supabase.storage.from("crack-files").download(item.file_url!);
  if(downloadError||!blob)return NextResponse.json({error:"No se pudo leer el archivo privado"},{status:502});
  if(blob.size>MAX_PDF_BYTES)return NextResponse.json({error:"PDF demasiado grande (máximo 60 MB)"},{status:413});

  try{
    const extracted=await extractPdfText(new Uint8Array(await blob.arrayBuffer()));
    // Persistencia en la sesión del usuario; ni service_role ni terceros.
    for(let offset=0;offset<extracted.pages.length;offset+=25){
      const rows=extracted.pages.slice(offset,offset+25).map(page=>({
        item_id:item.id,user_id:user.id,...page,indexed_at:new Date().toISOString(),
      }));
      const {error}=await supabase.from("pdf_pages").upsert(rows,{onConflict:"item_id,page_number"});
      if(error)throw new Error("No se pudieron guardar las páginas extraídas.");
    }
    // Si el OCR de algunas páginas ya terminó, no repetirlo al reindexar.
    const {data:previousOcr}=await supabase.from("pdf_pages")
      .select("page_number").eq("item_id",item.id).eq("extraction_method","ocr");
    const alreadyOcred=new Set((previousOcr??[]).map(row=>row.page_number));
    const ocrPending=extracted.needs_ocr_pages.filter(p=>!alreadyOcred.has(p));
    const mergedMetadata={...item.metadata,
      pdf_indexed_at:new Date().toISOString(),
      pdf_page_count:extracted.total_pages,
      pdf_pages_with_text:extracted.pages.length,
      pdf_needs_ocr:ocrPending.length,
    };
    const {error:metaError}=await supabase.from("items").update({metadata:mergedMetadata})
      .eq("id",item.id).eq("user_id",user.id);
    if(metaError)throw new Error("No se pudo guardar el estado de indexación.");
    return NextResponse.json({
      item_id:item.id,total_pages:extracted.total_pages,
      indexed_pages:extracted.pages.length,
      needs_ocr_pages:ocrPending,
    });
  }catch(error){
    console.error("[pdf:index]",error instanceof Error?error.message:"unknown");
    return NextResponse.json({
      error:error instanceof Error&&/PDF|páginas|MB|contraseña/i.test(error.message)
        ? error.message : "No se pudo extraer o guardar el texto del PDF",
    },{status:422});
  }
}
