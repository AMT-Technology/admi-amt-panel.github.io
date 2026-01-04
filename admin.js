// =======================================================
// PROTECCIÓN DE ACCESO
// =======================================================
auth.onAuthStateChanged(user => {
  if (!user) location.href = "index.html";
});

window.logout = function () {
  auth.signOut().then(() => {
    location.href = "index.html";
  });
};



// =======================================================
// VARIABLES GLOBALES
// =======================================================
let editId = null;
let prevSize = null;

const appsList = document.getElementById("appsList");
const appsListWrap = document.getElementById("appsListWrap");
const loadingMoreEl = document.getElementById("loadingMore");
const noMoreEl = document.getElementById("noMore");
const searchInput = document.getElementById("searchInput");

// Paging
const PAGE_SIZE = 10;
let lastVisible = null;
let loading = false;
let exhausted = false;
let inSearchMode = false;

// Cache local (items cargados)
let loadedAppsCache = [];

// =======================================================
// GENERAR PÁGINA HTML PARA LA APP
// =======================================================
async function generarPaginaApp(appData) {
  try {
    // 1. Obtener el template base
    let htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${appData.nombre} — Appser Store | Descarga ${appData.nombre} para Android</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  
  <!-- 🔍 SEO -->
  <meta name="description" content="Descarga ${appData.nombre} para Android desde Appser Store. ${appData.descripcion?.substring(0, 150) || ''}">
  <meta name="keywords" content="${appData.nombre}, ${appData.categoria}, Android, APK, descargar">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${appData.nombre} — Appser Store">
  <meta property="og:description" content="${appData.descripcion?.substring(0, 200) || ''}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://appsem.rap-infinite.online/app-${appData.id}.html">
  <meta property="og:image" content="${appData.imagen || 'https://appsem.rap-infinite.online/logo.webp'}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${appData.nombre}">
  <meta name="twitter:description" content="${appData.descripcion?.substring(0, 200) || ''}">
  <meta name="twitter:image" content="${appData.imagen || 'https://appsem.rap-infinite.online/logo.webp'}">
  
  <!-- Schema JSON-LD -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "${appData.nombre}",
      "applicationCategory": "${appData.categoria}",
      "operatingSystem": "Android",
      "description": "${appData.descripcion?.replace(/"/g, '\\"') || ''}",
      "image": "${appData.imagen || ''}",
      "softwareVersion": "${appData.version || ''}",
      "datePublished": "${new Date().toISOString()}",
      "author": {"@type": "Organization", "name": "Appser Store"},
      "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "${appData.ratingAvg || 0}",
        "ratingCount": "${appData.ratingCount || 0}"
      }
    }
  </script>
  
  <!-- Estilos -->
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="app-page.css">
  
  <!-- Icono -->
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <!-- HEADER -->
  <header class="store-header">
    <div class="brand">
      <img src="logo.webp" alt="Appser" class="brand-logo" onclick="window.location.href='index.html'">
      <div>
        <h1>Appser Store</h1>
        <p class="brand-tagline">Apps para todos</p>
      </div>
    </div>
    
    <div class="header-right">
      <button class="btn-back" onclick="window.location.href='index.html'">← Volver al inicio</button>
    </div>
  </header>

  <!-- CONTENIDO DE LA APP -->
  <main class="app-detail-page">
    <div class="app-detail-container">
      <div class="overlay-header">
        <img id="detailIcon" class="overlay-icon" src="${appData.imagen}" alt="${appData.nombre}" loading="lazy">
        <div>
          <h1 id="detailName">${appData.nombre}</h1>
          <p id="detailCategory">${appData.categoria}</p>
          <p id="detailSize">📦 Tamaño: ${appData.size || '—'}</p>
          <p id="detailInternet">${appData.internet === 'offline' ? '📴 Funciona sin Internet' : '🌐 Requiere Internet'}</p>
        </div>
      </div>

      <div class="install-share-row">
        <button id="installBtn" class="install-btn" onclick="descargarAPK()">
          <img src="assets/icons/descargar.png" alt="Descarga Directa">
        </button>
        
        ${appData.playstoreUrl ? `<button class="playstore-btn" onclick="window.open('${appData.playstoreUrl}', '_blank')">
          <img src="assets/icons/playstore.png" alt="Play Store">
        </button>` : ''}
        
        ${appData.uptodownUrl ? `<button class="uptodown-btn" onclick="window.open('${appData.uptodownUrl}', '_blank')">
          <img src="assets/icons/uptodown.png" alt="Uptodown">
        </button>` : ''}
        
        ${appData.megaUrl ? `<button class="mega-btn" onclick="window.open('${appData.megaUrl}', '_blank')">
          <img src="assets/icons/mega.png" alt="Mega">
        </button>` : ''}
        
        ${appData.mediafireUrl ? `<button class="mediafire-btn" onclick="window.open('${appData.mediafireUrl}', '_blank')">
          <img src="assets/icons/mediafire.png" alt="Mediafire">
        </button>` : ''}
        
        <button id="shareBtn" class="share-btn" onclick="compartirApp()">
          <img src="assets/icons/compartir.png" alt="Compartir">
        </button>
      </div>

      <p id="detailStats" class="detail-stats">
        Descargas: ${(appData.descargasReales || 0).toLocaleString("es-ES")} • 
        Likes: ${(appData.likes || 0).toLocaleString("es-ES")}
      </p>

      <!-- Rating estático -->
      <div class="rating-block">
        <p id="ratingLabel" class="rating-label">
          Valoración: ${(appData.ratingAvg || 0).toFixed(1)} (${appData.ratingCount || 0} votos)
        </p>
        <div id="starsRow" class="stars-row">
          ${renderStarsStatic(appData.ratingAvg || 0)}
        </div>
        <button id="likeBtn" class="like-btn" onclick="darLike()">❤️ Me gusta</button>
      </div>

      <!-- Información de la App -->
      <h2>Información de la app</h2>
      <div class="info-grid">
        <div class="info-box">
          <span class="info-icon">🌐</span>
          <div>
            <p class="info-title">Idioma</p>
            <p class="info-value">${appData.idioma || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🔢</span>
          <div>
            <p class="info-title">Versión</p>
            <p class="info-value">${appData.version || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🏷️</span>
          <div>
            <p class="info-title">Licencia</p>
            <p class="info-value">${appData.tipo || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">📱</span>
          <div>
            <p class="info-title">Sistema operativo</p>
            <p class="info-value">${appData.sistemaOperativo || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">⚙️</span>
          <div>
            <p class="info-title">Requisitos del sistema</p>
            <p class="info-value">${appData.requisitos || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">📅</span>
          <div>
            <p class="info-title">Actualización</p>
            <p class="info-value">${appData.fechaActualizacion ? new Date(appData.fechaActualizacion).toLocaleDateString('es-ES') : '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🔞</span>
          <div>
            <p class="info-title">Edad recomendada</p>
            <p class="info-value">${appData.edad || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">📢</span>
          <div>
            <p class="info-title">Anuncios</p>
            <p class="info-value">${appData.anuncios === 'si' ? 'Sí' : appData.anuncios === 'no' ? 'No' : '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🔗</span>
          <div>
            <p class="info-title">Política de privacidad</p>
            <p class="info-value">
              ${appData.privacidadUrl ? `<a href="${appData.privacidadUrl}" target="_blank">Ver política</a>` : 'No disponible'}
            </p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">📦</span>
          <div>
            <p class="info-title">Tamaño del APK</p>
            <p class="info-value">${appData.size || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🆔</span>
          <div>
            <p class="info-title">Package Name</p>
            <p class="info-value">${appData.packageName || '—'}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">⬇️</span>
          <div>
            <p class="info-title">Descargas</p>
            <p class="info-value">${(appData.descargasReales || 0).toLocaleString('es-ES')}</p>
          </div>
        </div>
      </div>

      <h2>Descripción</h2>
      <p id="detailDesc" class="detail-desc">${appData.descripcion || ''}</p>

      ${appData.imgSecundarias && appData.imgSecundarias.length > 0 ? `
      <h2>Capturas de pantalla</h2>
      <div class="screenshots-row">
        ${appData.imgSecundarias.map(img => `<img src="${img}" alt="Captura" loading="lazy">`).join('')}
      </div>
      ` : ''}

      <h2>Comentarios y reseñas</h2>
      <div id="reviewsList" class="reviews-list">
        <p>Para ver y dejar reseñas, visita la versión dinámica de esta página.</p>
        <a href="app-dynamic.html?id=${appData.id}" class="btn-primary">Ver página con reseñas</a>
      </div>
    </div>
  </main>

  <footer class="store-footer">
    <div>
      © ${new Date().getFullYear()} Appser Store — Apps para todos ·
      <a href="/privacidad.html">Privacidad</a> ·
      <a href="/terminos.html">Términos</a>
    </div>
  </footer>

  <script>
    // Funciones básicas
    function renderStarsStatic(rating) {
      const full = Math.floor(rating);
      const half = rating % 1 >= 0.5 ? 1 : 0;
      let stars = '';
      for (let i = 0; i < full; i++) stars += '★';
      if (half) stars += '⯨';
      for (let i = 0; i < 5 - full - half; i++) stars += '☆';
      return stars;
    }
    
    function descargarAPK() {
      window.open('${appData.apk}', '_blank');
    }
    
    function compartirApp() {
      const url = window.location.href;
      const title = '${appData.nombre} — Appser Store';
      const text = 'Mira esta app en Appser Store: ${appData.nombre}';
      
      if (navigator.share) {
        navigator.share({ title, text, url });
      } else {
        navigator.clipboard.writeText(url);
        alert('¡Enlace copiado al portapapeles!');
      }
    }
    
    function darLike() {
      alert('Para dar like, visita la versión dinámica con Firebase.');
    }
  </script>
</body>
</html>`;

    // 2. Crear el archivo HTML
    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    
    // 3. Subir a Firebase Storage
    const storageRef = firebase.storage().ref();
    const pageRef = storageRef.child(`pages/app-${appData.id}.html`);
    
    await pageRef.put(blob);
    
    // 4. Obtener la URL pública
    const downloadURL = await pageRef.getDownloadURL();
    
    // 5. Guardar la URL en Firestore
    await db.collection("apps").doc(appData.id).update({
      pageUrl: downloadURL,
      pagePath: `pages/app-${appData.id}.html`
    });
    
    console.log(`✅ Página generada: app-${appData.id}.html`);
    return downloadURL;
    
  } catch (error) {
    console.error("❌ Error generando página:", error);
    throw error;
  }
}

function renderStarsStatic(rating) {
  const full = Math.floor(rating || 0);
  const half = (rating || 0) % 1 >= 0.5 ? 1 : 0;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '★';
  if (half) stars += '⯨';
  for (let i = 0; i < 5 - full - half; i++) stars += '☆';
  return stars;
}

// =======================================================
// CARGA INICIAL
// =======================================================
function resetPagination() {
  lastVisible = null;
  exhausted = false;
  loadedAppsCache = [];
  appsList.innerHTML = "";
}

function loadInitialApps() {
  resetPagination();
  inSearchMode = false;
  loadMoreApps();
}

function loadMoreApps() {
  if (loading || exhausted || inSearchMode) return;
  loading = true;
  loadingMoreEl.classList.remove("hidden");

  let query = db.collection("apps").orderBy("fecha", "desc").limit(PAGE_SIZE);

  if (lastVisible) {
    query = db.collection("apps").orderBy("fecha", "desc").startAfter(lastVisible).limit(PAGE_SIZE);
  }

  query.get()
    .then(snap => {
      if (snap.empty) {
        exhausted = true;
        noMoreEl.classList.remove("hidden");
        loadingMoreEl.classList.add("hidden");
        loading = false;
        return;
      }

      const docs = snap.docs;
      lastVisible = docs[docs.length - 1];
      const items = docs.map(d => d.data());
      loadedAppsCache = loadedAppsCache.concat(items);
      renderApps(items, true);

      if (items.length < PAGE_SIZE) {
        exhausted = true;
        noMoreEl.classList.remove("hidden");
      }

      loadingMoreEl.classList.add("hidden");
      loading = false;
    })
    .catch(err => {
      console.error("Error cargando apps:", err);
      loadingMoreEl.classList.add("hidden");
      loading = false;
    });
}

// =======================================================
// RENDERIZADO DE FILAS
// =======================================================
function renderApps(items, append = false) {
  let html = items.map(a => {
    return `
      <tr id="app-row-${a.id}">
        <td><img src="${a.icono || a.imagen || ''}" class="table-icon" alt="icono"></td>
        <td>${escapeHtml(a.nombre || '')}</td>
        <td>${escapeHtml(a.categoria || '')}</td>
        <td>${escapeHtml(a.version || '')}</td>
        <td>
          <button class="btn-edit" onclick="cargarParaEditar('${a.id}')">✏️ Editar</button>
          <button class="btn-view" onclick="window.open('app-dynamic.html?id=${a.id}', '_blank')">👁️ Ver</button>
          <button class="btn-delete" onclick="eliminarApp('${a.id}')">🗑 Eliminar</button>
        </td>
      </tr>
    `;
  }).join("");

  if (append) {
    appsList.insertAdjacentHTML('beforeend', html);
  } else {
    appsList.innerHTML = html;
  }
}

function escapeHtml(str) {
  return (str + '').replace(/[&<>"'`=\/]/g, function(s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s];
  });
}

// =======================================================
// BÚSQUEDA POR NOMBRE
// =======================================================
let searchTimer = null;
searchInput.addEventListener('input', e => {
  const term = e.target.value.trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (!term) {
      inSearchMode = false;
      noMoreEl.classList.add("hidden");
      loadInitialApps();
      return;
    }
    performSearch(term);
  }, 350);
});

function performSearch(term) {
  inSearchMode = true;
  loadingMoreEl.classList.remove("hidden");
  noMoreEl.classList.add("hidden");
  appsList.innerHTML = "";

  const start = term;
  const end = term + '\uf8ff';

  db.collection("apps").orderBy("nombre").startAt(start).endAt(end).limit(100).get()
    .then(snap => {
      if (snap.empty) {
        appsList.innerHTML = '<tr><td colspan="5" style="padding:12px;color:#94a3b8">No se encontraron aplicaciones</td></tr>';
        loadingMoreEl.classList.add("hidden");
        return;
      }
      const items = snap.docs.map(d => d.data());
      items.sort((a,b) => (b.fecha || 0) - (a.fecha || 0));
      renderApps(items, false);
      loadingMoreEl.classList.add("hidden");
    })
    .catch(err => {
      console.error("Error en búsqueda:", err);
      loadingMoreEl.classList.add("hidden");
    });
}

// =======================================================
// SCROLL INFINITO
// =======================================================
appsListWrap.addEventListener('scroll', () => {
  if (inSearchMode) return;
  const { scrollTop, scrollHeight, clientHeight } = appsListWrap;
  if (scrollTop + clientHeight >= scrollHeight - 160) {
    loadMoreApps();
  }
});

// =======================================================
// CARGAR APP PARA EDITAR
// =======================================================
function cargarParaEditar(id) {
  editId = id;
  document.getElementById("formTitle").textContent = "✏️ Editar Aplicación";
  document.getElementById("subirBtn").textContent = "GUARDAR";
  document.getElementById("cancelarBtn").classList.remove("hidden");

  db.collection("apps").doc(id).get().then(doc => {
    const a = doc.data();

    document.getElementById("nombre").value = a.nombre || '';
    document.getElementById("descripcion").value = a.descripcion || '';
    document.getElementById("version").value = a.version || '';
    document.getElementById("categoria").value = a.categoria || '';
    document.getElementById("idioma").value = a.idioma || '';
    document.getElementById("tipo").value = a.tipo || '';
    document.getElementById("internet").value = a.internet || 'offline';

    document.getElementById("sistema").value = a.sistemaOperativo || "";
    document.getElementById("requisitos").value = a.requisitos || "";
    document.getElementById("fechaAct").value = a.fechaActualizacion || "";
    document.getElementById("edad").value = a.edad || "";
    document.getElementById("anuncios").value = a.anuncios || "no";
    document.getElementById("privacidad").value = a.privacidadUrl || "";

    document.getElementById("imagenUrl").value = a.imagen || "";
    document.getElementById("capturasUrl").value = a.imgSecundarias ? a.imgSecundarias.join(",") : "";
    document.getElementById("iconoUrl").value = a.icono || "";
    document.getElementById("apkUrl").value = a.apk || "";

    document.getElementById("packageName").value = a.packageName || "";

    
    document.getElementById("size").value = a.size || "";
    prevSize = a.size || null;

    // NUEVOS CAMPOS DE ENLACES
    document.getElementById("playstoreUrl").value = a.playstoreUrl || "";
    document.getElementById("uptodownUrl").value = a.uptodownUrl || "";
    document.getElementById("megaUrl").value = a.megaUrl || "";
    document.getElementById("mediafireUrl").value = a.mediafireUrl || "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// =======================================================
// CARGAR FORMULARIO DE NUEVA APP
// =======================================================
function cargarFormularioNuevo() {
  limpiarFormulario();
  document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
  document.getElementById("subirBtn").textContent = "SUBIR APP";
  document.getElementById("cancelarBtn").classList.add("hidden");

  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      document.getElementById("cancelarBtn").classList.remove("hidden");
    });
  });
}

// =======================================================
// GUARDAR / EDITAR APP (CON GENERACIÓN DE PÁGINA)
// =======================================================
async function guardarApp() {
  const btn = document.getElementById("subirBtn");
  const estado = document.getElementById("estado");

  btn.disabled = true;
  estado.textContent = "Guardando...";

  const campos = {
    nombre: nombre.value.trim(),
    descripcion: descripcion.value.trim(),
    version: version.value.trim(),
    categoria: categoria.value.trim(),
    idioma: idioma.value.trim(),
    tipo: tipo.value.trim(),
    internet: internet.value,
    sistemaOperativo: sistema.value.trim(),
    requisitos: requisitos.value.trim(),
    fechaActualizacion: fechaAct.value,
    edad: edad.value.trim(),
    anuncios: anuncios.value,
    privacidadUrl: privacidad.value.trim(),
    imagen: imagenUrl.value.trim(),
    apk: apkUrl.value.trim(),
    size: size.value.trim() || "N/A",
    imgSecundarias: capturasUrl.value.split(",").map(u => u.trim()).filter(u => u !== ""),
    // NUEVOS CAMPOS
    playstoreUrl: playstoreUrl.value.trim(),
    uptodownUrl: uptodownUrl.value.trim(),
    megaUrl: megaUrl.value.trim(),
    mediafireUrl: mediafireUrl.value.trim(),
    packageName: packageName.value.trim(),
    fecha: Date.now()
  };

  if (!campos.nombre || !campos.descripcion || !campos.version) {
    alert("Completa al menos nombre, descripción y versión.");
    btn.disabled = false;
    estado.textContent = "";
    return;
  }

  const imagenFile = imagen.files[0];
  const apkFile = apk.files[0];
  const capturasFiles = capturas.files;
  const storageRef = firebase.storage().ref();
  let promesas = [];

  if (imagenFile) {
    promesas.push(
      storageRef.child("images/" + imagenFile.name)
        .put(imagenFile)
        .then(r => r.ref.getDownloadURL())
        .then(url => campos.imagen = url)
    );
  }

  if (apkFile) {
    promesas.push(
      storageRef.child("apk/" + apkFile.name)
        .put(apkFile)
        .then(r => r.ref.getDownloadURL())
        .then(url => campos.apk = url)
    );
  }

  if (capturasFiles.length > 0) {
    campos.imgSecundarias = [];
    promesas.push(
      Promise.all(
        [...capturasFiles].map(file =>
          storageRef.child("capturas/" + file.name)
          .put(file)
          .then(r => r.ref.getDownloadURL())
          .then(url => campos.imgSecundarias.push(url))
        )
      )
    );
  }

  await Promise.all(promesas);

  let id = editId || db.collection("apps").doc().id;

  const data = {
    id,
    ...campos
  };

  try {
    // 1. Guardar en Firestore
    await db.collection("apps").doc(id).set(data, { merge: true });
    
    // 2. Generar página HTML estática
    await generarPaginaApp(data);
    
    estado.textContent = "✅ App guardada y página generada";
    btn.disabled = false;
    editId = null;
    document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
    btn.textContent = "SUBIR APP";
    limpiarFormulario();
    
    // 3. Recargar lista
    if (!inSearchMode) {
      loadInitialApps();
    } else {
      const currentSearch = searchInput.value.trim();
      if (currentSearch) performSearch(currentSearch);
    }
    
  } catch (err) {
    estado.textContent = "❌ Error: " + err.message;
    btn.disabled = false;
  }
}

// =======================================================
// ELIMINAR APP (Y SU PÁGINA)
// =======================================================
async function eliminarApp(id) {
  if (!confirm("¿Estás seguro de eliminar esta aplicación? También se eliminará su página.")) return;
  
  try {
    // 1. Eliminar la página de Storage si existe
    const storageRef = firebase.storage().ref();
    const pageRef = storageRef.child(`pages/app-${id}.html`);
    
    try {
      await pageRef.delete();
      console.log(`Página app-${id}.html eliminada`);
    } catch (error) {
      console.log("No se encontró la página para eliminar");
    }
    
    // 2. Eliminar de Firestore
    await db.collection("apps").doc(id).delete();
    
    // 3. Eliminar de la vista
    document.getElementById(`app-row-${id}`)?.remove();
    
    alert("✅ Aplicación eliminada correctamente");
    
  } catch (error) {
    console.error("Error eliminando app:", error);
    alert("❌ Error al eliminar la aplicación");
  }
}

// =======================================================
// LIMPIAR FORMULARIO
// =======================================================
function limpiarFormulario() {
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(i => {
    if (i.type !== 'button' && i.type !== 'submit' && i.id !== 'cancelarBtn') {
      i.value = "";
    }
  });

  categoria.value = "Educación";
  tipo.value = "Gratis";
  internet.value = "offline";
  anuncios.value = "no";

  const imagenEl = document.getElementById("imagen");
  const apkEl = document.getElementById("apk");
  const capturasEl = document.getElementById("capturas");
  if (imagenEl) imagenEl.value = "";
  if (apkEl) apkEl.value = "";
  if (capturasEl) capturasEl.value = "";

  // Resetear labels de archivos
  document.getElementById("imagenLabel").textContent = "Seleccionar";
  document.getElementById("apkLabel").textContent = "Seleccionar";
  document.getElementById("capturasLabel").textContent = "Seleccionar";

  prevSize = null;
}

// =======================================================
// Cancelar edición o nueva aplicación
// =======================================================
function cancelarEdicion() {
  limpiarFormulario();
  document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
  document.getElementById("subirBtn").textContent = "SUBIR APP";
  document.getElementById("cancelarBtn").classList.add("hidden");
  editId = null;
}

// =======================================================
// Inicializar carga al abrir la página
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  loadInitialApps();
  cargarFormularioNuevo();
  updateFileName('imagen', 'imagenLabel');
  updateFileName('apk', 'apkLabel');
  updateFileName('capturas', 'capturasLabel');
});

// =======================================================
// Función para actualizar el nombre del archivo en los botones de selección
// =======================================================
function updateFileName(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  
  input.addEventListener('change', function() {
    if (input.files.length > 1) {
      label.textContent = `${input.files.length} archivos seleccionados`;
    } else if (input.files[0]) {
      label.textContent = input.files[0].name;
    } else {
      label.textContent = 'Seleccionar';
    }
  });
}
