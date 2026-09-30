// Variables globales de estado
let listaArchivos = [];
// Soporta tanto navegación directa en http://localhost:3000 como entornos externos
const API_URL = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
  ? '/api/archivos'
  : 'http://localhost:3000/api/archivos';

// Elementos del DOM
const btnRecargar = document.getElementById('btnRecargar');
const iconoRecarga = document.getElementById('iconoRecarga');
const inputBuscar = document.getElementById('inputBuscar');
const contadorFiltro = document.getElementById('contadorFiltro');

const statBucket = document.getElementById('statBucket');
const statPrefijo = document.getElementById('statPrefijo');
const statTotal = document.getElementById('statTotal');
const statTamano = document.getElementById('statTamano');

const estadoCargando = document.getElementById('estadoCargando');
const estadoError = document.getElementById('estadoError');
const estadoVacio = document.getElementById('estadoVacio');
const mensajeError = document.getElementById('mensajeError');
const btnReintentar = document.getElementById('btnReintentar');

const tablaWrapper = document.getElementById('tablaWrapper');
const cuerpoTabla = document.getElementById('cuerpoTabla');
const toast = document.getElementById('toast');
const toastMensaje = document.getElementById('toastMensaje');

// Elementos del Modal de Eliminación
let archivoAEliminar = null;
const modalEliminar = document.getElementById('modalEliminar');
const modalNombreArchivo = document.getElementById('modalNombreArchivo');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

// Función para mostrar toast informativo
let toastTimeout;
function mostrarToast(mensaje) {
  toastMensaje.textContent = mensaje;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Formatear bytes a formato legible (KB, MB, etc.)
function formatearBytes(bytes, decimales = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimales < 0 ? 0 : decimales;
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + unidades[i];
}

// Formatear fecha ISO a formato local amigable
function formatearFecha(fechaStr) {
  if (!fechaStr) return 'Fecha no disponible';
  try {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return fechaStr;
  }
}

// Obtener clase y tipo de icono según la extensión del archivo
function obtenerIconoArchivo(nombre) {
  const extension = (nombre || '').split('.').pop().toLowerCase();
  
  if (['pdf'].includes(extension)) {
    return {
      clase: 'pdf',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>'
    };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return {
      clase: 'img',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>'
    };
  }
  if (['js', 'ts', 'html', 'css', 'json', 'py', 'sh', 'sql'].includes(extension)) {
    return {
      clase: 'code',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>'
    };
  }
  if (['doc', 'docx', 'odt'].includes(extension)) {
    return {
      clase: 'doc',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>'
    };
  }
  if (['xls', 'xlsx', 'xlsm', 'csv'].includes(extension)) {
    return {
      clase: 'sheet',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>'
    };
  }
  if (['txt', 'md', 'log', 'rtf'].includes(extension)) {
    return {
      clase: 'txt',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-4v-2h4v2zm2 4H9v-2h6v2zm-2-8V3.5L18.5 9H13z"/></svg>'
    };
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
    return {
      clase: 'archive',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>'
    };
  }
  return {
    clase: 'default',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>'
  };
}

// Copiar S3 Key al portapapeles
window.copiarKey = function(key) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(key).then(() => {
      mostrarToast(`Key copiada: ${key}`);
    }).catch(() => fallbackCopiar(key));
  } else {
    fallbackCopiar(key);
  }
};

function fallbackCopiar(texto) {
  const inputTemp = document.createElement('input');
  inputTemp.value = texto;
  document.body.appendChild(inputTemp);
  inputTemp.select();
  document.execCommand('copy');
  document.body.removeChild(inputTemp);
  mostrarToast(`Key copiada: ${texto}`);
}

// Renderizar la tabla con los datos filtrados
function renderizarTabla(archivos) {
  cuerpoTabla.innerHTML = '';

  if (!archivos || archivos.length === 0) {
    tablaWrapper.style.display = 'none';
    estadoVacio.style.display = 'flex';
    contadorFiltro.textContent = '0 archivos encontrados';
    return;
  }

  estadoVacio.style.display = 'none';
  tablaWrapper.style.display = 'block';
  contadorFiltro.textContent = `Mostrando ${archivos.length} de ${listaArchivos.length} archivo(s)`;

  archivos.forEach(archivo => {
    const tr = document.createElement('tr');
    const iconoInfo = obtenerIconoArchivo(archivo.nombre);

    tr.innerHTML = `
      <td>
        <div class="file-info-cell">
          <div class="file-icon ${iconoInfo.clase}">
            ${iconoInfo.svg}
          </div>
          <div class="file-name" title="${archivo.nombre}">
            ${escapeHTML(archivo.nombre)}
          </div>
        </div>
      </td>
      <td>
        <span class="file-key-badge" title="${archivo.key}">
          <span>${escapeHTML(archivo.key)}</span>
          <button class="copy-btn" onclick="copiarKey('${escapeHTML(archivo.key)}')" title="Copiar S3 Key">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
        </span>
      </td>
      <td>
        <span class="badge-size">${formatearBytes(archivo.tamano)}</span>
      </td>
      <td>
        <span class="text-date">${formatearFecha(archivo.fecha)}</span>
      </td>
      <td style="text-align: center;">
        <div class="action-buttons">
          <a href="/api/archivos/descargar?key=${encodeURIComponent(archivo.key)}" class="btn-action btn-action-download" title="Descargar archivo a tu equipo" download="${escapeHTML(archivo.nombre)}">
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Descargar
          </a>
          <button type="button" class="btn-action btn-action-delete" onclick="solicitarEliminar('${escapeHTML(archivo.key)}', '${escapeHTML(archivo.nombre)}')" title="Eliminar archivo del bucket S3">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Eliminar
          </button>
        </div>
      </td>
    `;
    cuerpoTabla.appendChild(tr);
  });
}

