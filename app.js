/* Кипер рассказывает — движок сцены */
(() => {
const API = 'https://ai-character-platform.onrender.com/api/chat';
const $ = id => document.getElementById(id);
const app = $('app'), keeper = $('keeper'), lineEl = $('line'), optsEl = $('opts'), floor = $('floor');

/* ---------- данные ---------- */
/* Альбом: рисунки (имя файла, соотношение сторон), первая реплика, есть ли чат */
const PEOPLE = {
  keeper:        {name:'Кипер',    works:[['keeper_paper',.715]], hello:'Тсс. Не шевелись. Ты стоишь на моём вчера. Вот. Теперь можно.'},
  dream:         {name:'Дрим',     works:[['dream',.739],['dream_2',1.363]], hello:'Я здесь. Что у тебя?'},
  weaver:        {name:'Вивер',    works:[['weaver',1.618],['weaver_forest',1.472],['weaver_symbol',.738]], hello:'О! Ты кто? Ты тоже застреваешь в корнях?'},
  liora:         {name:'Лиора',    works:[['liora',.757]], hello:'Ох. Садись ближе, здесь тепло.'},
  drpak:         {name:'Пак',      works:[['pak',.745]], hello:'Ты по делу? Если нет, тоже говори. Только короче.'},
  crystal:       {name:'Кристалл', works:[['crystal',1.401]], hello:'Вы так стараетесь убежать друг от друга, что забыли, как звучите вместе.'},
  cat:           {name:'Кот',      works:[['cat',1.412]], hello:'О. Привет. Ты тоже не спишь?'},
  dryad:         {name:'Дриада',   works:[['dryad',.75]], sleeps:'Она спит. Здесь можно только смотреть.'},
  angry_forest:  {name:'Злой Лес', works:[['forest',1.41],['forest_2',1.512]], hello:'Всё, от чего тебя спасли, до сих пор живёт во мне.'},
  shiny:         {name:'Шайни',    works:[['shiny',1.41]], hello:'Этот свет не для продажи.'},
  shiny_bro:     {name:'Брат',     works:[], hello:'К ней — только через меня.'},
  talk_mushroom: {name:'Гриб',     works:[['grib',.72]], hello:'Высота пахнет иначе, когда ты наконец перестаёшь бояться упасть.'},
};
const face = id => { const w = (PEOPLE[id]||{}).works; return w && w.length ? `assets/img/${w[0][0]}.jpg?v=3` : ''; };
/* Звук мира: порядок пластинок и наклейки; треки – в assets/songs.js */
const SHELF = [['dream','Дрим','dream'],['cat','Кот','cat'],['weaver','Вивер','weaver'],['crystal','Кристалл','crystal'],
  ['keeper','Кипер','keeper_paper'],['shiny','Шайни','shiny'],['shiny_bro','Брат',''],['liora','Лиора','liora'],
  ['drpak','Пак','pak'],['dryad','Дриада','dryad'],['talk_mushroom','Гриб','grib'],['angry_forest','Злой Лес','forest']];
const BRO_PH = 'Брат вышел за бурбоном. Скоро вернётся.';
const TITLES = ['Перед первым криком','Мир стал меньше','Возможно, жук','Янтарная тишина','Встреча','Бег','Просто скажи «нет»','Операция','Крыша','Прикосновение','Запах высоты','Ноктюрн','Цена','Шипы'];

/* кадры чтения: [начало абзаца, рисунок, движение камеры, действие Кипера] */
const FRAMES = {
  0: [['', 'dryad','pan-up'], ['Рядом с ней остался Кипер','keeper_paper','pan-in','look'], ['Только Дрим не оставлял','dream','pan-down'],
      ['Особенно когда внутри','dream','pan-in'], ['Пак действовал','pak','pan-in'], ['Лиора садилась','liora','pan-up'],
      ['Кристалл настраивал','crystal','pan-left'], ['Кот появился позже','cat','pan-left'], ['А выведенная Жажда','forest','pan-down'],
      ['За пределами Сада','fallow','pan-still'], ['На Земле сменялись','dryad','pan-in'], ['Пока однажды Дрим','dryad','pan-down'],
      ['Ветви над Дримом опять','dryad','pan-down','weave']],
  1: [['', 'dryad','pan-down'], ['Раньше Вивер помещалась','weaver','pan-up'], ['Вивер остановилась рядом','dream','pan-in'],
      ['Они дошли до края Сада','dream','pan-left'], ['— Я пойду к Лиоре','liora','pan-left'], ['Он постоял ещё немного','dryad','pan-down']],
  2: [['', 'keeper_paper','pan-in'], ['Дрим провёл рукой по стволу','dryad','pan-up'], ['— Я хочу знать, кто такая Вивер','dream','pan-in'],
      ['Кипер медленно повернул','keeper_paper','pan-in'], ['Он поскрёб рогом о дерево','keeper_paper','pan-in','scratch'], ['Жук снова появился','dryad','pan-down']],
};

/* сцены */
const N = {
  start: {steps:[
      {act:'scratch', note:'Кипер чешется рогом о кору.'},
      {act:'look', say:'О. Ты надолго?'},
      {act:'twitch', say:'Впрочем, откуда тебе знать. Я вот тоже не знаю, надолго ли я. Садись. Я хочу рассказать тебе одну историю.'},
      {say:'Она ещё не закончилась. Или уже? Нет. Не стал бы я рассказывать закончившуюся, это невежливо по отношению к концу.'}],
    opts:[{label:'Я слушаю', go:'listen'}, {label:'А ты кто?', go:'who'}]},
  who: {steps:[{say:'Кипер. Я здесь всё храню.'}, {act:'look', note:'Смотрит под себя.', say:'Почти всё. Жука опять потерял. Но историю пока помню. Она больше жука, её труднее потерять.'}],
    opts:[{label:'Ну рассказывай', go:'pro_in'}]},
  listen: {steps:[{say:'Хорошо. Хорошо. Это редкость. Обычно слушаю я.'}], next:'pro_in'},
  pro_in: {steps:[
      {say:'С чего бы… С начала? Начало было до начала, я его плохо вижу.'},
      {say:'С Дриады? Она спит. Разговора не получится. С Дрима? Он сейчас занят. Он тогда тоже был занят…'},
      {act:'twitch', note:'Перестаёт чесаться. Замирает.', say:'А потом кто-то закричал.'},
      {say:'Подними. Аккуратно. Она была совсем маленькая.'}],
    object:{kind:'chitin', label:'осколок хитина', go:'pro_read'}},
  pro_read: {read:0, then:'pro_after'},
  pro_after: {steps:[{say:'Он не знал, как её держать. Столько лапок и всего две руки. Несправедливая арифметика.'}],
    opts:[{label:'А что было дальше?', go:'ch1_in'}]},
  pro_song: {steps:[{say:'Он потом про неё пел. Мне он этого не говорил. Но я слышал.'}],
    opts:[{label:'Послушать Дрима', song:'dream'}, {label:'Дальше', go:'ch1_in', tap:true}]},
  ch1_in: {steps:[
      {act:'stuck', note:'Кипер пытается пролезть между двумя ветвями, застревает, пятится.'},
      {say:'Между прочим, очень неприятное чувство. И совершенно необязательно об этом рассказывать всем.'},
      {say:'Вот тут. Она полезла туда, куда лазила всегда. А «всегда» – штука ненадёжная.'}],
    object:{kind:'scratch', label:'царапина на корне', go:'ch1_read'}},
  ch1_read: {read:1, then:'ch1_after'},
  ch1_after: {steps:[{say:'Корень остался прежним. Так все говорят. А корни, между прочим, тоже растут. Только внутрь.'}],
    opts:[{label:'Кипер, он же тебя зовёт', go:'ch1_call'}]},
  ch1_call: {steps:[{act:'look', note:'Делает вид, что не слышит. Потом всё-таки оборачивается.', say:'Я слышал. Я просто был занят. Важным.'}], next:'ch2_in'},
  ch2_in: {steps:[{act:'listen', say:'Вот он. Не дави. Он хотя бы знает, куда идёт.'}], bug:{go:'ch2_read'}},
  ch2_read: {read:2, then:'ch2_after'},
  ch2_after: {steps:[{say:'Это я хорошо сказал. Я редко понимаю, что говорю. Но это не значит…'}],
    opts:[{label:'…что ты ошибаешься', go:'ch2_here'}]},
  ch2_here: {steps:[{act:'twitch', say:'Вот. Ты уже почти здешний. Или здешняя. Я не разглядел.'}, {say:'Про меня, кстати, тоже есть песня. Я её не слушал. Вдруг там правда.'}],
    opts:[{label:'Послушать Кипера', song:'keeper'}, {label:'А что дальше?', go:'later'}]},
  later: {steps:[{act:'listen', say:'Дальше кто-то поёт. Слышишь? Нет? Значит, ещё рано.'}, {say:'Приходи потом. Я никуда не денусь. Это моя главная работа – никуда не деваться.'}],
    opts:[{label:'Начать сначала', reset:true, tap:true}]},
  back: {steps:[{act:'look', note:'Смотрит на тебя, потом на оставленные вещи.', say:'А, это ты. Я ничего не трогал. Почти.'}],
    opts:[{label:'Продолжим историю', resume:true}, {label:'Хочу кое с кем поговорить', panel:'people'}, {label:'Давай музыку', panel:'music'}]},
  whom: {steps:[{say:'С кем? Я всех помню. Почти.'}], dyn:'whom'},
  music: {steps:[{say:'Музыку я храню в янтаре. Вот, что уже звучало.'}], dyn:'music'},
};
const RESUMABLE = new Set(['start','pro_in','pro_after','pro_song','ch1_in','ch1_after','ch2_in','ch2_after','ch2_here','later']);

/* ---------- состояние ---------- */
let S = {node:null, resume:'start', read:0, chats:{}, met:[], heard:[]};
try { Object.assign(S, JSON.parse(localStorage.getItem('keeper-state') || '{}')); } catch(e) {}
const save = () => { try { localStorage.setItem('keeper-state', JSON.stringify(S)); } catch(e) {} };

/* ---------- корни ---------- */
const roots = $('roots');
const rnd = (a,b) => a + Math.random()*(b-a);
function drawRoots(){   // Нити растут снизу вверх
  const W = innerWidth, H = innerHeight; roots.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let g = ''; const n = Math.round(W/55);
  for (let i=0;i<n;i++){
    const x = rnd(0,W), len = rnd(.08,.4)*H; let d = `M${x.toFixed(1)} ${H}`, cx = x;
    const k = Math.max(3, Math.round(len/80));
    for (let j=1;j<=k;j++){ const ny = H - len*j/k, nx = x + rnd(-14,14); d += ` Q${(cx+rnd(-14,14)).toFixed(1)} ${(ny+len/k/2).toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`; cx = nx; }
    if (Math.random()<.5){ const by = H - len*rnd(.3,.7); d += ` M${(x+rnd(-8,8)).toFixed(1)} ${by.toFixed(1)} q${rnd(-30,30).toFixed(1)} ${(-rnd(20,50)).toFixed(1)} ${rnd(-50,50).toFixed(1)} ${(-rnd(40,110)).toFixed(1)}`; }
    g += `<g class="sway up" style="--d:${rnd(7,13).toFixed(1)}s;--a:${rnd(.4,1.2).toFixed(2)}deg"><path class="grow" pathLength="1" style="animation-delay:${rnd(0,1.5).toFixed(2)}s" d="${d}" stroke-width="${rnd(.6,1.6).toFixed(2)}" opacity="${rnd(.12,.4).toFixed(2)}"/></g>`;
  }
  roots.innerHTML = g;
}
drawRoots(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawRoots, 250); });

