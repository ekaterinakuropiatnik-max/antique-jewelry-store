import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import heroVideo from '../video/8087665-uhd_4096_2160_24fps.mp4?url';

const api = {
  async products() {
    const response = await fetch('/api/products');
    return (await response.json()).products || [];
  },
  async categories() {
    const response = await fetch('/api/categories');
    return (await response.json()).categories || { productTypes: [], priceRanges: [], eras: [] };
  },
  async materials() {
    const response = await fetch('/api/materials');
    return (await response.json()).materials || [];
  },
  async saveMaterial(material, password, id) {
    const response = await fetch(id ? `/api/materials/${id}` : '/api/materials', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ material }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось сохранить материал');
    return data.material;
  },
  async deleteMaterial(id, password) {
    const response = await fetch(`/api/materials/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось удалить материал');
    return data.material;
  },
  async shipping() {
    const response = await fetch('/api/shipping');
    return (await response.json()).shipping || [];
  },
  async saveProduct(product, password, id) {
    const response = await fetch(id ? `/api/products/${id}` : '/api/products', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ product }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось сохранить товар');
    return data.product;
  },
  async deleteProduct(id, password) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось удалить товар');
    return data.product;
  },
  async upload(file, password) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ filename: file.name, dataUrl }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить фото');
    return data.url;
  },
  async createOrder(order) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось оформить заказ');
    return data.order;
  },
  async createCheckoutSession(orderId, language) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, language }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось открыть оплату Stripe');
    return data;
  },
  async orders(password, filters) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/orders?${params}`, {
      headers: { 'x-admin-password': password },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить заказы');
    return data.orders || [];
  },
  async updateOrder(id, payload, password) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось обновить заказ');
    return data.order;
  },
};

const languages = {
  en: { flag: '🇬🇧', label: 'English' },
  ru: { flag: '🇷🇺', label: 'Русский' },
};

const copy = {
  en: {
    brand: 'Antique Treasures',
    shop: 'Shop',
    about: 'About',
    archive: 'Archive of rarities',
    materialsGuide: 'Antique Guide',
    search: 'Search',
    searchPlaceholder: 'Name, stone, metal, era',
    clear: 'Clear',
    signIn: 'Admin',
    cart: 'Cart',
    menu: 'Menu',
    heroTitle: 'Welcome to Antique Treasures',
    heroKicker: 'Curated antique and vintage pieces',
    heroButton: 'Enter Shop',
    viewAll: 'View all',
    pieces: 'pieces',
    resetFilters: 'Reset filters',
    productType: 'Product type',
    price: 'Price',
    era: 'Era',
    metal: 'Materials & Craft',
    backToCatalog: 'Back to shop',
    material: 'Materials & Craft',
    stone: 'Stone',
    status: 'Status',
    reserved: 'reserved',
    available: 'available',
    уточняется: 'to be confirmed',
    addToCart: 'Add to cart',
    addedToCart: 'Added to cart',
    exclusivePiece: 'Exclusive piece',
    archiveTitle: 'Archive of rarities',
    archiveLead: 'A record of exceptional pieces that have passed through our collection.',
    archivedPiece: 'From the archive · Sold',
    materialsTitle: 'Antique Guide',
    materialsLead: 'Discover rare, historic, and unusual materials found in antique objects.',
    readMore: 'Read more',
    source: 'External source',
    relatedPieces: 'Pieces featuring this material',
    cartTitle: 'Cart',
    emptyCart: 'Your cart is empty.',
    remove: 'Remove',
    total: 'Total',
    checkout: 'Checkout',
    checkoutTitle: 'Checkout',
    dataProtection: 'Datenschutz',
    impressum: 'Impressum',
    withdrawal: 'Returns',
    terms: 'AGB',
    ringSizeGuide: 'International ring size guide',
    ringSizeNote: 'Ring sizes can vary slightly depending on band width and antique construction. If you are unsure, contact us before ordering.',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'Email',
    city: 'City',
    address: 'Delivery address',
    paymentMethod: 'Payment method',
    bank: 'Bank transfer',
    card: 'Online card payment',
    invoice: 'Invoice after confirmation',
    payAmount: 'Amount due',
    confirmOrder: 'Confirm order',
    redirectingToPayment: 'Opening secure Stripe payment...',
    paymentSetupError: 'Card payment is temporarily unavailable. Please contact us or try again shortly.',
    tryAgain: 'Try again',
    paymentSuccessTitle: 'Payment received',
    paymentSuccessText: 'Thank you. Your order has been paid successfully, and we will prepare the confirmation.',
    paymentCancelTitle: 'Payment was not completed',
    paymentCancelText: 'Your order was saved, but the payment was cancelled. You can contact us or place the order again.',
    backToShop: 'Back to shop',
    orderSaved: (id) => `Order ${id} has been saved. We will contact you to confirm payment.`,
    checkoutSteps: ['Details', 'Delivery', 'Payment', 'Review'],
    personalTitle: 'Your details',
    personalLead: 'Tell us where we can send your order confirmation.',
    deliveryTitle: 'Insured delivery',
    deliveryLead: 'Your treasure will be carefully packed and shipped with Austrian Post.',
    country: 'Country',
    postalCode: 'Postal code',
    streetAddress: 'Street and house number',
    shippingCostNote: 'Delivery cost is calculated individually and depends on the value, insurance, weight, and destination of the parcel.',
    shippingFinalNote: 'We will confirm the exact delivery price before dispatch.',
    paymentTitle: 'Choose a payment method',
    paymentLead: 'All payment details are processed securely.',
    cardAndWallets: 'Card or digital wallet',
    cardAndWalletsNote: 'Visa, Mastercard, Apple Pay or Google Pay when supported by your device.',
    bankNote: 'We will send the payment details after reviewing your order.',
    reviewTitle: 'Review your order',
    reviewLead: 'Please confirm that all information is correct before placing the order.',
    contactDetails: 'Contact details',
    deliveryDetails: 'Delivery address',
    edit: 'Edit',
    next: 'Continue',
    back: 'Back',
    placeOrder: 'Confirm and continue to payment',
    secureCheckout: 'Secure checkout',
    austriaPost: 'AUSTRIAN POST',
  },
  ru: {
    brand: 'Antique Treasures',
    shop: 'Магазин',
    about: 'О нас',
    archive: 'Архив редкостей',
    materialsGuide: 'Антикварный гид',
    search: 'Поиск',
    searchPlaceholder: 'Название, камень, металл, эпоха',
    clear: 'Очистить',
    signIn: 'Администратор',
    cart: 'Корзина',
    menu: 'Меню',
    heroTitle: 'Добро пожаловать в Antique Treasures',
    heroKicker: 'Избранные антикварные и винтажные украшения',
    heroButton: 'В магазин',
    viewAll: 'Посмотреть все',
    pieces: 'предметов',
    resetFilters: 'Сбросить фильтры',
    productType: 'Тип товара',
    price: 'Цена',
    era: 'Эпоха',
    metal: 'Состав и материалы',
    backToCatalog: 'Назад к каталогу',
    material: 'Состав и материалы',
    stone: 'Камень',
    status: 'Статус',
    reserved: 'зарезервировано',
    available: 'в наличии',
    уточняется: 'уточняется',
    addToCart: 'Добавить в корзину',
    addedToCart: 'Добавлено в корзину',
    exclusivePiece: 'Эксклюзивный товар',
    archiveTitle: 'Архив редкостей',
    archiveLead: 'История исключительных предметов, которые побывали в нашей коллекции.',
    archivedPiece: 'Из архива · Продано',
    materialsTitle: 'Антикварный гид',
    materialsLead: 'Редкие, исторические и необычные материалы, встречающиеся в антикварных предметах.',
    readMore: 'Читать подробнее',
    source: 'Внешний источник',
    relatedPieces: 'Предметы из этого материала',
    cartTitle: 'Корзина',
    emptyCart: 'Корзина пока пустая.',
    remove: 'Удалить',
    total: 'Итого',
    checkout: 'Оформить заказ',
    checkoutTitle: 'Оформление заказа',
    dataProtection: 'Datenschutz',
    impressum: 'Impressum',
    withdrawal: 'Возврат',
    terms: 'AGB',
    ringSizeGuide: 'Международная таблица размеров колец',
    ringSizeNote: 'Размеры колец могут немного отличаться из-за ширины шинок и особенностей старинной ручной работы. Если сомневаетесь, свяжитесь с нами до заказа.',
    firstName: 'Имя',
    lastName: 'Фамилия',
    phone: 'Телефон',
    email: 'Email',
    city: 'Город',
    address: 'Адрес доставки',
    paymentMethod: 'Способ оплаты',
    bank: 'Банковский перевод',
    card: 'Онлайн-оплата картой',
    invoice: 'Счет после подтверждения',
    payAmount: 'К оплате',
    confirmOrder: 'Подтвердить заказ',
    redirectingToPayment: 'Открываем защищенную оплату Stripe...',
    paymentSetupError: 'Оплата картой временно недоступна. Пожалуйста, свяжитесь с нами или попробуйте немного позже.',
    tryAgain: 'Попробовать снова',
    paymentSuccessTitle: 'Оплата получена',
    paymentSuccessText: 'Спасибо. Ваш заказ успешно оплачен, мы подготовим подтверждение.',
    paymentCancelTitle: 'Оплата не завершена',
    paymentCancelText: 'Заказ сохранен, но оплата была отменена. Можно связаться с нами или оформить заказ заново.',
    backToShop: 'Вернуться в магазин',
    orderSaved: (id) => `Заказ ${id} сохранен. Мы свяжемся с вами для подтверждения оплаты.`,
    checkoutSteps: ['Данные', 'Доставка', 'Оплата', 'Проверка'],
    personalTitle: 'Ваши данные',
    personalLead: 'Укажите контакты, на которые мы отправим подтверждение заказа.',
    deliveryTitle: 'Застрахованная доставка',
    deliveryLead: 'Ваше сокровище будет бережно упаковано и отправлено почтой Австрии.',
    country: 'Страна',
    postalCode: 'Почтовый индекс',
    streetAddress: 'Улица, дом и квартира',
    shippingCostNote: 'Стоимость доставки рассчитывается индивидуально и зависит от ценности, страховки, веса и страны назначения посылки.',
    shippingFinalNote: 'Точную стоимость доставки мы подтвердим перед отправкой.',
    paymentTitle: 'Выберите способ оплаты',
    paymentLead: 'Все платёжные данные обрабатываются безопасно.',
    cardAndWallets: 'Карта или электронный кошелёк',
    cardAndWalletsNote: 'Visa, Mastercard, Apple Pay или Google Pay, если поддерживается вашим устройством.',
    bankNote: 'После проверки заказа мы отправим банковские реквизиты.',
    reviewTitle: 'Проверьте заказ',
    reviewLead: 'Перед подтверждением убедитесь, что все данные указаны правильно.',
    contactDetails: 'Контактные данные',
    deliveryDetails: 'Адрес доставки',
    edit: 'Изменить',
    next: 'Продолжить',
    back: 'Назад',
    placeOrder: 'Подтвердить и перейти к оплате',
    secureCheckout: 'Безопасное оформление',
    austriaPost: 'ПОЧТА АВСТРИИ',
  },
};

const taxonomy = {
  en: {
    productTypes: {
      'Серьги/Клипсы': 'Earrings / Clip-ons',
      'Кулоны/Колье/Цепи': 'Pendants / Necklaces / Chains',
      'Броши/Булавки': 'Brooches / Pins',
      'Кольца/Браслеты/Запонки': 'Rings / Bracelets / Cufflinks',
      'Шкатулки/Таблетницы/Боксы': 'Jewelry Boxes / Pill Boxes / Organizers',
      'Аксессуары': 'Accessories',
      'Разное': 'Other',
    },
    priceRanges: {
      'До 200': 'Under €200',
      'До 500': '€200 to €500',
      'До 1000': '€500 to €1000',
      'Свыше 1000': 'Over €1000',
    },
    eras: {
      'Антикварные украшения': 'Antique jewelry',
      'Винтажные украшения': 'Vintage jewelry',
      'Современные украшения': 'Contemporary jewelry',
      'Георгианская эпоха': 'Georgian',
      'Викторианская эпоха': 'Victorian',
      'Эдвардианский период': 'Edwardian',
      'Модерн': 'Art Nouveau',
      'Арт Деко': 'Art Deco',
      'Ретро и Винтаж': 'Retro & Vintage',
      'Бидермайер': 'Biedermeier',
    },
    materials: {
      'Золото': 'Gold',
      'Серебро': 'Silver',
      'Другие металлы': 'Other metals',
    },
  },
  ru: {
    priceRanges: {
      'До 200': 'До 200 €',
      'До 500': '200-500 €',
      'До 1000': '500-1000 €',
      'Свыше 1000': 'Свыше 1000 €',
    },
  },
};

const aboutContent = {
  ru: {
    title: 'О нас',
    lead: 'Добро пожаловать в тайное общество ценителей прошлого.',
    paragraphs: [
      'Здесь нет случайных людей - только те, кто чувствует вибрации времени, слышит шепот веков и безошибочно узнает настоящую драгоценность по взгляду, а не по клейму.',
      'Мы не просто коллекционеры. Мы орден, посвященный поиску утерянной красоты.',
      'Наши реликвии - это сокровища, пережившие империи, любовные драмы, балы, эмиграции и возвращения. Каждая заколка - как откровение. Каждая брошь - как инициация.',
      'Вы не просто находите свое сокровище. Вы вступаете в круг тех, кто знает: душа может жить даже в старой фотографии.',
      'Мы коллекционируем и передаем. С осторожностью. Из рук в руки. По зову сердца.',
    ],
    signature: 'Ваш хранитель коллекции, Antique Treasures',
  },
  en: {
    title: 'About Us',
    lead: 'Welcome to a secret society of those who treasure the past.',
    paragraphs: [
      'There are no accidental visitors here - only those who feel the vibrations of time, hear the whisper of centuries, and recognize a true jewel by presence, not merely by a hallmark.',
      'We are not simply collectors. We are an order devoted to the search for lost beauty.',
      'Our relics are treasures that have outlived empires, love stories, ballrooms, migrations, and returns. Every hairpin feels like a revelation. Every brooch, an initiation.',
      'You are not merely finding a treasure. You are entering a circle of people who know that a soul can live even inside an old photograph.',
      'We collect and pass things on with care, from hand to hand, by the call of the heart.',
    ],
    signature: 'Your keeper of the collection, Antique Treasures',
  },
};

const legalPages = {
  datenschutz: {
    title: 'Datenschutz',
    subtitle: 'DSGVO / Data Protection',
    sections: [
      ['Защита данных', [
        'Защита ваших персональных данных является нашим приоритетом. Обработка данных на этом веб-сайте осуществляется в соответствии с DSGVO, австрийским Datenschutzgesetz (DSG) и Telekommunikationsgesetz 2021 (TKG 2021).',
      ]],
      ['1. Сбор и обработка данных при связи с нами', [
        'Если вы связываетесь с нами через форму на сайте или по электронной почте, предоставленные данные - имя, адрес электронной почты и текст обращения - сохраняются для обработки запроса и последующих вопросов.',
        'Правовое основание: выполнение преддоговорных обязательств или законный интерес согласно Art. 6 Abs. 1 lit. b und lit. f DSGVO. Данные не передаются третьим лицам без вашего явного согласия.',
      ]],
      ['2. Cookies', [
        'Сайт может использовать файлы cookie для корректной работы интерфейса и удобства пользователя. Вы можете отключить или ограничить cookie в настройках браузера; при этом функциональность сайта может быть ограничена.',
        'Правовое основание: согласие пользователя согласно Art. 6 Abs. 1 lit. a DSGVO и/или законный интерес по обеспечению технической функциональности сайта согласно Art. 6 Abs. 1 lit. f DSGVO в сочетании с § 165 Abs. 3 TKG 2021.',
      ]],
      ['3. Сроки хранения данных', [
        'Персональные данные хранятся только столько, сколько необходимо для обработки запроса, исполнения договора или соблюдения законных сроков хранения документации по налоговому и корпоративному законодательству Австрии, включая BAO и UGB.',
      ]],
      ['4. Ваши права', [
        'Вы имеете право на информацию, исправление, удаление, ограничение обработки, перенос данных и возражение против обработки в соответствии с Art. 15-21 DSGVO.',
        'Если вы считаете, что обработка данных нарушает ваши права, вы можете обратиться в Österreichische Datenschutzbehörde: Barichgasse 40-42, 1030 Wien, dsb@dsb.gv.at.',
      ]],
      ['5. Verantwortlicher', [
        'Ответственное лицо для этой портфолио-демонстрации: Antique Treasures. Все контактные данные являются вымышленными.',
      ]],
    ],
  },
  widerruf: {
    title: 'Widerrufsrecht',
    subtitle: 'Возврат товара и право на отзыв',
    sections: [
      ['Право на отзыв', [
        'В соответствии с австрийским Fern- und Auswärtsgeschäfte-Gesetz (FAGG), покупатель имеет право отказаться от договора купли-продажи без объяснения причин в течение 14 дней с момента получения товара.',
      ]],
      ['Как воспользоваться правом на отзыв', [
        'Чтобы воспользоваться правом на отзыв, необходимо уведомить нас четким заявлением, например письмом по почте или электронной почте. Для демо используется адрес hello@example.com.',
      ]],
      ['Доставка и возврат средств', [
        'При отказе от договора возвращается сумма, уплаченная за товар. Стоимость первичной доставки не возмещается, так как она рассчитывается и оплачивается отдельно при оформлении заказа.',
        'Возврат денежных средств за товар осуществляется не позднее 14 дней с момента получения уведомления об отзыве. Мы можем удержать возврат до получения товара обратно или подтверждения его отправки.',
      ]],
      ['Обратная доставка и риски', [
        'Расходы на обратную доставку полностью оплачивает покупатель. Риски утери, повреждения или кражи товара при обратной пересылке несет покупатель, поэтому рекомендуется использовать надежную службу доставки с трек-номером и страховкой.',
        'Покупатель несет ответственность за снижение стоимости товара, если оно вызвано обращением, выходящим за рамки обычной проверки состояния и свойств.',
      ]],
      ['Исключения', [
        'Право на возврат не распространяется на товары, изготовленные по индивидуальному заказу или адаптированные под личные потребности покупателя, а также на винтажные фотографии и периодические издания в случаях, предусмотренных § 18 Abs. 1 FAGG.',
      ]],
    ],
  },
  agb: {
    title: 'AGB',
    subtitle: 'Общие условия заключения сделок',
    sections: [
      ['1. Область применения', [
        'Настоящие Allgemeine Geschäftsbedingungen описывают демонстрационный сценарий между Antique Treasures и клиентами этого портфолио-проекта.',
      ]],
      ['2. Винтажные и антикварные изделия', [
        'Все товары на сайте являются винтажными или антикварными предметами, бывшими в употреблении. Естественные следы времени, патина, микроцарапины, износ и особенности ручной работы прошлых эпох являются нормой и не считаются дефектом.',
        'Характеристики материалов, проб, подлинности, веса и камней основаны на клеймах, визуальном анализе и стандартных методах проверки антиквариата, если в описании товара не указано современное экспертное заключение.',
      ]],
      ['3. Заключение договора', [
        'Показ товаров на сайте не является юридически обязывающей офертой продавца, а является приглашением покупателю сделать предложение о покупке.',
        'Договор купли-продажи считается заключенным только после фактической отправки товара и отдельного подтверждения отправки продавцом. Продавец оставляет за собой право отклонить заказ, например при скрытом дефекте, отсутствии товара или ошибке в цене.',
      ]],
      ['4. Цены и доставка', [
        'Цены на сайте указаны за товар и не включают стоимость доставки. Стоимость доставки рассчитывается индивидуально при оформлении заказа согласно актуальным тарифам Post.at.',
        'При доставке за пределы ЕС покупатель самостоятельно оплачивает таможенные пошлины, импортные налоги и сборы страны получения.',
      ]],
      ['5. Право собственности и ответственность', [
        'Товар остается собственностью продавца до полной оплаты товара и доставки. Ответственность продавца ограничена случаями умысла или грубой неосторожности, кроме случаев причинения вреда жизни и здоровью.',
        'Продавец не несет ответственности за содержание и безопасность сторонних сайтов, на которые могут вести ссылки с ресурса.',
      ]],
      ['6. Гарантийные обязательства', [
        'Гарантийный срок на винтажные и антикварные товары, бывшие в употреблении, сокращается до 1 года в соответствии с австрийским законодательством.',
        'Гарантия не распространяется на дефекты, возникшие в результате естественного износа, ненадлежащего обращения, контакта с химическими веществами или водой, либо самостоятельного изменения конструкции украшения.',
      ]],
      ['Дополнительная информация', [
        'Схема длины цепочек находится в процессе создания. Стоимость доставки будет уточняться по актуальным тарифам Post.at, так как цены меняются.',
      ]],
    ],
  },
  impressum: {
    title: 'Impressum',
    subtitle: 'Informationen gemäß § 5 ECG und § 25 Mediengesetz',
    sections: [
      ['Diensteanbieter / Für den Inhalt verantwortlich', [
        'Antique Treasures — portfolio concept',
        'Unternehmensgegenstand: Online-Handel mit Altwaren und gebrauchten Waren.',
      ]],
      ['Kontaktdaten', [
        'Adresse: Musterstrasse 1, 1010 Wien',
        'Telefon: +43 1 000 00 00',
        'E-Mail: hello@example.com',
      ]],
      ['Mitgliedschaften & Aufsichtsbehörde', [
        'Aufsichtsbehörde gem. ECG: Magistratisches Bezirksamt für den 14. Bezirk.',
        'Mitglied bei: Wirtschaftskammer Wien (WKO Wien).',
        'Sparte: Landesgremium des Markt-, Straßen- und Wanderhandels / Sekundärmarkt (Altwarenhandel).',
        'Berufsrechtliche Vorschriften: Gewerbeordnung (abrufbar unter www.ris.bka.gv.at).',
      ]],
      ['Steuerinformationen', [
        'Umsatzsteuer-ID: Demoangabe',
        'Umsatzsteuer: Befreit von der Umsatzsteuer aufgrund der Kleinunternehmerregelung gemäß § 6 Abs. 1 Art. 27 UStG.',
      ]],
      ['Online-Streitbeilegung', [
        'Verbraucher haben die Möglichkeit, Beschwerden an die Online-Streitbeilegungsplattform der EU zu richten: http://ec.europa.eu/odr.',
        'Sie können allfällige Beschwerden auch an die oben angegebene E-Mail-Adresse richten.',
      ]],
    ],
  },
};

const localizedLegalPages = {
  ru: {
    datenschutz: {
      title: 'Защита данных',
      subtitle: 'Datenschutz / DSGVO',
      sections: legalPages.datenschutz.sections,
    },
    widerruf: {
      title: 'Возврат товара',
      subtitle: 'Widerrufsrecht',
      sections: legalPages.widerruf.sections,
    },
    agb: {
      title: 'AGB',
      subtitle: 'Общие условия заключения сделок',
      sections: legalPages.agb.sections,
    },
    impressum: {
      title: 'Impressum',
      subtitle: 'Информация согласно § 5 ECG и § 25 Mediengesetz',
      sections: [
        ['Поставщик услуг / Ответственная за содержание', [
          'Antique Treasures — portfolio concept',
          'Предмет деятельности: онлайн-торговля старинными и бывшими в употреблении товарами.',
        ]],
        ['Контактные данные', [
          'Адрес: Musterstrasse 1, 1010 Wien',
          'Телефон: +43 1 000 00 00',
          'E-Mail: hello@example.com',
        ]],
        ['Членство и надзорный орган', [
          'Надзорный орган согласно ECG: Magistratisches Bezirksamt für den 14. Bezirk.',
          'Членство: Wirtschaftskammer Wien (WKO Wien).',
          'Отрасль: Landesgremium des Markt-, Straßen- und Wanderhandels / Sekundärmarkt (Altwarenhandel).',
          'Профессиональные нормы: Gewerbeordnung, доступно на www.ris.bka.gv.at.',
        ]],
        ['Налоговая информация', [
          'Umsatzsteuer-ID: демонстрационные данные',
          'НДС: освобождение от Umsatzsteuer по правилу Kleinunternehmerregelung согласно § 6 Abs. 1 Art. 27 UStG.',
        ]],
        ['Онлайн-урегулирование споров', [
          'Потребители могут направлять жалобы на платформу онлайн-урегулирования споров ЕС: http://ec.europa.eu/odr.',
          'Также возможные жалобы можно направлять на указанный выше адрес электронной почты.',
        ]],
      ],
    },
  },
  en: {
    datenschutz: {
      title: 'Data Protection',
      subtitle: 'Datenschutz / GDPR',
      sections: [
        ['Data protection', [
          'Protecting your personal data is a priority. Data processing on this website is carried out in accordance with the EU General Data Protection Regulation (GDPR), the Austrian Data Protection Act (DSG), and the Austrian Telecommunications Act 2021 (TKG 2021).',
        ]],
        ['1. Data collected when you contact us', [
          'If you contact us through the website form or by email, the data you provide, such as your name, email address, and message, is stored to process your request and any follow-up questions.',
          'Legal basis: pre-contractual obligations or legitimate interest under Art. 6(1)(b) and Art. 6(1)(f) GDPR. Your data is not passed to third parties without your explicit consent.',
        ]],
        ['2. Cookies', [
          'The website may use cookies to ensure the correct operation of the interface and improve user experience. You can disable or restrict cookies in your browser settings; some website functions may then be limited.',
          'Legal basis: user consent under Art. 6(1)(a) GDPR and/or legitimate interest in ensuring technical website functionality under Art. 6(1)(f) GDPR together with § 165(3) TKG 2021.',
        ]],
        ['3. Retention periods', [
          'Personal data is stored only for as long as necessary to process requests, fulfill contracts, or comply with statutory retention obligations under Austrian tax and corporate law, including BAO and UGB.',
        ]],
        ['4. Your rights', [
          'You have the right to information, rectification, erasure, restriction of processing, data portability, and objection under Art. 15-21 GDPR.',
          'If you believe that data processing violates your rights, you may contact the Austrian Data Protection Authority: Österreichische Datenschutzbehörde, Barichgasse 40-42, 1030 Vienna, dsb@dsb.gv.at.',
        ]],
        ['5. Controller', [
          'Controller for this portfolio demo: Antique Treasures. Address: Musterstrasse 1, 1010 Vienna. Email: hello@example.com.',
        ]],
      ],
    },
    widerruf: {
      title: 'Returns',
      subtitle: 'Widerrufsrecht / Right of withdrawal',
      sections: [
        ['Right of withdrawal', [
          'Under the Austrian Fern- und Auswärtsgeschäfte-Gesetz (FAGG), consumers may withdraw from a distance purchase contract without giving reasons within 14 days after receiving the goods.',
        ]],
        ['How to exercise the right of withdrawal', [
          'To exercise the right of withdrawal, you must notify us with a clear statement, for example by postal letter or email. Demo contact: Antique Treasures, Musterstrasse 1, 1010 Vienna, E-Mail: hello@example.com.',
        ]],
        ['Shipping costs and refunds', [
          'If you withdraw from the contract, we refund the amount paid for the item. The original delivery cost is not refunded because it is calculated and paid separately at checkout.',
          'Refunds are made no later than 14 days after we receive your withdrawal notice. We may withhold the refund until we receive the item back or until you provide proof of return shipment.',
        ]],
        ['Return shipment and risk', [
          'Direct return shipping costs are paid by the customer. The risk of loss, theft, or damage during return transport is borne by the customer, so we recommend a reliable shipping service with tracking and insurance.',
          'You are responsible for any reduction in value caused by handling beyond what is necessary to inspect the condition and properties of the item.',
        ]],
        ['Exceptions', [
          'The right of withdrawal does not apply to items made to order or clearly customized to personal needs, nor to vintage photographs and periodicals where exceptions under § 18(1) FAGG apply.',
        ]],
      ],
    },
    agb: {
      title: 'AGB',
      subtitle: 'General terms and conditions',
      sections: [
        ['1. Scope', [
          'These General Terms and Conditions govern the relationship between Antique Treasures as seller and customers placing orders through this portfolio demo.',
        ]],
        ['2. Vintage and antique items', [
          'All items offered on the website are vintage or antique goods and therefore pre-owned. Natural traces of age, patina, micro-scratches, wear, and features of historical handcraft are normal and are not considered defects.',
          'Information about materials, hallmarks, authenticity, weight, and stones is based on hallmarks, visual analysis, and standard antique testing methods unless a modern expert report is expressly mentioned in the product description.',
        ]],
        ['3. Conclusion of contract', [
          'The presentation of goods on the website is not a legally binding offer by the seller. It is an invitation for the customer to submit an offer to purchase.',
          'The purchase contract is concluded only after the item has actually been shipped and the seller has sent a separate shipping confirmation. The seller may refuse an order, for example due to a hidden defect, lack of availability, or a pricing error.',
        ]],
        ['4. Prices and shipping', [
          'Prices shown on the website are item prices and do not include shipping costs. Shipping costs are calculated individually during checkout according to the current Post.at rates.',
          'For deliveries outside the EU, the customer is responsible for customs duties, import taxes, and charges of the destination country.',
        ]],
        ['5. Retention of title and liability', [
          'The item remains the property of the seller until full payment of the item and delivery costs. Seller liability is limited to intent and gross negligence, except in cases of injury to life or health.',
          'The seller is not responsible for the content or security of third-party websites linked from this website.',
        ]],
        ['6. Warranty', [
          'The warranty period for vintage and antique pre-owned goods is reduced to one year in accordance with Austrian law.',
          'The warranty does not cover defects caused by natural wear, improper handling, contact with chemicals or water, or modifications made by the customer.',
        ]],
        ['Additional information', [
          'A chain length guide is currently being prepared. Shipping costs are confirmed according to current Post.at rates, as prices may change.',
        ]],
      ],
    },
    impressum: {
      title: 'Impressum',
      subtitle: 'Information pursuant to § 5 ECG and § 25 Mediengesetz',
      sections: [
        ['Service provider / Responsible for content', [
          'Antique Treasures — portfolio concept',
          'Business activity: online trade in old and pre-owned goods.',
        ]],
        ['Contact details', [
          'Address: Musterstrasse 1, 1010 Vienna',
          'Phone: +43 1 000 00 00',
          'E-Mail: hello@example.com',
        ]],
        ['Memberships and supervisory authority', [
          'Supervisory authority pursuant to ECG: Magistratisches Bezirksamt für den 14. Bezirk.',
          'Member of: Wirtschaftskammer Wien (WKO Wien).',
          'Section: Landesgremium des Markt-, Straßen- und Wanderhandels / Sekundärmarkt (Altwarenhandel).',
          'Professional regulations: Gewerbeordnung, available at www.ris.bka.gv.at.',
        ]],
        ['Tax information', [
          'VAT ID: demo information',
          'VAT: exempt from VAT under the small business regulation pursuant to § 6 Abs. 1 Art. 27 UStG.',
        ]],
        ['Online dispute resolution', [
          'Consumers may submit complaints to the EU online dispute resolution platform: http://ec.europa.eu/odr.',
          'Any complaints may also be sent to the email address listed above.',
        ]],
      ],
    },
  },
};

const ringSizeRows = [
  ['15', '47', '4', 'H'],
  ['16', '50', '5.5', 'K'],
  ['17', '53', '6.5', 'M'],
  ['18', '56', '7.5', 'O'],
  ['19', '59', '8.5', 'R'],
  ['20', '63', '10', 'T'],
  ['21', '66', '11.5', 'W'],
];

const labelFor = (value, group, language) => taxonomy[language]?.[group]?.[value] || value;

const productText = (product, field, language) =>
  language === 'en' && product[`${field}En`] ? product[`${field}En`] : product[field];

const productList = (product, field, language) =>
  language === 'en' && Array.isArray(product[`${field}En`]) ? product[`${field}En`] : product[field];

const money = (value, currency = 'EUR', language = 'ru') =>
  new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

const normalizeCategory = (value) => {
  const category = String(value || '').trim();
  if (category === 'Колье/Кулоны/Цепи') return 'Кулоны/Колье/Цепи';
  if (category === 'Шкатулки/Боксы') return 'Шкатулки/Таблетницы/Боксы';
  if (category === 'Редкие находки') return 'Разное';
  return category;
};

const isRingProduct = (product) => {
  const text = [product.category, product.name, product.nameEn].join(' ').toLowerCase();
  return text.includes('кольц') || text.includes('ring');
};

const matchesPriceRange = (price, range) => {
  const value = Number(price || 0);
  if (!range) return true;
  if (range === 'До 200') return value <= 200;
  if (range === 'До 500') return value > 200 && value <= 500;
  if (range === 'До 1000') return value > 500 && value <= 1000;
  if (range === 'Свыше 1000') return value > 1000;
  return true;
};
const orderStatuses = ['Новый заказ', 'В обработке', 'Ожидает отправки', 'Отправлен', 'Завершен', 'Отменен'];
const paymentStatuses = ['Ожидает подтверждения', 'Ожидает оплаты', 'Оплачен', 'Оплата не прошла', 'Возврат'];
const statsPeriods = [
  { value: 'today', label: 'Сегодня' },
  { value: '7days', label: '7 дней' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
  { value: 'custom', label: 'Период' },
];

const dateInputValue = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const statsPeriodRange = (period) => {
  const today = new Date();
  const start = new Date(today);
  if (period === '7days') start.setDate(today.getDate() - 6);
  if (period === 'month') start.setMonth(today.getMonth() - 1);
  if (period === 'quarter') start.setMonth(today.getMonth() - 3);
  if (period === 'year') start.setFullYear(today.getFullYear() - 1);
  if (period === 'today' || period === 'custom') start.setTime(today.getTime());
  return { dateFrom: dateInputValue(start), dateTo: dateInputValue(today) };
};

const materialGroupFor = (material) => {
  const value = String(material || '').toLowerCase();
  if (value.includes('золото') || value.includes('gold')) return 'Золото';
  if (value.includes('сереб') || value.includes('silver')) return 'Серебро';
  return 'Другие металлы';
};

const emptyProduct = {
  name: '',
  nameEn: '',
  price: '',
  currency: 'EUR',
  category: 'Кольца/Браслеты/Запонки',
  era: 'Винтажные украшения',
  material: 'Золото',
  stone: '',
  stoneEn: '',
  quantity: 1,
  status: 'available',
  image: '',
  images: [],
  description: '',
  descriptionEn: '',
  details: [],
  detailsEn: [],
  materialGlossary: [],
  materialIds: [],
};

function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({ productTypes: [], priceRanges: [], eras: [] });
  const [materials, setMaterials] = useState([]);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('jewelry-cart') || '[]'));
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState(() => localStorage.getItem('jewelry-language') || 'en');
  const t = copy[language] || copy.en;

  useEffect(() => {
    api.products().then(setProducts);
    api.categories().then(setCategories);
    api.materials().then(setMaterials);
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    localStorage.setItem('jewelry-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('jewelry-language', language);
  }, [language]);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current;
      return [...current, { id: product.id, name: product.name, nameEn: product.nameEn, price: product.price, currency: product.currency, image: product.image, quantity: 1 }];
    });
  };

  if (route.startsWith('/admin')) {
    return (
      <Admin
        products={products}
        categories={categories}
        materials={materials}
        refreshProducts={() => api.products().then(setProducts)}
        refreshMaterials={() => api.materials().then(setMaterials)}
        navigate={navigate}
      />
    );
  }

  if (route === '/') {
    return <HomePage navigate={navigate} language={language} setLanguage={setLanguage} t={t} />;
  }

  if (route === '/cart') {
    return <Cart cart={cart} setCart={setCart} navigate={navigate} language={language} setLanguage={setLanguage} t={t} />;
  }

  if (route === '/checkout') {
    return <Checkout cart={cart} setCart={setCart} navigate={navigate} language={language} setLanguage={setLanguage} t={t} />;
  }

  if (route === '/checkout-success' || route === '/checkout-cancel') {
    return (
      <Shell cartCount={cart.length} navigate={navigate} language={language} setLanguage={setLanguage} t={t}>
        <PaymentResult success={route === '/checkout-success'} navigate={navigate} t={t} />
      </Shell>
    );
  }

  if (route === '/about') {
    return (
      <Shell cartCount={cart.length} navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} language={language} setLanguage={setLanguage} t={t}>
        <AboutPage language={language} />
      </Shell>
    );
  }

  if (route === '/archive') {
    return (
      <Shell cartCount={cart.length} navigate={navigate} language={language} setLanguage={setLanguage} t={t}>
        <ArchivePage products={products} navigate={navigate} language={language} t={t} />
      </Shell>
    );
  }

  if (route === '/materials' || route.startsWith('/materials/')) {
    const materialSlug = route.startsWith('/materials/') ? decodeURIComponent(route.replace('/materials/', '')) : '';
    const selectedMaterial = materials.find((material) => material.slug === materialSlug);
    return (
      <Shell cartCount={cart.length} navigate={navigate} language={language} setLanguage={setLanguage} t={t}>
        {selectedMaterial
          ? <MaterialPage material={selectedMaterial} products={products} navigate={navigate} language={language} t={t} />
          : <MaterialsPage materials={materials} navigate={navigate} language={language} t={t} />}
      </Shell>
    );
  }

  if (route === '/datenschutz' || route === '/widerruf' || route === '/agb' || route === '/impressum') {
    const pageKey = route.replace('/', '');
    return (
      <Shell cartCount={cart.length} navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} language={language} setLanguage={setLanguage} t={t}>
        <LegalPage page={(localizedLegalPages[language] || localizedLegalPages.en)[pageKey]} />
      </Shell>
    );
  }

  const productSlug = route.startsWith('/product/') ? decodeURIComponent(route.replace('/product/', '')) : null;
  const product = products.find((item) => item.slug === productSlug);

  return (
    <Shell cartCount={cart.length} navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} language={language} setLanguage={setLanguage} t={t}>
      {product ? (
        <ProductPage product={product} materials={materials} addToCart={addToCart} navigate={navigate} language={language} t={t} />
      ) : (
        <Feed products={products} categories={categories} searchQuery={searchQuery} navigate={navigate} language={language} t={t} />
      )}
    </Shell>
  );
}

