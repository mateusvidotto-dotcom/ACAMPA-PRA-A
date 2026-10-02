(() => {
  'use strict';

  const DATA = window.ATLAS_SECTIONS ? window.ATLAS_SECTIONS : [];
  const STORE = 'estudhub-ai-study-v3';
  const state = loadState();

  state.done ||= [];
  state.favorites ||= [];
  state.notes ||= {};
  state.theme ||= 'dark';
  state.quiz ||= null;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const normalize = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  let currentTrail = 'todos';
  let currentQuery = '';
  let listMode = false;

  const trails = [
    ['todos','Todas','Todo o conteúdo do Atlas.'],
    ['fundamentos','01 · Fundamentos','IA, algoritmos, Machine Learning e redes neurais.'],
    ['generativa','02 · IA generativa','LLMs, tokens e geração de conteúdo.'],
    ['sistemas','03 · Sistemas de IA','RAG, agentes e infraestrutura.'],
    ['riscos','04 · Riscos e responsabilidade','Erros, viés, privacidade e segurança.'],
    ['estudhub','05 · IA no EstudHub','Problema, persona, ideação e ferramentas.'],
    ['por_dentro','06 · Por dentro dos modelos','Logits, contexto e arquitetura.'],
    ['projeto','07 · Produto e aplicação','Mitos, futuro, dados e avaliação.'],
    ['site','08 · Narrativa do projeto','Como apresentar corretamente o uso de IA.'],
    ['usar_ia','09 · Como usar IA','Complementos práticos para estudar melhor.']
  ];

  const glossary = [
    ['IA','Inteligência Artificial'], ['ML','Machine Learning'], ['DL','Deep Learning'],
    ['LLM','Large Language Model'], ['Token','Unidade processada por um modelo'], ['Embedding','Representação numérica de informação'],
    ['Transformer','Arquitetura baseada em atenção'], ['RAG','Retrieval-Augmented Generation'], ['Agente','Sistema que pode planejar e usar ferramentas'],
    ['Logit','Pontuação produzida antes da transformação em probabilidade'], ['Softmax','Função que converte logits em distribuição'], ['Fine-tuning','Ajuste adicional de um modelo pré-treinado'],
    ['RLHF','Reinforcement Learning from Human Feedback'], ['Prompt','Entrada ou instrução fornecida ao sistema'], ['Confabulação','Conteúdo incorreto apresentado como plausível']
  ];

  const quizBank = [
    ['Qual afirmação representa melhor a visão do material?', ['IA é um único robô digital.','IA é um ecossistema de métodos e tecnologias.','IA é uma base de respostas prontas.','IA é necessariamente consciente.'],1,'A apresentação trata IA como um campo amplo, não como uma única tecnologia ou mente artificial.'],
    ['No aprendizado supervisionado, o modelo recebe:', ['Somente dados sem rótulos.','Exemplos acompanhados de respostas ou rótulos.','Somente recompensas de um ambiente.','Apenas regras escritas manualmente.'],1,'Supervisionado aprende com exemplos em que existe uma resposta ou rótulo associado.'],
    ['O que caracteriza RAG?', ['Treinar um modelo do zero.','Recuperar contexto relevante para apoiar a geração.','Aumentar automaticamente a temperatura.','Transformar texto em imagem.'],1,'RAG combina recuperação de informação com geração baseada no contexto recuperado.'],
    ['Qual frase combina com o princípio “humano no comando”?', ['IA sempre acerta.','IA substitui decisões humanas.','IA aumenta capacidade, mas não elimina responsabilidade.','IA entende o mundo como uma pessoa.'],2,'A apresentação posiciona a IA como copiloto, com análise e decisão humanas.'],
    ['Qual sequência é uma simplificação do pipeline de um LLM?', ['Prompt → tokens → representação → modelo → probabilidades → token.','Prompt → impressão → resposta.','Prompt → regra fixa → resposta.','Prompt → câmera → vídeo.'],0,'É a cadeia didática usada no material para explicar a geração token por token.'],
    ['O que são embeddings?', ['Senhas do modelo.','Representações numéricas que podem capturar relações.','Imagens geradas.','Arquivos executáveis.'],1,'Embeddings são usados em aplicações como busca semântica e recuperação de informação.'],
    ['Por que uma resposta pode parecer correta e ainda estar errada?', ['Porque toda IA é aleatória.','Fluência não garante veracidade.','Porque computadores não usam números.','Porque token sempre significa palavra inteira.'],1,'O material destaca confabulação/alucinação como uma limitação importante.'],
    ['Para que serve a curadoria humana?', ['Eliminar toda IA do projeto.','Analisar, verificar, corrigir e decidir sobre resultados.','Apenas revisar cores.','Deixar o modelo treinar sozinho.'],1,'A curadoria fecha o ciclo entre geração automática e produto final.'],
    ['Qual diferença está correta?', ['Treinamento usa modelo pronto; inferência cria parâmetros.','Treinamento ajusta parâmetros; inferência usa o modelo.','Treinamento e inferência são sinônimos.','Inferência é somente coleta de dados.'],1,'Treinamento aprende/ajusta parâmetros. Inferência executa um modelo treinado.'],
    ['Qual é uma função de um agente de IA?', ['Somente responder texto.','Planejar, usar ferramentas, agir e avaliar resultados.','Apenas classificar imagens.','Somente treinar redes neurais.'],1,'O conceito de agente envolve um ciclo de objetivo, planejamento, ferramentas, ação e avaliação.'],
    ['O que o softmax faz no pipeline apresentado?', ['Cria tokens.','Transforma logits em uma distribuição de probabilidades.','Busca PDFs.','Treina a GPU.'],1,'Na explicação matemática do material, softmax converte logits em valores entre 0 e 1 que somam 1.'],
    ['Qual é uma boa forma de estudar IA?', ['Decorar siglas sem entender.','Conectar definição, mecanismo, exemplo, limitação e aplicação.','Confiar em qualquer resposta de IA.','Evitar fontes.'],1,'Entender mecanismos e limites é mais útil do que apenas memorizar termos.']
  ];

  function loadState(){ try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } }
  function save(){ try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} updateDashboard(); }
  function allSections(){ return DATA; }
  function allTopics(){ return DATA.map(s => ({...s, num: Number(s.num)})); }
  function topicByNum(n){ return DATA.find(s => Number(s.num) === Number(n)); }
  function toast(msg){ const t = $('#toast'); if (!t) return; t.textContent=msg; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),2200); }

  function renderTrailNav(){
    const nav = $('#trailNav');
    nav.innerHTML = trails.map(([key,label,desc]) => `
      <button class="trail-btn ${currentTrail===key?'active':''}" data-trail="${esc(key)}" type="button" aria-pressed="${currentTrail===key}">
        <span class="trail-num">${key==='todos'?'◎':esc(label.slice(0,2))}</span><span><strong>${esc(label)}</strong><small>${esc(desc)}</small></span>
      </button>`).join('');
  }

  function searchable(s){ return normalize([s.num,s.title,s.group,s.groupLabel,s.plain,s.body].join(' ')); }

  function filtered(){
    const q = normalize(currentQuery);
    return DATA.filter(s => {
      const trailOk = currentTrail==='todos' || s.group===currentTrail;
      const queryOk = !q || searchable(s).includes(q);
      return trailOk && queryOk;
    });
  }

  function renderTopics(){
    const items = filtered();
    const grid = $('#topicGrid');
    grid.classList.toggle('list-mode', listMode);
    grid.innerHTML = items.map((s,i) => {
      const done = state.done.includes(String(s.num));
      const fav = state.favorites.includes(String(s.num));
      const note = Boolean(state.notes[String(s.num)]?.trim());
      const preview = s.plain ? s.plain.replace(/\s+/g,' ').slice(0,220) : '';
      return `
        <article class="atlas-card ${done?'done':''}" data-num="${s.num}">
          <div class="card-top"><span class="card-num">${String(s.num).padStart(2,'0')}</span><span class="card-group">${esc(s.groupLabel || s.group)}</span><div class="card-actions">
            <button class="mini-icon ${fav?'active':''}" data-action="favorite" aria-label="${fav?'Remover dos favoritos':'Adicionar aos favoritos'}" aria-pressed="${fav}" type="button">★</button>
            <button class="mini-icon ${done?'active':''}" data-action="done" aria-label="${done?'Marcar como não concluído':'Marcar como concluído'}" aria-pressed="${done}" type="button">✓</button>
          </div></div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(preview)}${preview.length>=220?'…':''}</p>
          <div class="card-tags"><span>${note?'✎ anotação':''}</span></div>
          <div class="card-footer"><button class="open-btn" data-action="open" type="button">Ler e estudar <span>→</span></button><button class="card-note ${note?'has-note':''}" data-action="note" type="button">${note?'✎ Editar':'✎ Anotar'}</button></div>
        </article>`;
    }).join('');

    $('#resultLine').textContent = `${items.length} ${items.length===1?'tópico':'tópicos'}${currentQuery?` encontrados para “${currentQuery}”`:''}`;
    $('#emptyResults').hidden = items.length!==0;
    setupReveal();
  }

  function renderActiveTrail(){
    const t = trails.find(x=>x[0]===currentTrail) || trails[0];
    $('#activeTrail').innerHTML = `<span>${esc(t[1])}</span><p>${esc(t[2])}</p>`;
  }

  function renderHub(){
    const hub = DATA.filter(x=>x.group==='estudhub').slice(0,13);
    $('#hubFlow').innerHTML = hub.map((s,i)=>`<button class="hub-step" data-num="${s.num}" type="button"><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(s.title.replace(/^Etapa \d+ — /,'').replace(/^E é exatamente aqui que entra o EstudHub$/,'O EstudHub'))}</strong><small>${esc((s.plain||'').slice(0,90))}${(s.plain||'').length>90?'…':''}</small></button>`).join('');
  }

  function renderGlossary(){
    $('#glossaryGrid').innerHTML = glossary.map(([term,desc])=>`<button class="glossary-item" data-term="${esc(term)}" type="button"><strong>${esc(term)}</strong><span>${esc(desc)}</span></button>`).join('');
  }

  function renderSources(){
    const sources = [
      ['NIST CSRC','Definição de Inteligência Artificial.','https://csrc.nist.gov/glossary/term/artificial_intelligence','Institucional'],
      ['NIST AI RMF','Framework de gerenciamento de riscos de IA.','https://www.nist.gov/itl/ai-risk-management-framework','Institucional'],
      ['Google for Developers','Machine Learning Crash Course.','https://developers.google.com/machine-learning/crash-course','Técnica'],
      ['Google Cloud','Glossário e conceitos de IA generativa.','https://docs.cloud.google.com/docs/generative-ai/glossary','Técnica'],
      ['Vaswani et al.','Attention Is All You Need — Transformer.','https://arxiv.org/abs/1706.03762','Pesquisa'],
      ['UNESCO','IA generativa em educação e pesquisa.','https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research','Educação'],
      ['Figma AI','IA aplicada a design e prototipagem.','https://www.figma.com/ai/','Ferramenta'],
      ['Canva','Magic Design e ferramentas de IA.','https://www.canva.com/help/use-magic-design/','Ferramenta'],
      ['Google AI','Estratégias de engenharia de prompts.','https://ai.google.dev/gemini-api/docs/prompting-strategies','Prática'],
      ['OWASP','Riscos para aplicações LLM e GenAI.','https://genai.owasp.org/llm-top-10/','Segurança']
    ];
    $('#sourceGrid').innerHTML = sources.map(s=>`<a class="source-card" href="${s[2]}" target="_blank" rel="noopener noreferrer"><span>${s[3]}</span><strong>${s[0]}</strong><p>${s[1]}</p><small>Consultar ↗</small></a>`).join('');
  }

  function renderNotes(){
    const area = $('#notesArea');
    const notes = Object.entries(state.notes).filter(([,v])=>v?.trim()).map(([num,value])=>({topic:topicByNum(num),value})).filter(x=>x.topic);
    if(!notes.length){ area.innerHTML=`<div class="empty-notes"><span>✎</span><strong>Seu caderno ainda está vazio.</strong><p>Abra qualquer tópico e escreva uma anotação.</p></div>`; return; }
    area.innerHTML = `<div class="notes-grid">${notes.map(n=>`<article class="note-card"><span>${esc(n.topic.groupLabel||n.topic.group)}</span><h3>${esc(n.topic.title)}</h3><p>${esc(n.value)}</p><button type="button" data-note-topic="${n.topic.num}">Abrir tópico →</button></article>`).join('')}</div>`;
    $$('[data-note-topic]',area).forEach(b=>b.addEventListener('click',()=>openTopic(b.dataset.noteTopic)));
  }

  function openTopic(num){
    const s = topicByNum(num); if(!s) return;
    const done = state.done.includes(String(s.num));
    const fav = state.favorites.includes(String(s.num));
    const note = state.notes[String(s.num)] || '';
    const related = DATA.filter(x=>x.group===s.group && x.num!==s.num).slice(0,3);
    $('#dialogBody').innerHTML = `
      <div class="dialog-top"><span>${String(s.num).padStart(2,'0')}</span><em>${esc(s.groupLabel||s.group)}</em>${s.badge?`<b>${esc(s.badge)}</b>`:''}</div>
      <h1>${esc(s.title)}</h1>
      ${s.body || `<p>${esc(s.plain||'')}</p>`}
      ${s.sources?.length ? `<div class="dialog-sources"><strong>Referências do tópico</strong>${s.sources.map(x=>`<a href="${x}" target="_blank" rel="noopener noreferrer">${x} ↗</a>`).join('')}</div>`:''}
      <div class="dialog-studybar">
        <button class="btn btn-primary" id="dialogDone" type="button">${done?'✓ Concluído':'Marcar como concluído'}</button>
        <button class="btn btn-ghost" id="dialogFav" type="button">${fav?'★ Favorito':'☆ Favoritar'}</button>
        <button class="btn btn-ghost" id="dialogNote" type="button">✎ ${note?'Editar anotação':'Anotar'}</button>
      </div>
      ${related.length?`<div class="dialog-related"><strong>Continue nesta trilha</strong><div>${related.map(r=>`<button type="button" data-related="${r.num}">${esc(r.title)} →</button>`).join('')}</div></div>`:''}
    `;
    $('#topicDialog').showModal();
    $('#dialogDone').onclick=()=>{ toggleDone(String(s.num)); openTopic(s.num); };
    $('#dialogFav').onclick=()=>{ toggleFavorite(String(s.num)); openTopic(s.num); };
    $('#dialogNote').onclick=()=>{ editNote(String(s.num)); openTopic(s.num); };
    $$('[data-related]').forEach(b=>b.addEventListener('click',()=>openTopic(b.dataset.related)));
  }

  function toggleDone(num){
    num=String(num); state.done = state.done.includes(num) ? state.done.filter(x=>x!==num) : [...state.done,num]; save(); renderTopics(); toast(state.done.includes(num)?'Tema marcado como concluído.':'Tema reaberto.');
  }
  function toggleFavorite(num){
    num=String(num); state.favorites = state.favorites.includes(num) ? state.favorites.filter(x=>x!==num) : [...state.favorites,num]; save(); renderTopics(); toast(state.favorites.includes(num)?'Adicionado aos favoritos.':'Removido dos favoritos.');
  }
  function editNote(num){
    const s=topicByNum(num); if(!s) return;
    const old=state.notes[String(num)]||'';
    const value=window.prompt(`Anotação — ${s.title}\n\nEscreva com suas palavras, registre uma dúvida ou uma conexão:`,old);
    if(value===null) return;
    if(value.trim()) state.notes[String(num)]=value.trim(); else delete state.notes[String(num)];
    save(); renderTopics(); renderNotes(); toast(value.trim()?'Anotação salva.':'Anotação removida.');
  }

  function updateDashboard(){
    const total=DATA.length||1, done=state.done.length, percent=Math.round((done/total)*100);
    $('#statTopics').textContent=DATA.length; $('#doneCount').textContent=done; $('#favoriteCount').textContent=state.favorites.length; $('#noteCount').textContent=Object.values(state.notes).filter(Boolean).length; $('#progressPercent').textContent=`${percent}%`;
  }

  function setupReveal(){
    const items=$$('.reveal-card, .reveal, .atlas-card:not(.seen)');
    if(!('IntersectionObserver' in window)){items.forEach(i=>i.classList.add('seen')); return;}
    if(!setupReveal.observer){setupReveal.observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen'); setupReveal.observer.unobserve(e.target);}}),{threshold:.08});}
    items.forEach(i=>setupReveal.observer.observe(i));
  }

  function buildQuiz(){
    const list=[...quizBank].sort(()=>Math.random()-.5).slice(0,6);
    const area=$('#quizArea');
    area.innerHTML=list.map((q,qi)=>`<article class="quiz-card" data-q="${qi}"><span>QUESTÃO ${String(qi+1).padStart(2,'0')}</span><h3>${esc(q[0])}</h3><div class="quiz-options">${q[1].map((o,oi)=>`<button type="button" data-answer="${oi}"><b>${String.fromCharCode(65+oi)}</b>${esc(o)}</button>`).join('')}</div><div class="quiz-feedback" hidden></div></article>`).join('');
    area.__quiz=list;
    $$('.quiz-card',area).forEach((card,qi)=>$$('[data-answer]',card).forEach(btn=>btn.addEventListener('click',()=>answerQuiz(card,qi,Number(btn.dataset.answer)))));
  }

  function answerQuiz(card,qi,chosen){
    if(card.classList.contains('answered')) return;
    const q=$('#quizArea').__quiz[qi], correct=chosen===q[2]; card.classList.add('answered');
    $$('[data-answer]',card).forEach(b=>{b.disabled=true; const v=Number(b.dataset.answer); if(v===q[2]) b.classList.add('correct'); if(v===chosen && !correct) b.classList.add('wrong');});
    const f=$('.quiz-feedback',card); f.hidden=false; f.innerHTML=`<strong>${correct?'✅ Correto':'❌ Revise este conceito'}</strong><span>${esc(q[3])}</span>`;
    const cards=$$('.quiz-card',$('#quizArea')); const answered=cards.filter(c=>c.classList.contains('answered')).length;
    if(answered===cards.length){ const score=cards.filter(c=>$('.correct',c) && [...$$('[data-answer]',c)].some(b=>b.classList.contains('correct'))).length; state.quiz={score,total:cards.length}; save(); toast(`Revisão concluída: ${score}/${cards.length}.`); }
  }

  function resetAllFilters(){ currentTrail='todos'; currentQuery=''; $('#searchInput').value=''; renderTrailNav(); renderActiveTrail(); renderTopics(); }

  // Events
  $('#trailNav').addEventListener('click',e=>{const b=e.target.closest('[data-trail]');if(!b)return;currentTrail=b.dataset.trail;renderTrailNav();renderActiveTrail();renderTopics();});
  $('#topicGrid').addEventListener('click',e=>{const card=e.target.closest('.atlas-card'); const btn=e.target.closest('[data-action]'); if(!card||!btn)return; const num=card.dataset.num; if(btn.dataset.action==='open')openTopic(num); if(btn.dataset.action==='done')toggleDone(num); if(btn.dataset.action==='favorite')toggleFavorite(num); if(btn.dataset.action==='note')editNote(num);});
  $('#searchInput').addEventListener('input',e=>{currentQuery=e.target.value.trim();renderTopics();});
  $('#clearSearch').addEventListener('click',()=>{$('#searchInput').value='';currentQuery='';renderTopics();$('#searchInput').focus();});
  $('#resetBtn').addEventListener('click',resetAllFilters);
  $$('.view-toggle button').forEach(b=>b.addEventListener('click',()=>{$$('.view-toggle button').forEach(x=>x.classList.remove('active'));b.classList.add('active');listMode=b.dataset.view==='list';renderTopics();}));
  $$('.tool-card').forEach(b=>b.addEventListener('click',()=>document.querySelector(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
  $('#startBtn').addEventListener('click',()=>document.querySelector('#explorar').scrollIntoView({behavior:'smooth'}));
  $('#randomBtn').addEventListener('click',()=>openTopic(DATA[Math.floor(Math.random()*DATA.length)].num));
  $('#newQuizBtn').addEventListener('click',buildQuiz);
  $('#clearNotesBtn').addEventListener('click',()=>{if(!Object.keys(state.notes).length)return toast('Não há anotações.');if(!confirm('Apagar todas as anotações deste navegador?'))return;state.notes={};save();renderNotes();renderTopics();toast('Anotações apagadas.');});
  $('#glossaryGrid').addEventListener('click',e=>{const b=e.target.closest('[data-term]');if(!b)return;$('#searchInput').value=b.dataset.term;currentQuery=b.dataset.term;currentTrail='todos';renderTrailNav();renderActiveTrail();renderTopics();document.querySelector('#explorar').scrollIntoView({behavior:'smooth'});});
  $('#hubFlow').addEventListener('click',e=>{const b=e.target.closest('[data-num]');if(b)openTopic(b.dataset.num);});
  $('#dialogClose').addEventListener('click',()=>$('#topicDialog').close());
  $('#topicDialog').addEventListener('click',e=>{if(e.target.id==='topicDialog')$('#topicDialog').close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#topicDialog').open)$('#topicDialog').close();});

  $('#themeBtn').addEventListener('click',()=>{state.theme=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=state.theme;save();});

  $('#menuBtn').addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);$('#menuBtn').setAttribute('aria-expanded',String(open));});
  $$('.topnav a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');$('#menuBtn').setAttribute('aria-expanded','false');}));

  document.documentElement.dataset.theme=state.theme;
  renderTrailNav(); renderActiveTrail(); renderTopics(); renderHub(); renderGlossary(); renderSources(); renderNotes(); buildQuiz(); updateDashboard(); setupReveal();
})();
