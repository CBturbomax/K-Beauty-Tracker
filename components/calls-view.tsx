import {Fragment,useMemo,useRef,useState} from 'react';
import {calls,quarter} from '@/lib/beauty';
import contexts from '@/data/call-context.json';
import frequency from '@/data/call-frequency.json';
import evidence from '@/data/call-evidence.json';

const quarters=Array.from({length:11},(_,i)=>`${i%4+1}Q${24+Math.floor(i/4)}`);
const highlightPattern=/(K[ -]?뷰티|K[ -]?beauty|한국(?:의|에서|과|·일본| 브랜드| 스킨케어| 메이크업| 제조업체| 공급업체| 공급| 제조| 시장)?|Korean(?: beauty)?|South Korea|Korea|메디큐브|Medicube|아누아|Anua|Inua|닥터자르트|Dr\.?\s?Jart\+?|Doctor\. Jart|닥터지|Dr\.?\s?G\b|피치앤릴리|Peach(?: &| and)? Lily|라네즈|Laneige|조선미녀|Beauty of Joseon|에스트라|Aestura|바이오던스|Biodance|에르보리안|Erborian|3CE|코스알엑스|CosRX|티르티르|TIRTIR|글래스 스킨|유리알 피부|glass skin)/gi;
function Highlight({text}:{text:string}){return <>{text.split(highlightPattern).map((t,i)=>i%2?<mark key={i}>{t}</mark>:<Fragment key={i}>{t}</Fragment>)}</>}
function Choice({value,options,onChange,label}:{value:string;options:string[];onChange:(v:string)=>void;label:string}){return <div className="calls-choices" role="group" aria-label={label}>{options.map(o=><button key={o} aria-pressed={o===value} onClick={()=>onChange(o)}>{o}</button>)}</div>}

