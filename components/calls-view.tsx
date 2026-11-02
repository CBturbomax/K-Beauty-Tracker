import {Fragment,useMemo,useRef,useState} from 'react';
import {calls,quarter} from '@/lib/beauty';
import contexts from '@/data/call-context.json';
import frequency from '@/data/call-frequency.json';
import evidence from '@/data/call-evidence.json';

const latestCallDate=frequency.documents.map(d=>d.date).sort().at(-1)||'2024-01-01';
const quarterCount=Math.max(1,(Number(latestCallDate.slice(0,4))-2024)*4+Math.floor((Number(latestCallDate.slice(5,7))-1)/3)+1);
const quarters=Array.from({length:quarterCount},(_,i)=>`${i%4+1}Q${24+Math.floor(i/4)}`);
const highlightPattern=/(K[ -]?뷰티|K[ -]?beauty|한국(?:의|에서|과|·일본| 브랜드| 스킨케어| 메이크업| 제조업체| 공급업체| 공급| 제조| 시장)?|Korean(?: beauty)?|South Korea|Korea|메디큐브|Medicube|아누아|Anua|Inua|닥터자르트|Dr\.?\s?Jart\+?|Doctor\. Jart|닥터지|Dr\.?\s?G\b|피치앤릴리|Peach(?: &| and)? Lily|라네즈|Laneige|조선미녀|Beauty of Joseon|에스트라|Aestura|바이오던스|Biodance|에르보리안|Erborian|3CE|코스알엑스|CosRX|티르티르|TIRTIR|글래스 스킨|유리알 피부|glass skin)/gi;
function Highlight({text}:{text:string}){return <>{text.split(highlightPattern).map((t,i)=>i%2?<mark key={i}>{t}</mark>:<Fragment key={i}>{t}</Fragment>)}</>}
function Choice({value,options,onChange,label}:{value:string;options:string[];onChange:(v:string)=>void;label:string}){return <div className="calls-choices" role="group" aria-label={label}>{options.map(o=><button key={o} aria-pressed={o===value} onClick={()=>onChange(o)}>{o}</button>)}</div>}


