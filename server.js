import { createServer } from 'node:http';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, createReadStream, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const rootDir = resolve('.');
const envPath = join(rootDir, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}
const seedDataDir = join(rootDir, 'data');
const dataDir = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : seedDataDir;
const publicDir = join(rootDir, 'public');
const uploadRoot = process.env.DATA_DIR ? join(dataDir, 'uploads') : join(publicDir, 'uploads');
const uploadDir = join(uploadRoot, 'products');
const distDir = join(rootDir, 'dist');
const productsPath = join(dataDir, 'products.json');
const ordersPath = join(dataDir, 'orders.json');
const categoriesPath = join(dataDir, 'categories.json');
const shippingPath = join(dataDir, 'shipping.json');
const materialsPath = join(dataDir, 'materials.json');
const PORT = Number(process.env.PORT || 8791);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_NOTIFY_TO = String(process.env.WHATSAPP_NOTIFY_TO || '').replace(/\D/g, '');

mkdirSync(dataDir, { recursive: true });
for (const filename of ['products.json', 'orders.json', 'categories.json', 'shipping.json', 'materials.json']) {
  const seedPath = join(seedDataDir, filename);
  const runtimePath = join(dataDir, filename);
  if (!existsSync(runtimePath) && existsSync(seedPath)) {
    copyFileSync(seedPath, runtimePath);
  }
}
mkdirSync(uploadDir, { recursive: true });

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

const readJsonFile = (path, fallback) => {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8') || JSON.stringify(fallback));
};

const writeJsonFile = (path, value) => {
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, stripe-signature',
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) =>
  readTextBody(request).then((body) => {
    try {
      return JSON.parse(body || '{}');
    } catch {
      throw new Error('Некорректный JSON');
    }
  });

const readTextBody = (request) =>
  new Promise((resolveBody, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 15_000_000) {
        reject(new Error('Слишком большой запрос'));
        request.destroy();
      }
    });
    request.on('end', () => resolveBody(body));
  });

const isAdmin = (request) => Boolean(ADMIN_PASSWORD)
  && request.headers['x-admin-password'] === ADMIN_PASSWORD;

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-|-$/g, '') || randomUUID();

const normalizeProduct = (product) => ({
  id: product.id || randomUUID(),
  slug: product.slug || slugify(product.name),
  name: String(product.name || '').trim(),
  nameEn: String(product.nameEn || '').trim(),
  price: Number(product.price || 0),
  currency: String(product.currency || 'EUR'),
  category: String(product.category || 'Украшения'),
  era: String(product.era || ''),
  eraEn: String(product.eraEn || ''),
  material: String(product.material || ''),
  materialEn: String(product.materialEn || ''),
  materialIds: Array.isArray(product.materialIds) ? product.materialIds.map(String) : [],
  stone: String(product.stone || ''),
  stoneEn: String(product.stoneEn || ''),
  quantity: product.quantity === undefined || product.quantity === null || product.quantity === ''
    ? (product.status === 'sold' ? 0 : 1)
    : Math.max(0, Number.parseInt(product.quantity, 10) || 0),
  status: product.status === 'sold' || product.status === 'reserved' ? product.status : 'available',
  image: String(product.image || ''),
  images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
  description: String(product.description || ''),
  descriptionEn: String(product.descriptionEn || ''),
  details: Array.isArray(product.details) ? product.details : [],
  detailsEn: Array.isArray(product.detailsEn) ? product.detailsEn : [],
  materialGlossary: Array.isArray(product.materialGlossary) ? product.materialGlossary
    .map((entry) => ({
      term: String(entry?.term || '').trim(),
      definition: String(entry?.definition || '').trim(),
      url: String(entry?.url || '').trim(),
    }))
    .filter((entry) => entry.term && (entry.definition || entry.url)) : [],
});

const products = () => readJsonFile(productsPath, []).map(normalizeProduct);
const orders = () => readJsonFile(ordersPath, []);
const categories = () => readJsonFile(categoriesPath, { productTypes: [], priceRanges: [], eras: [] });
const shipping = () => readJsonFile(shippingPath, []);
const materials = () => readJsonFile(materialsPath, []);

