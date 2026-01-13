const yahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        const quote = await yahooFinance.quote('2330.TW');
        console.log('Success:', quote);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
