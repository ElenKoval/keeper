/* Кипер рассказывает — движок сцены */
(() => {
const API = 'https://ai-character-platform.onrender.com/api/chat';
const $ = id => document.getElementById(id);
/* ---------- язык ---------- */
let LANG = 'ru'; try { LANG = localStorage.getItem('keeper-lang') || ((navigator.language||'').toLowerCase().startsWith('ru') ? 'ru' : 'en'); } catch(e) {}
const tr = x => (x && typeof x === 'object' && !Array.isArray(x)) ? (x[LANG] ?? x.ru) : x;
const UI = {
  next:{ru:'дальше ▸',en:'next ▸'}, back:{ru:'Вернуться к Киперу',en:'Back to Kiper'}, more:{ru:'Дальше',en:'Next'}, all:{ru:'Показать главу целиком',en:'Show the whole chapter'},
  silence:{ru:'Тишина.',en:'Silence.'}, you:{ru:'Ты',en:'You'}, meet:{ru:'Познакомиться →',en:'Meet →'},
  expand:{ru:'Развернуть разговор',en:'Expand conversation'}, toArt:{ru:'← К рисунку',en:'← Back to drawing'},
  songSoon:{ru:'Песня скоро появится.',en:'Music coming soon.'}, soon:{ru:'Скоро',en:'Soon'}, soonLow:{ru:'скоро',en:'soon'}, early:{ru:'ещё рано',en:'not yet'},
  bro:{ru:'Брат вышел за бурбоном. Скоро вернётся.',en:"Brother stepped out for bourbon. He'll be back."},
};
const plural = n => LANG === 'en' ? (n === 1 ? 'song' : 'songs') : (n === 1 ? 'песня' : (n < 5 ? 'песни' : 'песен'));
const app = $('app'), keeper = $('keeper'), lineEl = $('line'), optsEl = $('opts'), floor = $('floor');

/* ---------- данные ---------- */
/* Альбом: рисунки (имя файла, соотношение сторон), первая реплика, есть ли чат */
const PEOPLE = {
  keeper:        {name:{ru:'Кипер',en:'Kiper'}, works:[['keeper_paper',.715]], hello:{ru:'Тсс. Не шевелись. Ты стоишь на моём вчера. Вот. Теперь можно.',en:'Shh. Don\'t move. You\'re standing on my yesterday. There. Now you can.'}},
  dream:         {name:{ru:'Дрим',en:'Dream'},  works:[['dream',.739],['dream_2b',.734]], hello:{ru:'Я здесь. Что у тебя?',en:'I\'m here. What do you have?'}},
  weaver:        {name:{ru:'Вивер',en:'Weaver'}, works:[['weaver',1.618],['weaver_forest',1.472],['weaver_symbol',.738]], hello:{ru:'О! Ты кто? Ты тоже застреваешь в корнях?',en:'Oh! Who are you? Do you get stuck in roots too?'}},
  liora:         {name:{ru:'Лиора',en:'Liora'}, works:[['liora',.757],['liora_dead',1.528]], hello:{ru:'Ох. Садись ближе, здесь тепло.',en:'Oh. Sit closer, it\'s warm here.'}},
  drpak:         {name:{ru:'Пак',en:'Pak'},   works:[['pak',.745]], hello:{ru:'Ты по делу? Если нет, тоже говори. Только короче.',en:'Are you here on business? If not, say it anyway. Just shorter.'}},
  crystal:       {name:{ru:'Кристалл',en:'Crystal'}, works:[['crystal',1.401]], hello:{ru:'Вы так стараетесь убежать друг от друга, что забыли, как звучите вместе.',en:'You try so hard to run from each other that you\'ve forgotten how you sound together.'}},
  cat:           {name:{ru:'Кот',en:'Cat'},   works:[['cat',1.412]], hello:{ru:'О. Привет. Ты тоже не спишь?',en:'Oh. Hi. You\'re not sleeping either?'}},
  dryad:         {name:{ru:'Дриада',en:'Dryad'},  works:[['dryad',.75]], sleeps:{ru:'Она спит. Здесь можно только смотреть.',en:'She is asleep. Here you can only look.'}},
  fallow:        {name:{ru:'Пустошь',en:'The Fallow'}, works:[['fallow',1.679]], nochat:true},
  angry_forest:  {name:{ru:'Злой Лес',en:'Angry Forest'}, works:[['forest',1.41],['forest_2',1.512]], hello:{ru:'Всё, от чего тебя спасли, до сих пор живёт во мне.',en:'Everything you were saved from still lives in me.'}},
  shiny:         {name:{ru:'Шайни',en:'Shiny'}, works:[['shiny',1.41]], hello:{ru:'Этот свет не для продажи.',en:'This light is not for sale.'}},
  shiny_bro:     {name:{ru:'Брат',en:'Shiny\'s Brother'},  works:[], hello:{ru:'К ней — только через меня.',en:'To get to her, you go through me.'}},
  talk_mushroom: {name:{ru:'Гриб',en:'Mushroom'},  works:[['grib',.72]], hello:{ru:'Высота пахнет иначе, когда ты наконец перестаёшь бояться упасть.',en:'Height smells different once you finally stop fearing the fall.'}},
};
/* страница героя: что о нём говорят другие и карточка песни (пока только Пак) */
const SAY = {
  drpak: [
    {who:'liora', ru:'Он всегда приходит раньше, чем я успеваю позвать.', en:'He always comes before I even call.'},
    {who:'weaver', ru:'Ворчит. И считает меня поломкой.', en:'He grumbles. And thinks I\'m a malfunction.'},
    {who:'cat', ru:'Он ни разу меня не прогнал. Хотя очень старался делать вид.', en:'He never once sent me away. Though he tried hard to look like he might.'},
    {who:'keeper', ru:'Пак? Помню. Или это было завтра?', en:'Pak? I remember. Or was that tomorrow?'},
  ],
};
const SONGCARD = {
  drpak: {head:{ru:'Лиора о Паке',en:'Liora about Pak'}, quote:{ru:'«Он будет утверждать, что ничего подобного не было».',en:'"He\'ll insist none of this ever happened."'},
          aside:{ru:'Пак отказывается обсуждать эту запись.',en:'Pak refuses to discuss this record.'}},
};
const face = id => { const w = (PEOPLE[id]||{}).works; return w && w.length ? `assets/img/${w[0][0]}.jpg?v=4` : ''; };
/* Звук мира: порядок пластинок и наклейки; треки – в assets/songs.js */
const SHELF = [['dream','Дрим','dream'],['cat','Кот','cat'],['weaver','Вивер','weaver'],['crystal','Кристалл','crystal'],
  ['keeper','Кипер','keeper_paper'],['shiny','Шайни','shiny'],['shiny_bro','Брат',''],['liora','Лиора','liora'],
  ['drpak','Пак','pak'],['dryad','Дриада','dryad'],['talk_mushroom','Гриб','grib'],['angry_forest','Злой Лес','forest']];

const TITLES_RU = ['Перед первым криком','Мир стал меньше','Возможно, жук','Янтарная тишина','Встреча','Бег','Просто скажи «нет»','Операция','Крыша','Прикосновение','Запах высоты','Ноктюрн','Цена','Шипы'];
const TITLES_EN = ['Before the First Cry','The World Grew Smaller','Perhaps a Beetle','Amber Silence','The Encounter','The Flight','Just Say No','The Operation','The Roof','The Touch','The Scent of Heights','Nocturne','The Price','Thorns'];
const titles = () => LANG === 'en' ? TITLES_EN : TITLES_RU;
const nm = id => tr((PEOPLE[id] || {}).name) || '';
const CH = i => (LANG === 'en' && window.CHAPTERS_EN ? window.CHAPTERS_EN : window.CHAPTERS)[i];

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

/* номера абзацев, где меняются рисунки (абзацы в русской и английской версиях совпадают) */
const DEFAULT_ART = ['dryad','weaver','keeper_paper','liora','cat','forest','weaver_forest','pak','cat','cat','shiny','crystal','liora_dead','weaver_symbol'];
for (let c = 0; c < window.CHAPTERS.length; c++) if (!FRAMES[c]) FRAMES[c] = [['', DEFAULT_ART[c] || 'dryad', 'pan-in']];
Object.keys(FRAMES).forEach(c => { const seen = new Set(); FRAMES[c] = FRAMES[c].filter(f => { if (seen.has(f[1])) return false; seen.add(f[1]); return true; }); });
const FIDX = {}; Object.keys(FRAMES).forEach(c => { const P = window.CHAPTERS[c].paras; FIDX[c] = FRAMES[c].map(f => f[0] ? P.findIndex(p => p.startsWith(f[0])) : 0); });

/* сцены */
const N = {
  start: {steps:[
      {act:'look', say:{ru:'Ой, у тебя что-то выпало?',en:'Oh, did you drop something?'}},
      {say:{ru:'Нет?.. А что это там лежит зелёное?',en:'No?.. Then what\'s that green thing lying there?'}},
      {act:'twitch', say:{ru:'О! Это мой друг! Хочешь, он станет и твоим другом? У жуков, знаешь ли, друзей немного…',en:'Oh! That\'s my friend! Want him to be your friend too? Beetles, you know, don\'t have many friends…'}},
      {act:'search', say:{ru:'Ой. Куда он опять уполз? Ты не видел?',en:'Oh. Where did he crawl off to again? Did you see?'}},
      {say:{ru:'Ладно. Я его всегда нахожу. Или он меня. Или место находит нас обоих одновременно.',en:'Never mind. I always find him. Or he finds me. Or the place finds us both at once.'}},
      {say:{ru:'Ты вообще знаешь, что жук здесь не всегда был? Или был. Но Дрим заметил его не сразу.',en:'Did you know the beetle wasn\'t always here? Or maybe he was. But Dream didn\'t notice him right away.'}},
      {act:'twitch', say:{ru:'Ты Дрима знаешь? Нет?.. Оууу. Тогда слушай.',en:'Do you know Dream? No?.. Ohhh. Then listen.'}}],
    opts:[{label:{ru:'Я слушаю',en:'I\'m listening'}, go:'listen'}, {label:{ru:'А ты кто?',en:'And who are you?'}, go:'who'}]},
  who: {steps:[{say:{ru:'Кипер. Я здесь всё храню.',en:'Kiper. I keep everything here.'}}, {act:'look', note:{ru:'Смотрит под себя.',en:'Looks down at his feet.'}, say:{ru:'Почти всё. Жука опять потерял. Но историю пока помню. Она больше жука, её труднее потерять.',en:'Almost everything. Lost the beetle again. But I still remember the story. It\'s bigger than the beetle, harder to lose.'}}],
    opts:[{label:{ru:'Ну рассказывай',en:'Go on, then'}, go:'pro_in'}]},
  listen: {steps:[{say:{ru:'Хорошо. Хорошо. Это редкость. Обычно слушаю я.',en:'Good. Good. That\'s rare. Usually I\'m the one who listens.'}}], next:'pro_in'},
  pro_in: {steps:[
      {say:{ru:'С чего бы… С начала? Начало было до начала, я его плохо вижу.',en:'Where to start… At the beginning? The beginning was before the beginning. I can\'t see it well.'}},
      {say:{ru:'С Дриады? Она спит. Разговора не получится. С Дрима? Он сейчас занят. Он тогда тоже был занят…',en:'With the Dryad? She\'s asleep. No conversation there. With Dream? He\'s busy right now. He was busy back then too…'}},
      {act:'twitch', note:{ru:'Перестаёт чесаться. Замирает.',en:'Stops scratching. Freezes.'}, say:{ru:'А потом кто-то закричал.',en:'And then someone cried out.'}},
      {say:{ru:'Подними. Аккуратно. Она была совсем маленькая.',en:'Pick it up. Carefully. She was very small.'}}],
    object:{kind:'chitin', label:{ru:'осколок хитина',en:'a shard of chitin'}, go:'pro_read'}},
  pro_read: {read:0, then:'pro_after'},
  pro_after: {steps:[{say:{ru:'Он не знал, как её держать. Столько лапок и всего две руки. Несправедливая арифметика.',en:'He didn\'t know how to hold her. So many little legs and only two hands. Unfair arithmetic.'}}],
    opts:[{label:{ru:'А что было дальше?',en:'What happened next?'}, go:'pro_song'}]},
  pro_song: {steps:[{say:{ru:'Он потом про неё пел. Мне он этого не говорил. Но я слышал.',en:'Later he sang about her. He never told me. But I heard.'}}],
    opts:[{label:{ru:'Послушать Дрима',en:'Listen to Dream'}, song:'dream'}, {label:{ru:'Дальше',en:'Next'}, go:'ch1_in', tap:true}]},
  ch1_in: {steps:[
      {act:'stuck', note:{ru:'Кипер пытается пролезть между двумя ветвями, застревает, пятится.',en:'Kiper tries to squeeze between two branches, gets stuck, backs out.'}},
      {say:{ru:'Между прочим, очень неприятное чувство. И совершенно необязательно об этом рассказывать всем.',en:'A very unpleasant feeling, by the way. And there\'s no need at all to tell everyone about it.'}},
      {say:{ru:'Вот тут. Она полезла туда, куда лазила всегда. А «всегда» – штука ненадёжная.',en:'Right here. She crawled where she always crawled. And "always" is an unreliable thing.'}}],
    object:{kind:'scratch', label:{ru:'царапина на корне',en:'a scratch on the root'}, go:'ch1_read'}},
  ch1_read: {read:1, then:'ch1_after'},
  ch1_after: {steps:[{say:{ru:'Корень остался прежним. Так все говорят. А корни, между прочим, тоже растут. Только внутрь.',en:'The root stayed the same. That\'s what everyone says. But roots grow too, you know. Only inward.'}}],
    opts:[{label:{ru:'Кипер, он же тебя зовёт',en:'Kiper, he\'s calling you'}, go:'ch1_call'}]},
  ch1_call: {steps:[{act:'look', note:{ru:'Делает вид, что не слышит. Потом всё-таки оборачивается.',en:'Pretends not to hear. Then turns around anyway.'}, say:{ru:'Я слышал. Я просто был занят. Важным.',en:'I heard. I was just busy. With something important.'}}], next:'ch2_in'},
  ch2_in: {steps:[{act:'listen', say:{ru:'Вот он. Не дави. Он хотя бы знает, куда идёт.',en:'There he is. Don\'t squash him. At least he knows where he\'s going.'}}], bug:{go:'ch2_read'}},
  ch2_read: {read:2, then:'ch2_after'},
  ch2_after: {steps:[{say:{ru:'Это я хорошо сказал. Я редко понимаю, что говорю. Но это не значит…',en:'I said that well. I rarely understand what I\'m saying. But that doesn\'t mean…'}}],
    opts:[{label:{ru:'…что ты ошибаешься',en:'…that you\'re wrong'}, go:'ch2_here'}]},
  ch2_here: {steps:[{act:'twitch', say:{ru:'Вот. Ты уже почти здешний. Или здешняя. Я не разглядел.',en:'There. You\'re almost one of us now. I think. I didn\'t look closely.'}}, {say:{ru:'Про меня, кстати, тоже есть песня. Я её не слушал. Вдруг там правда.',en:'There\'s a song about me too, by the way. I haven\'t listened. What if it\'s true.'}}],
    opts:[{label:{ru:'Послушать Кипера',en:'Listen to Kiper'}, song:'keeper'}, {label:{ru:'А что дальше?',en:'What\'s next?'}, go:'later'}]},
  later: {steps:[{act:'listen', say:{ru:'Дальше кто-то поёт. Слышишь? Нет? Значит, ещё рано.',en:'Next, someone sings. Hear it? No? Then it\'s too early.'}}, {say:{ru:'Приходи потом. Я никуда не денусь. Это моя главная работа – никуда не деваться.',en:'Come back later. I\'m not going anywhere. That\'s my main job: not going anywhere.'}}],
    opts:[{label:{ru:'Начать сначала',en:'Start over'}, reset:true, tap:true}]},
  back: {steps:[{act:'look', note:{ru:'Смотрит на тебя, потом на оставленные вещи.',en:'Looks at you, then at the things you left.'}, say:{ru:'А, это ты. Я ничего не трогал. Почти.',en:'Ah, it\'s you. I didn\'t touch anything. Almost.'}}],
    opts:[{label:{ru:'Продолжим историю',en:'Let\'s continue the story'}, resume:true}, {label:{ru:'Хочу кое с кем поговорить',en:'I want to talk to someone'}, panel:'people'}, {label:{ru:'Давай музыку',en:'Some music'}, panel:'music'}]},
  whom: {steps:[{say:{ru:'С кем? Я всех помню. Почти.',en:'With whom? I remember everyone. Almost.'}}], dyn:'whom'},
  music: {steps:[{say:{ru:'Музыку я храню в янтаре. Вот, что уже звучало.',en:'I keep music in amber. Here\'s what has played already.'}}], dyn:'music'},
};
const RESUMABLE = new Set(['start','pro_in','pro_after','pro_song','ch1_in','ch1_after','ch2_in','ch2_after','ch2_here','later']);

/* ---------- состояние ---------- */
let S = {node:null, resume:'start', read:0, chats:{}, met:[], heard:[]};
try { Object.assign(S, JSON.parse(localStorage.getItem('keeper-state') || '{}')); } catch(e) {}
const save = () => { try { localStorage.setItem('keeper-state', JSON.stringify(S)); } catch(e) {} };

/* ---------- корни ---------- */
const roots = $('roots');
const rnd = (a,b) => a + Math.random()*(b-a);
function drawRoots(){   // Нити растут снизу вверх, объёмные: тень, тело и блик; дальние тоньше и тусклее
  const W = innerWidth, H = innerHeight; roots.setAttribute('viewBox', `0 0 ${W} ${H}`);
  let g = '<defs><filter id="far" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>';
  const n = Math.round(W/48), items = [];
  for (let i=0;i<n;i++) items.push({x:rnd(0,W), z:Math.random()});
  items.sort((a,b) => a.z - b.z);                       // сначала дальние
  items.forEach(({x, z}) => {
    const len = (.28 + z*.5) * H * rnd(.8,1.1);
    let d = `M${x.toFixed(1)} ${H+4}`, cx = x; const k = Math.max(4, Math.round(len/70));
    for (let j=1;j<=k;j++){ const ny = H - len*j/k, nx = x + rnd(-18,18)*(.6+z); d += ` Q${(cx+rnd(-18,18)).toFixed(1)} ${(ny+len/k/2).toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`; cx = nx; }
    const w = .7 + z*2.6, op = .18 + z*.55, delay = rnd(0,1.6).toFixed(2), far = z < .3 ? ' filter="url(#far)"' : '';
    g += `<g class="sway up" style="--d:${rnd(7,13).toFixed(1)}s;--a:${rnd(.4,1.1).toFixed(2)}deg" opacity="${op.toFixed(2)}"${far}>` +
      `<path class="grow sh" pathLength="1" style="animation-delay:${delay}s" d="${d}" stroke-width="${(w+1.6).toFixed(2)}" transform="translate(1.2 0)"/>` +
      `<path class="grow body" pathLength="1" style="animation-delay:${delay}s" d="${d}" stroke-width="${w.toFixed(2)}"/>` +
      `<path class="grow hl" pathLength="1" style="animation-delay:${delay}s" d="${d}" stroke-width="${Math.max(.35, w*.32).toFixed(2)}" transform="translate(${(-w*.22).toFixed(2)} 0)"/>` +
      (z > .55 ? `<path class="shine" pathLength="1" style="animation-delay:${rnd(2,9).toFixed(1)}s;animation-duration:${rnd(6,11).toFixed(1)}s" d="${d}" stroke-width="${Math.max(.5, w*.45).toFixed(2)}" transform="translate(${(-w*.22).toFixed(2)} 0)"/>` : '') +
      `</g>`;
  });
  roots.innerHTML = g;
}
drawRoots(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawRoots, 250); });

