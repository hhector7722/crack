import { strict as assert } from "node:assert";
import { test } from "node:test";
import { contextualizeQuestion, isOverviewQuestion, queryTokens, rankKnowledge, sourceContext } from "./knowledge-retrieval.ts";
import { compactCatalog, parseCatalogIndices, semanticCatalogRerank } from "./knowledge-llm-retrieval.ts";

const item=(id,title,summary,content="https://example.org/")=>({
 id, type:"note",title,content,file_url:null,metadata:{summary},pinned:false,pinned_order:null,
 created_at:"2026-10-25T00:00:00Z",last_opened_at:null,user_id:"owner",score:0,search_source:"fts",
});

test("terminos españoles sin stopwords con acentos y plurales",()=>{
  assert.deepEqual(queryTokens("¿Qué he aprendido sobre mis hábitos y disciplina?"),["aprendido","habito","disciplina"]);
});

test("rankea primero notas relacionadas, no las más recientes",()=>{
  const pool=[
    item("newest","Viaje a Madrid","Lugares del hotel"),
    item("hit","Consejos para mantener hábitos","Disciplina, constancia y rutinas diarias"),
    item("weak","Cómo programar un servidor","Tutorial de un miniPC"),
  ];
  const res=rankKnowledge("¿Qué he aprendido sobre disciplina y hábitos?",pool);
  assert.equal(res[0].item.id,"hit");
  assert.equal(res.length,1);
});

test("los sinónimos relacionan preguntas aunque difieran las palabras",()=>{
  const docs=[
    item("ai","Herramientas de inteligencia artificial","Tutoriales para agentes LLM gratuitos"),
    item("travel","Viajes","Lugares"),
  ];
  const a=rankKnowledge("¿Qué herramientas de IA tengo guardadas?",docs);
  assert.equal(a[0].item.id,"ai");
});

test("contextualiza preguntas de seguimiento sin olvidar la pregunta anterior",()=>{
  assert.equal(contextualizeQuestion("¿Y cómo funciona?",["Háblame de CopilotKit"]),
    "Háblame de CopilotKit ¿Y cómo funciona?");
  assert.equal(contextualizeQuestion("¿Qué guardé sobre OCR?",["CopilotKit"]),
    "¿Qué guardé sobre OCR?");
});

test("lista de biblioteca se detecta como pregunta global",()=>{
  assert.equal(isOverviewQuestion("¿Qué tengo guardado en mi biblioteca?"),true);
  assert.equal(isOverviewQuestion("¿Qué hace Groq?"),false);
});

test("los enlaces no se confunden con el contenido de la página",()=>{
  const src=sourceContext(item("link","Herramienta A","Resumen guardado de A"),1);
  assert.match(src,/Enlace guardado; sin contenido de la página/);
  assert.doesNotMatch(src,/Texto guardado:/);
  assert.match(src,/Resumen guardado:/);
});

test("parser rechaza índices de herramientas inventadas o fuera de rango",()=>{
  assert.deepEqual(parseCatalogIndices('{"indices":[3,3,1,100,-1,"7"]}',4),[2,0]);
  assert.deepEqual(parseCatalogIndices("Texto no JSON",4),[]);
});

test("reranking usa Groq gratuito y no procesa URL de la página",async()=>{
  const candidates=[
    item("1","Redes sociales","Marketing"),item("2","Recetas","Cocina"),
    item("3","Notas de Ollama","Modelos locales"),
  ];
  let capturedBody=null;
  const fake=async(_url,options)=>{
    capturedBody=JSON.parse(String(options?.body));
    return new Response(JSON.stringify({choices:[{message:{content:"[3, 2]"}}]}),{status:200});
  };
  const matches=await semanticCatalogRerank("¿Qué usé para IA local?",candidates,"test",fake);
  assert.deepEqual(matches,[2,1]);
  assert.equal(capturedBody?.model,"openai/gpt-oss-120b");
  assert.doesNotMatch(compactCatalog(candidates),/https:\/\/example.org/);
});
