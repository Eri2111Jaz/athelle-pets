// ============================================================
// 1) CONFIGURACIÓN DE SUPABASE
// ============================================================
const SUPABASE_URL = "https://edxllzyxmgzwnjcezeqm.supabase.co"; // ¡Revisa si es edxl (1 L) o edxll (2 L)!
const SUPABASE_KEY = "sb_publishable_H1ZuXeXY226jy3_eB9NTcQ_PzYMDlGM";

let db = null;
try {
    if (typeof supabase !== 'undefined') {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error("ERROR FATAL: El script de Supabase no está cargado en el HTML.");
    }
} catch (error) { console.error("Error al iniciar Supabase:", error); }

const ADMIN_USER = "adm";
const ADMIN_PASS = "1234";
const WHATSAPP = "59178620138"; 
const REDES = { instagram: "#", facebook: "#", tiktok: "#" };
const UBICACION_URL = "https://maps.google.com/"; 

const IMAGENES = {
  logo: "img/logo.png", hero: "img/hero.png",
  categorias: { "Perro": "img/categoria-perro.png", "Gato": "img/categoria-gato.png", "Otros animales": "img/categoria-otros.png", "Camas": "img/categoria-camas.png", "Juguetes": "img/categoria-juguetes.png", "Accesorios": "img/categoria-accesorios.png" },
  beneficios: { envios: "img/beneficio-envios.png", seguro: "img/beneficio-seguro.png", whatsapp: "img/beneficio-whatsapp.png", ubicacion: "img/beneficio-ubicacion.png" },
  redes: { instagram: "img/red-instagram.png", facebook: "img/red-facebook.png", tiktok: "img/red-tiktok.png" }
};

const CATEGORIAS = ["Perro", "Gato", "Otros animales", "Camas", "Juguetes", "Accesorios"];
const SUBS = ["Accesorio", "Juguetes", "Alimento", "Salud e higiene", "Ropa"];
const PASTELES = ["#FCD7E8", "#BDD1E6", "#C9A9D1", "#F4F6FC"];

const RESPALDO = [
  { id: 1, nombre: "Collar Lavanda", precio: 45, precioAnterior: 55, categoria: "Perro", subcategoria: "Accesorio", imagen: "", stock: 20, descripcion: "Collar ajustable.", medidas: "10cm x 10cm", variantes: [] },
  { id: 2, nombre: "Pelota", precio: 25, precioAnterior: 0, categoria: "Juguetes", subcategoria: "Juguetes", imagen: "", stock: 40, descripcion: "Goma resistente.", medidas: "5cm",
    variantes: [ { talla: "Única", color: "Rojo", precio: 25, stock: 20 }, { talla: "Única", color: "Verde", precio: 25, stock: 20 } ] },
  { id: 3, nombre: "Polera", precio: 60, precioAnterior: 80, categoria: "Perro", subcategoria: "Ropa", imagen: "", stock: 15, descripcion: "Polera abrigada.", medidas: "T0: 50cm ancho x 60cm largo, T4: 20cm alto x 15cm ancho",
    variantes: [ { talla: "0", color: "Azul", precio: 60, stock: 8 }, { talla: "4", color: "Azul", precio: 65, stock: 7 } ] }
];

// ============================================================
// VARIANTES (Talla + Color, con precio y stock propios)
// ============================================================
const TALLAS_ADMIN = ["0", "1", "2", "3", "4", "5", "6", "7", "Única"];

function normalizarVariantes(raw) {
  let arr = raw;
  if (typeof arr === "string") { try { arr = JSON.parse(arr); } catch (e) { arr = []; } }
  if (!Array.isArray(arr)) return [];
  return arr.map(v => ({
    talla: String(v.talla ?? "").trim(),
    color: String(v.color ?? "").trim(),
    precio: Number(v.precio) || 0,
    stock: Math.max(0, parseInt(v.stock, 10) || 0)
  })).filter(v => v.talla !== "");
}
const tieneVar = p => Array.isArray(p.variantes) && p.variantes.length > 0;
const stockTotal = p => tieneVar(p) ? p.variantes.reduce((s, v) => s + v.stock, 0) : p.stock;
const precioMin = p => tieneVar(p) ? Math.min(...p.variantes.map(v => v.precio)) : p.precio;
const precioMax = p => tieneVar(p) ? Math.max(...p.variantes.map(v => v.precio)) : p.precio;
const rangoPrecio = p => precioMin(p) === precioMax(p) ? bs(precioMin(p)) : `${bs(precioMin(p))} – ${bs(precioMax(p))}`;
const buscarVariante = (p, talla, color) => (p.variantes || []).find(v => v.talla === String(talla ?? "") && v.color === String(color ?? ""));
function ordenarTallas(a, b) {
  const na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;
  return a.localeCompare(b);
}
const tallasUnicas = vs => [...new Set(vs.map(v => v.talla))].sort(ordenarTallas);
const coloresDeTalla = (p, talla) => [...new Set(p.variantes.filter(v => v.talla === talla).map(v => v.color))];
// Campos antiguos (obsoletos): se siguen rellenando por compatibilidad
const camposLegacy = vs => ({ tallas: tallasUnicas(vs).join(", "), colores: [...new Set(vs.map(v => v.color).filter(Boolean))].join(", ") });

