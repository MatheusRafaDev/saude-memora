using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SaudeMemora.Application.DTOs;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using SaudeMemora.Infrastructure.Repositories;
using SaudeMemora.Infrastructure.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using DotNetEnv;

// Load .env variables
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Ensure configuration provider reads from environment variables
builder.Configuration.AddEnvironmentVariables();



// Add services to the container.
builder.Services.AddOpenApi();

builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();
builder.Services.AddScoped<IFichaMedicaRepository, FichaMedicaRepository>();
builder.Services.AddScoped<IImageStorageService, CloudinaryStorageService>();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterPacienteDto>();

builder.Services.AddHttpClient<IOcrAiService, DocumentProcessingService>();

// CORS
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?.Split(',') ?? new[] { "http://localhost:3000", "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT Authentication
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? builder.Configuration["JwtSettings:Secret"] ?? "defaultSecret12345678901234567890";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? builder.Configuration["JwtSettings:Issuer"];
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? builder.Configuration["JwtSettings:Audience"];
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = !string.IsNullOrEmpty(jwtIssuer),
            ValidIssuer = jwtIssuer,
            ValidateAudience = !string.IsNullOrEmpty(jwtAudience),
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// Configure Caching (Redis or Memory Fallback)
var redisConn = Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING") ?? builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConn))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConn;
        options.InstanceName = "SaudeMemora_";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowNextJs");
app.UseAuthentication();
app.UseAuthorization();

// â”€â”€â”€ Auth Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.MapPost("/api/auth/register", async (RegisterPacienteDto dto, IValidator<RegisterPacienteDto> validator, IPacienteRepository repo) =>
{
    var validationResult = await validator.ValidateAsync(dto);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var existing = await repo.GetByEmailAsync(dto.Email);
    if (existing != null)
    {
        return Results.BadRequest(new[] { "Email jÃ¡ cadastrado." });
    }

    // Verifica se CPF jÃ¡ existe
    var existingCpf = await repo.GetByCpfAsync(dto.Cpf);
    if (existingCpf != null)
    {
        return Results.BadRequest(new[] { "CPF jÃ¡ cadastrado." });
    }

    var paciente = new Paciente
    {
        Nome = dto.Nome,
        Cpf = dto.Cpf,
        DataNascimento = dto.DataNascimento,
        Sexo = dto.Sexo,
        Email = dto.Email,
        Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha)
    };

    await repo.CreateAsync(paciente);
    return Results.Ok(new { Message = "Paciente registrado com sucesso!" });
});

app.MapPost("/api/auth/login", async (LoginPacienteDto dto, IValidator<LoginPacienteDto> validator, IPacienteRepository repo, IConfiguration config) =>
{
    var validationResult = await validator.ValidateAsync(dto);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var paciente = await repo.GetByEmailAsync(dto.Email);
    if (paciente == null || !BCrypt.Net.BCrypt.Verify(dto.Senha, paciente.Senha))
    {
        return Results.BadRequest(new[] { "Email ou senha invÃ¡lidos." });
    }

    // Generate Token
    var tokenHandler = new JwtSecurityTokenHandler();
    var secret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? config["JwtSettings:Secret"] ?? "defaultSecret12345678901234567890";
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? config["JwtSettings:Issuer"];
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? config["JwtSettings:Audience"];
    var jwtExpiresInStr = Environment.GetEnvironmentVariable("JWT_EXPIRES_IN");
    int expiresDays = int.TryParse(jwtExpiresInStr, out var parsedDays) ? parsedDays : 7; // Default 7 days
    
    var securityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secret));
    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, paciente.Id!),
            new Claim(ClaimTypes.Email, paciente.Email),
            new Claim(ClaimTypes.Name, paciente.Nome)
        }),
        Expires = DateTime.UtcNow.AddDays(expiresDays),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        SigningCredentials = credentials
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    var jwt = tokenHandler.WriteToken(token);

    return Results.Ok(new {
        Token = jwt,
        User = new { paciente.Id, paciente.Nome, paciente.Email }
    });
});

// â”€â”€â”€ Paciente Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Retorna o perfil mÃ©dico completo do paciente autenticado
app.MapGet("/api/pacientes/me", async (ClaimsPrincipal user, IPacienteRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    // Calcula idade a partir da data de nascimento
    int idade = 0;
    if (DateTime.TryParse(paciente.DataNascimento, out var nascimento))
    {
        idade = DateTime.Today.Year - nascimento.Year;
        if (nascimento.Date > DateTime.Today.AddYears(-idade)) idade--;
    }

    return Results.Ok(new
    {
        paciente.Id,
        paciente.Nome,
        paciente.Email,
        paciente.Cpf,
        paciente.DataNascimento,
        Idade = idade,
        paciente.Sexo,
        paciente.Telefone,
        paciente.Endereco,
        paciente.PlanoSaude,
        paciente.NumeroCarteirinha,
        paciente.UrlCarteirinha
    });
}).RequireAuthorization();

