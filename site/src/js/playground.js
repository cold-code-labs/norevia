// Shared interactive model playgrounds, using the repository's own equations and deterministic models.
const root = $('[data-play]');
if (root) {
  const kind = root.dataset.play, form = $('form.controls', root), readout = $('[data-readout]', root);
  const inputs = Object.fromEntries([...form.querySelectorAll('input[type=range]')].map((x) => [x.name, x]));
  const val = (k) => +inputs[k].value;
  const out = (k, v) => { const e = form.querySelector(`[data-out="${k}"]`); if (e) e.textContent = v; };
  const resetButtons = $$('button[data-act="reset"]', root);
  const chartHost = (name) => $(`[data-chart="${name}"]`, root);
  const colors = { mint: COLORS.mint, amber: COLORS.amber, rose: COLORS.rose, blue: COLORS.blue, violet: COLORS.violet };

  if (kind === 'correlated-voting') {
    const chart = lineChart(chartHost('acc'), { x:[1,63], y:[0.35,1], xLabel:'Number of voters N', yFmt:(x)=>pct(x), xTicks:[1,9,17,25,33,41,49,57,63], ariaLabel:'Majority accuracy by voter count and error correlation' });
    const update = () => {
      const p=val('p'), rho=val('rho'), n=val('n'), k=val('k'), pH=pOf(k,0.5,1-p);
      out('p',p.toFixed(2)); out('rho',rho.toFixed(3)); out('n',n); out('k',k);
      const ns=Array.from({length:32},(_,i)=>2*i+1), pts=(r)=>ns.map(x=>[x,analyticVote(x,p,r)]);
      chart.update({series:[{name:'Correlated vote',pts:pts(rho),color:colors.mint},{name:'Independent vote',pts:pts(0),color:colors.blue,cls:'dot'},{name:'Single high effort',pts:[[1,pH],[63,pH]],color:colors.amber,cls:'dash'},{name:'Correlation ceiling',pts:[[1,voteCeilingCopula(p,rho)],[63,voteCeilingCopula(p,rho)]],color:colors.rose,cls:'dash'}],hl:n});
      const pv=analyticVote(n,p,rho), pc=rhoCritical(p,pH);
      readout.innerHTML=`<p>At <b>N=${n}</b>, majority accuracy is <b>${pct(pv)}</b>; one stronger agent is <b>${pct(pH)}</b> at effort cost ${k}. ${rho>0?`The model ceiling is ${pct(voteCeilingCopula(p,rho))}.`:''}</p><p>Critical correlation ρ<sub>c</sub> ≈ <b>${Number.isFinite(pc)?pc.toFixed(3):'—'}</b>. This is a model calculation, not an LLM measurement.</p>`;
    };
    form.addEventListener('input',update); update();
    const agents=$('[data-agents]',root), verdict=$('[data-verdict]',root);
    const sample=$('button[data-act="sample"]',root);
    if(sample) sample.addEventListener('click',()=>{const rng=new Rng((Date.now()|0)^Math.floor(val('rho')*1e6)),latent=rng.normal();let correct=0;agents.textContent='';for(let i=0;i<val('n');i++){const ok=rng.uniform()<condP(val('p'),val('rho'),latent);if(ok)correct++;const s=document.createElement('i');s.className=ok?'ok':'no';s.setAttribute('aria-label',ok?'sampled correct':'sampled wrong');agents.append(s);}const good=correct>val('n')/2;verdict.textContent=`Sample outcome: ${correct}/${val('n')} agents correct; majority ${good?'correct':'wrong'} (one stochastic draw; not evidence).`;});
    resetButtons.forEach((b)=>b.addEventListener('click',()=>setTimeout(update,0)));
  }

  if (kind === 'verifier') {
    const fsChart=lineChart(chartHost('fs'),{x:[1,33],y:[0,0.5],xLabel:'Candidate attempts N',yFmt:(x)=>pct(x),xTicks:[1,5,9,13,17,21,25,29,33],ariaLabel:'False success by attempt budget'});
    const acChart=lineChart(chartHost('acc'),{x:[1,33],y:[0,1],xLabel:'Candidate attempts N',yFmt:(x)=>pct(x),xTicks:[1,5,9,13,17,21,25,29,33],ariaLabel:'Correct delivery and abstention by attempt budget'});
    const update=()=>{const p=val('p'),sens=val('sens'),spec=val('spec'),rho=val('rho'),n=val('n'); for(const [k,v] of Object.entries({p:p.toFixed(2),sens:sens.toFixed(2),spec:spec.toFixed(3),rho:rho.toFixed(2),n}))out(k,v);
      const ns=Array.from({length:33},(_,i)=>i+1), rows=ns.map(x=>{const r=bestOfN(x,p,{s:sens,f:1-spec,rho});return{x,r};});
      fsChart.update({series:[{name:'Verifier false success',pts:rows.map(({x,r})=>[x,r.pFalse]),color:colors.mint},{name:'Majority vote false success (approx.)',pts:ns.map(x=>[x,1-analyticVote(x,p,rho)]),color:colors.amber,cls:'dash'}],hl:n});
      acChart.update({series:[{name:'Correct delivery',pts:rows.map(({x,r})=>[x,r.pTrue]),color:colors.mint},{name:'Abstain',pts:rows.map(({x,r})=>[x,r.abstain]),color:colors.violet,cls:'dot'},{name:'Vote accuracy',pts:ns.map(x=>[x,analyticVote(x,p,rho)]),color:colors.amber,cls:'dash'}],hl:n});
      const r=bestOfN(n,p,{s:sens,f:1-spec,rho});readout.innerHTML=`<p>At N=${n}: correct delivery <b>${pct(r.pTrue)}</b>, false success <b>${pct(r.pFalse)}</b>, abstention <b>${pct(r.abstain)}</b>. Expected candidates checked: <b>${r.expectedCalls.toFixed(2)}</b>.</p><p>Verifier outcomes follow the simulation's fixed sensitivity/specificity assumptions; independence between judge and generator is not established here.</p>`;};form.addEventListener('input',update);update();resetButtons.forEach(b=>b.addEventListener('click',()=>setTimeout(update,0)));
  }

  if (kind === 'elastic-swarm') {
    const host=$('[data-regime]',root), chart=lineChart(chartHost('u'),{x:[1,200],y:[-30,180],xLabel:'Value of a correct result V (log scale)',xFmt:(x)=>Number(x).toFixed(0),logX:true,yFmt:(x)=>Number(x).toFixed(0),ariaLabel:'Expected utility by team size and task class'});
    const update=()=>{const raw=val('v'),V=Math.exp(Math.log(200)*raw/1000),spec=val('spec');out('v',V.toFixed(1));out('spec',spec.toFixed(3));
      host.textContent='';const bands=[];
      for(const c of ELASTIC.classes){const best=bestFixedN(c,V,{spec}); const row=document.createElement('div');row.className='regime-row'; row.innerHTML=`<span>${c.name}</span><b>N=${best.N} · ${sizeClass(best.N)}</b><span>U=${best.U.toFixed(2)}</span>`;host.append(row);}
      const ns=Array.from({length:32},(_,i)=>i+1),series=ELASTIC.classes.map((c,i)=>({name:c.name,pts:ns.map(n=>[n,V*fixedExact(c,n,spec).pCorrect-n*(ELASTIC.attempt_cost+ELASTIC.test.cost)-V*fixedExact(c,n,spec).pFalse]),color:[colors.mint,colors.amber,colors.rose][i],cls:i?'dash':''}));
      chart.update({series,yDomain:[-30,Math.max(20,V)]});readout.innerHTML=`<p>Task value <b>V=${V.toFixed(1)}</b>; acceptance specificity <b>${pct(spec)}</b>. The three lines show model utility for fixed team sizes; the table marks each optimum.</p><p>These are the repository model's assumptions, not a policy recommendation or LLM result.</p>`;
    };form.addEventListener('input',update);update();resetButtons.forEach(b=>b.addEventListener('click',()=>setTimeout(update,0)));
  }

  if (kind === 'stigmergy') {
    const canvas=$('[data-grid]',root),ctx=canvas?.getContext('2d'),epsList=STIG.epsilons;let w,paused=false,mode='stigmergy',K=4,eps=0.1;
    const curve=JSON.parse(root.dataset.curve||'[]'),cdata=curve.find(x=>x.K===K);
    const chart=lineChart(chartHost('u'),{x:[0,1],y:[0,400],xLabel:'Evaporation ε',xFmt:x=>x.toFixed(2),yFmt:x=>x.toFixed(0),ariaLabel:'Foraging search time by trail evaporation'});
    const make=()=>{w=stigmergyWorld({K,eps,mode,seed:20261107});};
    const draw=()=>{if(!ctx||!w)return;const W=STIG.grid,cell=canvas.width/W;ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=0;i<W*W;i++){const v=Math.min(1,w.val(i)/8);if(v>.02){ctx.fillStyle=`rgba(14, 122, 98,${(0.12+v*.7).toFixed(3)})`;ctx.fillRect((i%W)*cell,Math.floor(i/W)*cell,cell,cell);}}ctx.fillStyle='#c98a00';ctx.fillRect((w.target%W)*cell,Math.floor(w.target/W)*cell,cell,cell);for(const p of w.pos){ctx.fillStyle='#101312';ctx.beginPath();ctx.arc((p%W+.5)*cell,(Math.floor(p/W)+.5)*cell,Math.max(2,cell*.22),0,Math.PI*2);ctx.fill();}if(w.t%120<val('speed'))readout.innerHTML=`<p>Time step <b>${w.t}</b> · completed episodes <b>${w.epTimes.length}</b> · trail mass <b>${w.mass().toFixed(1)}</b>.</p><p>Duplicate visits: <b>${w.moves?pct(w.dups/w.moves):'0%'}</b>. Model run only; it does not measure LLM coordination.</p>`;};
    const update=()=>{const idx=val('eps');eps=epsList[Math.max(0,Math.min(7,idx))];out('eps',eps);out('speed',val('speed'));make();const d=curve.find(x=>x.K===K);if(d)chart.update({series:[{name:'Shared trail',pts:d.pts.map(p=>[p[0],p[1]]),color:colors.mint},{name:'All-to-all messages',pts:epsList.map(x=>[x,d.messages]),color:colors.amber,cls:'dash'},{name:'No coordination',pts:epsList.map(x=>[x,d.none]),color:colors.rose,cls:'dot'}],hl:eps});draw();};
    form.addEventListener('input',update);root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.k){K=+b.dataset.k;$$('button[data-k]',root).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();}if(b.dataset.mode){mode=b.dataset.mode;$$('button[data-mode]',root).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();}if(b.dataset.act==='play'){paused=!paused;b.textContent=paused?'Resume':'Pause';}if(b.dataset.act==='reset')update();if(b.dataset.act==='turbo'){for(let i=0;i<50*500;i++)w.step();draw();}});
    const loopState=loop(canvas,()=>{if(!paused){for(let i=0;i<val('speed');i++)w.step();draw();}});update();
  }

  if (kind === 'response-thresholds') {
    const agents=$('[data-agents]',root),chart=lineChart(chartHost('backlog'),{x:[0,300],y:[0,500],xLabel:'Time step',yFmt:x=>x.toFixed(0),ariaLabel:'Queue length under threshold and fixed allocation'});let worlds;
    const init=()=>{worlds=[allocationWorld({kind:'threshold',thMin:val('thmin'),thMax:Math.max(val('thmin'),val('thmax')),pQuit:val('quit'),seed:7}),allocationWorld({kind:'fixed',seed:7})];};
    let spike=[0,0],until=0,stepN=0,seriesA=[],seriesB=[];
    const reset=()=>{stepN=0;spike=[0,0];until=0;seriesA=[];seriesB=[];init();};
    const update=()=>{out('thmin',val('thmin'));out('thmax',val('thmax'));out('quit',val('quit').toFixed(2));reset();};
    form.addEventListener('input',update);root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.spike!==undefined){spike=[0,0];spike[+b.dataset.spike]=1;until=stepN+THR.spike_duration;}if(b.dataset.act==='play'){paused=!paused;b.textContent=paused?'Resume':'Pause';}if(b.dataset.act==='reset')update();});
    let paused=false;
    const frame=()=>{if(paused)return;const arrival=[THR.base_rate,THR.base_rate];if(stepN<until)arrival[spike.indexOf(1)]*=THR.spike_multiplier;const a=worlds[0].step(arrival),b=worlds[1].step(arrival);stepN++;seriesA.push([stepN,a.backlog]);seriesB.push([stepN,b.backlog]);if(seriesA.length>300){seriesA.shift();seriesB.shift();}const offset=Math.max(0,stepN-300),shown=x=>x.map(([t,y])=>[t-offset,y]);chart.update({series:[{name:'Response thresholds',pts:shown(seriesA),color:colors.mint},{name:'Fixed roles 3 + 3',pts:shown(seriesB),color:colors.amber,cls:'dash'}],yDomain:[0,Math.max(30,...seriesA.map(x=>x[1]),...seriesB.map(x=>x[1]))]});agents.textContent='';for(const v of worlds[0].active){const d=document.createElement('i');d.className=v<0?'':v===0?'a':'b';d.setAttribute('aria-label',v<0?'idle':v===0?'working on task A':'working on task B');d.textContent=v<0?'':v===0?'A':'B';agents.append(d);}readout.innerHTML=`<p>Step <b>${stepN}</b> · active threshold agents <b>${a.active}/40</b> · backlog <b>${a.backlog}</b>; fixed-role backlog <b>${b.backlog}</b>.</p><p>The same arrivals feed both strategies. This browser model is not an LLM measurement.</p>`;};
    const loopState=loop(root,frame);update();
  }
}
