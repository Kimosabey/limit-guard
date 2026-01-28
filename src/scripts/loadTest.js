const autocannon = require('autocannon');

const run = async () => {
    const result = await autocannon({
        url: 'http://localhost:3000/api/test',
        connections: 100, // 100 concurrent connections
        pipelining: 1, // 1 request per connection
        duration: 5, // Run for 5 seconds
        amount: 200, // Or just try to hit 200 requests total
    });

    console.log(autocannon.printResult(result));

    // Custom check
    const success = result['2xx'];
    const rateLimited = result['4xx']; // Should be 429s

    console.log('--- SENIOR VERIFICATION ---');
    console.log(`✅ Success (200 OK): ${success}`);
    console.log(`🛡️  Blocked (429):    ${rateLimited}`);

    // If limit is 10/min, we expect ~10 successes and rest blocked.
    if (success <= 15 && rateLimited > 0) {
        console.log('✅ TEST PASSED: strict rate limit enforced.');
    } else {
        console.log('❌ TEST FAILED: Too many requests let through.');
    }
};

run();
