const fs = require('fs');
const path = require('path');

const programPath = 'C:/Users/rafae/Documents/GitHub/saude-memora/backend/SaudeMemora.Api/Program.cs';
let content = fs.readFileSync(programPath, 'utf8');

// 1. Fix Mojibake (reverse utf8 encoding over latin1)
function fixEncoding(text) {
    try {
        const buf = Buffer.from(text, 'latin1');
        return buf.toString('utf8');
    } catch (e) {
        return text;
    }
}
// Actually, let's just do targeted replaces for mojibake we know
content = content.replace(/Email jÃ¡ cadastrado/g, 'Email já cadastrado');
content = content.replace(/Email ou senha invï¿½lidos/g, 'Email ou senha inválidos');
content = content.replace(/Email ou senha invlidos/g, 'Email ou senha inválidos');
content = content.replace(/O e-mail  obrigatrio/g, 'O e-mail é obrigatório');
content = content.replace(/Se o e-mail estiver cadastrado, voc receber um link/g, 'Se o e-mail estiver cadastrado, você receberá um link');
content = content.replace(/No foi possvel/g, 'Não foi possível');

// Fix JWT Secret loading and add Rate Limiting logic
const rateLimitSetup = `
// JWT: falhar no startup se não houver secret
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new InvalidOperationException("JWT_SECRET_KEY ausente ou curta (mín. 32 chars).");

// Rate limit
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("auth", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});
`;

content = content.replace(
    /var jwtSecret = Environment\.GetEnvironmentVariable\("JWT_SECRET_KEY"\) \?\? builder\.Configuration\["JwtSettings:Secret"\] \?\? "defaultSecret12345678901234567890";/,
    rateLimitSetup
);

content = content.replace(/app\.UseCors\("AllowNextJs"\);/, `app.UseCors("AllowNextJs");\napp.UseRateLimiter();`);

// Remove /api/logs and /api/debug-docs
content = content.replace(/app\.MapGet\("\/api\/logs",[\s\S]*?\}\);\r?\n/, '');
content = content.replace(/app\.MapGet\("\/api\/debug-docs",[\s\S]*?\}\);\r?\n/, '');

// Fix Login BCrypt fallback
content = content.replace(/catch\s*\{\s*\/\/\s*Fallback for mock data without BCrypt hash[\s\S]*?\}\s*\}/, `catch { return Results.BadRequest(new[] { "Email ou senha inválidos." }); }`);

// Fix 404 documents leak
content = content.replace(/if \(doc == null \|\| doc\.PacienteId != userId\) return Results\.NotFound\(new \{ docUser = doc\?.PacienteId, reqUser = userId \}\);/g, `if (doc == null || doc.PacienteId != userId) return Results.NotFound();`);
content = content.replace(/if \(doc == null \|\| doc\.PacienteId != userId\) return Results\.NotFound\(.*\);/g, `if (doc == null || doc.PacienteId != userId) return Results.NotFound();`);

fs.writeFileSync(programPath, content, 'utf8');
console.log('Program.cs updated.');