function ph(texto, w = 400, h = 400, i = 0) {
  const t = String(texto || "").replace(/[<>&]/g, "").slice(0, 18);
  const size = Math.max(12, Math.min(w, h) / 7);
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='${w}' height='${h}' rx='${Math.min(w, h) / 6}' fill='${PASTELES[i % 4]}'/><text x='50%' y='52%' font-family='sans-serif' font-size='${size}' fill='#9E93C9' text-anchor='middle'>${t}</text></svg>`);
}
function resolver(ruta) { return ruta.split(".").reduce((o, k) => (o ? o[k] : undefined), IMAGENES); }
function conFallback(img, texto, w, h, i) { img.onerror = () => { img.onerror = null; img.src = ph(texto, w, h, i); }; }

function pintarImagenes() {
  document.querySelectorAll("img[data-img]").forEach((img, i) => {
    const w = +img.dataset.w || 120, h = +img.dataset.h || 120;
    conFallback(img, img.dataset.ph, w, h, i);
    img.src = resolver(img.dataset.img) || ph(img.dataset.ph, w, h, i);
  });
  Object.entries(REDES).forEach(([k, v]) => {
    const a = document.getElementById("r_" + k); if (a) a.href = v;
  });
  const linkUbicacion = document.getElementById("link_ubicacion");
  if (linkUbicacion) linkUbicacion.href = UBICACION_URL;
}

let productos = [], pedidos = [], blogs = [], resenas = [], carrito = [];
let catSel = "Todos", subSel = "Todos", offline = true;

const $ = id => document.getElementById(id);  
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); 
const bs = n => "Bs " + Number(n || 0).toFixed(2); 
const foto = p => p.imagen || ph(p.nombre, 400, 400, 0); 

function toast(m) {
  const t = $("toast"); t.textContent = m; t.classList.add("on");
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2400);
}
function subLabel(sub, cat) {
  if (sub !== "Accesorio") return sub;
  return cat === "Perro" ? "Accesorio para perro" : cat === "Gato" ? "Accesorio para gato" : cat === "Otros animales" ? "Accesorio para otros animales" : "Accesorio";
}

async function cargar() {
  if (!db) {
    productos = [...RESPALDO]; offline = true;
    render(); renderAdmin(); renderCarrito(); renderBlogs(); renderResenas();
    return;
  }
  try {
    const { data, error } = await db.from('productos').select('*').order('id', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      productos = data.map(p => {
        const variantes = normalizarVariantes(p.variantes);
        return { ...p, precio: Number(p.precio) || 0, precioAnterior: Number(p.precioAnterior) || 0, variantes, stock: variantes.length ? variantes.reduce((s, v) => s + v.stock, 0) : (Number(p.stock) || 0), subcategoria: p.subcategoria || "", medidas: p.medidas || "" };
      });
      offline = false;
    } else { productos = [...RESPALDO]; offline = true; }
  } catch (e) { console.error("Error al cargar productos:", e); productos = [...RESPALDO]; offline = true; }

  try { const { data } = await db.from('pedidos').select('*').order('id', { ascending: false }); pedidos = data || []; } catch (e) { pedidos = []; }
  try { const { data } = await db.from('blog').select('*').order('id', { ascending: false }); blogs = data || []; } catch (e) { blogs = []; }
  try { const { data } = await db.from('resenas').select('*').order('id', { ascending: false }); resenas = data || []; } catch (e) { resenas = []; }

  render(); renderAdmin(); renderCarrito(); renderBlogs(); renderResenas();
}

function renderChips() {
  $("chips").innerHTML = ["Todos", ...CATEGORIAS].map(c => `<button class="chip ${c === catSel ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  $("tiles").innerHTML = CATEGORIAS.map((c, i) => `<div class="tile" data-c="${esc(c)}"><img data-tile="${i}" alt="${esc(c)}">${esc(c)}</div>`).join("");
  
  document.querySelectorAll("img[data-tile]").forEach(img => {
    const c = CATEGORIAS[img.dataset.tile];
    conFallback(img, c, 120, 120, +img.dataset.tile);
    img.src = IMAGENES.categorias[c] || ph(c, 120, 120, +img.dataset.tile);
  });

  let subs = [];
  if (catSel === "Todos") subs = ["Perro", "Gato", "Otros animales", "Juguetes"].map(c => ({ l: subLabel("Accesorio", c), c, s: "Accesorio" }));
  else if (catSel !== "Camas") subs = SUBS.map(s => ({ l: subLabel(s, catSel), c: catSel, s }));
  
  const todos = catSel !== "Todos" && catSel !== "Camas" ? `<button class="chip ${subSel === "Todos" ? "on" : ""}" data-c="${esc(catSel)}" data-s="Todos">Todo en ${esc(catSel)}</button>` : "";
  $("subchips").innerHTML = todos + subs.map(x => `<button class="chip ${(catSel === x.c && subSel === x.s) ? "on" : ""}" data-c="${esc(x.c)}" data-s="${esc(x.s)}">${esc(x.l)}</button>`).join("");
}

