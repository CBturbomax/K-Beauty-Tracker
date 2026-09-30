import {Fragment,useMemo,useRef,useState} from 'react';
import {calls,quarter} from '@/lib/beauty';
import contexts from '@/data/call-context.json';

const quarters=Array.from({length:11},(_,i)=>`${i%4+1}Q${24+Math.floor(i/4)}`);
const highlightPattern=/(K[ -]?뷰티|K[ -]?beauty|한국(?:의|에서|과|·일본| 브랜드| 스킨케어| 메이크업| 제조업체| 공급업체| 공급| 제조| 시장)?|Korean(?: beauty)?|South Korea|Korea|메디큐브|Medicube|아누아|Anua|Inua|닥터자르트|Dr\.?\s?Jart\+?|Doctor\. Jart|닥터지|Dr\.?\s?G\b|피치앤릴리|Peach(?: &| and)? Lily|라네즈|Laneige|조선미녀|Beauty of Joseon|에스트라|Aestura|바이오던스|Biodance|에르보리안|Erborian|3CE|코스알엑스|CosRX|티르티르|TIRTIR|글래스 스킨|유리알 피부|glass skin)/gi;
function Highlight({text}:{text:string}){return <>{text.split(highlightPattern).map((t,i)=>i%2?<mark key={i}>{t}</mark>:<Fragment key={i}>{t}</Fragment>)}</>}
function Choice({value,options,onChange,label}:{value:string;options:string[];onChange:(v:string)=>void;label:string}){return <div className="calls-choices" role="group" aria-label={label}>{options.map(o=><button key={o} aria-pressed={o===value} onClick={()=>onChange(o)}>{o}</button>)}</div>}