function LanguageSwitcher({ language, setLanguage, light = false }) {
  return (
    <div className={`languageSwitch ${light ? 'light' : ''}`} aria-label="Language switcher">
      {Object.entries(languages).map(([code, item]) => (
        <button className={language === code ? 'active' : ''} key={code} onClick={() => setLanguage(code)} aria-label={item.label}>
          <span>{item.flag}</span>
        </button>
      ))}
    </div>
  );
}

function HomePage({ navigate, language, setLanguage, t }) {
  const [isVideoReady, setIsVideoReady] = useState(false);

  return (
    <>
      <section className="homeHero">
        <video
          className={`heroVideo ${isVideoReady ? 'ready' : ''}`}
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setIsVideoReady(true)}
        />
        <div className="heroShade" />
        <LanguageSwitcher language={language} setLanguage={setLanguage} light />
        <div className="heroContent">
          <p className="heroKicker">{t.heroKicker}</p>
          <h1>{t.heroTitle}</h1>
        </div>
        <button className="heroShopButton" onClick={() => navigate('/shop')}>{t.heroButton}</button>
      </section>
      <footer className="siteFooter homeFooter">
        <button onClick={() => navigate('/datenschutz')}>{t.dataProtection}</button>
        <button onClick={() => navigate('/impressum')}>{t.impressum}</button>
        <button onClick={() => navigate('/widerruf')}>{t.withdrawal}</button>
        <button onClick={() => navigate('/agb')}>{t.terms}</button>
      </footer>
    </>
  );
}

