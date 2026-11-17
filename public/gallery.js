// Royale - the photo gallery.
//
// rose-invitation's gallery.js, for frames rather than polaroids: every frame
// hangs from the rail on its cords, and scrolling or dragging the rail sways
// each one like a pendulum with its own length, stiffness and damping, so
// they swing out of step. A frame also twists on its cords - lagging the
// rail the same way, plus a slow idle turn - and it is that twist that shows
// the depth of the frame's 3D box (styles.css "gallery").
(function () {
  'use strict';

  var scroller = document.getElementById('ryGalleryScroll');
  if (!scroller) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var editing = !!(window.Royale && window.Royale.mode === 'edit');

  var MAX_ANGLE = 20;
  var MAX_YAW = 26;

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  // Per-frame physics. A longer cord (--hang) swings more slowly.
  var frames = [];
  function reinitPhysics() {
    frames = Array.prototype.map.call(scroller.querySelectorAll('.gframe'), function (el, i) {
      var hang = parseFloat(el.style.getPropertyValue('--hang')) || 110;
      return {
        el: el,
        body: el.querySelector('.gframe__body'),
        angle: 0,
        vel: 0,
        yaw: 0,
        yawVel: 0,
        stiffness: 0.02 * (130 / (hang + 90)),
        damping: 0.93 + (i % 3) * 0.01,
        gain: 0.55 + ((i * 7) % 5) * 0.08,
        idleAmp: 0.5 + (i % 2) * 0.35,
        idleYawAmp: 6 + (i % 3) * 1.5,
        idleFreq: 0.4 + ((i * 3) % 4) * 0.1,
        idlePhase: i * 1.7,
        last: '',
        lastYaw: '',
      };
    });
  }
  reinitPhysics();

  // Expose reinit on window for dynamic gallery updates
  window.RoyaleGallery = {
    reinit: reinitPhysics
  };

  var lastScroll = scroller.scrollLeft;
  var vSmooth = 0;
  var rafId = null;
  var inView = false;

  // Swipe-type auto-scroll configuration:
  // Emulates natural touch swipe gestures between frames.
  // Maintains 100% of original frame physics, pendulum swing, and 3D twist.
  var autoSwipeActive = true;
  var userInteracting = false;
  var userTimer = null;
  var currentFrameIndex = 0;

  var swipeState = 'PAUSE'; // 'PAUSE' | 'SWIPING'
  var stateStartTime = 0;
  var pauseDuration = 2800; // Time spent admiring each photo (ms)
  var swipeDuration = 850;  // Smooth swipe transition duration (ms)
  var loopSwipeDuration = 1350; // Smooth return transition from last to first (ms)
  var activeDuration = swipeDuration;
  var swipeFromScroll = 0;
  var swipeToScroll = 0;

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function getFrameTargetScroll(idx) {
    if (!frames || !frames.length) return 0;
    var i = Math.max(0, Math.min(frames.length - 1, idx));
    var f = frames[i].el;
    var maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 0) return 0;

    var centerOffset = f.offsetLeft - (scroller.clientWidth - f.offsetWidth) / 2;
    return Math.max(0, Math.min(maxScroll, Math.round(centerOffset)));
  }

  function getNearestFrameIndex() {
    if (!frames || !frames.length) return 0;
    var center = scroller.scrollLeft + scroller.clientWidth / 2;
    var closest = 0;
    var minDiff = Infinity;
    for (var i = 0; i < frames.length; i++) {
      var el = frames[i].el;
      var fCenter = el.offsetLeft + el.offsetWidth / 2;
      var diff = Math.abs(center - fCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }

  function pauseAutoSwipe() {
    userInteracting = true;
    if (userTimer) clearTimeout(userTimer);
    userTimer = setTimeout(function () {
      userInteracting = false;
      currentFrameIndex = getNearestFrameIndex();
      swipeState = 'PAUSE';
      stateStartTime = performance.now();
    }, 2200);
  }

  scroller.addEventListener('pointerdown', pauseAutoSwipe);
  scroller.addEventListener('touchstart', pauseAutoSwipe, { passive: true });
  scroller.addEventListener('wheel', pauseAutoSwipe, { passive: true });

  function frame(now) {
    var t = now / 1000;

    // Natural swipe-type auto scroll logic
    if (autoSwipeActive && inView && !userInteracting && !editing && !reduceMotion) {
      if (stateStartTime === 0) {
        stateStartTime = now;
        swipeState = 'PAUSE';
      }

      var maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll > 10 && frames.length > 1) {
        if (swipeState === 'PAUSE') {
          if (now - stateStartTime >= pauseDuration) {
            var nextIndex = currentFrameIndex + 1;
            var isLoopingBack = false;
            if (nextIndex >= frames.length) {
              nextIndex = 0;
              isLoopingBack = true;
            }

            swipeFromScroll = scroller.scrollLeft;
            swipeToScroll = getFrameTargetScroll(nextIndex);
            activeDuration = isLoopingBack ? loopSwipeDuration : swipeDuration;
            currentFrameIndex = nextIndex;
            swipeState = 'SWIPING';
            stateStartTime = now;
            scroller.style.scrollSnapType = 'none';
          }
        } else if (swipeState === 'SWIPING') {
          var progress = Math.min(1, (now - stateStartTime) / activeDuration);
          var ease = easeOutCubic(progress);
          scroller.scrollLeft = swipeFromScroll + (swipeToScroll - swipeFromScroll) * ease;

          if (progress >= 1) {
            scroller.scrollLeft = swipeToScroll;
            swipeState = 'PAUSE';
            stateStartTime = now;
            scroller.style.scrollSnapType = '';
          }
        }
      }
    }

    // Scroll velocity (px/frame), smoothed.
    var sl = scroller.scrollLeft;
    vSmooth += ((sl - lastScroll) - vSmooth) * 0.35;
    lastScroll = sl;

    frames.forEach(function (f) {
      // Swing: the frame lags the rail's motion, then springs back.
      var equil = clamp(vSmooth * 0.85 * f.gain, -MAX_ANGLE, MAX_ANGLE);
      f.vel += (equil - f.angle) * f.stiffness;
      f.vel *= f.damping;
      f.angle += f.vel;

      // Twist: the same lag about the cords' axis, a little livelier.
      var yawEquil = clamp(-vSmooth * 1.1 * f.gain, -MAX_YAW, MAX_YAW);
      f.yawVel += (yawEquil - f.yaw) * f.stiffness * 1.4;
      f.yawVel *= f.damping;
      f.yaw += f.yawVel;

      var idle = Math.sin(t * f.idleFreq + f.idlePhase) * f.idleAmp;
      var idleYaw = Math.sin(t * f.idleFreq * 0.8 + f.idlePhase + 1.3) * f.idleYawAmp;

      // Skip writes that round to what is already there.
      var next = 'rotate(' + (f.angle + idle).toFixed(3) + 'deg)';
      if (next !== f.last) {
        f.el.style.transform = next;
        f.last = next;
      }
      var nextYaw = 'rotateY(' + (f.yaw + idleYaw).toFixed(2) + 'deg)';
      if (f.body && nextYaw !== f.lastYaw) {
        f.body.style.transform = nextYaw;
        f.lastYaw = nextYaw;
      }
    });

    rafId = requestAnimationFrame(frame);
  }

  // ---- run only while the gallery is on screen ------------------------------
  function start() {
    if (rafId !== null || reduceMotion || editing) return;
    lastScroll = scroller.scrollLeft;
    vSmooth = 0;
    stateStartTime = performance.now();
    swipeState = 'PAUSE';
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function sync() {
    if (inView && !document.hidden) start();
    else stop();
  }

  if ('IntersectionObserver' in window) {
    // A generous margin, so the frames are already moving when they arrive.
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '300px 0px' }).observe(scroller);
  } else {
    inView = true;
    sync();
  }

  document.addEventListener('visibilitychange', sync);

  // ---- hide the hint once the rail has moved --------------------------------
  var hint = document.getElementById('ryGalleryHint');
  if (hint) {
    var hideHint = function () {
      if (scroller.scrollLeft > 8) {
        hint.classList.add('is-hidden');
        scroller.removeEventListener('scroll', hideHint);
      }
    };
    scroller.addEventListener('scroll', hideHint, { passive: true });
  }

  // ---- drag with a mouse (touch keeps native momentum scrolling) ------------
  var dragging = false;
  var startX = 0;
  var startScroll = 0;

  scroller.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest && e.target.closest('[data-action], [data-adjust], .ry-frame-controls')) return;
    dragging = true;
    startX = e.clientX;
    startScroll = scroller.scrollLeft;
    scroller.classList.add('is-dragging');
    scroller.setPointerCapture(e.pointerId);
  });

  scroller.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    scroller.scrollLeft = startScroll - (e.clientX - startX);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    scroller.classList.remove('is-dragging');
    try { scroller.releasePointerCapture(e.pointerId); } catch (_) { /* already released */ }
  }

  scroller.addEventListener('pointerup', endDrag);
  scroller.addEventListener('pointercancel', endDrag);

  // ---- Dynamic gallery folder loader ---------------------------------------
  // Automatically loads all images placed in /gallery folder (or /gallery/manifest.json)
  function loadDynamicGallery() {
    function applyGalleryImages(imgs) {
      if (!imgs || !imgs.length) return;
      var captions = [
        '#howitstarted', '#adventures', '#thelittlethings', '#everyday',
        '#together', '#love', '#moments', '#forever', '#usforever', '#specialday'
      ];
      var hangs = [74, 96, 82, 64, 78, 90, 60, 84, 70];

      var items = [];
      var storyAdded = 0;
      imgs.forEach(function (src, idx) {
        var isPortrait = idx % 2 === 0;
        items.push({
          type: isPortrait ? 'portrait' : 'landscape',
          image: src,
          placeholder: false,
          caption: captions[idx % captions.length],
          hang: hangs[idx % hangs.length],
          zoom: 1,
          posX: 50,
          posY: 50
        });

        if (idx === 1 && storyAdded === 0) {
          items.push({
            type: 'story',
            text: 'Some stories begin with grand gestures. Ours started with a simple conversation.',
            hang: 56
          });
          storyAdded++;
        } else if (idx === 3 && storyAdded === 1) {
          items.push({
            type: 'story',
            text: "Friendship grew into something more, and we realized life's best moments were the ones we shared together.",
            hang: 76
          });
          storyAdded++;
        }
      });

      if (window.Royale && window.Royale.config && window.Royale.config.gallery) {
        window.Royale.config.gallery.items = items;
      }
      if (window.Royale && window.Royale.render && window.Royale.render.gallery) {
        window.Royale.render.gallery();
      }
      reinitPhysics();
    }

    fetch('/api/gallery?t=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && Array.isArray(data.images) && data.images.length > 0) {
          applyGalleryImages(data.images);
        }
      })
      .catch(function () {
        fetch('/gallery/manifest.json?t=' + Date.now())
          .then(function (res) { return res.json(); })
          .then(function (imgs) {
            if (Array.isArray(imgs) && imgs.length > 0) {
              applyGalleryImages(imgs);
            }
          })
          .catch(function () {});
      });
  }

  // Load dynamic folder images
  loadDynamicGallery();

})();
