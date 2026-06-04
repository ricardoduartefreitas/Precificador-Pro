function _fmt(v){return'R$ '+Math.abs(v).toFixed(2).replace('.',',')}
function _fmtP(v){return v.toFixed(1).replace('.',',')+'%'}
function _gf(p){var tb=_TB[_tp];for(var i=0;i<tb.length;i++)if(p<=tb[i].max)return tb[i];return tb[tb.length-1]}

function _st(t){
  _tp=t;
  ['cnpj','cpf0','cpf1'].forEach(function(k){document.getElementById('btn-'+k).className=k===t?'active':''});
  var info={cnpj:'18% comissão + 2% transação + R$4 fixo + R$1 serviço',cpf0:'18% comissão + 2% transação + R$4 fixo + R$1 serviço',cpf1:'18% comissão + 2% transação + R$4 fixo + R$1 serviço + R$3 CPF'};
  document.getElementById('taxa-info').textContent=info[t];
}

function _calc(){
  if(!_dl&&_us>=_CFG.limite){document.getElementById('bloqueio').classList.add('show');return}
  var cu=parseFloat(document.getElementById('custo').value)||0;
  var emb=parseFloat(document.getElementById('embalagem').value)||0;
  var ou=parseFloat(document.getElementById('outros').value)||0;
  var mg=parseFloat(document.getElementById('margem').value)||0;
  var campOn=document.getElementById('toggle-campanha').checked;
  var camp=campOn?0.025:0;
  var ab=document.getElementById('alert-box');
  if(cu<=0){ab.style.display='block';ab.className='alert warn';ab.textContent='⚠️ Digite o custo do produto para calcular.';return}
  var ct=cu+emb+ou;
  var ld=ct*(mg/100);
  var f=_gf((ct+ld)*1.5);
  var ft=f.f+f.s+f.x;
  var pt=(f.c+f.t)/100;
  var ptTotal=pt+camp;
  var pr=(ct+ld+ft)/(1-ptTotal);
  var fr=_gf(pr);
  if(fr.max!==f.max){f=fr;ft=f.f+f.s+f.x;pt=(f.c+f.t)/100;ptTotal=pt+camp;pr=(ct+ld+ft)/(1-ptTotal)}
  var pm=(ct+ft)/(1-ptTotal);
  var tC=pr*(f.c/100);
  var tT=pr*(f.t/100);
  var tF=f.f;
  var tS=f.s;
  var tX=f.x;
  var tCamp=pr*camp;
  var tTot=tC+tT+tF+tS+tX+tCamp;
  var liq=pr-ct-tTot;
  var psh=(tTot/pr)*100;
  var margReal=(liq/pr)*100;
  if(!_dl){_us++;try{localStorage.setItem('_psp_u',_us)}catch(e){}}
  _atuCont();
  document.getElementById('resultado').className='';
  document.getElementById('r-preco').textContent=_fmt(pr);
  document.getElementById('r-faixa').textContent='faixa: '+f.lb;
  document.getElementById('r-liquido').textContent=_fmt(liq);
  document.getElementById('r-minimo').textContent=_fmt(pm);
  document.getElementById('m-lucro').textContent=_fmt(liq);
  document.getElementById('m-lucro').className='mv '+(liq<0?'red':'green');
  document.getElementById('m-margem').textContent=margReal.toFixed(1).replace('.',',')+' %';
  document.getElementById('m-margem').className='mv '+(liq<0?'red':'green');
  document.getElementById('m-taxas').textContent=_fmt(tTot);
  document.getElementById('m-pct').textContent=_fmtP(psh);
  document.getElementById('e-venda').textContent=_fmt(pr);
  document.getElementById('e-custo-prod').textContent='− '+_fmt(cu);
  document.getElementById('e-embalagem').textContent='− '+_fmt(emb);
  document.getElementById('e-outros').textContent='− '+_fmt(ou);
  document.getElementById('e-comissao').textContent='− '+_fmt(tC);
  document.getElementById('e-transacao').textContent='− '+_fmt(tT);
  document.getElementById('e-fixo').textContent='− '+_fmt(tF);
  document.getElementById('e-servico').textContent='− '+_fmt(tS);
  document.getElementById('e-total-taxas').textContent='− '+_fmt(tTot);
  document.getElementById('e-lucro').textContent=_fmt(liq);
  document.getElementById('e-lucro').className='ev '+(liq<0?'neg':'pos');
  document.getElementById('row-cpf').style.display=f.x>0?'flex':'none';
  document.getElementById('row-campanha-ext').style.display=campOn?'flex':'none';
  document.getElementById('e-campanha').textContent='− '+_fmt(tCamp);
  if(liq<0){ab.style.display='block';ab.className='alert danger';ab.textContent='⚠️ Prejuízo! Aumente a margem ou reduza os custos.'}
  else if(!_dl&&_us>=25&&_us<_CFG.limite){ab.style.display='block';ab.className='alert warn';ab.textContent='⚠️ Restam apenas '+(_CFG.limite-_us)+' cálculos gratuitos.'}
  else{ab.style.display='none'}
  if(!_dl&&_us>=_CFG.limite){setTimeout(function(){document.getElementById('bloqueio').classList.add('show')},1500)}
}


