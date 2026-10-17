// @ts-ignore — Firebase loaded from CDN importmap
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
// @ts-ignore
import { signOut } from 'firebase/auth';
import { auth, db } from './firebase';

// ─── Env vars ─────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = (import.meta.env.VITE_GITHUB_TOKEN as string) || '';
const GITHUB_OWNER = (import.meta.env.VITE_GITHUB_OWNER as string) || 'scloudsdb';
const GITHUB_REPO  = (import.meta.env.VITE_GITHUB_REPO as string) || 'AWIEJIWAD';
const SITE_DOMAIN  = (import.meta.env.VITE_SITE_DOMAIN as string) || 'ai3dlabs.site';

function getGitHubToken(): string {
  return localStorage.getItem('ai3dlabs_github_token') || GITHUB_TOKEN;
}
function getGitHubOwner(): string {
  return localStorage.getItem('ai3dlabs_github_owner') || GITHUB_OWNER;
}
function getGitHubRepo(): string {
  return localStorage.getItem('ai3dlabs_github_repo') || GITHUB_REPO;
}

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

// ─── State ────────────────────────────────────────────────────────────────────
let products: Product[] = [];
let pendingImageUrl = '';
let pendingImageFilename = '';
let editingProductId: string | null = null;
let deleteTargetId: string | null = null;

// ─── Element refs ─────────────────────────────────────────────────────────────
const productsGrid    = document.getElementById('products-grid') as HTMLDivElement;
const productsLoading = document.getElementById('products-loading') as HTMLDivElement;
const productsEmpty   = document.getElementById('products-empty') as HTMLParagraphElement;
const addProductBtn   = document.getElementById('add-product-btn') as HTMLButtonElement;

const productModal    = document.getElementById('product-modal') as HTMLDivElement;
const productForm     = document.getElementById('product-form') as HTMLFormElement;
const productIdInput  = document.getElementById('product-id') as HTMLInputElement;
const productName     = document.getElementById('product-name') as HTMLInputElement;
const productDesc     = document.getElementById('product-desc') as HTMLTextAreaElement;
const productPrice    = document.getElementById('product-price') as HTMLInputElement;
const productTool     = document.getElementById('product-tool') as HTMLSelectElement;
const productVisible  = document.getElementById('product-visible') as HTMLInputElement;
const productImage    = document.getElementById('product-image') as HTMLInputElement;
const productImageUrl = document.getElementById('product-image-url') as HTMLInputElement;
const imageUploadArea = document.getElementById('image-upload-area') as HTMLDivElement;
const imageUploadPlaceholder = document.getElementById('image-upload-placeholder') as HTMLDivElement;
const imagePreviewContainer  = document.getElementById('image-preview-container') as HTMLDivElement;
const imagePreview           = document.getElementById('image-preview') as HTMLImageElement;
const removeImageBtn         = document.getElementById('remove-image') as HTMLButtonElement;
const uploadProgress         = document.getElementById('upload-progress') as HTMLDivElement;
const uploadProgressFill     = document.getElementById('upload-progress-fill') as HTMLDivElement;
const uploadStatus           = document.getElementById('upload-status') as HTMLSpanElement;
const modalTitle             = document.getElementById('modal-title') as HTMLHeadingElement;
const modalClose             = document.getElementById('modal-close') as HTMLButtonElement;
const modalCancel            = document.getElementById('modal-cancel') as HTMLButtonElement;
const modalSubmit            = document.getElementById('modal-submit') as HTMLButtonElement;
const modalSubmitText        = document.getElementById('modal-submit-text') as HTMLSpanElement;
const modalSubmitSpinner     = document.getElementById('modal-submit-spinner') as HTMLSpanElement;
const modalError             = document.getElementById('modal-error') as HTMLDivElement;

const deleteModal        = document.getElementById('delete-modal') as HTMLDivElement;
const deleteProductName  = document.getElementById('delete-product-name') as HTMLElement;
const deleteCancel       = document.getElementById('delete-cancel') as HTMLButtonElement;
const deleteConfirm      = document.getElementById('delete-confirm') as HTMLButtonElement;
const deleteConfirmText  = document.getElementById('delete-confirm-text') as HTMLSpanElement;
const deleteConfirmSpinner = document.getElementById('delete-confirm-spinner') as HTMLSpanElement;

