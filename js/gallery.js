/**
 * gallery.js
 * Masonry layout engine, infinite scroll, and Supabase photo fetching.
 *
 * Usage: include this script on street.html and earth.html.
 * The gallery name is read from the data-gallery attribute on <main>.
 *
 * DEMO MODE: When Supabase credentials have not been configured yet
 * (SUPABASE_URL still contains 'YOUR_SUPABASE_URL'), the gallery
 * automatically loads placeholder photos from picsum.photos so you
 * can preview the layout without a backend.
 */

// =============================================
// DEMO PHOTO DATA
// picsum.photos serves reliable placeholder images.
// Width × height controls the aspect ratio displayed.
// col_span: 1 = portrait column, 2 = medium, 3 = full-width
// =============================================

const DEMO_PHOTOS = {
  street: [
    { id: 's1',  storage_url: 'https://picsum.photos/seed/city1/600/900',  caption: 'Morning commute',        col_span: 1 },
    { id: 's2',  storage_url: 'https://picsum.photos/seed/city2/800/530',  caption: 'Lower East Side',        col_span: 2 },
    { id: 's3',  storage_url: 'https://picsum.photos/seed/city3/600/800',  caption: null,                     col_span: 1 },
    { id: 's4',  storage_url: 'https://picsum.photos/seed/city4/1200/500', caption: 'Canal St., midday',      col_span: 3 },
    { id: 's5',  storage_url: 'https://picsum.photos/seed/city5/600/750',  caption: 'Waiting',                col_span: 1 },
    { id: 's6',  storage_url: 'https://picsum.photos/seed/city6/600/900',  caption: null,                     col_span: 1 },
    { id: 's7',  storage_url: 'https://picsum.photos/seed/city7/800/600',  caption: 'Rain, Chinatown',        col_span: 2 },
    { id: 's8',  storage_url: 'https://picsum.photos/seed/city8/600/700',  caption: null,                     col_span: 1 },
    { id: 's9',  storage_url: 'https://picsum.photos/seed/city9/600/850',  caption: 'The vendor',             col_span: 1 },
    { id: 's10', storage_url: 'https://picsum.photos/seed/city10/800/550', caption: 'Crosswalk, dusk',        col_span: 2 },
    { id: 's11', storage_url: 'https://picsum.photos/seed/city11/600/800', caption: null,                     col_span: 1 },
    { id: 's12', storage_url: 'https://picsum.photos/seed/city12/600/920', caption: 'Window light',           col_span: 1 },
    { id: 's13', storage_url: 'https://picsum.photos/seed/city13/1200/480',caption: 'Brooklyn Bridge',        col_span: 3 },
    { id: 's14', storage_url: 'https://picsum.photos/seed/city14/600/760', caption: null,                     col_span: 1 },
    { id: 's15', storage_url: 'https://picsum.photos/seed/city15/600/840', caption: 'Rush hour',              col_span: 1 },
    { id: 's16', storage_url: 'https://picsum.photos/seed/city16/800/580', caption: 'Reflection',             col_span: 2 },
  ],
  earth: [
    { id: 'e1',  storage_url: 'https://picsum.photos/seed/land1/600/900',  caption: 'Dolomites, October',    col_span: 1 },
    { id: 'e2',  storage_url: 'https://picsum.photos/seed/land2/1200/520', caption: 'Patagonia horizon',     col_span: 3 },
    { id: 'e3',  storage_url: 'https://picsum.photos/seed/land3/600/800',  caption: null,                    col_span: 1 },
    { id: 'e4',  storage_url: 'https://picsum.photos/seed/land4/800/600',  caption: 'Faroe Islands',         col_span: 2 },
    { id: 'e5',  storage_url: 'https://picsum.photos/seed/land5/600/860',  caption: 'Forest floor',          col_span: 1 },
    { id: 'e6',  storage_url: 'https://picsum.photos/seed/land6/600/920',  caption: null,                    col_span: 1 },
    { id: 'e7',  storage_url: 'https://picsum.photos/seed/land7/800/540',  caption: 'Iceland, winter',       col_span: 2 },
    { id: 'e8',  storage_url: 'https://picsum.photos/seed/land8/600/780',  caption: 'Coastal fog',           col_span: 1 },
    { id: 'e9',  storage_url: 'https://picsum.photos/seed/land9/600/830',  caption: null,                    col_span: 1 },
    { id: 'e10', storage_url: 'https://picsum.photos/seed/land10/1200/460',caption: 'Atacama Desert',        col_span: 3 },
    { id: 'e11', storage_url: 'https://picsum.photos/seed/land11/600/900', caption: 'Birch grove',           col_span: 1 },
    { id: 'e12', storage_url: 'https://picsum.photos/seed/land12/800/560', caption: 'Lofoten at midnight',   col_span: 2 },
    { id: 'e13', storage_url: 'https://picsum.photos/seed/land13/600/820', caption: null,                    col_span: 1 },
    { id: 'e14', storage_url: 'https://picsum.photos/seed/land14/600/750', caption: 'Mud flats, low tide',   col_span: 1 },
    { id: 'e15', storage_url: 'https://picsum.photos/seed/land15/800/500', caption: 'Scottish Highlands',    col_span: 2 },
    { id: 'e16', storage_url: 'https://picsum.photos/seed/land16/600/880', caption: null,                    col_span: 1 },
  ]
};