/* ---------- Кипер: моргание, действия, жук на роге ---------- */
const lids = [$('lidL'), $('lidR')];
function setLids(c){ lids.forEach(l => { l.classList.toggle('open', !c); l.style.transform = c ? 'translateY(0px)' : `translateY(-${l.id==='lidL'?400:280}px)`; }); }
function blink(d){ setLids(true); setTimeout(() => { setLids(false); if (d) setTimeout(() => blink(false), 220); }, 130); }
(function loop(){ setTimeout(() => { blink(Math.random()<.25); loop(); }, 2600 + Math.random()*4200); })();
/* ---------- Кипер скачет: прыжки с пружинкой из одного рисунка ---------- */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
let hopping = false, lastPoke = Date.now();
function dust(){ const r = keeper.getBoundingClientRect(); for (let i=0;i<5;i++){ const d = document.createElement('i'); d.className = 'dust';
  d.style.left = (r.left + r.width*(.35 + Math.random()*.3)) + 'px'; d.style.top = (r.bottom - r.height*.1) + 'px';
  d.style.setProperty('--dx', ((Math.random()-.5)*70).toFixed(0)+'px'); d.style.setProperty('--s', (.6+Math.random()*.8).toFixed(2));
  document.body.appendChild(d); setTimeout(() => d.remove(), 900); } }