type CallTheme = {title:string; lines:string[]; summary:string; quoteEn?:string; quoteKo?:string; secondQuoteEn?:string; secondQuoteKo?:string};
const callThemes:Record<string,CallTheme[]>={
 "eu-puig-20261028":[
  {title:"한국·일본 향수시장 규모와 성장 가능성",lines:["177","771","782"],quoteEn:"South Korea and Japan, they represent roughly the size of China",quoteKo:"한국과 일본을 합치면 대략 중국과 비슷한 규모입니다.",summary:"Puig는 한국·일본 향수 시장을 합하면 중국에 맞먹는 규모라고 평가했습니다. 소비자의 향수 사용 빈도가 늘면서 성장 기회가 커지고 있으며, 애널리스트는 이를 확대할 때 현지 조직과 유통업체 중 어떤 방식을 택할지 질문했습니다."},
  {title:"샬롯틸버리: 한국은 아직 미진출 시장",lines:["206","216","705"],quoteEn:"Japan, Korea, and Taiwan",quoteKo:"일본, 한국, 대만",summary:"샬롯틸버리는 중국에서 2025년 28%, 2026년 1~9월 38% 성장했다고 설명했습니다. 한국·일본은 아직 샬롯틸버리 미진출 지역으로, 회사는 현지법인을 기반으로 메이크업 유통을 확장할 여지를 보고 있습니다. 기존 한국 매출이 급증했다는 뜻은 아닙니다."},
  {title:"바이레도: 한국 순위와 브랜드 인지도",lines:["444","656","776"],quoteEn:"top two in Korea",quoteKo:"한국에서는 2위권입니다.",secondQuoteEn:"50% awareness in Korea",secondQuoteKo:"한국에서 인지도는 약 50%입니다.",summary:"바이레도를 한국에서 약 2위, 다른 발표에서는 5위권이라고 표현해 정확한 순위 기준은 통일되어 있지 않습니다. 회사는 한국에서 바이레도 인지도가 약 50%로 유럽 약 15%를 크게 웃돈다고 설명했습니다. 인지도 50%는 시장점유율 50%가 아닙니다."},
  {title:"한국 법인·니치 향수 유통망 확대",lines:["445","557","674","775"],summary:"Puig는 한국·일본에 현지법인을 두고 니치 향수와 메이크업 포트폴리오의 성장을 추진하고 있습니다. 펜할리곤스는 한국·일본에서 간접 유통망을 확대하고, 바이레도는 기존 한국 사업 기반을 강화한다는 계획입니다. 이 구간의 영어 원문은 대부분 한국이라는 단어뿐이어서 요약을 직접인용처럼 표시하지 않았습니다."}
 ],
 "eu-loreal-20261022":[
  {title:"한국 면세시장: 회복은 확인되지만 신중하게 접근",lines:["185"],quoteEn:"The Korean market was stable",quoteKo:"한국 시장은 안정적이었습니다.",summary:"하이난 면세점 매출은 긍정적이었지만 중국 본토는 재고를 보충하는 과정이었습니다. 로레알은 한국 면세시장도 안정적이라고 판단하면서 반등의 질이 확실치 않다며 공급량을 공격적으로 늘리지 않았습니다."},
  {title:"닥터지: 미국 온라인 진출과 해외 확장 가속",lines:["220","221","222","529","530"],quoteEn:"I have asked everybody to really gear up and go faster",quoteKo:"모두에게 속도를 높이고 더 빨리 추진하라고 지시했습니다.",summary:"닥터지는 중국과 동남아 진출에 이어 미국 온라인과 TikTok Shop을 통해 판매를 확대하고, 이후 오프라인으로 넓혀갈 계획입니다. CEO는 K뷰티의 빠른 확산을 보고 당초 점진적이던 닥터지 글로벌 진출 속도를 높이라고 지시했습니다. 동남아 성과가 서구권에서도 재현될지가 핵심입니다."},
  {title:"K뷰티 성장 전망·코스맥스와 MOU",lines:["486","525","526","527"],quoteEn:"I signed recently an MoU with Cosmax",quoteKo:"저는 최근 코스맥스와 업무협약을 체결했습니다.",summary:"애널리스트가 한국 스킨케어 매장 증가에 대한 로레알의 대응을 물었습니다. CEO는 K뷰티의 성장세를 인정하면서 한국 ODM 업체가 글로벌 브랜드도 제조한다고 설명했고, YSL 쿠션의 미국 성과를 사례로 들었습니다. 한국 스킨케어 브랜드 성장률 약 30%, 시장점유율 약 3~4%는 CEO의 추정치입니다."},
  {title:"3CE와 닥터지: 한국 브랜드 직접 육성",lines:["528"],summary:"로레알은 인수한 스타일난다의 3CE를 동남아시아에서 확대하고, 닥터지를 스킨케어 해외 확장의 주요 브랜드로 활용하고 있습니다. K뷰티에 대한 관심이 높아진 만큼 한국 브랜드를 직접 확보해 글로벌 유통망으로 키우는 전략입니다. 이 구간에는 길게 인용할 수 있는 독립적인 원문 문장이 확보돼 있지 않습니다."}
 ],
 "eu-puig-20261021":[
  {title:"K뷰티와 더마코스메틱이 고가 스킨케어를 잠식",lines:["294","295"],quoteEn:"So we see more accessible skincare with good levels of science background in both K-beauty and dermo-cosmetics",quoteKo:"그래서 K뷰티와 더마코스메틱 모두에서 과학적 근거를 갖추면서도 더 접근하기 쉬운 스킨케어 제품을 보고 있습니다.",summary:"CEO는 Circana 데이터를 인용해 미국 고가 스킨케어 시장이 2026년 8월 누계로 4.8% 감소했다고 설명했습니다. 합리적인 가격과 효능을 앞세운 K뷰티·더마코스메틱으로 수요가 이동하는 흐름이 미국을 넘어 전 세계에서 나타나고 있다고 평가했습니다."}
 ]
};


