"""Build auditable, short bilingual excerpts from private transcript exports.
Usage: python scripts/build-call-evidence.py /path/to/transcripts
Only reviewed excerpts and aggregate evidence are published, never full transcripts.
"""
import json,re,sys,collections
from pathlib import Path
root=Path(sys.argv[1]); freq=json.loads(Path('data/call-frequency.json').read_text())
previous={d['id']:d for d in json.loads(Path('data/call-evidence.json').read_text())} if '--incremental' in sys.argv else {}
copy=json.loads(Path('data/call-evidence-copy.json').read_text());out=[]
def stamp(n):
 n=int(float(n));return f'{n//60}:{n%60:02}'
for d in freq['documents']:
 if not d.get('moments'):continue
 if '--incremental' in sys.argv and not (root/(d['id']+'.json')).exists():
  old=previous[d['id']];assert old['sha256']==d['sha256'],d['id'];out.append(old);continue
 raw=json.loads((root/(d['id']+'.json')).read_text());lines=raw['content'].splitlines();groups={}
 for m in d['moments']:groups.setdefault(m['line'],[]).append(m)
 segments=[];words=0
 for n,ms in sorted(groups.items()):
  key=d['id']+':'+str(n);c=copy[key];line=lines[n-1];at=0
  for part in c['en'].split(' … '):
   found=line.find(part,at);assert found>=0,(key,part);at=found+len(part)
  words+=len(c['en'].replace('…',' ').split())
  match=re.match(r'^\[(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]',line)
  location=(stamp(match[1])+'–'+stamp(match[2])) if match else f'수집 원문 {n}행'
  speaker=''
  if match:
   for prev in reversed(lines[:n]):
    sp=re.match(r'^\[Paragraph \d+\] (.+):$',prev)
    if sp:speaker=sp[1].replace('Speaker ','전사본 화자 ');break
  segments.append({'id':key,**c,'line':n,'location':location,'speaker':speaker,'count':sum(m['count'] for m in ms),'terms':[{'term':m['term'],'count':m['count']} for m in ms]})
 assert words<=25,(d['id'],words)
 total=sum(s['count'] for s in segments);assert total==d['counts']['direct']+d['counts']['brands'],d['id']
 out.append({'id':d['id'],'company':d['company'],'date':d['date'],'title':d['title'],'source':d['source'],'url':d.get('url'),'callId':d.get('callId'),'sha256':d['sha256'],'coverage':d.get('coverage','전체 원문'),'dateSource':d.get('dateSource'),'count':total,'segments':segments})
review=json.loads(Path('data/call-relevance-review.json').read_text())
assert {s['id'] for d in out for s in d['segments']}=={k for k in copy if review[k]['include']}
Path('data/call-evidence.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(f'{len(out)} source documents, {sum(len(d["segments"]) for d in out)} source passages, {sum(d["count"] for d in out)} mentions; all reconciled.')
