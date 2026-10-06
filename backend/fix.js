const fs = require('fs');
const files = [
    'SaudeMemora.Api/Program.cs',
    'SaudeMemora.Infrastructure/Repositories/DocumentRepository.cs',
    'SaudeMemora.Infrastructure/Repositories/PacienteRepository.cs',
    'SaudeMemora.Infrastructure/Repositories/FichaMedicaRepository.cs'
];
files.forEach(f => {
    if (fs.existsSync(f)) {
        let c = fs.readFileSync(f, 'utf8');
        c = c.replace(/catch\s*\{\s*\}/g, 'catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }');
        fs.writeFileSync(f, c, 'utf8');
    }
});
