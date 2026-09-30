"""Count literal mentions from full transcript exports, never from summaries.
Usage: python scripts/count-call-mentions.py /path/to/private-sources-directory
Only aggregate counts are published; source exports stay outside the repository.
"""
import hashlib,json,re,sys
from pathlib import Path
DIRECT=[('K-beauty',r'\bk[\s\-‐‑–—]*beauty\b'),('Korean beauty',r'\bkorean\s+beauty\b'),('Korean skincare / cosmetics',r'\bkorean\s+(?:skin\s*care|cosmetics?)\b'),('K뷰티',r'K[\s-]*뷰티')]
BRANDS=[('Medicube',r'\bmedicube\b'),('Anua',r'\banua\b'),('Dr.Jart',r'\bdr\.?\s*jart\b'),('Dr.G',r'\bdr\.?\s*g\b'),('Laneige',r'\blaneige\b'),('COSRX',r'\bcosrx\b'),('Beauty of Joseon',r'\bbeauty\s+of\s+joseon\b'),('Aestura',r'\baestura\b'),('Biodance',r'\bbiodance\b'),('TIRTIR',r'\btirtir\b'),('Erborian',r'\berborian\b'),('3CE',r'\b3ce\b'),('Innisfree',r'\binnisfree\b'),('Belif',r'\bbelif\b'),('Round Lab',r'\bround\s+lab\b'),('Torriden',r'\btorriden\b'),('Missha',r'\bmissha\b')]
GENERAL=[('beauty',r'\bbeauty\b'),('skincare',r'\bskin\s*care\b'),('cosmetics',r'\bcosmetics?\b')]
def count(text,qna=None):
    lines=[];section='unknown';at=None
    for line_no,line in enumerate(text.splitlines(),1):
        if re.match(r'^\s*\[Paragraph\s+\d+\]',line):continue
        m=re.match(r'^\s*\[(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]\s*',line)
        if m:
            at=float(m[1]);line=line[m.end():]
            section=('qna' if at>=qna else 'prepared') if qna is not None else 'unknown'
        lines.append((line,section,at,line_no))
    body='\n'.join(x[0] for x in lines);terms=[];moments=[]
    for category,patterns in [('direct',DIRECT),('brands',BRANDS),('general',GENERAL)]:
        for term,pattern in patterns:
            segments={'prepared':0,'qna':0,'unknown':0}
            for line,part,at,line_no in lines:
                if category=='general':line=re.sub(r'\b(?:Ulta\s+Beauty|e\.?l\.?f\.?\s+Beauty|K[\s-]*Beauty|Korean\s+Beauty|Beauty\s+of\s+Joseon)\b','',line,flags=re.I)
                n=len(re.findall(pattern,line,re.I));segments[part]+=n
                if n and category!='general':moments.append({'term':term,'category':category,'count':n,'section':part,'seconds':at,'line':line_no})
            if sum(segments.values()):terms.append({'term':term,'category':category,'count':sum(segments.values()),**segments})
    return {'counts':{c:sum(t['count'] for t in terms if t['category']==c) for c in ['direct','brands','general']},'terms':terms,'moments':moments,'wordCount':len(re.findall(r"\b[\w]+(?:['’][\w]+)?\b",body)),'sha256':hashlib.sha256(body.encode()).hexdigest()}
if __name__=='__main__':
    root=Path(sys.argv[1]);source=json.loads((root/'metadata.json').read_text());calls=json.loads(Path('data/calls.json').read_text());by_ticker={c['ticker'].split(':')[-1]:c for c in calls['companies']};docs=[]
    for m in source['eligible']:
        f=root/f"{m['call_id']}.json";raw=json.loads(f.read_text()) if f.exists() else {};complete=bool(raw.get('content')) and not raw.get('has_more') and not raw.get('error')
        d={'id':str(m['call_id']),'company':by_ticker[m['ticker']]['name'],'date':m['event_at'][:10],'title':m['title'],'type':'earnings' if m['type']=='Earnings Call' else 'conference','source':'StockNow 자동전사','status':'complete' if complete else 'missing','callId':m['call_id']}
        if complete:d.update(count(raw['content'],raw.get('qna_timestamp')))
        docs.append(d)
    for m in source.get('europe',[]):
        f=root/f"{m['id']}.json";raw=json.loads(f.read_text()) if f.exists() else {};d={**m,'status':'missing','reason':raw.get('reason') or '전체 원문 미확보·미집계'}
        if raw.get('verifiedBody') and raw.get('content'):d['status']='complete';d.update(count(raw['content']))
        docs.append(d)
    result={'updated':'2026-09-30','version':1,'range':'2024-01 ~ 2026-09','directTerms':[x[0] for x in DIRECT],'brandTerms':[x[0] for x in BRANDS],'documents':docs}
    Path('data/call-frequency.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print('Documents:',len(docs),'complete:',sum(d['status']=='complete' for d in docs))
    print('ULTA:',[(d['date'],d.get('counts',{}).get('direct'),d['status']) for d in docs if d['company']=='Ulta Beauty'])