(function () {
  const PAGE_SIZE = 20;
  let offset = 0;
  let isLoading = false;
  let allLoaded = false;
  let allItems = [];

  const container = document.getElementById('masonry');
  const sentinel = document.getElementById('scroll-sentinel');
  const loadingEl = document.getElementById('loading-indicator');
  const allLoadedEl = document.getElementById('all-loaded-msg');
  const emptyEl = document.querySelector('.gallery-empty');
  const galleryName = document.querySelector('main[data-gallery]')
    ? document.querySelector('main[data-gallery]').dataset.gallery
    : null;

  if (!container || !galleryName) return;

  // =============================================
  // COLUMN COUNT
  // =============================================

  function getColCount() {
    const w = window.innerWidth;
    if (w >= 900) return 3;
    if (w >= 600) return 2;
    return 1;
  }

  // =============================================
  // MASONRY LAYOUT ENGINE
  // =============================================

  function layoutMasonry() {
    if (allItems.length === 0) return;

    const COLS = getColCount();
    const GAP = 16;
    const totalWidth = container.offsetWidth;
    const colWidth = (totalWidth - (COLS - 1) * GAP) / COLS;
    const colHeights = new Array(COLS).fill(0);

    allItems.forEach(item => {
      const rawSpan = parseInt(item.dataset.colSpan, 10) || 1;
      const span = Math.min(rawSpan, COLS);

      // Find the starting column that minimizes the max fill height across the span
      let bestCol = 0;
      let bestMax = Infinity;
      for (let c = 0; c <= COLS - span; c++) {
        const maxH = Math.max(...colHeights.slice(c, c + span));
        if (maxH < bestMax) {
          bestMax = maxH;
          bestCol = c;
        }
      }

      const itemWidth = colWidth * span + GAP * (span - 1);
      const itemTop = bestMax;
      const itemLeft = bestCol * (colWidth + GAP);

      item.style.width = itemWidth + 'px';
      item.style.top = itemTop + 'px';
      item.style.left = itemLeft + 'px';

      const newHeight = itemTop + item.offsetHeight + GAP;
      for (let c = bestCol; c < bestCol + span; c++) {
        colHeights[c] = newHeight;
      }
    });

    const maxHeight = Math.max(...colHeights);
    container.style.height = maxHeight + 'px';
  }

  // =============================================
  // IMAGE LOAD COORDINATION
  // =============================================

  /**
   * Waits for all images in `items` to load or error,
   * then calls `callback`. Items are made visible after layout.
   */
  function waitForImagesAndLayout(items, callback) {
    const imgs = items.map(el => el.querySelector('img')).filter(Boolean);
    if (imgs.length === 0) {
      layoutMasonry();
      items.forEach(el => el.classList.add('laid-out'));
      callback && callback();
      return;
    }

    let loaded = 0;
    function onLoad() {
      loaded++;
      if (loaded === imgs.length) {
        layoutMasonry();
        items.forEach(el => el.classList.add('laid-out'));
        callback && callback();
      }
    }

    imgs.forEach(img => {
      if (img.complete) {
        onLoad();
      } else {
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onLoad, { once: true });
      }
    });
  }

  // =============================================
  // RENDER PHOTO ITEMS
  // =============================================

  function renderItems(photos) {
    return photos.map(photo => {
      const fig = document.createElement('figure');
      fig.className = 'photo-item';
      fig.dataset.id = photo.id;
      fig.dataset.colSpan = photo.col_span || 1;

      const img = document.createElement('img');
      img.src = photo.storage_url;
      img.alt = photo.caption || '';
      img.loading = 'lazy';

      fig.appendChild(img);

      if (photo.caption) {
        const cap = document.createElement('figcaption');
        cap.textContent = photo.caption;
        fig.appendChild(cap);
      }

      return fig;
    });
  }

  // =============================================
  // DEMO MODE DETECTION
  // =============================================

  function isDemoMode() {
    return typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR_SUPABASE_URL');
  }

  // =============================================
  // FETCH & LOAD
  // =============================================

  async function loadNextPage() {
    if (isLoading || allLoaded) return;
    isLoading = true;

    if (loadingEl) loadingEl.classList.add('visible');

    let data, error;

    if (isDemoMode()) {
      // Demo mode: hardcoded placeholder photos + any locally uploaded ones
      const uploaded = (window.DemoStore ? window.DemoStore.getPhotos(galleryName) : []);
      const all = [...(DEMO_PHOTOS[galleryName] || []), ...uploaded];
      data = all.slice(offset, offset + PAGE_SIZE);
      error = null;
      await new Promise(r => setTimeout(r, 80));
    } else {
      const result = await window.SupabaseClient
        .from('photos')
        .select('id, storage_url, caption, col_span, sort_order')
        .eq('gallery', galleryName)
        .order('sort_order', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      data = result.data;
      error = result.error;
    }

    if (loadingEl) loadingEl.classList.remove('visible');

    if (error) {
      console.error('Gallery fetch error:', error);
      isLoading = false;
      return;
    }

    if (offset === 0 && data.length === 0) {
      if (emptyEl) emptyEl.classList.add('visible');
      allLoaded = true;
      isLoading = false;
      return;
    }

    if (data.length < PAGE_SIZE) {
      allLoaded = true;
      if (allLoadedEl && offset + data.length > 0) {
        allLoadedEl.classList.add('visible');
      }
    }

    offset += data.length;

    const newItems = renderItems(data);
    newItems.forEach(item => container.insertBefore(item, sentinel));
    allItems = allItems.concat(newItems);

    waitForImagesAndLayout(newItems, () => {
      isLoading = false;
    });
  }

  // =============================================
  // INFINITE SCROLL (Intersection Observer)
  // =============================================

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadNextPage();
      }
    },
    { rootMargin: '200px' }
  );

  if (sentinel) observer.observe(sentinel);

  // =============================================
  // RESIZE HANDLER (debounced)
  // =============================================

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layoutMasonry();
    }, 150);
  });

  // =============================================
  // INIT
  // =============================================

  document.addEventListener('DOMContentLoaded', () => {
    loadNextPage();
  });

})();
