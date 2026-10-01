"""Import the audited September report facts. Units in trade.json are thousand USD.

The PDF remains private. data/trade-samsung-202609.json contains only numeric
facts and provenance. Re-running is idempotent; archive changes through git.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'data/trade.json'
d = json.loads(path.read_text())
s = json.loads((root / 'data/trade-samsung-202609.json').read_text())
old_len = len(d['meta']['months'])
if d['meta']['months'][-1] == '202608':
    def extend(node):
        if isinstance(node, dict):
            for value in node.values(): extend(value)
        elif isinstance(node, list):
            if len(node) == old_len and all(v is None or isinstance(v, (int,float)) for v in node):
                node.append(None)
            else:
                for value in node: extend(value)
    extend(d['countries']); extend(d['national'])
    d['meta']['months'].append('202609')
assert d['meta']['months'][-1] == '202609'
months = d['meta']['months']; n = len(months)
idx = [months.index(m) for m in s['months']]
raw = {row['label']:row['values'] for row in s['rows']}
facts = {key:[v*1000 for v in values] for key,values in raw.items()}
for key,value in s['summaryPage1'].items(): facts[key][-1] = round(value*1000, 6)
facts['Skincare'][-1] = round(facts['Skincare & suncare (estimates)'][-1] - facts['Miscellaneous (including suncare)'][-1],6)
facts['China & HK, TW'][-1] = round(facts['World'][-1]-facts['World excl. China, HK, TW'][-1],6)
def align(values):
    result=[None]*n
    for i,v in zip(idx,values): result[i]=v
    return result
def diff(a,b): return [round(x-y,6) for x,y in zip(a,b)]
d['national']['exp'] = align(facts['World'])
for key,label in {'기초':'Skincare','색조':'Makeup','기타':'Miscellaneous (including suncare)'}.items():
    for i,v in zip(idx,facts[label]): d['national']['cat'][key][i]=v
regions={'중화권':facts['China & HK, TW'],'아시아':diff(facts['Asia'],facts['China & HK, TW']),
         '북미':facts['North America'],'유럽':facts['Europe'],'중동':facts['Middle East'],
         '중남미':facts['Latin America'],'오세아니아':facts['Oceania'],'아프리카':facts['Africa & other']}
d['regional']={'exp':{k:align(v) for k,v in regions.items()}}
groups={'중화권':facts['China & HK, TW'],'미국':facts['US'],'유럽':facts['Europe'],'일본':facts['Japan'],'동남아시아':facts['Southeast Asia']}
groups['기타']=[round(facts['World'][j]-sum(v[j] for v in groups.values()),6) for j in range(len(idx))]
d['grouped']={'exp':{k:align(v) for k,v in groups.items()}}
country_labels={'CN':'China','HK':'Hong Kong','TW':'Taiwan','JP':'Japan','VN':'Vietnam','ID':'Indonesia','TH':'Thailand','SG':'Singapore','MY':'Malaysia','PH':'Philippines','US':'US','CA':'Canada','RU':'Russia','PL':'Poland','GB':'UK','DE':'Germany','NL':'Netherlands','FR':'France','AU':'Australia'}
revisions=[]
for c in d['countries']:
    label=country_labels.get(c['code'])
    if not label: continue
    for j,i in enumerate(idx):
        old=c['exp'][i]; new=facts[label][j]
        # Retain finer official observations within the report's rounding interval.
        # Large disagreements are replaced by the reported series, not called official revisions.
        if old is None or abs(old-raw[label][j]*1000)>500 or j==len(idx)-1:
            if old is not None and old!=new:
                revisions.append({'code':c['code'],'month':months[i],'previous':old,'reported':new})
                # Existing category components cannot describe a different total.
                for values in c.get('cat',{}).values(): values[i]=None
            c['exp'][i]=new
d['meta']['latest']='202609'
d['meta']['regionalBasisStart']='202410'
d['meta']['regionalBasisNote']='2024년 10월~2026년 9월 권역·전국·품목 수출 및 지역 비중은 삼성증권 정동희 수출 데이터북(2026.10.1, TRASS, p1·7)의 동일 출처 월별 시계열입니다. 잠정치이며 월표는 백만 달러 반올림, 9월 요약에서 대조된 값은 0.01백만 달러 단위입니다. 이 기간 중화권은 중국·홍콩·대만, 아시아는 중화권·중동 제외, 아프리카는 아프리카·기타입니다. 그 이전 자체 권역 분류와 차이가 있습니다. 반올림으로 합계와 증감률에 소폭 차이가 생길 수 있습니다. 9월 국가별 수출은 보고서의 19개국만 반영하며 수입·미확보 국가는 공란으로 유지합니다.'
d['meta']['source']='관세청 공공데이터포털 오픈API / TRASS·삼성증권 정동희 수출 데이터북 (2026.10.1)'
d['provenance']=d.get('provenance',{})
d['provenance']['samsung202609']={'factsFile':'data/trade-samsung-202609.json','sourceId':s['id'],'period':['202410','202609'],'unitStored':'thousand USD','basis':'report aggregate definitions; not assumed identical to historical country mapping','regionalMapping':{'중화권':'China & HK, TW','아시아':'Asia minus China & HK, TW','북미':'North America (US/Canada)','유럽':'Europe, including Russia; exhaustive country list not specified','중동':'Middle East; exhaustive country list not specified','중남미':'Latin America','오세아니아':'Oceania','아프리카':'Africa & other'},'groupOther':'World minus China/HK/TW, US, Europe, Japan and Southeast Asia; arithmetic remainder, not a country estimate','countryCodes':list(country_labels),'unknownSeptemberCountryCount':len(d['countries'])-len(country_labels),'categoryDefinitionNote':'Report Skincare, Makeup, Miscellaneous; p1 skincare derived as skincare+suncare minus miscellaneous. HS-specific national arrays remain separately sourced.','countryReconciliation':revisions or d.get('provenance',{}).get('samsung202609',{}).get('countryReconciliation',[])}
path.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
print('Imported 24 report months, 8 regions, 3 categories and 19 September countries; disagreements:',len(revisions))
