// ─── DECORATIONS ────────────────────────────────────────────────────────────
// Posisi dari drag manual user — 100% akurat
const decorations = [
  { id: 'd1', emoji: '⭐️', x: 97, y: -266 },
  { id: 'd2', emoji: '🌸', x: -683, y: 208 },
  { id: 'd3', emoji: '✨', x: -411, y: 571 },
  { id: 'd4', emoji: '🎀', x: -738, y: -308 },
  { id: 'd5', emoji: '🩷', x: 15, y: 8 },
  { id: 'd6', emoji: '💕', x: 585, y: -360 },
  { id: 'd7', emoji: '✨', x: 243, y: 311 },
  { id: 'd8', emoji: '✨', x: 378, y: -87 },
  { id: 'd9', emoji: '🌸', x: -407, y: -49 },
  { id: 'd10', emoji: '🎀', x: -127, y: 630 },
].map((d) => ({
  id: d.id,
  type: 'decoration',
  position: { x: d.x, y: d.y },
  data: { emoji: d.emoji },
  zIndex: 10,
}));

// ─── CONTENT NODES ──────────────────────────────────────────────────────────

// Posisi dari drag manual user — 100% akurat
const contentNodes = [
  // Hero photo
  {
    id: 'n-hero',
    type: 'image',
    position: { x: 33, y: 26 },
    data: {
      date: '✨',
      url: '/hero/star.jpg',
      width: 374,
      imgWidth: 347,
      cardless: true,
    },
  },
  // Title note
  {
    id: 'n-title',
    type: 'note',
    position: { x: 39, y: -190 },
    data: {
      bg: '#ffe4e6',
      rotate: '-1deg',
      text: 'Happy Birthday,\nSyafara! 🎂\n\nSemoga harimu seindah kamu.',
    },
  },
  // Letter diary
  {
    id: 'n-letter',
    type: 'text',
    position: { x: -336, y: 359 },
    data: {
      date: '02 March 2025',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Selamat ulang tahun, munyu kuu', styles: { bold: true } }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hari ini bukan cuma tentang umur kamu yang bertambah.. tapi juga tentang pengingat betapa banyak kebaikan yang udah kamu bawa ke dunia ini.', styles: {} }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Makasih udah jadi kamu yaa. Makasih udah milih aku dalam hidup kamuu.', styles: {} }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'I love youu bayi, and always <3', styles: { italic: true } }] },
      ],
    },
  },
  // Love note 1 (yellow)
  {
    id: 'n-love1',
    type: 'note',
    position: { x: -396, y: 36 },
    data: {
      bg: '#fef9c3',
      rotate: '-3deg',
      label: 'note',
      text: 'Tiap hari sama kamu selalu jadi hari paling seru. terimakasih selalu ada, terimaksih selalu ada, tapi mengapa tiba-tiba seakan.. kau pergii',
    },
  },
  // Love note 2 (purple)
  {
    id: 'n-love2',
    type: 'note',
    position: { x: -124, y: 536 },
    data: {
      bg: '#ede9fe',
      rotate: '2deg',
      label: 'dear syafaya',
      text: 'munyu nya abang, pemayah tapi sayangnya becal cekaliii',
    },
  },
  // Kenangan note (green)
  {
    id: 'n-mem',
    type: 'note',
    position: { x: -217, y: -272 },
    data: {
      bg: '#d1fae5',
      rotate: '1.5deg',
      label: 'kebanggan abang',
      text: 'kamu itu keren sekalii, sebelum bahkan selama bareng abang, banyak pencapaian yang kamu raih dan itu bikin aku amaze sekalii, aku nantikan kejutan kejutan membanggakan dari kamu yaa, senang membersamaimu sayaang',
    },
  },
  // Wish/Harapan note (orange)
  {
    id: 'n-wish',
    type: 'note',
    position: { x: -360, y: 515 },
    data: {
      bg: '#ffedd5',
      rotate: '-2deg',
      label: 'harapan',
      text: 'sehat selaluu, bahagia selaluu, senyum teruus, ketawa teruus, karena ceria nya dan riang gembiranya kamu jadi prioritasku sejak kita pertama kali ketemuu',
    },
  },
  // Polaroid 1 (foto berdua)
  {
    id: 'n-pola1',
    type: 'polaroid',
    position: { x: 262, y: -401 },
    data: {
      rotate: '-2deg',
      url: '/places/hari-kita.jpg',
      caption: 'foto berdua pertama kali yang proper ceunah, hehe',
      date: '25/04/2025',
    },
  },
  // Polaroid 2 (tempat duduk)
  {
    id: 'n-pola2',
    type: 'polaroid',
    position: { x: -625, y: -427 },
    data: {
      rotate: '3deg',
      url: '/places/tempat-duduk-pertama.jpg',
      caption: 'tempat duduk pertama kita ✨',
      date: '02/03/2025',
      width: 320,
      imgHeight: 230,
    },
  },
  // Photobox
  {
    id: 'n-photobox',
    type: 'photobox',
    position: { x: -592, y: 238 },
    data: {
      title: 'photobox',
      photos: ['/photobox/1.jpg', '/photobox/2.jpg', '/photobox/3.jpg', '/photobox/4.jpg', '/photobox/5.jpg'],
      width: 320,
      height: 414,
      cardless: true,
    },
  },
  // Kirby sticker GIF — tanpa card/container
  {
    id: 'n-img',
    type: 'sticker',
    position: { x: 163, y: 508 },
    zIndex: 10,
    data: {
      url: '/stickers/kirby.gif',
      width: 400,
      shadow: true,
    },
  },
  // Lilin 20 sticker
  {
    id: 'n-candle',
    type: 'sticker',
    position: { x: -294, y: 60 },
    zIndex: 10,
    data: {
      url: '/stickers/20.png',
      width: 540,
      shadow: false,
    },
  },
  // Flower bouquet sticker
  {
    id: 'n-flowers',
    type: 'sticker',
    position: { x: 280, y: 19 },
    zIndex: 10,
    data: {
      url: '/stickers/flowers.png',
      width: 600,
      shadow: false,
    },
  },
  // Quote note
  {
    id: 'n-quote',
    type: 'note',
    position: { x: 504, y: 144 },
    data: {
      bg: '#fce7f3',
      rotate: '-1deg',
      text: '"You deserve all the love you keep trying to give everyone else, babyy"',
      author: 'with love, abang',
    },
  },
  // Spotify stack
  {
    id: 'n-spotify-stack',
    type: 'spotifyStack',
    position: { x: 559, y: -269 },
    data: {
      tracks: [
        'https://open.spotify.com/embed/track/0EDgUNdoWnRslGw6epuJY9?utm_source=generator',
        'https://open.spotify.com/embed/track/3HEfLSVUo9rxdD0JxbLAUU?utm_source=generator',
        'https://open.spotify.com/embed/track/6u98EplW5Fw0G7GnmkGqJ2?utm_source=generator',
        'https://open.spotify.com/embed/track/1DFmBjoeQN9DpOVTEewyx0?utm_source=generator',
        'https://open.spotify.com/embed/track/5By7Pzgl6TMuVJG168VWzS?utm_source=generator',
        'https://open.spotify.com/embed/track/7KnmNeDVuJEbbmo1452LxD?utm_source=generator',
      ],
      cardless: true,
    },
  },
  // YouTube meme
  {
    id: 'n-meme',
    type: 'youtube',
    position: { x: -729, y: -49 },
    data: {
      title: 'meme',
      url: 'https://youtube.com/shorts/xXmpxt5bnk4?si=qaYq3i98417tUr-r',
      cardless: true,
    },
  },
  // List
  {
    id: 'n-list',
    type: 'list',
    position: { x: 304, y: -2 },
    data: {
      title: 'nama kamu selain Zahrani Syafara Aryadi',
      icon: '🌸',
      items: [
        'Amor Mio',
        'Bayii',
        'Munyuu',
        'Bucuuk Abang',
        'Pipii',
        'Kirby mayah',
        'Pemayah Abang',
      ],
    },
  },
  // Cat sticker
  {
    id: 'n-cat',
    type: 'sticker',
    position: { x: -182, y: -8 },
    zIndex: 10,
    data: {
      url: '/stickers/cat.png',
      width: 280,
      shadow: true,
    },
  },
  // Mara sticker
  {
    id: 'n-mara',
    type: 'sticker',
    position: { x: -38, y: 641 },
    zIndex: 10,
    data: {
      url: '/stickers/mara.png',
      width: 250,
      shadow: true,
    },
  },
];

export const initialNodes = [...decorations, ...contentNodes];

export const initialEdges = [];