const normalizeMaterial = (material) => ({
  id: material.id || randomUUID(),
  slug: material.slug || slugify(material.name),
  name: String(material.name || '').trim(),
  nameEn: String(material.nameEn || '').trim(),
  description: String(material.description || '').trim(),
  descriptionEn: String(material.descriptionEn || '').trim(),
  aliases: Array.isArray(material.aliases) ? material.aliases.map((alias) => String(alias).trim()).filter(Boolean) : [],
  image: String(material.image || '').trim(),
  sourceUrl: String(material.sourceUrl || '').trim(),
});

const handleMaterials = async (request, response) => {
  if (request.method === 'GET') {
    sendJson(response, 200, { materials: materials() });
    return;
  }
  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }
  if (request.method === 'POST') {
    const payload = await readBody(request);
    const current = materials();
    const material = normalizeMaterial(payload.material || {});
    current.push(material);
    writeJsonFile(materialsPath, current);
    sendJson(response, 201, { material });
    return;
  }
  sendJson(response, 405, { error: 'Метод не поддерживается' });
};

const handleMaterialById = async (request, response, id) => {
  const current = materials();
  const index = current.findIndex((material) => material.id === id);
  if (index === -1) {
    sendJson(response, 404, { error: 'Материал не найден' });
    return;
  }
  if (request.method === 'GET') {
    sendJson(response, 200, { material: current[index] });
    return;
  }
  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }
  if (request.method === 'PUT') {
    const payload = await readBody(request);
    current[index] = normalizeMaterial({ ...current[index], ...(payload.material || {}), id });
    writeJsonFile(materialsPath, current);
    sendJson(response, 200, { material: current[index] });
    return;
  }
  if (request.method === 'DELETE') {
    if (products().some((product) => (product.materialIds || []).includes(id))) {
      sendJson(response, 409, { error: 'Материал используется в товарах. Сначала уберите его из карточек товаров.' });
      return;
    }
    const [removed] = current.splice(index, 1);
    writeJsonFile(materialsPath, current);
    sendJson(response, 200, { material: removed });
    return;
  }
  sendJson(response, 405, { error: 'Метод не поддерживается' });
};

const orderAmount = (order) =>
  Math.round((Number(order.total) || order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0)) * 100);

const updateOrderById = (id, patch) => {
  const current = orders();
  const index = current.findIndex((order) => order.id === id);
  if (index === -1) return null;
  current[index] = { ...current[index], ...patch, updatedAt: new Date().toISOString() };
  writeJsonFile(ordersPath, current);
  return current[index];
};

const inventoryShouldBeDeducted = (order) =>
  order.paymentStatus === 'Оплачен' || order.status === 'Завершен';

const deductOrderInventory = (order) => {
  if (!order || order.inventoryDeductedAt || !inventoryShouldBeDeducted(order)) return order;
  const currentProducts = products();
  let changed = false;

  for (const item of order.items || []) {
    const product = currentProducts.find((candidate) => candidate.id === item.id);
    if (!product) continue;
    const soldQuantity = Math.max(1, Number(item.quantity || 1));
    product.quantity = Math.max(0, Number(product.quantity || 0) - soldQuantity);
    if (product.quantity === 0) product.status = 'sold';
    changed = true;
  }

  if (changed) writeJsonFile(productsPath, currentProducts);
  return { ...order, inventoryDeductedAt: new Date().toISOString() };
};

