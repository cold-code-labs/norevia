// Norevia — agente de natureza. Cálculos de checagem para cartões nat-condorcet-*, nat-diversity-prediction e nat-lagrange.
// Uso: node teoria-coletiva.js   (sem dependências; determinístico)
// Valida apenas a MATEMÁTICA dos enunciados (validacao-local), não a eficácia em LLMs.

function lgamma(x){ // Lanczos
  const g=7,c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5) return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);
  x-=1; let a=c[0]; const t=x+g+0.5; for(let i=1;i<9;i++) a+=c[i]/(x+i);
  return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
}
const lbeta=(a,b)=>lgamma(a)+lgamma(b)-lgamma(a+b);
const lchoose=(n,k)=>lgamma(n+1)-lgamma(k+1)-lgamma(n-k+1);

// Condorcet independente: P(maioria correta), n ímpar
function condorcet(n,p){let s=0;for(let k=Math.ceil((n+1)/2);k<=n;k++) s+=Math.exp(lchoose(n,k)+k*Math.log(p)+(n-k)*Math.log(1-p));return s;}
// Votos correlacionados (beta-binomial): média p, correlação intra-classe rho
function condorcetCorr(n,p,rho){ if(rho===0) return condorcet(n,p);
  const ab=1/rho-1, a=p*ab, b=(1-p)*ab; let s=0;
  for(let k=Math.ceil((n+1)/2);k<=n;k++) s+=Math.exp(lchoose(n,k)+lbeta(k+a,n-k+b)-lbeta(a,b));
  return s; }
// Limite n→∞ no caso correlacionado: P(q>1/2), q~Beta(a,b) (integração numérica)
function limitCorr(p,rho){const ab=1/rho-1,a=p*ab,b=(1-p)*ab;let s=0;const N=200000;for(let i=0;i<N;i++){const x=0.5+(i+0.5)/N*0.5;s+=Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-lbeta(a,b));}return s*0.5/N;}

console.log('== Condorcet: P(maioria correta), p=0.6 ==');
const ns=[1,3,5,7,11,21,51,101];
for(const rho of [0,0.05,0.1,0.3]){
  console.log(`rho=${rho}: `+ns.map(n=>`n=${n}:${condorcetCorr(n,0.6,rho).toFixed(3)}`).join('  ')+(rho>0?`  | limite n→∞: ${limitCorr(0.6,rho).toFixed(3)}`:'  | limite n→∞: 1.000'));
}
console.log('\n== n efetivo (efeito de desenho de Kish, variância da média): n/(1+(n-1)rho) ==');
for(const rho of [0.05,0.1,0.3]) console.log(`rho=${rho}: `+[3,5,10,50,1000].map(n=>`n=${n}->${(n/(1+(n-1)*rho)).toFixed(2)}`).join('  ')+`  | teto 1/rho=${(1/rho).toFixed(1)}`);

console.log('\n== Diversity prediction theorem (identidade): erro coletivo = erro médio - diversidade ==');
let seed=42; const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648;};
for(let t=0;t<3;t++){const theta=100*rnd();const s=Array.from({length:7},()=>theta+40*(rnd()-0.5)+10);const c=s.reduce((a,b)=>a+b)/s.length;
  const ce=(c-theta)**2, ae=s.reduce((a,x)=>a+(x-theta)**2,0)/s.length, dv=s.reduce((a,x)=>a+(x-c)**2,0)/s.length;
  console.log(`trial ${t}: coletivo=${ce.toFixed(4)}  medio-diversidade=${(ae-dv).toFixed(4)}  (medio=${ae.toFixed(2)}, diversidade=${dv.toFixed(2)})`);}

console.log('\n== Gascheau/Routh: mu_c = (1 - sqrt(23/27))/2 ==');
console.log(((1-Math.sqrt(23/27))/2).toFixed(6), ' check 27*mu*(1-mu)=', (27*((1-Math.sqrt(23/27))/2)*(1-(1-Math.sqrt(23/27))/2)).toFixed(6));