function render() {
  renderChips();
  const q = $("q").value.trim().toLowerCase();
  const l = productos.filter(p =>
    (catSel === "Todos" || p.categoria === catSel) &&
    (subSel === "Todos" || p.subcategoria === subSel) &&
    (!q || (p.nombre + " " + p.descripcion).toLowerCase().includes(q)) &&
    (!$("onlyOffer").checked || p.precioAnterior > precioMin(p))
  );

  const s = $("sort").value;
  if (s === "asc") l.sort((a, b) => precioMin(a) - precioMin(b));
  if (s === "desc") l.sort((a, b) => precioMin(b) - precioMin(a));
  if (s === "az") l.sort((a, b) => a.nombre.localeCompare(b.nombre));

  $("count").textContent = l.length + " producto(s)";
  $("grid").innerHTML = l.length ? l.map(card).join("") : `<p class="empty" style="grid-column:1/-1">No hay productos en esta categoría.</p>`;
  document.querySelectorAll("#grid img[data-name]").forEach(img => conFallback(img, img.dataset.name, 400, 400, 0));
  l.filter(tieneVar).forEach(p => cambiarMedida(p.id));
}

function precioHTML(precio, anterior) {
  return `${bs(precio)}${anterior > precio ? `<s>${bs(anterior)}</s>` : ""}`;
}

function opcionesColores(colores, elegido) {
  return colores.map(c => `<option value="${esc(c)}" ${c === elegido ? "selected" : ""}>Color: ${esc(c || "Sin color")}</option>`).join("");
}

function card(p) {
  const conVar = tieneVar(p);
  const out = stockTotal(p) <= 0;
  const etiqueta = p.subcategoria ? `${p.categoria} · ${subLabel(p.subcategoria, p.categoria)}` : p.categoria;

  let variantesHTML = "";
  let precio = precioHTML(p.precio, p.precioAnterior);
  let agotado = out;
  let textoBtn = out ? "Sin stock" : "Agregar al carrito";

  if (conVar) {
    // Variante inicial: la primera que tenga stock (o la primera de todas)
    const ini = p.variantes.find(v => v.stock > 0) || p.variantes[0];
    variantesHTML = `<select id="sel-t-${p.id}" class="vsel" onchange="cambiarTalla('${p.id}')">
        ${tallasUnicas(p.variantes).map(t => `<option value="${esc(t)}" ${t === ini.talla ? "selected" : ""}>Talla: ${esc(t)}</option>`).join('')}
      </select>
      <select id="sel-c-${p.id}" class="vsel" onchange="actualizarVariante('${p.id}')">
        ${opcionesColores(coloresDeTalla(p, ini.talla), ini.color)}
      </select>`;
    precio = precioHTML(ini.precio, p.precioAnterior);
    agotado = ini.stock <= 0;
    textoBtn = agotado ? "Agotado" : "Agregar al carrito";
  }

  let medidasHTML = p.medidas ? `<small id="med-${p.id}" style="color: #6b6674; margin-bottom: 5px; display:block; font-weight: 600;">Medidas: ${esc(p.medidas)}</small>` : "";

  return `<article class="card">
    ${out ? `<span class="tag out">Agotado</span>` : p.precioAnterior > precioMin(p) ? `<span class="tag">Oferta</span>` : ""}
    <div class="im"><img src="${esc(foto(p))}" data-name="${esc(p.nombre)}" loading="lazy"></div>
    <div class="bd">
      <small>${esc(etiqueta)}</small><h3>${esc(p.nombre)}</h3><p>${esc(p.descripcion)}</p>
      ${variantesHTML}
      ${medidasHTML}
      <div class="price" id="pr-${p.id}">${precio}</div>
      <button class="btn" id="btn-${p.id}" data-add="${esc(p.id)}" ${agotado ? "disabled" : ""}>${textoBtn}</button>
    </div>
  </article>`;
}

function cambiarMedida(id) {
  const p = productos.find(x => x.id == id);
  if (!p || !p.medidas) return;
  const sel = document.getElementById(`sel-t-${id}`);
  const medSpan = document.getElementById(`med-${id}`);
  if (!sel || !medSpan) return;
  const tallaElegida = sel.value;
  const regex = new RegExp(`(?:T|Talla)?\\s*${tallaElegida}\\s*:\\s*([^,;]+)`, 'i');
  const match = p.medidas.match(regex);
  if (match) medSpan.innerHTML = `Medidas: ${match[1].trim()}`;
  else medSpan.innerHTML = `Medidas: ${p.medidas}`;
}

