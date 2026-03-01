import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getDatabase,
  onValue,
  ref
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDNP4xVNG9fWm3ReeQqUZ8dJ1EIxYyr_QI',
  authDomain: 'skin-care-b.firebaseapp.com',
  projectId: 'skin-care-b',
  storageBucket: 'skin-care-b.firebasestorage.app',
  messagingSenderId: '842564436199',
  appId: '1:842564436199:web:69d023b2415d1c71192242',
  measurementId: 'G-01RZP29Z83'
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const productGrid = document.querySelector('#productGrid');
const summary = document.querySelector('#summary');
const searchInput = document.querySelector('#searchInput');
const filterButtons = document.querySelector('#statusFilters');
const template = document.querySelector('#productCardTemplate');

let selectedFilter = 'all';
let allProducts = [];

const fallbackProducts = [
  {
    id: '1',
    name: 'Protetor solar FPS 50',
    brand: 'Vichy',
    category: 'Rosto',
    expiresAt: '2023-08-10',
    openedAt: '2022-06-01',
    favorite: false,
    routine: ['morning'],
    price: 60,
    image:
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '2',
    name: 'Hidratante ginseng',
    brand: 'Boticário',
    category: 'Corpo',
    expiresAt: '2025-12-20',
    openedAt: '2025-01-01',
    favorite: true,
    routine: ['night'],
    price: 0,
    image:
      'https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '3',
    name: 'Demaquilante',
    brand: 'Clinique',
    category: 'Rosto',
    expiresAt: '2025-11-10',
    openedAt: '2024-12-10',
    favorite: true,
    routine: ['morning', 'night'],
    price: null,
    image:
      'https://images.unsplash.com/photo-1607006344380-b6775a0824df?auto=format&fit=crop&w=900&q=80'
  }
];

function normalizeProduct(product, id) {
  return {
    id: product.id ?? id,
    name: product.name ?? 'Produto sem nome',
    brand: product.brand ?? 'Marca não informada',
    category: product.category ?? 'Sem categoria',
    expiresAt: product.expiresAt,
    openedAt: product.openedAt,
    favorite: Boolean(product.favorite),
    routine: Array.isArray(product.routine) ? product.routine : [],
    price: product.price,
    image: product.image ?? ''
  };
}

function dateDiffInDays(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function statusMeta(product) {
  const days = dateDiffInDays(product.expiresAt);
  if (Number.isNaN(days)) {
    return { label: 'Sem validade', type: 'unknown', progress: 0.2 };
  }

  if (days < 0) {
    return {
      label: `Vencido há ${Math.abs(days)} dias`,
      type: 'expired',
      progress: 1
    };
  }

  if (days <= 30) {
    return {
      label: `Vence em ${days} dias`,
      type: 'expiring',
      progress: Math.max(0.25, 1 - days / 30)
    };
  }

  return {
    label: `Válido por mais ${days} dias`,
    type: 'valid',
    progress: 0.15
  };
}

function formatPrice(price) {
  if (price === null || price === undefined) return 'Presente 🎁';
  if (Number(price) === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(price));
}

function renderSummary(products) {
  const expired = products.filter((p) => statusMeta(p).type === 'expired').length;
  const expiring = products.filter((p) => statusMeta(p).type === 'expiring').length;
  const favorites = products.filter((p) => p.favorite).length;

  summary.innerHTML = [
    ['Total', products.length],
    ['Vencidos', expired],
    ['Vencendo (30d)', expiring],
    ['Favoritos', favorites]
  ]
    .map(
      ([label, value]) =>
        `<article class="stat"><p>${label}</p><p class="value">${value}</p></article>`
    )
    .join('');
}

function passesFilter(product) {
  const status = statusMeta(product).type;
  if (selectedFilter === 'all') return true;
  if (selectedFilter === 'expired') return status === 'expired';
  if (selectedFilter === 'expiring') return status === 'expiring';
  if (selectedFilter === 'favorites') return product.favorite;
  if (selectedFilter === 'morning') return product.routine.includes('morning');
  if (selectedFilter === 'night') return product.routine.includes('night');
  return true;
}

function searchMatches(product, query) {
  if (!query) return true;
  const full = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
  return full.includes(query.toLowerCase());
}

function setCardStyles(card, status) {
  const badge = card.querySelector('.badge');
  const bar = card.querySelector('.progress-fill');

  if (status.type === 'expired') {
    badge.style.background = '#fff1f1';
    badge.style.color = 'var(--danger)';
    bar.style.background = 'var(--danger)';
  } else if (status.type === 'expiring') {
    badge.style.background = '#fff8e8';
    badge.style.color = '#a96b00';
    bar.style.background = 'var(--warning)';
  } else {
    badge.style.background = '#ecfff5';
    badge.style.color = '#13795b';
    bar.style.background = 'var(--ok)';
  }
}

function renderProducts() {
  const query = searchInput.value.trim();

  const filtered = allProducts
    .filter((product) => passesFilter(product) && searchMatches(product, query))
    .sort((a, b) => dateDiffInDays(a.expiresAt) - dateDiffInDays(b.expiresAt));

  renderSummary(filtered);

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="empty">Nenhum produto encontrado para esse filtro.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach((product) => {
    const status = statusMeta(product);
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.card');
    const image = clone.querySelector('.card-image');

    image.src =
      product.image ||
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80';
    image.alt = product.name;

    clone.querySelector('.name').textContent = product.name;
    clone.querySelector('.brand-line').textContent = product.brand;
    clone.querySelector('.category').textContent = `• ${product.category}`;
    clone.querySelector('.badge').textContent = status.label;
    clone.querySelector('.progress-fill').style.width = `${Math.round(status.progress * 100)}%`;
    clone.querySelector('.timeslot').textContent = product.routine
      .map((slot) => (slot === 'morning' ? '🌞' : '🌙'))
      .join(' ') || '—';
    clone.querySelector('.price').textContent = formatPrice(product.price);

    setCardStyles(card, status);
    fragment.append(clone);
  });

  productGrid.innerHTML = '';
  productGrid.append(fragment);
}

function setActiveChip(nextFilter) {
  selectedFilter = nextFilter;
  filterButtons.querySelectorAll('.chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === nextFilter);
  });
  renderProducts();
}

function setupFilters() {
  filterButtons.addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;
    setActiveChip(button.dataset.filter);
  });

  searchInput.addEventListener('input', () => renderProducts());
}

function loadProductsFromFirebase() {
  const productsRef = ref(db, 'products');

  onValue(
    productsRef,
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        allProducts = fallbackProducts;
        renderProducts();
        return;
      }

      const rows = Array.isArray(data)
        ? data.filter(Boolean).map((item, index) => normalizeProduct(item, index))
        : Object.entries(data).map(([id, value]) => normalizeProduct(value, id));

      allProducts = rows;
      renderProducts();
    },
    () => {
      allProducts = fallbackProducts;
      productGrid.innerHTML =
        '<p class="error">Não foi possível carregar o Firebase. Exibindo produtos de exemplo.</p>';
      renderProducts();
    }
  );
}

setupFilters();
loadProductsFromFirebase();
