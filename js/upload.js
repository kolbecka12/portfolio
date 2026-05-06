/**
 * upload.js
 * Admin upload flow and photo management table.
 * Depends on: window.SupabaseClient (supabase-client.js), auth.js
 *
 * DEMO MODE: when SUPABASE_URL is still a placeholder, uploads are stored
 * in localStorage via window.DemoStore and previewed with object URLs.
 */

(function () {
  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function isDemoMode() {
    return typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR_SUPABASE_URL');
  }

  // =============================================
  // DOM REFS
  // =============================================

  const loginSection = document.getElementById('login-section');
  const uploadSection = document.getElementById('upload-section');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const uploadForm = document.getElementById('upload-form');
  const uploadBtn = document.getElementById('upload-btn');
  const uploadMsg = document.getElementById('upload-msg');
  const progressWrap = document.getElementById('progress-wrap');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const photosTableBody = document.getElementById('photos-table-body');
  const filterBtns = document.querySelectorAll('.gallery-filter button[data-filter]');

  let currentFilter = 'street';

  // =============================================
  // SESSION CHECK — show login or upload panel
  // =============================================

  async function initAdminPage() {
    const { data: { session } } = await window.SupabaseClient.auth.getSession();

    if (session) {
      showUploadPanel();
    } else {
      showLoginPanel();
    }
  }

  function showLoginPanel() {
    if (loginSection) loginSection.classList.remove('hidden');
    if (uploadSection) uploadSection.classList.add('hidden');
  }

  function showUploadPanel() {
    if (loginSection) loginSection.classList.add('hidden');
    if (uploadSection) uploadSection.classList.remove('hidden');
    loadPhotosTable(currentFilter);
  }

  // =============================================
  // LOGIN FORM
  // =============================================

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = loginForm.querySelector('button[type="submit"]');

      if (loginError) {
        loginError.classList.remove('visible');
        loginError.textContent = '';
      }

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      const result = await login(email, password);

      if (result && result.error) {
        if (loginError) {
          loginError.textContent = result.error;
          loginError.classList.add('visible');
        }
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
      // on success, login() redirects automatically
    });
  }

  // =============================================
  // LOGOUT
  // =============================================

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // =============================================
  // UPLOAD FORM
  // =============================================

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleUpload();
    });
  }

  async function handleUpload() {
    const fileInput = document.getElementById('upload-file');
    const captionInput = document.getElementById('upload-caption');
    const galleryInput = document.getElementById('upload-gallery');
    const colSpanInput = document.querySelector('input[name="col_span"]:checked');
    const sortOrderInput = document.getElementById('upload-sort');

    if (!fileInput || !fileInput.files[0]) {
      showMsg(uploadMsg, 'Please select an image file.', 'error');
      return;
    }

    const file = fileInput.files[0];

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showMsg(uploadMsg, 'Only JPEG, PNG, and WebP images are allowed.', 'error');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showMsg(uploadMsg, `File must be under ${MAX_FILE_SIZE_MB}MB.`, 'error');
      return;
    }

    const gallery = galleryInput ? galleryInput.value : 'street';
    const caption = captionInput ? captionInput.value.trim() : '';
    const colSpan = colSpanInput ? parseInt(colSpanInput.value, 10) : 1;
    const sortOrder = sortOrderInput ? parseInt(sortOrderInput.value, 10) || 0 : 0;

    if (uploadBtn) uploadBtn.disabled = true;
    if (progressWrap) progressWrap.classList.add('visible');
    if (uploadMsg) uploadMsg.classList.remove('visible');

    // ── DEMO MODE ──────────────────────────────────────────────
    if (isDemoMode()) {
      setProgress(40, 'Processing image…');
      await new Promise(r => setTimeout(r, 300));
      setProgress(80, 'Saving…');
      await new Promise(r => setTimeout(r, 200));

      const objectUrl = URL.createObjectURL(file);
      const photo = {
        id: 'demo-' + Date.now(),
        gallery,
        storage_url: objectUrl,
        caption: caption || null,
        col_span: colSpan,
        sort_order: sortOrder,
        created_at: new Date().toISOString(),
        _demo: true
      };
      window.DemoStore.addPhoto(photo);

      setProgress(100, 'Done!');
      setTimeout(() => {
        showMsg(uploadMsg, 'Photo added (demo mode — stored locally in this browser tab).', 'success');
        uploadForm.reset();
        resetUploadState();
        loadPhotosTable(currentFilter);
      }, 400);
      return;
    }

    // ── SUPABASE MODE ───────────────────────────────────────────
    const ext = file.name.split('.').pop().toLowerCase();
    const safeName = file.name
      .replace(/[^a-z0-9._-]/gi, '-')
      .toLowerCase()
      .replace(/\.[^.]+$/, '');
    const path = `${gallery}/${Date.now()}-${safeName}.${ext}`;

    setProgress(20, 'Uploading image…');

    const { error: storageError } = await window.SupabaseClient.storage
      .from('photos')
      .upload(path, file, { contentType: file.type });

    if (storageError) {
      showMsg(uploadMsg, 'Upload failed: ' + storageError.message, 'error');
      resetUploadState();
      return;
    }

    setProgress(60, 'Saving photo details…');

    const { data: urlData } = window.SupabaseClient.storage
      .from('photos')
      .getPublicUrl(path);

    const { error: dbError } = await window.SupabaseClient
      .from('photos')
      .insert({
        gallery,
        storage_url: urlData.publicUrl,
        caption: caption || null,
        col_span: colSpan,
        sort_order: sortOrder
      });

    if (dbError) {
      await window.SupabaseClient.storage.from('photos').remove([path]);
      showMsg(uploadMsg, 'Database error: ' + dbError.message, 'error');
      resetUploadState();
      return;
    }

    setProgress(100, 'Done!');
    setTimeout(() => {
      showMsg(uploadMsg, 'Photo uploaded successfully.', 'success');
      uploadForm.reset();
      resetUploadState();
      loadPhotosTable(currentFilter);
    }, 400);
  }

  function setProgress(pct, label) {
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = label;
  }

  function resetUploadState() {
    if (uploadBtn) uploadBtn.disabled = false;
    if (progressWrap) {
      setTimeout(() => {
        progressWrap.classList.remove('visible');
        setProgress(0, '');
      }, 600);
    }
  }

  // =============================================
  // PHOTOS TABLE
  // =============================================

  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        loadPhotosTable(currentFilter);
      });
    });
  }

  async function loadPhotosTable(gallery) {
    if (!photosTableBody) return;

    photosTableBody.innerHTML = '<tr><td colspan="5" class="photos-table-empty">Loading…</td></tr>';

    let data, error;

    if (isDemoMode()) {
      data = window.DemoStore.getPhotos(gallery);
      error = null;
    } else {
      const result = await window.SupabaseClient
        .from('photos')
        .select('*')
        .eq('gallery', gallery)
        .order('sort_order', { ascending: true });
      data = result.data;
      error = result.error;
    }

    if (error) {
      photosTableBody.innerHTML = `<tr><td colspan="5" class="photos-table-empty">Error loading photos.</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      photosTableBody.innerHTML = `<tr><td colspan="5" class="photos-table-empty">No photos yet in "${gallery}".</td></tr>`;
      return;
    }

    photosTableBody.innerHTML = '';
    data.forEach(photo => {
      const tr = document.createElement('tr');
      tr.dataset.id = photo.id;
      tr.innerHTML = `
        <td><img class="table-thumb" src="${escapeHtml(photo.storage_url)}" alt=""></td>
        <td class="table-caption">${escapeHtml(photo.caption || '—')}</td>
        <td class="table-gallery">${escapeHtml(photo.gallery)}</td>
        <td class="table-span">${photo.col_span}</td>
        <td class="table-actions">
          <button class="btn btn-danger" data-action="delete" data-id="${photo.id}" data-path="${getStoragePath(photo.storage_url)}">Delete</button>
        </td>
      `;
      photosTableBody.appendChild(tr);
    });

    // Delete handlers
    photosTableBody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this photo? This cannot be undone.')) return;
        await deletePhoto(btn.dataset.id, btn.dataset.path);
        loadPhotosTable(currentFilter);
      });
    });
  }

  async function deletePhoto(id, storagePath) {
    if (isDemoMode()) {
      window.DemoStore.deletePhoto(id);
      return;
    }

    const { error: dbError } = await window.SupabaseClient
      .from('photos')
      .delete()
      .eq('id', id);

    if (dbError) {
      alert('Failed to delete photo record: ' + dbError.message);
      return;
    }

    if (storagePath) {
      await window.SupabaseClient.storage.from('photos').remove([storagePath]);
    }
  }

  /**
   * Extracts the storage path (after /photos/) from a full public URL.
   */
  function getStoragePath(url) {
    if (!url) return '';
    const marker = '/photos/';
    const idx = url.indexOf(marker);
    return idx !== -1 ? url.slice(idx + marker.length) : '';
  }

  // =============================================
  // HELPERS
  // =============================================

  function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = 'msg visible msg-' + type;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =============================================
  // INIT
  // =============================================

  document.addEventListener('DOMContentLoaded', initAdminPage);

})();