function hops(x0, dx, n, h, ms){            // n прыжков из x0 на dx; возвращает анимацию
  const K = [], step = dx/n, r = Math.sign(dx)*7, T = (x,y,a,sx,sy) => `translate(${x}px,${y}px) rotate(${a}deg) scale(${sx},${sy})`;
  K.push({offset:0, transform:T(x0,0,0,1,1)});
  for (let i=0;i<n;i++){ const a = x0+step*i, b = a+step, o = i/n, w = 1/n;
    K.push({offset:o+w*.14, transform:T(a,0,r*.3,1.07,.9), easing:'cubic-bezier(.2,.7,.4,1)'});
    K.push({offset:o+w*.5, transform:T((a+b)/2,-h,r,.95,1.08), easing:'cubic-bezier(.6,0,.8,.4)'});
    K.push({offset:o+w*.86, transform:T(b,0,r*.4,1.09,.88)});
    K.push({offset:o+w, transform:T(b,0,0,1,1)});
    setTimeout(dust, ms*(o+w*.86)); }
  keeper.style.transformOrigin = '50% 100%';
  return keeper.animate(K, {duration:ms, fill:'forwards'});
}
const wait = t => new Promise(r => setTimeout(r, t));
async function runSeq(parts){ if (hopping || RM) return; hopping = true; let x = 0, prev = null;
  for (const p of parts){ if (p.pause){ await wait(p.pause); if (p.blink) blink(false); continue; }
    const to = p.off ? (p.off < 0 ? -(keeper.getBoundingClientRect().right + 60) : innerWidth) : (p.to ?? 0);
    const a = hops(x, to - x, p.n, p.h || 46, p.n * (p.ms || 330)); await a.finished; if (prev) prev.cancel(); prev = a; x = to; }
  if (prev) prev.cancel(); hopping = false; }
function search(){ return runSeq([{to:-120,n:2,h:34},{pause:700,blink:1},{to:110,n:3,h:40},{pause:600,blink:1},{to:0,n:2,h:28}]); }
function dash(say){ return runSeq([{off:-1,n:4,h:60,ms:260},{pause:1400},{to:0,n:4,h:60,ms:280}]).then(() => { if (say && !busy) showLine(say); }); }
// иногда, если долго тихо, Кипер убегает проверить, не жук ли там
setInterval(() => { if (document.hidden || hopping || busy || !app.classList.contains('mode-talk') || !$('music').hidden || !$('chat').hidden) return;
  if (Date.now() - lastPoke > 45000 && Math.random() < .35){ lastPoke = Date.now(); dash({ru:'Показалось, что жук.',en:'Thought I saw the beetle.'}); } }, 5000);

