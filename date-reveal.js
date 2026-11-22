// Royale - the date reveal.
//
// Three plaques that stay empty until the guest presses "Reveal the Date",
// then roll like dials and settle on the wedding date - day, then month, then
// year. The same mechanism as papercut's date-reveal.js, on Royale's own
// markup and classes (see "date reveal" in styles.css).
//
// The date is the section's data-date, YYYY-MM-DD. Left empty it falls back
// to 15 days from today, which is papercut's own placeholder date.
(function () {
  'use strict';

  var section = document.getElementById('ryDateReveal');
  if (!section) return;

  var MONTHS = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];
  var MONTHS_LONG = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];

  var when = resolveDate(section.getAttribute('data-date'));
  var dateCard = document.getElementById('ryDateCard');
  var after = document.getElementById('ryRevealAfter');
  var said = document.getElementById('ryRevealSaid');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var spent = false;
  if (dateCard) dateCard.addEventListener('click', function () { if (!spent) run(); });

  // ---- the reveal -----------------------------------------------------------

  function run() {
    // Once per visit - a refresh brings the empty plaques back.
    if (spent) return;
    spent = true;

    section.classList.add('is-revealing');
    if (dateCard) {
      dateCard.classList.add('is-pressed');
      window.setTimeout(function () { dateCard.classList.remove('is-pressed'); }, 180);
    }

    if (reduced) {
      // No roll: the values fade in, in the same date -> month -> year order.
      settleAll();
      announce();
      window.setTimeout(finish, 90 + 3 * 260 + 420);
      return;
    }

    // All dials start together and the later ones simply run longer, which
    // is how a real set of dials behaves. (Speed boosted by 10%)
    roll('days', dayCells(), 2, 1440);
    roll('hours', hourCells(), 2, 1890);
    roll('minutes', minuteCells(), 2, 2340);
    roll('seconds', secondCells(), 2, 2790);

    // The gold goes up the moment the last dial lands, and the plaques knock
    // just behind it - so they jump at the burst rather than having quietly
    // settled one at a time on the way there.
    window.setTimeout(function () {
      confetti();
      flowerShower();
      knock();
    }, 2790);

    window.setTimeout(function () {
      finish();
      announce();
    }, 2790 + 380);
  }

  // ---- the confetti --------------------------------------------------------

  // The three beads the burst is made of - one flat, two that catch the
  // light differently, so a handful never looks stamped out.
  var BEADS = ['media/confetti1.svg', 'media/confetti2.svg', 'media/confetti3.svg'];

  // Fetched now rather than at the press, so the first beads are not blank.
  BEADS.forEach(function (src) { (new Image()).src = src; });

  /**
   * A handful of gold thrown up out of each elephant's howdah as the date
   * lands. Every bead is three nested elements - one to drift sideways, one
   * to carry the arc, one to tumble - because three motions sharing a single
   * transform is what makes confetti turn corners. Each throw is written into
   * custom properties, so the animation itself is the stylesheet's (see
   * ry-flake-drift and its neighbours) and nothing here runs per frame. The
   * layer takes itself away afterwards.
   */
  function confetti() {
    if (reduced) return;
    var stage = section.querySelector('.royale-date__stage');
    var elephants = section.querySelectorAll('.royale-date__elephant');
    if (!stage || !elephants.length) return;

    var layer = document.createElement('div');
    layer.className = 'royale-date__confetti';
    layer.setAttribute('aria-hidden', 'true');
    stage.appendChild(layer);

    var box = stage.getBoundingClientRect();
    // Sizes and distances in hundredths of the stage, so the burst is the
    // same shape on a phone as on a desktop.
    var unit = box.width / 100;

    Array.prototype.forEach.call(elephants, function (el) {
      var r = el.getBoundingClientRect();
      var left = el.classList.contains('royale-date__elephant--left');
      // The howdah rides high on the elephant's back, in from the tail.
      var x = r.left - box.left + r.width * (left ? 0.42 : 0.58);
      var y = r.top - box.top + r.height * 0.08;
      for (var i = 0; i < 26; i++) flake(layer, x, y, left ? 1 : -1, unit);
    });

    window.setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 4200);
  }

  function flake(layer, x, y, dir, unit) {
    var el = document.createElement('i');
    var arc = document.createElement('i');
    var bead = document.createElement('img');
    var rand = function (lo, hi) { return lo + Math.random() * (hi - lo); };
    // The drawing carries its own shadow, so the bead itself is about
    // two thirds of the box.
    var w = rand(1.6, 3.1) * unit;

    el.className = 'ryd-flake';
    arc.className = 'ryd-flake__arc';
    bead.className = 'ryd-flake__bead';
    bead.src = BEADS[(Math.random() * BEADS.length) | 0];
    bead.alt = '';

    el.style.left = x.toFixed(1) + 'px';
    el.style.top = y.toFixed(1) + 'px';
    el.style.setProperty('--w', w.toFixed(1) + 'px');
    // Thrown up and inward, then carried on out and down.
    el.style.setProperty('--dx', ((rand(6, 30) * dir + rand(-6, 6)) * unit).toFixed(1) + 'px');
    el.style.setProperty('--rise', (-rand(12, 30) * unit).toFixed(1) + 'px');
    el.style.setProperty('--fall', (rand(10, 30) * unit).toFixed(1) + 'px');
    el.style.setProperty('--rot', (rand(-540, 540) | 0) + 'deg');
    el.style.setProperty('--dur', rand(2200, 3400).toFixed(0) + 'ms');
    el.style.setProperty('--delay', rand(0, 420).toFixed(0) + 'ms');

    arc.appendChild(bead);
    el.appendChild(arc);
    layer.appendChild(el);
  }

  // ---- Royal Flower Petal Shower (પુષ્પવૃષ્ટિ) -----------------------------
  var PETALS = [
    'media/petal_rose_red.svg',
    'media/petal_rose_pink.svg',
    'media/petal_marigold.svg',
    'media/petal_rose_curl.svg'
  ];
  PETALS.forEach(function (src) { (new Image()).src = src; });

  function flowerShower() {
    if (reduced) return;

    var shower = document.createElement('div');
    shower.className = 'royale-flower-shower';
    shower.setAttribute('aria-hidden', 'true');
    document.body.appendChild(shower);

    var count = window.innerWidth < 700 ? 36 : 56;
    for (var i = 0; i < count; i++) {
      spawnPetal(shower, i, count);
    }

    window.setTimeout(function () {
      if (shower.parentNode) shower.parentNode.removeChild(shower);
    }, 6500);
  }

  function spawnPetal(shower, i, total) {
    var petal = document.createElement('div');
    petal.className = 'ry-petal';

    var img = document.createElement('img');
    img.src = PETALS[(Math.random() * PETALS.length) | 0];
    img.alt = '';

    var startLeft = (i / total) * 100 + (Math.random() * 8 - 4);
    var size = 18 + Math.random() * 20;
    var duration = 3400 + Math.random() * 2200;
    var delay = Math.random() * 1400;
    var sway = (Math.random() * 100 + 40) * (Math.random() > 0.5 ? 1 : -1);
    var rotX = Math.random() * 720 - 360;
    var rotY = Math.random() * 720 - 360;
    var rotZ = Math.random() * 720 - 360;

    petal.style.left = startLeft + 'vw';
    petal.style.top = (-35 - Math.random() * 40) + 'px';
    petal.style.width = size + 'px';
    petal.style.height = (size * 1.2) + 'px';
    petal.style.setProperty('--sway', sway + 'px');
    petal.style.setProperty('--rot-x', rotX + 'deg');
    petal.style.setProperty('--rot-y', rotY + 'deg');
    petal.style.setProperty('--rot-z', rotZ + 'deg');
    petal.style.animationDuration = duration + 'ms';
    petal.style.animationDelay = delay + 'ms';

    petal.appendChild(img);
    shower.appendChild(petal);
  }

  // ---- Scratch Card with Auto-Scratch Coin & Interactive Canvas ------------
  var canvas = document.getElementById('ryScratchCanvas');
  var scratchWrap = document.getElementById('ryScratchWrap');
  var isScratching = false;
  var scratchCleared = false;
  var autoScratchRunning = false;
  var autoScratchRaf = null;

  function initScratchCard() {
    if (!canvas || !dateCard) return;

    function resizeCanvas() {
      if (scratchCleared) return;
      var rect = dateCard.getBoundingClientRect();
      var w = Math.round(rect.width || dateCard.offsetWidth || 300);
      var h = Math.round(rect.height || dateCard.offsetHeight || 72);
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      drawFoil();
    }

    function drawFoil() {
      var ctx = canvas.getContext('2d');
      var w = canvas.width;
      var h = canvas.height;
      if (!w || !h) return;

      ctx.globalCompositeOperation = 'source-over';

      // Outer rich royal antique gold foil
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#c99e32');
      grad.addColorStop(0.2, '#fdf7d5');
      grad.addColorStop(0.45, '#d4af37');
      grad.addColorStop(0.7, '#f5e2a2');
      grad.addColorStop(1, '#936a1e');

      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, [h / 2]);
      ctx.fillStyle = grad;
      ctx.fill();

      // Scalloped gold border frame
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fff9e6';
      ctx.stroke();

      // Inner thin rim
      ctx.beginPath();
      ctx.roundRect(3, 3, w - 6, h - 6, [(h - 6) / 2]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(74, 2, 30, 0.35)';
      ctx.stroke();

      // Royal sparkles on the foil
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (var i = 0; i < 24; i++) {
        var rx = (Math.sin(i * 17) * 0.5 + 0.5) * (w - 30) + 15;
        var ry = (Math.cos(i * 29) * 0.5 + 0.5) * (h - 16) + 8;
        ctx.beginPath();
        ctx.arc(rx, ry, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // Scratch Card label text in pure Gujarati
      ctx.fillStyle = '#4a021e';
      ctx.font = '700 ' + Math.max(12, Math.round(h * 0.30)) + 'px "Noto Serif Gujarati", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 4;
      ctx.fillText('✦ શુભ લગ્ન મુહૂર્ત દર્શન ✦', w / 2, h / 2);
      ctx.shadowBlur = 0;
    }

    window.addEventListener('resize', resizeCanvas);
    window.setTimeout(resizeCanvas, 100);
    window.setTimeout(resizeCanvas, 350);

    function scratch(x, y, radius) {
      if (scratchCleared) return;
      var ctx = canvas.getContext('2d');
      var r = radius || Math.max(22, Math.round(canvas.height * 0.35));
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function spawnDust(x, y) {
      if (!scratchWrap) return;
      var dust = document.createElement('span');
      dust.className = 'ry-scratch-dust';
      dust.textContent = Math.random() > 0.4 ? '✦' : '✧';
      dust.style.left = x + 'px';
      dust.style.top = y + 'px';
      var dx = (Math.random() * 50 - 25).toFixed(1) + 'px';
      var dy = (-Math.random() * 35 - 10).toFixed(1) + 'px';
      dust.style.setProperty('--dx', dx);
      dust.style.setProperty('--dy', dy);
      scratchWrap.appendChild(dust);
      window.setTimeout(function () {
        if (dust.parentNode) dust.parentNode.removeChild(dust);
      }, 620);
    }

    function clearScratchCard() {
      if (scratchCleared) return;
      scratchCleared = true;
      if (autoScratchRaf) cancelAnimationFrame(autoScratchRaf);

      canvas.classList.add('is-cleared');
      var badge = document.getElementById('ryScratchBadge');
      if (badge) badge.style.opacity = '0';

      // Run date reveal dials, knock, and flower shower
      run();
    }

    // Auto-Scratch with smooth gold coin sweep
    function startAutoScratch() {
      if (scratchCleared || autoScratchRunning) return;
      autoScratchRunning = true;

      // Ensure canvas is accurately sized
      resizeCanvas();

      var w = canvas.width || 300;
      var h = canvas.height || 72;
      var coinSize = Math.max(34, Math.round(h * 0.55));

      var coin = document.createElement('img');
      coin.className = 'ry-scratch-coin';
      coin.src = 'media/coin_cursor.svg';
      coin.alt = '';
      coin.setAttribute('aria-hidden', 'true');
      coin.style.width = coinSize + 'px';
      coin.style.height = coinSize + 'px';
      coin.style.left = '10px';
      coin.style.top = Math.round(h / 2 - coinSize / 2) + 'px';
      (scratchWrap || canvas.parentNode).appendChild(coin);

      var startTime = null;
      var duration = 1620; // 10% faster auto-scratch sweep

      function step(now) {
        if (scratchCleared) {
          if (coin.parentNode) coin.parentNode.removeChild(coin);
          return;
        }
        if (!startTime) startTime = now;
        var elapsed = now - startTime;
        var progress = Math.min(1, elapsed / duration);

        // Sinusoidal sweep motion across width in 3 passes:
        // Pass 1: left to right (0.00 -> 0.36)
        // Pass 2: right to left (0.36 -> 0.72)
        // Pass 3: left to right finish (0.72 -> 1.00)
        var px;
        if (progress < 0.36) {
          px = progress / 0.36;
        } else if (progress < 0.72) {
          px = 1 - ((progress - 0.36) / 0.36);
        } else {
          px = (progress - 0.72) / 0.28;
        }

        var x = 20 + px * (w - 40);
        var y = (h / 2) + Math.sin(progress * Math.PI * 8) * (h * 0.28);
        var radius = Math.max(26, Math.round(h * 0.42));

        scratch(x, y, radius);

        coin.style.left = (x - coinSize / 2) + 'px';
        coin.style.top = (y - coinSize / 2) + 'px';

        // Spawn gold sparkles dust
        if (Math.random() < 0.7) {
          spawnDust(x, y);
        }

        if (progress < 1) {
          autoScratchRaf = requestAnimationFrame(step);
        } else {
          // Finished sweeping! Fade out coin and reveal
          coin.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          coin.style.opacity = '0';
          coin.style.transform = 'scale(1.2)';
          window.setTimeout(function () {
            if (coin.parentNode) coin.parentNode.removeChild(coin);
          }, 420);
          clearScratchCard();
        }
      }

      autoScratchRaf = requestAnimationFrame(step);
    }

    // Manual scratch fallback if user drags or touches
    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      var clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    var scratchStrokeCount = 0;
    canvas.addEventListener('pointerdown', function (e) {
      if (scratchCleared) return;
      isScratching = true;
      var pos = getPos(e);
      scratch(pos.x, pos.y);
      spawnDust(pos.x, pos.y);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!isScratching || scratchCleared) return;
      var pos = getPos(e);
      scratch(pos.x, pos.y);
      scratchStrokeCount++;
      if (scratchStrokeCount % 2 === 0) {
        spawnDust(pos.x, pos.y);
      }
      if (scratchStrokeCount > 15) {
        clearScratchCard();
      }
    });

    function stopScratch(e) {
      isScratching = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (scratchStrokeCount > 10) {
        clearScratchCard();
      }
    }

    canvas.addEventListener('pointerup', stopScratch);
    canvas.addEventListener('pointercancel', stopScratch);

    // Click / tap fallback
    canvas.addEventListener('click', function () {
      clearScratchCard();
    });

    // Auto-trigger when scrolled into view
    setupAutoTrigger(startAutoScratch);
  }

  function setupAutoTrigger(triggerFn) {
    var triggered = false;

    function runTrigger() {
      if (triggered || scratchCleared) return;
      triggered = true;
      window.setTimeout(function () {
        if (!scratchCleared) {
          triggerFn();
        }
      }, 450);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runTrigger();
            try { observer.disconnect(); } catch (_) {}
          }
        });
      }, { threshold: 0.25 });
      observer.observe(section);
    }

    // Scroll fallback
    function onScroll() {
      if (triggered || scratchCleared) {
        window.removeEventListener('scroll', onScroll);
        return;
      }
      var rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        runTrigger();
        window.removeEventListener('scroll', onScroll);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.setTimeout(onScroll, 600);
  }

  initScratchCard();

  var countdownInterval = null;

  function startLiveCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(function () {
      var rem = getRemaining();
      var daysStrip = section.querySelector('[data-dial="days"] [data-strip]');
      var hoursStrip = section.querySelector('[data-dial="hours"] [data-strip]');
      var minutesStrip = section.querySelector('[data-dial="minutes"] [data-strip]');
      var secondsStrip = section.querySelector('[data-dial="seconds"] [data-strip]');

      if (daysStrip && daysStrip.children.length <= 1) daysStrip.innerHTML = cell(toGuj(pad(rem.days)));
      if (hoursStrip && hoursStrip.children.length <= 1) hoursStrip.innerHTML = cell(toGuj(pad(rem.hours)));
      if (minutesStrip && minutesStrip.children.length <= 1) minutesStrip.innerHTML = cell(toGuj(pad(rem.minutes)));
      if (secondsStrip && secondsStrip.children.length <= 1) secondsStrip.innerHTML = cell(toGuj(pad(rem.seconds)));
    }, 1000);
  }

  function finish() {
    section.classList.remove('is-revealing');
    section.classList.add('is-revealed');
    if (after) after.hidden = false;

    // Settle strips onto single live values after rolling completes
    var rem = getRemaining();
    ['days', 'hours', 'minutes', 'seconds'].forEach(function (name) {
      var strip = section.querySelector('[data-dial="' + name + '"] [data-strip]');
      if (!strip) return;
      var val = (name === 'days') ? rem.days : (name === 'hours' ? rem.hours : (name === 'minutes' ? rem.minutes : rem.seconds));
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      strip.innerHTML = cell(toGuj(pad(val)));
    });

    startLiveCountdown();
  }

  /**
   * Build one dial's strip and roll it. `loops` decoy passes go in front of
   * the real value, which is the last cell - so the roll always ends on it.
   * The strip is written here, at press time, so before the press the window
   * genuinely holds nothing.
   */
  function roll(name, cells, loops, duration) {
    var plaque = section.querySelector('[data-dial="' + name + '"]');
    var strip = plaque && plaque.querySelector('[data-strip]');
    if (!strip) return;

    var seq = [''];
    for (var l = 0; l < loops; l++) seq = seq.concat(cells.all);
    seq = seq.concat(cells.all.slice(0, cells.index + 1));

    strip.innerHTML = seq.map(cell).join('');

    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    // Commit the start position before arming the transition, or the two
    // writes coalesce and nothing moves.
    void strip.offsetHeight;

    strip.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.16, 1, 0.3, 1)';
    strip.style.transform = 'translateY(calc(' + (-(seq.length - 1)) + ' * var(--cell-h)))';
  }

  /** The hop the four plaques give as the gold goes up, left to right. */
  function knock() {
    ['days', 'hours', 'minutes', 'seconds'].forEach(function (name, i) {
      var plaque = section.querySelector('[data-dial="' + name + '"]');
      if (!plaque) return;
      window.setTimeout(function () {
        plaque.classList.add('is-set');
        window.setTimeout(function () { plaque.classList.remove('is-set'); }, 420);
      }, 90 + i * 90);
    });
  }

  /** Every plaque straight onto its value, fading in one after another. */
  function settleAll() {
    [['days', dayCells()], ['hours', hourCells()], ['minutes', minuteCells()], ['seconds', secondCells()]]
      .forEach(function (pair, i) {
        var plaque = section.querySelector('[data-dial="' + pair[0] + '"]');
        var strip = plaque && plaque.querySelector('[data-strip]');
        if (!strip) return;
        strip.innerHTML = cell(pair[1].all[pair[1].index]);
        strip.style.opacity = '0';
        strip.style.transform = 'none';
        window.setTimeout(function () {
          strip.style.transition = 'opacity 260ms ease';
          strip.style.opacity = '1';
        }, 90 + i * 260);
      });
    startLiveCountdown();
  }

  function announce() {
    if (!said) return;
    var rem = getRemaining();
    said.textContent = 'શુભ લગ્ન મુહૂર્ત બાકી સમય: ' +
      toGuj(rem.days) + ' દિવસ, ' + toGuj(rem.hours) + ' કલાક, ' + toGuj(rem.minutes) + ' મિનિટ, ' + toGuj(rem.seconds) + ' સેકન્ડ. શુભ લગ્ન તિથિ: ૨૮ અને ૨૯ જાન્યુઆરી ૨૦૨૭';
  }

  var GUJ_DIGITS = { '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪', '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯' };
  function toGuj(str) {
    return String(str).replace(/[0-9]/g, function (d) { return GUJ_DIGITS[d] || d; });
  }

  function cell(v) {
    var cls = String(v).length > 3 ? 'royale-date__cell royale-date__cell--wide' : 'royale-date__cell';
    return '<span class="' + cls + '">' + v + '</span>';
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function getRemaining() {
    // Target wedding commencement: 28 January 2027, 10:00 AM IST
    var target = new Date(2027, 0, 28, 10, 0, 0).getTime();
    var now = Date.now();
    var diff = Math.max(0, target - now);

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  }

  function dayCells() {
    var rem = getRemaining();
    var all = [];
    var max = Math.max(99, rem.days);
    for (var d = 1; d <= max; d++) all.push(toGuj(pad(d)));
    return { all: all, index: Math.min(all.length - 1, rem.days - 1) };
  }

  function hourCells() {
    var rem = getRemaining();
    var all = [];
    for (var h = 0; h < 24; h++) all.push(toGuj(pad(h)));
    return { all: all, index: rem.hours % 24 };
  }

  function minuteCells() {
    var rem = getRemaining();
    var all = [];
    for (var m = 0; m < 60; m++) all.push(toGuj(pad(m)));
    return { all: all, index: rem.minutes % 60 };
  }

  function secondCells() {
    var rem = getRemaining();
    var all = [];
    for (var s = 0; s < 60; s++) all.push(toGuj(pad(s)));
    return { all: all, index: rem.seconds % 60 };
  }

  // ---- the date -------------------------------------------------------------

  function resolveDate(iso) {
    var raw = String(iso || '').trim();
    var customDays = section ? section.getAttribute('data-days') : null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (m) {
      return {
        year: +m[1],
        month: +m[2],
        day: +m[3],
        dayDisplay: customDays ? customDays.replace('&', 'અને') : toGuj(+m[3] < 10 ? '0' + (+m[3]) : String(+m[3]))
      };
    }

    return { year: 2027, month: 1, day: 29, dayDisplay: '૨૮ અને ૨૯' };
  }
})();
