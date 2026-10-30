import{request}from'./api.js';
// Pagamento dentro do app: o formulário é o da própria Stripe (iframe dela); cartão nunca passa pelo Steve.
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const money=c=>(c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let stripeJs;
function loadStripe(){return stripeJs??=new Promise((ok,fail)=>{if(window.Stripe)return ok(window.Stripe);const s=document.createElement('script');s.src='https://js.stripe.com/dahlia/stripe.js';s.onload=()=>window.Stripe?ok(window.Stripe):fail(Error('Pagamento seguro indisponível.'));s.onerror=()=>{stripeJs=null;s.remove();fail(Error('Não foi possível carregar o pagamento seguro. Verifique sua conexão.'))};document.head.append(s)})}
export function openCheckoutPanel({plan,mode,csrfToken,idempotencyKey,onNewKey,onClose}){
 const year=plan.interval==='year',overlay=el('div','ck-overlay'),panel=el('section','ck-panel'),close=el('button','ck-close','×');
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Pagamento do plano '+plan.name);close.type='button';close.setAttribute('aria-label','Fechar pagamento');
 const summary=el('div','ck-summary'),pay=el('div','ck-pay'),status=el('p','ck-status','Carregando pagamento seguro…'),mount=el('div','ck-mount');status.setAttribute('role','status');
 summary.append(el('span','ck-eyebrow',year?'PLANO ANUAL':'PLANO MENSAL'),el('h2','',plan.name),el('p','ck-price',year?money(Math.round(plan.amount/12))+'/mês':money(plan.amount)+'/mês'));
 if(year)summary.append(el('p','ck-note',`${money(plan.amount)} cobrados hoje, uma vez por ano · 2 meses grátis`));
 const list=el('ul','ck-list');for(const t of [`${plan.ads.toLocaleString('pt-BR')} anúncios por mês`,`Até ${plan.maxStores} lojas`,plan.chatConversations===null?'Atendimento ilimitado':`${plan.chatConversations.toLocaleString('pt-BR')} conversas de atendimento por mês`,`${plan.credits.toLocaleString('pt-BR')} créditos novos a cada mês`])list.append(el('li','',t));
 summary.append(list,el('p','ck-note','Créditos não usados expiram no fim de cada mês.'+(year?' No anual, os créditos continuam mensais.':'')),el('div','ck-total'));
 summary.lastChild.append(el('span','','Total hoje'),el('strong','',money(plan.amount)));
 summary.append(el('p','ck-fine',(mode==='test'?'Ambiente de teste: nenhum valor é cobrado. ':'')+'Pagamento processado pela Stripe. Renovação automática; cancele quando quiser, valendo ao fim do período.'));
 pay.append(status,mount);panel.append(close,summary,pay);overlay.append(panel);document.body.append(overlay);close.focus();
 let page,closed=false;const before=document.body.style.overflow;document.body.style.overflow='hidden';
 function shut(){if(closed)return;closed=true;try{page?.destroy()}catch{}overlay.remove();document.body.style.overflow=before;removeEventListener('keydown',esc);onClose?.()}
 const esc=e=>{if(e.key==='Escape')shut()};addEventListener('keydown',esc);close.onclick=shut;overlay.onclick=e=>{if(e.target===overlay)shut()};
 (async()=>{try{
  const open=key=>request('/api/app/billing/subscription/checkout',{method:'POST',csrfToken,body:{planId:plan.id,idempotency_key:key,embedded:true}});
  let r;try{r=await open(idempotencyKey)}catch(e){if(e.code!=='checkout_expired')throw e;const fresh=crypto.randomUUID();onNewKey?.(fresh);r=await open(fresh)}  // pagamento anterior expirou: abre um novo
  if(r.mode!==mode||r.embedded!==true||!/^cs_/.test(r.clientSecret||'')||!new RegExp('^pk_'+mode+'_').test(r.publishableKey||''))throw Error('Pagamento não confirmado pelo servidor.');
  const Stripe=await loadStripe();if(closed)return;const stripe=Stripe(r.publishableKey);
  const create=stripe.createEmbeddedCheckoutPage||stripe.initEmbeddedCheckout;page=await create.call(stripe,{clientSecret:r.clientSecret});
  if(closed){page.destroy();return}status.remove();page.mount(mount);
 }catch(e){if(!closed)status.textContent=e.message||'Pagamento indisponível agora.'}})();
 return{close:shut};
}