const publicOrigin = (request) => {
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const proto = request.headers['x-forwarded-proto'] || (String(host || '').includes('localhost') || String(host || '').includes('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}`;
};

const stripePost = async (path, body) => {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Stripe не смог создать оплату');
  }
  return data;
};

const stripeSafeText = (value, fallback = 'Antique Treasures') => {
  const text = String(value || fallback)
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || fallback;
};

const orderCustomerName = (order) =>
  [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Имя не указано';

const orderAdminLink = (order, request) => {
  const origin = ADMIN_BASE_URL || publicOrigin(request);
  return `${origin.replace(/\/$/, '')}/admin?order=${encodeURIComponent(order.id)}`;
};

const notifyWhatsAppNewOrder = async (order, request) => {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_NOTIFY_TO) {
    console.info('WhatsApp notification skipped: missing WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_NOTIFY_TO');
    return;
  }

  const itemNames = Array.isArray(order.items)
    ? order.items.map((item) => item.name || item.nameEn || 'Товар').join(', ')
    : 'Товар';
  const text = [
    `Новый заказ ${order.id}`,
    `Товар: ${itemNames}`,
    `Сумма: ${order.total} ${order.currency}`,
    `Клиент: ${orderCustomerName(order)}`,
    `Телефон: ${order.customer?.phone || 'не указан'}`,
    `Админка: ${orderAdminLink(order, request)}`,
  ].join('\n');

  const apiResponse = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: WHATSAPP_NOTIFY_TO,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  });

  if (!apiResponse.ok) {
    const details = await apiResponse.text();
    throw new Error(`WhatsApp notification failed: ${apiResponse.status} ${details}`);
  }
};

const verifyStripeSignature = (rawBody, signatureHeader) => {
  if (!STRIPE_WEBHOOK_SECRET || !signatureHeader) return false;
  const parts = Object.fromEntries(String(signatureHeader).split(',').map((part) => part.split('=')));
  if (!parts.t || !parts.v1) return false;
  const signedPayload = `${parts.t}.${rawBody}`;
  const expected = createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');
  const actualBuffer = Buffer.from(parts.v1, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
};

const handleProducts = async (request, response) => {
  if (request.method === 'GET') {
    sendJson(response, 200, { products: products() });
    return;
  }

  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }

  if (request.method === 'POST') {
    const payload = await readBody(request);
    const current = products();
    const product = normalizeProduct(payload.product || {});
    current.unshift(product);
    writeJsonFile(productsPath, current);
    sendJson(response, 201, { product });
    return;
  }

  sendJson(response, 405, { error: 'Метод не поддерживается' });
};

const handleProductById = async (request, response, id) => {
  const current = products();
  const index = current.findIndex((product) => product.id === id);

  if (index === -1) {
    sendJson(response, 404, { error: 'Товар не найден' });
    return;
  }

  if (request.method === 'GET') {
    sendJson(response, 200, { product: current[index] });
    return;
  }

  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }

  if (request.method === 'PUT') {
    const payload = await readBody(request);
    current[index] = normalizeProduct({ ...current[index], ...(payload.product || {}) });
    writeJsonFile(productsPath, current);
    sendJson(response, 200, { product: current[index] });
    return;
  }

  if (request.method === 'DELETE') {
    const [removed] = current.splice(index, 1);
    writeJsonFile(productsPath, current);
    sendJson(response, 200, { product: removed });
    return;
  }

  sendJson(response, 405, { error: 'Метод не поддерживается' });
};

const handleUpload = async (request, response) => {
  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }

  const payload = await readBody(request);
  const dataUrl = String(payload.dataUrl || '');
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) {
    sendJson(response, 400, { error: 'Поддерживаются только изображения png, jpg, webp' });
    return;
  }

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const filename = `${Date.now()}-${slugify(payload.filename || 'product')}.${ext}`;
  writeFileSync(join(uploadDir, filename), Buffer.from(match[2], 'base64'));
  sendJson(response, 201, { url: `/uploads/products/${filename}` });
};

