const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const SEARCH_URL = 'https://api.dexscreener.com/latest/dex/search/?q=WBTC%20WETH%20arbitrum%20uniswap%20v3';

const state = {
    timerId: null,
    lowerLimit: null,
    upperLimit: null,
    lastPrice: null,
    deferredInstallPrompt: null,
};

const elements = {
    lowerLimit: document.getElementById('lowerLimit'),
    upperLimit: document.getElementById('upperLimit'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    installBtn: document.getElementById('installBtn'),
    installState: document.getElementById('installState'),
    lastPrice: document.getElementById('lastPrice'),
    lastCheck: document.getElementById('lastCheck'),
    message: document.getElementById('message'),
};

function setMessage(text, cssClass = '') {
    elements.message.textContent = text;
    elements.message.className = `message ${cssClass}`.trim();
}

function isValidLimit(value) {
    return Number.isFinite(value) && value > 0;
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        setMessage('Este navegador no soporta notificaciones del sistema.', 'error');
        return;
    }

    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}

function notifyUser(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

function parseDexPair(data) {
    const pairs = Array.isArray(data.pairs) ? data.pairs : [];

    const selected = pairs.find((pair) => {
        const isArbitrum = pair.chainId?.toLowerCase() === 'arbitrum';
        const isUniswap = pair.dexId?.toLowerCase() === 'uniswap';
        const labels = (pair.labels || []).map((item) => item.toLowerCase());
        const isV3 = labels.includes('v3');
        const base = pair.baseToken?.symbol?.toUpperCase();
        const quote = pair.quoteToken?.symbol?.toUpperCase();

        return isArbitrum && isUniswap && isV3 && base === 'WBTC' && (quote === 'WETH' || quote === 'ETH');
    });

    if (!selected) {
        throw new Error('No encontré el pool WBTC/ETH de Uniswap v3 en Arbitrum.');
    }

    const price = Number(selected.priceNative);
    if (!Number.isFinite(price) || price <= 0) {
        throw new Error('No se pudo leer un precio válido para el par.');
    }

    return price;
}

async function fetchWbtcEthPrice() {
    const response = await fetch(SEARCH_URL);
    if (!response.ok) {
        throw new Error(`Error al consultar la API (${response.status}).`);
    }

    const data = await response.json();
    return parseDexPair(data);
}

function updatePriceUI(price) {
    elements.lastPrice.textContent = `${price.toFixed(6)} ETH`;
    elements.lastCheck.textContent = new Date().toLocaleString();
}

function evaluatePrice(price) {
    const { lowerLimit, upperLimit } = state;

    if (price < lowerLimit) {
        const msg = `⚠️ El precio bajó de tu límite inferior (${price.toFixed(6)} ETH).`;
        setMessage(msg, 'alert');
        notifyUser('WBTC/ETH por debajo del límite', msg);
        return;
    }

    if (price > upperLimit) {
        const msg = `⚠️ El precio superó tu límite superior (${price.toFixed(6)} ETH).`;
        setMessage(msg, 'alert');
        notifyUser('WBTC/ETH por encima del límite', msg);
        return;
    }

    const info = `✅ Precio dentro del rango (${price.toFixed(6)} ETH).`;
    setMessage(info, 'ok');

    if (state.lastPrice !== null && state.lastPrice !== price) {
        notifyUser('WBTC/ETH actualizado', info);
    }
}

async function checkPrice() {
    try {
        const price = await fetchWbtcEthPrice();
        updatePriceUI(price);
        evaluatePrice(price);
        state.lastPrice = price;
    } catch (error) {
        setMessage(`No se pudo actualizar el precio: ${error.message}`, 'error');
    }
}

async function startMonitoring() {
    const lowerLimit = Number(elements.lowerLimit.value);
    const upperLimit = Number(elements.upperLimit.value);

    if (!isValidLimit(lowerLimit) || !isValidLimit(upperLimit)) {
        setMessage('Debes introducir límites válidos (números mayores que 0).', 'error');
        return;
    }

    if (lowerLimit >= upperLimit) {
        setMessage('El límite inferior debe ser menor que el superior.', 'error');
        return;
    }

    state.lowerLimit = lowerLimit;
    state.upperLimit = upperLimit;

    await requestNotificationPermission();

    elements.startBtn.disabled = true;
    elements.stopBtn.disabled = false;
    setMessage('Monitor activo. Consultando precio...', 'ok');

    await checkPrice();
    state.timerId = window.setInterval(checkPrice, CHECK_INTERVAL_MS);
}

function stopMonitoring() {
    if (state.timerId) {
        window.clearInterval(state.timerId);
    }

    state.timerId = null;
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
    setMessage('Monitor detenido.', 'error');
}

async function installApp() {
    if (!state.deferredInstallPrompt) {
        setMessage('La instalación no está disponible todavía en este navegador.', 'error');
        return;
    }

    state.deferredInstallPrompt.prompt();
    const result = await state.deferredInstallPrompt.userChoice;

    if (result.outcome === 'accepted') {
        elements.installState.textContent = 'Aplicación instalada correctamente.';
        setMessage('✅ Instalación aceptada.', 'ok');
    } else {
        setMessage('Instalación cancelada por el usuario.', 'error');
    }

    state.deferredInstallPrompt = null;
    elements.installBtn.hidden = true;
}

function setupInstallFlow() {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        state.deferredInstallPrompt = event;
        elements.installBtn.hidden = false;
        elements.installState.textContent = 'Lista para instalar. Pulsa “Instalar app”.';
    });

    window.addEventListener('appinstalled', () => {
        elements.installBtn.hidden = true;
        elements.installState.textContent = 'App instalada en este dispositivo.';
    });
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        elements.installState.textContent = 'Tu navegador no soporta Service Worker.';
        return;
    }

    try {
        await navigator.serviceWorker.register('./sw.js');
        elements.installState.textContent = 'PWA activa. Si usas HTTPS podrás instalarla.';
    } catch (error) {
        elements.installState.textContent = `No se pudo registrar el Service Worker: ${error.message}`;
    }
}

elements.startBtn.addEventListener('click', startMonitoring);
elements.stopBtn.addEventListener('click', stopMonitoring);
elements.installBtn.addEventListener('click', installApp);

setupInstallFlow();
registerServiceWorker();