function SearchBox({ searchQuery, setSearchQuery, t }) {
  return (
    <details className="searchPanel">
      <summary>{t.search}</summary>
      <div>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
        />
        {searchQuery && <button onClick={() => setSearchQuery('')}>{t.clear}</button>}
      </div>
    </details>
  );
}

function CartIconButton({ count, label, onClick, className = '' }) {
  return (
    <button className={`cartIconButton ${className}`} onClick={onClick} aria-label={`${label}: ${count || 0}`}>
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path d="M8.8 10.6h10.4l-.7 10.2H9.5L8.8 10.6Z" />
        <path d="M10.8 10.6c0-3 1.2-5 3.2-5s3.2 2 3.2 5" />
      </svg>
      <span>{count || 0}</span>
    </button>
  );
}

function Shell({ children, cartCount, navigate, searchQuery = '', setSearchQuery = () => {}, language, setLanguage, t }) {
  return (
    <>
      <header className="siteHeader">
        <button className="brand" onClick={() => navigate('/')}>{t.brand}</button>
        <nav className="desktopNav">
          <button onClick={() => navigate('/shop')}>{t.shop}</button>
          <button onClick={() => navigate('/archive')}>{t.archive}</button>
          <button onClick={() => navigate('/materials')}>{t.materialsGuide}</button>
          <button onClick={() => navigate('/about')}>{t.about}</button>
          <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} t={t} />
          <button onClick={() => navigate('/admin')}>{t.signIn}</button>
          <CartIconButton count={cartCount} label={t.cart} onClick={() => navigate('/cart')} />
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </nav>
        <div className="mobileHeaderActions">
          <CartIconButton count={cartCount} label={t.cart} onClick={() => navigate('/cart')} className="mobileCart" />
          <details className="mobileMenu">
            <summary>{t.menu}</summary>
            <div>
              <button onClick={() => navigate('/shop')}>{t.shop}</button>
              <button onClick={() => navigate('/archive')}>{t.archive}</button>
              <button onClick={() => navigate('/materials')}>{t.materialsGuide}</button>
              <button onClick={() => navigate('/about')}>{t.about}</button>
              <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} t={t} />
              <button onClick={() => navigate('/admin')}>{t.signIn}</button>
              <LanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
          </details>
        </div>
      </header>
      <main>{children}</main>
      <footer className="siteFooter">
        <button onClick={() => navigate('/datenschutz')}>{t.dataProtection}</button>
        <button onClick={() => navigate('/impressum')}>{t.impressum}</button>
        <button onClick={() => navigate('/widerruf')}>{t.withdrawal}</button>
        <button onClick={() => navigate('/agb')}>{t.terms}</button>
      </footer>
    </>
  );
}

