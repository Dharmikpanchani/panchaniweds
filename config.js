// Royale - the invitation's config: the single source of truth for everything
// a host can edit. Loads their saved edits over the template defaults and
// exposes the shared helpers render.js / editor.js / ceremonies.js use.
//
// Modes (from the URL), as papercut and rose-invitation:
//   ?edit=1     - the host edits the invitation in place
//   ?preview=1  - the host previews it as a guest sees it
//   (nothing)   - the final invitation; ?to=Guest%20Name personalises it
(function () {
  const params = new URLSearchParams(location.search);
  const mode = params.has('edit') ? 'edit' : params.has('preview') ? 'preview' : 'view';

  // Trial (?trial=1) - the "try before you buy" sandbox on the marketplace.
  // The shopper gets the real editor, but only the opening card is unlocked:
  // the invocation and the couple's names. Everything past them is visible and
  // locked - enough to prove the experience, not enough to walk away with a
  // finished invitation. TRIAL_EDITABLE is the whole allowlist, and canEdit
  // below is the only thing that consults it.
  const trial = params.has('trial');
  const TRIAL_EDITABLE = ['invocation.religion', 'brideName', 'groomName'];

  // The trial gets its own storage key: it still has to persist (tapping
  // Preview navigates the page and the config is re-read on load), but it must
  // not write over the real key, or a shopper's trial edits would bleed into
  // the marketplace preview everyone else sees.
  const STORAGE_KEY = trial ? 'royaleTrialConfig' : 'royaleConfig';

  // ---- Opening invocation ----------------------------------------------
  // The same table papercut and rose-invitation offer, so a host meets the
  // identical choice in every template. Add a tradition, script or symbol in
  // one and add it to the others.
  const SYMBOLS = [
    { id: 'ganesha', label: 'Ganesha', src: 'media/ganesha.svg' },
    { id: 'buddha', label: 'Buddha', src: '../symbols/_buddha.svg' },
    { id: 'sindhi', label: 'Jhulelal', src: '../symbols/_sindhi.svg' },
    { id: 'sikh', label: 'Ik Onkar', src: '../symbols/_sikh.svg' },
    { id: 'jain', label: 'Ahimsa symbol', src: '../symbols/_jain.svg' },
    { id: 'buddhist', label: 'Dharma wheel', src: '../symbols/_buddhist.svg' },
    { id: 'parsi', label: 'Faravahar', src: '../symbols/_parsi.svg' },
    { id: 'christian', label: 'Cross', src: '../symbols/_christian.svg' },
    { id: 'none', label: 'None', src: '' },
  ];

  const INVOCATIONS = {
    hindu: {
      label: 'Hindu',
      english: 'Shri Ganeshaya Namah',
      scripts: {
        devanagari: { label: 'Devanagari (Hindi/Marathi/Sanskrit/Nepali)', text: 'श्री गणेशाय नमः', font: 'Tiro Devanagari Sanskrit' },
        bengali: { label: 'Bengali', text: 'শ্রী গণেশায় নমঃ', font: 'Noto Sans Bengali' },
        gujarati: { label: 'Gujarati', text: 'શ્રી ગણેશાય નમઃ', font: 'Noto Sans Gujarati' },
        gurmukhi: { label: 'Gurmukhi (Punjabi)', text: 'ਸ਼੍ਰੀ ਗਣੇਸ਼ਾਯ ਨਮਃ', font: 'Noto Sans Gurmukhi' },
        odia: { label: 'Odia', text: 'ଶ୍ରୀ ଗଣେଶାୟ ନମଃ', font: 'Noto Sans Oriya' },
        tamil: { label: 'Tamil', text: 'ஸ்ரீ கணேசாய நமஹ', font: 'Noto Sans Tamil' },
        telugu: { label: 'Telugu', text: 'శ్రీ గణేశాయ నమః', font: 'Noto Sans Telugu' },
        kannada: { label: 'Kannada', text: 'ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ', font: 'Noto Sans Kannada' },
        malayalam: { label: 'Malayalam', text: 'ശ്രീ ഗണേശായ നമഃ', font: 'Noto Sans Malayalam' },
      },
    },
    sikh: {
      label: 'Sikh',
      english: 'Ik Onkar, Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh',
      scripts: {
        gurmukhi: { label: 'Gurmukhi', text: 'ੴ ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ', font: 'Noto Sans Gurmukhi' },
      },
    },
    sindhi: {
      label: 'Sindhi',
      english: 'Jay Jhulelal',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'जय झूलेलाल', font: 'Tiro Devanagari Sanskrit' },
        sindhi: { label: 'Sindhi', text: 'جھولےلال جي', font: 'Noto Naskh Arabic', rtl: true },
      },
    },
    jain: {
      label: 'Jain',
      english: 'Namo Arihantanam',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'णमो अरिहंताणं', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    buddhist: {
      label: 'Buddhist',
      english: 'Buddham Sharanam Gachhami',
      scripts: {
        devanagari: { label: 'Devanagari', text: 'बुद्धं शरणं गच्छामि', font: 'Tiro Devanagari Sanskrit' },
      },
    },
    christian: {
      label: 'Christian',
      english: 'In the name of the Father, the Son, and the Holy Spirit',
      scripts: {},
    },
    muslim: {
      label: 'Muslim',
      english: 'Bismillah ir-Rahman ir-Raheem',
      scripts: {
        arabic: { label: 'Arabic', text: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', font: 'Noto Naskh Arabic', rtl: true },
      },
    },
    parsi: {
      label: 'Parsi',
      english: 'Humata, Hukhta, Hvarshta',
      scripts: {},
    },
  };

  function symbolById(id) {
    for (let i = 0; i < SYMBOLS.length; i++) if (SYMBOLS[i].id === id) return SYMBOLS[i];
    return SYMBOLS[SYMBOLS.length - 1]; // 'none' - never the first artwork
  }

  /**
   * The one line the opening card shows, resolved from { religion, script }.
   * 'custom' is the host's own words; 'blank' is no line at all. A saved
   * religion or script that no longer exists falls back to the tradition's
   * first script rather than breaking the card.
   */
  function invocationLines(inv) {
    const sel = inv && inv.script;

    if (sel === 'custom') {
      return {
        religion: (inv && inv.religion) || 'hindu', script: 'custom',
        text: (inv && inv.custom) || '', font: '', rtl: false, isEnglish: false, isCustom: true,
      };
    }
    if (sel === 'blank') {
      return {
        religion: (inv && inv.religion) || 'hindu', script: 'blank',
        text: '', font: '', rtl: false, isEnglish: false, isBlank: true,
      };
    }

    const religion = INVOCATIONS[(inv && inv.religion)] ? inv.religion : 'hindu';
    const rel = INVOCATIONS[religion];
    const scriptKeys = Object.keys(rel.scripts);

    let chosen;
    if (sel === 'english') chosen = 'english';
    else if (sel && rel.scripts[sel]) chosen = sel;
    else chosen = scriptKeys.length ? scriptKeys[0] : 'english';

    if (chosen === 'english') {
      return { religion: religion, script: 'english', text: rel.english || '', font: '', rtl: false, isEnglish: true };
    }
    const scr = rel.scripts[chosen];
    return { religion: religion, script: chosen, text: scr.text, font: scr.font, rtl: !!scr.rtl, isEnglish: false };
  }

  // ---- Default wedding date ---------------------------------------------
  // 15 days out from whenever the invitation is created, as papercut: a fixed
  // date would eventually be in the past, and the date reveal and the ceremony
  // schedule would both open looking stale.
  function isoDaysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Pure calendar-component arithmetic (Date.UTC/getUTC*, no timezone
  // conversion): `new Date(iso)` reads a bare yyyy-mm-dd as UTC and lands a
  // day early anywhere west of Greenwich.
  function addDaysISO(iso, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return iso;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  // The wedding date IS the Vivaah date - 29 January 2027
  const VIVAAH_ISO = '2027-01-29';

  /**
   * The frames a gallery starts with. How many of them are taken depends on who
   * is looking, and the two readers want opposite things.
   *
   * A HOST opening the editor gets the first three - one portrait, one
   * landscape, one words card. Eight frames read as a fixed layout to be filled
   * in; three read as "these are the kinds, add what you want", which is what
   * the Add tile on the rail is for. The order below is why the cut is a plain
   * slice: the first three are already one of each.
   *
   * A SHOPPER previewing the template gets the lot. They are not filling
   * anything in - they are deciding whether they like it - and a full rope
   * shows the gallery doing what it was designed to do. Nobody edits this set,
   * so the generosity costs the host nothing: the moment they start editing,
   * their own three are what load.
   */
  const GALLERY_STARTERS = [
    { type: 'portrait', image: 'gallery/photo1.webp', placeholder: false, caption: '#શુભારંભ', hang: 118 },
    { type: 'landscape', image: 'gallery/photo2.webp', placeholder: false, caption: '#મીઠીયાદો', hang: 150 },
    { type: 'story', text: 'કેટલીક વાર્તાઓ ભવ્ય શરૂઆતથી શરૂ થાય છે, પણ અમારી પ્રેમ કહાની એક સહજ અને મીઠી વાતચીતથી શરૂ થઈ હતી.', hang: 86 },
    { type: 'portrait', image: 'gallery/photo3.webp', placeholder: false, caption: '#પ્રેમસફર', hang: 132 },
    { type: 'landscape', image: 'gallery/photo4.webp', placeholder: false, caption: '#સ્નેહબંધન', hang: 100 },
    { type: 'story', text: 'સમય જતાં મિત્રતા અતૂટ પ્રેમમાં બદલાઈ ગઈ, અને સમજાયું કે જીવનની સૌથી સુંદર પળો એ જ છે જે આપણે સાથે વિતાવી છે.', hang: 120 },
    { type: 'portrait', image: 'gallery/photo5.webp', placeholder: false, caption: '#સપ્તપદી', hang: 150 },
    { type: 'landscape', image: 'gallery/photo6.webp', placeholder: false, caption: '#અખંડસૌભાગ્ય', hang: 92 },
    { type: 'portrait', image: 'gallery/photo7.webp', placeholder: false, caption: '#રૂડોઅવસર', hang: 125 },
    { type: 'landscape', image: 'gallery/photo8.webp', placeholder: false, caption: '#મંગલોત્સવ', hang: 110 },
  ];

  const DEFAULTS = {
    version: 1,
    finalized: false,

    invocation: {
      symbol: 'ganesha',
      religion: 'hindu',
      script: 'custom',
      custom: '॥ શ્રી ગણેશાય નમઃ ॥\nકુળદેવી શ્રી ખોડિયાર માતાજી તથા શ્રી નાગજી બાપાની અસીમ કૃપાથી'
    },

    brideName: 'ચિ. નિશા',
    groomName: 'ચિ. ધાર્મિક',
    // Derived (see syncDerived) - kept flat for the platform's own EventData.
    title: 'ચિ. ધાર્મિક & ચિ. નિશા',
    hostNames: ['ચિ. ધાર્મિક', 'ચિ. નિશા'],

    // The gate's card, under the invocation.
    introNote: 'સમર્પણના ઉપવનમાં, વડીલોના અને વાત્સલ્યના સાનિધ્યમાં, કુળદેવી શ્રી ખોડિયાર માતાજી તથા શ્રી નાગજી બાપાની અસીમ કૃપાથી રસનાળ નિવાસી અ.સૌ. લલિતાબેન તથા શ્રી મુકેશભાઈ જેરામભાઈ પાંચાણીના સુપુત્ર ચિ. ધાર્મિક ના શુભ લગ્ન શેડુભાર નિવાસી અ.સૌ. મનીષાબેન તથા શ્રી પ્રવિણભાઈ કડવાભાઈ બાબરીયા ની સુપુત્રી ચિ. નિશા સાથે સંવત ૨૦૮૩ ના પોષ વદ ૮ ને શુક્રવાર તા. ૨૯/૦૧/૨૦૨૭ ના શુભ દિને નિર્ધાર્યા છે. ત્યારે લગ્ન ની વૈદિક પરંપરા ના ઉત્સવમાં અમારૂ ભાવભર્યું આમંત્રણ સ્વીકારી જીવન ના અનેરા મુકામ પર આપ જરૂરથી પધારી શોભામાં અભિવૃદ્ધિ કરશોજી.',

    shloka: 'રિદ્ધિ સિદ્ધિ સહિત પધારજો, ગૌરી નંદન ગણેશ,\nસહ કુટુંબ સહિત પધારજો, શ્રી બ્રહ્મા, વિષ્ણુ, મહેશ...',

    // The date the three plaques roll to (date-reveal.js).
    eventISO: '2027-01-29',
    eventDays: '૨૮ અને ૨૯',
    revealButton: 'શુભ મુહૂર્ત જુઓ',
    revealAfter: 'શુભ લગ્ન તિથિ • ૨૯ જાન્યુઆરી ૨૦૨૭ (પોષ વદ-૮)',

    // The two family scrolls. The content stays put while a card is switched
    // off, so removing one is reversible.
    groomFamily: {
      enabled: true,
      name: 'ચિ. ધાર્મિક પાંચાણી',
      relLabel: 'સુપુત્ર',
      parentA: 'શ્રી મુકેશભાઈ જેરામભાઈ પાંચાણી',
      parentB: 'અ.સૌ. લલિતાબેન પાંચાણી',
      grandLabel: 'પૌત્ર',
      grandA: 'સ્વ. શ્રી જેરામભાઈ માધવજીભાઈ પાંચાણી',
      grandB: 'શ્રીમતી ઉજિબેન પાંચાણી',
      residence: 'મુ. રસનાળ, વાયા ઢસા, તા. ગઢડા (સ્વા.), જી. બોટાદ',
    },
    brideFamily: {
      enabled: true,
      name: 'ચિ. નિશા બાબરીયા',
      relLabel: 'સુપુત્રી',
      parentA: 'શ્રી પ્રવિણભાઈ કડવાભાઈ બાબરીયા',
      parentB: 'અ.સૌ. મનીષાબેન બાબરીયા',
      grandLabel: 'પૌત્રી',
      grandA: 'સ્વ. શ્રી કડવાભાઈ બાબરીયા',
      grandB: 'સ્વ. શ્રીમતી અંબાબેન બાબરીયા',
      residence: 'શેડુભાર નિવાસી',
    },

    // The hanging gallery. `type` picks the frame - a portrait or landscape
    // picture, or a text card - and `hang` is its cord length in px, which
    // gallery.js also reads for the swing. An empty picture frame shows its
    // "Your photo here" placeholder to the host and is dropped for guests.
    //
    // `placeholder` marks a frame as the template's own sample, as
    // rose-invitation marks its demo polaroids: it keeps its place in the
    // template's demo, empty, so the gallery is shown as it is meant to hang
    // - portrait and landscape pictures between the two story cards - rather
    // than as the two cards alone. It means nothing once the invitation
    // belongs to a host (see galleryFilled in render.js), so their guests
    // still only ever see the frames that have a picture in them.
    gallery: {
      enabled: true,
      // GALLERY_STARTERS, cut to suit who is looking - see the note above it.
      items: GALLERY_STARTERS.slice(0, mode === 'edit' ? 3 : GALLERY_STARTERS.length),
    },

    // The six rites, each on its own arched card. `art` is a path under this
    // template folder; the dates are absolute (the editor re-spaces them when
    // the wedding date moves).
    ceremonies: [
      { name: 'મીંઢળ', art: 'media/haldi.webp', date: '2027-01-27', time: '21:00', timeLabel: 'રાત્રે ૦૯:૦૦ કલાકે', tithi: 'પોષ વદ ૬ ને બુધવાર', venue: 'સ્થળ: અમારું નિવાસ સ્થાન, રસનાળ', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rasnal', enabled: true },
      { name: 'મંડપ મુહૂર્ત', art: 'media/ring_ceremony.webp', date: '2027-01-28', time: '07:00', timeLabel: 'સવારે ૦૭:૦૦ કલાકે', tithi: 'પોષ વદ ૭ ને ગુરૂવાર', venue: 'સ્થળ: અમારું નિવાસ સ્થાન, રસનાળ', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rasnal', enabled: true },
      { name: 'સ્વરૂચિ ભોજન', art: 'media/reception.webp', date: '2027-01-28', time: '11:00', timeLabel: 'બપોરે ૧૧:૦૦ કલાકે', tithi: 'પોષ વદ ૭ ને ગુરૂવાર', venue: 'સ્થળ: અમારું નિવાસ સ્થાન, રસનાળ', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rasnal', enabled: true },
      { name: 'દાંડીયા રાસ', art: 'media/sangeet.webp', date: '2027-01-28', time: '21:00', timeLabel: 'રાત્રે ૦૯:૦૦ કલાકે', tithi: 'પોષ વદ ૭ ને ગુરૂવાર', venue: 'સ્થળ: અમારું નિવાસ સ્થાન, રસનાળ', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rasnal', enabled: true },
      { name: 'જાન પ્રસ્થાન', art: 'media/ceremony_ring.webp', date: '2027-01-29', time: '08:00', timeLabel: 'સવારે શેડુભાર મુકામે પ્રસ્થાન કરશે', tithi: 'પોષ વદ ૮ ને શુક્રવાર', venue: 'સ્થળ: અમારું નિવાસ સ્થાન થી શેડુભાર', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Shedubhar', enabled: true },
      { name: 'શુભ લગ્ન વિધિ (હસ્તમેળાપ)', art: 'media/vivaah.webp', date: '2027-01-29', time: '12:05', timeLabel: 'બપોરે ૧૨:૦૫ કલાકે', tithi: 'પોષ વદ ૮ ને શુક્રવાર', venue: 'લગ્ન સ્થળ: શેડુભાર', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Shedubhar', enabled: true },
    ],

    compliments: {
      enabled: true,
      lead: ':: વડીલોની છત્રછાયા ::',
      sublead: 'લિ. સ્નેહાધીન',
      familyLeft: [
        'સ્વ. માધવજીભાઈ મોહનભાઈ પાંચાણી',
        'સ્વ. સવજીભાઈ મોહનભાઈ પાંચાણી',
        'શ્રી ગોવિંદભાઈ માધવજીભાઈ પાંચાણી',
        'સ્વ. જેરામભાઈ માધવજીભાઈ પાંચાણી',
        'શ્રી વલ્લભભાઈ માધવજીભાઈ પાંચાણી',
        'શ્રી હિરજીભાઈ માધવજીભાઈ પાંચાણી',
        'સ્વ. રમેશભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી નનુભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી ભુપતભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી કલ્યાણભાઈ સવજીભાઈ પાંચાણી',
      ],
      familyRight: [
        'શ્રી વિઠ્ઠલભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી હસમુખભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી મગનભાઈ જેરામભાઈ પાંચાણી',
        'શ્રી હિંમતભાઈ ગોવિંદભાઈ પાંચાણી',
        'શ્રી નીતિનભાઈ ગોવિંદભાઈ પાંચાણી',
        'શ્રી જયસુખભાઈ વલ્લભભાઈ પાંચાણી',
        'શ્રી શ્રીધરભાઈ વલ્લભભાઈ પાંચાણી',
        'શ્રી વિપુલભાઈ હિરજીભાઈ પાંચાણી',
        'શ્રી પરેશભાઈ હિરજીભાઈ પાંચાણી',
        'શ્રી અલ્પેશભાઈ હિરજીભાઈ પાંચાણી',
      ],
      footNote: 'અમારા માતૃશ્રી ઉજિ બા ના જય શ્રી કૃષ્ણ...',
      lines: [
        'સ્વ. માધવજીભાઈ મોહનભાઈ પાંચાણી',
        'સ્વ. સવજીભાઈ મોહનભાઈ પાંચાણી',
        'શ્રી ગોવિંદભાઈ માધવજીભાઈ પાંચાણી',
        'સ્વ. જેરામભાઈ માધવજીભાઈ પાંચાણી',
        'શ્રી વલ્લભભાઈ માધવજીભાઈ પાંચાણી',
        'શ્રી હિરજીભાઈ માધવજીભાઈ પાંચાણી',
        'સ્વ. રમેશભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી નનુભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી ભુપતભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી કલ્યાણભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી વિઠ્ઠલભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી હસમુખભાઈ સવજીભાઈ પાંચાણી',
        'શ્રી મગનભાઈ જેરામભાઈ પાંચાણી',
        'શ્રી હિંમતભાઈ ગોવિંદભાઈ પાંચાણી',
        'શ્રી નીતિનભાઈ ગોવિંદભાઈ પાંચાણી',
        'શ્રી જયસુખભાઈ વલ્લભભાઈ પાંચાણી',
        'શ્રી શ્રીધરભાઈ વલ્લભભાઈ પાંચાણી',
        'શ્રી વિપુલભાઈ હિરજીભાઈ પાંચાણી',
        'શ્રી પરેશભાઈ હિરજીભાઈ પાંચાણી',
        'શ્રી અલ્પેશભાઈ હિરજીભાઈ પાંચાણી',
      ],
    },

    note: {
      enabled: true,
      lead: '... સ્નેહ સંબંધ ...',
      darshanabhilashiLead: ':: દર્શનાભિલાષી ::',
      darshanabhilashi: [
        'શ્રી પ્રફુલભાઈ મગનભાઈ પાંચાણી',
        'શ્રી રાજેશભાઈ મગનભાઈ પાંચાણી',
        'શ્રી જયેશભાઈ મગનભાઈ પાંચાણી',
        'શ્રી કેયુરભાઈ હિંમતભાઈ પાંચાણી',
        'શ્રી મિતભાઈ જયસુખભાઈ પાંચાણી',
        'શ્રી જીતભાઈ શ્રીધરભાઈ પાંચાણી',
        'શ્રી દિવ્યેશભાઈ પરેશભાઈ પાંચાણી',
        'શ્રી વિરાજભાઈ વિપુલભાઈ પાંચાણી',
        'શ્રી પ્રિન્સ નીતિનભાઈ પાંચાણી',
      ],
      bhanejLead: ':: ભાણેજ પક્ષ ::',
      bhanej: [
        'શ્રી દિપેશ કૌશીકકુમાર પટેલ',
        'શ્રી દક્ષ કૌશીકકુમાર પટેલ',
        'નિલેશ રમેશભાઈ શીંગાળા',
        'શ્રી પ્રિયમ ધર્મેશભાઈ પોશીયા',
        'શ્રી વિર રાહુલભાઈ જોગાણી',
      ],
      mosalLead: ':: મોસાળ પક્ષ (કેરાળા) ::',
      mosal: [
        'શ્રી કનુભાઈ પોપટભાઈ કિકાણી',
        'સ્વ. ઠાકરશીભાઈ પોપટભાઈ કિકાણી',
        'શ્રી વિનુભાઈ પોપટભાઈ કિકાણી',
      ],
      familyLeft: [
        'શ્રી પ્રફુલભાઈ મગનભાઈ પાંચાણી',
        'શ્રી રાજેશભાઈ મગનભાઈ પાંચાણી',
        'શ્રી જયેશભાઈ મગનભાઈ પાંચાણી',
        'શ્રી કેયુરભાઈ હિંમતભાઈ પાંચાણી',
        'શ્રી મિતભાઈ જયસુખભાઈ પાંચાણી',
        'શ્રી જીતભાઈ શ્રીધરભાઈ પાંચાણી',
        'શ્રી દિવ્યેશભાઈ પરેશભાઈ પાંચાણી',
        'શ્રી વિરાજભાઈ વિપુલભાઈ પાંચાણી',
        'શ્રી પ્રિન્સ નીતિનભાઈ પાંચાણી',
      ],
      familyRight: [
        'શ્રી દિપેશ કૌશીકકુમાર પટેલ',
        'શ્રી દક્ષ કૌશીકકુમાર પટેલ',
        'નિલેશ રમેશભાઈ શીંગાળા',
        'શ્રી પ્રિયમ ધર્મેશભાઈ પોશીયા',
        'શ્રી વિર રાહુલભાઈ જોગાણી',
        'શ્રી કનુભાઈ પોપટભાઈ કિકાણી',
        'સ્વ. ઠાકરશીભાઈ પોપટભાઈ કિકાણી',
        'શ્રી વિનુભાઈ પોપટભાઈ કિકાણી',
      ],
    },

    tahukoCard: {
      enabled: true,
      tahukoLead: ':: ટહુકો ::',
      tahukoPoem: 'એક મીઠા પ્રસંગનું અમૂલ્ય આમંત્રણ લઈને આવ્યા છીએ,\nપ્રેમ અને લાગણીના સ્નેહભર્યા ભાવ લઈને આવ્યા છીએ.\n\nઆમ તો કંકોત્રી દ્વારા આમંત્રણ આપીએ છીએ,\nપણ આપને રૂબરૂ મળીને ભાવભેર તેડવા આવ્યા છીએ.',
      tahukoNames: ['હેમાંગી', 'ક્રિષ્ના', 'ભાગ્યશ્રી', 'ધૃતિ', 'તૃપ્તિ'],
      avsarLead: 'અવસરનું આંગણું',
      nimantrakLead: ':: નિમંત્રક ::',
      nimantrakHost: 'શ્રી મુકેશભાઈ જેરામભાઈ પાંચાણી',
      nimantrakCo: 'C/o. શ્રી મગનભાઈ જેરામભાઈ પાંચાણી',
      nimantrakAddress: 'મુ. રસનાળ, વાયા ઢસા, તા. ગઢડા (સ્વા.), જી. બોટાદ.',
      nimantrakPhones: ['૯૯૭૯૨ ૨૭૫૪૦', '૮૭૮૦૦ ૨૧૦૧૬'],
      shubhLagnaSthalLead: '॥ શુભ લગ્ન સ્થળ ॥',
      shubhLagnaSthalHost: 'શ્રી પ્રવિણભાઈ કડવાભાઈ બાબરીયા',
      shubhLagnaSthal: 'મુ. શેડુભાર',
      shubhLagnaMapUrl: 'https://www.google.com/maps/search/?api=1&query=Shedubhar',
      eAamantranLead: '॥ ઈ આમંત્રણ ॥',
      eAamantranGreeting: 'સ્નેહી સ્વજન શ્રી',
      eAamantranNote: 'આ ડિજીટલ કાર્ડને રૂબરૂ મળ્યા તુલ્ય સમજી અમારા આંગણે આવેલા શુભ પ્રસંગમાં જરૂરથી પધારશોજી.',
      eAamantranOk: 'આ કાર્ડ વાંચી OK નો રીટર્ન મેસેજ કરવા નમ્ર વિનંતી',
      eAamantranFamily: 'પાંચાણી પરિવાર આપની પ્રતિક્ષામાં....',
    },

    // The board on the easel that closes the invitation. The guest's name
    // above it is not config - it comes from ?to= per invite.
    farewell: {
      line: 'હૃદયના ધબકારે, આશાના અજવાળે, લાગણીના તારથી, શ્રદ્ધાના કિરણોથી, ઉત્સવના સાથિયા પૂર્યા છે. શુભ લગ્નપ્રસંગ માં નવયુગલ ને આપના શુભ આશિષ આપવા પધારશોજી.\n\nઆ ડિજીટલ કાર્ડને રૂબરૂ મળ્યા તુલ્ય સમજી અમારા આંગણે આવેલા શુભ પ્રસંગમાં જરૂરથી પધારશોજી.\nઆ કાર્ડ વાંચી OK નો રીટર્ન મેસેજ કરવા નમ્ર વિનંતી',
      family: 'પાંચાણી પરિવાર',
      waiting: 'આપની પ્રતિક્ષામાં....',
    },

    // The media row at the foot: Instagram, ceremony locations, add-to-
    // calendar (social.js). Only Instagram is stored, because it is the only
    // one with anything to store - the other two are derived from the
    // ceremonies above. `instagram: false` takes the icon off the row; an
    // empty instagramUrl still shows it and opens Instagram itself.
    social: { instagram: true, instagramUrl: '' },

    // Background music - the shared platform control (_platform/music.js)
    // reads and writes this.
    music: { enabled: true, src: 'media/music.mp3', volume: 0.5 },
  };

  // Arrays are replaced wholesale rather than merged index by index, so an
  // invitation that has saved its own gallery or ceremonies keeps exactly what
  // it saved and never inherits a later default.
  function deepMerge(base, over) {
    if (Array.isArray(base) || Array.isArray(over)) return over !== undefined ? over : base;
    if (typeof base !== 'object' || base === null) return over !== undefined ? over : base;
    if (typeof over !== 'object' || over === null) return base;
    const out = {};
    Object.keys(base).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
    Object.keys(over).forEach((k) => { if (!(k in base)) out[k] = over[k]; });
    return out;
  }

  // Trial editing persists to the SERVER (a trial_drafts row keyed by the
  // shopper's browser), injected synchronously as window.__balconyTrial by
  // /try/royale/draft.js. Non-trial standalone editing uses localStorage
  // (dev/preview only; a purchased host saves over the platform bridge, which
  // platform-adapter.js installs in place of save() below).
  function load() {
    if (trial) {
      const t = window.__balconyTrial;
      return deepMerge(DEFAULTS, (t && t.draft) || {});
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) return deepMerge(DEFAULTS, saved);
    } catch (_) { /* unreadable storage - fall through to the defaults */ }
    return deepMerge(DEFAULTS, {});
  }

  // The flat fields the platform reads (see RoyaleRuntime) are derived from
  // the couple's names on every save, so they can never drift from them.
  function syncDerived() {
    const cfg = window.Royale.config;
    const bride = (cfg.brideName || '').trim();
    const groom = (cfg.groomName || '').trim();
    cfg.title = [groom, bride].filter(Boolean).join(' & ');
    cfg.hostNames = [groom, bride].filter(Boolean);
  }

  function save() {
    syncDerived();
    if (trial) {
      const t = window.__balconyTrial;
      if (!t || !t.saveUrl) return Promise.resolve(false);
      // `config`, and an Accept of JSON: the endpoint validates on that field
      // name, and without the header a validation failure comes back as a
      // redirect rather than a 422 - a silent no-save.
      return fetch(t.saveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': t.csrf || '',
        },
        body: JSON.stringify({ config: window.Royale.config }),
        credentials: 'same-origin',
      }).then((r) => r.ok).catch(() => false);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.Royale.config));
      return true;
    } catch (_) {
      return false;
    }
  }

  function reset() {
    if (trial) {
      const t = window.__balconyTrial;
      if (t && t.saveUrl) {
        fetch(t.saveUrl, {
          method: 'DELETE',
          headers: { 'X-CSRF-TOKEN': t.csrf || '' },
          credentials: 'same-origin',
        }).catch(() => {});
      }
      return;
    }
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

  const nl2br = (s) => esc(s).replace(/\n/g, '<br />');

  function guestName() {
    return (params.get('to') || '').trim().slice(0, 80);
  }

  const GUJ_DAYS = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'];
  const GUJ_MONTHS = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
  const GUJ_DIGITS = { '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪', '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯' };

  function toGujDigits(str) {
    return String(str).replace(/[0-9]/g, function (d) { return GUJ_DIGITS[d] || d; });
  }

  // Gujarati date formatting: '2027-01-28', 'પોષ વદ-૭' -> 'ગુરુવાર, ૨૮ જાન્યુઆરી ૨૦૨૭ (પોષ વદ-૭)'
  function fmtDate(iso, tithi) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    const dayName = GUJ_DAYS[d.getDay()] || '';
    const monthName = GUJ_MONTHS[d.getMonth()] || '';
    const dateNum = toGujDigits(d.getDate());
    const yearNum = toGujDigits(d.getFullYear());
    const base = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
    return tithi ? `${base} (${tithi})` : base;
  }

  // Gujarati time formatting: '10:00' -> 'સવારે ૧૦:૦૦ કલાકે', '11:00' -> 'બપોરે ૧૧:૦૦ કલાકે'
  function fmtTime(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return '';
    const h = +m[1];
    const mins = toGujDigits(m[2]);
    let prefix = 'સવારે';
    if (h >= 11 && h < 16) prefix = 'બપોરે';
    else if (h >= 16 && h < 19) prefix = 'સાંજે';
    else if (h >= 19 || h < 4) prefix = 'રાત્રે';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const timeStr = toGujDigits(h12 < 10 ? '0' + h12 : h12) + ':' + mins;
    return `${prefix} ${timeStr} કલાકે`;
  }

  /** An explicit maps link if the host set one, else a search for the venue. */
  function mapLink(c) {
    const own = ((c && c.mapUrl) || '').trim();
    if (own) return own;
    const venue = ((c && c.venue) || '').trim();
    return venue ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue) : '';
  }

  // ---- Ceremonies the couple adds themselves -------------------------------
  // Beyond the six rites the template ships with, a host may add up to this
  // many of their own (custom: true), each with a photo they upload in place
  // of the template's artwork. Keep in step with CUSTOM_CEREMONY_MAX in
  // EventEditorController, which refuses a save carrying more.
  //
  // An added ceremony carries a permanent `id`, which is its RSVP key (see
  // RoyaleRuntime::rsvpEvents). The six built-in ones keep the array position
  // they have always been keyed by, so nothing already replied to moves.
  const CUSTOM_CEREMONY_MAX = 5;

  // How far an added ceremony's photo may be zoomed out: below 1 it no
  // longer covers its area, so a cut-out picture can be shown whole. (Zooming
  // in stops at 3, as a gallery picture's does.)
  const CEREMONY_ZOOM_MIN = 0.3;

  /**
   * Does a guest see this ceremony? A built-in one unless the host switched it
   * off. An added one also needs its name and its photo: it has no artwork of
   * its own to fall back on, so until both are in it stays on the host's side.
   * The cards, the locations and calendar popups and the RSVP list all ask
   * this same question (the last in RoyaleRuntime, in PHP).
   */
  function ceremonyLive(c) {
    if (!c || c.enabled === false) return false;
    if (!c.custom) return true;
    return !!((c.art || '').trim() && (c.name || '').trim());
  }

  /**
   * The ceremonies in the order they happen - by date, then time - which is
   * how they are drawn. A copy: the stored array keeps its own order, since
   * that order is what the built-in ceremonies' RSVP keys are. No date sorts
   * last, no time first on its day; equal ones keep their stored order.
   */
  function ceremoniesByDate(list) {
    const when = (c) => (/^\d{4}-\d{2}-\d{2}$/.test(c.date || '') ? c.date : '9999-99-99') + ' ' + (c.time || '');
    return (Array.isArray(list) ? list : []).slice().sort((a, b) => when(a).localeCompare(when(b)));
  }

  window.Royale = {
    mode,
    trial,
    TRIAL_EDITABLE,
    /** Can this config path be edited in the current mode? */
    canEdit: function (path) {
      if (mode !== 'edit') return false;
      return trial ? TRIAL_EDITABLE.indexOf(path) !== -1 : true;
    },
    config: load(),
    DEFAULTS,
    SYMBOLS,
    INVOCATIONS,
    symbolById,
    invocationLines,
    STORAGE_KEY,
    addDaysISO,
    save,
    reset,
    syncDerived,
    esc,
    nl2br,
    guestName,
    fmtDate,
    fmtTime,
    mapLink,
    CUSTOM_CEREMONY_MAX,
    CEREMONY_ZOOM_MIN,
    ceremonyLive,
    ceremoniesByDate,
  };

  if (mode === 'edit') document.body.classList.add('is-editing');
  if (mode === 'preview') document.body.classList.add('is-previewing');
  if (trial) document.body.classList.add('is-trial');
})();
