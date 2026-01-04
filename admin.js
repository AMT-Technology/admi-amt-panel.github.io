// =======================================================
// PROTECCIÓN DE ACCESO
// =======================================================
auth.onAuthStateChanged(user => {
  if (!user || user.email !== "des.amt.01@gmail.com") {
    auth.signOut();
    location.href = "index.html";
  }
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

// Referencias a elementos del formulario
const nombre = document.getElementById("nombre");
const descripcion = document.getElementById("descripcion");
const version = document.getElementById("version");
const categoria = document.getElementById("categoria");
const idioma = document.getElementById("idioma");
const tipo = document.getElementById("tipo");
const internet = document.getElementById("internet");
const sistema = document.getElementById("sistema");
const requisitos = document.getElementById("requisitos");
const fechaAct = document.getElementById("fechaAct");
const edad = document.getElementById("edad");
const anuncios = document.getElementById("anuncios");
const privacidad = document.getElementById("privacidad");
const imagenUrl = document.getElementById("imagenUrl");
const capturasUrl = document.getElementById("capturasUrl");
const iconoUrl = document.getElementById("iconoUrl");
const apkUrl = document.getElementById("apkUrl");
const size = document.getElementById("size");
const playstoreUrl = document.getElementById("playstoreUrl");
const uptodownUrl = document.getElementById("uptodownUrl");
const megaUrl = document.getElementById("megaUrl");
const mediafireUrl = document.getElementById("mediafireUrl");
const packageName = document.getElementById("packageName");

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
    console.log("Generando página para:", appData.nombre);
    
    // Crear el contenido HTML
    const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(appData.nombre)} — Appser Store | Descarga ${escapeHtml(appData.nombre)} para Android</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  
  <!-- 🔍 SEO -->
  <meta name="description" content="Descarga ${escapeHtml(appData.nombre)} para Android desde Appser Store. ${escapeHtml(appData.descripcion?.substring(0, 150) || '')}">
  <meta name="keywords" content="${escapeHtml(appData.nombre)}, ${escapeHtml(appData.categoria)}, Android, APK, descargar">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(appData.nombre)} — Appser Store">
  <meta property="og:description" content="${escapeHtml(appData.descripcion?.substring(0, 200) || '')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://appsem.rap-infinite.online/app-${appData.id}.html">
  <meta property="og:image" content="${appData.imagen || 'https://appsem.rap-infinite.online/logo.webp'}">
  
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
        <img id="detailIcon" class="overlay-icon" src="${appData.imagen || ''}" alt="${escapeHtml(appData.nombre)}" loading="lazy">
        <div>
          <h1 id="detailName">${escapeHtml(appData.nombre)}</h1>
          <p id="detailCategory">${escapeHtml(appData.categoria || '')}</p>
          <p id="detailSize">📦 Tamaño: ${appData.size || '—'}</p>
          <p id="detailInternet">${appData.internet === 'offline' ? '📴 Funciona sin Internet' : '🌐 Requiere Internet'}</p>
        </div>
      </div>

      <div class="install-share-row">
        ${appData.apk ? `<button class="install-btn" onclick="window.open('${appData.apk}', '_blank')">
          <img src="assets/icons/descargar.png" alt="Descarga Directa">
        </button>` : ''}
        
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
        
        <button class="share-btn" onclick="compartirApp()">
          <img src="assets/icons/compartir.png" alt="Compartir">
        </button>
      </div>

      <p class="detail-stats">
        Descargas: ${(appData.descargasReales || 0).toLocaleString("es-ES")} • 
        Likes: ${(appData.likes || 0).toLocaleString("es-ES")}
      </p>

      <!-- Información de la App -->
      <h2>Información de la app</h2>
      <div class="info-grid">
        <div class="info-box">
          <span class="info-icon">🌐</span>
          <div>
            <p class="info-title">Idioma</p>
            <p class="info-value">${escapeHtml(appData.idioma || '—')}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🔢</span>
          <div>
            <p class="info-title">Versión</p>
            <p class="info-value">${escapeHtml(appData.version || '—')}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">🏷️</span>
          <div>
            <p class="info-title">Licencia</p>
            <p class="info-value">${escapeHtml(appData.tipo || '—')}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">📱</span>
          <div>
            <p class="info-title">Sistema operativo</p>
            <p class="info-value">${escapeHtml(appData.sistemaOperativo || '—')}</p>
          </div>
        </div>
        
        <div class="info-box">
          <span class="info-icon">⚙️</span>
          <div>
            <p class="info-title">Requisitos del sistema</p>
            <p class="info-value">${escapeHtml(appData.requisitos || '—')}</p>
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
            <p class="info-value">${escapeHtml(appData.edad || '—')}</p>
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
            <p class="info-value">${escapeHtml(appData.packageName || '—')}</p>
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
      <p class="detail-desc">${escapeHtml(appData.descripcion || '')}</p>

      ${appData.imgSecundarias && appData.imgSecundarias.length > 0 ? `
      <h2>Capturas de pantalla</h2>
      <div class="screenshots-row">
        ${appData.imgSecundarias.map(img => `<img src="${img}" alt="Captura de ${escapeHtml(appData.nombre)}" loading="lazy">`).join('')}
      </div>
      ` : ''}

      <div class="page-footer-note">
        <p>Para interactuar con reseñas, valoraciones y funciones dinámicas, visita la versión completa de esta página:</p>
        <a href="app-dynamic.html?id=${appData.id}" class="btn-primary" style="display:inline-block; margin-top:10px;">Ver página dinámica completa</a>
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
    function compartirApp() {
      const url = window.location.href;
      const title = '${escapeHtml(appData.nombre)} — Appser Store';
      const text = 'Mira esta app en Appser Store: ${escapeHtml(appData.nombre)}';
      
      if (navigator.share) {
        navigator.share({ title, text, url });
      } else {
        navigator.clipboard.writeText(url);
        alert('¡Enlace copiado al portapapeles!');
      }
    }
  </script>