function ArchivePage({ products, navigate, language, t }) {
  const archived = products.filter((product) => product.status === 'sold' || Number(product.quantity || 0) === 0);
  return (
    <section className="editorialIndexPage">
      <header className="indexPageHeader">
        <p className="eyebrow">{t.archive}</p>
        <h1>{t.archiveTitle}</h1>
        <p>{t.archiveLead}</p>
      </header>
      <div className="feedGrid archiveGrid">
        {archived.map((product) => (
          <button className="feedCard archiveCard" key={product.id} onClick={() => navigate(`/product/${product.slug}`)}>
            <div><img src={product.image} alt={productText(product, 'name', language)} /><span>{t.archivedPiece}</span></div>
            <strong>{productText(product, 'name', language)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function MaterialsPage({ materials, navigate, language, t }) {
  return (
    <section className="editorialIndexPage">
      <header className="indexPageHeader">
        <p className="eyebrow">{t.materialsGuide}</p>
        <h1>{t.materialsTitle}</h1>
        <p>{t.materialsLead}</p>
      </header>
      <div className="materialsDirectory">
        {materials.map((material) => (
          <button key={material.id} onClick={() => navigate(`/materials/${material.slug}`)}>
            {material.image && <img src={material.image} alt={productText(material, 'name', language)} />}
            <div>
              <h2>{productText(material, 'name', language)}</h2>
              <p>{productText(material, 'description', language)}</p>
              <span>{t.readMore}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MaterialPage({ material, products, navigate, language, t }) {
  const related = products.filter((product) => (product.materialIds || []).includes(material.id));
  const description = productText(material, 'description', language);
  return (
    <section className="contentPage materialPage">
      <button className="backLink" onClick={() => navigate('/materials')}>{t.materialsGuide}</button>
      <p className="eyebrow">{t.materialsGuide}</p>
      <h1>{productText(material, 'name', language)}</h1>
      {material.image && <img className="materialHeroImage" src={material.image} alt={productText(material, 'name', language)} />}
      <div className="contentBody materialArticleBody">
        {String(description || '').split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
        {material.sourceUrl && <p><a href={material.sourceUrl} target="_blank" rel="noreferrer">{t.source} ↗</a></p>}
      </div>
      {related.length > 0 && (
        <section className="relatedMaterialProducts">
          <h2>{t.relatedPieces}</h2>
          <div className="feedGrid">
            {related.map((product) => (
              <button className="feedCard" key={product.id} onClick={() => navigate(`/product/${product.slug}`)}>
                <img src={product.image} alt={productText(product, 'name', language)} />
                <span>{productText(product, 'name', language)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function AboutPage({ language }) {
  const content = aboutContent[language] || aboutContent.en;
  return (
    <section className="contentPage aboutPage">
      <p className="eyebrow">{content.title}</p>
      <h1>{content.lead}</h1>
      <div className="aboutPortrait" aria-label="Founder portrait placeholder">
        <span>Antique Treasures</span>
      </div>
      <div className="contentBody">
        {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p className="signature">{content.signature}</p>
      </div>
    </section>
  );
}

function LegalPage({ page }) {
  return (
    <section className="contentPage legalPage">
      <p className="eyebrow">{page.subtitle}</p>
      <h1>{page.title}</h1>
      <div className="contentBody">
        {page.sections.map(([title, paragraphs]) => (
          <section key={title}>
            <h2>{title}</h2>
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
      </div>
    </section>
  );
}

function Feed({ products, categories, searchQuery, navigate, language, t }) {
  const priceCeiling = Math.max(1000, Math.ceil(Math.max(...products.map((product) => Number(product.price || 0)), 0) / 100) * 100);
  const [filter, setFilter] = useState({ type: '', priceMax: null, era: '' });
  const selectedPrice = filter.priceMax ?? priceCeiling;
  const query = searchQuery.trim().toLowerCase();
  const available = products.filter((product) => {
    if (product.status === 'sold') return false;
    if (filter.type && normalizeCategory(product.category) !== filter.type) return false;
    if (filter.era && !product.era.includes(filter.era.replace(' украшения', ''))) return false;
    if (filter.priceMax !== null && Number(product.price || 0) > filter.priceMax) return false;
    if (query) {
      const haystack = [
        product.name,
        product.nameEn,
        product.description,
        product.descriptionEn,
        product.category,
        product.era,
        product.eraEn,
        product.material,
        product.materialEn,
        product.stone,
        product.stoneEn,
        ...(product.details || []),
        ...(product.detailsEn || []),
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const selectedCount = available.length;
  return (
    <section className="feedPage">
      <aside className="collectionRail">
        <button className={!filter.type && filter.priceMax === null && !filter.era ? 'activeFilter' : ''} onClick={() => setFilter({ type: '', priceMax: null, era: '' })}>{t.viewAll}</button>
        <div className="railGroup">
          {categories.productTypes.map((item) => (
            <button className={filter.type === item ? 'activeFilter' : ''} key={item} onClick={() => setFilter((current) => ({ ...current, type: current.type === item ? '' : item }))}>{labelFor(item, 'productTypes', language)}</button>
          ))}
        </div>
        <div className="railGroup priceSliderFilter">
          <div><span>{t.price}</span><strong>{filter.priceMax === null ? '∞' : money(filter.priceMax, 'EUR', language)}</strong></div>
          <input aria-label={t.price} type="range" min="0" max={priceCeiling} step="25" value={selectedPrice} onChange={(event) => {
            const value = Number(event.target.value);
            setFilter((current) => ({ ...current, priceMax: value >= priceCeiling ? null : value }));
          }} />
          <small>€0</small>
        </div>
        <div className="railGroup">
          {categories.eras.map((item) => (
            <button className={filter.era === item ? 'activeFilter' : ''} key={item} onClick={() => setFilter((current) => ({ ...current, era: current.era === item ? '' : item }))}>{labelFor(item, 'eras', language)}</button>
          ))}
        </div>
      </aside>
      <div className="collectionArea">
        <div className="collectionMeta">{selectedCount} {t.pieces}</div>
        <div className="mobileFilters">
          <button className="resetFilter" onClick={() => setFilter({ type: '', priceMax: null, era: '' })}>{t.resetFilters}</button>
          <details>
            <summary>{t.productType}{filter.type ? `: ${labelFor(filter.type, 'productTypes', language)}` : ''}</summary>
            <div>
              {categories.productTypes.map((item) => (
                <button className={filter.type === item ? 'activeFilter' : ''} key={item} onClick={() => setFilter((current) => ({ ...current, type: current.type === item ? '' : item }))}>{labelFor(item, 'productTypes', language)}</button>
              ))}
            </div>
          </details>
          <details>
            <summary>{t.price}: {filter.priceMax === null ? '∞' : money(filter.priceMax, 'EUR', language)}</summary>
            <div className="mobilePriceSlider">
              <input aria-label={t.price} type="range" min="0" max={priceCeiling} step="25" value={selectedPrice} onChange={(event) => {
                const value = Number(event.target.value);
                setFilter((current) => ({ ...current, priceMax: value >= priceCeiling ? null : value }));
              }} />
            </div>
          </details>
          <details>
            <summary>{t.era}{filter.era ? `: ${labelFor(filter.era, 'eras', language)}` : ''}</summary>
            <div>
              {categories.eras.map((item) => (
                <button className={filter.era === item ? 'activeFilter' : ''} key={item} onClick={() => setFilter((current) => ({ ...current, era: current.era === item ? '' : item }))}>{labelFor(item, 'eras', language)}</button>
              ))}
            </div>
          </details>
        </div>
        <div className="feedGrid">
          {available.map((product) => (
            <button className="feedCard" key={product.id} onClick={() => navigate(`/product/${product.slug}`)}>
              <img src={product.image} alt={product.name} />
              <span>{productText(product, 'name', language)}</span>
              <strong>{money(product.price, product.currency, language)}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPage({ product, materials, addToCart, navigate, language, t }) {
  const [cartSignal, setCartSignal] = useState(0);
  const [activeImage, setActiveImage] = useState(product.image);
  const galleryImages = [...new Set([product.image, ...(product.images || [])].filter(Boolean))];
  const selectedMaterials = materials.filter((material) => (product.materialIds || []).includes(material.id));

  const linkedDescription = (text) => {
    const glossary = [
      ...selectedMaterials.flatMap((material) => [
        {
          term: material.name,
          aliases: material.aliases || [],
          url: `/materials/${material.slug}`,
        },
        ...(material.nameEn ? [{ term: material.nameEn, url: `/materials/${material.slug}` }] : []),
      ]),
      ...(product.materialGlossary || []),
    ].flatMap((entry) => [entry, ...(entry.aliases || []).map((alias) => ({ ...entry, term: alias }))]);
    if (!glossary.length) return text;
    const escapedTerms = glossary.map((entry) => entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const entries = new Map(glossary.map((entry) => [entry.term.toLowerCase(), entry]));
    return String(text || '').split(pattern).map((part, index) => {
      const entry = entries.get(part.toLowerCase());
      if (!entry) return part;
      const anchor = entry.term.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-');
      return (
        <a
          className="materialTermLink"
          href={entry.url || `#material-${anchor}`}
          target={entry.url ? '_blank' : undefined}
          rel={entry.url ? 'noreferrer' : undefined}
          key={`${part}-${index}`}
        >
          {part}
        </a>
      );
    });
  };

  const handleAddToCart = () => {
    addToCart(product);
    setCartSignal((value) => value + 1);
    window.setTimeout(() => setCartSignal(0), 1400);
  };

  return (
    <section className="productPage">
      <button className="backLink" onClick={() => navigate('/shop')}>{t.backToCatalog}</button>
      <div className="productMedia">
        <img className="productMainImage" src={activeImage || product.image} alt={product.name} />
        {galleryImages.length > 1 && (
          <div className="productThumbnails">
            {galleryImages.map((image, index) => (
              <button className={activeImage === image ? 'active' : ''} onClick={() => setActiveImage(image)} key={image}>
                <img src={image} alt={`${product.name}, фото ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
      <article className="productInfo">
        <p className="eyebrow">{labelFor(product.category, 'productTypes', language)} · {labelFor(product.era, 'eras', language)}</p>
        <h1>{productText(product, 'name', language)}</h1>
        <p className="price">{money(product.price, product.currency, language)}</p>
        <p className="preserveParagraphs">{linkedDescription(productText(product, 'description', language))}</p>
        <dl>
          <div>
            <dt>{t.material}</dt>
            <dd>
              {selectedMaterials.length
                ? selectedMaterials.map((material, index) => (
                  <React.Fragment key={material.id}>
                    {index > 0 && ' · '}
                    <button className="inlineMaterialButton" onClick={() => navigate(`/materials/${material.slug}`)}>{productText(material, 'name', language)}</button>
                  </React.Fragment>
                ))
                : productText(product, 'material', language)}
            </dd>
          </div>
          {productText(product, 'stone', language) && <div><dt>{t.stone}</dt><dd>{productText(product, 'stone', language)}</dd></div>}
          <div><dt>{t.status}</dt><dd>{product.status === 'sold' ? t.archivedPiece : product.status === 'reserved' ? t.reserved : t.available}</dd></div>
        </dl>
        <ul className="productDetailsList">
          {(productList(product, 'details', language) || []).map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
        {(product.materialGlossary || []).some((entry) => entry.definition) && (
          <section className="materialGlossary">
            <h2>{language === 'ru' ? 'О редких материалах' : 'About rare materials'}</h2>
            {product.materialGlossary.filter((entry) => entry.definition).map((entry) => (
              <article id={`material-${entry.term.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-')}`} key={entry.term}>
                <h3>{entry.term}</h3>
                <p>{entry.definition}</p>
              </article>
            ))}
          </section>
        )}
        {isRingProduct(product) && <RingSizeGuide t={t} />}
        {product.status !== 'sold' && Number(product.quantity || 0) > 0 ? (
          <div className="addToCartWrap">
            <button className={`primary addToCartButton ${cartSignal ? 'isAdded' : ''}`} onClick={handleAddToCart}>
              {cartSignal ? t.addedToCart : t.addToCart}
            </button>
            {cartSignal > 0 && <div className="cartAddedEffect" key={cartSignal}>{t.addedToCart}</div>}
          </div>
        ) : <p className="archivedProductNotice">{t.archivedPiece}</p>}
      </article>
    </section>
  );
}

function RingSizeGuide({ t }) {
  return (
    <section className="ringSizeGuide">
      <h2>{t.ringSizeGuide}</h2>
      <table>
        <thead>
          <tr>
            <th>RU</th>
            <th>EU</th>
            <th>US</th>
            <th>UK</th>
          </tr>
        </thead>
        <tbody>
          {ringSizeRows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell) => <td key={cell}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p>{t.ringSizeNote}</p>
    </section>
  );
}

function PaymentResult({ success, navigate, t }) {
  return (
    <section className="checkoutPage paymentResultPage">
      <h1>{success ? t.paymentSuccessTitle : t.paymentCancelTitle}</h1>
      <p>{success ? t.paymentSuccessText : t.paymentCancelText}</p>
      <button className="primary" onClick={() => navigate('/shop')}>{t.backToShop}</button>
    </section>
  );
}

function Cart({ cart, setCart, navigate, language, setLanguage, t }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  return (
    <Shell cartCount={cart.length} navigate={navigate} language={language} setLanguage={setLanguage} t={t}>
      <section className="cartPage">
        <h1>{t.cartTitle}</h1>
        {cart.length === 0 ? <p>{t.emptyCart}</p> : cart.map((item) => (
          <div className="cartLine" key={item.id}>
            <img src={item.image} alt={item.name} />
            <div>
              <strong>{language === 'en' && item.nameEn ? item.nameEn : item.name}</strong>
              <span>{money(item.price, item.currency, language)}</span>
            </div>
            <span className="exclusiveNote">{t.exclusivePiece}</span>
            <button onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))}>{t.remove}</button>
          </div>
        ))}
        {cart.length > 0 && (
          <div className="cartSummary">
            <strong>{t.total}: {money(total, 'EUR', language)}</strong>
            <button className="luxeCheckoutButton" onClick={() => navigate('/checkout')}>
              <span>{t.checkout}</span><b>→</b>
            </button>
          </div>
        )}
      </section>
    </Shell>
  );
}

const checkoutCountries = [
  ['AT', 'Австрия', 'Austria'], ['DE', 'Германия', 'Germany'], ['CH', 'Швейцария', 'Switzerland'],
  ['FR', 'Франция', 'France'], ['IT', 'Италия', 'Italy'], ['ES', 'Испания', 'Spain'],
  ['NL', 'Нидерланды', 'Netherlands'], ['BE', 'Бельгия', 'Belgium'], ['CZ', 'Чехия', 'Czechia'],
  ['SK', 'Словакия', 'Slovakia'], ['HU', 'Венгрия', 'Hungary'], ['PL', 'Польша', 'Poland'],
  ['SI', 'Словения', 'Slovenia'], ['HR', 'Хорватия', 'Croatia'], ['RO', 'Румыния', 'Romania'],
  ['BG', 'Болгария', 'Bulgaria'], ['GR', 'Греция', 'Greece'], ['PT', 'Португалия', 'Portugal'],
  ['DK', 'Дания', 'Denmark'], ['SE', 'Швеция', 'Sweden'], ['FI', 'Финляндия', 'Finland'],
  ['IE', 'Ирландия', 'Ireland'], ['LU', 'Люксембург', 'Luxembourg'], ['EE', 'Эстония', 'Estonia'],
  ['LV', 'Латвия', 'Latvia'], ['LT', 'Литва', 'Lithuania'], ['UA', 'Украина', 'Ukraine'],
  ['GB', 'Великобритания', 'United Kingdom'], ['US', 'США', 'United States'], ['CA', 'Канада', 'Canada'],
];

const citySuggestions = ['Wien', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Bregenz', 'St. Pölten', 'Eisenstadt'];

function PaymentLogos() {
  return (
    <div className="paymentBrandLogos" aria-label="Visa, Mastercard, Apple Pay, Google Pay">
      <span className="paymentLogo visaLogo" title="Visa">
        <svg viewBox="0 0 72 24" role="img" aria-label="Visa">
          <text x="4" y="18">VISA</text>
        </svg>
      </span>
      <span className="paymentLogo mastercardLogo" title="Mastercard">
        <svg viewBox="0 0 74 28" role="img" aria-label="Mastercard">
          <circle cx="27" cy="14" r="10" fill="#EB001B" />
          <circle cx="39" cy="14" r="10" fill="#F79E1B" />
          <path d="M33 6.2a10 10 0 0 1 0 15.6 10 10 0 0 1 0-15.6Z" fill="#FF5F00" />
          <text x="52" y="17">mc</text>
        </svg>
      </span>
      <span className="paymentLogo applePayLogo" title="Apple Pay">
        <svg viewBox="0 0 88 28" role="img" aria-label="Apple Pay">
          <path d="M17.1 8.2c1.2-1.5 1.1-3 1.1-3.5-1.2.1-2.7.8-3.5 1.8-.8.9-1.4 2.2-1.3 3.5 1.3.1 2.7-.6 3.7-1.8Zm3.7 6.7c0-2.5 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-3.9Z" />
          <text x="29" y="20">Pay</text>
        </svg>
      </span>
      <span className="paymentLogo googlePayLogo" title="Google Pay">
        <svg viewBox="0 0 96 28" role="img" aria-label="Google Pay">
          <text x="4" y="20" className="googleG">G</text>
          <text x="27" y="20">Pay</text>
          <path d="M7 7a9 9 0 0 1 13 1" fill="none" stroke="#EA4335" strokeWidth="3" />
          <path d="M20 8a9 9 0 0 1 1 5" fill="none" stroke="#FBBC04" strokeWidth="3" />
          <path d="M21 13c0 5-4 9-9 9" fill="none" stroke="#34A853" strokeWidth="3" />
          <path d="M12 22a9 9 0 0 1-5-15" fill="none" stroke="#4285F4" strokeWidth="3" />
        </svg>
      </span>
    </div>
  );
}

function Checkout({ cart, setCart, navigate, language, setLanguage, t }) {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState({
    firstName: '', lastName: '', phone: '', email: '', country: 'AT', postalCode: '', city: '', address: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const country = checkoutCountries.find((item) => item[0] === customer.country);
  const countryName = country ? country[language === 'ru' ? 1 : 2] : customer.country;
  const updateCustomer = (field, value) => setCustomer((current) => ({ ...current, [field]: value }));

  const nextStep = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');
    try {
      const order = await api.createOrder({ customer, paymentMethod, items: cart.map((item) => ({ ...item, quantity: 1 })), total });
      if (paymentMethod === 'card') {
        setMessage(t.redirectingToPayment);
        setMessageType('info');
        const session = await api.createCheckoutSession(order.id, language);
        window.location.href = session.url;
        return;
      }
      setCart([]);
      setMessage(t.orderSaved(order.id));
      setMessageType('success');
    } catch (error) {
      setMessage(error.message.includes('Stripe') ? t.paymentSetupError : error.message);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell cartCount={cart.length} navigate={navigate} language={language} setLanguage={setLanguage} t={t}>
      <section className="checkoutPage checkoutExperience">
        <header className="checkoutIntro">
          <p>{t.secureCheckout}</p>
          <h1>{t.checkoutTitle}</h1>
        </header>
        <ol className="checkoutProgress">
          {t.checkoutSteps.map((label, index) => (
            <li className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''} key={label}>
              <button onClick={() => step > index + 1 && setStep(index + 1)} disabled={step <= index + 1}>
                <span>{step > index + 1 ? '✓' : index + 1}</span><b>{label}</b>
              </button>
            </li>
          ))}
        </ol>

        <div className="checkoutShell">
          <div className="checkoutStage">
            {message && <div className={`checkoutErrorBox ${messageType}`}>{message}</div>}

            {step === 1 && (
              <form className="checkoutStep" onSubmit={nextStep}>
                <div className="checkoutStepHeading"><span>01</span><div><h2>{t.personalTitle}</h2><p>{t.personalLead}</p></div></div>
                <div className="checkoutFields twoColumns">
                  <label>{t.firstName}<input autoComplete="given-name" required value={customer.firstName} onChange={(event) => updateCustomer('firstName', event.target.value)} /></label>
                  <label>{t.lastName}<input autoComplete="family-name" required value={customer.lastName} onChange={(event) => updateCustomer('lastName', event.target.value)} /></label>
                  <label>{t.email}<input type="email" autoComplete="email" required value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} /></label>
                  <label>{t.phone}<input type="tel" autoComplete="tel" required value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} /></label>
                </div>
                <div className="checkoutActions"><button className="luxeCheckoutButton"><span>{t.next}</span><b>→</b></button></div>
              </form>
            )}

            {step === 2 && (
              <form className="checkoutStep" onSubmit={nextStep}>
                <div className="checkoutStepHeading"><span>02</span><div><h2>{t.deliveryTitle}</h2><p>{t.deliveryLead}</p></div></div>
                <div className="postDeliveryCard">
                  <div className="postLogoMark"><span>POST</span><b>➜</b></div>
                  <div><strong>{t.austriaPost}</strong><p>{t.shippingCostNote}</p><small>{t.shippingFinalNote}</small></div>
                </div>
                <div className="checkoutFields deliveryFields">
                  <label>{t.country}<select autoComplete="country" value={customer.country} onChange={(event) => updateCustomer('country', event.target.value)}>
                    {checkoutCountries.map((item) => <option value={item[0]} key={item[0]}>{item[language === 'ru' ? 1 : 2]}</option>)}
                  </select></label>
                  <label>{t.postalCode}<input autoComplete="postal-code" required value={customer.postalCode} onChange={(event) => updateCustomer('postalCode', event.target.value)} /></label>
                  <label>{t.city}<input list="city-suggestions" autoComplete="address-level2" required value={customer.city} onChange={(event) => updateCustomer('city', event.target.value)} />
                    <datalist id="city-suggestions">{citySuggestions.map((city) => <option value={city} key={city} />)}</datalist>
                  </label>
                  <label className="wideField">{t.streetAddress}<input autoComplete="street-address" required value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} /></label>
                </div>
                <div className="checkoutActions"><button type="button" className="checkoutBackButton" onClick={() => setStep(1)}>← {t.back}</button><button className="luxeCheckoutButton"><span>{t.next}</span><b>→</b></button></div>
              </form>
            )}

            {step === 3 && (
              <form className="checkoutStep" onSubmit={nextStep}>
                <div className="checkoutStepHeading"><span>03</span><div><h2>{t.paymentTitle}</h2><p>{t.paymentLead}</p></div></div>
                <div className="paymentChoiceList">
                  <label className={paymentMethod === 'card' ? 'selected' : ''}>
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    <span className="radioDot" />
                    <div><strong>{t.cardAndWallets}</strong><small>{t.cardAndWalletsNote}</small><PaymentLogos /></div>
                  </label>
                  <label className={paymentMethod === 'bank' ? 'selected' : ''}>
                    <input type="radio" name="payment" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                    <span className="radioDot" />
                    <div><strong>{t.bank}</strong><small>{t.bankNote}</small><div className="bankIcon">IBAN</div></div>
                  </label>
                </div>
                <div className="checkoutActions"><button type="button" className="checkoutBackButton" onClick={() => setStep(2)}>← {t.back}</button><button className="luxeCheckoutButton"><span>{t.next}</span><b>→</b></button></div>
              </form>
            )}

            {step === 4 && (
              <section className="checkoutStep reviewStep">
                <div className="checkoutStepHeading"><span>04</span><div><h2>{t.reviewTitle}</h2><p>{t.reviewLead}</p></div></div>
                <div className="reviewGrid">
                  <article><header><h3>{t.contactDetails}</h3><button onClick={() => setStep(1)}>{t.edit}</button></header><p>{customer.firstName} {customer.lastName}<br />{customer.email}<br />{customer.phone}</p></article>
                  <article><header><h3>{t.deliveryDetails}</h3><button onClick={() => setStep(2)}>{t.edit}</button></header><p>{customer.address}<br />{customer.postalCode} {customer.city}<br />{countryName}</p></article>
                  <article><header><h3>{t.paymentMethod}</h3><button onClick={() => setStep(3)}>{t.edit}</button></header><p>{paymentMethod === 'card' ? t.cardAndWallets : t.bank}</p></article>
                </div>
                <div className="reviewProducts">{cart.map((item) => <div key={item.id}><img src={item.image} alt="" /><span>{language === 'en' && item.nameEn ? item.nameEn : item.name}</span><strong>{money(item.price, item.currency, language)}</strong></div>)}</div>
                <div className="reviewTotal"><span>{t.total}</span><strong>{money(total, 'EUR', language)}</strong></div>
                <div className="checkoutActions"><button className="checkoutBackButton" onClick={() => setStep(3)}>← {t.back}</button><button className="luxeCheckoutButton finalPayButton" disabled={isSubmitting} onClick={submit}><span>{isSubmitting ? t.redirectingToPayment : t.placeOrder}</span><b>→</b></button></div>
              </section>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Admin({ products, categories, materials, refreshProducts, refreshMaterials, navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [section, setSection] = useState('products');
  const [productView, setProductView] = useState('stock');
  const [loginError, setLoginError] = useState('');

  const login = (event) => {
    event.preventDefault();
    setLoginError('');
    if (!email.trim() || !password.trim()) {
      setLoginError('Введите электронную почту и пароль.');
      return;
    }
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <section className="adminLoginPage">
        <button className="adminBackLink" onClick={() => navigate('/')}>Вернуться в магазин</button>
        <form className="adminLoginCard" onSubmit={login}>
          <p>Вход администратора</p>
          <h1>Antique Treasures</h1>
          <label>
            Электронная почта
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" />
          </label>
          <label>
            Пароль
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль администратора" />
          </label>
          <button className="primary">Войти</button>
          {loginError && <p className="adminStatus">{loginError}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="adminPage">
      <header className="adminHeader">
        <button className="brand" onClick={() => navigate('/')}>Antique Treasures</button>
        <nav className="adminTopNav">
          <button className={section === 'products' ? 'active' : ''} onClick={() => setSection('products')}>Управление товарами</button>
          <button className={section === 'materials' ? 'active' : ''} onClick={() => setSection('materials')}>Справочник материалов</button>
          <button className={section === 'orders' ? 'active' : ''} onClick={() => setSection('orders')}>Заказы</button>
          <button onClick={logout}>Выйти</button>
        </nav>
      </header>
      {section === 'products' ? (
        <>
          <div className="adminSubnav">
            <button className={productView === 'add' ? 'active' : ''} onClick={() => setProductView('add')}>Добавить товар</button>
            <button className={productView === 'stock' ? 'active' : ''} onClick={() => setProductView('stock')}>Просмотреть склад</button>
            <button className={productView === 'archive' ? 'active' : ''} onClick={() => setProductView('archive')}>Архив редкостей</button>
          </div>
          <ProductAdmin password={password} products={products} categories={categories} materials={materials} refresh={refreshProducts} view={productView} setView={setProductView} />
        </>
      ) : section === 'materials' ? (
        <MaterialAdmin password={password} materials={materials} refresh={refreshMaterials} />
      ) : (
        <OrderAdmin password={password} />
      )}
    </section>
  );
}

function ProductAdmin({ password, products, categories, materials, refresh, view, setView }) {
  const [product, setProduct] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const update = (field, value) => setProduct((current) => ({ ...current, [field]: value }));

  const upload = async (file) => {
    if (!file) return;
    const url = await api.upload(file, password);
    setProduct((current) => {
      const images = [...new Set([...(current.images || []), url])].slice(0, 10);
      return { ...current, image: current.image || url, images };
    });
  };

  const removeImage = (url) => {
    setProduct((current) => {
      const images = (current.images || []).filter((image) => image !== url);
      return { ...current, images, image: current.image === url ? (images[0] || '') : current.image };
    });
  };

  const toggleMaterial = (id) => {
    setProduct((current) => {
      const selected = current.materialIds || [];
      return { ...current, materialIds: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('');
    if (!password.trim()) {
      setStatus('Введите пароль администратора и нажмите "Запомнить".');
      return;
    }
    if (!product.name.trim()) {
      setStatus('Добавьте название товара.');
      return;
    }
    if (!String(product.nameEn || '').trim() || !String(product.descriptionEn || '').trim()) {
      setStatus('Добавьте название и описание товара на английском языке.');
      return;
    }
    try {
      setIsSaving(true);
      await api.saveProduct({
        ...product,
        quantity: Math.max(0, Number(product.quantity || 0)),
        status: Number(product.quantity || 0) === 0 ? 'sold' : product.status,
        details: String(product.details || '').split(',').map((item) => item.trim()).filter(Boolean),
        detailsEn: String(product.detailsEn || '').split(',').map((item) => item.trim()).filter(Boolean),
        material: materials.filter((item) => (product.materialIds || []).includes(item.id)).map((item) => item.name).join(', '),
        materialEn: materials.filter((item) => (product.materialIds || []).includes(item.id)).map((item) => item.nameEn || item.name).join(', '),
      }, password, editingId);
      setStatus('Товар сохранен');
      setProduct(emptyProduct);
      setEditingId(null);
      refresh();
      setView('stock');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (item) => {
    setProduct({
      ...item,
      details: (item.details || []).join(', '),
      detailsEn: (item.detailsEn || []).join(', '),
      materialIds: item.materialIds || [],
    });
    setEditingId(item.id);
    setView('add');
  };

  return (
    <div className={`adminGrid ${view === 'add' ? 'adminGridForm' : 'adminGridStock'}`}>
      {view === 'add' ? (
        <form className="productForm" onSubmit={submit}>
          <h2>{editingId ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <div className="adminLanguageBlock">
            <span className="adminLanguageLabel">Русская версия · RU</span>
            <label>Название товара<input value={product.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label>Описание<textarea value={product.description} onChange={(event) => update('description', event.target.value)} /></label>
            <label>Камень или вставка (если применимо)<input value={product.stone} onChange={(event) => update('stone', event.target.value)} placeholder="Оставьте пустым, если у предмета нет камня или вставки" /></label>
            <label>Дополнительные детали через запятую<input value={product.details} onChange={(event) => update('details', event.target.value)} /></label>
          </div>
          <div className="adminLanguageBlock">
            <span className="adminLanguageLabel">English version · EN</span>
            <label>Product name<input value={product.nameEn || ''} onChange={(event) => update('nameEn', event.target.value)} placeholder="English product name" /></label>
            <label>Description<textarea value={product.descriptionEn || ''} onChange={(event) => update('descriptionEn', event.target.value)} placeholder="Product description in English" /></label>
            <label>Stone or insert (if applicable)<input value={product.stoneEn || ''} onChange={(event) => update('stoneEn', event.target.value)} placeholder="Leave blank when not applicable" /></label>
            <label>Additional details, comma-separated<input value={product.detailsEn || ''} onChange={(event) => update('detailsEn', event.target.value)} /></label>
            <small>Эти поля отображаются покупателю после переключения сайта на английский язык.</small>
          </div>
          {['price', 'quantity'].map((field) => (
            <label key={field}>
              {({ price: 'Цена', quantity: 'Количество на складе' })[field]}
              <input type={field === 'quantity' ? 'number' : 'text'} min={field === 'quantity' ? '0' : undefined} value={product[field]} onChange={(event) => update(field, event.target.value)} />
            </label>
          ))}
          <div className="adminSelectRow">
            <label>Категория<select value={product.category} onChange={(event) => update('category', event.target.value)}>
              {categories.productTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select></label>
            <label>Эпоха<select value={product.era} onChange={(event) => update('era', event.target.value)}>
              {categories.eras.map((item) => <option key={item} value={item}>{item}</option>)}
              <option value="Винтаж">Винтаж</option>
              <option value="Антиквариат">Антиквариат</option>
            </select></label>
            <fieldset className="materialPicker">
              <legend>Состав и материалы</legend>
              {!materials.length && <p>Сначала добавьте материалы в разделе «Справочник материалов».</p>}
              {materials.map((material) => (
                <label key={material.id}>
                  <input type="checkbox" checked={(product.materialIds || []).includes(material.id)} onChange={() => toggleMaterial(material.id)} />
                  {material.name}
                </label>
              ))}
            </fieldset>
          </div>
          <label>Статус<select value={product.status} onChange={(event) => update('status', event.target.value)}>
            <option value="available">В наличии</option>
            <option value="reserved">Резерв</option>
            <option value="sold">Продано</option>
          </select></label>
          <label>Фото товара — до 10<input type="file" accept="image/*" multiple onChange={(event) => Promise.all([...event.target.files].slice(0, 10 - (product.images || []).length).map(upload))} /></label>
          <div className="adminImageGrid">
            {(product.images || []).map((image, index) => (
              <div key={image}>
                <img className="adminPreview" src={image} alt="" />
                <span>{index === 0 ? 'Главное фото' : `Фото ${index + 1}`}</span>
                <button type="button" onClick={() => removeImage(image)}>Удалить</button>
              </div>
            ))}
          </div>
          <button className="primary" disabled={isSaving}>{isSaving ? 'Сохраняем...' : 'Сохранить товар'}</button>
          {editingId && <button type="button" onClick={() => { setProduct(emptyProduct); setEditingId(null); }}>Отменить редактирование</button>}
          {status && <p className="adminStatus">{status}</p>}
        </form>
      ) : (
        <div className="adminList stockList">
          <h2>{view === 'archive' ? 'Архив редкостей' : 'Склад'}</h2>
          {products.filter((item) => view === 'archive'
            ? item.status === 'sold' || Number(item.quantity || 0) === 0
            : item.status !== 'sold' && Number(item.quantity || 0) > 0).map((item) => (
            <div className="adminItem" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div><strong>{item.name}</strong><span>{money(item.price, item.currency)} · {item.category} · Остаток: {item.quantity || 0} · {item.status}</span></div>
              <button onClick={() => edit(item)}>Изменить</button>
              <button onClick={() => api.deleteProduct(item.id, password).then(refresh)}>Удалить со склада</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyMaterial = {
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  aliasesText: '',
  image: '',
  sourceUrl: '',
};

function MaterialAdmin({ password, materials, refresh }) {
  const [material, setMaterial] = useState(emptyMaterial);
  const [editingId, setEditingId] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const update = (field, value) => setMaterial((current) => ({ ...current, [field]: value }));

  const upload = async (file) => {
    if (!file) return;
    try {
      update('image', await api.upload(file, password));
    } catch (error) {
      setStatus(error.message);
    }
  };

  const reset = () => {
    setMaterial(emptyMaterial);
    setEditingId('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!material.name.trim()) {
      setStatus('Укажите название материала на русском языке.');
      return;
    }
    try {
      setIsSaving(true);
      setStatus('');
      await api.saveMaterial({
        ...material,
        aliases: material.aliasesText.split(',').map((alias) => alias.trim()).filter(Boolean),
      }, password, editingId);
      setStatus('Материал сохранён и доступен в справочнике.');
      reset();
      refresh();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const edit = (item) => {
    setMaterial({ ...item, aliasesText: (item.aliases || []).join(', ') });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="materialAdminLayout">
      <form className="productForm materialForm" onSubmit={submit}>
        <h2>{editingId ? 'Редактировать материал' : 'Добавить материал'}</h2>
        <div className="bilingualFields">
          <label>Название — RU<input value={material.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>Название — EN<input value={material.nameEn} onChange={(event) => update('nameEn', event.target.value)} /></label>
        </div>
        <label>Описание — RU<textarea value={material.description} onChange={(event) => update('description', event.target.value)} placeholder={'Разделяйте абзацы пустой строкой.\n\nТак текст будет красиво разбит на странице.'} /></label>
        <label>Описание — EN<textarea value={material.descriptionEn} onChange={(event) => update('descriptionEn', event.target.value)} placeholder={'Separate paragraphs with an empty line.\n\nThey will appear as separate paragraphs on the page.'} /></label>
        <label>Синонимы через запятую<input value={material.aliasesText} onChange={(event) => update('aliasesText', event.target.value)} placeholder="томбак, tombac" /></label>
        <label>Внешняя ссылка на источник<input type="url" value={material.sourceUrl} onChange={(event) => update('sourceUrl', event.target.value)} placeholder="https://..." /></label>
        <label>Фотография материала<input type="file" accept="image/*" onChange={(event) => upload(event.target.files[0])} /></label>
        {material.image && <img className="adminPreview" src={material.image} alt="" />}
        <button className="primary" disabled={isSaving}>{isSaving ? 'Сохраняем...' : 'Сохранить материал'}</button>
        {editingId && <button type="button" onClick={reset}>Отменить редактирование</button>}
        {status && <p className="adminStatus">{status}</p>}
      </form>
      <div className="adminList materialAdminList">
        <h2>Материалы в справочнике</h2>
        {!materials.length && <p className="emptyState">Справочник пока пуст.</p>}
        {materials.map((item) => (
          <div className="adminItem" key={item.id}>
            {item.image ? <img src={item.image} alt="" /> : <div className="materialPlaceholder">{item.name.slice(0, 1)}</div>}
            <div><strong>{item.name}</strong><span>{item.nameEn || 'Английское название не заполнено'}</span></div>
            <button onClick={() => edit(item)}>Изменить</button>
            <button onClick={() => api.deleteMaterial(item.id, password).then(refresh).catch((error) => setStatus(error.message))}>Удалить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderAdmin({ password }) {
  const [filters, setFilters] = useState({ query: '', status: '', dateFrom: '', dateTo: '' });
  const [orderView, setOrderView] = useState('list');
  const [statsPeriod, setStatsPeriod] = useState('month');
  const [statsFilters, setStatsFilters] = useState(() => statsPeriodRange('month'));
  const [statsOrders, setStatsOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(() => new URLSearchParams(window.location.search).get('order') || '');

  const load = () => {
    setError('');
    api.orders(password, filters).then((loadedOrders) => {
      setOrders(loadedOrders);
      if (selectedOrderId && !loadedOrders.some((order) => order.id === selectedOrderId)) {
        setSelectedOrderId('');
      }
    }).catch((event) => setError(event.message));
  };

  const loadStats = (nextFilters = statsFilters) => {
    setError('');
    api.orders(password, { dateFrom: nextFilters.dateFrom, dateTo: nextFilters.dateTo })
      .then(setStatsOrders)
      .catch((event) => setError(event.message));
  };

  const applyStatsPeriod = (period) => {
    setStatsPeriod(period);
    if (period === 'custom') return;
    const nextRange = statsPeriodRange(period);
    setStatsFilters(nextRange);
    loadStats(nextRange);
  };

  const updateLocalOrder = (id, patch) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, ...patch } : order));
  };

  const saveOrder = async (order) => {
    try {
      setError('');
      setSavingId(order.id);
      const updated = await api.updateOrder(order.id, {
        status: order.status,
        paymentStatus: order.paymentStatus,
        managerComment: order.managerComment,
      }, password);
      updateLocalOrder(order.id, updated);
    } catch (event) {
      setError(event.message);
    } finally {
      setSavingId('');
    }
  };

  useEffect(() => {
    if (password) load();
  }, []);

  const customerName = (order) => [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Имя не указано';
  const primaryItem = (order) => order.items?.[0] || {};
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const salesStats = useMemo(() => {
    const activeOrders = statsOrders.filter((order) => order.status !== 'Отменен');
    const paidOrders = activeOrders.filter((order) => order.paymentStatus === 'Оплачен');
    const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const paidRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemsSold = activeOrders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 1), 0), 0);
    const productMap = new Map();
    activeOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.name || item.nameEn || 'Товар без названия';
        const current = productMap.get(name) || { name, quantity: 0, total: 0 };
        current.quantity += Number(item.quantity || 1);
        current.total += Number(item.price || 0) * Number(item.quantity || 1);
        productMap.set(name, current);
      });
    });
    return {
      ordersCount: activeOrders.length,
      paidCount: paidOrders.length,
      revenue,
      paidRevenue,
      average: activeOrders.length ? revenue / activeOrders.length : 0,
      itemsSold,
      topProducts: [...productMap.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    };
  }, [statsOrders]);

  if (selectedOrder) {
    return (
      <div className="ordersPanel">
        <button className="backLink" onClick={() => setSelectedOrderId('')}>Назад к заказам</button>
        <article className="orderCard orderDetailCard">
          <header>
            <div>
              <strong>{selectedOrder.id}</strong>
              <span>{new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}</span>
            </div>
            <strong>{money(selectedOrder.total, selectedOrder.currency)}</strong>
          </header>
          <div className="orderDetailsGrid">
            <section>
              <h3>Покупатель</h3>
              <p>Имя: {selectedOrder.customer.firstName || 'не указано'}</p>
              <p>Фамилия: {selectedOrder.customer.lastName || 'не указано'}</p>
              <p>Телефон: {selectedOrder.customer.phone || 'не указан'}</p>
              <p>Email: {selectedOrder.customer.email || 'не указан'}</p>
            </section>
            <section>
              <h3>Доставка</h3>
              <p>Город: {selectedOrder.customer.city || 'не указан'}</p>
              <p>Адрес: {selectedOrder.customer.address || 'не указан'}</p>
            </section>
            <section>
              <h3>Оплата и статус</h3>
              <p>Способ оплаты: {selectedOrder.paymentMethod}</p>
              <label>Статус заказа<select value={selectedOrder.status} onChange={(event) => updateLocalOrder(selectedOrder.id, { status: event.target.value })}>
                {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select></label>
              <label>Статус оплаты<select value={selectedOrder.paymentStatus} onChange={(event) => updateLocalOrder(selectedOrder.id, { paymentStatus: event.target.value })}>
                {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select></label>
            </section>
            <section>
              <h3>Состав заказа</h3>
              {selectedOrder.items.map((item) => (
                <div className="orderDetailItem" key={`${selectedOrder.id}-${item.id}`}>
                  {item.image && <img src={item.image} alt={item.name || 'Товар'} />}
                  <p>{item.name} · {item.quantity || 1} шт. · {money((item.price || 0) * (item.quantity || 1), item.currency || selectedOrder.currency)}</p>
                </div>
              ))}
            </section>
          </div>
          <div className="orderManagementRow">
            <label>Комментарий менеджера<textarea value={selectedOrder.managerComment || ''} onChange={(event) => updateLocalOrder(selectedOrder.id, { managerComment: event.target.value })} /></label>
            <button className="primary" disabled={savingId === selectedOrder.id} onClick={() => saveOrder(selectedOrder)}>{savingId === selectedOrder.id ? 'Сохраняем...' : 'Сохранить изменения'}</button>
          </div>
          {selectedOrder.comment && <p className="orderComment">Комментарий покупателя: {selectedOrder.comment}</p>}
          {selectedOrder.updatedAt && <p className="orderComment">Последнее обновление: {new Date(selectedOrder.updatedAt).toLocaleString('ru-RU')}</p>}
        </article>
      </div>
    );
  }

  return (
    <div className="ordersPanel">
      <div className="ordersHeaderRow">
        <h2>{orderView === 'stats' ? 'Статистика продаж' : 'Заказы'}</h2>
        <div className="ordersViewSwitch">
          <button className={orderView === 'list' ? 'active' : ''} onClick={() => setOrderView('list')}>Список заказов</button>
          <button className={orderView === 'stats' ? 'active' : ''} onClick={() => { setOrderView('stats'); loadStats(); }}>Статистика</button>
        </div>
      </div>
      {error && <p className="errorText">{error}</p>}
      {orderView === 'stats' ? (
        <div className="statsPanel">
          <div className="statsControls">
            <div className="statsPeriodButtons">
              {statsPeriods.map((period) => <button className={statsPeriod === period.value ? 'active' : ''} key={period.value} onClick={() => applyStatsPeriod(period.value)}>{period.label}</button>)}
            </div>
            <input type="date" value={statsFilters.dateFrom} onChange={(event) => { setStatsPeriod('custom'); setStatsFilters({ ...statsFilters, dateFrom: event.target.value }); }} />
            <input type="date" value={statsFilters.dateTo} onChange={(event) => { setStatsPeriod('custom'); setStatsFilters({ ...statsFilters, dateTo: event.target.value }); }} />
            <button onClick={() => loadStats()}>Показать</button>
          </div>
          <div className="statsGrid">
            <div><span>Продажи</span><strong>{money(salesStats.revenue, 'EUR')}</strong></div>
            <div><span>Оплачено</span><strong>{money(salesStats.paidRevenue, 'EUR')}</strong></div>
            <div><span>Заказы</span><strong>{salesStats.ordersCount}</strong></div>
            <div><span>Оплаченные</span><strong>{salesStats.paidCount}</strong></div>
            <div><span>Средний чек</span><strong>{money(salesStats.average, 'EUR')}</strong></div>
            <div><span>Товаров</span><strong>{salesStats.itemsSold}</strong></div>
          </div>
          <div className="statsTopProducts">
            <h3>Топ товаров</h3>
            {!salesStats.topProducts.length && <p className="emptyState">За выбранный период продаж пока нет.</p>}
            {salesStats.topProducts.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>
                <strong>{item.quantity} шт. · {money(item.total, 'EUR')}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="orderFilters">
            <input placeholder="Имя, фамилия, телефон, товар или номер заказа" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Все статусы</option>
              {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
            <button onClick={load}>Найти</button>
          </div>
          {!orders.length && <p className="emptyState">Заказов пока нет или ничего не найдено по выбранным фильтрам.</p>}
          {orders.map((order) => {
            const item = primaryItem(order);
            return (
            <article className={`orderCard orderSummaryCard ${order.status === 'Новый заказ' ? 'isNewOrder' : ''}`} key={order.id}>
              <img className="orderThumb" src={item.image || '/sample-products/ring.svg'} alt={item.name || 'Товар'} />
              <div className="orderSummaryMain">
                <span className="orderStatusPill">{order.status || 'Новый заказ'}</span>
                <strong>{item.name || 'Товар без названия'}</strong>
                <span>{order.id} · {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
              </div>
              <div className="orderCustomerBrief">
                <span>{customerName(order)}</span>
                <span>{order.customer?.phone || 'телефон не указан'}</span>
              </div>
              <strong>{money(order.total, order.currency)}</strong>
              <button onClick={() => setSelectedOrderId(order.id)}>Детали</button>
            </article>
            );
          })}
        </>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