const logoutBtn      = document.getElementById('logout-btn') as HTMLButtonElement;
const hamburgerBtn   = document.getElementById('hamburger-btn') as HTMLButtonElement;
const sidebar        = document.getElementById('sidebar') as HTMLElement;
const sidebarClose   = document.getElementById('sidebar-close') as HTMLButtonElement;
const sidebarOverlay = document.getElementById('sidebar-overlay') as HTMLDivElement;
const navItems       = document.querySelectorAll<HTMLButtonElement>('.nav-item');
const sectionProduk  = document.getElementById('section-produk') as HTMLElement;
const sectionTools   = document.getElementById('section-tools') as HTMLElement;
const sectionSettings = document.getElementById('section-settings') as HTMLElement;
const topbarTitle    = document.getElementById('topbar-title') as HTMLHeadingElement;
const toastContainer = document.getElementById('toast-container') as HTMLDivElement;

// Settings elements
const settingsGithubToken = document.getElementById('settings-github-token') as HTMLInputElement;
const settingsGithubOwner = document.getElementById('settings-github-owner') as HTMLInputElement;
const settingsGithubRepo  = document.getElementById('settings-github-repo') as HTMLInputElement;
const saveSettingsBtn     = document.getElementById('save-settings-btn') as HTMLButtonElement;

function initSettings(): void {
  if (settingsGithubToken) settingsGithubToken.value = localStorage.getItem('ai3dlabs_github_token') || '';
  if (settingsGithubOwner) settingsGithubOwner.value = localStorage.getItem('ai3dlabs_github_owner') || GITHUB_OWNER;
  if (settingsGithubRepo)  settingsGithubRepo.value  = localStorage.getItem('ai3dlabs_github_repo')  || GITHUB_REPO;
}

saveSettingsBtn?.addEventListener('click', () => {
  if (settingsGithubToken) localStorage.setItem('ai3dlabs_github_token', settingsGithubToken.value.trim());
  if (settingsGithubOwner) localStorage.setItem('ai3dlabs_github_owner', settingsGithubOwner.value.trim());
  if (settingsGithubRepo)  localStorage.setItem('ai3dlabs_github_repo',  settingsGithubRepo.value.trim());
  showToast('Pengaturan GitHub berhasil disimpan ke browser!', 'success');
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3500);
}

// ─── Price formatter ──────────────────────────────────────────────────────────
function formatRupiah(price: number): string {
  return `Rp ${price.toLocaleString('id-ID')}`;
}

// ─── Tool badge label ─────────────────────────────────────────────────────────
function toolLabel(type: string): string {
  const map: Record<string, string> = { cg: 'CG', kc: 'KC', ch: 'CH' };
  return map[type] ?? type.toUpperCase();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function showSection(section: 'produk' | 'tools' | 'settings'): void {
  sectionProduk.classList.toggle('hidden', section !== 'produk');
  sectionTools.classList.toggle('hidden', section !== 'tools');
  sectionSettings?.classList.toggle('hidden', section !== 'settings');
  topbarTitle.textContent = section === 'produk' ? 'Produk' : section === 'tools' ? 'Tools' : 'Pengaturan';
  navItems.forEach((item) => {
    const active = item.dataset['section'] === section;
    item.classList.toggle('active', active);
    item.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    const sec = item.dataset['section'] as 'produk' | 'tools' | 'settings';
    showSection(sec);
    closeSidebar();
  });
});

// ─── Sidebar (mobile) ─────────────────────────────────────────────────────────
function openSidebar(): void {
  sidebar.classList.add('sidebar-open');
  sidebarOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSidebar(): void {
  sidebar.classList.remove('sidebar-open');
  sidebarOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

hamburgerBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ─── Logout ───────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  try {
    localStorage.removeItem('ai3dlabs_auth');
    await signOut(auth);
    window.location.reload();
  } catch {
    showToast('Gagal keluar. Coba lagi.', 'error');
  }
});

// ─── Tools access buttons ─────────────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('.tool-access-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const url = btn.dataset['url'];
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  });
});