// Prevención de inyección XSS al renderizar nombres de archivo
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Cargar los archivos consumiendo el endpoint /api/archivos
async function cargarArchivos() {
  iconoRecarga.classList.add('spin-icon');
  btnRecargar.disabled = true;
  
  estadoCargando.style.display = 'flex';
  estadoError.style.display = 'none';
  estadoVacio.style.display = 'none';
  tablaWrapper.style.display = 'none';
  contadorFiltro.textContent = 'Consultando endpoint...';

  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error(`Error en el servidor: HTTP ${respuesta.status} (${respuesta.statusText})`);
    }

    const datos = await respuesta.json();

    // Extraer los archivos del JSON
    listaArchivos = Array.isArray(datos.archivos) ? datos.archivos : [];

    // Actualizar métricas del Bucket
    statBucket.textContent = datos.bucket || 'Desconocido';
    statPrefijo.textContent = datos.prefijo || '(Raíz)';
    statTotal.textContent = listaArchivos.length;

    // Calcular tamaño acumulado de todos los archivos
    const tamanoTotalBytes = listaArchivos.reduce((acc, curr) => acc + (Number(curr.tamano) || 0), 0);
    statTamano.textContent = formatearBytes(tamanoTotalBytes);

    // Ocultar cargando y renderizar
    estadoCargando.style.display = 'none';
    
    // Aplicar filtro si ya había texto en el input
    filtrarArchivos();

  } catch (error) {
    console.error('Error al consultar /api/archivos:', error);
    estadoCargando.style.display = 'none';
    estadoError.style.display = 'flex';
    mensajeError.textContent = error.message || 'No se pudo conectar con el endpoint /api/archivos. Asegúrate de que el servidor Node.js y S3 estén activos.';
    contadorFiltro.textContent = 'Error de conexión';
  } finally {
    iconoRecarga.classList.remove('spin-icon');
    btnRecargar.disabled = false;
  }
}

// Filtrar archivos en tiempo real según el input de búsqueda
function filtrarArchivos() {
  const termino = inputBuscar.value.trim().toLowerCase();
  if (!termino) {
    renderizarTabla(listaArchivos);
    return;
  }

  const filtrados = listaArchivos.filter(item => {
    const nombre = (item.nombre || '').toLowerCase();
    const key = (item.key || '').toLowerCase();
    return nombre.includes(termino) || key.includes(termino);
  });

  renderizarTabla(filtrados);
}

// Gestión del Modal y Eliminación de Archivos
window.solicitarEliminar = function(key, nombre) {
  archivoAEliminar = { key, nombre };
  modalNombreArchivo.textContent = nombre;
  modalEliminar.style.display = 'flex';
};

function cerrarModalEliminar() {
  modalEliminar.style.display = 'none';
  archivoAEliminar = null;
}

btnCancelarEliminar.addEventListener('click', cerrarModalEliminar);

// Cerrar modal al hacer clic fuera de la tarjeta
modalEliminar.addEventListener('click', (e) => {
  if (e.target === modalEliminar) {
    cerrarModalEliminar();
  }
});

// Cerrar modal al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalEliminar.style.display === 'flex') {
    cerrarModalEliminar();
  }
});

// Confirmar y procesar la eliminación en S3
btnConfirmarEliminar.addEventListener('click', async () => {
  if (!archivoAEliminar) return;
  const { key, nombre } = archivoAEliminar;

  btnConfirmarEliminar.disabled = true;
  btnConfirmarEliminar.innerHTML = `
    <svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
    </svg>
    Eliminando...
  `;

  try {
    const respuesta = await fetch(`/api/archivos?key=${encodeURIComponent(key)}`, {
      method: 'DELETE'
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.success) {
      throw new Error(resultado.message || 'Error al eliminar el archivo');
    }

    cerrarModalEliminar();
    mostrarToast(`"${nombre}" eliminado de S3`);
    
    // Recargar la lista y actualizar métricas
    await cargarArchivos();

  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    mostrarToast(`Error: ${error.message}`);
  } finally {
    btnConfirmarEliminar.disabled = false;
    btnConfirmarEliminar.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
      Sí, Eliminar
    `;
  }
});

// Event Listeners
btnRecargar.addEventListener('click', cargarArchivos);
btnReintentar.addEventListener('click', cargarArchivos);
inputBuscar.addEventListener('input', filtrarArchivos);

// Carga inicial al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarArchivos);