export default function CallsView(){
 const [region,setRegion]=useState('전체'),[tag,setTag]=useState('전체'),[company,setCompany]=useState<string|null>(null),[period,setPeriod]=useState<string|null>(null),[search,setSearch]=useState('');
 const resultsRef=useRef<HTMLDivElement>(null);
 const indexed=useMemo(()=>calls.items.map((i:any,index:number)=>({...i,index,context:(contexts as any)[index]})),[]);
 const eligible=useMemo(()=>calls.companies.filter((c:any)=>region==='전체'||c.region.startsWith(region)).sort((a:any,b:any)=>{
  const last=(n:string)=>indexed.filter((i:any)=>i.company===n).map((i:any)=>i.date).sort().at(-1)||'';
  return last(b.name).localeCompare(last(a.name));
 }),[region,indexed]);
 const base=indexed.filter((i:any)=>eligible.some((c:any)=>c.name===i.company)&&(tag==='전체'||i.tags?.includes(tag)));
 const items=base.filter((i:any)=>(!company||i.company===company)&&(!period||quarter(i.date)===period)&&(!search||[i.headline,i.company,...i.lines.map((l:any)=>l.ko),i.quote?.ko,i.context?.before,i.context?.after].join(' ').toLowerCase().includes(search.toLowerCase()))).sort((a:any,b:any)=>b.date.localeCompare(a.date));
 const selected=calls.companies.find((c:any)=>c.name===company);
 const select=(name:string,q:string|null=null)=>{if(company===name&&period===q){setCompany(null);setPeriod(null)}else{setCompany(name);setPeriod(q)}requestAnimationFrame(()=>resultsRef.current?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const clear=()=>{setCompany(null);setPeriod(null);setSearch('')};
 return <div className="calls-view">
  <div className="calls-toolbar"><Choice label="컨콜 지역" value={region} options={['전체','미국','유럽']} onChange={v=>{setRegion(v);clear()}}/><Choice label="컨콜 주제" value={tag} options={['전체','성과','입점','경쟁','생산','인수·보유']} onChange={setTag}/></div>
  <section className="calls-matrix-panel" aria-label="기업별 컨콜 선택">
   <div className="calls-matrix-heading"><div><h3>회사별 · 분기별 언급 횟수</h3><p>회사 행을 누르면 그 기업만 · 숫자를 누르면 해당 분기까지</p></div><span>{base.length}건 / {eligible.length}개사</span></div>
   <div className="calls-matrix-scroll"><table className="calls-matrix"><thead><tr><th scope="col">회사</th>{quarters.map(q=><th scope="col" key={q}>{q}</th>)}<th scope="col">합계</th><th scope="col">확인 콜</th></tr></thead><tbody>{eligible.map((c:any)=>{
    const counts=quarters.map(q=>base.filter((i:any)=>i.company===c.name&&quarter(i.date)===q).length),total=counts.reduce((a,b)=>a+b,0),active=c.name===company;
    return <tr key={c.name} className={`${active?'is-selected':''} ${total===0?'no-mentions':''}`} onClick={()=>select(c.name)} tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();select(c.name)}}} aria-label={`${c.ko} 컨콜 ${total}건${active?' 선택됨':''}`}>
     <th scope="row"><button aria-pressed={active} onClick={e=>{e.stopPropagation();select(c.name)}}><i className={c.type==='브랜드'?'brand-dot':'retail-dot'}/><strong>{c.ko}</strong><span>{c.ticker}</span>{active&&<b className="selection-check">✓</b>}</button></th>
     {counts.map((n,j)=><td key={quarters[j]} className={`${n?'intensity-'+Math.min(n,3):''} ${active&&period===quarters[j]?'selected-quarter':''}`}>{n?<button aria-label={`${c.ko} ${quarters[j]} ${n}건`} aria-pressed={active&&period===quarters[j]} onClick={e=>{e.stopPropagation();select(c.name,quarters[j])}}>{n}</button>:<span>·</span>}</td>)}<td className="total">{total}</td><td className="checked-calls">{c.checked}</td>
    </tr>
   })}</tbody></table></div>
   <div className="calls-matrix-key"><span><i className="retail-dot"/>리테일러</span><span><i className="brand-dot"/>브랜드</span><span className="heat-key"><i/>1회 <i/>2회 <i/>3회+</span><span>· 원본 조사에서 언급 없음 또는 해당 분기 콜 없음</span></div>
  </section>
  <div className="calls-results-head" ref={resultsRef} aria-live="polite"><div><span className="eyebrow">EARNINGS CALL NOTES</span><h3>{selected?selected.ko:'전체 기업'}{period&&<small> · {period}</small>} <b>{items.length}</b></h3><p>전후 맥락은 한국어 요약 · 따옴표는 실제 발언 번역 · <mark>K뷰티 관련 내용 강조</mark></p></div><div className="calls-result-controls"><input type="search" value={search} onChange={e=>setSearch(e.target.value)} aria-label="컨콜 내용 검색" placeholder="브랜드·발언 검색"/>{(company||period||search)&&<button className="calls-reset" onClick={clear}>전체 기업 보기 ×</button>}</div></div>
  <div className="calls-reading-list">{items.length===0?<div className="calls-empty">선택한 조건의 컨콜이 없습니다.<button onClick={()=>{clear();setTag('전체')}}>조건 초기화</button></div>:items.map((i:any)=>{
   const c=calls.companies.find((c:any)=>c.name===i.company),q=i.quote,ctx=i.context;
   return <article className="call-note" key={`${i.company}-${i.date}-${i.index}`}>
    <div className="call-note-top"><button className="call-company" onClick={()=>select(i.company)}><i className={c.type==='브랜드'?'brand-dot':'retail-dot'}/>{c.ko}<span>{c.ticker}</span></button><time dateTime={i.date}>{i.date}</time></div>
    <div className="call-event">{i.event}{q?.role==='analyst'&&<span>애널리스트 질문</span>}{q?.verification==='secondary'&&<span>전사본 대조 미완료</span>}</div>
    <h4>{i.headline}</h4><div className="call-topic-tags">{i.tags?.map((t:string)=><button key={t} onClick={()=>setTag(t)}>{t}</button>)}</div>
    <div className="call-reading"><div className="context-label">발언의 전후 맥락 <span>요약</span></div>{ctx?.before&&<p className="context-copy"><Highlight text={ctx.before}/></p>}
     {q&&<blockquote className="call-excerpt"><span>{q.role==='analyst'?'질문':'핵심 발언'} · 번역 인용</span><p>“<Highlight text={q.ko}/>”</p></blockquote>}
     {ctx?.after&&<p className="context-copy"><Highlight text={ctx.after}/></p>}
     {!ctx&&i.lines.map((l:any,j:number)=><p className="context-copy" key={j}><Highlight text={l.ko||''}/></p>)}
    </div>
    <div className="call-note-bottom"><details><summary>영문 인용 · 출처</summary>{q&&<><p className="original-excerpt" lang="en">“<Highlight text={q.en}/>”</p><p className="citation-detail">{q.source}{q.timestamp&&` · ${q.timestamp}`} · 짧은 발췌 / 전후 맥락은 요약</p>{q.url&&<a href={q.url} target="_blank" rel="noreferrer">{q.verification==='secondary'?'참고 대시보드':'전체 전사본'} ↗</a>}</>}{i.url&&i.url!==q?.url&&<a href={i.url} target="_blank" rel="noreferrer">원문 링크 ↗</a>}</details><span>{quarter(i.date)}</span></div>
   </article>
  })}</div><p className="calls-source-note">51건의 조사 대상과 분류는 참고 대시보드 기준입니다. 49건은 전사본 대조, 2건은 참고 대시보드 수록 인용입니다. 전후 맥락은 발언 내용을 풀어쓴 요약이며, 자동전사에는 고유명사 오류가 있을 수 있습니다.</p>
 </div>
}
