import { useEffect, useRef, useState } from 'react';

const amazonUrl = 'https://cbturbomax.github.io/Amazon-Tracker/';

/** Reuse the live tracker so its data pipeline and all interactions stay current. */
export default function AmazonTracker() {
  const frame = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState(1000);

  useEffect(() => () => cleanup.current?.(), []);

  function connectFrame() {
    cleanup.current?.();
    setLoaded(true);
    try {
      // Both projects are on the user's same GitHub Pages origin.
      const doc = frame.current?.contentDocument;
      const content = doc?.querySelector<HTMLElement>('.wrap');
      if (!doc || !content) return;
      const style = doc.createElement('style');
      style.textContent = `
        html, body { min-height: 0 !important; height: auto !important; overflow-y: hidden !important; color-scheme: dark; }
        .wrap { max-width: none !important; padding: 0 0 24px !important; }
        header .title-row { display: none !important; }
        header { border: 0 !important; padding: 0 !important; margin: 0 0 12px !important; }
        header .status-row { margin-top: 0 !important; }
      `;
      doc.head.appendChild(style);
      // Apply this dashboard's chart defaults to the live, same-origin embed.
      let rangeInitialized = false;let brandRangeInitialized = false;
      const enhance = () => {
        const brandRange = doc.querySelector<HTMLElement>('#br-range');
        if (brandRange && !brandRangeInitialized) {
          brandRangeInitialized = true;
          const five = doc.createElement('button');five.type='button';five.dataset.range='1827';five.textContent='5년';
          five.setAttribute('aria-pressed','false');brandRange.prepend(five);five.click();
        }
        const trend = doc.querySelector<HTMLElement>('#trend-range');
        const all = trend?.querySelector<HTMLButtonElement>('button[data-v="0"]');
        if (all && !rangeInitialized) {
          rangeInitialized = true;
          const five = doc.createElement('button');
          five.type = 'button'; five.dataset.v = '1827'; five.textContent = '5년';
          five.setAttribute('aria-pressed', 'false');
          trend!.insertBefore(five, all); five.click();
        }
        // Mark the newest point even when an embedded chart is redrawn.
        doc.querySelectorAll<SVGSVGElement>('svg').forEach(svg => {
          const points = Array.from(svg.querySelectorAll<SVGCircleElement>('circle[cx][cy]'));
          if (!points.length) return;
          const lastX = Math.max(...points.map(p => Number(p.getAttribute('cx'))));
          points.filter(p => Number(p.getAttribute('cx')) === lastX).forEach(p => {
            if (p.classList.contains('beauty-latest')) return;
            p.classList.add('beauty-latest');p.setAttribute('r', '7');
            p.setAttribute('stroke', '#FFFFFF');p.setAttribute('stroke-width', '2');
          });
        });
      };
      const mutations = new MutationObserver(enhance);
      mutations.observe(content, {childList: true, subtree: true});
      enhance();
      let animation = 0;
      const resize = () => {
        cancelAnimationFrame(animation);
        animation = requestAnimationFrame(() => {
          const measured = Math.ceil(content.getBoundingClientRect().height) + 4;
          if (measured > 0) setHeight(Math.max(460, measured));
        });
      };
      const observer = new ResizeObserver(resize);
      observer.observe(content);
      resize();
      cleanup.current = () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(animation); };
    } catch {
      // If opened on another origin, the complete tracker still works with its own scroll.
    }
  }

  return <section className="amazon-integration" aria-label="아마존 K뷰티 트래커">
    <div className="amazon-toolbar">
      <span>AMAZON K-BEAUTY <span className="muted">· 원본 자동 갱신 연동 · 수집된 기간만 표시</span></span>
      <a className="link-button" href={amazonUrl} target="_blank" rel="noreferrer">별도 창으로 열기 ↗</a>
    </div>
    {!loaded && <div className="amazon-loading" role="status">아마존 트래커를 불러오는 중입니다…</div>}
    <iframe ref={frame} src={amazonUrl} title="아마존 트래커 — 브랜드 랭킹, K뷰티 오늘, K뷰티 추이, 이번 주 발굴"
      scrolling="no" className="amazon-frame" style={{ height }} onLoad={connectFrame} />
  </section>;
}
