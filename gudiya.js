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

  // Direct user tap on the button opens the gate immediately and starts music
  function handleDirectOpen(e) {
    if (e) {
      try { e.stopPropagation(); } catch (_) {}
    }
    if (opened) return;
    opened = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    // Immediate tactile press & magical celebratory burst
    cue.classList.add('is-pressed');
    var coords = getPlacement();
    spawnTapBurst(coords.touchX, coords.touchY);
    playMagicalChime();

    char.classList.remove('is-walking', 'is-tapping');
    char.classList.add('is-celebrating');
    if (bubbleText) bubbleText.textContent = 'શુભાગમન! પધારો! 🙏✨';

    // Start background music
    if (window.RoyaleMusicStart) {
      try { window.RoyaleMusicStart(); } catch (_) {}
    } else {
      var bgAudio = document.getElementById('ryBgMusic');
      if (bgAudio) {
        try {
          bgAudio.muted = false;
          var p = bgAudio.play();
          if (p && p.catch) p.catch(function () {});
        } catch (_) {}
      }
    }

    // Open gate
    if (window.RoyaleGateOpen) {
      window.RoyaleGateOpen();
    } else if (gate) {
      gate.click();
    }

    // Smoothly fade out character after doors open
    window.setTimeout(function () {
      gudiya.style.opacity = '0';
      window.setTimeout(function () { gudiya.hidden = true; }, 700);
    }, 1500);
  }

  cue.addEventListener('click', handleDirectOpen);
  cue.addEventListener('touchend', function () {
    if (window.RoyaleMusicStart) {
      try { window.RoyaleMusicStart(); } catch (_) {}
    }
  }, { passive: true });

  gudiya.addEventListener('click', handleDirectOpen);
  gudiya.addEventListener('touchend', function () {
    if (window.RoyaleMusicStart) {
      try { window.RoyaleMusicStart(); } catch (_) {}
    }
  }, { passive: true });

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
    s.style.left = x.toFixed(1) + 'px';
    s.style.top = y.toFixed(1) + 'px';
    s.style.setProperty('--dx', (Math.random() * 20 - 10).toFixed(1) + 'px');
    s.style.setProperty('--dy', (-12 - Math.random() * 16).toFixed(1) + 'px');
    gate.appendChild(s);
    window.setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 750);
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
    }, 1000);
  }

  document.addEventListener('royale:gate-open', onUserOpen);

  // Smooth easing for slow, graceful walking (smooth ease-in-out)
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Precise geometry calculation across all responsive screen sizes
  function getPlacement() {
    var gateRect = gate.getBoundingClientRect();
    var cueRect = cue.getBoundingClientRect();
    var charRect = char.getBoundingClientRect();

    var isMobile = window.innerWidth < 700;
    var charW = charRect.width || (isMobile ? 78 : 110);
    var charH = charRect.height || (charW * 1062 / 692);

    // Button position relative to gate container
    var btnRight = cueRect.right - gateRect.left;
    var btnCenterY = (cueRect.top - gateRect.top) + (cueRect.height * 0.5);

    // The outstretched finger tip in media/gudiya_walking.webp is at:
    // x = charW * 0.01 (1% from left edge of character)
    // y = charH * 0.386 (38.6% down from top of character)
    // We want her finger to tap the right rim of the button:
    var targetTouchX = btnRight - 4;
    var targetTouchY = btnCenterY;

    // Place character so finger touches (targetTouchX, targetTouchY)
    var endX = targetTouchX - (charW * 0.01);
    var endY = targetTouchY - (charH * 0.386);

    // Safety clamp: keep her 6px inside the right screen edge on narrow screens
    var maxEndX = gateRect.width - charW - 6;
    if (endX > maxEndX) {
      endX = maxEndX;
    }

    // Actual sparkle burst coordinates on the button
    var actualTouchX = Math.min(btnRight - 6, endX + (charW * 0.04));
    var actualTouchY = btnCenterY;

    // Start gracefully from the right edge
    var startX = Math.min(gateRect.width + 10, endX + Math.max(gateRect.width * 0.35, 170));
    var startY = endY + 12;

    return {
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      touchX: actualTouchX,
      touchY: actualTouchY,
      charW: charW,
      charH: charH,
      gateW: gateRect.width,
      gateH: gateRect.height
    };
  }

  function startWalkingSequence() {
    if (opened || root.classList.contains('is-open')) return;

    var coords = getPlacement();
    var startX = coords.startX;
    var startY = coords.startY;
    var endX = coords.endX;
    var endY = coords.endY;
    var charW = coords.charW;
    var charH = coords.charH;

    gudiya.style.transform = 'translate3d(' + startX.toFixed(1) + 'px, ' + startY.toFixed(1) + 'px, 0)';
    gudiya.style.opacity = '1';
    char.classList.add('is-walking');
    if (bubbleText) bubbleText.textContent = 'ચાલો, પત્રિકા ખોલીએ! ✨';

    var duration = 3400; // 3.4 seconds graceful stroll
    var startTime = performance.now();

    function step(now) {
      if (opened) return;
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeInOutCubic(progress);

      var currX = startX + (endX - startX) * eased;
      var currY = startY + (endY - startY) * eased;

      gudiya.style.transform = 'translate3d(' + currX.toFixed(1) + 'px, ' + currY.toFixed(1) + 'px, 0)';

      // Emit footstep sparkle smoothly (throttled on mobile for 60fps fluidity)
      var sparkleInterval = window.innerWidth < 700 ? 360 : 240;
      if (now - lastSparkleTime > sparkleInterval) {
        lastSparkleTime = now;
        spawnSparkle(currX + charW * 0.45, currY + charH * 0.95);
      }

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      } else {
        onArrivedAtButton(coords.touchX, coords.touchY);
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  function onArrivedAtButton(targetX, targetY) {
    if (opened) return;
    char.classList.remove('is-walking');
    if (bubbleText) bubbleText.textContent = 'સંગીત સાથે પત્રિકા ખોલો! 🎵👇';
    cue.classList.add('is-inviting');
    // Waiting for the guest to tap "શુભ નિમંત્રણ પત્રિકા ખોલો" - NO automatic opening!
  }

  // Handle mobile screen orientation change or resize
  window.addEventListener('resize', function () {
    if (opened || !gudiya || gudiya.hidden) return;
    if (!char.classList.contains('is-walking')) {
      var coords = getPlacement();
      gudiya.style.transform = 'translate3d(' + coords.endX.toFixed(1) + 'px, ' + coords.endY.toFixed(1) + 'px, 0)';
    }
  });

  // Start sequence once layout & fonts are ready
  function initSequence() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        window.setTimeout(startWalkingSequence, 350);
      }).catch(function () {
        window.setTimeout(startWalkingSequence, 600);
      });
    } else {
      window.setTimeout(startWalkingSequence, 600);
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initSequence);
  } else {
    initSequence();
  }
})();
