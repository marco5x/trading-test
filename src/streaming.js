import { parseFullSymbol, apiKey } from './helpers.js';

const socket = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);
const channelToSubscription = new Map();

socket.addEventListener('open', () => {
	console.log('[socket] Connected');
});

socket.addEventListener('close', (reason) => {
	console.log('[socket] Disconnected:', reason);
});

socket.addEventListener('error', (error) => {
	console.log('[socket] Error:', error);
});

socket.addEventListener('message', (event) => {
	const data = JSON.parse(event.data);
	console.log('[socket] Message:', data);
	const {
		TYPE: eventTypeStr,
		M: exchange,
		FSYM: fromSymbol,
		TSYM: toSymbol,
		TS: tradeTimeStr,
		P: tradePriceStr,
	} = data;

	if (parseInt(eventTypeStr) !== 0) return;
	const tradePrice = parseFloat(tradePriceStr);
	const tradeTime = parseInt(tradeTimeStr);
	const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
    console.log("[channelString]",channelString);
    
	const subscriptionItem = channelToSubscription.get(channelString);
    console.log("[subscriptionItem]",channelString);

    if (subscriptionItem === undefined) return;
	
    const lastDailyBar = subscriptionItem.lastDailyBar;
	const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

	let bar;
	if (tradeTime >= nextDailyBarTime) {
		bar = {
			time: nextDailyBarTime,
			open: tradePrice,
			high: tradePrice,
			low: tradePrice,
			close: tradePrice,
		};
		console.log('[socket] Generate new bar', bar);
	} else {
		bar = {
			...lastDailyBar,
			high: Math.max(lastDailyBar.high, tradePrice),
			low: Math.min(lastDailyBar.low, tradePrice),
			close: tradePrice,
		};
		console.log('[socket] Update the latest bar by price', tradePrice);
	}
	subscriptionItem.lastDailyBar = bar;
	// Send data to every subscriber of that symbol
	subscriptionItem.handlers.forEach((handler) => handler.callback(bar));
});

function getNextDailyBarTime(barTime) {
	const date = new Date(barTime * 1000);
	date.setDate(date.getDate() + 1);
	return date.getTime() / 1000;
}

export function subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, lastDailyBar) {
    const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
    const interval = resolution === '1D' ? '1d' : '1m'; // Ajusta según tus necesidades
    const channelString = `${parsedSymbol.fromSymbol.toLowerCase()}${parsedSymbol.toSymbol.toLowerCase()}@kline_${interval}`;
    const handler = { id: subscriberUID, callback: onRealtimeCallback };
    let subscriptionItem = channelToSubscription.get(channelString);
    if (subscriptionItem) {
        // Ya suscrito al canal, usar la suscripción existente
        subscriptionItem.handlers.push(handler);
        return;
    }
    subscriptionItem = {
        subscriberUID,
        resolution,
        lastDailyBar,
        handlers: [handler],
    };
    channelToSubscription.set(channelString, subscriptionItem);
    console.log('[subscribeBars]: Subscribe to streaming. Channel:', channelString);
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${channelString}`);
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const bar = {
            time: message.k.t,
            low: parseFloat(message.k.l),
            high: parseFloat(message.k.h),
            open: parseFloat(message.k.o),
            close: parseFloat(message.k.c),
        };
        onRealtimeCallback(bar);
    };

    ws.onclose = () => {
        console.log('[subscribeBars]: WebSocket closed');
    };

    ws.onerror = (error) => {
        console.log('[subscribeBars]: WebSocket error', error);
    };

    // Guardar la instancia de WebSocket para poder cerrarla más tarde
    subscriptionItem.ws = ws;
}

export function unsubscribeFromStream(subscriberUID) {
    // Buscar una suscripción con id === subscriberUID
    for (const [channelString, subscriptionItem] of channelToSubscription.entries()) {
        const handlerIndex = subscriptionItem.handlers.findIndex(
            (handler) => handler.id === subscriberUID
        );

        if (handlerIndex !== -1) {
            // Eliminar de los handlers
            subscriptionItem.handlers.splice(handlerIndex, 1);

            if (subscriptionItem.handlers.length === 0) {
                // Desuscribirse del canal si era el último handler
                console.log('[unsubscribeBars]: Unsubscribe from streaming. Channel:', channelString);
                subscriptionItem.ws.close();
                channelToSubscription.delete(channelString);
                break;
            }
        }
    }
}
