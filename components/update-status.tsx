import {useEffect,useState} from 'react';
import status from '@/data/update-status.json';
export default function UpdateStatus(){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(id)},[]);
 const names:Record<string,string>={no_change:'확인 완료',updated:'갱신 완료',partial:'일부 확인',error:'확인 실패',pending:'첫 실행 대기'};
 return <details className="update-status"><summary>데이터 자동 확인 · {status.schedule}<span>{Object.values(status.datasets).some(d=>now-Date.parse(d.checkedAt)>36*3600000)?'확인 지연':Object.values(status.datasets).some(d=>d.status==='error')?'수집 오류':Object.values(status.datasets).some(d=>d.status==='partial')?'일부 확인 · 상세 보기':'확인 상태 보기'}</span></summary><div>{Object.entries(status.datasets).map(([key,d])=><p key={key}><b>{d.label} · {now-Date.parse(d.checkedAt)>36*3600000?'확인 지연':names[d.status]}</b><span>마지막 확인 {new Date(d.checkedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} · 최신 자료 {d.latest}</span><span>{d.message}</span></p>)}</div></details>
}
