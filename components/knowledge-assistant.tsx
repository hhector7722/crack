"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, FileSearch, Loader2, MessageCircle, SearchCheck, Send, Sparkles } from "lucide-react";
import { indexExistingPdfs } from "@/lib/pdf-index-client";
import { createClient } from "@/lib/supabase/client";
import type { SearchResultItem } from "@/lib/types";

type AnswerSource = { number:number; item:SearchResultItem; url:string|null; page_number?:number };
type AnswerResponse = { answer?:string; error?:string; sources?:AnswerSource[]; mode?:string };
type Turn = { question:string; answer:string; sources:AnswerSource[] };

export function KnowledgeAssistant({
  query,
  onSelect,
}: {
  query:string;
  onSelect:(item:SearchResultItem)=>void;
}) {
  const [turns,setTurns]=useState<Turn[]>([]);
  const [followUp,setFollowUp]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [asking,setAsking]=useState(false);
  const [indexing,setIndexing]=useState(false);
  const [indexed,setIndexed]=useState<number|null>(null);
  const [pdfIndexing,setPdfIndexing]=useState(false);
  const [pdfProgress,setPdfProgress]=useState<string|null>(null);
  const [canIndex,setCanIndex]=useState(false);
  const controller=useRef<AbortController|null>(null);

  useEffect(()=>{
    controller.current?.abort();
    setTurns([]);
    setFollowUp("");
    setError(null);
    setAsking(false);
  },[query]);
  useEffect(()=>()=>controller.current?.abort(),[]);
  useEffect(()=>{
    const abort=new AbortController();
    void fetch("/api/knowledge/capabilities",{signal:abort.signal})
      .then(response=>response.ok?response.json():null)
      .then(data=>{if(!abort.signal.aborted)setCanIndex(data?.can_index===true);})
      .catch(()=>{});
    return ()=>abort.abort();
  },[]);

  async function ask(text:string) {
    const question=text.trim();
    if(question.length<2 || asking) return;
    controller.current?.abort();
    const next=new AbortController();
    controller.current=next;
    setError(null);
    setAsking(true);
    const history=turns.slice(-4).flatMap(t=>[
      {role:"user",content:t.question},
      {role:"assistant",content:t.answer.slice(0,1300)},
    ]);
    try {
      const response=await fetch("/api/knowledge/ask",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question,history}),
        signal:next.signal,
      });
      const data=await response.json() as AnswerResponse;
      if(!next.signal.aborted){
        if(!response.ok) setError(data.error??"No se ha podido consultar tu biblioteca.");
        else {
          setTurns(prev=>[...prev,{question,answer:data.answer??"Sin respuesta.",sources:data.sources??[]}].slice(-8));
          setFollowUp("");
        }
      }
    }catch{
      if(!next.signal.aborted) setError("No se ha podido conectar con el asistente.");
    }finally {
      if(!next.signal.aborted) setAsking(false);
    }
  }

  async function indexPdfs(){
    if(pdfIndexing)return;
    setPdfIndexing(true);setPdfProgress("Buscando archivos PDF…");setError(null);
    try{await indexExistingPdfs(message=>setPdfProgress(message));}
    catch(e){setError(e instanceof Error?e.message:"Error indexando PDF");}
    finally{setPdfIndexing(false);}
  }

  async function openSource(source:AnswerSource){
    if(!source.page_number||!source.item.file_url){onSelect(source.item);return;}
    // Se abre en un nuevo visor PDF directamente por página.
    const popup=window.open("about:blank","_blank");
    if(popup)popup.opener=null;
    try{
      const supabase=createClient();
      const {data,error}=await supabase.storage.from("crack-files")
        .createSignedUrl(source.item.file_url,900);
      if(error||!data?.signedUrl)throw new Error("No se pudo abrir el PDF");
      const url=data.signedUrl+`#page=${source.page_number}`;
      if(popup)popup.location.href=url;
      else window.location.assign(url);
    }catch(e){popup?.close();setError(e instanceof Error?e.message:"Error abriendo PDF");}
  }

  async function indexLibrary() {
    if(indexing) return;
    setIndexing(true);
    setIndexed(0);
    setError(null);
    let total=0;
    try{
      for(let batch=0;batch<15;batch++){
        const response=await fetch("/api/backfill",{method:"POST"});
        const data=await response.json() as {indexed?:number;has_more?:boolean;error?:string};
        if(!response.ok || data.error) {
          setError(data.error??"No se pudo indexar la biblioteca.");
          break;
        }
        total+=data.indexed??0;
        setIndexed(total);
        if(!data.has_more) break;
      }
    }catch{
      setError("Error de conexión durante la indexación.");
    }finally{setIndexing(false);}
  }

  return (
    <div className="border-b border-zinc-800/60 px-4 py-3">
      {query.trim().length>=2 && turns.length===0 ? (
        <button type="button" disabled={asking}
          onClick={()=>void ask(query)}
          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition-colors active:bg-zinc-300 disabled:opacity-60">
          {asking?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}
          {asking?"Consultando notas y enlaces…":"Preguntar a mi biblioteca"}
        </button>
      ):query.trim().length<2 ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">Busca enlaces o pregunta a tu biblioteca.</span>
          <div className="flex items-center gap-3">
            <button type="button" disabled={pdfIndexing} onClick={()=>void indexPdfs()}
              className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-300 underline-offset-2 hover:underline disabled:opacity-50">
              {pdfIndexing?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<FileSearch className="h-3.5 w-3.5"/>}
              {pdfIndexing?"Leyendo…":"Leer PDFs"}
            </button>
          {canIndex && <button type="button" disabled={indexing} onClick={()=>void indexLibrary()}
            className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400 underline-offset-2 hover:underline disabled:opacity-50">
            {indexing?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<SearchCheck className="h-3.5 w-3.5"/>}
            {indexing?"Indexando…":"Indexar"}
          </button>}
          </div>
        </div>
      ):null}
      {pdfProgress && <p className="mt-2 text-xs text-zinc-400" role="status">{pdfProgress}</p>}
      {indexed!==null && !indexing && (
        <p className="mt-2 text-xs text-zinc-500">{indexed} elementos indexados en esta operación.</p>
      )}
      {error && <p role="alert" className="mt-3 text-sm leading-relaxed text-amber-300">{error}</p>}
      {turns.length>0 && (
        <div className="mt-3 space-y-4">
          {turns.map((turn,i)=>(
            <div className="space-y-2" key={i}>
              <div className="flex items-start gap-2 text-xs font-semibold text-zinc-300">
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
                <span className="break-words">{turn.question}</span>
              </div>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-zinc-800/70 px-3 py-3 text-sm leading-relaxed text-zinc-200">
                {turn.answer}
              </p>
              {turn.sources.length>0 && (
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <BookOpen className="h-3.5 w-3.5"/> Fuentes de tu biblioteca
                  </p>
                  {turn.sources.map(source=>(
                    <button key={source.item.id+"-"+(source.page_number??"note")} type="button"
                      onClick={()=>void openSource(source)}
                      className="flex w-full min-h-9 items-center gap-2 rounded-lg px-2 text-left text-xs text-zinc-300 hover:bg-zinc-800">
                      <span className="shrink-0 text-zinc-500">[{source.number}]</span>
                      <span className="min-w-0 truncate">{source.item.title||source.url||"Elemento guardado"}
                        {source.page_number ? ` · PDF pág. ${source.page_number}` : ""}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <form className="flex items-center gap-2 border-t border-zinc-800 pt-3"
            onSubmit={e=>{e.preventDefault();void ask(followUp);}}>
            <input type="text" value={followUp} onChange={e=>setFollowUp(e.target.value)}
              maxLength={550} placeholder="Haz otra pregunta sobre tus notas…"
              aria-label="Pregunta de seguimiento"
              className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"/>
            <button type="submit" disabled={asking||followUp.trim().length<2}
              aria-label="Enviar pregunta" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 disabled:opacity-50">
              {asking?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
