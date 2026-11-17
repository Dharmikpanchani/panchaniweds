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
  var btn = document.getElementById('ryRevealBtn');
  var after = document.getElementById('ryRevealAfter');
  var said = document.getElementById('ryRevealSaid');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var spent = false;
  if (btn) btn.addEventListener('click', run);

  // ---- the reveal -----------------------------------------------------------

  function run() {
    // Once per visit - a refresh brings the empty plaques back.
    if (spent) return;
    spent = true;

    section.classList.add('is-revealing');
    if (btn) {
      btn.classList.add('is-pressed');
      btn.disabled = true;
      window.setTimeout(function () { btn.classList.remove('is-pressed'); }, 180);
    }

    if (reduced) {
      // No roll: the values fade in, in the same date -> month -> year order.
      settleAll();
      announce();
      window.setTimeout(finish, 90 + 2 * 260 + 420);
      return;
    }

    // All three start together and the later ones simply run longer, which
    // is how a real set of dials behaves.
    roll('day', dayCells(), 2, 1750);
    roll('month', monthCells(), 2, 2250);
    roll('year', yearCells(), 2, 2750);

    // The gold goes up the moment the last dial lands, and the plaques knock
    // just behind it - so they jump at the burst rather than having quietly
    // settled one at a time on the way there.
    window.setTimeout(function () {
      confetti();
      flowerShower();
      knock();
    }, 2750);

    window.setTimeout(function () {
      finish();
      announce();
    }, 2750 + 420);
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

  // ---- Scratch Card with Coin Cursor ---------------------------------------
  var canvas = document.getElementById('ryScratchCanvas');
  var isScratching = false;
  var scratchCleared = false;
  var totalScratched = 0;

  function initScratchCard() {
    if (!canvas || !btn) return;

    function resizeCanvas() {
      if (scratchCleared) return;
      var rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawFoil();
    }

    function drawFoil() {
      var ctx = canvas.getContext('2d');
      var w = canvas.width;
      var h = canvas.height;

      ctx.globalCompositeOperation = 'source-over';

      // Outer gold foil
      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#e5c07b');
      grad.addColorStop(0.2, '#fff4cc');
      grad.addColorStop(0.4, '#ffd700');
      grad.addColorStop(0.65, '#c99e32');
      grad.addColorStop(0.85, '#ffe58f');
      grad.addColorStop(1, '#996515');

      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, [h / 2]);
      ctx.fillStyle = grad;
      ctx.fill();

      // Scalloped border frame
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff8db';
      ctx.stroke();

      // Inner thin rim
      ctx.beginPath();
      ctx.roundRect(3, 3, w - 6, h - 6, [(h - 6) / 2]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(120, 83, 16, 0.4)';
      ctx.stroke();

      // Royal sparkles on the foil
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      for (var i = 0; i < 24; i++) {
        var rx = (Math.sin(i * 17) * 0.5 + 0.5) * (w - 30) + 15;
        var ry = (Math.cos(i * 29) * 0.5 + 0.5) * (h - 16) + 8;
        ctx.beginPath();
        ctx.arc(rx, ry, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // Scratch Card label text in pure Gujarati
      ctx.fillStyle = '#4a021e';
      ctx.font = '700 ' + Math.max(12, Math.round(h * 0.3)) + 'px "Noto Serif Gujarati", "Fraunces", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText('✦ સ્ક્રેચ કરીને શુભ મુહૂર્ત જુઓ ✦', w / 2, h / 2);
      ctx.shadowBlur = 0;
    }

    window.addEventListener('resize', resizeCanvas);
    window.setTimeout(resizeCanvas, 150);

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      var clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    // Accurate 50% scratched calculation
    function checkScratchPercentage() {
      if (scratchCleared) return;
      var ctx = canvas.getContext('2d');
      var w = canvas.width;
      var h = canvas.height;
      if (!w || !h) return;

      var step = 8;
      var imgData = ctx.getImageData(0, 0, w, h).data;
      var total = 0;
      var cleared = 0;

      for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
          var index = (y * w + x) * 4;
          total++;
          if (imgData[index + 3] < 128) {
            cleared++;
          }
        }
      }

      var ratio = total > 0 ? (cleared / total) : 0;
      // 50% scratch threshold requested by user
      if (ratio >= 0.50) {
        clearScratchCard();
      }
    }

    var scratchStrokeCount = 0;
    function scratch(x, y) {
      if (scratchCleared) return;
      var ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      scratchStrokeCount++;
      if (scratchStrokeCount % 3 === 0) {
        checkScratchPercentage();
      }
    }

    function clearScratchCard() {
      if (scratchCleared) return;
      scratchCleared = true;
      canvas.classList.add('is-cleared');
      var badge = document.getElementById('ryScratchBadge');
      if (badge) badge.style.opacity = '0';

      // Run date reveal dials
      run();
    }

    canvas.addEventListener('pointerdown', function (e) {
      if (scratchCleared) return;
      isScratching = true;
      var pos = getPos(e);
      scratch(pos.x, pos.y);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!isScratching || scratchCleared) return;
      var pos = getPos(e);
      scratch(pos.x, pos.y);
    });

    function stopScratch(e) {
      isScratching = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      checkScratchPercentage();
    }

    canvas.addEventListener('pointerup', stopScratch);
    canvas.addEventListener('pointercancel', stopScratch);

    // Click / tap fallback
    canvas.addEventListener('click', function () {
      clearScratchCard();
    });
  }

  initScratchCard();

  function finish() {
    section.classList.remove('is-revealing');
    section.classList.add('is-revealed');
    if (after) after.hidden = false;
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

  /** The hop the three plaques give as the gold goes up, left to right. */
  function knock() {
    ['day', 'month', 'year'].forEach(function (name, i) {
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
    [['day', dayCells()], ['month', monthCells()], ['year', yearCells()]]
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
  }

  function announce() {
    if (!said) return;
    said.textContent = 'શુભ લગ્ન તારીખ: ' +
      (when.dayDisplay || toGuj(when.day)) + ' ' + MONTHS_LONG[when.month - 1] + ' ' + toGuj(when.year);
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

  function dayCells() {
    var all = [];
    for (var d = 1; d <= 31; d++) all.push(toGuj(pad(d)));
    var disp = when.dayDisplay ? when.dayDisplay.replace('&', 'અને') : toGuj(pad(when.day));
    if (all.indexOf(disp) === -1) {
      all.push(disp);
      return { all: all, index: all.length - 1 };
    }
    return { all: all, index: when.day - 1 };
  }

  function monthCells() {
    return { all: MONTHS.slice(), index: when.month - 1 };
  }

  /** Years around the real one, in pure Gujarati digits. */
  function yearCells() {
    var all = [];
    for (var y = when.year - 4; y <= when.year + 3; y++) all.push(toGuj(y));
    return { all: all, index: all.indexOf(toGuj(when.year)) };
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