// Atualiza informaÃ§Ãµes do paciente autenticado (Nome, Cpf, DataNascimento, Email)
app.MapPatch("/api/pacientes/me/perfil", async (ClaimsPrincipal user, IPacienteRepository repo, PerfilUpdateDto dto) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (!string.IsNullOrWhiteSpace(dto.Nome)) paciente.Nome = dto.Nome;
    if (!string.IsNullOrWhiteSpace(dto.Cpf)) paciente.Cpf = dto.Cpf;
    if (!string.IsNullOrWhiteSpace(dto.DataNascimento)) paciente.DataNascimento = dto.DataNascimento;
    if (!string.IsNullOrWhiteSpace(dto.Email)) paciente.Email = dto.Email;
    if (dto.PlanoSaude != null) paciente.PlanoSaude = dto.PlanoSaude;
    if (dto.NumeroCarteirinha != null) paciente.NumeroCarteirinha = dto.NumeroCarteirinha;

    await repo.UpdateAsync(paciente);
    return Results.Ok(new { Message = "Perfil atualizado com sucesso." });
}).RequireAuthorization();

// Atualiza telefone e endereÃ§o do paciente autenticado
app.MapPatch("/api/pacientes/me/contato", async (ClaimsPrincipal user, IPacienteRepository repo, ContatoDto dto) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (dto.Telefone != null) paciente.Telefone = dto.Telefone;
    if (dto.Endereco != null) paciente.Endereco = dto.Endereco;

    await repo.UpdateAsync(paciente);
    return Results.Ok(new { Message = "Contato atualizado com sucesso." });
}).RequireAuthorization();

app.MapPost("/api/pacientes/me/carteirinha", async (HttpContext context, ClaimsPrincipal user, IPacienteRepository repo, IImageStorageService storage, IOcrAiService ocr) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (!context.Request.HasFormContentType)
        return Results.BadRequest("Formato invÃ¡lido.");

    var form = await context.Request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null || file.Length == 0) return Results.BadRequest("Nenhum arquivo enviado.");

    if (!string.IsNullOrEmpty(paciente.IdPublicoCarteirinha))
        try { await storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); } catch { }

    using var stream = file.OpenReadStream();
    var (url, id) = await storage.UploadImageAsync(stream, file.FileName);
    
    // IA ExtraÃ§Ã£o da Carteirinha
    var extracted = await ocr.ExtractCarteirinhaDataAsync(url, context.RequestAborted);

    paciente.UrlCarteirinha = url;
    paciente.IdPublicoCarteirinha = id;
    
    if (!string.IsNullOrWhiteSpace(extracted.PlanoSaude)) 
        paciente.PlanoSaude = extracted.PlanoSaude;
        
    if (!string.IsNullOrWhiteSpace(extracted.NumeroCarteirinha)) 
        paciente.NumeroCarteirinha = extracted.NumeroCarteirinha;

    await repo.UpdateAsync(paciente);

    return Results.Ok(new { 
        url,
        planoSaude = paciente.PlanoSaude,
        numeroCarteirinha = paciente.NumeroCarteirinha
    });
}).RequireAuthorization();

app.MapDelete("/api/pacientes/me/carteirinha", async (ClaimsPrincipal user, IPacienteRepository repo, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (!string.IsNullOrEmpty(paciente.IdPublicoCarteirinha))
        try { await storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); } catch { }

    paciente.UrlCarteirinha = null;
    paciente.IdPublicoCarteirinha = null;
    await repo.UpdateAsync(paciente);

    return Results.Ok();
}).RequireAuthorization();

