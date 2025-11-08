const API_BASE = 'https://rickandmortyapi.com/api';
let currentPage = 1;
let lastPage = null;
let characters = [];

const container = document.getElementById('cardsContainer');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const loadMoreBtn = document.getElementById('loadMore');
const searchInput = document.getElementById('search');
const statusFilter = document.getElementById('statusFilter');

// =====================
// Fetch de personagens
// =====================
async function fetchCharacters(page = 1, name = '', status = '') {
  const params = new URLSearchParams();
  params.set('page', page);
  if (name) params.set('name', name);
  if (status && status !== 'all') params.set('status', status);

  loadingEl.hidden = false;
  errorEl.hidden = true;

  try {
    const res = await fetch(`${API_BASE}/character?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar personagens');
    const data = await res.json();
    lastPage = data.info?.pages ?? null;
    return data.results || [];
  } catch (err) {
    console.error(err);
    errorEl.hidden = false;
    return null;
  } finally {
    loadingEl.hidden = true;
  }
}

// =====================
// Criação dos cards
// =====================
function createCard(person) {
  const card = document.createElement('article');
  card.className = 'card';
  card.style.cursor = 'pointer'; // 🔹 deixa o cursor de link

  const img = document.createElement('img');
  img.src = person.image;
  img.alt = `${person.name} - ${person.species}`;

  const body = document.createElement('div');
  body.className = 'card-body';

  const h3 = document.createElement('h3');
  h3.textContent = person.name;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${person.species} — ${person.gender}`;

  const status = document.createElement('span');
  status.className =
    'status ' +
    (person.status === 'Alive'
      ? 'alive'
      : person.status === 'Dead'
      ? 'dead'
      : 'unknown');
  status.textContent = person.status;

  body.appendChild(h3);
  body.appendChild(meta);
  body.appendChild(status);

  card.appendChild(img);
  card.appendChild(body);

  // 🔹 Faz o card abrir a página do personagem
  card.addEventListener('click', () => {
    window.location.href = `personagem.html?id=${person.id}`;
  });

  return card;
}


// =====================
// Renderiza os cards
// =====================
function renderCharacters(list, append = true) {
  if (!append) container.innerHTML = '';
  list.forEach((person) => container.appendChild(createCard(person)));
}

// =====================
// Carregamento inicial
// =====================
async function loadInitial() {
  currentPage = 1;
  characters = [];
  const name = searchInput.value.trim();
  const status = statusFilter.value;

  const results = await fetchCharacters(currentPage, name, status);
  if (!results) return;
  characters = results;
  renderCharacters(results, false);
}

// =====================
// Carregar mais
// =====================
async function loadMore() {
  if (lastPage && currentPage >= lastPage) return;
  currentPage++;
  const name = searchInput.value.trim();
  const status = statusFilter.value;
  const results = await fetchCharacters(currentPage, name, status);
  if (!results) return;
  characters = characters.concat(results);
  renderCharacters(results, true);
}

// =====================
// Função debounce
// =====================
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// =====================
// Atualiza contadores do rodapé
// =====================
async function atualizarContadores() {
  const endpoints = [
    { id: 'charCount', url: `${API_BASE}/character` },
    { id: 'locCount', url: `${API_BASE}/location` },
    { id: 'epCount', url: `${API_BASE}/episode` },
  ];

  try {
    for (const { id, url } of endpoints) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro ao buscar ${url}`);
      const data = await res.json();
      document.getElementById(id).textContent = data.info.count.toLocaleString('en-US');
    }

    const statusDot = document.querySelector('.status-dot');
    statusDot.style.background = '#4cff80';
    statusDot.style.boxShadow = '0 0 8px #4cff80';
  } catch (err) {
    console.error('Falha ao atualizar contadores:', err);
    const statusDot = document.querySelector('.status-dot');
    statusDot.style.background = '#ff5c5c';
    statusDot.style.boxShadow = '0 0 8px #ff5c5c';
  }
}

// =====================
// Busca unificada por ID ou Nome
// =====================
async function buscarPersonagens() {
  const id = document.getElementById('idSearch').value.trim();
  const name = searchInput.value.trim();
  const status = statusFilter.value;

  loadingEl.hidden = false;
  errorEl.hidden = true;

  try {
    // Se o usuário digitou um ID, prioriza ele
    if (id) {
      const res = await fetch(`${API_BASE}/character/${id}`);
      if (!res.ok) throw new Error('ID inválido');
      const person = await res.json();
      renderCharacters([person], false);
      return;
    }

    // Caso contrário, busca normalmente pelo nome e status
    const results = await fetchCharacters(1, name, status);
    if (!results) throw new Error('Nenhum resultado encontrado');
    characters = results;
    currentPage = 1;
    renderCharacters(results, false);
  } catch (err) {
    console.error(err);
    errorEl.hidden = false;
  } finally {
    loadingEl.hidden = true;
  }
}

// =====================
// Cabeçalho invisível ao rolar
// =====================
let lastScrollTop = 0;
const header = document.getElementById('topHeader');
window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop > lastScrollTop) {
    header.classList.add('header-hidden');
  } else {
    header.classList.remove('header-hidden');
  }
  lastScrollTop = scrollTop;
});

// =====================
// Total de personagens no topo
// =====================
async function atualizarTotalPersonagens() {
  try {
    const res = await fetch(`${API_BASE}/character`);
    const data = await res.json();
    document.getElementById('totalChars').textContent = data.info.count.toLocaleString('pt-BR');
  } catch {
    document.getElementById('totalChars').textContent = 'Erro';
  }
}

document.addEventListener('DOMContentLoaded', atualizarTotalPersonagens);

// =====================
// Eventos
// =====================
loadMoreBtn.addEventListener('click', loadMore);
searchInput.addEventListener('input', debounce(buscarPersonagens, 500));
document.getElementById('idSearch').addEventListener('input', debounce(buscarPersonagens, 500));
statusFilter.addEventListener('change', buscarPersonagens);

document.addEventListener('DOMContentLoaded', () => {
  loadInitial();
  atualizarContadores();
  atualizarTotalPersonagens();
});

// Expor para depuração
window._rickProject = { fetchCharacters, createCard, renderCharacters };