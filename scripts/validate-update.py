"""Validate publishable data and audit-count consistency. No network or writes."""
import json,math
from pathlib import Path

def read(name):return json.loads(Path('data/'+name+'.json').read_text())
def numbers(values):
 assert all(v is None or isinstance(v,(int,float)) and math.isfinite(v) for v in values)
trade=read('trade');months=trade['meta']['months']
assert months==sorted(set(months)) and trade['meta']['latest']==months[-1]
def trade_series(values,label):
 assert len(values)==len(months),label
 numbers(values)
 assert all(v is None or v>=0 for v in values),label
for c in trade['countries']:
 for key in ('exp','imp','skin'):
  if key in c:trade_series(c[key],(c['code'],key))
 for key,values in c.get('cat',{}).items():trade_series(values,(c['code'],'cat',key))
for group in ('cat','hs'):
 for key,values in trade['national'].get(group,{}).items():trade_series(values,('national',group,key))
for field in ('exp','imp'):
 if field in trade['national']:trade_series(trade['national'][field],('national',field))
 for region,values in trade.get('regional',{}).get(field,{}).items():
  assert region in trade['meta']['regions'],region
  trade_series(values,('regional',field,region))
for field,groups in trade.get('grouped',{}).items():
 for group,values in groups.items():
  assert group in trade['meta']['g2'],group
  trade_series(values,('grouped',field,group))
# Direct aggregates may be rounded to USD millions; do not require country
# reconciliation when country coverage or classifications differ.
if trade.get('regional') or trade.get('grouped'):
 assert trade.get('provenance'),'Direct aggregates require source provenance'
for field in ('exp','imp'):
 national=trade['national'].get(field)
 if national is None:continue
 groups=[trade.get('regional',{}).get(field,{}),trade.get('grouped',{}).get(field,{})]
 if field=='exp':groups.append(trade['national']['cat'])
 for i,total in enumerate(national):
  if total is None:continue
  for group in groups:
   values=[series[i] for series in group.values()]
   if values and all(v is not None for v in values):
    assert abs(sum(values)-total)<=4000,('aggregate reconciliation',field,months[i],sum(values),total)
f=read('financials');assert f['meta']['basis']=='OFS'
assert len(f['q'])==len(set(f['q']))
for c,series in f['companies'].items():
 for k,v in series.items():assert len(v)==len(f['q']),(c,k);numbers(v)
frequency=read('call-frequency');evidence=read('call-evidence')
fd={d['id']:d for d in frequency['documents']};ed={d['id']:d for d in evidence}
assert len(fd)==len(frequency['documents']) and len(ed)==len(evidence)
for id,d in fd.items():
 if d['status']=='missing':assert not d.get('counts');continue
 n=d['counts']['direct']+d['counts']['brands']
 assert n==ed.get(id,{}).get('count',0),(id,n)
for id,d in ed.items():
 assert id in fd and d['sha256']==fd[id]['sha256']
 assert d['count']==sum(s['count'] for s in d['segments'])
 assert sum(len(s['en'].replace('…',' ').split()) for s in d['segments'])<=25
 for s in d['segments']:
  assert s['count']==sum(t['count'] for t in s['terms'])
  assert all(s.get(k) for k in ('en','ko','context','location'))
status=read('update-status')
for v in status['datasets'].values():assert v['status'] in ('no_change','updated','partial','error','pending')
print('Validated trade arrays, OFS financials, all call counts/excerpts, and update status.')