// ─── Render products ──────────────────────────────────────────────────────────
function renderProducts(): void {
  productsGrid.innerHTML = '';

  if (products.length === 0) {
    productsGrid.classList.add('hidden');
    productsEmpty.classList.remove('hidden');
    return;
  }

  productsEmpty.classList.add('hidden');
  productsGrid.classList.remove('hidden');

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset['id'] = product.id;

    card.innerHTML = `
      <div class="product-img-wrap">
        ${product.imageUrl
          ? `<img src="${product.imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" />`
          : `<div class="product-img-placeholder">
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
               </svg>
             </div>`
        }
        <div class="product-badges">
          <span class="badge badge-tool badge-${product.toolType}">${toolLabel(product.toolType)}</span>
          ${!product.visible ? '<span class="badge badge-hidden">Tersembunyi</span>' : ''}
        </div>
      </div>
      <div class="product-body">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <p class="product-desc">${escapeHtml(product.description || '—')}</p>
        <div class="product-footer">
          <span class="price-badge">${formatRupiah(product.price)}</span>
          <div class="product-actions">
            <button class="btn btn-sm btn-ghost edit-btn" data-id="${product.id}" aria-label="Edit ${escapeHtml(product.name)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}" data-name="${escapeHtml(product.name)}" aria-label="Hapus ${escapeHtml(product.name)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Hapus
            </button>
          </div>
        </div>
      </div>
    `;

    productsGrid.appendChild(card);
  });

  // Attach card-level listeners
  productsGrid.querySelectorAll<HTMLButtonElement>('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset['id'] ?? ''));
  });
  productsGrid.querySelectorAll<HTMLButtonElement>('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () =>
      openDeleteModal(btn.dataset['id'] ?? '', btn.dataset['name'] ?? '')
    );
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Fetch products ───────────────────────────────────────────────────────────
async function fetchProducts(): Promise<void> {
  productsLoading.classList.remove('hidden');
  productsGrid.classList.add('hidden');
  productsEmpty.classList.add('hidden');

  try {
    const snapshot = await getDocs(collection(db, 'products'));
    products = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
    renderProducts();
  } catch (err) {
    console.error('Failed to fetch products:', err);
    showToast('Gagal memuat produk. Periksa koneksi dan konfigurasi Firebase.', 'error');
  } finally {
    productsLoading.classList.add('hidden');
  }
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function resetModal(): void {
  productForm.reset();
  productIdInput.value = '';
  pendingImageUrl = '';
  pendingImageFilename = '';
  editingProductId = null;
  if (productImageUrl) productImageUrl.value = '';
  hideImagePreview();
  hideModalError();
  uploadProgress.classList.add('hidden');
  uploadProgressFill.style.width = '0%';
}

function showModalError(msg: string): void {
  modalError.textContent = msg;
  modalError.classList.remove('hidden');
}

function hideModalError(): void {
  modalError.classList.add('hidden');
  modalError.textContent = '';
}

function setModalLoading(loading: boolean): void {
  modalSubmit.disabled = loading;
  modalSubmitText.classList.toggle('hidden', loading);
  modalSubmitSpinner.classList.toggle('hidden', !loading);
}

function showImagePreview(src: string): void {
  imagePreview.src = src;
  imageUploadPlaceholder.classList.add('hidden');
  imagePreviewContainer.classList.remove('hidden');
}

function hideImagePreview(): void {
  imagePreview.src = '';
  imageUploadPlaceholder.classList.remove('hidden');
  imagePreviewContainer.classList.add('hidden');
  productImage.value = '';
  if (productImageUrl) productImageUrl.value = '';
}

function openModal(): void {
  productModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => productName.focus(), 50);
}

function closeModal(): void {
  productModal.classList.add('hidden');
  document.body.style.overflow = '';
  resetModal();
}

function openEditModal(id: string): void {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  editingProductId = id;
  modalTitle.textContent = 'Edit Produk';
  productIdInput.value = id;
  productName.value = product.name;
  productDesc.value = product.description;
  productPrice.value = String(product.price);
  productTool.value = product.toolType;
  productVisible.checked = product.visible;
  if (product.imageUrl) {
    pendingImageUrl = product.imageUrl;
    if (productImageUrl) productImageUrl.value = product.imageUrl;
    showImagePreview(product.imageUrl);
  }
  openModal();
}

function openDeleteModal(id: string, name: string): void {
  deleteTargetId = id;
  deleteProductName.textContent = name;
  deleteModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal(): void {
  deleteModal.classList.add('hidden');
  document.body.style.overflow = '';
  deleteTargetId = null;
}

// ─── Image upload to GitHub ───────────────────────────────────────────────────
async function uploadImageToGitHub(file: File): Promise<string> {
  const token = getGitHubToken();
  const owner = getGitHubOwner();
  const repo  = getGitHubRepo();
  if (!token) {
    throw new Error('GitHub Token belum diisi. Masuk ke menu Pengaturan di sidebar untuk memasukkan token, atau isi URL gambar langsung.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        uploadProgress.classList.remove('hidden');
        uploadStatus.textContent = 'Mengunggah ke GitHub...';

        // Animate progress bar
        let progress = 0;
        const interval = setInterval(() => {
          progress = Math.min(progress + 10, 85);
          uploadProgressFill.style.width = `${progress}%`;
        }, 200);

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/products/${filename}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `token ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/vnd.github+json',
            },
            body: JSON.stringify({
              message: `Upload product image: ${filename}`,
              content: base64,
              branch: 'gh-pages',
            }),
          }
        );

        clearInterval(interval);
        uploadProgressFill.style.width = '100%';
        uploadStatus.textContent = 'Upload berhasil!';

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error((errData as { message?: string }).message ?? `GitHub API error: ${response.status}`);
        }

        pendingImageFilename = filename;
        const uploadedUrl = `https://${SITE_DOMAIN}/products/${filename}`;
        if (productImageUrl) productImageUrl.value = uploadedUrl;
        resolve(uploadedUrl);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

// ─── Image file input ─────────────────────────────────────────────────────────
productImage.addEventListener('change', async () => {
  const file = productImage.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showModalError('Ukuran gambar maksimal 5 MB.');
    productImage.value = '';
    return;
  }

  // Show local preview immediately
  const localUrl = URL.createObjectURL(file);
  showImagePreview(localUrl);
  hideModalError();

  // Upload to GitHub
  try {
    pendingImageUrl = await uploadImageToGitHub(file);
  } catch (err) {
    showModalError(`Gagal upload gambar: ${(err as Error).message}`);
    pendingImageUrl = '';
    pendingImageFilename = '';
  }
});

// Drag and drop support
imageUploadArea.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  imageUploadArea.classList.add('drag-over');
});

imageUploadArea.addEventListener('dragleave', () => {
  imageUploadArea.classList.remove('drag-over');
});

imageUploadArea.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  imageUploadArea.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    productImage.files = dataTransfer.files;
    productImage.dispatchEvent(new Event('change'));
  }
});