/** Distinguish short verbatim excerpts from fuller, non-verbatim English context. */
const englishCallContexts:Record<string,string>={
 "eu-puig-20261021:0":"Circana data cited by Puig show U.S. high-end skincare declining 4.8% year-to-date through August 2026. Management sees consumers turning to more accessible, science-led skincare, including K-beauty and dermo-cosmetics. This pattern extends beyond the U.S., and Puig expects dermo-cosmetics to grow faster than skincare overall.",
 "eu-puig-20261028:0":"Puig believes the combined fragrance markets of South Korea and Japan are comparable in size to China's fragrance market. Management expects scope for further growth, while an analyst asked how it would build local sales and distribution capabilities.",
 "eu-puig-20261028:1":"Charlotte Tilbury delivered strong growth in China, yet has not launched in Korea, Japan or Taiwan. Puig sees these countries as future makeup expansion opportunities, supported by local teams and already-growing niche fragrance brands.",
 "eu-puig-20261028:2":"Puig described Byredo as a major niche fragrance name in Korea and cited brand awareness of approximately 50% there versus roughly 15% in Europe. One speaker called its ranking top two, while another used top five; the ranking methodology was not specified.",
 "eu-puig-20261028:3":"Puig has established local subsidiaries in South Korea and Japan to support wider expansion. Penhaligon's plans to develop indirect distribution, while Byredo aims to strengthen its existing Korean position.",
 "eu-loreal-20261022:0":"L'Oréal described the Korean travel-retail market as stable but remained cautious about the quality of the recovery. Unlike stronger conditions in Hainan, management did not view Korea's improvement as sufficient reason to push more stock.",
 "eu-loreal-20261022:1":"Dr.G is expanding from China and Southeast Asia into the United States, first through online sales and later through physical stores. With K-beauty accelerating, L'Oréal's CEO instructed teams to move faster than the original gradual rollout plan.",
 "eu-loreal-20261022:2":"The CEO acknowledged the K-beauty boom and said Korean manufacturers also supply global brands, citing the success of YSL cushions in the U.S. He mentioned a recent agreement with Cosmax and estimated Korean brands' skincare growth at around 30%, with global skincare share around 3–4%.",
 "eu-loreal-20261022:3":"L'Oréal has acquired Korean beauty brands as part of its skincare and makeup expansion. 3CE is being rolled out successfully in Southeast Asia, while Dr.G forms part of the group's international skincare strategy."
};

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
    <div className="evidence-passages">{(()=>{
     const definitions=callThemes[d.id];
     const groups=definitions?definitions.map(g=>{
      const matches=g.lines.map(line=>d.segments.find((p:any)=>String(p.line)===line)).filter(Boolean);
      return {...g,matches,count:matches.reduce((sum:number,p:any)=>sum+p.count,0)};
     }):d.segments.map((p:any)=>({
      title:p.speaker&&p.speaker!=='경영진'?p.speaker:"원문 발언",
      lines:[String(p.line)],matches:[p],count:p.count,summary:p.context,
      quoteEn:p.en.trim().split(/\s+/).length>=4?p.en:undefined,
      quoteKo:p.en.trim().split(/\s+/).length>=4?p.ko:undefined
     }));
     return groups.map((g:any,j:number)=><section className="evidence-passage call-theme" key={d.id+"-"+j} data-passage-count={g.count}>
      <div className="evidence-passage-head">
       <span className="evidence-position">{String(j+1).padStart(2,'0')} · {g.title}</span>
       <b>{g.count}회</b>
      </div>
      <div className="call-theme-meta">검증 구간 {g.lines.length}개 · 공개 전사본 {g.lines.join(" · ")}행</div>
      {g.quoteEn&&<blockquote className="call-theme-quote">
       <span className="call-theme-quote-label">영어 원문 · 실제 발언에서 발췌</span>
       <p className="call-theme-quote-en call-theme-quote-featured" lang="en">“<Highlight text={g.quoteEn}/>”</p>
       {g.secondQuoteEn&&<p className="call-theme-quote-en call-theme-quote-featured call-theme-extra-quote" lang="en">“<Highlight text={g.secondQuoteEn}/>”</p>}
       <span className="call-theme-translation-label">한국어 번역</span>
       <p className="call-theme-quote-ko">“<Highlight text={g.quoteKo||""}/>”</p>
       {g.secondQuoteKo&&<p className="call-theme-quote-ko call-theme-extra-quote">“<Highlight text={g.secondQuoteKo}/>”</p>}
      </blockquote>}
      <div className="call-theme-english-context">
        <span className="call-theme-english-label">ENGLISH CONTEXT <small>원문 기반 설명 · 직접 인용 아님</small></span>
        <p lang="en"><Highlight text={englishCallContexts[d.id+":"+j]||g.matches.map((p:any)=>p.contextEn).filter(Boolean).slice(0,2).join(" ")||"Only a short reference was preserved. Please use the linked transcript for complete surrounding remarks."}/></p>
      </div>
      <div className="call-theme-summary"><span className="call-theme-summary-label">발언 전후 맥락 · 한국어 설명</span>
       <p><Highlight text={g.summary}/></p>
      </div>
      <details className="call-theme-source"><summary>근거 위치와 개별 표현 확인 ({g.matches.length}개 구간)</summary>
       <div className="call-theme-source-list">{g.matches.map((p:any)=><div key={p.id}>
        <span className="source-position">{p.location}</span>
        <span>{p.speaker||"전사본 화자 미상"}</span>
        <span>{p.count}회: {p.terms.map((t:any)=>t.term+" ×"+t.count).join(" · ")}</span>
       </div>)}</div>
       {d.url&&<a href={d.url} target="_blank" rel="noreferrer">전사본의 전체 문맥 확인 ↗</a>}
      </details>
     </section>)
    })()}</div>
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