window.keeperHop = {dash, search};
function act(name){ if (!name) return; if (name==='search') return search(); if (name==='dash') return dash(); const c = 'a-'+name; keeper.classList.remove(c); void keeper.offsetWidth; keeper.classList.add(c);
  setTimeout(() => keeper.classList.remove(c), 2600); if (name==='look'||name==='twitch') blink(false); }
const BF = [0,1,2,3].map(i => `assets/img/bug${i}.png`); let fr = 0;
setInterval(() => { fr = (fr+1)%4; document.querySelectorAll('.bugframe').forEach(b => b.setAttribute('href', BF[fr])); const w = $('walkBug'); if (!w.hidden) w.src = BF[fr]; }, 110);
const hornBug = $('hornBug'), HP = [[1560,900],[1620,760],[1700,560],[1800,260]];
function hornCrawl(){ const pts = Math.random()<.5 ? HP : [...HP].reverse(); let s=0,t=0; hornBug.setAttribute('opacity',1);
  const step = () => { t += .006; if (t>=1){ t=0; s++; if (s>=pts.length-1){ hornBug.setAttribute('opacity',0); setTimeout(hornCrawl, 12000+Math.random()*12000); return; } }
    const a=pts[s], b=pts[s+1], x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t, ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI+90;
    hornBug.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`); requestAnimationFrame(step); }; step(); }
setTimeout(hornCrawl, 9000);
const POKES_RU = ['Тсс. Не шевелись. Ты стоишь на моём вчера. Вот. Теперь можно.','Я помню всё. Только не по порядку.','Ты не видел жука? Маленький, тёмный. Всё время куда-то идёт.','Ноги – ужасная вещь. Чем их больше, тем труднее притворяться, что стоишь на месте.','Хорошо. Хорошо.'];
const POKES_EN = ['Shh. Don\'t move. You\'re standing on my yesterday. There. Now you can.','I remember everything. Just not in order.','Have you seen a beetle? Small, dark. Always going somewhere.','Legs are a terrible thing. The more you have, the harder it is to pretend you\'re standing still.','Good. Good.'];
function swayNote(){ const n = $('note'); n.classList.remove('swing'); void n.offsetWidth; n.classList.add('swing'); }
setInterval(() => { if (Math.random() < .35) swayNote(); }, 14000);
keeper.addEventListener('click', () => { swayNote(); lastPoke = Date.now(); if (app.classList.contains('mode-read') || hopping) return; if (Math.random() < .2) return dash({ru:'Нет. Не он.',en:'No. Not him.'}); act('twitch'); if (!busy) { const P = LANG === 'en' ? POKES_EN : POKES_RU; showLine(P[Math.floor(Math.random()*P.length)]); }; });

/* ---------- реплики ---------- */
let busy = false, timer = null, token = 0;
function showLine(text, note){ text = tr(text); note = tr(note);
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
      const b = document.createElement('button'); b.className = 'tapnext'; b.textContent = tr(UI.next);
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
  if (n.dyn === 'whom') opts = S.met.map(id => ({label: PEOPLE[id].name, chat:id})).concat([{label:{ru:'Никого. Рассказывай дальше',en:'No one. Go on with the story'}, resume:true, tap:true}]);
  if (n.dyn === 'music') opts = S.heard.length ? S.heard.map(id => ({label: (songs(id)[0]||{}).title||id, song:id})).concat([{label:{ru:'Хватит музыки',en:'Enough music'}, resume:true, tap:true}])
                                              : (showLine({ru:'Ещё ничего не звучало. Сначала история, потом песни. Так честнее.',en:'Nothing has played yet. Story first, songs after. It\'s more honest.'}), [{label:{ru:'Тогда история',en:'Then the story'}, resume:true}]);
  opts.forEach((o, k) => {
    const b = document.createElement('button'); b.className = 'opt' + (o.tap ? ' tap' : '') + (o.song ? ' song' : '');
    b.textContent = tr(o.label); b.style.animationDelay = (k*90)+'ms';
    b.onclick = () => choose(o); optsEl.appendChild(b);
  });
}
function choose(o){
  if (o.go) return go(o.go);
  if (o.resume) return go(S.resume && S.resume !== 'back' ? S.resume : 'start');
  if (o.chat) { const L = tr(o.label); return openChat(o.chat, L.includes(',') ? L.split(', ').slice(1).join(', ') : null); }
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
  const b = document.createElement('button'); b.className = 'thing'; b.setAttribute('aria-label', tr(o.label));
  b.innerHTML = THING_SVG[o.kind] + `<span>${esc(tr(o.label))}</span>`; b.onclick = () => go(o.go); floor.appendChild(b);
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
    if (bugTries === 1 && Math.random() < .6){ placeBug(); act('twitch'); showLine({ru:'Правильно. Я бы тоже убежал.',en:'Right. I\'d run too.'}); return; }
    hideBug(); act('look'); go(b.go);
  };
}

/* ---------- чтение ---------- */
const textEl = $('text'), pages = document.querySelector('.pages');
let R = null;
const IMG = k => `assets/img/${k}.jpg?v=4`;
function startRead(ch, then){
  const c = CH(ch); app.className = 'mode-read'; document.body.classList.add('reading');
  $('chapTitle').textContent = c.title; $('chapNum').textContent = ch === 0 ? (LANG === 'en' ? 'Prologue' : 'Пролог') : (LANG === 'en' ? 'Chapter ' : 'Глава ') + ch;
  $('prevCh').disabled = ch === 0; $('nextChTop').disabled = ch >= window.CHAPTERS.length - 1; textEl.innerHTML = ''; pages.scrollTop = 0;
  R = {ch, then, i:0, frame:-1}; setFrame(0); $('nextCh').hidden = true; document.querySelector('.readnav').classList.remove('done'); $('moreBtn').hidden = false; $('allBtn').hidden = false; $('moreBtn').textContent = tr(UI.more); $('allBtn').textContent = tr(UI.all);
  revealMore();
}
function setFrame(k){
  const f = FRAMES[R.ch][k]; if (!f || k === R.frame) return; R.frame = k;
  const a = $('artImg'), b = $('artImg2'); const cur = a.classList.contains('next') ? b : a, nxt = cur === a ? b : a;
  nxt.src = IMG(f[1]); nxt.className = ''; requestAnimationFrame(() => { nxt.classList.remove('next'); cur.classList.add('next'); });
  if (f[3]) act(f[3]);
}
function addPara(){
  const c = CH(R.ch); if (R.i >= c.paras.length) return false;
  const t = c.paras[R.i];
  let fk = -1; FRAMES[R.ch].forEach((f, k) => { if (FIDX[R.ch][k] === R.i) fk = k; });
  const p = document.createElement('p'); p.textContent = t; if (fk >= 0) p.dataset.frame = fk; textEl.appendChild(p); R.i++; return true;
}
function revealMore(){
  let n = 0; while (n < 260 && addPara()) n += CH(R.ch).paras[R.i-1].length;
  const last = textEl.lastElementChild; if (last) setTimeout(() => { last.scrollIntoView({behavior:'smooth', block:'end'}); setTimeout(syncFrame, 500); }, 60);
  if (R.i >= CH(R.ch).paras.length) chapterDone();
}
$('moreBtn').onclick = () => { if (R.i >= CH(R.ch).paras.length) return endRead(); revealMore(); };
$('allBtn').onclick = () => { while (addPara()); chapterDone(); syncFrame(); };
/* рисунок меняется по тому абзацу, который сейчас читаешь */
function syncFrame(){
  if (!R) return; const mid = pages.getBoundingClientRect().top + pages.clientHeight * .45; let k = 0;
  textEl.querySelectorAll('p[data-frame]').forEach(p => { if (p.getBoundingClientRect().top < mid) k = +p.dataset.frame; });
  setFrame(k);
}
let sfT; pages.addEventListener('scroll', () => { clearTimeout(sfT); sfT = setTimeout(syncFrame, 120); }, {passive:true});
function chapterDone(){
  $('moreBtn').textContent = tr(UI.back); $('allBtn').hidden = true;
  S.read = Math.max(S.read, R.ch + 1); save();
  const nx = R.ch + 1, b = $('nextCh');
  b.hidden = nx >= window.CHAPTERS.length;
  if (!b.hidden) b.innerHTML = `<small>${LANG === 'en' ? 'Next chapter' : 'Следующая глава'}</small><span>${esc(CH(nx).title)} →</span>`;
  document.querySelector('.readnav').classList.add('done');
}
function gotoCh(n){ if (!R || n < 0 || n >= window.CHAPTERS.length) return; token++; startRead(n, null); pages.scrollTop = 0; }
$('nextCh').onclick = () => gotoCh(R.ch + 1);
$('nextChTop').onclick = () => gotoCh(R.ch + 1);
$('prevCh').onclick = () => gotoCh(R.ch - 1);
document.addEventListener('keydown', e => { if (app.classList.contains('mode-read') && (e.key===' '||e.key==='ArrowRight') && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); $('moreBtn').click(); } });
function endRead(){ S.read = Math.max(S.read, R.ch + 1); save(); const then = R.then; R = null; if (then) go(then); else go(S.resume || 'later'); }

function leaveRead(){ if (!R) return; if (R.i >= CH(R.ch).paras.length) return endRead(); R = null; go(S.resume || 'start'); }
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
const ck = id => LANG === 'en' ? id + '__en' : id;
function openChat(id, first){
  PANELS.forEach(p => $(p).hidden = true); setTab('people');
  chatWith = id; if (!S.met.includes(id)) S.met.push(id); save();
  const p = PEOPLE[id];
  showWork(0);
  { const w = (PEOPLE[id] || {}).works || []; $('pGhost').style.backgroundImage = w.length ? `url(assets/img/${w[w.length > 1 ? 1 : 0][0]}.jpg?v=4)` : 'none'; }
  const th = $('pThumbs'); th.innerHTML = '';
  if (p.works.length > 1) p.works.forEach((w, i) => { const b = document.createElement('button'); b.className = 'thumb' + (i ? '' : ' on');
    b.innerHTML = `<img src="assets/img/${w[0]}.jpg?v=4" alt="">`; b.onclick = () => showWork(i); th.appendChild(b); });
  $('chatName').textContent = tr(p.name);
  renderPersonSong();
  const say = []; $('pSay').hidden = !say.length;
  $('pSay').innerHTML = say.map((x, k) => `<p class="mnote" style="--r:${[-1.5,1,-.5,1.5][k % 4]}deg"><button class="mwho" data-id="${x.who}">${esc(nm(x.who))}:</button> ${esc(tr(x))}</p>`).join('');
  $('pSay').querySelectorAll('.mwho').forEach(b => b.onclick = () => openChat(b.dataset.id));
  const sc = SONGCARD[id]; $('pCard').hidden = !sc; $('pCardAside').hidden = !sc;
  if (sc){ $('pCardHead').textContent = tr(sc.head); $('pCardQuote').textContent = tr(sc.quote); $('pCardAside').textContent = tr(sc.aside); }
  $('pSong').classList.toggle('carded', !!sc);
  const hasSong = songs(id).length > 0; $('pVinyl').hidden = !hasSong; $('chat').classList.toggle('with-vinyl', hasSong);
  const row = SHELF.find(r => r[0] === id); $('pVinylLbl').innerHTML = row && row[2] ? labelHTML(row[2]) : '';
  const log = $('chatLog'); log.innerHTML = '';
  const can = !p.sleeps && !p.nochat; $('chatForm').hidden = !can; $('pAsleep').hidden = can || !p.sleeps; $('pAsleep').textContent = tr(p.sleeps) || '';
  $('clearChat').hidden = !can; $('pExpand').hidden = !can;
  if (can){ (S.chats[ck(id)] || []).forEach(m => addMsg(m.role === 'user' ? 'me' : 'them', m.text)); }
  $('chat').classList.remove('expanded'); $('pMenu').hidden = true;
  $('chat').hidden = false; $('chat').scrollTop = 0; requestAnimationFrame(() => { $('chatLog').scrollTop = $('chatLog').scrollHeight; });
  if (first) sendChat(first.charAt(0).toUpperCase() + first.slice(1));
}
function showWork(i){
  const p = PEOPLE[chatWith], w = p.works[i];
  $('pZoom').hidden = !w; $('pPh').hidden = !!w; $('pPh').textContent = tr(UI.bro);
  if (w) $('pArt').src = `assets/img/${w[0]}.jpg?v=4`;
  document.querySelectorAll('.thumb').forEach((b, k) => b.classList.toggle('on', k === i));
}
$('pZoom').onclick = () => { $('lbImg').src = $('pArt').src; $('lightbox').hidden = false; };
$('lbX').onclick = $('lightbox').onclick = e => { if (e.target.id !== 'lbImg') $('lightbox').hidden = true; };
let pSongIdx = 0;
function renderPersonSong(){
  const list = songs(chatWith); $('pSong').hidden = !list.length; if (!list.length) return;
  if (pSongIdx >= list.length) pSongIdx = 0;
  const s = list[pSongIdx]; $('pSongTitle').textContent = s.title; $('pSongDur').textContent = s.dur ? '· ' + s.dur : '';
  $('pList').innerHTML = list.length > 1 ? list.map((x, i) => `<button class="txt small${i===pSongIdx?' on':''}" data-i="${i}">${esc(x.title)}</button>`).join('') : '';
  $('pList').querySelectorAll('button').forEach(b => b.onclick = () => { pSongIdx = +b.dataset.i; renderPersonSong(); });
  $('pLyricsBtn').hidden = !s.lyrics; $('pLyrics').textContent = s.lyrics || ''; $('pLyrics').hidden = true; $('pLyricsBtn').setAttribute('aria-expanded','false');
  syncP();
}
function personSongOn(){ const s = songs(chatWith)[pSongIdx]; return s && curSong === s.file; }
function syncP(){
  if (!chatWith || $('pSong').hidden) return;
  const mine = personSongOn(); $('pPlay').textContent = mine && !audio.paused ? '❚❚' : '▶'; $('pVinylIco').textContent = $('pPlay').textContent; $('chat').classList.toggle('spinning', mine && !audio.paused);
  const p = mine && audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  $('pFill').style.width = p + '%'; $('pKnob').style.left = p + '%';
  $('pTime').textContent = fmt(mine ? audio.currentTime : 0); $('pDur').textContent = fmt(mine ? audio.duration : 0);
}
$('pVinyl').onclick = () => $('pPlay').click();
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
$('pExpand').onclick = () => { const on = $('chat').classList.toggle('expanded'); $('pExpand').textContent = tr(on ? UI.toArt : UI.expand); if (on) $('chatLog').lastElementChild?.scrollIntoView({block:'end'}); };
function addMsg(cls, text){
  const d = document.createElement('div'); d.className = 'line-msg ' + cls;
  const who = cls.includes('me') ? tr(UI.you) : nm(chatWith);
  d.innerHTML = `<span class="who">${esc(who)}</span><span class="said"></span>`; d.querySelector('.said').textContent = text;
  $('chatLog').appendChild(d); $('chatLog').scrollTop = $('chatLog').scrollHeight; return d.querySelector('.said');
}
async function sendChat(m){
  const id = chatWith; addMsg('me', m); const w = addMsg('them wait', '…');
  const key = ck(id), h = S.chats[key] || (S.chats[key] = []);
  try{ const a = await ask(id, LANG === 'en' ? m + '\n\n(Reply in English.)' : m, h); h.push({role:'user', text:m}, {role:'model', text:a}); S.chats[key] = h.slice(-40); save(); w.parentNode.classList.remove('wait'); w.textContent = a; }
  catch(e){ w.textContent = tr(UI.silence); }
  finally{ $('chatLog').scrollTop = $('chatLog').scrollHeight; }
}
$('chatForm').addEventListener('submit', e => { e.preventDefault(); const i = $('chatInput'); const m = i.value.trim(); if (!m) return; i.value = ''; sendChat(m); });
$('chatBack').onclick = () => { $('chat').hidden = true; openPanel('people'); };
$('personHome').onclick = () => $('homeBtn').click();
$('clearChat').onclick = () => { S.chats[ck(chatWith)] = []; save(); $('chatLog').innerHTML = ''; $('pMenu').hidden = true; };

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
    b.innerHTML = (w ? `<img src="assets/img/${w[0]}.jpg?v=4" alt="${esc(tr(p.name))}" loading="lazy">` : `<span class="ph">${tr(UI.bro)}</span>`) +
      `<span class="gal-name">${esc(tr(p.name))} <span class="meet">${tr(UI.meet)}</span></span>`;
    b.onclick = () => openChat(id);
    box.appendChild(b);
  });
}
const songs = id => (window.SONGS_DATA && window.SONGS_DATA[id]) || [];
const labelHTML = img => img ? `<img src="assets/img/${img}.jpg?v=4" alt="">` : '';
function renderShelf(){
  const last = detailId; $('detail').hidden = true; $('shelf').hidden = false; const box = $('shelf'); box.innerHTML = '';
  SHELF.forEach(([id, name, img]) => {
    const n = songs(id).length; const b = document.createElement('button'); b.className = 'rec'; b.disabled = !n; b.dataset.id = id;
    b.innerHTML = `<span class="disc"><span class="lbl${img ? '' : ' ph'}">${img ? labelHTML(img) : tr(UI.bro)}</span><span class="pin"></span></span><b>${esc(nm(id) || name)}</b>` +
      (n ? `<small>${n} ${plural(n)}</small>` : `<small class="soon">${tr(UI.soon)}</small>`);
    if (n) b.onclick = () => openDetail(id, false);
    box.appendChild(b);
  });
  markPlaying();
  const bb = $('shelfBack');
  if (last && songs(last).length){ bb.hidden = false; bb.innerHTML = `<span class="bb-disc"><span class="lbl">${labelHTML((SHELF.find(r => r[0] === last) || [])[2] || '')}</span></span><span class="bb-t">← ${LANG === 'en' ? 'back to' : 'назад к пластинке'}<b>${esc(nm(last))}</b></span>`; bb.onclick = () => openDetail(last, false); }
  else bb.hidden = true;
}
const audio = $('player'); let curSong = null, curId = null;
function fmt(s){ s = Math.floor(s || 0); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
let detailId = null;
/* обложки конвертов: рисунок героя на лицевой стороне + своя деталь */
const SLEEVES = {
  weaver: {sym:'sym_weaver', fx:'old'},
};
const BACKNOTE = {
  cat:{ru:'Двести сорок семь. Четыре за водонапорной башней не видно. Я всё равно их считаю.',en:'Two hundred forty-seven. Four are hidden behind the water tower. I count them anyway.'},
  weaver:{ru:'Лужи цветут. Никто не предупреждал. Теперь ты знаешь.',en:'Puddles bloom. Nobody warned me. Now you know.'},
  crystal:{ru:'Слушай медленно. Я настраивал долго.',en:'Listen slowly. I took a long time to tune it.'},
  dream:{ru:'Я не знаю, откуда ты. Но я здесь.',en:"I don't know where you came from. But I'm here."},
  drpak:{ru:'Это не я. Это она. Я просто стоял рядом.',en:"That wasn't me. That was her. I was just standing there."},
  liora:{ru:'Я знаю. Поэтому и не говорила.',en:"I know. That's why I didn't tell you."},
  shiny:{ru:'Ой, это что, золото? Подойди поближе, дорогой.',en:'Oh! Is that gold? Come a little closer, darling.'},
  keeper:{ru:'Если увидишь жука, не говори ему, что я спрашивал.',en:"If you see the beetle, don't tell him I asked."},
};
const WITH = {cat:{ru:'с Котом',en:'Cat'},weaver:{ru:'с Вивер',en:'Weaver'},crystal:{ru:'с Кристаллом',en:'Crystal'},keeper:{ru:'с Кипером',en:'Kiper'},dream:{ru:'с Дримом',en:'Dream'},liora:{ru:'с Лиорой',en:'Liora'},drpak:{ru:'с Паком',en:'Pak'},shiny:{ru:'с Шайни',en:'Shiny'},shiny_bro:{ru:'с Братом',en:"Shiny's Brother"},talk_mushroom:{ru:'с Грибом',en:'Mushroom'},angry_forest:{ru:'со Злым Лесом',en:'the Angry Forest'}};
let dIdx = 0;
function openDetail(id, autoplay){
  detailId = id; dIdx = 0; $('shelfBack').hidden = true;
  const row = SHELF.find(r => r[0] === id); const list = songs(id);
  $('shelf').hidden = true; $('detail').hidden = false; $('music').scrollTop = 0;
  $('dLabel').className = 'lbl' + (row[2] ? '' : ' ph'); $('dLabel').innerHTML = row[2] ? labelHTML(row[2]) : tr(UI.bro);
  $('dSong').textContent = nm(id) || row[1];                       // на конверте — имя героя
  $('dEmpty').hidden = !!list.length; $('dEmpty').textContent = tr(UI.songSoon); $('dPlayer').hidden = !list.length;
  $('sleeve').classList.remove('flipped');
  const sl = SLEEVES[id]; $('dFront').className = 'face front' + (sl ? ' has-cover fx-' + (sl.fx || 'none') : '');
  $('dCover').style.backgroundImage = sl ? (sl.sym ? `url(assets/img/${sl.sym}.png?v=1)` : `url(assets/img/${sl.img}.jpg?v=4)`) : ''; $('dCover').style.backgroundPosition = sl && sl.pos ? sl.pos : ''; $('dCover').style.setProperty('--cs', sl && sl.size ? sl.size : 'cover'); $('recs').classList.remove('out'); $('record').classList.remove('recs-open');
  const w = (PEOPLE[id] || {}).works || []; $('dBackArt').src = w.length ? `assets/img/${w[0][0]}.jpg?v=4` : ''; $('dBackArt').hidden = !w.length;
  $('dBackNote').textContent = tr(BACKNOTE[id]) || '';
  const canTalk = PEOPLE[id] && !PEOPLE[id].sleeps && !PEOPLE[id].nochat; $('dTalk').hidden = !canTalk;
  $('dTalk').textContent = (LANG === 'en' ? 'Talk to ' : 'Поговорить ') + tr(WITH[id] || {ru:nm(id),en:nm(id)});
  // если уже играет песня этого героя — показываем её
  const playing = list.findIndex(x => x.file === curSong); if (playing >= 0) dIdx = playing;
  selectTrack(dIdx, autoplay); renderCrate();
}
function renderCrate(){
  const box = $('crateSleeves'); box.innerHTML = '';
  SHELF.filter(([id]) => songs(id).length).forEach(([id], k) => { const has = true, cur = id === detailId;
    const b = document.createElement('button'); b.className = 'cs' + (has ? '' : ' empty') + (cur ? ' out' : '');
    b.style.setProperty('--tilt', ((k * 37) % 7 - 3) * .6 + 'deg'); b.disabled = !has || cur;
    const sl = SLEEVES[id]; if (sl){ b.classList.add('cover', 'fx-' + (sl.fx || 'none')); b.style.setProperty('--cov', sl.sym ? `url(assets/img/${sl.sym}.png?v=1)` : `url(assets/img/${sl.img}.jpg?v=4)`); }
    b.dataset.id = id; const img = (SHELF.find(r => r[0] === id) || [])[2];
    b.innerHTML = `<i class="peek" aria-hidden="true"><i class="pd"><i class="plbl">${labelHTML(img)}</i></i></i><span>${esc(nm(id))}</span>`; b.title = has ? nm(id) : tr(UI.soonLow);
    if (has && !cur) b.onclick = () => { b.classList.add('pull'); setTimeout(() => openDetail(id, false), 260); };
    box.appendChild(b); });
  markPlaying();
}
$('crateFront').onclick = renderShelf;
function curTrack(){ return songs(detailId)[dIdx]; }
function selectTrack(i, play){
  const list = songs(detailId); dIdx = i; const s = list[i];
  $('dTracks').innerHTML = list.map((x, k) => `<button class="trk${k === i ? ' on' : ''}" data-k="${k}"><span class="n">${k + 1}</span>${esc(x.title)}${x.by ? `<small> · ${esc(tr(x.by))}</small>` : ''}</button>`).join('');
  $('dTracks').querySelectorAll('.trk').forEach(b => b.onclick = () => selectTrack(+b.dataset.k, true));
  $('dName').textContent = '';
  $('dTracks').hidden = list.length < 2;
  $('dNow').textContent = s ? s.title : '';
  $('dNowSub').textContent = s ? (s.by ? tr(s.by).replace(/^(поёт|sung by) /,'') : nm(detailId)) + (s.no ? (LANG === 'en' ? ' · Record ' : ' · Запись ') + String(s.no).padStart(2,'0') : '') : '';
  $('sheet').hidden = !(s && s.lyrics); $('dLyrics').textContent = s ? s.lyrics || '' : ''; $('sheet').classList.remove('out'); $('record').style.setProperty('--drop','0px'); $('dLyricsBtn').setAttribute('aria-expanded','false');
  if (s && play){ if (curSong !== s.file){ audio.src = s.file; curSong = s.file; } curId = detailId; audio.play().catch(() => {}); if (!S.heard.includes(detailId)) { S.heard.push(detailId); save(); } }
  syncPlay(); paintSeek();
}
function syncPlay(){ const s = curTrack(), on = !!s && curSong === s.file && !audio.paused; $('dPlay').textContent = on ? '❚❚' : '▶'; $('stage').classList.toggle('playing', on); }
$('dPlay').onclick = () => { const s = curTrack(); if (!s) return; if (curSong !== s.file) return selectTrack(dIdx, true); audio.paused ? audio.play().catch(() => {}) : audio.pause(); };
['play','pause','ended','timeupdate','loadedmetadata'].forEach(ev => audio.addEventListener(ev, () => { if (chatWith) syncP(); }));
audio.addEventListener('play', syncPlay); audio.addEventListener('pause', syncPlay); audio.addEventListener('ended', syncPlay);
function paintSeek(){ const s = curTrack(), mine = s && curSong === s.file; const p = mine && audio.duration ? audio.currentTime / audio.duration * 100 : 0; $('dFill').style.width = p + '%'; $('dKnob').style.left = p + '%';
  $('dTime').textContent = fmt(mine ? audio.currentTime : 0); $('dDur').textContent = fmt(mine ? audio.duration : 0); }
audio.addEventListener('timeupdate', paintSeek); audio.addEventListener('loadedmetadata', paintSeek);
(() => { const th = $('dThread'); let drag = false;
  const at = e => { const r = th.getBoundingClientRect(); const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); const s = curTrack(); if (audio.duration && s && curSong === s.file) { audio.currentTime = x * audio.duration; paintSeek(); } };
  th.addEventListener('pointerdown', e => { drag = true; th.setPointerCapture(e.pointerId); at(e); });
  th.addEventListener('pointermove', e => { if (drag) at(e); });
  th.addEventListener('pointerup', () => { drag = false; }); })();
audio.volume = .8;
$('dVol').oninput = e => { audio.volume = e.target.value / 100; audio.muted = false; $('dWave').style.opacity = audio.volume ? 1 : .2; };
$('dMute').onclick = () => { audio.muted = !audio.muted; $('dWave').style.opacity = audio.muted ? .2 : 1; };
$('dLyricsBtn').onclick = () => { const sh = $('sheet'), on = !sh.classList.contains('out'); sh.classList.toggle('out', on); $('dLyricsBtn').setAttribute('aria-expanded', String(on));
  const drop = on ? Math.min($('dLyrics').scrollHeight + 40, innerHeight * .62) : 0;
  $('record').style.setProperty('--drop', drop + 'px'); };
$('dLyricsTop').onclick = () => $('dLyricsBtn').click();
$('dFlip').onclick = $('dFlipBack').onclick = () => $('sleeve').classList.toggle('flipped');
$('dTalk').onclick = () => { const id = detailId; $('music').hidden = true; openChat(id); };
function renderRecs(){
  const ul = $('recsList'); ul.innerHTML = '';
  [...SHELF].sort((a, b) => (songs(b[0]).length > 0) - (songs(a[0]).length > 0)).forEach(([id]) => { const list = songs(id), li = document.createElement('li');
    const b = document.createElement('button'); b.disabled = !list.length; if (id === detailId) b.className = 'cur';
    b.innerHTML = `<b>${esc(nm(id))}</b><small>${list.length ? esc(list[0].title) : tr(UI.soonLow)}</small>`;
    b.onclick = () => { $('recs').classList.remove('out'); $('record').classList.remove('recs-open'); setTimeout(() => openDetail(id, false), 250); };
    li.appendChild(b); ul.appendChild(li); });
}
$('detailBack').onclick = () => { const r = $('recs'); if (!r.classList.contains('out')) renderRecs(); r.classList.toggle('out'); $('record').classList.toggle('recs-open', r.classList.contains('out')); };
$('recsShelf').onclick = () => { $('recs').classList.remove('out'); $('record').classList.remove('recs-open'); renderShelf(); };
/* играющая пластинка выглядывает из конверта в ящике, на полке крутится её наклейка */
function markPlaying(){ const has = !!curSong && !audio.ended && (!audio.paused || audio.currentTime > 0), on = has && !audio.paused;
  document.querySelectorAll('#crateSleeves .cs, #shelf .rec').forEach(b => { const p = has && b.dataset.id === curId; b.classList.toggle('playing', p); b.classList.toggle('spin', p && on); }); }
/* мини-плеер: музыка играет дальше, пока ходишь по сайту */
function miniSync(){
  const dt = curTrack(), onDetail = (!$('music').hidden && !$('detail').hidden && !!dt && dt.file === curSong) || (!$('chat').hidden && personSongOn());
  const show = !!curSong && !onDetail && (!audio.paused || audio.currentTime > 0) && !audio.ended;
  $('mini').classList.toggle('show', show); markPlaying(); if (!show || !curId) return;
  const pr = audio.duration ? audio.currentTime / audio.duration * 100 : 0; $('miniFill').style.width = pr + '%'; $('miniKnob').style.left = pr + '%';
  const row = SHELF.find(r => r[0] === curId) || [curId, (PEOPLE[curId]||{}).name || '', ''];
  if ($('mini').dataset.id !== curId){ $('mini').dataset.id = curId; $('miniLbl').className = 'lbl' + (row[2] ? '' : ' ph'); $('miniLbl').innerHTML = row[2] ? labelHTML(row[2]) : ''; }
  $('miniTitle').textContent = (songs(curId)[0] || {}).title || ''; $('miniName').textContent = nm(curId) || row[1];
  $('miniIco').textContent = audio.paused ? '▶' : '❚❚'; $('mini').classList.toggle('playing', !audio.paused);
}
['play','pause','ended','emptied','timeupdate'].forEach(ev => audio.addEventListener(ev, miniSync));
(() => { const th = $('miniThread'); let drag = false;
  const at = e => { if (!audio.duration) return; const r = th.getBoundingClientRect(); audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration; miniSync(); };
  th.addEventListener('pointerdown', e => { drag = true; th.setPointerCapture(e.pointerId); at(e); });
  th.addEventListener('pointermove', e => { if (drag) at(e); });
  th.addEventListener('pointerup', () => { drag = false; }); })();
/* редкая реакция Кипера на музыку */
audio.addEventListener('play', () => { if (app.classList.contains('mode-talk') && $('music').hidden && $('chat').hidden && !busy && Math.random() < .3) { act('twitch'); showLine({ru:'А, эту оставь. Под неё я лучше вспоминаю неправильно.',en:'Ah, leave this one. I remember things wrong better to it.'}); } });
setInterval(miniSync, 700);
/* пластинки крутит скрипт: на паузе угол замирает, при игре продолжается с того же места */
let discAngle = 0, lastT = 0, dAng = 0, pAng = 0;
(function spinLoop(t){
  const dt = lastT && !audio.paused ? (t - lastT) * 360 / 14000 : 0; lastT = t;
  discAngle = (discAngle + dt) % 360;                         // мини-пластинка = то, что играет
  const dc = curTrack(); if (dc && curSong === dc.file) dAng = (dAng + dt) % 360;   // большая крутится, только если играет её песня
  if (personSongOn()) pAng = (pAng + dt) % 360;                                  // на странице героя — только его песня
  $('dLabel').style.transform = `rotate(${dAng}deg)`;   // крутится наклейка, блик на пластинке стоит, как в жизни
  $('miniLbl').style.transform = `rotate(${discAngle}deg)`;
  $('pVinylLbl').style.transform = `rotate(${pAng}deg)`;
  requestAnimationFrame(spinLoop);
})();
$('miniDisc').onclick = () => audio.paused ? audio.play().catch(() => {}) : audio.pause();
$('miniOpen').onclick = () => { if (curId) { openPanel('music'); openDetail(curId, false); } };
$('miniX').onclick = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); curSong = null; curId = null; miniSync(); syncPlay(); };
function openSong(id){ openPanel('music'); openDetail(id, false); }
function renderBook(){
  const ol = $('tocList'); ol.innerHTML = '';
  titles().forEach((t, i) => { const li = document.createElement('li'); const b = document.createElement('button'); b.className = 'ch';
    const have = i < window.CHAPTERS.length, ok = have; b.disabled = !ok;
    b.innerHTML = `<span class="n">${i===0?(LANG==='en'?'Prologue':'Пролог'):i}</span><span>${esc(t)}</span>` + (!have ? ` <span class="n">${tr(UI.soonLow)}</span>` : '');
    b.onclick = () => { closePanels(); token++; startRead(i, null); }; li.appendChild(b); ol.appendChild(li); });
}

$('resetBtn').onclick = () => { try { localStorage.removeItem('keeper-state'); } catch(e) {} location.reload(); };

/* ---------- переключатель языка ---------- */
const STATIC = {
  noteHead:{ru:'Чтобы опять не объяснять',en:"So I don't have to explain again"}, nStory:{ru:'Продолжить историю',en:'Continue the story'},
  nPeople:{ru:'Рисунки и персонажи',en:'Drawings & characters'}, nMusic:{ru:'Включить музыку',en:'Play some music'}, nBook:{ru:'Открыть книгу',en:'Open the book'},
  doodle:{ru:'жук — ?',en:'beetle — ?'}, toKeeperArrow:{ru:'← К Киперу',en:'← To Kiper'}, toKeeper:{ru:'К Киперу',en:'To Kiper'},
  soundTitle:{ru:'Звук мира',en:'The Sound of the World'}, allChars:{ru:'← Все персонажи',en:'← All characters'}, lyrics:{ru:'Текст песни',en:'Lyrics'},
  allDrawings:{ru:'← Все рисунки',en:'← All drawings'}, expand:UI.expand, noteTabT:{ru:'записка Кипера',en:"Kiper's note"}, yourMsg:{ru:'Твоё сообщение',en:'Your message'}, allRecordsShelf:{ru:'Все пластинки',en:'All records'}, soundSub:{ru:'Песни из Сада, Леса и дальше',en:'Songs from the Garden, the Forest, and Beyond'}, allRecords:{ru:'Все записи',en:'All records'}, flip:{ru:'Перевернуть ↻',en:'Turn over ↻'}, credits:{ru:'Слова — SunnyChimera · Музыка — Suno',en:'Lyrics — SunnyChimera · Music — Suno'},
  shelfView:{ru:'все пластинки на полке',en:'all records on the shelf'}, lyricsHide:{ru:'Свернуть ↑',en:'Fold away ↑'}, clearChat:{ru:'Очистить чат',en:'Clear chat'}, restartChat:{ru:'Начать разговор заново',en:'Start the conversation over'},
  write:{ru:'Поговори со мной…',en:'Talk to me…'}, close:{ru:'Закрыть',en:'Close'}, album:{ru:'Из альбома',en:'From the album'}, book:{ru:'Книга',en:'The Book'},
  bookLead:{ru:'Ну если ты настаиваешь на порядке…',en:'Well, if you insist on order…'}, reset:{ru:'Начать всё сначала',en:'Start everything over'},
  footBrand:{ru:'Мир Дриады · <em>Часть первая</em>',en:"The Dryad's World · <em>Part One</em>"}, about:{ru:'Об авторе и мире',en:'About the author & world'},
  legal:{ru:'© 2026 sunnyChimera. Тексты и рисунки. Все права защищены · Персонажи отвечают с помощью ИИ',en:'© 2026 sunnyChimera. Texts and drawings. All rights reserved · Characters respond with AI'},
};
function applyStatic(){
  document.documentElement.lang = LANG; document.title = LANG === 'en' ? 'Kiper Tells' : 'Кипер рассказывает';
  document.querySelectorAll('[data-i18n]').forEach(el => { const v = STATIC[el.dataset.i18n]; if (v) el.textContent = tr(v); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { const v = STATIC[el.dataset.i18nHtml]; if (v) el.innerHTML = tr(v); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { const v = STATIC[el.dataset.i18nPh]; if (v) el.placeholder = tr(v); });
  $('langBtn').textContent = LANG === 'en' ? 'RU' : 'EN';
  $('langBtn').setAttribute('aria-label', LANG === 'en' ? 'Переключить на русский' : 'Switch to English');
}
$('langBtn').onclick = () => {
  LANG = LANG === 'en' ? 'ru' : 'en'; try { localStorage.setItem('keeper-lang', LANG); } catch(e) {}
  applyStatic();
  if (!$('people').hidden) renderPeople();
  if (!$('toc').hidden) renderBook();
  if (!$('music').hidden){ if (!$('detail').hidden && detailId) openDetail(detailId, false); else renderShelf(); }
  if (!$('chat').hidden && chatWith) openChat(chatWith);
  if ($('mini').dataset) { $('mini').dataset.id = ''; miniSync(); }
  if (R){ const i = R.i, ch = R.ch, then = R.then; token++; startRead(ch, then); while (R.i < i && addPara()); if (R.i >= CH(ch).paras.length) chapterDone(); }
  else if (S.node && N[S.node] && N[S.node].read === undefined) go(S.node);
};
applyStatic();

/* телефон: записка свёрнута в уголок, раскрывается по нажатию */
const mq = matchMedia('(max-width:1279px)');
function noteMin(on){ $('note').classList.toggle('min', on); $('noteTab').setAttribute('aria-expanded', String(!on)); }
if (mq.matches) noteMin(true);
mq.addEventListener?.('change', e => noteMin(e.matches));
$('noteTab').onclick = e => { e.stopPropagation(); noteMin(!$('note').classList.contains('min')); };
document.querySelectorAll('.note button[data-tab]').forEach(b => b.addEventListener('click', () => { if (mq.matches) noteMin(true); }));
document.addEventListener('click', e => { if (mq.matches && !$('note').contains(e.target)) noteMin(true); });

/* старт */
const INTRO_V = 2;   // новое вступление: показать один раз всем, кто был раньше (главы и чаты остаются)
if ((S.intro || 1) < INTRO_V) { S.intro = INTRO_V; S.node = null; S.resume = 'start'; save(); }
setTimeout(() => go(S.node && S.node !== 'start' ? 'back' : 'start'), 600);
})();