imageUploadArea.addEventListener('click', (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.image-preview-container')) return;
  productImage.click();
});

removeImageBtn.addEventListener('click', (e: MouseEvent) => {
  e.stopPropagation();
  hideImagePreview();
  pendingImageUrl = '';
  pendingImageFilename = '';
  uploadProgress.classList.add('hidden');
  uploadProgressFill.style.width = '0%';
});

// Direct Image URL listener
productImageUrl?.addEventListener('input', () => {
  const url = productImageUrl.value.trim();
  if (url) {
    showImagePreview(url);
    pendingImageUrl = url;
  }
});

// ─── Add product button ───────────────────────────────────────────────────────
addProductBtn.addEventListener('click', () => {
  editingProductId = null;
  modalTitle.textContent = 'Tambah Produk';
  resetModal();
  productVisible.checked = true;
  openModal();
});

// ─── Modal close ──────────────────────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);

productModal.addEventListener('click', (e: MouseEvent) => {
  if (e.target === productModal) closeModal();
});

// Escape key
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (!productModal.classList.contains('hidden')) closeModal();
    if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
  }
});

// ─── Product form submit ──────────────────────────────────────────────────────
productForm.addEventListener('submit', async (e: Event) => {
  e.preventDefault();
  hideModalError();

  const name  = productName.value.trim();
  const desc  = productDesc.value.trim();
  const price = Number(productPrice.value);
  const tool  = productTool.value as 'cg' | 'kc' | 'ch';
  const visible = productVisible.checked;

  if (productImageUrl && productImageUrl.value.trim()) {
    pendingImageUrl = productImageUrl.value.trim();
  }

  if (!name)         { showModalError('Nama produk wajib diisi.'); return; }
  if (isNaN(price) || price < 0) { showModalError('Harga tidak valid.'); return; }
  if (!tool)         { showModalError('Pilih tool terkait.'); return; }

  setModalLoading(true);

  const productData = {
    name,
    description: desc,
    price,
    imageUrl: pendingImageUrl,
    toolType: tool,
    visible,
    updatedAt: serverTimestamp(),
  };

  try {
    if (editingProductId) {
      await updateDoc(doc(db, 'products', editingProductId), productData);
      showToast('Produk berhasil diperbarui!', 'success');
    } else {
      await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
      });
      showToast('Produk berhasil ditambahkan!', 'success');
    }
    closeModal();
    await fetchProducts();
  } catch (err) {
    console.error('Error saving product:', err);
    showModalError(`Gagal menyimpan: ${(err as Error).message}`);
  } finally {
    setModalLoading(false);
  }
});

// ─── Delete modal ─────────────────────────────────────────────────────────────
deleteCancel.addEventListener('click', closeDeleteModal);

deleteModal.addEventListener('click', (e: MouseEvent) => {
  if (e.target === deleteModal) closeDeleteModal();
});

deleteConfirm.addEventListener('click', async () => {
  if (!deleteTargetId) return;

  deleteConfirm.disabled = true;
  deleteConfirmText.classList.add('hidden');
  deleteConfirmSpinner.classList.remove('hidden');

  try {
    await deleteDoc(doc(db, 'products', deleteTargetId));
    showToast('Produk berhasil dihapus.', 'success');
    closeDeleteModal();
    await fetchProducts();
  } catch (err) {
    console.error('Error deleting product:', err);
    showToast('Gagal menghapus produk. Coba lagi.', 'error');
  } finally {
    deleteConfirm.disabled = false;
    deleteConfirmText.classList.remove('hidden');
    deleteConfirmSpinner.classList.add('hidden');
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
initSettings();
fetchProducts();
