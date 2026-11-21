// Royale Wedding - Wishes & Blessings Sender
// Destination: dharmikpanchani9@gmail.com
(function () {
  'use strict';

  var SERVICE_ID = 'service_qg8udpg';
  var TEMPLATE_ID = 'template_28u6ldd';
  var PUBLIC_KEY = 'CyHUWuM_hLMLkKHP1';
  var RECIPIENT_EMAIL = 'dharmikpanchani9@gmail.com';

  // Dynamically load credentials from .env via Next.js API (if running with server)
  fetch('api/emailjs-config')
    .then(function (res) { return res.json(); })
    .then(function (cfg) {
      if (cfg.serviceId) SERVICE_ID = cfg.serviceId;
      if (cfg.templateId) TEMPLATE_ID = cfg.templateId;
      if (cfg.recipientEmail) RECIPIENT_EMAIL = cfg.recipientEmail;
      if (cfg.publicKey) {
        PUBLIC_KEY = cfg.publicKey;
        if (window.emailjs && window.emailjs.init) {
          try { window.emailjs.init(PUBLIC_KEY); } catch (_) { }
        }
      }
    })
    .catch(function () {
      if (window.emailjs && window.emailjs.init) {
        try { window.emailjs.init(PUBLIC_KEY); } catch (_) { }
      }
    });

  if (window.emailjs && window.emailjs.init) {
    try {
      window.emailjs.init(PUBLIC_KEY);
    } catch (_) { }
  }

  var form = document.getElementById('ryWishesForm');
  var btn = document.getElementById('ryWishSubmitBtn');
  var btnText = document.getElementById('ryWishBtnText');
  var successBox = document.getElementById('ryWishSuccess');
  var successMsg = document.getElementById('ryWishSuccessMsg');

  if (!form || !btn) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameInput = document.getElementById('wishName');
    var phoneInput = document.getElementById('wishPhone');
    var msgInput = document.getElementById('wishMessage');

    var name = (nameInput && nameInput.value || '').trim();
    var phone = (phoneInput && phoneInput.value || '').trim();
    var message = (msgInput && msgInput.value || '').trim();

    // Validation in pure Gujarati
    if (!name) {
      alert('કૃપા કરીને આપનું શુભ નામ લખો.');
      if (nameInput) nameInput.focus();
      return;
    }

    var cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('કૃપા કરીને ૧૦ આંકડાનો સાચો મોબાઈલ નંબર લખો.');
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!message) {
      alert('કૃપા કરીને નવદંપતી માટે આપનો શુભેચ્છા અને આશીર્વાદ સંદેશ લખો.');
      if (msgInput) msgInput.focus();
      return;
    }

    // Set loading state
    btn.disabled = true;
    if (btnText) btnText.textContent = 'આશીર્વાદ મોકલાઈ રહ્યા છે… 📩';

    // Comprehensive template parameters matching any EmailJS template (Contact Us or Custom)
    var templateParams = {
      name: name,
      from_name: name,
      user_name: name,
      to_name: 'ચિ. ધાર્મિક અને ચિ. નિશા (પાંચાણી પરિવાર)',
      to_email: RECIPIENT_EMAIL,
      recipient_email: RECIPIENT_EMAIL,
      email: RECIPIENT_EMAIL,
      from_email: 'wedding-wishes@dharmikpanchani.com',
      user_email: RECIPIENT_EMAIL,
      reply_to: RECIPIENT_EMAIL,
      phone: cleanPhone,
      number: cleanPhone,
      contact_number: cleanPhone,
      mobile: cleanPhone,
      message: message,
      user_message: message,
      message_html: message.replace(/\n/g, '<br>'),
      subject: 'શુભ લગ્ન શુભેચ્છા અને આશીર્વાદ સંદેશ (ધાર્મિક & નિશા)',
      title: 'પાંચાણી પરિવાર શુભ વિવાહ - આશીર્વાદ સંદેશ',
      address: 'પાંચાણી પરિવાર રોયલ વેડિંગ (Panchani Royal Wedding)',
      event: 'ચિ. ધાર્મિક અને ચિ. નિશા શુભ વિવાહ પ્રસંગ'
    };

    function onSuccess() {
      // Completely hide form and display success box
      form.hidden = true;
      form.style.display = 'none';
      if (successBox) {
        successBox.hidden = false;
        successBox.style.display = 'block';
      }
      if (successMsg) {
        successMsg.textContent =
          'ધન્યવાદ, ' + name + '! આપના સ્નેહભર્યા આશીર્વાદ ધાર્મિક અને નિશા તથા પાંચાણી પરિવાર સુધી પહોંચી ગયા છે. આપનો ખૂબ ખૂબ આભાર!';
      }

      // Save locally in localStorage as a backup
      try {
        var existing = JSON.parse(localStorage.getItem('panchani_wishes') || '[]');
        existing.push({
          name: name,
          phone: cleanPhone,
          message: message,
          date: new Date().toISOString()
        });
        localStorage.setItem('panchani_wishes', JSON.stringify(existing));
      } catch (_) { }

      // Flower petal celebration
      if (typeof flowerShower === 'function') {
        flowerShower();
      }

      // Smooth scroll to success card
      if (successBox) {
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function onError(err) {
      console.warn('Direct EmailJS failed, attempting server backup API:', err);
      // Fallback: Post to our backend Next.js API api/send-wish (if running with server)
      fetch('api/send-wish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          phone: cleanPhone,
          message: message,
        }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            onSuccess();
          } else {
            throw new Error(data.error || 'Failed to send');
          }
        })
        .catch(function (serverErr) {
          console.error('All send methods failed:', serverErr);
          btn.disabled = false;
          if (btnText) btnText.textContent = 'શુભેચ્છા અને આશીર્વાદ મોકલો ✦';
          alert('માફ કરશો, સંદેશ મોકલવામાં સમસ્યા આવી. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો.');
        });
    }

    // Try client-side EmailJS
    if (window.emailjs && window.emailjs.send) {
      window.emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
        .then(function () {
          fetch('/api/send-wish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, phone: cleanPhone, message: message }),
          }).catch(function () { });
          onSuccess();
        })
        .catch(function (err) {
          onError(err);
        });
    } else {
      // Fallback direct fetch to EmailJS API
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: templateParams,
        }),
      })
        .then(function (res) {
          if (res.ok) {
            fetch('/api/send-wish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: name, phone: cleanPhone, message: message }),
            }).catch(function () { });
            onSuccess();
          } else {
            return res.text().then(function (t) { throw new Error(t); });
          }
        })
        .catch(function (err) {
          onError(err);
        });
    }
  });

})();
