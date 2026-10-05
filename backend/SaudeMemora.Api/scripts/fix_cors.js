const fs = require('fs');
const path = 'C:/Users/rafae/Documents/GitHub/saude-memora/backend/SaudeMemora.Api/Program.cs';
let content = fs.readFileSync(path, 'utf8');

const target = `        else
        {
            // Fallback para desenvolvimento e Vercel sem configuração
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }`;

const replacement = `        else if (builder.Environment.IsDevelopment())
        {
            // Fallback apenas para desenvolvimento
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }`;

const targetNormalized = target.replace(/\r\n/g, '\n');
content = content.replace(/\r\n/g, '\n');
if(content.includes(targetNormalized)) {
    content = content.replace(targetNormalized, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('CORS Fixed');
} else {
    console.log('Target not found');
}
