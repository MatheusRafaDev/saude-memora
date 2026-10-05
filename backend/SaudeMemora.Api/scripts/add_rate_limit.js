const fs = require('fs');
const programPath = 'C:/Users/rafae/Documents/GitHub/saude-memora/backend/SaudeMemora.Api/Program.cs';
let content = fs.readFileSync(programPath, 'utf8');

const endpointsToLimit = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/documents/upload',
    '/api/reports/generate'
];

endpointsToLimit.forEach(endpoint => {
    // we need to find the block app.MapPost("endpoint", ...) => { ... });
    // and replace the end `});` with `}).RequireRateLimiting("auth");`
    // but wait, some are MapGet.
    const startIdx = content.indexOf(`"${endpoint}"`);
    if (startIdx === -1) return;
    
    // find the next `});` after startIdx
    let endIdx = content.indexOf('});', startIdx);
    if (endIdx !== -1) {
        // check if it's already limited
        const nextChars = content.substring(endIdx, endIdx + 40);
        if (!nextChars.includes('.RequireRateLimiting')) {
            content = content.substring(0, endIdx) + '}).RequireRateLimiting("auth");' + content.substring(endIdx + 3);
        }
    }
});

fs.writeFileSync(programPath, content, 'utf8');
console.log('Rate limit added.');