const handleOrders = async (request, response) => {
  if (request.method === 'POST') {
    const payload = await readBody(request);
    const order = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Новый заказ',
      paymentStatus: payload.paymentMethod === 'card' ? 'Ожидает оплаты' : 'Ожидает подтверждения',
      customer: {
        firstName: String(payload.customer?.firstName || '').trim(),
        lastName: String(payload.customer?.lastName || '').trim(),
        phone: String(payload.customer?.phone || '').trim(),
        email: String(payload.customer?.email || '').trim(),
        city: String(payload.customer?.city || '').trim(),
        address: String(payload.customer?.address || '').trim(),
      },
      paymentMethod: String(payload.paymentMethod || 'bank'),
      items: Array.isArray(payload.items) ? payload.items : [],
      total: Number(payload.total || 0),
      currency: 'EUR',
      comment: String(payload.comment || ''),
    };

    const current = orders();
    current.unshift(order);
    writeJsonFile(ordersPath, current);
    notifyWhatsAppNewOrder(order, request).catch((error) => console.error(error.message));
    sendJson(response, 201, { order });
    return;
  }

  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const query = String(url.searchParams.get('query') || '').toLowerCase();
  const status = String(url.searchParams.get('status') || '');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  let result = orders();

  if (query) {
    result = result.filter((order) => {
      const firstName = order.customer?.firstName || '';
      const lastName = order.customer?.lastName || '';
      const itemNames = Array.isArray(order.items) ? order.items.map((item) => item.name || item.nameEn || '').join(' ') : '';
      return [order.id, lastName, firstName, `${firstName} ${lastName}`, `${lastName} ${firstName}`, order.customer?.phone, order.customer?.email, itemNames]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  if (status) {
    result = result.filter((order) => order.status === status);
  }

  if (dateFrom) {
    result = result.filter((order) => order.createdAt.slice(0, 10) >= dateFrom);
  }

  if (dateTo) {
    result = result.filter((order) => order.createdAt.slice(0, 10) <= dateTo);
  }

  sendJson(response, 200, { orders: result });
};

const handleCreateCheckoutSession = async (request, response) => {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Метод не поддерживается' });
    return;
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('Stripe checkout unavailable: missing or invalid STRIPE_SECRET_KEY');
    sendJson(response, 503, { error: 'Stripe payment is not configured on the server' });
    return;
  }

  const payload = await readBody(request);
  const order = orders().find((item) => item.id === payload.orderId);

  if (!order) {
    sendJson(response, 404, { error: 'Заказ не найден' });
    return;
  }

  if (!Array.isArray(order.items) || !order.items.length || orderAmount(order) <= 0) {
    sendJson(response, 400, { error: 'В заказе нет товаров для оплаты' });
    return;
  }

  const origin = publicOrigin(request);
  const params = new URLSearchParams({
    mode: 'payment',
    success_url: `${origin}/checkout-success?order_id=${encodeURIComponent(order.id)}`,
    cancel_url: `${origin}/checkout-cancel?order_id=${encodeURIComponent(order.id)}`,
    client_reference_id: order.id,
    'metadata[orderId]': order.id,
    'payment_intent_data[metadata][orderId]': order.id,
  });

  if (order.customer?.email) {
    params.set('customer_email', order.customer.email);
  }

  order.items.forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, String(item.quantity || 1));
    params.set(`line_items[${index}][price_data][currency]`, String(item.currency || order.currency || 'EUR').toLowerCase());
    params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(item.price || 0) * 100)));
    params.set(`line_items[${index}][price_data][product_data][name]`, stripeSafeText(item.nameEn || item.name, 'Antique Treasures item'));
  });

  try {
    const session = await stripePost('/v1/checkout/sessions', params);
    updateOrderById(order.id, { stripeSessionId: session.id, paymentStatus: 'Ожидает оплаты' });
    sendJson(response, 200, { url: session.url, sessionId: session.id });
  } catch (error) {
    console.error(`Stripe checkout failed for ${order.id}:`, error);
    sendJson(response, 502, { error: 'Stripe payment is temporarily unavailable' });
  }
};

const handleStripeWebhook = async (request, response) => {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Метод не поддерживается' });
    return;
  }

  const rawBody = await readTextBody(request);
  if (!verifyStripeSignature(rawBody, request.headers['stripe-signature'])) {
    sendJson(response, 400, { error: 'Stripe signature не прошла проверку' });
    return;
  }

  const event = JSON.parse(rawBody || '{}');
  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (orderId) {
      const updatedOrder = updateOrderById(orderId, {
        paymentStatus: 'Оплачен',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
      });
      if (updatedOrder) updateOrderById(orderId, deductOrderInventory(updatedOrder));
    }
  }

  sendJson(response, 200, { received: true });
};

