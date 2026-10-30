import {request} from '../app/api.js';
const initial=new URLSearchParams(location.search),flow=initial.get('flow');
let token=new URLSearchParams(location.hash.slice(1)).get('token')||'';
export const emailFlow=['verify','reset'].includes(flow);
if(token)history.replaceState(null,'',location.pathname+(emailFlow?'?flow='+flow:''));
export async function configureEmail(getCsrf,message){
 const forgot=document.querySelector('[data-auth="Recuperação de senha"]');
 const verify=document.createElement('button');verify.type='button';verify.dataset.emailEntry='true';verify.className='text-button';verify.textContent='Confirmar meu email';document.querySelector('.signup').after(verify);
 verify.hidden=true;forgot.disabled=true;let provider=false;try{provider=(await request('/api/auth/email/status')).available===true}catch{}
 verify.hidden=!provider&&!emailFlow;forgot.disabled=!provider;forgot.title=provider?'':'Recuperação por email ainda não disponível.';
 function show(purpose,withToken=false){
  document.querySelectorAll('#login,#register-panel,.providers,.divider,.signup,.otp-panel').forEach(el=>el.hidden=true);verify.hidden=true;
  document.querySelector('#email-flow')?.remove();const form=document.createElement('form');form.id='email-flow';
  document.querySelector('.login-form h2').textContent=purpose==='reset'?'Recupere seu acesso.':'Confirme seu email.';
  if(withToken&&purpose==='reset')form.innerHTML='<label for="reset-password">Nova senha</label><input id="reset-password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required><label for="confirm-password">Repita a nova senha</label><input id="confirm-password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>';
  else if(!withToken)form.innerHTML='<label for="recovery-email">Seu email</label><input id="recovery-email" type="email" autocomplete="email" maxlength="254" required>';
  const button=document.createElement('button');button.className='primary';button.type='submit';button.textContent=withToken?(purpose==='reset'?'Salvar nova senha':'Confirmar email'):'Enviar link';form.append(button);
  const back=document.createElement('a');back.href='./';back.className='text-button';back.textContent='Voltar ao login';form.append(back);document.querySelector('#auth-status').before(form);
  if(!withToken&&!provider){button.disabled=true;message('Envio de email ainda não configurado. Nenhuma mensagem será enviada.',true)}else message(withToken?'Confirme abaixo. Este link é pessoal e de uso único.':'Enviaremos um link se houver uma conta elegível.');
  form.onsubmit=async e=>{e.preventDefault();if(button.disabled)return;let body,path;
   if(withToken){if(!token){message('Link inválido. Solicite um novo.',true);return}body={token};path='/api/auth/email/verify';if(purpose==='reset'){const password=form.querySelector('#reset-password').value;if(password!==form.querySelector('#confirm-password').value){message('As senhas precisam ser iguais.',true);return}body.password=password;path='/api/auth/password/reset'}}
   else{body={email:form.querySelector('#recovery-email').value.trim(),purpose};path='/api/auth/email/request'}
   button.disabled=true;try{const result=await request(path,{method:'POST',csrfToken:getCsrf(),body});message(withToken?(purpose==='reset'?'Senha alterada. Entre novamente; seu segundo fator permanece ativo, se configurado.':'Email confirmado. Você já pode voltar ao aplicativo.'):result.message);if(withToken){token='';form.querySelectorAll('input').forEach(x=>x.value='');button.hidden=true}}
   catch(error){message(error.message||'Não foi possível concluir. Tente novamente.',true)}finally{button.disabled=false}
  };
 }
 forgot.onclick=()=>show('reset');verify.onclick=()=>show('verify');if(emailFlow)show(flow,Boolean(token));
}