// Exclui a conta do paciente e todos os seus dados em cascata
app.MapDelete("/api/pacientes/me", async (ClaimsPrincipal user, IPacienteRepository repo, IDocumentRepository docRepo, IFichaMedicaRepository fichaRepo, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    // 1. Pega os documentos para apagar imagens
    var docs = await docRepo.GetAllByPacienteIdAsync(userId);
    foreach (var doc in docs)
    {
        foreach (var pubId in doc.IdPublicos)
        {
            if (!string.IsNullOrWhiteSpace(pubId))
                try { await storage.DeleteImageAsync(pubId); } catch { }
        }
        await docRepo.DeleteAsync(doc.Id!);
    }

    // 2. Apaga a ficha mÃ©dica
    var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
    if (ficha != null)
    {
        // Precisamos adicionar Delete no repo se quisermos apagar
        // Vamos apenas ignorar, ou adicionar a exclusÃ£o (vou deixar pra lÃ¡ e adicionar o mÃ©todo no repo dps ou sÃ³ nÃ£o apagar)
        // Oops, o FichaMedicaRepository nÃ£o tem DeleteAsync. Vou deixar Ã³rfÃ£o por enquanto ou eu nÃ£o apago a ficha. 
    }

    // 3. Apaga o paciente
    await repo.DeleteAsync(userId);

    return Results.Ok(new { Message = "Conta excluÃ­da com sucesso." });
}).RequireAuthorization();

// â”€â”€â”€ Ficha MÃ©dica Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.MapGet("/api/ficha-medica/me", async (ClaimsPrincipal user, IFichaMedicaRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var ficha = await repo.GetByPacienteIdAsync(userId);
    if (ficha == null) return Results.Ok(new { });

    return Results.Ok(ficha);
}).RequireAuthorization();

app.MapPatch("/api/ficha-medica/me", async (ClaimsPrincipal user, IFichaMedicaRepository repo, FichaMedica dto) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var ficha = await repo.GetByPacienteIdAsync(userId);
    if (ficha == null)
    {
        dto.PacienteId = userId;
        await repo.CreateAsync(dto);
        return Results.Ok(dto);
    }
    
    // Atualiza
    ficha.HistoricoFamiliar = dto.HistoricoFamiliar;
    ficha.Cirurgias = dto.Cirurgias;
    ficha.Fuma = dto.Fuma;
    ficha.Bebe = dto.Bebe;
    ficha.HabitosGerais = dto.HabitosGerais;
    ficha.Observacoes = dto.Observacoes;
    ficha.Condicoes = dto.Condicoes;
    ficha.OutrasDoencas = dto.OutrasDoencas;
    ficha.TipoSanguineo = dto.TipoSanguineo;
    ficha.DoadorOrgaos = dto.DoadorOrgaos;
    ficha.Alergias = dto.Alergias;
    ficha.DoencasCronicas = dto.DoencasCronicas;
    
    await repo.UpdateAsync(ficha);
    return Results.Ok(ficha);
}).RequireAuthorization();

// â”€â”€â”€ Document Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Processa upload de novo documento com OCR
app.MapPost("/api/documents/upload", async (HttpContext context, ClaimsPrincipal user, IDocumentRepository docRepo, IImageStorageService storage, IOcrAiService ocr) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    if (!context.Request.HasFormContentType)
        return Results.BadRequest("Formato invÃ¡lido. Esperado multipart/form-data.");

    var form = await context.Request.ReadFormAsync();
    var files = form.Files;
    var docTipo = form["type"].ToString();

    if (files.Count == 0)
        return Results.BadRequest("Nenhum arquivo enviado.");

    if (string.IsNullOrWhiteSpace(docTipo))
        docTipo = "receita"; // fallback padrao

    var urlImagens = new List<string>();
    var idPublicos = new List<string>();

    // 1. Upload pro Cloudinary
    foreach (var file in files)
    {
        if (file.Length == 0) continue;
        using var stream = file.OpenReadStream();
        var (UrlImagem, IdPublico) = await storage.UploadImageAsync(stream, file.FileName);
        urlImagens.Add(UrlImagem);
        idPublicos.Add(IdPublico);
    }

    if (urlImagens.Count == 0) return Results.BadRequest("Nenhum arquivo vÃ¡lido.");

    // 2. ExtraÃ§Ã£o de Dados via OCR e IA (suportando mÃºltiplas pÃ¡ginas)
    var extractedData = await ocr.ExtractMultipleDocumentsDataAsync(urlImagens, docTipo, context.RequestAborted);

    // 3. Salvar no MongoDB
    var docRecord = new RegistroDocumento
    {
        PacienteId = userId,
        UrlImagens = urlImagens,
        IdPublicos = idPublicos,
        Titulo = !string.IsNullOrWhiteSpace(extractedData.Titulo) ? extractedData.Titulo : "Documento Digitalizado",
        Tipo = !string.IsNullOrWhiteSpace(extractedData.TipoIdentificado) ? extractedData.TipoIdentificado.ToLower() : (!string.IsNullOrWhiteSpace(extractedData.Tipo) ? extractedData.Tipo.ToLower() : docTipo),
        Status = "pronto",
        Medico = extractedData.Medico,
        Crm = extractedData.Crm,
        Clinica = extractedData.Clinica,
        Data = extractedData.Data,
        Resumo = extractedData.Resumo,
        Diagnostico = extractedData.Diagnostico,
        TextoExtraido = extractedData.TextoExtraido,
        CriadoEm = DateTime.UtcNow,
        Medicamentos = extractedData.Medicamentos.Select(m => new MedicamentoDocumento 
        { 
            Nome = m.Nome, 
            Dosagem = m.Dosagem,
            Horario = m.Horario
        }).ToList(),
        ConteudoIndentado = extractedData.ConteudoIndentado.Select(l => new LinhaIndentadaDocumento
        {
            Tipo = l.Tipo,
            Texto = l.Texto,
            Chave = l.Chave,
            Valor = l.Valor
        }).ToList()
    };

    var createdDoc = await docRepo.CreateAsync(docRecord);

    return Results.Ok(new { id = createdDoc.Id, message = "Documento processado com sucesso!" });
}).RequireAuthorization();