const handleOrderById = async (request, response, id) => {
  if (!isAdmin(request)) {
    sendJson(response, 401, { error: 'Нужен пароль администратора' });
    return;
  }

  const current = orders();
  const index = current.findIndex((order) => order.id === id);

  if (index === -1) {
    sendJson(response, 404, { error: 'Заказ не найден' });
    return;
  }

  if (request.method === 'PUT') {
    const payload = await readBody(request);
    current[index] = {
      ...current[index],
      status: String(payload.status || current[index].status || 'Новый заказ'),
      paymentStatus: String(payload.paymentStatus || current[index].paymentStatus || 'Ожидает подтверждения'),
      managerComment: String(payload.managerComment || ''),
      updatedAt: new Date().toISOString(),
    };
    current[index] = deductOrderInventory(current[index]);
    writeJsonFile(ordersPath, current);
    sendJson(response, 200, { order: current[index] });
    return;
  }

  if (request.method === 'GET') {
    sendJson(response, 200, { order: current[index] });
    return;
  }

  sendJson(response, 405, { error: 'Метод не поддерживается' });
};

const serveStatic = (request, response) => {
  const urlPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const baseDir = urlPath.startsWith('/uploads') ? uploadRoot : distDir;
  const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
  const requestedPath = resolve(join(baseDir, cleanPath.replace(/^\/uploads/, '/')));
  const filePath = requestedPath.startsWith(baseDir) && existsSync(requestedPath)
    ? requestedPath
    : join(distDir, 'index.html');

  if (!existsSync(filePath)) {
    sendJson(response, 404, { error: 'Файл не найден. Для production сначала выполните npm run build.' });
    return;
  }

  const extension = extname(filePath);
  const contentType = mimeTypes[extension] || 'application/octet-stream';

  if (extension === '.mp4') {
    const { size } = statSync(filePath);
    const range = request.headers.range;

    if (range) {
      const [startText, endText] = range.replace(/bytes=/, '').split('-');
      const start = Number(startText);
      const end = endText ? Number(endText) : Math.min(start + 1024 * 1024, size - 1);

      if (Number.isNaN(start) || start >= size || end >= size) {
        response.writeHead(416, { 'Content-Range': `bytes */${size}` });
        response.end();
        return;
      }

      response.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Type': contentType,
      });
      createReadStream(filePath, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Content-Length': size,
      'Content-Type': contentType,
    });
    createReadStream(filePath).pipe(response);
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentType,
  });
  createReadStream(filePath).pipe(response);
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {});
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === '/api/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }

    if (url.pathname === '/api/products') {
      await handleProducts(request, response);
      return;
    }

    if (url.pathname === '/api/categories') {
      sendJson(response, 200, { categories: categories() });
      return;
    }

    if (url.pathname === '/api/materials') {
      await handleMaterials(request, response);
      return;
    }

    if (url.pathname.startsWith('/api/materials/')) {
      await handleMaterialById(request, response, decodeURIComponent(url.pathname.split('/').pop()));
      return;
    }

    if (url.pathname === '/api/shipping') {
      sendJson(response, 200, { shipping: shipping() });
      return;
    }

    if (url.pathname.startsWith('/api/products/')) {
      await handleProductById(request, response, decodeURIComponent(url.pathname.split('/').pop()));
      return;
    }

    if (url.pathname === '/api/upload') {
      await handleUpload(request, response);
      return;
    }

    if (url.pathname === '/api/create-checkout-session') {
      await handleCreateCheckoutSession(request, response);
      return;
    }

    if (url.pathname === '/api/stripe-webhook') {
      await handleStripeWebhook(request, response);
      return;
    }

    if (url.pathname === '/api/orders') {
      await handleOrders(request, response);
      return;
    }

    if (url.pathname.startsWith('/api/orders/')) {
      await handleOrderById(request, response, decodeURIComponent(url.pathname.split('/').pop()));
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    console.error('Unhandled server error:', error);
    sendJson(response, 500, { error: 'Server error. Please try again shortly.' });
  }
});

server.listen(PORT, () => {
  console.log(`Магазин антикварных украшений запущен: http://localhost:${PORT}`);
});
