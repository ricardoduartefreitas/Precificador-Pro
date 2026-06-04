// estado interno
var _tp='cnpj',_us=0,_dl=false;

function _norm(v){
  return String(v||'').trim().toUpperCase();
}

function _hex(buf){
  return Array.prototype.map.call(new Uint8Array(buf),function(b){
    return b.toString(16).padStart(2,'0');
  }).join('');
}

function _sha256(v){
  var txt=_norm(v);
  if(window.crypto&&window.crypto.subtle&&window.TextEncoder){
    return crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt)).then(_hex);
  }
  return Promise.reject(new Error('SHA-256 indisponível neste navegador.'));
}

function _lk(){
  return _CFG._x||[];
}

function _proAtivo(){
  try{
    var h=localStorage.getItem('_psp_h');
    return !!(h&&_lk().indexOf(h)>-1);
  }catch(e){
    return false;
  }
}

function _migrarLicencaAntiga(){
  try{
    if(localStorage.getItem('_psp_h'))return;
    var antiga=localStorage.getItem('_psp_k');
    if(!antiga)return;

    _sha256(antiga).then(function(h){
      if(_lk().indexOf(h)>-1){
        localStorage.setItem('_psp_h',h);
        localStorage.removeItem('_psp_k');
        _dl=true;
        _atuCont();
      }
    });
  }catch(e){}
}

function _renderBadge(){
  var b=document.getElementById('badge-contador');
  if(!b)return;

  if(_dl){
    b.innerHTML='<div class="pro-badge">PRO ∞</div>';
  }else{
    b.innerHTML='<div class="cn" id="counter-num">'+Math.max(0,_CFG.limite-_us)+'</div><div class="cl">cálculos</div>';
  }
}

function _atuCont(){

  _dl=_proAtivo();
  _renderBadge();

  var barra=document.getElementById('progress-fill');
  var usados=document.getElementById('progress-used');
  var wrap=document.getElementById('wrap-progresso');

  var p=Math.min(
    100,
    (_us/_CFG.limite)*100
  );

  if(wrap){
    wrap.style.display=_dl?'none':'';
  }

  if(barra){
    barra.style.width=p+'%';
  }

  if(usados){
    usados.textContent=_us;
  }

}

(function(){
  try{
    _us=parseInt(localStorage.getItem('_psp_u')||'0')||0;
    _dl=_proAtivo();
  }catch(e){}
  _atuCont();
  _migrarLicencaAntiga();
  if(!_dl&&_us>=_CFG.limite)document.getElementById('bloqueio').classList.add('show');
})();

function _abrirCompra(){window.open(_CFG.linkCompra,'_blank')}

function _abrirSenha(){
  document.getElementById('bloqueio').classList.remove('show');
  document.getElementById('campo-senha').value='';
  document.getElementById('senha-erro').style.display='none';
  document.getElementById('tela-senha').classList.add('show');
  setTimeout(function(){document.getElementById('campo-senha').focus()},300);
}

function _fecharSenha(){
  document.getElementById('tela-senha').classList.remove('show');
  if(!_dl&&_us>=_CFG.limite)document.getElementById('bloqueio').classList.add('show');
}

function _ativarSenha(){
  var campo=document.getElementById('campo-senha');
  var erro=document.getElementById('senha-erro');
  var sv=campo.value;

  _sha256(sv).then(function(h){
    if(_lk().indexOf(h)>-1){
      _dl=true;
      try{
        localStorage.setItem('_psp_h',h);
        localStorage.removeItem('_psp_k');
      }catch(e){}
      document.getElementById('tela-senha').classList.remove('show');
      document.getElementById('bloqueio').classList.remove('show');
      document.getElementById('tela-sucesso').classList.add('show');
      _atuCont();
    }else{
      erro.style.display='block';
      campo.style.borderColor='#cc2200';
      setTimeout(function(){campo.style.borderColor=''},1500);
    }
  }).catch(function(){
    erro.style.display='block';
    erro.textContent='Não foi possível validar a senha neste navegador.';
  });
}

function _fecharSucesso(){
  document.getElementById('tela-sucesso').classList.remove('show');
}