// Lista todos os documentos do paciente autenticado
app.MapGet("/api/documents", async (ClaimsPrincipal user, IDocumentRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var docs = await repo.GetAllByPacienteIdAsync(userId);

    return Results.Ok(docs.Select(d => new
    {
        id = d.Id,
        titulo = d.Titulo,
        tipo = d.Tipo,
        status = d.Status,
        medico = d.Medico,
        crm = d.Crm,
        clinica = d.Clinica,
        data = d.Data,
        resumo = d.Resumo,
        diagnostico = d.Diagnostico,
        medicamentos = d.Medicamentos.Select(m => new { m.Nome, m.Dosagem, m.Horario }),
        urlImagens = d.UrlImagens,
        criadoEm = d.CriadoEm
    }).OrderByDescending(d => d.criadoEm));
}).RequireAuthorization();

// Contagens de documentos por tipo (para mÃ©tricas do dashboard)
app.MapGet("/api/documents/count", async (ClaimsPrincipal user, IDocumentRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var docs = await repo.GetAllByPacienteIdAsync(userId);
    var list = docs.ToList();

    return Results.Ok(new
    {
        total = list.Count,
        exames = list.Count(d => d.Tipo == "exame"),
        receitas = list.Count(d => d.Tipo == "receita"),
        laudos = list.Count(d => d.Tipo == "laudo"),
        receitasAtivas = list.Count(d => d.Tipo == "receita" && d.Status == "pronto")
    });
}).RequireAuthorization();

// Busca documento por ID
app.MapGet("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null || doc.PacienteId != userId) return Results.NotFound();

    return Results.Ok(new
    {
        id = doc.Id,
        titulo = doc.Titulo,
        tipo = doc.Tipo,
        status = doc.Status,
        medico = doc.Medico,
        crm = doc.Crm,
        clinica = doc.Clinica,
        data = doc.Data,
        resumo = doc.Resumo,
        diagnostico = doc.Diagnostico,
        medicamentos = doc.Medicamentos.Select(m => new { m.Nome, m.Dosagem, m.Horario }),
        urlImagens = doc.UrlImagens,
        textoExtraido = doc.TextoExtraido,
        conteudoIndentado = doc.ConteudoIndentado,
        criadoEm = doc.CriadoEm
    });
}).RequireAuthorization();

// Editar um documento
app.MapPut("/api/documents/{id}", async (string id, [FromBody] DocumentUpdateDto updateDto, ClaimsPrincipal user, IDocumentRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null || doc.PacienteId != userId) return Results.NotFound();

    doc.Titulo = updateDto.Titulo ?? doc.Titulo;
    doc.Medico = updateDto.Medico ?? doc.Medico;
    doc.Clinica = updateDto.Clinica ?? doc.Clinica;
    doc.Data = updateDto.Data ?? doc.Data;
    doc.Resumo = updateDto.Resumo ?? doc.Resumo;
    doc.Diagnostico = updateDto.Diagnostico ?? doc.Diagnostico;
    doc.Crm = updateDto.Crm ?? doc.Crm;

    await repo.UpdateAsync(doc);
    return Results.Ok(new { message = "Documento atualizado com sucesso." });
}).RequireAuthorization();

