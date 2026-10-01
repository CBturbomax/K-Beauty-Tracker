import {useState} from 'react';
import flash from '@/data/trade-flash.json';
import {number,monthLabel} from '@/lib/beauty';

export default function TradeFlash(){
 const [category,setCategory]=useState('화장품');
 const rows=flash.records.filter(r=>r.category===category);
 const growth=(n:number)=><span className={n>=0?'up':'down'}>{n>0?'+':''}{n}%</span>;
 return <section className="panel" aria-label="최신 월 공개 수출 집계">
  <div className="section-line"><h2>{monthLabel(flash.month)} 수출 · 주요국·품목</h2><a href={flash.sourceUrl} target="_blank" rel="noreferrer">원자료 ↗</a></div>
  <p className="small muted">9월 1~30일 전체월 · {flash.sourceLabel} · 단위 백만 달러</p>
  <div className="stats three">{flash.records.filter(r=>r.region==='전체').map(r=><div className="stat" key={r.category}><div className="stat-label">{r.category} 수출</div><div className="stat-value">{number(r.exportMillionUsd)}M</div><div className="stat-note">{growth(r.yoyPct)} 전년 동월 · {growth(r.momPct)} 전월</div></div>)}</div>
  <div className="toolbar" aria-label="최신 월 품목 선택">{['화장품','기초','색조'].map(c=><button className="link-button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)} style={category===c?{borderColor:'#FFCB05',color:'#FFCB05'}:{}}>{c}</button>)}</div>
  <div className="table-wrap"><table><thead><tr><th>국가·지역</th><th>26년 9월 수출</th><th>전년 동월 대비</th><th>전월 대비</th></tr></thead><tbody>{rows.map(r=><tr key={r.region}><th>{r.region}</th><td><strong title={`${r.exportMillionUsd.toFixed(1)} 백만 달러`}>{number(r.exportMillionUsd)}</strong></td><td>{growth(r.yoyPct)}</td><td>{growth(r.momPct)}</td></tr>)}</tbody></table></div>
  <p className="small muted">{flash.coverage}<br/>{flash.scope}<br/>공개 집계의 금액·증감률이며 일평균 수출이 아닙니다. 전체 국가의 HS 코드 대조가 완료되기 전까지 아래 장기 시계열과 별도로 표시합니다. {flash.precision}</p>
 </section>;
}