// Al cambiar la talla: se actualizan los colores disponibles para esa talla
function cambiarTalla(id) {
  const p = productos.find(x => x.id == id); if (!p) return;
  const selT = $(`sel-t-${id}`), selC = $(`sel-c-${id}`);
  if (!selT || !selC) return;
  const colores = coloresDeTalla(p, selT.value);
  const elegido = colores.includes(selC.value) ? selC.value : (colores.find(c => buscarVariante(p, selT.value, c).stock > 0) ?? colores[0]);
  selC.innerHTML = opcionesColores(colores, elegido);
  cambiarMedida(id);
  actualizarVariante(id);
}

function varianteElegida(p) {
  const selT = $(`sel-t-${p.id}`), selC = $(`sel-c-${p.id}`);
  if (!selT || !selC) return null;
  return buscarVariante(p, selT.value, selC.value) || null;
}

// Actualiza precio y botón de la tarjeta según la variante elegida
function actualizarVariante(id) {
  const p = productos.find(x => x.id == id); if (!p) return;
  const precioEl = $(`pr-${id}`), btn = $(`btn-${id}`);
  if (!precioEl || !btn) return;
  const v = varianteElegida(p);
  if (!v) { precioEl.textContent = "Elige talla y color"; btn.disabled = true; btn.textContent = "No disponible"; return; }
  precioEl.innerHTML = precioHTML(v.precio, p.precioAnterior);
  btn.disabled = v.stock <= 0;
  btn.textContent = v.stock <= 0 ? "Agotado" : "Agregar al carrito";
}


function renderBlogs() {
  if (!blogs.length) { $("blog-grid").innerHTML = `<p class="empty">Aún no hay entradas en el blog.</p>`; return; }
  $("blog-grid").innerHTML = blogs.map(b => {
    let imgs = "";
    if (b.imagen1) imgs += `<img src="${esc(b.imagen1)}" onerror="this.style.display='none'">`;
    if (b.imagen2) imgs += `<img src="${esc(b.imagen2)}" onerror="this.style.display='none'">`;
    return `<article class="blog-card"><div class="blog-imgs">${imgs}</div><div class="blog-body"><h3>${esc(b.titulo)}</h3><p>${esc(b.texto)}</p></div></article>`;
  }).join("");
}

function renderResenas() {
  if (!resenas.length) { $("resenas-list").innerHTML = `<p class="empty">No hay reseñas todavía.</p>`; return; }
  $("resenas-list").innerHTML = resenas.map(r => {
    let stars = ""; for(let i=1; i<=5; i++) stars += i <= r.estrellas ? "⭐" : "☆";
    return `<div class="resena-card"><div class="resena-header"><b>${esc(r.nombre)}</b> <span>${stars}</span></div><p>${esc(r.comentario)}</p></div>`;
  }).join("");
}

function guardarCarrito() { try { localStorage.setItem("athelle_cart", JSON.stringify(carrito)); } catch (e) {} }
function cargarCarrito() { try { carrito = JSON.parse(localStorage.getItem("athelle_cart")) || []; } catch (e) { carrito = []; } }

function agregar(id) {
  const p = productos.find(x => x.id == id); if (!p) return;

  let talla = "", color = "", precio = p.precio, disponible = p.stock;
  if (tieneVar(p)) {
    const v = varianteElegida(p);
    if (!v) { toast("Elige una talla y un color"); return; }
    talla = v.talla; color = v.color; precio = v.precio; disponible = v.stock;
  }
  if (disponible <= 0) { toast("Variante agotada"); return; }

  const it = carrito.find(c => c.id == id && c.talla === talla && c.color === color);
  const yaEnCarrito = tieneVar(p) ? (it ? it.qty : 0) : carrito.filter(c => c.id == id).reduce((sum, c) => sum + c.qty, 0);
  if (yaEnCarrito >= disponible) { toast("No hay más stock disponible"); return; }

  if (it) { it.qty++; it.precio = precio; }
  else carrito.push({ id: p.id, talla, color, precio, qty: 1 });

  renderCarrito();
  toast("Agregado al carrito");
}

function cambiar(id, talla, color, d) {
  const it = carrito.find(c => c.id == id && c.talla === talla && c.color === color);
  const p = productos.find(x => x.id == id);
  if (!it || !p) return;

  const disponible = tieneVar(p) ? (buscarVariante(p, talla, color)?.stock ?? 0) : p.stock;
  const nuevaQty = it.qty + d;
  if (nuevaQty > disponible) { toast("Stock máximo alcanzado"); return; }

  if (nuevaQty <= 0) carrito = carrito.filter(c => !(c.id == id && c.talla === talla && c.color === color));
  else it.qty = nuevaQty;
  renderCarrito();
}