/* ---------- Кипер: моргание, действия, жук на роге ---------- */
const lids = [$('lidL'), $('lidR')];
function setLids(c){ lids.forEach(l => { l.classList.toggle('open', !c); l.style.transform = c ? 'translateY(0px)' : `translateY(-${l.id==='lidL'?400:280}px)`; }); }
function blink(d){ setLids(true); setTimeout(() => { setLids(false); if (d) setTimeout(() => blink(false), 220); }, 130); }
(function loop(){ setTimeout(() => { blink(Math.random()<.25); loop(); }, 2600 + Math.random()*4200); })();
function act(name){ if (!name) return; const c = 'a-'+name; keeper.classList.remove(c); void keeper.offsetWidth; keeper.classList.add(c);
  setTimeout(() => keeper.classList.remove(c), 2600); if (name==='look'||name==='twitch') blink(false); }
const BF = [0,1,2,3].map(i => `assets/img/bug${i}.png`); let fr = 0;
setInterval(() => { fr = (fr+1)%4; document.querySelectorAll('.bugframe').forEach(b => b.setAttribute('href', BF[fr])); const w = $('walkBug'); if (!w.hidden) w.src = BF[fr]; }, 110);
const hornBug = $('hornBug'), HP = [[1560,900],[1620,760],[1700,560],[1800,260]];
function hornCrawl(){ const pts = Math.random()<.5 ? HP : [...HP].reverse(); let s=0,t=0; hornBug.setAttribute('opacity',1);
  const step = () => { t += .006; if (t>=1){ t=0; s++; if (s>=pts.length-1){ hornBug.setAttribute('opacity',0); setTimeout(hornCrawl, 12000+Math.random()*12000); return; } }
    const a=pts[s], b=pts[s+1], x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t, ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI+90;
    hornBug.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`); requestAnimationFrame(step); }; step(); }
setTimeout(hornCrawl, 9000);
const POKES = ['Тсс. Не шевелись. Ты стоишь на моём вчера. Вот. Теперь можно.','Я помню всё. Только не по порядку.','Ты не видел жука? Маленький, тёмный. Всё время куда-то идёт.','Ноги – ужасная вещь. Чем их больше, тем труднее притворяться, что стоишь на месте.','Хорошо. Хорошо.'];
function swayNote(){ const n = $('note'); n.classList.remove('swing'); void n.offsetWidth; n.classList.add('swing'); }
setInterval(() => { if (Math.random() < .35) swayNote(); }, 14000);
keeper.addEventListener('click', () => { swayNote(); if (app.classList.contains('mode-read')) return; act('twitch'); if (!busy) showLine(POKES[Math.floor(Math.random()*POKES.length)]); });

/* ---------- реплики ---------- */
let busy = false, timer = null, token = 0;
function showLine(text, note){
  lineEl.innerHTML = (note ? `<span class="act">${esc(note)}</span>` : '') + esc(text || '');
}
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function go(id){
  const n = N[id]; if (!n) return;
  const my = ++token; S.node = id; if (RESUMABLE.has(id)) S.resume = id; save();
  optsEl.innerHTML = ''; floor.innerHTML = ''; hideBug();
  if (n.read !== undefined) return startRead(n.read, n.then);
  app.className = 'mode-talk'; document.body.classList.remove('reading');
  busy = true; let i = 0;
  const next = () => {
    if (my !== token) return;
    optsEl.innerHTML = ''; clearTimeout(timer);
    if (i >= n.steps.length){ busy = false; return finish(n, my); }
    const s = n.steps[i++]; act(s.act); showLine(s.say || '', s.note);
    if (!s.say){ timer = setTimeout(next, 1800); return; }          // только действие – идём дальше сами
    if (i < n.steps.length || n.next){                               // ждём нажатия
      const b = document.createElement('button'); b.className = 'tapnext'; b.textContent = 'дальше ▸';
      b.onclick = next; optsEl.appendChild(b); lineEl.onclick = next;
    } else next();
  };
  next();
}
function finish(n, my){
  lineEl.onclick = null;
  if (n.next) return go(n.next);
  if (n.object) return showObject(n.object);
  if (n.bug) return startBug(n.bug);
  let opts = n.opts || [];
  if (n.dyn === 'whom') opts = S.met.map(id => ({label: PEOPLE[id].name, chat:id})).concat([{label:'Никого. Рассказывай дальше', resume:true, tap:true}]);
  if (n.dyn === 'music') opts = S.heard.length ? S.heard.map(id => ({label: (songs(id)[0]||{}).title||id, song:id})).concat([{label:'Хватит музыки', resume:true, tap:true}])
                                              : (showLine('Ещё ничего не звучало. Сначала история, потом песни. Так честнее.'), [{label:'Тогда история', resume:true}]);
  opts.forEach((o, k) => {
    const b = document.createElement('button'); b.className = 'opt' + (o.tap ? ' tap' : '') + (o.song ? ' song' : '');
    b.textContent = o.label; b.style.animationDelay = (k*90)+'ms';
    b.onclick = () => choose(o); optsEl.appendChild(b);
  });
}
function choose(o){
  if (o.go) return go(o.go);
  if (o.resume) return go(S.resume && S.resume !== 'back' ? S.resume : 'start');
  if (o.chat) return openChat(o.chat, o.label.includes(',') ? o.label.split(', ').slice(1).join(', ') : null);
  if (o.song) return openSong(o.song);
  if (o.panel) return openPanel(o.panel);
  if (o.reset) return $('resetBtn').click();
}

/* ---------- предметы ---------- */
const THING_SVG = {
  chitin: '<svg width="64" height="64" viewBox="0 0 64 64"><path d="M14 40 C18 22 34 12 50 16 C46 28 40 44 22 50 Z" fill="none" stroke="#ffd58a" stroke-width="1.6"/><path d="M20 44 C28 34 36 26 46 20 M24 36 c4 1 8 0 12-3" fill="none" stroke="#e2a543" stroke-width="1"/></svg>',
  scratch: '<svg width="96" height="54" viewBox="0 0 96 54"><path d="M4 40 C24 30 40 34 60 26 C72 21 84 22 92 18" fill="none" stroke="#9a9287" stroke-width="1.4"/><path d="M30 33 l14 -5 M34 37 l16 -6" stroke="#ffd58a" stroke-width="1.6" stroke-linecap="round"/></svg>',
};
function showObject(o){
  const b = document.createElement('button'); b.className = 'thing'; b.setAttribute('aria-label', o.label);
  b.innerHTML = THING_SVG[o.kind] + `<span>${esc(o.label)}</span>`; b.onclick = () => go(o.go); floor.appendChild(b);
}

/* ---------- жук ---------- */
const wb = $('walkBug'); let bugTries = 0, bugMove;
function hideBug(){ wb.hidden = true; clearInterval(bugMove); }
function placeBug(){ const x = rnd(.15,.85)*innerWidth, y = rnd(.55,.8)*innerHeight; const r = Math.atan2(y-parseFloat(wb.style.top||y), x-parseFloat(wb.style.left||x))*180/Math.PI+90;
  wb.style.transform = `rotate(${r}deg)`; wb.style.left = x+'px'; wb.style.top = y+'px'; }
function startBug(b){
  wb.hidden = false; wb.style.left = (innerWidth*.1)+'px'; wb.style.top = (innerHeight*.7)+'px'; placeBug();
  bugMove = setInterval(placeBug, 2400); bugTries = 0;
  wb.onclick = () => {
    bugTries++;
    if (bugTries === 1 && Math.random() < .6){ placeBug(); act('twitch'); showLine('Правильно. Я бы тоже убежал.'); return; }
    hideBug(); act('look'); go(b.go);
  };
}

/* ---------- чтение ---------- */
const textEl = $('text'), pages = document.querySelector('.pages');
let R = null;
const IMG = k => `assets/img/${k}.jpg?v=3`;
function startRead(ch, then){
  const c = window.CHAPTERS[ch]; app.className = 'mode-read'; document.body.classList.add('reading');
  $('chapTitle').textContent = c.title; textEl.innerHTML = ''; pages.scrollTop = 0;
  R = {ch, then, i:0, frame:-1}; setFrame(0); $('moreBtn').hidden = false; $('allBtn').hidden = false; $('moreBtn').textContent = 'Дальше';
  revealMore();
}
function setFrame(k){
  const f = FRAMES[R.ch][k]; if (!f || k === R.frame) return; R.frame = k;
  const a = $('artImg'), b = $('artImg2'); const cur = a.classList.contains('next') ? b : a, nxt = cur === a ? b : a;
  nxt.src = IMG(f[1]); nxt.className = f[2]; requestAnimationFrame(() => { nxt.classList.remove('next'); cur.classList.add('next'); });
  if (f[3]) act(f[3]);
}
function addPara(){
  const c = window.CHAPTERS[R.ch]; if (R.i >= c.paras.length) return false;
  const t = c.paras[R.i];
  FRAMES[R.ch].forEach((f, k) => { if (k && f[0] && t.startsWith(f[0])) setFrame(k); });
  const p = document.createElement('p'); p.textContent = t; textEl.appendChild(p); R.i++; return true;
}
function revealMore(){
  let n = 0; while (n < 260 && addPara()) n += window.CHAPTERS[R.ch].paras[R.i-1].length;
  const last = textEl.lastElementChild; if (last) setTimeout(() => last.scrollIntoView({behavior:'smooth', block:'end'}), 60);
  if (R.i >= window.CHAPTERS[R.ch].paras.length){ $('moreBtn').textContent = 'Вернуться к Киперу'; $('allBtn').hidden = true; }
}
$('moreBtn').onclick = () => { if (R.i >= window.CHAPTERS[R.ch].paras.length) return endRead(); revealMore(); };
$('allBtn').onclick = () => { while (addPara()); $('moreBtn').textContent = 'Вернуться к Киперу'; $('allBtn').hidden = true; };
document.addEventListener('keydown', e => { if (app.classList.contains('mode-read') && (e.key===' '||e.key==='ArrowRight') && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); $('moreBtn').click(); } });
function endRead(){ S.read = Math.max(S.read, R.ch + 1); save(); const then = R.then; R = null; if (then) go(then); else go(S.resume || 'later'); }

function leaveRead(){ if (!R) return; if (R.i >= window.CHAPTERS[R.ch].paras.length) return endRead(); R = null; go(S.resume || 'start'); }
$('toKeeper').onclick = leaveRead;
$('musicHome').onclick = () => $('homeBtn').click();
$('homeBtn').onclick = () => { closePanels(); $('chat').hidden = true; if (R) leaveRead(); };

/* ---------- ИИ ---------- */
async function ask(character, message, history){
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 75000);
  try{
    const r = await fetch(API, {method:'POST', headers:{'Content-Type':'application/json'}, signal:ctrl.signal,
      body: JSON.stringify({message, history: history.slice(-12), character, provider:'auto', readChapter: S.read})});
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || r.status);
    return (d.text || '').trim() || '…';
  } finally { clearTimeout(to); }
}

/* чат с персонажем */
let chatWith = null;
function openChat(id, first){
  PANELS.forEach(p => $(p).hidden = true); setTab('people');
  chatWith = id; if (!S.met.includes(id)) S.met.push(id); save();
  const p = PEOPLE[id];
  showWork(0);
  const th = $('pThumbs'); th.innerHTML = '';
  if (p.works.length > 1) p.works.forEach((w, i) => { const b = document.createElement('button'); b.className = 'thumb' + (i ? '' : ' on');
    b.innerHTML = `<img src="assets/img/${w[0]}.jpg?v=3" alt="">`; b.onclick = () => showWork(i); th.appendChild(b); });
  $('chatName').textContent = p.name;
  renderPersonSong();
  const log = $('chatLog'); log.innerHTML = '';
  const can = !p.sleeps; $('chatForm').hidden = !can; $('pAsleep').hidden = can; $('pAsleep').textContent = p.sleeps || '';
  $('pMenuBtn').hidden = !can; $('pExpand').hidden = !can;
  if (can){ (S.chats[id] || []).forEach(m => addMsg(m.role === 'user' ? 'me' : 'them', m.text)); if (!log.children.length) addMsg('them', p.hello || 'Привет.'); }
  $('chat').classList.remove('expanded'); $('pMenu').hidden = true;
  $('chat').hidden = false; $('chat').scrollTop = 0;
  if (first) sendChat(first.charAt(0).toUpperCase() + first.slice(1));
}
function showWork(i){
  const p = PEOPLE[chatWith], w = p.works[i];
  $('pZoom').hidden = !w; $('pPh').hidden = !!w; $('pPh').textContent = BRO_PH;
  if (w) $('pArt').src = `assets/img/${w[0]}.jpg?v=3`;
  document.querySelectorAll('.thumb').forEach((b, k) => b.classList.toggle('on', k === i));
}
$('pZoom').onclick = () => { $('lbImg').src = $('pArt').src; $('lightbox').hidden = false; };
$('lbX').onclick = $('lightbox').onclick = e => { if (e.target.id !== 'lbImg') $('lightbox').hidden = true; };
let pSongIdx = 0;
function renderPersonSong(){
  const list = songs(chatWith); $('pSong').hidden = !list.length; if (!list.length) return;
  if (pSongIdx >= list.length) pSongIdx = 0;
  const s = list[pSongIdx]; $('pSongTitle').textContent = s.title;
  $('pList').innerHTML = list.length > 1 ? list.map((x, i) => `<button class="txt small${i===pSongIdx?' on':''}" data-i="${i}">${esc(x.title)}</button>`).join('') : '';
  $('pList').querySelectorAll('button').forEach(b => b.onclick = () => { pSongIdx = +b.dataset.i; renderPersonSong(); });
  $('pLyricsBtn').hidden = !s.lyrics; $('pLyrics').textContent = s.lyrics || ''; $('pLyrics').hidden = true; $('pLyricsBtn').setAttribute('aria-expanded','false');
  syncP();
}
function personSongOn(){ const s = songs(chatWith)[pSongIdx]; return s && curSong === s.file; }
function syncP(){
  if (!chatWith || $('pSong').hidden) return;
  const mine = personSongOn(); $('pPlay').textContent = mine && !audio.paused ? '❚❚' : '▶';
  const p = mine && audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  $('pFill').style.width = p + '%'; $('pKnob').style.left = p + '%';
  $('pTime').textContent = fmt(mine ? audio.currentTime : 0); $('pDur').textContent = fmt(mine ? audio.duration : 0);
}
$('pPlay').onclick = () => { const s = songs(chatWith)[pSongIdx]; if (!s) return;
  if (curSong !== s.file){ audio.src = s.file; curSong = s.file; } curId = chatWith;
  audio.paused ? audio.play().catch(() => {}) : audio.pause(); if (!S.heard.includes(chatWith)) { S.heard.push(chatWith); save(); } };
$('pLyricsBtn').onclick = () => { const l = $('pLyrics'); l.hidden = !l.hidden; $('pLyricsBtn').setAttribute('aria-expanded', String(!l.hidden)); };
$('pVol').oninput = e => { audio.volume = e.target.value / 100; audio.muted = false; const d = $('dVol'); if (d) d.value = e.target.value; };
(() => { const th = $('pThread'); let drag = false;
  const at = e => { if (!personSongOn() || !audio.duration) return; const r = th.getBoundingClientRect(); audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration; syncP(); };
  th.addEventListener('pointerdown', e => { drag = true; th.setPointerCapture(e.pointerId); at(e); });
  th.addEventListener('pointermove', e => { if (drag) at(e); });
  th.addEventListener('pointerup', () => { drag = false; }); })();
$('pMenuBtn').onclick = () => { const m = $('pMenu'); m.hidden = !m.hidden; $('pMenuBtn').setAttribute('aria-expanded', String(!m.hidden)); };
$('pExpand').onclick = () => { const on = $('chat').classList.toggle('expanded'); $('pExpand').textContent = on ? '← К рисунку' : 'Развернуть разговор'; if (on) $('chatLog').lastElementChild?.scrollIntoView({block:'end'}); };
function addMsg(cls, text){
  const d = document.createElement('div'); d.className = 'line-msg ' + cls;
  const who = cls.includes('me') ? 'Ты' : (PEOPLE[chatWith] || {}).name || '';
  d.innerHTML = `<span class="who">${esc(who)}</span><span class="said"></span>`; d.querySelector('.said').textContent = text;
  $('chatLog').appendChild(d); $('chatLog').scrollTop = $('chatLog').scrollHeight; return d.querySelector('.said');
}
async function sendChat(m){
  const id = chatWith; addMsg('me', m); const w = addMsg('them wait', '…');
  const h = S.chats[id] || (S.chats[id] = []);
  try{ const a = await ask(id, m, h); h.push({role:'user', text:m}, {role:'model', text:a}); S.chats[id] = h.slice(-40); save(); w.parentNode.classList.remove('wait'); w.textContent = a; }
  catch(e){ w.textContent = 'Тишина.'; }
  finally{ $('chatLog').scrollTop = $('chatLog').scrollHeight; }
}
$('chatForm').addEventListener('submit', e => { e.preventDefault(); const i = $('chatInput'); const m = i.value.trim(); if (!m) return; i.value = ''; sendChat(m); });
$('chatBack').onclick = () => { $('chat').hidden = true; openPanel('people'); };
$('personHome').onclick = () => $('homeBtn').click();
$('clearChat').onclick = () => { S.chats[chatWith] = []; save(); $('chatLog').innerHTML = ''; addMsg('them', PEOPLE[chatWith].hello || 'Привет.'); $('pMenu').hidden = true; };

/* разделы: История · Персонажи · Музыка · Книга */
const PANELS = ['people','music','toc'];
function closePanels(){ PANELS.forEach(p => $(p).hidden = true); setTab('story'); }
function setTab(name){ document.querySelectorAll('.note button').forEach(b => b.classList.toggle('on', b.dataset.tab === name)); }
function openPanel(name){
  PANELS.forEach(p => $(p).hidden = true); $('chat').hidden = true;
  if (name === 'people') renderPeople(), $('people').hidden = false;
  if (name === 'music') renderShelf(), $('music').hidden = false;
  if (name === 'book') renderBook(), $('toc').hidden = false;
  setTab(name);
}
document.querySelectorAll('.note button').forEach(b => b.onclick = () => b.dataset.tab === 'story' ? $('homeBtn').click() : openPanel(b.dataset.tab));
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closePanels);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); $('chat').hidden = true; } });

function renderPeople(){
  const box = $('cards'); box.innerHTML = '';
  Object.entries(PEOPLE).forEach(([id, p]) => {
    const w = p.works[0], ar = w ? w[1] : .75;
    const b = document.createElement('button'); b.className = 'gal-item'; b.style.setProperty('--ar', ar);
    b.innerHTML = (w ? `<img src="assets/img/${w[0]}.jpg?v=3" alt="${esc(p.name)}" loading="lazy">` : `<span class="ph">${BRO_PH}</span>`) +
      `<span class="gal-name">${esc(p.name)} <span class="meet">Познакомиться →</span></span>`;
    b.onclick = () => openChat(id);
    box.appendChild(b);
  });
}
const songs = id => (window.SONGS_DATA && window.SONGS_DATA[id]) || [];
const plural = n => n === 1 ? 'песня' : (n < 5 ? 'песни' : 'песен');
const labelHTML = img => img ? `<img src="assets/img/${img}.jpg?v=3" alt="">` : '';
function renderShelf(){
  $('detail').hidden = true; $('shelf').hidden = false; const box = $('shelf'); box.innerHTML = '';
  SHELF.forEach(([id, name, img]) => {
    const n = songs(id).length; const b = document.createElement('button'); b.className = 'rec'; b.disabled = !n;
    b.innerHTML = `<span class="disc"><span class="lbl${img ? '' : ' ph'}">${img ? labelHTML(img) : BRO_PH}</span><span class="pin"></span></span><b>${esc(name)}</b>` +
      (n ? `<small>${n} ${plural(n)}</small>` : `<small class="soon">Скоро</small>`);
    if (n) b.onclick = () => openDetail(id, false);
    box.appendChild(b);
  });
}
const audio = $('player'); let curSong = null, curId = null;
function fmt(s){ s = Math.floor(s || 0); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
function openDetail(id, autoplay){
  const row = SHELF.find(r => r[0] === id); const list = songs(id); const s = list[0];
  $('shelf').hidden = true; $('detail').hidden = false; $('music').scrollTop = 0;
  $('dLabel').className = 'lbl' + (row[2] ? '' : ' ph'); $('dLabel').innerHTML = row[2] ? labelHTML(row[2]) : BRO_PH;
  $('dName').textContent = row[1]; $('dSong').textContent = s ? s.title : '';
  $('dEmpty').hidden = !!s; $('dEmpty').textContent = 'Песня скоро появится.'; $('dPlayer').hidden = !s;
  $('dLyricsBtn').hidden = !(s && s.lyrics); $('dLyrics').hidden = true; $('dLyrics').textContent = s ? s.lyrics || '' : ''; $('dLyricsBtn').setAttribute('aria-expanded','false');
  if (s && curSong !== s.file){ audio.src = s.file; curSong = s.file; }
  if (s) curId = id;
  if (s && autoplay) audio.play().catch(() => {});
  syncPlay(); paintSeek();
  if (s && !S.heard.includes(id)) { S.heard.push(id); save(); }
}
function syncPlay(){ const on = !audio.paused; $('dPlay').textContent = on ? '❚❚' : '▶'; $('stage').classList.toggle('playing', on); }
$('dPlay').onclick = () => audio.paused ? audio.play().catch(() => {}) : audio.pause();
['play','pause','ended','timeupdate','loadedmetadata'].forEach(ev => audio.addEventListener(ev, () => { if (chatWith) syncP(); }));
audio.addEventListener('play', syncPlay); audio.addEventListener('pause', syncPlay); audio.addEventListener('ended', syncPlay);
function paintSeek(){ const p = audio.duration ? audio.currentTime / audio.duration * 100 : 0; $('dFill').style.width = p + '%'; $('dKnob').style.left = p + '%';
  $('dTime').textContent = fmt(audio.currentTime); $('dDur').textContent = fmt(audio.duration); }
audio.addEventListener('timeupdate', paintSeek); audio.addEventListener('loadedmetadata', paintSeek);
(() => { const th = $('dThread'); let drag = false;
  const at = e => { const r = th.getBoundingClientRect(); const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); if (audio.duration) { audio.currentTime = x * audio.duration; paintSeek(); } };
  th.addEventListener('pointerdown', e => { drag = true; th.setPointerCapture(e.pointerId); at(e); });
  th.addEventListener('pointermove', e => { if (drag) at(e); });
  th.addEventListener('pointerup', () => { drag = false; }); })();
audio.volume = .8;
$('dVol').oninput = e => { audio.volume = e.target.value / 100; audio.muted = false; $('dWave').style.opacity = audio.volume ? 1 : .2; };
$('dMute').onclick = () => { audio.muted = !audio.muted; $('dWave').style.opacity = audio.muted ? .2 : 1; };
$('dLyricsBtn').onclick = () => { const l = $('dLyrics'); l.hidden = !l.hidden; $('dLyricsBtn').setAttribute('aria-expanded', String(!l.hidden)); };
$('detailBack').onclick = renderShelf;
/* мини-плеер: музыка играет дальше, пока ходишь по сайту */
function miniSync(){
  const onDetail = (!$('music').hidden && !$('detail').hidden) || (!$('chat').hidden && personSongOn());
  const show = !!curSong && !onDetail && (!audio.paused || audio.currentTime > 0) && !audio.ended;
  $('mini').classList.toggle('show', show); if (!show || !curId) return;
  const pr = audio.duration ? audio.currentTime / audio.duration * 100 : 0; $('miniFill').style.width = pr + '%'; $('miniKnob').style.left = pr + '%';
  const row = SHELF.find(r => r[0] === curId) || [curId, (PEOPLE[curId]||{}).name || '', ''];
  if ($('mini').dataset.id !== curId){ $('mini').dataset.id = curId; $('miniLbl').className = 'lbl' + (row[2] ? '' : ' ph'); $('miniLbl').innerHTML = row[2] ? labelHTML(row[2]) : ''; }
  $('miniTitle').textContent = (songs(curId)[0] || {}).title || ''; $('miniName').textContent = row[1];
  $('miniIco').textContent = audio.paused ? '▶' : '❚❚'; $('mini').classList.toggle('playing', !audio.paused);
}
['play','pause','ended','emptied','timeupdate'].forEach(ev => audio.addEventListener(ev, miniSync));
(() => { const th = $('miniThread'); let drag = false;
  const at = e => { if (!audio.duration) return; const r = th.getBoundingClientRect(); audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration; miniSync(); };
  th.addEventListener('pointerdown', e => { drag = true; th.setPointerCapture(e.pointerId); at(e); });
  th.addEventListener('pointermove', e => { if (drag) at(e); });
  th.addEventListener('pointerup', () => { drag = false; }); })();
/* редкая реакция Кипера на музыку */
audio.addEventListener('play', () => { if (app.classList.contains('mode-talk') && $('music').hidden && $('chat').hidden && !busy && Math.random() < .3) { act('twitch'); showLine('А, эту оставь. Под неё я лучше вспоминаю неправильно.'); } });
setInterval(miniSync, 700);
/* пластинки крутит скрипт: на паузе угол замирает, при игре продолжается с того же места */
let discAngle = 0, lastT = 0;
(function spinLoop(t){
  if (lastT && !audio.paused) discAngle = (discAngle + (t - lastT) * 360 / 14000) % 360;
  lastT = t;
  $('dLabel').style.transform = `rotate(${discAngle}deg)`;   // крутится наклейка, блик на пластинке стоит, как в жизни
  $('miniLbl').style.transform = `rotate(${discAngle}deg)`;
  requestAnimationFrame(spinLoop);
})();
$('miniDisc').onclick = () => audio.paused ? audio.play().catch(() => {}) : audio.pause();
$('miniOpen').onclick = () => { if (curId) { openPanel('music'); openDetail(curId, false); } };
$('miniX').onclick = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); curSong = null; curId = null; miniSync(); syncPlay(); };
function openSong(id){ openPanel('music'); openDetail(id, false); }
function renderBook(){
  const ol = $('tocList'); ol.innerHTML = '';
  TITLES.forEach((t, i) => { const li = document.createElement('li'); const b = document.createElement('button'); b.className = 'ch';
    const have = i < window.CHAPTERS.length, ok = have && i <= S.read; b.disabled = !ok;
    b.innerHTML = `<span class="n">${i===0?'·':i}</span><span>${esc(t)}</span>` + (!have ? ' <span class="n">скоро</span>' : (i > S.read ? ' <span class="n">ещё рано</span>' : ''));
    b.onclick = () => { closePanels(); token++; startRead(i, null); }; li.appendChild(b); ol.appendChild(li); });
}

$('resetBtn').onclick = () => { try { localStorage.removeItem('keeper-state'); } catch(e) {} location.reload(); };

/* старт */
setTimeout(() => go(S.node && S.node !== 'start' ? 'back' : 'start'), 600);
})();
