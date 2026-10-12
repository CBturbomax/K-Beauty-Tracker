// Focused regression checks for partial monthly releases and source boundaries.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const read=name=>JSON.parse(readFileSync(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const trade=read('trade');
const compiled=ts.transpileModule(readFileSync(new URL('../lib/beauty.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const exports={};runInNewContext(compiled,{exports,require:path=>read(path.split('/').at(-1).replace('.json',''))});
const {months,addSeries,completeSum,rolling,regionSeries,nationalSeries,latestIndex,completeCountryQuarter,toRows}=exports;
const sept=months.indexOf('202609');assert.ok(sept>=0);
assert.equal(completeSum([1,null,2]),null);assert.equal(completeSum([1,0,2]),3);
assert.equal(addSeries([[1],[null]])[0],null);assert.equal(rolling([1,null,3],3)[2],null);
assert.equal(nationalSeries('exp')[sept],1213010);
assert.equal(months[latestIndex(nationalSeries('imp'))],'202608');
assert.equal(months[completeCountryQuarter('exp')-1],'202606');
assert.equal(months[completeCountryQuarter('imp')-1],'202606');
const regional=regionSeries('exp');
for(const region of trade.meta.regions){assert.equal(regional[region][sept],trade.regional.exp[region][sept]);assert.ok(regional[region][sept]>0);}
const monthly=toRows(regional,'월');assert.equal(monthly.at(-1).x,'26년 9월');
const quarterly=toRows(regional,'분기');assert.equal(quarterly.at(-1).x,'3Q26');
for(const region of trade.meta.regions)assert.equal(quarterly.at(-1)[region],completeSum(regional[region].slice(sept-2,sept+1))/1000);
const total=nationalSeries('exp');
const growth=toRows({...regional,전체:total},'월','전체',true,trade.meta.regionalBasisStart);
for(const name of ['북미','전체']){assert.equal(growth.find(r=>r.x==='24년 10월')[name],null);assert.equal(growth.find(r=>r.x==='25년 9월')[name],null);assert.notEqual(growth.find(r=>r.x==='25년 10월')[name],null);}
const quarterGrowth=toRows({...regional,전체:total},'분기','전체',true,trade.meta.regionalBasisStart);assert.equal(quarterGrowth.find(r=>r.x==='3Q25').전체,null);assert.notEqual(quarterGrowth.find(r=>r.x==='4Q25').전체,null);
assert.equal(toRows({수입:nationalSeries('imp')},'월').at(-1).x,'26년 8월');
for(const group of trade.meta.g2){const values=trade.grouped.exp[group];assert.equal(values.length,months.length);assert.ok(values[sept]>0);assert.notEqual(rolling(values,3)[sept],null);}
assert.ok(Math.abs(completeSum(Object.values(trade.grouped.exp).map(a=>a[sept]))-total[sept])<=4000);
assert.equal(addSeries(trade.countries.map(c=>c.exp))[sept],null);
console.log('Trade regressions passed: September regions/3Q26, nullable sums, imports August, complete country ranking 2Q26, methodology boundary, regional shares.');
// Archived pairs restore the gap without comparing revised and legacy amounts.
const legacy=read('trade-yoy-legacy');
for(const group of ['regional','categories']){
 const archived=Object.fromEntries(Object.entries(legacy[group]).map(([k,a])=>[k,months.map(m=>a[legacy.months.indexOf(m)]??null)]));
 const current=group==='regional'?{...regional,전체:total}:{...trade.national.cat,전체:total};
 for(const period of ['월','분기']){
  const restored=toRows(current,period,'전체',true,trade.meta.regionalBasisStart,archived);
  const old=toRows(archived,period,'전체',true);
  const labels=period==='월'?months.filter(m=>m>='202410'&&m<='202509').map(exports.monthLabel):['4Q24','1Q25','2Q25','3Q25'];
  for(const label of labels)for(const key of Object.keys(current)){
   const expected=old.find(r=>r.x===label)[key];assert.notEqual(expected,null);
   assert.equal(restored.find(r=>r.x===label)[key],expected,`${group} ${period} ${label} ${key}: use both archived amounts`);
  }
  assert.equal(restored.at(-1).전체,toRows(current,period,'전체',true,trade.meta.regionalBasisStart).at(-1).전체);
 }
}
console.log('YoY continuity passed: 12 months and four quarters, archived comparison pairs, current September unchanged.');
