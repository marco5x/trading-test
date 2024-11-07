export const apiKey ="87f590cd48b6df443edd153c0a112bc373171ef881cbdf699025942166561c40"

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
    };
}

// Returns all parts of the symbol
export function parseFullSymbol(fullSymbol) {
    const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
    if (!match) {
        return null;
    }
    return { exchange: match[1], fromSymbol: match[2], toSymbol: match[3] };
}