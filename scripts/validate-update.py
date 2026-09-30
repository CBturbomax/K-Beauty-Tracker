"""Validate publishable data and audit-count consistency. No network or writes."""
import json,math
from pathlib import Path

def read(name):return json.loads(Path('data/'+name+'.json').read_text())
def numbers(values):
 assert all(v is None or isinstance(v,(int,float)) and math.isfinite(v) for v in values)
trade=read('trade');months=trade['meta']['months']
assert months==sorted(set(months)) and trade['meta']['latest']==months[-1]
for c in trade['countries']:
 for key in ('exp','imp','skin'):
  if key in c:
   assert len(c[key])==len(months),(c['code'],key)
   numbers(c[key]);assert all(v is None or v>=0 for v in c[key])
for values in trade['national']['cat'].values():assert len(values)==len(months);numbers(values)
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