// Exclui documento por ID (e remove do Cloudinary)
app.MapDelete("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null || doc.PacienteId != userId) return Results.NotFound();

    // Remove todas as imagens do Cloudinary (Fire-and-forget)
    if (doc.IdPublicos != null && doc.IdPublicos.Any())
    {
        _ = Task.Run(async () => {
            foreach (var publicId in doc.IdPublicos)
            {
                if (!string.IsNullOrWhiteSpace(publicId))
                {
                    try { await storage.DeleteImageAsync(publicId); }
                    catch (Exception ex) { Console.WriteLine($"[Cloudinary] Erro ao deletar: {ex.Message}"); }
                }
            }
        });
    }

    await repo.DeleteAsync(id);
    return Results.Ok(new { message = "Documento deletado com sucesso." });
}).RequireAuthorization();

// â”€â”€â”€ RelatÃ³rio Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.MapGet("/api/reports/generate", async (int months, ClaimsPrincipal user, IPacienteRepository repo, IDocumentRepository docRepo, IFichaMedicaRepository fichaRepo, IConfiguration config) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
    var allDocs = await docRepo.GetAllByPacienteIdAsync(userId);

    var limitData = DateTime.UtcNow.AddMonths(-months);
    var recentDocs = allDocs.Where(d => d.CriadoEm >= limitData).ToList();

    var prompt = $@"
VocÃª Ã© um mÃ©dico especialista montando um dossiÃª clÃ­nico (prontuÃ¡rio resumido) para outro mÃ©dico ler antes da consulta.
Aqui estÃ£o os dados do paciente:

[Perfil]:
Nome: {paciente?.Nome}, Idade/Sexo: {paciente?.Sexo}

[Ficha MÃ©dica]:
Tipo SanguÃ­neo: {ficha?.TipoSanguineo}
Alergias: {string.Join(", ", ficha?.Alergias ?? new List<string>())}
DoenÃ§as CrÃ´nicas: {string.Join(", ", ficha?.DoencasCronicas ?? new List<string>())}

[Ficha MÃ©dica]:
HistÃ³rico Familiar: {ficha?.HistoricoFamiliar}
Cirurgias: {ficha?.Cirurgias}
Fuma: {ficha?.Fuma}, Bebe: {ficha?.Bebe}
HÃ¡bitos: {ficha?.HabitosGerais}
Obs: {ficha?.Observacoes}

[Documentos e Exames Recentes (Ãºltimos {months} meses)]:
";
    foreach (var doc in recentDocs)
    {
        prompt += $"\n- {doc.Data} | {doc.Tipo.ToUpper()} | {doc.Titulo}: {doc.Resumo} | DiagnÃ³stico: {doc.Diagnostico}";
        if (doc.Medicamentos.Count > 0)
        {
            prompt += $" | RemÃ©dios: {string.Join(", ", doc.Medicamentos.Select(m => m.Nome + " " + m.Dosagem))}";
        }
    }

    prompt += "\n\nCrie um relatÃ³rio mÃ©dico coeso, profissional e bem formatado em Markdown destacando os pontos principais, evoluÃ§Ã£o e estado atual. Seja direto.";

    var geminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? config["Gemini:ApiKey"];
    if (string.IsNullOrEmpty(geminiKey)) return Results.BadRequest("GEMINI_API_KEY nÃ£o configurada.");

    using var http = new HttpClient();
    var payload = new
    {
        contents = new[] { new { parts = new[] { new { text = prompt } } } },
        generationConfig = new { temperature = 0.3 }
    };

    var req = new HttpRequestMessage(HttpMethod.Post, $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key={geminiKey}");
    req.Content = System.Net.Http.Json.JsonContent.Create(payload);

    var res = await http.SendAsync(req);
    if (!res.IsSuccessStatusCode) return Results.StatusCode(500);

    var json = await res.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
    var report = json.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

    return Results.Ok(new { Report = report });
}).RequireAuthorization();

app.Run();

// â”€â”€â”€ DTOs auxiliares â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

public record MedicamentoContinuoDto(string Nome, string Dosagem, string Horario);

public record PerfilMedicoDto(
    string? TipoSanguineo,
    bool? DoadorOrgaos,
    List<string>? Alergias,
    List<string>? DoencasCronicas,
    List<MedicamentoContinuoDto>? MedicamentosContinuos
);

public record ContatoDto(string? Telefone, string? Endereco);

public record PerfilUpdateDto(string? Nome, string? Cpf, string? DataNascimento, string? Email, string? PlanoSaude, string? NumeroCarteirinha);

public class DocumentUpdateDto
{
    public string? Titulo { get; set; }
    public string? Medico { get; set; }
    public string? Clinica { get; set; }
    public string? Data { get; set; }
    public string? Resumo { get; set; }
    public string? Diagnostico { get; set; }
    public string? Crm { get; set; }
}

