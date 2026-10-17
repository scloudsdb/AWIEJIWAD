// @ts-ignore — Firebase loaded from CDN importmap
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// ─── Firebase config (VITE env vars) ─────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  toolType: 'cg' | 'kc' | 'ch';
  visible: boolean;
}

// ─── Fallback placeholder cards (offline / not configured) ────────────────────
const PLACEHOLDER_PRODUCTS: Product[] = [
  {
    id: 'ph-1',
    name: 'Clicker Fidget',
    description: 'Clicker fidget 3D print custom dengan desain unik dan feel yang memuaskan.',
    price: 25000,
    imageUrl: '/thumbs/clicker-generator.webp',
    toolType: 'cg',
    visible: true,
  },
  {
    id: 'ph-2',
    name: 'Name Keychain',
    description: 'Gantungan kunci nama custom — ukuran, font, dan warna sesuai request.',
    price: 15000,
    imageUrl: '/thumbs/name-keychain.webp',
    toolType: 'kc',
    visible: true,
  },
  {
    id: 'ph-3',
    name: 'Card Holder',
    description: 'Tempat kartu minimalis 3D print custom, muat hingga 5 kartu.',
    price: 20000,
    imageUrl: '/thumbs/cardless.webp',
    toolType: 'ch',
    visible: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRupiah(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderProductCards(products: Product[]): string {
  return products
    .map(
      (p) => `
    <article class="hub-product-card">
      <div class="hub-product-img">
        ${
          p.imageUrl
            ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" />`
            : `<div class="hub-product-img-placeholder">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                   <circle cx="8.5" cy="8.5" r="1.5"/>
                   <polyline points="21 15 16 10 5 21"/>
                 </svg>
               </div>`
        }
      </div>
      <div class="hub-product-body">
        <h3 class="hub-product-name">${escapeHtml(p.name)}</h3>
        <p class="hub-product-desc">${escapeHtml(p.description || '')}</p>
        <div class="hub-product-price">${formatRupiah(p.price)}</div>
      </div>
    </article>`
    )
    .join('');
}

function renderSkeletons(count: number): string {
  return Array.from({ length: count })
    .map(() => `<div class="hub-product-skeleton" aria-hidden="true"></div>`)
    .join('');
}

// ─── Fetch products from Firestore ────────────────────────────────────────────
async function loadProducts(container: HTMLElement): Promise<void> {
  // Show skeletons
  container.innerHTML = renderSkeletons(3);
  container.setAttribute('aria-busy', 'true');

  try {
    const app = initializeApp(firebaseConfig);
    const db  = getFirestore(app);
    const q   = query(collection(db, 'products'), where('visible', '==', true));
    const snapshot = await getDocs(q);

    const products: Product[] = snapshot.docs.map((d: { id: string; data: () => Omit<Product, 'id'> }) => ({
      id: d.id,
      ...(d.data() as Omit<Product, 'id'>),
    }));

    container.setAttribute('aria-busy', 'false');

    if (products.length === 0) {
      container.innerHTML = `<p class="hub-products-empty">Belum ada produk yang tersedia. Cek lagi nanti!</p>`;
      return;
    }

    container.innerHTML = renderProductCards(products);
  } catch (err) {
    console.warn('Firestore fetch failed, showing placeholders:', err);
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = renderProductCards(PLACEHOLDER_PRODUCTS);
  }
}

// ─── Build page HTML ──────────────────────────────────────────────────────────
function buildPage(): string {
  return `
<div class="hub-page">

  <!-- NAV -->
  <nav class="hub-nav" aria-label="Navigasi utama">
    <div class="hub-container hub-nav__inner">
      <a href="/" class="hub-nav__logo" aria-label="A&amp;I 3D Labs - Beranda">
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="currentColor"/>
          <path d="M7 20L14 8l7 12H7z" fill="white" opacity="0.9"/>
        </svg>
        A&amp;I 3D Labs
      </a>
      <div class="hub-nav__right">
        <div class="hub-nav__links">
          <a href="#products" class="hub-nav__link">Produk</a>
          <a href="#about" class="hub-nav__link">Tentang Kami</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- HERO -->
  <section class="hub-hero hub-section">
    <div class="hub-container">
      <span class="hub-hero__eyebrow">Kustom 3D Print</span>
      <h1 class="hub-hero__title">Custom 3D Print <em>Berkualitas</em></h1>
      <p class="hub-hero__sub">
        Aksesori 3D print custom sesuai keinginanmu. Keychain, clicker fidget, card holder — pesan sekarang!
      </p>
      <a href="#products" class="hub-btn hub-btn--primary hub-hero__cta">
        Lihat Produk
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </a>
    </div>
  </section>

  <!-- PRODUCTS -->
  <section id="products" class="hub-section hub-section--products">
    <div class="hub-container">
      <div class="hub-section__header">
        <h2 class="hub-section__title">Produk Kami</h2>
        <p class="hub-section__desc">Pilih desain yang kamu suka, kami cetak sesuai request.</p>
      </div>
      <div id="products-grid" class="hub-products-grid" aria-live="polite" aria-label="Daftar produk"></div>
    </div>
  </section>

  <!-- ABOUT -->
  <section id="about" class="hub-section hub-section--about">
    <div class="hub-container hub-about__inner">
      <div class="hub-about__content">
        <span class="hub-about__eyebrow">Tentang Kami</span>
        <h2 class="hub-about__title">Dibuat dengan presisi, dikirim dengan cinta.</h2>
        <p class="hub-about__desc">
          A&amp;I 3D Labs adalah toko custom aksesori 3D print berbasis di Indonesia.
          Kami menggunakan filamen berkualitas dan printer FDM yang dioptimalkan untuk
          menghasilkan produk dengan detail tajam dan finish rapi.
          Setiap pesanan dibuat sesuai permintaanmu — ukuran, warna, dan desain.
        </p>
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          class="hub-btn hub-btn--primary hub-about__cta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.77.463 3.431 1.27 4.877L2 22l5.27-1.243A9.935 9.935 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill-rule="evenodd" clip-rule="evenodd" opacity="0.3"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.77.463 3.431 1.27 4.877L2 22l5.27-1.243A9.935 9.935 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 0 1-4.073-1.117l-.292-.173-3.027.714.725-2.964-.19-.304A7.96 7.96 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
          </svg>
          Hubungi Kami
        </a>
      </div>
      <div class="hub-about__visual" aria-hidden="true">
        <div class="hub-about__blob"></div>
        <div class="hub-about__icon-group">
          <span class="hub-about__icon">🖱️</span>
          <span class="hub-about__icon hub-about__icon--offset">🔑</span>
          <span class="hub-about__icon">💳</span>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="hub-footer">
    <div class="hub-container">
      <p>&copy; ${new Date().getFullYear()} A&amp;I 3D Labs. Semua hak dilindungi undang-undang.</p>
      <p class="hub-footer__sub">Dibuat dengan ❤️ di Indonesia · Custom 3D Print</p>
    </div>
  </footer>

</div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = buildPage();

  // Smooth scroll for nav anchor links
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e: Event) => {
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Load products
  const productsGrid = document.getElementById('products-grid');
  if (productsGrid) {
    loadProducts(productsGrid);
  }
}