function renderCarrito() {
  // Sincroniza el carrito con el catálogo actual (precio y stock de la variante exacta)
  carrito = carrito.filter(c => {
    const p = productos.find(x => x.id == c.id); if (!p) return false;
    if (tieneVar(p)) {
      const v = buscarVariante(p, c.talla, c.color);
      if (!v || v.stock <= 0) return false;
      c.precio = v.precio; c.qty = Math.min(c.qty, v.stock);
    } else { c.precio = p.precio; }
    return c.qty > 0;
  });

  let total = 0, n = 0;

  $("items").innerHTML = carrito.length ? carrito.map(c => {
    const p = productos.find(x => x.id == c.id);
    total += c.precio * c.qty; n += c.qty;

    let extras = [];
    if(c.talla) extras.push(`Talla: ${c.talla}`);
    if(c.color) extras.push(`Color: ${c.color}`);
    const textoExtras = extras.length ? `<span style="color:var(--lav); font-size:0.8rem; display:block;">${esc(extras.join(' | '))}</span>` : "";

    const keyBtn = `${c.id}|${c.talla || ''}|${c.color || ''}`;

    return `<div class="it">
      <img src="${esc(foto(p))}" data-name="${esc(p.nombre)}">
      <div class="inf">${esc(p.nombre)}${textoExtras}<div>${bs(c.precio)}</div>
        <div class="qty">
          <button data-m="${esc(keyBtn)}">−</button><span>${c.qty}</span><button data-p="${esc(keyBtn)}">+</button>
        </div>
      </div>
      <b>${bs(c.precio * c.qty)}</b>
    </div>`;
  }).join("") : `<p class="empty">Carrito vacío</p>`;

  document.querySelectorAll("#items img[data-name]").forEach(img => conFallback(img, img.dataset.name, 120, 120, 0));
  $("total").textContent = bs(total); $("badge").textContent = n; guardarCarrito();
}

async function pedirWhatsApp() {
  if (!carrito.length) { toast("Agrega productos primero"); return; }

  const pedidoId = "PED-" + Math.floor(1000 + Math.random() * 9000);
  const fecha = new Date().toLocaleString();
  let t = `¡Hola ATHELLE PETS! Quiero hacer el pedido *#${pedidoId}*:%0A%0A`, tot = 0, detStr = "";

  carrito.forEach(c => {
    const p = productos.find(x => x.id == c.id);
    tot += c.precio * c.qty;

    let extrasTxt = "";
    if(c.talla) extrasTxt += ` Talla:${c.talla}`;
    if(c.color) extrasTxt += ` Color:${c.color}`;

    detStr += `${c.qty}x ${p.nombre} (${extrasTxt.trim()}) (${bs(c.precio * c.qty)}) | `;
    t += `• ${c.qty} x ${encodeURIComponent(p.nombre)} -${extrasTxt ? encodeURIComponent(extrasTxt) : ""} - ${bs(c.precio * c.qty)}%0A`;
  });
  t += `%0A*Total:* ${bs(tot)}`;

  if (db && !offline) {
    try { await db.from('pedidos').insert([{ fecha, total: tot, detalle: detStr }]); } catch (e) { console.error(e); }
  }

  window.open(`https://wa.me/${WHATSAPP}?text=${t}`, "_blank");

  // Descontar stock: en la variante exacta (Talla+Color) o en el stock base si no hay variantes
  const ids = [...new Set(carrito.map(c => c.id))];
  for (const id of ids) {
    const p = productos.find(x => x.id == id); if (!p) continue;
    const items = carrito.filter(c => c.id == id);
    let variantes = p.variantes.map(v => ({ ...v })), stock = p.stock;

    // Se lee el producto fresco de Supabase para no pisar cambios recientes
    if (db && !offline) {
      try {
        const { data, error } = await db.from('productos').select('stock, variantes').eq('id', id).single();
        if (!error && data) { variantes = normalizarVariantes(data.variantes); stock = Number(data.stock) || 0; }
      } catch (e) { console.error(e); }
    }

    if (variantes.length) {
      items.forEach(c => {
        const v = variantes.find(x => x.talla === c.talla && x.color === c.color);
        if (v) v.stock = Math.max(0, v.stock - c.qty);
      });
      stock = variantes.reduce((s, v) => s + v.stock, 0);
    } else {
      stock = Math.max(0, stock - items.reduce((s, c) => s + c.qty, 0));
    }

    p.variantes = variantes; p.stock = stock;
    if (db && !offline) {
      try {
        const { error } = await db.from('productos').update(variantes.length ? { variantes, stock } : { stock }).eq('id', p.id);
        if (error) throw error;
      } catch (e) { console.error(e); }
    }
  }

  carrito = []; renderCarrito(); render(); renderAdmin(); await cargar();
  toast("Pedido #" + pedidoId + " enviado.");
}

