export const apiKey ="59bf9216eb63c0a212485b0abb06639bacb0875bf3549d9cf49d18f3ac0137da"

export async function makeApiRequest(path) {
	try {
		const url = new URL(`https://min-api.cryptocompare.com/${path}`);
		url.searchParams.append('api_key',apiKey)
		const response = await fetch(url.toString());
		return response.json();
	} catch (error) {
		throw new Error(`CryptoCompare request error: ${error.status}`);
	}
}

// Generates a symbol ID from a pair of the coins
export function generateSymbol(exchange, fromSymbol, toSymbol) {
	const short = `${fromSymbol}/${toSymbol}`;
	return {
		short,
		full: `${exchange}:${short}`,
	};
}

// Returns all parts of the symbol
export function parseFullSymbol(fullSymbol) {
	const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
	
    if (!match) return null;

	return {
		exchange: match[1],
		fromSymbol: match[2],
		toSymbol: match[3],
	};
}