export default function CallsView(){
 const [region,setRegion]=useState('전체'),[company,setCompany]=useState<string|null>(null),[period,setPeriod]=useState<string|null>(null),[search,setSearch]=useState('');
 const resultsRef=useRef<HTMLDivElement>(null);
 const indexed=useMemo(()=>calls.items.map((i:any,index:number)=>({...i,index,context:(contexts as any)[index]})),[]);
 const eligible=useMemo(()=>calls.companies.filter((c:any)=>region==='전체'||c.region.startsWith(region)).sort((a:any,b:any)=>{
  const last=(n:string)=>indexed.filter((i:any)=>i.company===n).map((i:any)=>i.date).sort().at(-1)||'';
  return last(b.name).localeCompare(last(a.name));
 }),[region,indexed]);
 const audited=useMemo(()=>evidence.map(d=>{const original=indexed.find((i:any)=>String(i.callId||'eu-'+i.index)===d.id);return {company:d.company,date:d.date,event:d.title,index:'evidence-'+d.id,headline:original?.headline||d.title,lines:[],evidence:d}}),[indexed]);
 const merged=[...audited,...indexed.filter((i:any)=>!evidence.some(d=>d.id===String(i.callId||'eu-'+i.index)))];
 const base=merged.filter((i:any)=>eligible.some((c:any)=>c.name===i.company));
 const items=base.filter((i:any)=>(!company||i.company===company)&&(!period||quarter(i.date)===period)&&(!search||[i.headline,i.company,...i.lines.map((l:any)=>l.ko),i.quote?.ko,i.context?.before,i.context?.after,i.evidence?.segments.map((s:any)=>[s.en,s.ko,s.context,...s.terms.map((t:any)=>t.term)].join(' ')).join(' ')].join(' ').toLowerCase().includes(search.toLowerCase()))).sort((a:any,b:any)=>b.date.localeCompare(a.date));
 const shownEvidence=items.filter((i:any)=>i.evidence),shownCount=shownEvidence.reduce((n:number,i:any)=>n+i.evidence.count,0),shownPassages=shownEvidence.reduce((n:number,i:any)=>n+i.evidence.segments.length,0);
 const selected=calls.companies.find((c:any)=>c.name===company);
 const select=(name:string,q:string|null=null)=>{if(company===name&&period===q){setCompany(null);setPeriod(null)}else{setCompany(name);setPeriod(q)}requestAnimationFrame(()=>resultsRef.current?.scrollIntoView({behavior:'smooth',block:'start'}))};
 const clear=()=>{setCompany(null);setPeriod(null);setSearch('')};
 return <div className="calls-view">

  <section className="calls-matrix-panel" aria-label="기업별 컨콜 선택">
   <div className="calls-matrix-heading"><div><h3 title="화장품·뷰티 맥락의 한국 브랜드·시장·생산·조달·면세 관련 발언만 집계">회사별 · 분기별 K뷰티 관련 언급</h3></div><Choice label="컨콜 지역" value={region} options={['전체','미국','유럽']} onChange={v=>{setRegion(v);clear()}}/><span>{eligible.length}개 기업 · 단위: 회</span></div>
   <div className="calls-matrix-scroll"><table className="calls-matrix"><thead><tr><th scope="col">회사</th>{quarters.map((q,j)=><th scope="col" key={q} className={j===quarters.length-1?'latest-quarter':undefined}>{q}</th>)}<th scope="col">합계</th><th scope="col" title="전체 원문 또는 확보한 발췌를 집계한 자료 수">자료</th></tr></thead><tbody>{eligible.map((c:any)=>{
    const docs=frequency.documents.filter(d=>d.company===c.name),complete=docs.filter(d=>d.status==='complete'||d.status==='excerpt');
    const counts=quarters.map(q=>{const all=docs.filter(d=>quarter(d.date)===q),ready=all.filter(d=>d.status==='complete'||d.status==='excerpt');return {n:ready.length?evidence.filter(d=>d.company===c.name&&quarter(d.date)===q).reduce((sum,d)=>sum+d.count,0):null,partial:ready.length>0&&ready.length<all.length,ready:ready.length,all:all.length}}),total=counts.reduce((sum,d)=>sum+(d.n||0),0),active=c.name===company;
    return <tr key={c.name} className={`${active?'is-selected':''} ${total===0?'no-mentions':''}`} onClick={()=>select(c.name)} tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();select(c.name)}}} aria-label={`${c.ko} 관련 언급 ${total}회${active?' 선택됨':''}`}>
     <th scope="row"><button title={c.ticker} aria-pressed={active} onClick={e=>{e.stopPropagation();select(c.name)}}><i className={c.type==='브랜드'?'brand-dot':'retail-dot'}/><strong>{c.ko}</strong>{active&&<b className="selection-check">✓</b>}</button></th>
     {counts.map(({n,partial,ready,all},j)=><td key={quarters[j]} className={`${n?'intensity-'+(n>=10?3:n>=3?2:1):''} ${j===quarters.length-1?'latest-quarter':''} ${active&&period===quarters[j]?'selected-quarter':''}`} title={`${quarters[j]} · 집계 원문 ${ready}/${all}건${partial?' · 일부 원문만 집계':''}`}><button aria-label={`${c.ko} ${quarters[j]} ${n===null?'미집계':n+'회'}${partial?' 일부 집계':''}`} aria-pressed={active&&period===quarters[j]} onClick={e=>{e.stopPropagation();select(c.name,quarters[j])}}>{n===null?<span className="missing-count">—</span>:(n||null)}</button></td>)}<td className="total">{complete.length?(total||null):'—'}</td><td className="checked-calls" title={`전체 조사 대상 ${docs.length}건 중 집계 원문 ${complete.length}건`}>{complete.length}/{docs.length}</td>
    </tr>
   })}</tbody></table></div>
   <div className="calls-matrix-key"><span><i className="retail-dot"/>리테일러</span><span><i className="brand-dot"/>브랜드</span><span className="heat-key"><i/>1–2 <i/>3–9 <i/>10+</span><span>확보 원문·발췌 기준 · — 자료 없음</span><span className="calls-select-hint">기업·숫자를 누르면 아래 인용 보기 ↓</span></div>
  </section>
  <div className="calls-results-head" ref={resultsRef} aria-live="polite"><div><span className="eyebrow">EARNINGS CALL NOTES</span><h3>{selected?selected.ko:'전체 기업'}{period&&<small> · {period}</small>} <b>{shownCount}회</b></h3><p>집계 자료 {shownEvidence.length}건 · 발언 {shownPassages}개 구간 · <mark>아래 발언별 횟수의 합계</mark></p></div><div className="calls-result-controls"><input type="search" value={search} onChange={e=>setSearch(e.target.value)} aria-label="컨콜 내용 검색" placeholder="브랜드·발언 검색"/>{(company||period||search)&&<button className="calls-reset" onClick={clear}>전체 기업 보기 ×</button>}</div></div>
  <div className="calls-reading-list">{items.length===0?<div className="calls-empty">선택한 조건에서 집계할 화장품·뷰티 관련 발언이 없습니다.<button onClick={clear}>조건 초기화</button></div>:items.map((i:any)=>{
   const c=calls.companies.find((c:any)=>c.name===i.company),q=i.quote,ctx=i.context;
   if(i.evidence){const d=i.evidence;return <article className="call-note call-evidence-note" key={d.id} data-source-id={d.id} data-mention-count={d.count}>
    <div className="call-note-top"><button className="call-company" onClick={()=>select(i.company)}><i className={c.type==='브랜드'?'brand-dot':'retail-dot'}/>{c.ko}<span>{c.ticker}</span></button><time dateTime={d.date}>{d.date}</time><b className="evidence-call-total">{d.count}회</b></div>
    <div className="call-event">{d.title}</div><div className="evidence-source">출처: {d.source} · {d.coverage}{d.callId?` · 콜 ${d.callId}`:''}{d.url&&<> · <a href={d.url} target="_blank" rel="noreferrer">전체 원문 ↗</a></>}</div>
    <div className="evidence-passages">{d.segments.map((p:any,j:number)=><section className="evidence-passage" key={p.id} data-passage-count={p.count}>
     <div className="evidence-passage-head"><span className="evidence-position">{String(j+1).padStart(2,'0')} · {p.location}</span><b>{p.count}회 <span>{p.terms.map((t:any)=>`${t.term} ×${t.count}`).join(' · ')}</span></b></div>
     <p className="evidence-context"><span>맥락 요약</span> <Highlight text={p.context}/></p>
     <blockquote className="evidence-quote"><div><span className="evidence-label">원문 발췌</span><p lang="en">“<Highlight text={p.en}/>”</p></div><div><span className="evidence-label">한글 번역</span><p>“<Highlight text={p.ko}/>”</p></div></blockquote>
    </section>)}</div>
   </article>}
   return <article className="call-note" key={`${i.company}-${i.date}-${i.index}`}>
    <div className="call-note-top"><button className="call-company" onClick={()=>select(i.company)}><i className={c.type==='브랜드'?'brand-dot':'retail-dot'}/>{c.ko}<span>{c.ticker}</span></button><time dateTime={i.date}>{i.date}</time></div>
    <div className="call-event">{i.event}<span>참고 인용 · 횟수 집계에 포함하지 않음</span>{q?.role==='analyst'&&<span>애널리스트 질문</span>}{q?.verification==='secondary'&&<span>전사본 대조 미완료</span>}{i.index===9&&<span>출처 날짜 재확인 필요 · 횟수 제외</span>}</div>
    <h4>{i.headline}</h4><div className="call-topic-tags">{i.tags?.map((t:string)=><span key={t}>{t}</span>)}</div>
    <div className="call-reading"><div className="context-label">발언의 전후 맥락 <span>요약</span></div>{ctx?.before&&<p className="context-copy"><Highlight text={ctx.before}/></p>}
     {q&&<blockquote className="call-excerpt"><span>{q.role==='analyst'?'질문':'핵심 발언'} · 번역 인용</span><p>“<Highlight text={q.ko}/>”</p><p className="original-excerpt" lang="en">“<Highlight text={q.en}/>”</p></blockquote>}
     {ctx?.after&&<p className="context-copy"><Highlight text={ctx.after}/></p>}
     {!ctx&&i.lines.map((l:any,j:number)=><p className="context-copy" key={j}><Highlight text={l.ko||''}/></p>)}
    </div>
    <div className="call-note-bottom"><div className="call-citation">{q&&<><p className="citation-detail">{q.source}{q.timestamp&&` · ${q.timestamp}`} · 짧은 발췌 / 전후 맥락은 요약</p>{q.url&&<a href={q.url} target="_blank" rel="noreferrer">{q.verification==='secondary'?'참고 대시보드':'전체 전사본'} ↗</a>}</>}{i.url&&i.url!==q?.url&&<a href={i.url} target="_blank" rel="noreferrer">원문 링크 ↗</a>}</div><span>{quarter(i.date)}</span></div>
   </article>
  })}</div><p className="calls-source-note">횟수는 확보한 원문과 발췌에서 한국·한국 브랜드·K뷰티 관련 표현이 등장한 횟수입니다. 화장품·뷰티 사업에 연결되는 한국 시장·생산·조달·면세·경쟁과 질문을 포함합니다. 같은 발언의 반복 표현과 브랜드명도 각각 셉니다. 화장품과 무관한 일반 매장 출점·회원 수·환율 가정과 한국 관련성이 없는 발언은 제외하며, 자동 번역 병기는 중복 집계하지 않습니다. 표의 숫자는 아래 발언별 횟수와 일치합니다. 짧은 원문 발췌와 번역을 함께 표시하며 …는 중간 생략입니다. 시간 정보가 없는 전사본은 수집 원문의 행 위치와 출처 링크를 표시합니다. 기존 참고 인용 중 집계에 포함하지 않은 것은 별도로 명시합니다. 전후 맥락은 발언 내용을 풀어쓴 요약이며, 자동전사에는 고유명사 오류가 있을 수 있습니다.</p>
 </div>
}
