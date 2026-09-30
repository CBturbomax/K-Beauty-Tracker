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
export function addSeries(series:number[][]){return months.map((_,i)=>sum(series.map(s=>s[i]??0)));}
export function regionSeries(field='exp',mode='8권역'){const r:Record<string,number[]>={};for(const name of regions)r[name]=addSeries(trade.countries.filter((c:any)=>c.region===name).map((c:any)=>c[field]));if(mode==='4권역'){r['기타 지역']=addSeries(regions.slice(4).map(n=>r[n]));for(const n of regions.slice(4))delete r[n];}return r;}
export function rangeSlice<T>(a:T[],range:string,perYear:number){return range==='전체'?a:a.slice(-(range==='24개월'?2:Number(range[0]))*perYear);}
export function toRows(series:Record<string,(number|null)[]>,period='월',range='전체',growth=false):Row[]{
 const keys=Object.keys(series);let rows:Row[];
 if(period==='분기'){
  const buckets:Record<string,number[]>={};months.forEach((m,i)=>{const key=`${Math.ceil(Number(m.slice(4))/3)}Q${m.slice(2,4)}`;(buckets[key]??=[]).push(i)});
  rows=Object.entries(buckets).filter(([,idx])=>idx.length===3).map(([x,idx])=>({x,...Object.fromEntries(keys.map(k=>[k,idx.some(i=>series[k][i]==null)?null:sum(idx.map(i=>series[k][i]))/1000]))}));
 }else rows=months.map((m,i)=>({x:monthLabel(m),...Object.fromEntries(keys.map(k=>[k,series[k][i]==null?null:series[k][i]!/1000]))}));
 const lag=period==='분기'?4:12;
 if(growth)rows=rows.map((r,i)=>({x:r.x,...Object.fromEntries(keys.map(k=>[k,i<lag?null:yoy(r[k],rows[i-lag][k])]))})).slice(lag);
 return rangeSlice(rows,range,lag);
}
export function rolling(a:number[],window:number){return a.map((_,i)=>i<window-1?null:sum(a.slice(i-window+1,i+1)));}
export function quarter(date:string){return `${Math.ceil(Number(date.slice(5,7))/3)}Q${date.slice(2,4)}`;}
