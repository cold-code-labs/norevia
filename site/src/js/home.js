// Norevia: explicit, illustrative containment rules. No model calls or telemetry.
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const edges = Array.from({length:16}, (_,i) => [i,(i+1)%16]).concat([[0,8],[2,10],[4,12],[6,14]]);
  const root = document.querySelector('[data-defence-demo]');
  let exposed = new Set(), isolated = new Set(), verified = false, phase = 0;
  const labels = ['Detect','Signal','Reconfigure','Recover'];
  const stageRoot = document.querySelector('[data-stages]');
  function selectStage(n) {
    phase=n;
    stageRoot?.querySelectorAll('[data-stage-illustration]').forEach((el,i)=>{el.hidden=i!==n;});
    stageRoot?.querySelectorAll('.stage').forEach((el,i)=> {el.classList.toggle('on',i===n);el.setAttribute('aria-hidden',String(i!==n));});
    stageRoot?.querySelectorAll('[data-stage]').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===n)));
    const count=stageRoot?.querySelector('.stage-count'); if(count) count.textContent=`0${n+1} / 04 · Illustrative policy`;
    drawAll();
  }
  stageRoot?.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>selectStage(+b.dataset.stage)));
  const views=[];
  function setup(canvas,type) {
    if(!canvas) return;
    const g=canvas.getContext('2d'); if(!g) return;
    const v={canvas,g,type,w:0,h:0,visible:false}; views.push(v);
    const resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);v.w=r.width;v.h=r.height;canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);g.setTransform(d,0,0,d,0,0);draw(v,0);};
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e])=>{v.visible=e.isIntersecting;if(v.visible){draw(v,0);start();}}).observe(canvas);
    resize();
  }
  function draw(v,t) {
    const {g,w,h,type}=v; if(!w||!h)return;
    g.clearRect(0,0,w,h);
    const dark=type==='stages';
    const mobile=w<860;
    const cx=type==='hero'?(mobile?w*.5:w*.77):type==='stages'?(mobile?w*.5:w*.75):w*.5;
    const cy=type==='hero'?(mobile?h*.23:h*.5):type==='stages'?(mobile?h*.7:h*.5):h*.48;
    const radius=type==='hero'?Math.min(w*(mobile?.32:.19),h*.24):type==='stages'?Math.min(w*(mobile?.32:.21),h*.22):Math.min(w*.36,h*.35);
    const pts=Array.from({length:16},(_,i)=> {const a=i/16*TAU-Math.PI/2; const r=radius*(i%2?.82:1);return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];});
    const demo=type==='demo';
    const bad=demo?exposed:new Set(type==='stages'?(phase===3?[]:[0,1,15]):[0]);
    const cut=demo?isolated:new Set(type==='stages'&&phase>=2&&phase<3?[0,1,15]:[0]);
    edges.forEach(([a,b],i)=> {
      const blocked=cut.has(a)||cut.has(b), poison=bad.has(a)&&bad.has(b);
      g.strokeStyle=blocked?'#b46637':poison?'#ba4343':dark?'#719b90':'#91aea2';g.globalAlpha=blocked?.4:.5;g.lineWidth=1;g.setLineDash(blocked?[4,5]:[]);
      g.beginPath();g.moveTo(...pts[a]);g.lineTo(...pts[b]);g.stroke();g.setLineDash([]);
      if(!blocked&&!reduced.matches){const f=(t/4500+i*.13)%1;g.globalAlpha=.7;g.fillStyle=dark?'#7fdcc2':'#0e7a62';g.beginPath();g.arc(pts[a][0]+(pts[b][0]-pts[a][0])*f,pts[a][1]+(pts[b][1]-pts[a][1])*f,2,0,TAU);g.fill();}
    });
    g.globalAlpha=1;
    pts.forEach(([x,y],i)=> {
      const isCut=cut.has(i),isBad=bad.has(i),ok=demo?verified:type==='stages'&&phase===3;
      g.fillStyle=dark?'#101312':'#f4f3ee';g.strokeStyle=isCut?'#a76832':isBad?'#ba4343':dark?'#7fdcc2':'#0e7a62';g.lineWidth=1.5;
      g.beginPath();if(isCut)g.rect(x-10,y-10,20,20);else g.arc(x,y,10,0,TAU);g.fill();g.stroke();
      g.fillStyle=g.strokeStyle;g.font='10px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(isBad?'×':ok?'✓':String(i+1).padStart(2,'0'),x,y);
    });
    if(type==='demo')return;
    g.fillStyle=dark?'#7fdcc2':'#0e7a62';g.font='11px monospace';g.textAlign='center';g.fillText(type==='hero'?'SHARED CONTEXT · SELECTIVE BOUNDARIES':type==='stages'?labels[phase].toUpperCase()+' · VERIFY BEFORE ACTING':'EVIDENCE BEFORE CONSENSUS',cx,cy+radius+35);
  }
  let raf=null;
  function start(){if(raf||reduced.matches||document.hidden||!views.some(v=>v.visible))return;raf=requestAnimationFrame(t=>{raf=null;views.filter(v=>v.visible).forEach(v=>draw(v,t));start();});}
  function drawAll(){views.forEach(v=>draw(v,0));start();}
  document.addEventListener('visibilitychange',start);reduced.addEventListener('change',drawAll);
  function render(action='reset') {
    if(!root)return;
    root.querySelector('[data-exposed]').textContent=exposed.size;
    root.querySelector('[data-isolated]').textContent=isolated.size;
    root.querySelector('[data-available]').textContent=16-isolated.size;
    const messages={reset:['Start with a clean network.','Introduce one untrusted claim at agent 01. No data leaves your browser.'],introduce:['A claim enters shared context.','One source is exposed. Propagation is a separate step; nothing spreads automatically.'],spread:['Copies share a common source.','One hop has been added. More agreeing agents do not make the underlying source independent.'],contain:['Follow provenance. Limit the boundary.','All exposed nodes are quarantined. Unrelated nodes remain available; the perfect tracing here is an illustrative assumption.'],recover:['Verify, clear, then restore.','An assumed trusted check rejects the claim and removes its traced copies. All agents return to service. This is not a measured recovery result.']};
    root.querySelector('[data-demo-title]').textContent=messages[action][0];root.querySelector('[data-demo-description]').textContent=messages[action][1];
    root.querySelector('[data-demo-status]').textContent=`${exposed.size} exposed, ${isolated.size} isolated, ${16-isolated.size} available. ${verified?'Recovery verified under the sketch assumptions.':''}`;
    root.querySelector('[data-demo-action="introduce"]').disabled=exposed.size>0||verified;
    root.querySelector('[data-demo-action="spread"]').disabled=!exposed.size||isolated.size>0||exposed.size===16;
    root.querySelector('[data-demo-action="contain"]').disabled=!exposed.size||isolated.size>0;
    root.querySelector('[data-demo-action="recover"]').disabled=!isolated.size;
    drawAll();
  }
  root?.querySelectorAll('[data-demo-action]').forEach(b=>b.addEventListener('click',()=> {
    const a=b.dataset.demoAction;
    if(a==='introduce')exposed.add(0);
    if(a==='spread'){const next=new Set(exposed);for(const [x,y]of edges){if(exposed.has(x)&&!isolated.has(x)&&!isolated.has(y))next.add(y);if(exposed.has(y)&&!isolated.has(y)&&!isolated.has(x))next.add(x);}exposed=next;}
    if(a==='contain')isolated=new Set(exposed);
    if(a==='recover'){exposed.clear();isolated.clear();verified=true;}
    if(a==='reset'){exposed.clear();isolated.clear();verified=false;}
    render(a);
  }));
  setup(document.querySelector('[data-swarm="hero"]'),'hero');
  setup(document.querySelector('[data-defence-network]'),'demo');
  setup(stageRoot?.querySelector('canvas'),'stages');
  setup(document.querySelector('[data-swarm="soon"]'),'closing');
  render();selectStage(0);
  // Explicit stage buttons remain usable without scroll-driven animation.
  const bar=document.querySelector('.bar');
  const scroll=()=>{const r=stageRoot?.getBoundingClientRect();bar?.classList.toggle('dark',!!r&&r.top<=34&&r.bottom>=34);};
  addEventListener('scroll',scroll,{passive:true});scroll();
})();