function abrirOv(show) { $("ov").classList.toggle("on", show); }
function cerrarTodo() { ["drawer", "loginModal", "adm", "detModal"].forEach(i => $(i).classList.remove("on")); abrirOv(false); }
function cerrarDetalle() { $("detModal").classList.remove("on"); if (!$("adm").classList.contains("on")) { abrirOv(false); } }
function abrirLogin() { cerrarTodo(); $("loginUser").value = ""; $("loginPass").value = ""; $("loginModal").classList.add("on"); abrirOv(true); setTimeout(() => $("loginUser").focus(), 50); }
function validarLogin() {
  if ($("loginUser").value === ADMIN_USER && $("loginPass").value === ADMIN_PASS) {
    $("loginModal").classList.remove("on"); $("adm").classList.add("on"); abrirOv(true); renderAdmin();
  } else { toast("Datos incorrectos"); $("loginUser").value = ""; $("loginPass").value = ""; }
}

function renderAdmin() {
  $("f_cat").innerHTML = CATEGORIAS.map(c => `<option>${esc(c)}</option>`).join("");
  $("f_sub").innerHTML = `<option value="">Sin subcat</option>` + SUBS.map(s => `<option>${esc(s)}</option>`).join("");
  
  $("tbody").innerHTML = productos.map(p => {
    const nv = p.variantes.length;
    return `<tr>
    <td><img src="${esc(foto(p))}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;"><br><b>${esc(p.nombre)}</b></td>
    <td>${rangoPrecio(p)}</td><td>${stockTotal(p)}</td>
    <td>${nv ? nv + (nv === 1 ? " variante" : " variantes") : "—"}</td>
    <td style="white-space:nowrap">
      <button class="btn sm alt" data-v="${esc(p.id)}"><i class="fa-solid fa-eye"></i></button>
      <button class="btn sm" data-e="${esc(p.id)}"><i class="fa-solid fa-pen"></i></button>
      <button class="btn sm danger" data-d="${esc(p.id)}"><i class="fa-solid fa-trash"></i></button>
    </td>
  </tr>`;
  }).join("");

  $("tbody-pedidos").innerHTML = pedidos.length ? pedidos.map(pd => `<tr>
    <td><b>${esc(pd.id)}</b></td><td>${esc(pd.fecha)}</td><td>${bs(pd.total)}</td>
    <td><button class="btn sm alt" data-vp="${esc(pd.id)}"><i class="fa-solid fa-eye"></i></button></td>
  </tr>`).join("") : `<tr><td colspan="4" style="text-align:center;">No hay pedidos</td></tr>`;

  $("tbody-blog").innerHTML = blogs.length ? blogs.map(b => `<tr>
    <td><b>${esc(b.titulo)}</b></td>
    <td><button class="btn sm danger" data-db="${esc(b.id)}"><i class="fa-solid fa-trash"></i></button></td>
  </tr>`).join("") : `<tr><td colspan="2" style="text-align:center;">No hay entradas</td></tr>`;
  
  $("seed").style.display = (offline && db) ? "block" : "none";
  $("state").textContent = !db ? "Error de conexión. Revisa la consola (F12)." : (offline ? "Modo local: Supabase vacío o error." : `Conectado a Supabase (${productos.length} productos)`);
}

function verProducto(id) {
  const p = productos.find(x => x.id == id); if (!p) return;
  $("det_titulo").textContent = p.nombre;
  const vars = tieneVar(p)
    ? `<p><b>Variantes (${p.variantes.length}):</b></p><ul style="margin:0 0 .6rem 1.2rem; font-size:.88rem">${p.variantes.map(v => `<li>Talla ${esc(v.talla)}${v.color ? " · " + esc(v.color) : ""} — ${bs(v.precio)} — stock ${v.stock}</li>`).join("")}</ul>`
    : "";
  $("det_contenido").innerHTML = `<img src="${esc(foto(p))}" style="width:100%; border-radius:12px; margin-bottom:1rem;"><p><b>Precio:</b> ${rangoPrecio(p)}</p><p><b>Stock:</b> ${stockTotal(p)}</p>${vars}<p><b>Medidas:</b> ${esc(p.medidas) || 'N/A'}</p><p><b>Descripción:</b> ${esc(p.descripcion)}</p>`;
  $("detModal").classList.add("on"); abrirOv(true);
}

function verPedido(id) {
  const pd = pedidos.find(x => x.id == id); if (!pd) return;
  $("det_titulo").textContent = "Pedido #" + pd.id;
  $("det_contenido").innerHTML = `<p><b>Fecha:</b> ${esc(pd.fecha)}</p><p><b>Total:</b> ${bs(pd.total)}</p><p><b>Detalle:</b><br><span style="color:var(--lav)">${esc(pd.detalle)}</span></p>`;
  $("detModal").classList.add("on"); abrirOv(true);
}

