import type { SearchResultItem } from "./types";

type Candidate = Pick<SearchResultItem,"id"|"title"|"content"|"metadata"|"file_url"|"type">;
export type RankedCandidate<T extends Candidate> = { item:T; score:number; matched:string[] };

const stopwords = new Set(("a al algo algun algunos ante antes como con contra cual cuales cuando de del desde donde el ella ellas ellos en entre era es esa esas ese esos esta estas este esto estos fue ha han hacia hay la las le les lo los mas me mi mis muy ni no nos o os otra otros para pero por porque que quien quienes se ser si sin sobre son su sus te tener tengo tiene tienen todo todos tu tus un una uno unos unas y ya quiero dame dime explicar explicame busca buscar guardado guardada guardados guardadas informacion necesito saber muestra mostrarmelo saber texto nota enlace enlaces cosa cosas habia he has hice hacer podria puedes").split(" "));

function normalize(s:string):string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
}
function stem(term:string):string {
  if(term.length>5 && term.endsWith("es")) return term.slice(0,-2);
  if(term.length>4 && term.endsWith("s")) return term.slice(0,-1);
  return term;
}
export function queryTokens(query:string): string[] {
  return [...new Set(normalize(query).split(" ").filter((x)=>x.length>=2&&!stopwords.has(x)).map(stem))].slice(0,18);
}
const aliases:Record<string,string[]> = {
  ia:["inteligencia","artificial","ai","llm","modelo","agente","automatizacion"],
  inteligencia:["ia","artificial","ai","llm"],
  modelo:["model","llm","ia"],
  automatico:["automatizacion","automatizar","agente"],
  bar:["marbella","restaurante","cafeteria","tpv"],
  precio:["coste","costo","tarifa"],
  fotografia:["foto","imagen"],
  foto:["fotografia","imagen"],
  videos:["video","reel"],
  aprendizaje:["aprender","leccion"],
  disciplina:["habito","constancia","rutina"],
  programacion:["codigo","github","software","desarrollo"],
};
function searchableFields(item: Candidate) {
  const m=item.metadata||{};
  return {
    title:normalize([item.title,m.link_title].filter(Boolean).join(" ")),
    tags:normalize([...(m.tags??[]),...(m.themes??[])].join(" ")),
    summary:normalize([m.summary,m.link_description].filter(Boolean).join(" ")),
    content:normalize([item.content?.match(/^https?:\/\//)?"":item.content,m.raw_transcript].filter(Boolean).join(" ")),
  };
}
function hit(field:string, token:string):boolean {
  return field.split(" ").some((word)=>word===token || (token.length>=4 && word.startsWith(token)));
}

export function rankKnowledge<T extends Candidate>(
  query:string,
  candidates:T[],
  limit=14,
): RankedCandidate<T>[] {
  const terms=queryTokens(query);
  if(!terms.length) return [];
  const queryNorm=normalize(query);
  const ranked=candidates.map((item)=>{
    const fields=searchableFields(item);
    let score=0;
    const matched:string[]=[];
    for(const term of terms) {
      const checks:[string,number][]=[
        [fields.title,9],[fields.tags,8],[fields.summary,5],[fields.content,3],
      ];
      let highest=0;
      for(const [s,w] of checks) if(hit(s,term)) highest=Math.max(highest,w);
      if(!highest) {
        const synonyms=aliases[term]||[];
        for(const alias of synonyms) {
          for(const [s,w] of checks) if(hit(s,stem(alias))) highest=Math.max(highest,w*0.45);
        }
      }
      if(highest){score+=highest;matched.push(term);}
    }
    const coverage=matched.length / terms.length;
    score = score * (0.25+0.75*coverage);
    if(terms.length>1 && coverage>=0.999) score+=7;
    if(fields.title && queryNorm.length>4 && fields.title.includes(queryNorm)) score+=15;
    return {item,score:Math.round(score*100)/100,matched};
  }).filter((x)=>x.score>0);
  return ranked.sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(30,limit)));
}

export function questionNeedsContext(question:string): boolean {
  const q=normalize(question);
  return queryTokens(q).length<=1 || /^(y |pero |entonces |ese |esa |eso |lo anterior|tambien |ademas |por que|cuanto|cuales)/.test(q);
}
export function contextualizeQuestion(question:string, earlierUserQuestions:string[]):string {
  if(!questionNeedsContext(question) || !earlierUserQuestions.length) return question;
  return [earlierUserQuestions.at(-1),question].filter(Boolean).join(" ");
}

export function isOverviewQuestion(question:string):boolean {
  const q=normalize(question);
  return /^(que|cual|dime|resume|resumen|explica|muestra)/.test(q)
    && /(tengo guardado|hay en mi biblioteca|sabes de mi|contiene mi biblioteca|tengo en crack|mis notas|mi biblioteca en general|todo lo que)/.test(q);
}
export function sourceContext(item:Candidate, ordinal:number, maxChars=2700):string {
  const m=item.metadata??{};
  const url=item.file_url || item.content?.match(/^https?:\/\/\S+/)?.[0] || "";
  const isBareLink=!!url && (!item.content || !!item.content.trim().match(/^https?:\/\/\S+\s*$/));
  const text=[
    `FUENTE [${ordinal}]`,
    `Título: ${item.title||m.link_title||"Sin título"}`,
    `Tipo: ${isBareLink?"Enlace guardado; sin contenido de la página":item.type}`,
    `URL: ${url||"No disponible"}`,
    m.summary && `Resumen guardado: ${m.summary}`,
    m.link_description && `Descripción: ${m.link_description}`,
    m.tags?.length && `Etiquetas: ${m.tags.join(", ")}`,
    !isBareLink && item.content && `Texto guardado: ${item.content}`,
    m.raw_transcript && `Transcripción: ${m.raw_transcript}`,
  ].filter(Boolean).join("\n");
  return text.slice(0,maxChars);
}
