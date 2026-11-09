// Schematic living systems. Original vector illustrations, not experimental reconstructions.
const ant = (x,y,a=0,s=1,t=0,accent=false) => `<g class="nature-ant${accent?' exposed-ant':''}" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><g class="ant-motion" style="--delay:${t}s"><path d="M-4 -3L-11 -10M0 -3L1 -12M4 -3L12 -8M-4 3L-11 10M0 3L1 12M4 3L12 8M9 -2L15 -6M9 2L15 6"/><ellipse cx="-7" rx="6.5" ry="4.3"/><ellipse rx="3.4" ry="2.7"/><circle cx="7" r="3.8"/></g></g>`;
const bee=(x,y,a=0)=>`<g class="nature-bee" transform="translate(${x} ${y}) rotate(${a})"><ellipse class="wing" cx="-3" cy="-9" rx="11" ry="6"/><ellipse class="wing" cx="-3" cy="9" rx="11" ry="6"/><ellipse class="bee-body" rx="15" ry="8"/><path class="bee-stripe" d="M-7 -7V7M0 -8V8M7 -6V6"/><circle class="bee-head" cx="17" r="5"/><path d="M20 -2l7-5M20 2l7 5"/></g>`;
export function natureArt(kind='colony') {
 let art='';
 if(kind==='colony'){
  art=`<path class="soil-line" d="M20 98Q90 70 155 92T290 78T460 98"/><path class="root-line" d="M80 0Q105 48 96 85M96 42L70 24M99 58L123 41M380 0Q365 40 390 86M376 32L401 13"/><path class="tunnel" d="M240 78Q225 110 252 149M252 149Q200 182 133 210M252 149Q300 177 353 222M133 210Q175 255 248 273M353 222Q304 264 248 273"/><ellipse class="chamber" cx="255" cy="149" rx="51" ry="24"/><ellipse class="chamber nursery" cx="129" cy="211" rx="60" ry="29"/><ellipse class="chamber" cx="357" cy="222" rx="55" ry="28"/><ellipse class="chamber" cx="248" cy="274" rx="53" ry="22"/>`;
  for(let i=0;i<9;i++)art+=`<ellipse class="brood" cx="${103+(i%5)*12}" cy="${204+Math.floor(i/5)*13}" rx="7" ry="4" transform="rotate(-25 ${103+(i%5)*12} ${204+Math.floor(i/5)*13})"/>`;
  art+=ant(231,106,65,.72,-1)+ant(277,167,30,.7,-2)+ant(190,178,-25,.7,-3)+ant(326,206,35,.7,-4)+ant(301,250,150,.7,-1)+ant(195,253,-155,.7,-2)+ant(246,275,0,.7,-3)+ant(153,195,40,.7,-2)+ant(359,223,-10,.7,-4)+ant(324,83,15,.85,-1,true)+ant(365,75,-15,.75,-3,true)+ant(398,84,7,.7,-2);
  art+=`<path class="boundary" d="M290 54Q273 85 305 113"/><text x="90" y="319">PROTECTED BROOD</text><text x="320" y="44">LOCAL CONTACTS</text>`;
 } else if(kind==='bees') {
  for(let r=0;r<5;r++)for(let c=0;c<6;c++){const x=135+c*39+(r%2)*19.5,y=65+r*34;art+=`<path class="honeycomb" d="${Array.from({length:6},(_,i)=>{const t=i*Math.PI/3;return(i?'L':'M')+(x+Math.cos(t)*22)+' '+(y+Math.sin(t)*22);}).join('')}Z"/>`;}
  art+=bee(145,143,-25)+bee(271,193,155)+bee(347,88,-20)+`<path class="signal-wave" d="M186 131Q207 150 191 172M201 117Q232 149 210 188M217 103Q254 147 230 202"/><path class="inhibit" d="M75 260Q140 200 203 233"/><path class="stop-mark" d="M202 213V250"/><text x="71" y="290">ALARM + INHIBITION</text>`;
 } else {
  art=`<ellipse class="chamber" cx="240" cy="174" rx="188" ry="104"/><path class="boundary" d="M242 70Q213 172 247 277"/>`;
  for(let i=0;i<9;i++)art+=`<ellipse class="brood" cx="${109+(i%3)*38}" cy="${127+Math.floor(i/3)*39}" rx="16" ry="9" transform="rotate(-30 ${109+(i%3)*38} ${127+Math.floor(i/3)*39})"/>`;
  art+=`<ellipse class="affected-brood" cx="322" cy="175" rx="21" ry="13"/><circle class="spore" cx="323" cy="172" r="3"/><circle class="spore" cx="332" cy="180" r="2"/>`+ant(290,125,45,1,-1)+ant(374,176,180,1,-2)+ant(292,226,-45,1,-3)+ant(176,89,10,.8,-2)+`<text x="105" y="310">SELECTIVE RESPONSE</text>`;
 }
 return `<svg class="nature-plate nature-${kind}" viewBox="0 0 480 330" aria-hidden="true" focusable="false">${art}</svg>`;
}
