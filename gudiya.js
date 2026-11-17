// Royale Wedding - Cute Little Traditional Girl (શુભાગમન ઢીંગલી)
// Walks gracefully from the right side of the screen to beside the cue button,
// gently reaches out and taps the button with magical golden sparkle burst & chime,
// and automatically opens the royal gate.
(function () {
  'use strict';

  var root = document.documentElement;
  var gate = document.getElementById('ryGate');
  var gudiya = document.getElementById('ryGudiya');
  var char = document.getElementById('ryGudiyaChar');
  var bubble = document.getElementById('ryGudiyaBubble');
  var bubbleText = bubble && bubble.querySelector('.ry-gudiya__bubble-text');
  var cue = document.querySelector('.royale-card__cue');

  if (!gate || !gudiya || !char || !cue) return;
  if (root.classList.contains('is-open')) return;
  if (window.Royale && window.Royale.mode === 'edit') return;

  var opened = false;
  var animFrameId = null;

  // Gentle auspicious chime using Web Audio API (soft temple bells / golden harp chime)
  function playMagicalChime() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      var ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      var now = ctx.currentTime;
      var notes = [880, 1174.66, 1318.51, 1760]; // Auspicious harmonic frequencies
      notes.forEach(function (f, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.7);
      });
    } catch (_) {}
  }

  // Little golden sparkles along the walking trail
  var lastSparkleTime = 0;
  function spawnSparkle(x, y) {
    if (!gate || opened) return;
    var s = document.createElement('span');
    s.className = 'ry-gudiya-sparkle';
    var glyphs = ['✨', '🌸', '✦', '⋆', '💫', '🌸'];
    s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx', (Math.random() * 26 - 13) + 'px');
    s.style.setProperty('--dy', (-14 - Math.random() * 20) + 'px');
    gate.appendChild(s);
    window.setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 950);
  }

  // Golden burst & rose petals when the finger taps the button
  function spawnTapBurst(x, y) {
    if (!gate) return;

    // Expanding golden aura ring
    var ring = document.createElement('span');
    ring.className = 'ry-gudiya-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    gate.appendChild(ring);
    window.setTimeout(function () {
      if (ring.parentNode) ring.parentNode.removeChild(ring);
    }, 1000);

    for (var i = 0; i < 18; i++) {
      var p = document.createElement('span');
      p.className = 'ry-gudiya-burst-particle';
      p.textContent = (i % 3 === 0) ? '🌸' : (i % 2 === 0 ? '✨' : '💖');
      var angle = (i / 18) * 2 * Math.PI;
      var dist = 32 + Math.random() * 60;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--bx', (Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--by', (Math.sin(angle) * dist) + 'px');
      gate.appendChild(p);
      (function (elem) {
        window.setTimeout(function () {
          if (elem.parentNode) elem.parentNode.removeChild(elem);
        }, 1200);
      })(p);
    }
  }

  // Cancel immediately if user clicks or opens gate manually
  function onUserOpen() {
    if (opened) return;
    opened = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    char.classList.remove('is-walking', 'is-tapping');
    char.classList.add('is-celebrating');
    if (bubbleText) bubbleText.textContent = 'પધારો! 🙏✨';
    window.setTimeout(function () {
      gudiya.style.opacity = '0';
      window.setTimeout(function () { gudiya.hidden = true; }, 600);
    }, 1200);
  }

  document.addEventListener('royale:gate-open', onUserOpen);

  // Smooth easing for slow, graceful walking (smooth ease-in-out)
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function startWalkingSequence() {
    if (opened || root.classList.contains('is-open')) return;

    var gateRect = gate.getBoundingClientRect();
    var cueRect = cue.getBoundingClientRect();
    var charRect = char.getBoundingClientRect();

    var charW = charRect.width || 120;
    var charH = charRect.height || 185;

    // Position gudiya so she stands comfortably beside the button (to the right),
    // and her outstretched finger touches the right tip of the button plaque.
    // Her body will never cover the button or text!
    var targetBtnX = (cueRect.right - gateRect.left) - 6;
    var targetBtnY = (cueRect.top - gateRect.top) + (cueRect.height * 0.5);

    // Her finger is at approx 4% from the left edge of charW and 41% from the top of charH
    var endX = targetBtnX - (charW * 0.04);
    var endY = targetBtnY - (charH * 0.41);

    // Starting point: gracefully entering from outside/near right edge of screen
    var startX = Math.min(gateRect.width - charW * 0.2, endX + Math.max(gateRect.width * 0.38, 220));
    var startY = endY + Math.min(gateRect.height * 0.06, 32);

    gudiya.style.transform = 'translate(' + startX + 'px, ' + startY + 'px)';
    gudiya.style.opacity = '1';
    char.classList.add('is-walking');
    if (bubbleText) bubbleText.textContent = 'ચાલો, પત્રિકા ખોલીએ! 🌸';

    // Slower, graceful, and charming stroll (4200ms = 4.2 seconds)
    var duration = 4200;
    var startTime = performance.now();

    function step(now) {
      if (opened) return;
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeInOutCubic(progress);

      var currX = startX + (endX - startX) * eased;
      var currY = startY + (endY - startY) * eased;

      gudiya.style.transform = 'translate(' + currX + 'px, ' + currY + 'px)';

      // Emit footstep sparkle every ~260ms during slow stroll
      if (now - lastSparkleTime > 260) {
        lastSparkleTime = now;
        spawnSparkle(currX + charW * 0.45, currY + charH * 0.95);
      }

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        onArrivedAtButton(targetBtnX, targetBtnY);
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  function onArrivedAtButton(targetX, targetY) {
    if (opened) return;
    char.classList.remove('is-walking');
    if (bubbleText) bubbleText.textContent = 'અહીં ક્લિક કરીએ! ✨';

    // Graceful pause to admire and invite (~650ms)
    window.setTimeout(function () {
      if (opened) return;
      char.classList.add('is-tapping');

      // Exact touch moment (300ms into tap gesture)
      window.setTimeout(function () {
        if (opened) return;
        cue.classList.add('is-pressed');
        spawnTapBurst(targetX, targetY);
        playMagicalChime();

        // 420ms after tap, celebrate and open!
        window.setTimeout(function () {
          if (opened) return;
          char.classList.remove('is-tapping');
          char.classList.add('is-celebrating');
          if (bubbleText) bubbleText.textContent = 'શુભાગમન! પધારો! 🙏✨';

          // Trigger the gate opening
          if (window.RoyaleGateOpen) {
            window.RoyaleGateOpen();
          } else {
            gate.click();
          }

          // Smoothly fade out character after doors open
          window.setTimeout(function () {
            gudiya.style.opacity = '0';
            window.setTimeout(function () { gudiya.hidden = true; }, 700);
          }, 1500);
        }, 420);

      }, 300);
    }, 650);
  }

  // Start the lovely sequence 800ms after load
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(startWalkingSequence, 800);
    });
  } else {
    window.setTimeout(startWalkingSequence, 800);
  }
})();
