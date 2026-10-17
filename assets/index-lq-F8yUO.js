import{initializeApp as g}from"firebase/app";import{getFirestore as m,query as f,collection as v,where as k,getDocs as y}from"firebase/firestore";(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();const w={apiKey:"AIzaSyCDKewmmDoN4cVTrjXGweMRFs6qzS4C-GQ",authDomain:"ai3dlabs-421c3.firebaseapp.com",projectId:"ai3dlabs-421c3",messagingSenderId:"771181425604",appId:"1:771181425604:web:5a6b7ae7deb9426eb52a91"},u="6281234567890",p=[{id:"ph-1",name:"Clicker Fidget Custom",description:"Fidget clicker mekanik dengan sentuhan logo/tulisan kustom. Suara klik tactile dan memuaskan.",price:25e3,imageUrl:"/thumbs/clicker.png",toolType:"cg",visible:!0},{id:"ph-2",name:"Name Keychain 3D",description:"Gantungan kunci nama multi-layer custom. Pilihan warna cerah, kuat, dan anti luntur.",price:15e3,imageUrl:"/thumbs/name-keychain.png",toolType:"kc",visible:!0},{id:"ph-3",name:"ID Card Holder Minimalis",description:"Tempat kartu presisi untuk Flazz, e-Money, atau kartu akses gedung. Pas dan aman.",price:2e4,imageUrl:"/thumbs/cardless.png",toolType:"ch",visible:!0}];function b(e){return`Rp ${e.toLocaleString("id-ID")}`}function o(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function _(e){switch(e){case"cg":return"Clicker";case"kc":return"Keychain";case"ch":return"Card Holder";default:return"Custom 3D"}}let l=[],c="all";function d(e){const i=c==="all"?e:e.filter(t=>t.toolType===c);return i.length===0?`<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #94a3b8;">
      Tidak ada produk pada kategori ini.
    </div>`:i.map(t=>{const r=encodeURIComponent(`Halo A&I 3D Labs, saya mau order produk: ${t.name} (${b(t.price)}). Bisa info detailnya?`),a=`https://wa.me/${u}?text=${r}`,n=t.imageUrl||"/thumbs/clicker.png";return`
      <article class="hub-product-card" data-tool="${o(t.toolType)}">
        <div class="hub-product-img">
          <img src="${o(n)}" alt="${o(t.name)}" loading="lazy" onerror="this.src='/thumbs/clicker.png'" />
          <span class="hub-product-tag">${_(t.toolType)}</span>
        </div>
        <div class="hub-product-body">
          <h3 class="hub-product-name">${o(t.name)}</h3>
          <p class="hub-product-desc">${o(t.description||"")}</p>
          <div class="hub-product-footer">
            <div class="hub-product-price">${b(t.price)}</div>
            <a href="${a}" target="_blank" rel="noopener noreferrer" class="hub-product-order-btn">
              Pesan
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </article>`}).join("")}function A(e){return Array.from({length:e}).map(()=>'<div class="hub-product-skeleton" aria-hidden="true"></div>').join("")}async function D(e){e.innerHTML=A(3),e.setAttribute("aria-busy","true");try{const i=g(w),t=m(i),r=f(v(t,"products"),k("visible","==",!0)),n=(await y(r)).docs.map(s=>({id:s.id,...s.data()}));e.setAttribute("aria-busy","false"),n.length>0?l=n:l=p,e.innerHTML=d(l)}catch(i){console.warn("Firestore fetch failed, showing default placeholders:",i),e.setAttribute("aria-busy","false"),l=p,e.innerHTML=d(l)}}function L(){return`
<div class="hub-page">
  <div class="hub-ambient-top"></div>

  <!-- NAVIGATION -->
  <header class="hub-nav" role="banner">
    <div class="hub-container hub-nav__inner">
      <a href="/" class="hub-nav__logo" aria-label="A&I 3D Labs Home">
        <div class="hub-nav__logo-icon">A</div>
        <span>A&amp;I 3D Labs</span>
      </a>

      <nav class="hub-nav__links" aria-label="Navigasi Desktop">
        <a href="#katalog" class="hub-nav__link">Katalog Produk</a>
        <a href="#tentang" class="hub-nav__link">Tentang Kami</a>
        <a href="#keunggulan" class="hub-nav__link">Keunggulan</a>
      </nav>

      <div class="hub-nav__right">
        <a href="https://wa.me/${u}?text=Halo%20A%26I%203D%20Labs%2C%20saya%20mau%20tanya%20kustom%203D%20print" target="_blank" rel="noopener noreferrer" class="hub-btn hub-btn--wa" style="padding: 0.55rem 1.1rem; font-size: 0.85rem; width: auto;">
          WhatsApp
        </a>
        <button id="hamburger-btn" class="hub-hamburger" aria-label="Buka menu navigasi" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </header>

  <!-- MOBILE DRAWER -->
  <div id="mobile-menu" class="hub-mobile-menu" aria-label="Menu Mobile">
    <a href="#katalog" class="mobile-nav-link">Katalog Produk</a>
    <a href="#tentang" class="mobile-nav-link">Tentang Kami</a>
    <a href="#keunggulan" class="mobile-nav-link">Keunggulan</a>
  </div>

  <!-- HERO -->
  <section class="hub-hero">
    <div class="hub-container">
      <div class="hub-hero__eyebrow">
        <span>✨</span> Kustom 3D Print Berkualitas &amp; Rapi
      </div>
      <h1 class="hub-hero__title">
        Aksesori 3D Print Custom <em>Sesuai Gayamu</em>
      </h1>
      <p class="hub-hero__sub">
        Fidget clicker, gantungan kunci nama personal, hingga ID card holder minimalis. Dibuat dengan material berkualitas dan pilihan warna bebas!
      </p>

      <div class="hub-hero__actions">
        <a href="#katalog" class="hub-btn hub-btn--primary">
          Lihat Katalog Produk
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </a>
        <a href="https://wa.me/${u}?text=Halo%20A%26I%203D%20Labs%2C%20saya%20mau%20konsultasi%20desain%20kustom" target="_blank" rel="noopener noreferrer" class="hub-btn hub-btn--secondary">
          Konsultasi Desain
        </a>
      </div>

      <!-- Feature Badges -->
      <div class="hub-features" id="keunggulan">
        <div class="hub-feature-pill">
          <span class="hub-feature-icon">✨</span>
          <span>Hasil Rapi &amp; Halus</span>
        </div>
        <div class="hub-feature-pill">
          <span class="hub-feature-icon">🎨</span>
          <span>Bebas Pilih Warna</span>
        </div>
        <div class="hub-feature-pill">
          <span class="hub-feature-icon">🛡️</span>
          <span>Bahan Kuat &amp; Awet</span>
        </div>
        <div class="hub-feature-pill">
          <span class="hub-feature-icon">⚡</span>
          <span>Pengerjaan Cepat</span>
        </div>
      </div>
    </div>
  </section>

  <!-- PRODUCTS SECTION -->
  <section id="katalog" class="hub-section" style="background: rgba(15, 23, 42, 0.4);">
    <div class="hub-container">
      <div class="hub-section__header">
        <h2 class="hub-section__title">Katalog Produk</h2>
        <p class="hub-section__desc">Pilih kategori atau langsung pesan via WhatsApp sesuai pesanan Anda.</p>
      </div>

      <!-- Filter Tabs -->
      <div class="hub-filter-tabs">
        <button class="hub-filter-btn active" data-filter="all">Semua Produk</button>
        <button class="hub-filter-btn" data-filter="cg">Clicker Fidget</button>
        <button class="hub-filter-btn" data-filter="kc">Gantungan Kunci</button>
        <button class="hub-filter-btn" data-filter="ch">Card Holder</button>
      </div>

      <div id="products-grid" class="hub-products-grid" aria-live="polite"></div>
    </div>
  </section>

  <!-- ABOUT SECTION -->
  <section id="tentang" class="hub-section hub-about">
    <div class="hub-container">
      <div class="hub-about__grid">
        <div class="hub-about__content">
          <h2>Dibuat dengan Presisi, Didesain untuk Anda</h2>
          <p>
            <strong>A&amp;I 3D Labs</strong> menghadirkan produk 3D print berkualitas tinggi yang fungsional dan estetik. Setiap produk dirancang dengan toleransi pas, finishing rapi, dan menggunakan filamen ramah lingkungan yang kokoh.
          </p>

          <div class="hub-about__specs">
            <div class="hub-spec-box">
              <div class="hub-spec-value">100%</div>
              <div class="hub-spec-label">Custom Made</div>
            </div>
            <div class="hub-spec-box">
              <div class="hub-spec-value">1-3 Hari</div>
              <div class="hub-spec-label">Estimasi Produksi</div>
            </div>
          </div>

          <a href="https://wa.me/${u}?text=Halo%20A%26I%203D%20Labs%2C%20saya%20tertarik%20tahu%20lebih%20banyak" target="_blank" rel="noopener noreferrer" class="hub-btn hub-btn--primary" style="width: auto;">
            Hubungi Kami Sekarang
          </a>
        </div>

        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--hub-card-border); border-radius: 20px; padding: 2rem; text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🖨️</div>
          <h3 style="font-size: 1.25rem; margin: 0 0 0.5rem; color: #fff;">Bambu Lab Precision</h3>
          <p style="color: var(--hub-text-muted); font-size: 0.9rem; margin: 0;">
            Diproduksi menggunakan printer 3D generasi terbaru dengan multi-color printing untuk gradasi dan kombinasi warna yang tajam.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- FLOATING WA BUTTON -->
  <a href="https://wa.me/${u}?text=Halo%20A%26I%203D%20Labs%2C%20saya%20mau%20tanya%20produk" target="_blank" rel="noopener noreferrer" class="hub-float-wa" aria-label="Chat WhatsApp">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-10.416c-5.522 0-10 4.477-10 10 0 1.77.463 3.431 1.27 4.877l-1.278 4.673 4.809-1.261a9.96 9.96 0 0 0 5.199 1.455h.004c5.523 0 10-4.478 10-10 0-5.523-4.477-10-10.004-10z"/>
    </svg>
    <span>Chat WhatsApp</span>
  </a>

  <!-- FOOTER -->
  <footer class="hub-footer">
    <div class="hub-container">
      <p style="margin: 0 0 0.5rem; font-weight: 600; color: #e2e8f0;">
        &copy; ${new Date().getFullYear()} A&amp;I 3D Labs. All rights reserved.
      </p>
      <p style="margin: 0; color: #64748b; font-size: 0.8rem;">
        Cetak 3D Berkualitas | Indonesia
      </p>
    </div>
  </footer>
</div>
  `}const h=document.getElementById("app");if(h){h.innerHTML=L();const e=document.getElementById("hamburger-btn"),i=document.getElementById("mobile-menu");e&&i&&(e.addEventListener("click",()=>{const r=i.classList.toggle("open");e.setAttribute("aria-expanded",String(r))}),document.querySelectorAll(".mobile-nav-link").forEach(r=>{r.addEventListener("click",()=>{i.classList.remove("open"),e.setAttribute("aria-expanded","false")})})),document.querySelectorAll('a[href^="#"]').forEach(r=>{r.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("href");if(!n||n==="#")return;const s=document.querySelector(n);s&&(a.preventDefault(),s.scrollIntoView({behavior:"smooth",block:"start"}))})});const t=document.getElementById("products-grid");document.querySelectorAll(".hub-filter-btn").forEach(r=>{r.addEventListener("click",()=>{document.querySelectorAll(".hub-filter-btn").forEach(a=>a.classList.remove("active")),r.classList.add("active"),c=r.dataset.filter||"all",t&&(t.innerHTML=d(l))})}),t&&D(t)}
