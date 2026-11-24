/* ==========================================================================
   RED NIGHT | SCP RP — логика экрана загрузки
   Работает в Garry's Mod (движок вызывает window.GameDetails и др.)
   и в обычном браузере (демо-режим для предпросмотра).
   ES5 — совместимость с HTML-панелью клиента Garry's Mod.
   ========================================================================== */

(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var els = {
    bg: document.getElementById('bg'),
    conn: document.getElementById('conn'),
    clock: document.getElementById('clock'),
    pct: document.getElementById('pct'),
    bar: document.getElementById('bar'),
    fill: document.getElementById('barFill'),
    status: document.getElementById('status'),
    file: document.getElementById('file'),
    map: document.getElementById('mapName'),
    mode: document.getElementById('gamemode'),
    done: document.getElementById('filesDone'),
    total: document.getElementById('filesTotal'),
    steam: document.getElementById('steamId'),
    tip: document.getElementById('tipText'),
    embers: document.getElementById('embers')
  };

  var S = {
    total: 0,
    needed: 0,
    target: 0,      // целевой процент
    shown: 0,       // отображаемый процент
    connected: false,
    demo: false,
    demoStepTimer: null,
    demoTick: null
  };

  function text(node, value) {
    if (node && value !== undefined && value !== null) node.textContent = String(value);
  }

  /* ------------------------------------------------------------- КАРКАС -- */

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tickClock() {
    var d = new Date();
    text(els.clock, pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()));
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* -------------------------------------------------------- ФОТО-СЛАЙДЫ -- */

  var slides = els.bg ? els.bg.getElementsByTagName('div') : [];
  var slideIndex = 0;

  function nextSlide() {
    if (!slides.length) return;
    slides[slideIndex].className = 'bg-img';
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].className = 'bg-img is-on';
  }

  if (slides.length > 1) setInterval(nextSlide, 7200);

  /* ------------------------------------------------------- ПАРАЛЛАКС МЫШИ */

  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function onMove(e) {
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    mouse.tx = ((e.clientX / w) - 0.5) * 2;
    mouse.ty = ((e.clientY / h) - 0.5) * 2;
  }

  function parallax() {
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    if (els.bg) {
      els.bg.style.transform = 'translate3d(' + (mouse.x * -1.1).toFixed(2) + '%, ' +
                                             (mouse.y * -0.8).toFixed(2) + '%, 0)';
    }
    requestAnimationFrame(parallax);
  }

  document.addEventListener('mousemove', onMove, false);
  if (window.requestAnimationFrame) parallax();

  /* --------------------------------------------------------------- УГЛИ -- */

  var canvas = els.embers;
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var embers = [];
  var W = 0, H = 0, DPR = 1;

  function sizeCanvas() {
    if (!ctx) return;
    DPR = window.devicePixelRatio || 1;
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seedEmbers() {
    embers = [];
    var count = Math.max(28, Math.min(70, Math.round((W * H) / 26000)));
    for (var i = 0; i < count; i++) {
      embers.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.9,
        vy: -(0.12 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.25,
        a: 0.15 + Math.random() * 0.5,
        ph: Math.random() * Math.PI * 2,
        sp: 0.008 + Math.random() * 0.02
      });
    }
  }

  function drawEmbers() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < embers.length; i++) {
      var p = embers[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.ph) * 0.22;
      p.ph += p.sp;
      if (p.y < -10) { p.y = H + 8; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 8;
      if (p.x > W + 10) p.x = -8;

      var alpha = p.a * (0.55 + 0.45 * Math.sin(p.ph * 1.7));
      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      grad.addColorStop(0, 'rgba(255, 120, 96, ' + alpha.toFixed(3) + ')');
      grad.addColorStop(0.35, 'rgba(255, 50, 45, ' + (alpha * 0.45).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(180, 10, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(drawEmbers);
  }

  if (ctx) {
    sizeCanvas();
    seedEmbers();
    if (window.requestAnimationFrame) drawEmbers();
    window.addEventListener('resize', function () {
      sizeCanvas();
      seedEmbers();
    }, false);
  }

  /* ------------------------------------------------------------- ПРОГРЕСС */

  var lastShown = -1;

  function paint() {
    var p = Math.max(0, Math.min(100, Math.round(S.shown)));
    if (p !== lastShown) {
      text(els.pct, p);
      if (els.fill) els.fill.style.width = p + '%';
      lastShown = p;
    }
  }

  function animate() {
    if (S.shown < S.target) {
      S.shown += Math.max(0.35, (S.target - S.shown) * 0.14);
      if (S.shown > S.target) S.shown = S.target;
    } else if (S.shown > S.target) {
      S.shown = S.target;
    }
    paint();
    requestAnimationFrame(animate);
  }

  if (window.requestAnimationFrame) {
    requestAnimationFrame(animate);
  } else {
    setInterval(function () { S.shown = S.target; paint(); }, 120);
  }

  function setProgress(percent) {
    S.target = Math.max(0, Math.min(100, percent));
  }

  function setIdle(on) {
    if (!els.bar) return;
    els.bar.className = on ? 'bar is-idle' : 'bar';
    if (on) {
      S.target = 0;
      S.shown = 0;
      lastShown = -1;
      paint();
    }
  }

  /* ------------------------------------------------------------- СТАТУСЫ */

  function setStatus(s) {
    var v = String(s || '').replace(/\s+/g, ' ').replace(/\.+$/, '');
    text(els.status, v ? v.toUpperCase() : 'СИНХРОНИЗАЦИЯ…');
  }

  function setFile(f) {
    var name = String(f || '');
    if (name.length > 74) name = '…' + name.slice(-73);
    text(els.file, name || '—');
  }

  function connected() {
    if (S.connected) return;
    S.connected = true;
    stopDemo();
    setIdle(false);
    text(els.conn, 'ПОДКЛЮЧЕНО');
  }

  /* ------------------------------------------------ GARRY'S MOD API ----- */

  // Вызывается движком один раз, когда клиент получил сведения о сервере.
  window.GameDetails = function (servername, serverurl, mapname, maxplayers, steamid, gamemode) {
    connected();
    if (servername) document.title = servername;
    if (mapname) text(els.map, mapname);
    if (gamemode) text(els.mode, String(gamemode).toUpperCase());
    if (steamid) text(els.steam, steamid);
  };

  // Общее количество файлов для скачивания.
  window.SetFilesTotal = function (total) {
    connected();
    S.total = parseInt(total, 10) || 0;
    text(els.total, S.total);
    if (S.total > 0) {
      setIdle(false);
      S.needed = Math.min(S.needed, S.total);
      setProgress(((S.total - S.needed) / S.total) * 100);
      text(els.done, S.total - S.needed);
    }
  };

  // Сколько файлов осталось.
  window.SetFilesNeeded = function (needed) {
    connected();
    S.needed = parseInt(needed, 10) || 0;
    if (S.total > 0) {
      var done = Math.max(0, S.total - S.needed);
      text(els.done, done);
      setProgress((done / S.total) * 100);
    }
  };

  // Имя скачиваемого файла.
  window.DownloadingFile = function (fileName) {
    connected();
    setFile(fileName);
  };

  // Текст текущего этапа подключения.
  window.SetStatusChanged = function (status) {
    connected();
    setStatus(status);
  };

  /* -------------------------------------------------------- ПАРАМЕТРЫ URL */

  function query(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)', 'i').exec(window.location.search || '');
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return m[1]; }
  }

  var qMap = query('map') || query('mapname') || query('Map');
  var qSteam = query('steamid') || query('SteamId');

  if (qMap && qMap !== '%m') text(els.map, qMap);
  if (qSteam && qSteam !== '%s') text(els.steam, qSteam);

  /* ----------------------------------------------------------- ДЕМО-РЕЖИМ */

  var DEMO_FILES = [
    'materials/rednight/ui/hud_frame.vmt',
    'models/props/cs_office/computer.mdl',
    'sound/rednight/ambient/corridor_loop.wav',
    'materials/models/player/combine_soldier.vmt',
    'lua/autorun/client/cl_scp_hud.lua',
    'models/scp/containment_door.mdl',
    'materials/scp/ui/terminal_screen.vmt',
    'sound/rednight/alarm_red.wav',
    'materials/decals/blood_splat_04.vmt',
    'models/props_lab/monitor01a.mdl',
    'sound/ambient/atmosphere/tonal_02.wav',
    'materials/rednight/ui/stamp_classified.vmt'
  ];

  var DEMO_STATUS = [
    'Проверка целостности протокола…',
    'Запрос манифеста сервера…',
    'Загрузка ресурсов',
    'Синхронизация моделей',
    'Загрузка материалов',
    'Монтирование дополнений',
    'Проверка контрольных сумм',
    'Почти готово…'
  ];

  function demoStep() {
    var p = S.target + 0.6 + Math.random() * 3.2;
    if (p >= 100) {
      p = 100;
      if (S.demoTick) { clearInterval(S.demoTick); S.demoTick = null; }
      setStatus('Синхронизация завершена. Входим…');
      setTimeout(demoReset, 7000);
    } else {
      setStatus(DEMO_STATUS[Math.min(DEMO_STATUS.length - 1, Math.floor(p / 14))]);
    }
    setFile(DEMO_FILES[Math.floor(Math.random() * DEMO_FILES.length)]);
    S.total = 428;
    text(els.total, 428);
    text(els.done, Math.round((p / 100) * 428));
    setProgress(p);
  }

  function demoReset() {
    if (S.connected || !S.demo) return;
    S.target = 0;
    S.shown = 0;
    lastShown = -1;
    paint();
    setStatus(DEMO_STATUS[0]);
    setFile('—');
    text(els.done, 0);
    S.demoTick = setInterval(demoStep, 480);
  }

  function startDemo() {
    if (S.connected) return;
    S.demo = true;
    text(els.conn, 'ДЕМО-РЕЖИМ · ПРЕДПРОСМОТР');
    text(els.map, 'rp_red_night_v3');
    text(els.mode, 'SCP RP');
    text(els.steam, '76561198000000000');
    setIdle(false);
    if (S.demoTick) { clearInterval(S.demoTick); S.demoTick = null; }
    S.demoStepTimer = setTimeout(function () {
      S.demoTick = setInterval(demoStep, 480);
    }, 500);
  }

  function stopDemo() {
    S.demo = false;
    if (S.demoTick) { clearInterval(S.demoTick); S.demoTick = null; }
    if (S.demoStepTimer) { clearTimeout(S.demoStepTimer); S.demoStepTimer = null; }
  }

  setIdle(true);

  // Если движок молчит 2.2 с — это обычный браузер, включаем предпросмотр.
  setTimeout(function () { if (!S.connected) startDemo(); }, 2200);

  /* ---------------------------------------------------------------- СОВЕТЫ */

  var TIPS = [
    'Держите рацию включённой. Тишина в эфире — тоже информация.',
    'Не входите в сектор без сопровождения: дверь закрывается быстрее, чем вы думаете.',
    'Если свет мигнул трижды — у вас есть четыре секунды, чтобы уйти.',
    'Не смотрите в темноту дольше трёх секунд. Она смотрит в ответ.',
    'Медик не спасёт от того, что уже внутри. Докладывайте сразу.',
    'Красный свет — не тревога. Тревога — когда он гаснет.',
    'Проверяйте документы. Особенно если человек уверен, что они у него есть.',
    'Никогда не отвечайте на стук из закрытого шкафа.'
  ];

  var tipIndex = 0;
  setInterval(function () {
    tipIndex = (tipIndex + 1) % TIPS.length;
    text(els.tip, TIPS[tipIndex]);
  }, 6500);

})();