// ---------- Variantes en el formulario del admin ----------
function sincronizarStock() {
  const filas = document.querySelectorAll("#variantes-list .var-row");
  const inp = $("f_stock");
  if (filas.length) {
    inp.value = Array.from(filas).reduce((s, f) => s + (parseInt(f.querySelector(".v-stock").value, 10) || 0), 0);
    inp.readOnly = true;
  } else { inp.readOnly = false; }
  $("var-vacio").style.display = filas.length ? "none" : "block";
}

function filaVariante(v = {}) {
  const tallas = (v.talla == null || TALLAS_ADMIN.includes(String(v.talla))) ? TALLAS_ADMIN : [...TALLAS_ADMIN, String(v.talla)];
  const div = document.createElement("div");
  div.className = "var-row";
  div.innerHTML = `
    <select class="v-talla">${tallas.map(t => `<option value="${esc(t)}" ${String(v.talla) === t ? "selected" : ""}>${t === "Única" ? "Única" : "Talla " + esc(t)}</option>`).join("")}</select>
    <input class="v-color" placeholder="Color" maxlength="30" value="${esc(v.color || "")}">
    <input class="v-precio" type="number" step="0.01" min="0" placeholder="Precio" value="${v.precio ?? ""}">
    <input class="v-stock" type="number" step="1" min="0" placeholder="Stock" value="${v.stock ?? ""}">
    <button type="button" class="x var-del" title="Quitar variante">✕</button>`;
  $("variantes-list").appendChild(div);
  sincronizarStock();
}

function leerVariantes() {
  const filas = Array.from(document.querySelectorAll("#variantes-list .var-row"));
  const vistos = new Set(), variantes = [];
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    const talla = f.querySelector(".v-talla").value;
    const color = f.querySelector(".v-color").value.trim();
    const precio = parseFloat(f.querySelector(".v-precio").value);
    const stock = parseInt(f.querySelector(".v-stock").value, 10);
    if (isNaN(precio) || precio < 0) return { error: `Variante ${i + 1}: ingresa un precio válido.` };
    if (isNaN(stock) || stock < 0) return { error: `Variante ${i + 1}: ingresa un stock válido.` };
    const clave = talla + "|" + color.toLowerCase();
    if (vistos.has(clave)) return { error: `Variante ${i + 1}: la combinación ${talla} + ${color || "sin color"} está repetida.` };
    vistos.add(clave);
    variantes.push({ talla, color, precio, stock });
  }
  return { variantes };
}

function limpiarForm() {
  $("form").reset(); $("f_id").value = ""; $("ftitle").textContent = "Nuevo producto"; $("f_prev").src = "";
  $("variantes-list").innerHTML = ""; sincronizarStock();
}

function editar(id) {
  const p = productos.find(x => x.id == id); if (!p) return;
  $("f_id").value = p.id; $("f_nombre").value = p.nombre; $("f_precio").value = p.precio; $("f_ant").value = p.precioAnterior || "";
  $("f_cat").value = p.categoria; $("f_sub").value = p.subcategoria || ""; $("f_stock").value = p.stock; $("f_img").value = p.imagen || ""; $("f_desc").value = p.descripcion;
  $("f_medidas").value = p.medidas || "";

  $("variantes-list").innerHTML = "";
  p.variantes.forEach(v => filaVariante(v));
  sincronizarStock();
  $("ftitle").textContent = "Editando: " + p.nombre; $("f_prev").src = foto(p);
}

async function guardarForm(e) {
  e.preventDefault();
  if (!db) { toast("No hay conexión a la base de datos."); return; }

  const id = $("f_id").value;
  const lectura = leerVariantes();
  if (lectura.error) { toast(lectura.error); return; }
  const variantes = lectura.variantes;

  // Precio base: el que se escriba, o el más bajo de las variantes si se deja vacío
  let precio = parseFloat($("f_precio").value);
  if (isNaN(precio) && variantes.length) precio = Math.min(...variantes.map(v => v.precio));
  if (isNaN(precio)) { toast("Ingresa el precio base del producto."); return; }

  const p = {
    nombre: $("f_nombre").value.trim(),
    precio,
    precioAnterior: parseFloat($("f_ant").value)||0,
    categoria: $("f_cat").value,
    subcategoria: $("f_sub").value,
    imagen: $("f_img").value.trim(),
    stock: variantes.length ? variantes.reduce((s, v) => s + v.stock, 0) : (parseInt($("f_stock").value, 10) || 0),
    descripcion: $("f_desc").value.trim(),
    medidas: $("f_medidas").value.trim(),
    variantes,
    ...camposLegacy(variantes)
  };

  try {
    const { error } = id ? await db.from('productos').update(p).eq('id', id) : await db.from('productos').insert([p]);
    if (error) throw error;
    toast(id ? "Actualizado" : "Creado"); limpiarForm(); await cargar();
  } catch (err) {
    console.error(err);
    toast(/variantes/i.test(err.message || "") ? "Falta la columna 'variantes' en Supabase (ejecuta el SQL)." : "Error: " + (err.message || "revisa la consola"));
  }
}

