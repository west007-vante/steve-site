'use strict';
// Software rasterizer: joint positions -> geometry -> per-pixel lighting/dither -> RGBA.
// No source images, image interpolation, video, CSS hand animation or crossfade.
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const range=document.querySelector('#progress'),out=document.querySelector('#percent'),stage=document.querySelector('#stage');
const result=document.querySelector('#result'),play=document.querySelector('#play'),reset=document.querySelector('#reset'),reduced=document.querySelector('#reduced');
const W=960,H=500,frame=ctx.createImageData(W,H),background=new Uint8ClampedArray(W*H*4);
const media=matchMedia('(prefers-reduced-motion: reduce)');reduced.checked=media.matches;
let raf=0,current=0;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,y)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+31,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295};
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;const grain=(hash(x,y)-.5)*23;const grid=(x%3===0||y%3===0)?-13:0;const crack=Math.abs(Math.sin(x*.015+y*.022)*18+(x-180-y*.42))<.65;const c=187+grain+grid-(crack?80:0);background[i]=c+4;background[i+1]=c+2;background[i+2]=c-8;background[i+3]=255;}
function pixel(x,y,light){const i=(y*W+x)*4;const threshold=(bayer[(y%4)*4+x%4]+.5)/16;const dark=clamp((.64-light)*1.9);const ink=threshold<dark;const grain=(hash(x,y)-.5)*15;const c=ink?18:mix(112,202,clamp(light))+grain;frame.data[i]=c+(ink?0:12);frame.data[i+1]=c-(ink?0:9);frame.data[i+2]=c-(ink?0:28);frame.data[i+3]=255;}
function capsule(a,b,r){const vx=b[0]-a[0],vy=b[1]-a[1],len=vx*vx+vy*vy;const x0=Math.max(0,Math.floor(Math.min(a[0],b[0])-r-1)),x1=Math.min(W-1,Math.ceil(Math.max(a[0],b[0])+r+1));const y0=Math.max(0,Math.floor(Math.min(a[1],b[1])-r-1)),y1=Math.min(H-1,Math.ceil(Math.max(a[1],b[1])+r+1));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const t=clamp(((x-a[0])*vx+(y-a[1])*vy)/(len||1));const dx=x-a[0]-t*vx,dy=y-a[1]-t*vy,d=Math.hypot(dx,dy);if(d>r)continue;const light=d>r-1.5?.06:.64+Math.sqrt(Math.max(0,1-d*d/(r*r)))*.23-dy/r*.31;pixel(x,y,light);}}
function polygon(points){const ys=points.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<=Math.min(H-1,Math.ceil(Math.max(...ys)));y++){let hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))hits.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)for(let x=Math.max(0,Math.ceil(hits[i]));x<=Math.min(W-1,Math.floor(hits[i+1]));x++){const bottom=(y-Math.min(...ys))/(Math.max(...ys)-Math.min(...ys));pixel(x,y,.95-bottom*.75);}}}
const blendPoints=(a,b,t)=>a.map((p,i)=>[mix(p[0],b[i][0],t),mix(p[1],b[i][1],t)]);
// Each finger owns three articulated phalanges. Closing starts at a different time per digit.
const leftStart=[[[335,202],[389,216],[428,241],[463,264]],[[337,224],[377,248],[395,277],[408,285]],[[326,246],[355,277],[368,305],[377,309]],[[305,265],[322,291],[335,312],[344,317]]];
const rightStart=[[[629,260],[568,254],[527,260],[496,268]],[[634,285],[588,292],[561,323],[552,340]],[[651,307],[611,331],[601,364],[591,374]],[[676,316],[647,345],[636,377],[626,383]]];
function finger(points,r){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 for(let y=Math.max(0,Math.floor(Math.min(...ys)-r));y<=Math.min(H-1,Math.ceil(Math.max(...ys)+r));y++)for(let x=Math.max(0,Math.floor(Math.min(...xs)-r));x<=Math.min(W-1,Math.ceil(Math.max(...xs)+r));x++){
 let best=-Infinity,shade=0;
 for(let j=0;j<3;j++){const a=points[j],b=points[j+1],vx=b[0]-a[0],vy=b[1]-a[1];const t=clamp(((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy||1));const rr=r-(j+t)*.8,dx=x-a[0]-t*vx,dy=y-a[1]-t*vy,d=Math.hypot(dx,dy),inside=rr-d;if(inside>best){best=inside;shade=.48+Math.sqrt(Math.max(0,1-d*d/(rr*rr)))*.35-dy/rr*.30;}}
 if(best>=0)pixel(x,y,best<1?.07:shade);
 }
}

function hands(p){const t=smooth(p/.66);polygon(blendPoints([[-25,218],[204,194],[282,164],[335,185],[359,225],[318,279],[193,287],[-25,348]],[[-25,217],[215,215],[362,181],[419,182],[448,218],[430,312],[300,310],[-25,332]],t));polygon(blendPoints([[985,207],[758,241],[675,247],[622,265],[611,303],[661,334],[780,314],[985,348]],[[985,218],[744,219],[598,183],[543,183],[516,218],[533,313],[677,311],[985,333]],t));
// Alternating left/right rows give explicit occlusion: each digit passes over the next and under its neighbour.
for(let i=3;i>=0;i--){const y=189+i*29;const ft=smooth((p-.13-i*.025)/.46);const bulge=Math.sin(i/3*Math.PI)*9;const l=[[421,y],[475,y-5],[531+bulge,y+6],[516,y+22]];const r=[[539,y+14],[488,y+13],[428-bulge,y+24],[444,y+36]];finger(blendPoints(leftStart[i],l,ft),13-i*.5);finger(blendPoints(rightStart[i],r,ft),13-i*.5);}
finger(blendPoints([[295,234],[322,255],[341,274],[352,267]],[[402,203],[427,170],[474,161],[502,179]],t),17);finger(blendPoints([[678,272],[632,289],[608,314],[596,313]],[[555,204],[532,172],[490,159],[463,175]],t),17);
}
function render(value){current=clamp(value);range.value=Math.round(current*100);out.value=`${Math.round(current*100)}%`;stage.textContent=current<.15?'Aproximação':current<.66?'Dedos entrando entre os outros':current<.76?'Dedos entrelaçados':current<.98?'Sucção dos pixels':'Revelação';frame.data.set(background);hands(reduced.checked?(current<.5?0:.7):Math.min(current,.7));const suction=reduced.checked?(current>=.98?1:0):smooth((current-.76)/.22);if(suction>0){const source=new Uint8ClampedArray(frame.data),scale=Math.pow(1-suction,1.45),angle=suction*1.4;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;let sx=-1,sy=-1;if(scale>.001){const dx=(x-480)/scale,dy=(y-250)/scale;sx=Math.round(480+dx*Math.cos(angle)+dy*Math.sin(angle));sy=Math.round(250-dx*Math.sin(angle)+dy*Math.cos(angle));}if(sx>=0&&sx<W&&sy>=0&&sy<H){const k=(sy*W+sx)*4;frame.data[i]=source[k];frame.data[i+1]=source[k+1];frame.data[i+2]=source[k+2];}else{frame.data[i]=11;frame.data[i+1]=12;frame.data[i+2]=15;}}}ctx.putImageData(frame,0,0);result.hidden=current<.98;}
function stop(){cancelAnimationFrame(raf);raf=0;play.textContent='Ver sequência completa';}
range.addEventListener('input',()=>{stop();render(Number(range.value)/100)});reduced.addEventListener('change',()=>render(current));
play.addEventListener('click',()=>{if(raf){stop();return;}const start=performance.now(),duration=reduced.checked?2400:12000;play.textContent='Pausar';let last=-100;const tick=t=>{if(t-last>32){render((t-start)/duration);last=t;}if(current<1)raf=requestAnimationFrame(tick);else{stop();result.focus({preventScroll:true});}};raf=requestAnimationFrame(tick)});
function restart(){stop();render(0)}reset.addEventListener('click',restart);document.querySelector('#again').addEventListener('click',()=>{restart();play.focus()});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
document.querySelector('.load').hidden=true;play.disabled=false;reset.disabled=false;render(0);
