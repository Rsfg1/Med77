/* =========================================================
   МЕД77 — настройки сайта.
   Всё, что помечено ЗАГЛУШКА, замените на реальные данные.
   ========================================================= */
const CONFIG = {
  // ЗАГЛУШКА: телефон диспетчера
  phone: '+79296260000',
  phoneText: '+7 (929) 626-00-00',

  // ЗАГЛУШКА: мессенджеры
  telegram: 'https://t.me/med77_placeholder',
  whatsapp: '79296260000',          // номер без «+», для ссылки wa.me
  max: '',                          // ссылка на чат в MAX; пусто — кнопка ведёт к контактам

  // Куда отправлять заявки с форм.
  // Укажите URL обработчика (свой сервер, Formspree, вебхук Telegram-бота и т.п.),
  // он получит POST с JSON. Пока пусто — заявка открывается готовым сообщением в WhatsApp.
  formEndpoint: '',

  // ЗАГЛУШКА: цены для калькулятора, ₽
  prices: {
    city: 3500,      // по Москве
    region: 5000,    // по Московской области
    perKm: 40,       // междугородние, за км
    minRussia: 15000,// минимальная стоимость междугородней перевозки
    stairs: 500,     // спуск/подъём без лифта (за этаж, в расчёте — от)
    medic: 2000,     // сопровождение медработника
    oxygen: 1500,    // кислород
    wait: 1000       // ожидание, за час
  }
};

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');

/* ----- Контакты из CONFIG ----- */
$$('.js-phone').forEach((a) => {
  a.href = 'tel:' + CONFIG.phone;
  if (/^\+7[\d\s()-]+$/.test(a.textContent.trim())) a.textContent = CONFIG.phoneText;
});
$$('.js-phone-text').forEach((el) => { el.textContent = CONFIG.phoneText; });
$$('.js-tg').forEach((a) => { a.href = CONFIG.telegram; });
$$('.js-wa').forEach((a) => { a.href = 'https://wa.me/' + CONFIG.whatsapp; });
$$('.js-max').forEach((a) => {
  if (CONFIG.max) { a.href = CONFIG.max; a.target = '_blank'; a.rel = 'noopener'; }
});
$$('.js-price-city').forEach((el) => { el.textContent = fmt(CONFIG.prices.city); });
$$('.js-year').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ----- Калькулятор ----- */
const calcForm = $('.js-lead-form[data-form="calc"]');
const kmField = $('.field--km');
const totalEl = $('.js-calc-total');

function calcTotal() {
  const p = CONFIG.prices;
  const route = calcForm.route.value;
  const extras = $$('input[name="extra"]:checked', calcForm).map((i) => i.value);
  let sum;
  if (route === 'russia') {
    const km = parseInt(calcForm.km.value, 10);
    sum = km > 0 ? Math.max(km * p.perKm, p.minRussia) : p.minRussia;
  } else {
    sum = p[route];
  }
  extras.forEach((e) => { sum += p[e] || 0; });
  return sum;
}

function updateCalc() {
  kmField.hidden = calcForm.route.value !== 'russia';
  totalEl.textContent = 'от ' + fmt(calcTotal()) + ' ₽';
}
calcForm.addEventListener('input', updateCalc);
updateCalc();

/* ----- Маска телефона ----- */
function maskPhone(input) {
  let d = input.value.replace(/\D/g, '');
  if (!d) { input.value = ''; return; }
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  let out = '+7';
  if (d.length > 1) out += ' (' + d.slice(1, 4);
  if (d.length >= 4) out += ') ' + d.slice(4, 7);
  if (d.length >= 7) out += '-' + d.slice(7, 9);
  if (d.length >= 9) out += '-' + d.slice(9, 11);
  input.value = out;
}
$$('input[type="tel"]').forEach((inp) => {
  inp.addEventListener('input', () => { maskPhone(inp); inp.classList.remove('is-invalid'); });
});

/* ----- Отправка заявок ----- */
const EXTRA_LABELS = {
  stairs: 'спуск/подъём без лифта',
  medic: 'сопровождение медработника',
  oxygen: 'кислород',
  wait: 'ожидание'
};
const ROUTE_LABELS = { city: 'по Москве', region: 'Московская область', russia: 'в другой город' };

function collect(form) {
  const data = {
    form: form.dataset.form,
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    page: location.href
  };
  if (form.dataset.form === 'calc') {
    data.route = ROUTE_LABELS[form.route.value];
    if (form.route.value === 'russia' && form.km.value) data.km = form.km.value;
    data.extras = $$('input[name="extra"]:checked', form).map((i) => EXTRA_LABELS[i.value]);
    data.estimate = totalEl.textContent;
  } else if (form.route_text) {
    data.route = form.route_text.value.trim();
  }
  return data;
}

function toMessage(d) {
  const lines = ['Заявка с сайта МЕД77'];
  if (d.name) lines.push('Имя: ' + d.name);
  lines.push('Телефон: ' + d.phone);
  if (d.route) lines.push('Маршрут: ' + d.route + (d.km ? ', ~' + d.km + ' км' : ''));
  if (d.extras && d.extras.length) lines.push('Нужно: ' + d.extras.join(', '));
  if (d.estimate) lines.push('Расчёт на сайте: ' + d.estimate);
  return lines.join('\n');
}

const thanks = $('#thanks');
const thanksWa = $('.js-thanks-wa');
const thanksOk = $('.js-thanks-ok');
function showThanks(text, waLink) {
  if (text) $('.js-thanks-text').textContent = text;
  thanksWa.hidden = !waLink;
  thanksOk.hidden = !!waLink;
  if (waLink) thanksWa.href = waLink;
  thanks.showModal();
}
thanksWa.addEventListener('click', () => setTimeout(() => thanks.close(), 300));
thanks.addEventListener('click', (e) => { if (e.target === thanks) thanks.close(); });

$$('.js-lead-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = form.phone;
    if (phone.value.replace(/\D/g, '').length !== 11) {
      phone.classList.add('is-invalid');
      phone.focus();
      return;
    }
    const data = collect(form);
    const btn = form.querySelector('button[type="submit"]');

    if (!CONFIG.formEndpoint) {
      // Обработчик ещё не подключён — предлагаем отправить заявку через WhatsApp
      showThanks(
        'Остался один шаг: нажмите кнопку ниже, откроется WhatsApp с готовой заявкой. Отправьте её, и диспетчер сразу ответит.',
        'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(toMessage(data))
      );
      form.reset();
      if (form === calcForm) updateCalc();
      return;
    }

    btn.disabled = true;
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, message: toMessage(data) })
      });
      if (!res.ok) throw new Error(res.status);
      showThanks('Диспетчер перезвонит вам в течение 5 минут.');
      form.reset();
      if (form === calcForm) updateCalc();
    } catch (err) {
      showThanks('Не удалось отправить заявку. Пожалуйста, позвоните нам: ' + CONFIG.phoneText);
    } finally {
      btn.disabled = false;
    }
  });
});

/* ----- Липкая панель на мобильных ----- */
const stickyBar = $('.sticky-bar');
const hero = $('.hero');
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    stickyBar.classList.toggle('is-visible', !entry.isIntersecting);
  }).observe(hero);

  /* ----- Появление блоков ----- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.section__head, .service, .step, .feature, .review, .rating, .guarantees > div, .extras, .equip__gallery, .equip__text')
    .forEach((el) => { el.classList.add('reveal'); revealIO.observe(el); });
} else {
  stickyBar.classList.add('is-visible');
}
