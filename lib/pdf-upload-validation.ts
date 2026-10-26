/**
 * Distinguishes the original PDF bytes from an iOS "first-page preview".
 * Never label a JPEG/PNG snapshot as a multi-page PDF.
 */
export function pdfHeader(bytes:Uint8Array):boolean{
  const prefix=new TextDecoder().decode(bytes.subarray(0,Math.min(bytes.length,1024)));
  return prefix.includes("%PDF-");
}
export function pdfUploadKind(
  filename:string|undefined|null,
  mime:string|undefined|null,
  bytes:Uint8Array,
):{isPdf:boolean;extension:string;mime:string}{
  const name=(filename||"").trim();
  const ext=name.includes(".")?name.split(".").at(-1)!.toLowerCase():"";
  const isPdf=pdfHeader(bytes);
  if(ext==="pdf" && !isPdf){
    throw new Error(
      "Has compartido una vista previa o imagen de la primera página, no el PDF original. "+
      "En iPhone, usa Compartir → Guardar en Archivos y sube el documento desde Archivos."
    );
  }
  if(isPdf)return {isPdf:true,extension:"pdf",mime:"application/pdf"};
  return {isPdf:false,extension:ext||"bin",mime:mime||"application/octet-stream"};
}
