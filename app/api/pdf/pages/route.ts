import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isOwnedPdfPath } from "@/lib/pdf-extract";

export const runtime="nodejs";
const pageSchema=z.object({
  page_number:z.number().int().min(1).max(150),
  text_content:z.string().trim().min(10).max(20000),
});
const schema=z.object({item_id:z.string().uuid(),pages:z.array(pageSchema).min(1).max(5)});

export async function POST(req:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"No autenticado"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Páginas OCR no válidas"},{status:400});
  const {item_id,pages}=parsed.data;
  if(new Set(pages.map(p=>p.page_number)).size!==pages.length)
    return NextResponse.json({error:"Páginas duplicadas"},{status:400});
  const {data:item,error:lookupError}=await supabase.from("items")
    .select("id,user_id,type,file_url,metadata")
    .eq("id",item_id).eq("user_id",user.id).maybeSingle();
  if(lookupError||!item)return NextResponse.json({error:"Documento no encontrado"},{status:404});
  if(item.metadata?.extra===true||item.type!=="file"||!isOwnedPdfPath(item.file_url,user.id))
    return NextResponse.json({error:"Documento no autorizado"},{status:403});
  const maxPages=Number(item.metadata?.pdf_page_count);
  if(!Number.isInteger(maxPages)||maxPages<1||pages.some(p=>p.page_number>maxPages))
    return NextResponse.json({error:"Primero extrae el índice del PDF"},{status:400});
  const {error}=await supabase.from("pdf_pages").upsert(pages.map(p=>({
    ...p,item_id,user_id:user.id,extraction_method:"ocr",indexed_at:new Date().toISOString(),
  })),{onConflict:"item_id,page_number"});
  if(error)return NextResponse.json({error:"Error guardando el OCR"},{status:500});
  const {count}=await supabase.from("pdf_pages").select("page_number",{head:true,count:"exact"}).eq("item_id",item_id);
  const missing=Math.max(0,maxPages-(count??0));
  // El estado se actualiza en el servidor, preservando metadatos.
  await supabase.from("items").update({metadata:{...item.metadata,pdf_needs_ocr:missing}})
    .eq("id",item_id).eq("user_id",user.id);
  return NextResponse.json({saved:pages.length,remaining:missing});
}