async function borrar(id) {
  if (!confirm("¿Eliminar producto?")) return;
  try { await db.from('productos').delete().eq('id', id); toast("Eliminado"); await cargar(); } catch (err) { toast("Error"); }
}

async function borrarBlog(id) {
  if (!confirm("¿Eliminar entrada del blog?")) return;
  try { await db.from('blog').delete().eq('id', id); toast("Eliminado"); await cargar(); } catch (err) { toast("Error"); }
}

async function subirEjemplo() {
  if (!confirm("Subir productos de prueba a Supabase?")) return;
  try {
    for (const p of RESPALDO) {
      const { id, ...prod } = p;
      const { error } = await db.from('productos').insert([{ ...prod, ...camposLegacy(prod.variantes) }]);
      if (error) throw error;
    }
    toast("Ejemplos subidos"); await cargar();
  } catch (err) { console.error(err); toast("Error al subir"); }
}

$("public-blog-form").addEventListener("submit", async (e) => {
  e.preventDefault(); if (!db) return toast("Sin conexión");
  const b = { titulo: $("pb_titulo").value.trim(), texto: $("pb_texto").value.trim(), imagen1: $("pb_img1").value.trim(), imagen2: $("pb_img2").value.trim() };
  try { await db.from('blog').insert([b]); toast("¡Publicado!"); $("public-blog-form").reset(); await cargar(); } catch (err) { toast("Error"); }
});

$("public-resena-form").addEventListener("submit", async (e) => {
  e.preventDefault(); if (!db) return toast("Sin conexión");
  const r = { nombre: $("pr_nombre").value.trim(), estrellas: parseInt($("pr_estrellas").value), comentario: $("pr_comentario").value.trim() };
  try { await db.from('resenas').insert([r]); toast("¡Gracias!"); $("public-resena-form").reset(); await cargar(); } catch (err) { toast("Error"); }
});

let clicks = 0, tmr;
$("logo").addEventListener("click", () => { clicks++; clearTimeout(tmr); tmr = setTimeout(() => clicks = 0, 2000); if (clicks >= 5) { clicks = 0; abrirLogin(); } });

document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") { e.preventDefault(); abrirLogin(); }
  if (e.key === "Escape") { if ($("detModal").classList.contains("on")) cerrarDetalle(); else cerrarTodo(); }
});

$("loginOk").onclick = validarLogin; $("loginCancel").onclick = cerrarTodo; $("admX").onclick = cerrarTodo; $("ov").onclick = cerrarTodo; $("det_close").onclick = cerrarDetalle; 
$("openCart").onclick = () => { $("drawer").classList.add("on"); abrirOv(true); };
$("closeCart").onclick = cerrarTodo; $("wa").onclick = pedirWhatsApp; $("clear").onclick = () => { carrito = []; renderCarrito(); };
$("q").addEventListener("input", render); $("sort").addEventListener("change", render); $("onlyOffer").addEventListener("change", render);
$("f_img").addEventListener("input", (e) => $("f_prev").src = e.target.value || ph("Sin foto", 120, 120, 1));
$("form").addEventListener("submit", guardarForm); $("fcancel").onclick = limpiarForm; $("seed").onclick = subirEjemplo;

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("on"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("on"));
    btn.classList.add("on"); $(btn.dataset.tab).classList.add("on");
  };
});

document.addEventListener("click", e => {
  const t = e.target.closest("[data-c],[data-add],[data-m],[data-p],[data-e],[data-d],[data-v],[data-vp],[data-db]");
  if (!t) return;
  
  if (t.dataset.c) { catSel = t.dataset.c; subSel = t.dataset.s || "Todos"; render(); }
  else if (t.dataset.add) agregar(t.dataset.add);
  else if (t.dataset.m) { const [id, talla, color] = t.dataset.m.split('|'); cambiar(id, talla, color, -1); }
  else if (t.dataset.p) { const [id, talla, color] = t.dataset.p.split('|'); cambiar(id, talla, color, 1); }
  else if (t.dataset.e) editar(t.dataset.e);
  else if (t.dataset.d) borrar(t.dataset.d);
  else if (t.dataset.v) verProducto(t.dataset.v);
  else if (t.dataset.vp) verPedido(t.dataset.vp);
  else if (t.dataset.db) borrarBlog(t.dataset.db);
});


// Variantes (admin)
$("addVar").onclick = () => filaVariante();
$("variantes-list").addEventListener("click", e => {
  const b = e.target.closest(".var-del");
  if (b) { b.closest(".var-row").remove(); sincronizarStock(); }
});
$("variantes-list").addEventListener("input", sincronizarStock);

pintarImagenes(); cargarCarrito(); cargar();