</body>
</html>`;

    // Subir a Firebase Storage
    const storageRef = firebase.storage().ref();
    const pageRef = storageRef.child(`pages/app-${appData.id}.html`);
    
    await pageRef.putString(htmlTemplate, 'raw', {
      contentType: 'text/html'
    });
    
    // Obtener la URL pública
    const downloadURL = await pageRef.getDownloadURL();
    
    // Guardar la URL en Firestore
    await db.collection("apps").doc(appData.id).update({
      pageUrl: downloadURL,
      pagePath: `pages/app-${appData.id}.html`
    });
    
    console.log(`✅ Página generada: ${downloadURL}`);
    return downloadURL;
    
  } catch (error) {
    console.error("❌ Error generando página:", error);
    // No lanzamos el error para no interrumpir el guardado principal
    return null;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    query = query.startAfter(lastVisible);
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
      const items = docs.map(d => ({ id: d.id, ...d.data() }));
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
        <td><img src="${a.icono || a.imagen || ''}" class="table-icon" alt="icono" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlNWU1ZTUiIHJ4PSI4Ii8+PC9zdmc+'"></td>
        <td>${escapeHtml(a.nombre || 'Sin nombre')}</td>
        <td>${escapeHtml(a.categoria || 'Sin categoría')}</td>
        <td>${escapeHtml(a.version || '1.0')}</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="cargarParaEditar('${a.id}')">✏️ Editar</button>
          <button class="btn-view" onclick="window.open('app-dynamic.html?id=${a.id}', '_blank')">👁️ Ver</button>
          <button class="btn-delete" onclick="eliminarApp('${a.id}', '${escapeHtml(a.nombre || 'esta app')}')">🗑 Eliminar</button>
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
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a,b) => (b.fecha || 0) - (a.fecha || 0));
      renderApps(items, false);
      loadingMoreEl.classList.add("hidden");
    })
    .catch(err => {
      console.error("Error en búsqueda:", err);
      appsList.innerHTML = '<tr><td colspan="5" style="padding:12px;color:#ef4444">Error en la búsqueda</td></tr>';
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
  document.getElementById("subirBtn").textContent = "GUARDAR CAMBIOS";
  document.getElementById("cancelarBtn").classList.remove("hidden");

  db.collection("apps").doc(id).get().then(doc => {
    const a = doc.data();

    nombre.value = a.nombre || '';
    descripcion.value = a.descripcion || '';
    version.value = a.version || '';
    categoria.value = a.categoria || 'Educación';
    idioma.value = a.idioma || '';
    tipo.value = a.tipo || 'Gratis';
    internet.value = a.internet || 'offline';
    sistema.value = a.sistemaOperativo || "";
    requisitos.value = a.requisitos || "";
    fechaAct.value = a.fechaActualizacion || "";
    edad.value = a.edad || "";
    anuncios.value = a.anuncios || "no";
    privacidad.value = a.privacidadUrl || "";
    imagenUrl.value = a.imagen || "";
    capturasUrl.value = a.imgSecundarias ? a.imgSecundarias.join(", ") : "";
    iconoUrl.value = a.icono || "";
    apkUrl.value = a.apk || "";
    packageName.value = a.packageName || "";
    size.value = a.size || "";
    prevSize = a.size || null;
    playstoreUrl.value = a.playstoreUrl || "";
    uptodownUrl.value = a.uptodownUrl || "";
    megaUrl.value = a.megaUrl || "";
    mediafireUrl.value = a.mediafireUrl || "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }).catch(err => {
    console.error("Error cargando app para editar:", err);
    alert("Error al cargar la aplicación para editar");
  });
}

// =======================================================
// LIMPIAR FORMULARIO
// =======================================================
function limpiarFormulario() {
  const inputs = [
    nombre, descripcion, version, idioma, sistema, requisitos,
    edad, privacidad, imagenUrl, capturasUrl, iconoUrl, apkUrl,
    size, playstoreUrl, uptodownUrl, megaUrl, mediafireUrl,
    packageName
  ];
  
  inputs.forEach(input => {
    if (input) input.value = "";
  });
  
  fechaAct.value = "";
  
  // Resetear selects a valores por defecto
  categoria.value = "Educación";
  tipo.value = "Gratis";
  internet.value = "offline";
  anuncios.value = "no";
  
  // Resetear inputs de archivos
  document.getElementById("imagen").value = "";
  document.getElementById("apk").value = "";
  document.getElementById("capturas").value = "";
  
  // Resetear labels
  document.getElementById("imagenLabel").textContent = "Seleccionar";
  document.getElementById("apkLabel").textContent = "Seleccionar";
  document.getElementById("capturasLabel").textContent = "Seleccionar";
  
  prevSize = null;
  editId = null;
}

// =======================================================
// GUARDAR / EDITAR APP
// =======================================================
async function guardarApp() {
  const btn = document.getElementById("subirBtn");
  const estado = document.getElementById("estado");
  const originalBtnText = btn.textContent;

  // Validaciones básicas
  if (!nombre.value.trim()) {
    alert("El nombre es obligatorio");
    return;
  }
  
  if (!descripcion.value.trim()) {
    alert("La descripción es obligatoria");
    return;
  }
  
  if (!version.value.trim()) {
    alert("La versión es obligatoria");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Guardando...";
  estado.textContent = "Guardando aplicación...";
  estado.style.color = "#3b82f6";

  try {
    // Recopilar datos del formulario
    const appData = {
      nombre: nombre.value.trim(),
      descripcion: descripcion.value.trim(),
      version: version.value.trim(),
      categoria: categoria.value,
      idioma: idioma.value.trim(),
      tipo: tipo.value,
      internet: internet.value,
      sistemaOperativo: sistema.value.trim(),
      requisitos: requisitos.value.trim(),
      fechaActualizacion: fechaAct.value || null,
      edad: edad.value.trim(),
      anuncios: anuncios.value,
      privacidadUrl: privacidad.value.trim(),
      imagen: imagenUrl.value.trim(),
      apk: apkUrl.value.trim(),
      size: size.value.trim() || "N/A",
      packageName: packageName.value.trim(),
      playstoreUrl: playstoreUrl.value.trim(),
      uptodownUrl: uptodownUrl.value.trim(),
      megaUrl: megaUrl.value.trim(),
      mediafireUrl: mediafireUrl.value.trim(),
      fecha: Date.now()
    };

    // Procesar capturas (separadas por comas)
    if (capturasUrl.value.trim()) {
      appData.imgSecundarias = capturasUrl.value.split(",")
        .map(url => url.trim())
        .filter(url => url.length > 0);
    }

    // Procesar archivos subidos
    const imagenFile = document.getElementById("imagen").files[0];
    const apkFile = document.getElementById("apk").files[0];
    const capturasFiles = document.getElementById("capturas").files;
    const storageRef = firebase.storage().ref();
    const uploadPromises = [];

    // Subir imagen principal
    if (imagenFile) {
      const imagenPromise = storageRef.child(`images/${Date.now()}_${imagenFile.name}`)
        .put(imagenFile)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
          appData.imagen = url;
        });
      uploadPromises.push(imagenPromise);
    }

    // Subir APK
    if (apkFile) {
      const apkPromise = storageRef.child(`apks/${Date.now()}_${apkFile.name}`)
        .put(apkFile)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
          appData.apk = url;
        });
      uploadPromises.push(apkPromise);
    }

    // Subir capturas secundarias
    if (capturasFiles.length > 0) {
      appData.imgSecundarias = appData.imgSecundarias || [];
      
      const capturasPromises = Array.from(capturasFiles).map(file => {
        return storageRef.child(`screenshots/${Date.now()}_${file.name}`)
          .put(file)
          .then(snapshot => snapshot.ref.getDownloadURL())
          .then(url => {
            appData.imgSecundarias.push(url);
          });
      });
      
      uploadPromises.push(Promise.all(capturasPromises));
    }

    // Esperar a que se suban todos los archivos
    if (uploadPromises.length > 0) {
      estado.textContent = "Subiendo archivos...";
      await Promise.all(uploadPromises);
    }

    // Determinar ID (nuevo o edición)
    const appId = editId || db.collection("apps").doc().id;
    appData.id = appId;

    // Guardar en Firestore
    estado.textContent = "Guardando en base de datos...";
    await db.collection("apps").doc(appId).set(appData, { merge: true });

    // Generar página HTML
    estado.textContent = "Generando página web...";
    await generarPaginaApp(appData);

    // Éxito
    estado.textContent = "✅ ¡Aplicación guardada correctamente!";
    estado.style.color = "#10b981";
    
    // Resetear formulario
    limpiarFormulario();
    document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
    btn.textContent = "SUBIR APP";
    document.getElementById("cancelarBtn").classList.add("hidden");
    editId = null;

    // Recargar lista
    if (!inSearchMode) {
      loadInitialApps();
    } else {
      const currentSearch = searchInput.value.trim();
      if (currentSearch) performSearch(currentSearch);
    }

  } catch (error) {
    console.error("Error guardando aplicación:", error);
    estado.textContent = "❌ Error: " + (error.message || "No se pudo guardar");
    estado.style.color = "#ef4444";
    alert("Error al guardar: " + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalBtnText;
    
    // Auto-limpiar mensaje de estado después de 5 segundos
    setTimeout(() => {
      estado.textContent = "";
    }, 5000);
  }
}

// =======================================================
// ELIMINAR APP
// =======================================================
async function eliminarApp(id, nombreApp) {
  if (!confirm(`¿Estás seguro de eliminar la aplicación "${nombreApp}"? Esta acción no se puede deshacer.`)) {
    return;
  }

  const estado = document.getElementById("estado");
  estado.textContent = "Eliminando aplicación...";
  estado.style.color = "#f59e0b";

  try {
    // 1. Intentar eliminar la página de Storage si existe
    const storageRef = firebase.storage().ref();
    const pageRef = storageRef.child(`pages/app-${id}.html`);
    
    try {
      await pageRef.delete();
      console.log(`Página app-${id}.html eliminada`);
    } catch (error) {
      console.log("No se encontró la página para eliminar o ya fue eliminada");
    }

    // 2. Eliminar de Firestore
    await db.collection("apps").doc(id).delete();

    // 3. Eliminar de la vista
    const row = document.getElementById(`app-row-${id}`);
    if (row) {
      row.style.opacity = "0.5";
      setTimeout(() => row.remove(), 300);
    }

    estado.textContent = "✅ Aplicación eliminada correctamente";
    estado.style.color = "#10b981";
    
    setTimeout(() => {
      estado.textContent = "";
    }, 3000);

  } catch (error) {
    console.error("Error eliminando app:", error);
    estado.textContent = "❌ Error al eliminar la aplicación";
    estado.style.color = "#ef4444";
    alert("Error al eliminar: " + error.message);
  }
}

// =======================================================
// CANCELAR EDICIÓN
// =======================================================
function cancelarEdicion() {
  if (editId && confirm("¿Cancelar edición? Los cambios no guardados se perderán.")) {
    limpiarFormulario();
    document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
    document.getElementById("subirBtn").textContent = "SUBIR APP";
    document.getElementById("cancelarBtn").classList.add("hidden");
    editId = null;
  } else if (!editId) {
    limpiarFormulario();
    document.getElementById("formTitle").textContent = "➕ Nueva Aplicación";
    document.getElementById("subirBtn").textContent = "SUBIR APP";
    document.getElementById("cancelarBtn").classList.add("hidden");
  }
}

// =======================================================
// INICIALIZACIÓN
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  // Cargar apps
  loadInitialApps();
  
  // Configurar eventos de archivos
  updateFileName('imagen', 'imagenLabel');
  updateFileName('apk', 'apkLabel');
  updateFileName('capturas', 'capturasLabel');
  
  // Configurar fecha por defecto
  if (!fechaAct.value) {
    const today = new Date().toISOString().split('T')[0];
    fechaAct.value = today;
  }
  
  // Configurar evento del botón de subir
  document.getElementById("subirBtn").addEventListener("click", guardarApp);
});

// =======================================================
// FUNCIÓN PARA ACTUALIZAR NOMBRE DE ARCHIVOS
// =======================================================
function updateFileName(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  
  if (!input || !label) return;
  
  input.addEventListener('change', function() {
    if (this.files.length > 1) {
      label.textContent = `${this.files.length} archivos seleccionados`;
    } else if (this.files[0]) {
      // Limitar nombre a 20 caracteres
      let fileName = this.files[0].name;
      if (fileName.length > 20) {
        fileName = fileName.substring(0, 17) + '...';
      }
      label.textContent = fileName;
    } else {
      label.textContent = 'Seleccionar';
    }
  });
}
