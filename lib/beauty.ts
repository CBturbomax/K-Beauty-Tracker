import tradeData from '@/data/trade.json';
import financialData from '@/data/financials.json';
import callData from '@/data/calls.json';
export const trade:any=tradeData, financials:any=financialData, calls:any=callData;
export type Row={x:string;[key:string]:any};
export const months:string[]=trade.meta.months;
export const regions:string[]=trade.meta.regions;
export const number=(n:number|null|undefined,d=0)=>n==null||!Number.isFinite(n)?'—':(Math.abs(n)<0.5?0:n).toLocaleString('ko-KR',{maximumFractionDigits:0,minimumFractionDigits:0});
export const pct=(n:number|null|undefined,d=0)=>n==null||!Number.isFinite(n)?'—':`${n>=0.5?'+':''}${number(n,d)}%`;
export const monthLabel=(s:string)=>`${s.slice(2,4)}년 ${Number(s.slice(4))}월`;
export const sum=(a:(number|null)[])=>a.reduce<number>((t,v)=>t+(v??0),0);
export const yoy=(v:number|null,p:number|null)=>v==null||p==null||p===0?null:(v/p-1)*100;
export type Series=(number|null)[];
export const completeSum=(a:(number|null|undefined)[]):number|null=>a.some(v=>v==null||!Number.isFinite(v))?null:sum(a as number[]);
export function addSeries(series:Series[]):Series{return months.map((_,i)=>completeSum(series.map(s=>s[i])));}
export function nationalSeries(field='exp'):Series{const fallback=addSeries(trade.countries.map((c:any)=>c[field]));return months.map((_,i)=>trade.national[field]?.[i]??fallback[i]);}
export function latestIndex(series:Series){return series.findLastIndex(v=>v!=null);}
export function completeCountryQuarter(field:string,region='전체'){for(let end=months.length;end>=3;end--){if(Number(months[end-1].slice(4))%3!==0)continue;const cs=trade.countries.filter((c:any)=>region==='전체'||c.region===region);if(cs.length&&cs.every((c:any)=>completeSum(c[field].slice(end-3,end))!=null))return end;}return 0;}

export function regionSeries(field='exp',mode='8권역'){const r:Record<string,Series>={};for(const name of regions){const fallback=addSeries(trade.countries.filter((c:any)=>c.region===name).map((c:any)=>c[field]));r[name]=months.map((_,i)=>trade.regional?.[field]?.[name]?.[i]??fallback[i]);}if(mode==='4권역'){r['기타 지역']=addSeries(regions.slice(4).map(n=>r[n]));for(const n of regions.slice(4))delete r[n];}return r;}
export function rangeSlice<T>(a:T[],range:string,perYear:number){return range==='전체'?a:a.slice(-(range==='24개월'?2:Number(range[0]))*perYear);}
export function toRows(series:Record<string,(number|null)[]>,period='월',range='전체',growth=false,basisStart?:string):Row[]{
 const keys=Object.keys(series);let rows:Row[];
 if(period==='분기'){
  const buckets:Record<string,number[]>={};months.forEach((m,i)=>{const key=`${Math.ceil(Number(m.slice(4))/3)}Q${m.slice(2,4)}`;(buckets[key]??=[]).push(i)});
  rows=Object.entries(buckets).filter(([,idx])=>idx.length===3).map(([x,idx])=>({x,...Object.fromEntries(keys.map(k=>[k,idx.some(i=>series[k][i]==null)?null:sum(idx.map(i=>series[k][i]))/1000]))}));
 }else rows=months.map((m,i)=>({x:monthLabel(m),...Object.fromEntries(keys.map(k=>[k,series[k][i]==null?null:series[k][i]!/1000]))}));
 const lag=period==='분기'?4:12;
 const basisLabel=basisStart?(period==='분기'?`${Math.ceil(Number(basisStart.slice(4))/3)}Q${basisStart.slice(2,4)}`:monthLabel(basisStart)):null;const basisIndex=basisLabel?rows.findIndex(r=>r.x===basisLabel):-1;
 if(growth)rows=rows.map((r,i)=>({x:r.x,...Object.fromEntries(keys.map(k=>[k,i<lag||(basisIndex>=0&&i>=basisIndex&&i-lag<basisIndex)?null:yoy(r[k],rows[i-lag][k])]))})).slice(lag);
 while(rows.length&&keys.every(k=>rows.at(-1)![k]==null))rows.pop();
 return rangeSlice(rows,range,lag);
}
export function rolling(a:Series,window:number):Series{return a.map((_,i)=>i<window-1?null:completeSum(a.slice(i-window+1,i+1)));}
export function quarter(date:string){return `${Math.ceil(Number(date.slice(5,7))/3)}Q${date.slice(2,4)}`;}
