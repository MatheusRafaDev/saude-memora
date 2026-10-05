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
using SaudeMemora.Api.Workers;
using SaudeMemora.Api.Endpoints;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using DotNetEnv;
using Microsoft.Extensions.Caching.Distributed;

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
builder.Services.AddScoped<ISistemaLogRepository, SistemaLogRepository>();
builder.Services.AddScoped<IImageStorageService, CloudinaryStorageService>();
builder.Services.AddScoped<IAlertaMedicamentoService, AlertaMedicamentoService>();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterPacienteDto>();

builder.Services.AddHttpClient<IOcrAiService, DocumentProcessingService>();
builder.Services.AddHostedService<DocumentProcessingWorker>();
builder.Services.AddHostedService<KeepAliveWorker>();

// CORS
var corsOriginsStr = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";
var allowedOrigins = corsOriginsStr.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT Authentication

// JWT: falhar no startup se n�o houver secret
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new InvalidOperationException("JWT_SECRET_KEY ausente ou curta (m�n. 32 chars).");

// Rate limit
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("auth", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
        
    o.AddPolicy("upload", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        ctx.User.Identity?.Name ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
});

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

// Cria �ndices do MongoDB uma �nica vez no startup (fila + idempot�ncia).
// Roda em background para n�o atrasar o startup se o Mongo estiver inacess�vel.
_ = Task.Run(async () =>
{
    try
    {
        await DocumentRepository.EnsureIndexesAsync(app.Services.GetRequiredService<MongoDbContext>(), app.Lifetime.ApplicationStopping);
        app.Logger.LogInformation("[Mongo] �ndices da cole��o Documentos verificados/criados.");
    }
    catch (Exception ex)
    {
        // N�o derruba a API, mas deixa o problema vis�vel nos logs
        app.Logger.LogError(ex, "[Mongo] Falha ao criar �ndices da cole��o Documentos");
    }
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowNextJs");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// ??? Health / Ping ???
app.MapGet("/api/ping", () => Results.Ok(new { status = "ok", message = "pong", timestamp = DateTime.UtcNow })).AllowAnonymous();

app.MapConsentimentoEndpoints();
app.MapReprocessamentoEndpoints();
app.MapRevisaoEndpoints();
app.MapAlertaEndpoints();
app.MapExamesEndpoints();
app.MapEmergenciaEndpoints();
app.MapChatEndpoints();

// ??? Auth Endpoints ??????????????????????????????????????????????????????????????????????????

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
        return Results.BadRequest(new[] { "Email j� cadastrado." });
    }



    var paciente = new Paciente
    {
        Nome = dto.Nome,
        DataNascimento = dto.DataNascimento,
        Sexo = dto.Sexo,
        Email = dto.Email,
        Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha)
    };

    await repo.CreateAsync(paciente);
    return Results.Ok(new { Message = "Paciente registrado com sucesso!" });
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/login", async (LoginPacienteDto dto, IValidator<LoginPacienteDto> validator, IPacienteRepository repo, IConfiguration config) =>
{
    var validationResult = await validator.ValidateAsync(dto);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var paciente = await repo.GetByEmailAsync(dto.Email);
    if (paciente == null)
    {
        return Results.BadRequest(new[] { "Email ou senha inv�lidos." });
    }

    try
    {
        if (!BCrypt.Net.BCrypt.Verify(dto.Senha, paciente.Senha))
        {
            return Results.BadRequest(new[] { "Email ou senha inv�lidos." });
        }
    }
    catch { return Results.BadRequest(new[] { "Email ou senha inv�lidos." }); }

    // Generate Token
    var tokenHandler = new JwtSecurityTokenHandler();
    var secret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? config["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT_SECRET_KEY is missing.");
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
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/forgot-password", async (ForgotPasswordDto dto, IPacienteRepository repo, IConfiguration config, ILogger<Program> logger, HttpContext context) =>
{
    if (string.IsNullOrWhiteSpace(dto.Email))
        return Results.BadRequest(new[] { "O e-mail � obrigat�rio." });

    var paciente = await repo.GetByEmailAsync(dto.Email);
    if (paciente == null)
    {
        // Retorna Ok para n�o expor quais emails existem na base
        return Results.Ok(new { Message = "Se o e-mail estiver cadastrado, voc� receber� um link de recupera��o." });
    }

    var token = Guid.NewGuid().ToString("N");
    paciente.ResetPasswordToken = token;
    paciente.ResetPasswordExpiry = DateTime.UtcNow.AddHours(1);

    await repo.UpdateAsync(paciente);

    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";
    var resetLink = $"{frontendUrl}/reset-password?token={token}";

    var brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY");
    var brevoFromEmail = Environment.GetEnvironmentVariable("BREVO_FROM_EMAIL") ?? "rafaelmatheus061@gmail.com";

    if (string.IsNullOrEmpty(brevoApiKey))
    {
        logger.LogWarning("BREVO_API_KEY n�o configurada. Link gerado: {ResetLink}", resetLink);
        return Results.Ok(new { Message = "Se o e-mail estiver cadastrado, voc� receber� um link de recupera��o." });
    }

    try
    {
        using var client = new HttpClient();
        client.DefaultRequestHeaders.Add("api-key", brevoApiKey);
        client.DefaultRequestHeaders.Add("accept", "application/json");

        var payload = new
        {
            sender = new { name = "Sa�deMemora", email = brevoFromEmail },
            to = new[] { new { email = paciente.Email, name = paciente.Nome } },
            subject = "Recupera��o de Senha - Sa�deMemora",
            htmlContent = $@"
                <div style='font-family: sans-serif; padding: 20px;'>
                    <h2>Recupera��o de Senha</h2>
                    <p>Voc� solicitou a recupera��o da sua senha no Sa�deMemora.</p>
                    <p>Clique no link abaixo para criar uma nova senha. O link � v�lido por 1 hora.</p>
                    <a href='{resetLink}' style='display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 20px;'>Redefinir minha senha</a>
                </div>
            "
        };

        var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);

        if (response.IsSuccessStatusCode)
        {
            logger.LogInformation("Email de recupera��o enviado via Brevo para {Email}", paciente.Email);
        }
        else
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            logger.LogError("Erro ao enviar email via Brevo para {Email}. Status: {Status}. Detalhes: {Error}", paciente.Email, response.StatusCode, errorBody);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao enviar e-mail de recupera��o via Brevo para {Email}", paciente.Email);
    }

    return Results.Ok(new { Message = "Se o e-mail estiver cadastrado, voc� receber� um link de recupera��o." });
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/reset-password", async (ResetPasswordDto dto, IPacienteRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.Senha))
        return Results.BadRequest(new[] { "Dados inv�lidos." });

    if (dto.Senha.Length < 6)
        return Results.BadRequest(new[] { "A senha deve ter no m�nimo 6 caracteres." });

    var paciente = await repo.GetByResetTokenAsync(dto.Token);
    
    if (paciente == null || paciente.ResetPasswordExpiry == null || paciente.ResetPasswordExpiry < DateTime.UtcNow)
    {
        return Results.BadRequest(new[] { "O link de recupera��o � inv�lido ou expirou." });
    }

    paciente.Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
    paciente.ResetPasswordToken = null;
    paciente.ResetPasswordExpiry = null;

    await repo.UpdateAsync(paciente);

    return Results.Ok(new { Message = "Sua senha foi redefinida com sucesso." });
}).RequireRateLimiting("auth");

// �"?�"?�"? Paciente Endpoints �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

// Retorna o perfil médico completo do paciente autenticado
app.MapGet("/api/pacientes/me", async (ClaimsPrincipal user, IPacienteRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = $"paciente_v2_{userId}";
    var cached = await cache.GetStringAsync(cacheKey);
    if (cached != null) return Results.Content(cached, "application/json");

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    // Calcula idade a partir da data de nascimento
    int idade = 0;
    if (DateTime.TryParse(paciente.DataNascimento, out var nascimento))
    {
        idade = DateTime.Today.Year - nascimento.Year;
        if (nascimento.Date > DateTime.Today.AddYears(-idade)) idade--;
    }

    var result = new
    {
        paciente.Id,
        paciente.Nome,
        paciente.Email,
        paciente.DataNascimento,
        Idade = idade,
        paciente.Sexo,
        paciente.Telefone,
        paciente.Endereco,
        paciente.PlanoSaude,
        paciente.NumeroCarteirinha,
        UrlCarteirinha = !string.IsNullOrEmpty(paciente.IdPublicoCarteirinha) ? storage.GetSignedUrl(paciente.IdPublicoCarteirinha) : paciente.UrlCarteirinha
    };
    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    await cache.SetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
    return Results.Ok(result);
}).RequireAuthorization();

// Atualiza informa��es do paciente autenticado (Nome, DataNascimento, Email)
app.MapPatch("/api/pacientes/me/perfil", async (ClaimsPrincipal user, IPacienteRepository repo, PerfilUpdateDto dto, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (!string.IsNullOrWhiteSpace(dto.Nome)) paciente.Nome = dto.Nome;
    if (!string.IsNullOrWhiteSpace(dto.DataNascimento)) paciente.DataNascimento = dto.DataNascimento;
    
    if (!string.IsNullOrWhiteSpace(dto.Email))
    {
        var newEmail = dto.Email.Trim().ToLowerInvariant();
        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(newEmail))
        {
            return Results.BadRequest(new[] { "O formato do e-mail � inv�lido." });
        }
        var existing = await repo.GetByEmailAsync(newEmail);
        if (existing != null && existing.Id != userId)
        {
            return Results.BadRequest(new[] { "Este e-mail j� est� em uso por outra conta." });
        }
        paciente.Email = newEmail;
    }
    if (dto.PlanoSaude != null) paciente.PlanoSaude = dto.PlanoSaude;
    if (dto.NumeroCarteirinha != null) paciente.NumeroCarteirinha = dto.NumeroCarteirinha;

    await repo.UpdateAsync(paciente);
    await cache.RemoveAsync($"paciente_v2_{userId}");
    return Results.Ok(new { Message = "Perfil atualizado com sucesso." });
}).RequireAuthorization();

// Atualiza telefone e endere�o do paciente autenticado
app.MapPatch("/api/pacientes/me/contato", async (ClaimsPrincipal user, IPacienteRepository repo, ContatoDto dto, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (dto.Telefone != null) paciente.Telefone = dto.Telefone;
    if (dto.Endereco != null) paciente.Endereco = dto.Endereco;

    await repo.UpdateAsync(paciente);
    await cache.RemoveAsync($"paciente_v2_{userId}");
    return Results.Ok(new { Message = "Contato atualizado com sucesso." });
}).RequireAuthorization();

app.MapPost("/api/pacientes/me/carteirinha", async (HttpContext context, ClaimsPrincipal user, IPacienteRepository repo, IImageStorageService storage, IOcrAiService ocr, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (paciente.ConsentimentoIa?.Aceito != true)
        return Results.Json(new { message = "consentimento_necessario" }, statusCode: 403);

    if (!context.Request.HasFormContentType)
        return Results.BadRequest("Formato inválido.");

    var form = await context.Request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file == null || file.Length == 0) return Results.BadRequest("Nenhum arquivo enviado.");

    if (!string.IsNullOrEmpty(paciente.IdPublicoCarteirinha))
        try { await storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); } catch { }

    using var stream = file.OpenReadStream();
    var (url, id) = await storage.UploadImageAsync(stream, file.FileName);
    
    // IA Extração da Carteirinha
    var extracted = await ocr.ExtractCarteirinhaDataAsync(url, context.RequestAborted);

    paciente.UrlCarteirinha = url;
    paciente.IdPublicoCarteirinha = id;
    
    if (!string.IsNullOrWhiteSpace(extracted.PlanoSaude)) 
        paciente.PlanoSaude = extracted.PlanoSaude;
        
    if (!string.IsNullOrWhiteSpace(extracted.NumeroCarteirinha)) 
        paciente.NumeroCarteirinha = extracted.NumeroCarteirinha;

    await repo.UpdateAsync(paciente);
    await cache.RemoveAsync($"paciente_v2_{userId}");

    return Results.Ok(new { 
        url,
        planoSaude = paciente.PlanoSaude,
        numeroCarteirinha = paciente.NumeroCarteirinha
    });
}).RequireAuthorization();

app.MapDelete("/api/pacientes/me/carteirinha", async (ClaimsPrincipal user, IPacienteRepository repo, IImageStorageService storage, IDistributedCache cache) =>
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
    await cache.RemoveAsync($"paciente_v2_{userId}");

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

    // 2. Apaga a ficha m�dica
    var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
    if (ficha != null)
    {
        await fichaRepo.DeleteAsync(ficha.Id);
    }

    // 3. Apaga a imagem da carteirinha
    var paciente = await repo.GetByIdAsync(userId);
    if (paciente != null && !string.IsNullOrWhiteSpace(paciente.IdPublicoCarteirinha))
    {
        try { await storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); } catch { }
    }

    // 4. Apaga o paciente
    await repo.DeleteAsync(userId);

    return Results.Ok(new { Message = "Conta excluída com sucesso." });
}).RequireAuthorization();

// ??? Logs Endpoints ??????????????????????????????????????????

// ??? Ficha M�dica Endpoints ??????????????????????????????????????

app.MapGet("/api/ficha-medica/me", async (ClaimsPrincipal user, IFichaMedicaRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = $"ficha_v2_{userId}";
    var cached = await cache.GetStringAsync(cacheKey);
    if (cached != null) return Results.Content(cached, "application/json");

    var ficha = await repo.GetByPacienteIdAsync(userId);
    if (ficha == null) return Results.Ok(new { });

    var result = new {
        ficha.Id,
        ficha.PacienteId,
        ficha.HistoricoFamiliar,
        ficha.Cirurgias,
        ficha.Fuma,
        ficha.Bebe,
        ficha.HabitosGerais,
        ficha.Observacoes,
        ficha.Condicoes,
        ficha.OutrasDoencas,
        ficha.TipoSanguineo,
        ficha.DoadorOrgaos,
        ficha.Alergias,
        ficha.DoencasCronicas,
        ficha.MedicamentosContinuos
    };
    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    await cache.SetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
    return Results.Ok(result);
}).RequireAuthorization();

app.MapPatch("/api/ficha-medica/me", async (ClaimsPrincipal user, IFichaMedicaRepository repo, FichaMedica dto, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var ficha = await repo.GetByPacienteIdAsync(userId);
    if (ficha == null)
    {
        dto.PacienteId = userId;
        await repo.CreateAsync(dto);
        await cache.RemoveAsync($"ficha_v2_{userId}");
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
    ficha.Alergias = dto.Alergias ?? new List<string>();
    ficha.DoencasCronicas = dto.DoencasCronicas ?? new List<string>();
    ficha.MedicamentosContinuos = dto.MedicamentosContinuos ?? new List<string>();
    ficha.Condicoes = dto.Condicoes ?? new List<CondicaoMedica>();
    ficha.UpdatedAt = DateTime.UtcNow;
    
    await repo.UpdateAsync(ficha);
    await cache.RemoveAsync($"ficha_v2_{userId}");
    return Results.Ok(ficha);
}).RequireAuthorization();

// �"?�"?�"? Document Endpoints �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

// Recebe upload de novo documento e o coloca na fila de processamento (OCR + IA rodam no worker)
app.MapPost("/api/documents/upload", async (HttpContext context, ClaimsPrincipal user, IDocumentRepository docRepo, IImageStorageService storage, IDistributedCache cache, ILogger<Program> logger) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var pacienteRepo = context.RequestServices.GetRequiredService<IPacienteRepository>();
    var paciente = await pacienteRepo.GetByIdAsync(userId);
    if (paciente == null || paciente.ConsentimentoIa?.Aceito != true)
        return Results.Json(new { message = "consentimento_necessario" }, statusCode: 403);

    if (!context.Request.HasFormContentType)
        return Results.BadRequest("Formato inv�lido. Esperado multipart/form-data.");

    var ct = context.RequestAborted;
    var form = await context.Request.ReadFormAsync(ct);
    var files = form.Files.Where(f => f.Length > 0).ToList();
    var docTipo = form["documentType"].ToString();
    if (string.IsNullOrWhiteSpace(docTipo)) docTipo = form["type"].ToString();
    if (string.IsNullOrWhiteSpace(docTipo)) docTipo = "exame"; // fallback padr�o

    if (files.Count == 0) return Results.BadRequest("Nenhum arquivo v�lido.");
    if (files.Count > UploadHelpers.MaxFilesPerUpload)
        return Results.BadRequest($"M�ximo de {UploadHelpers.MaxFilesPerUpload} arquivos por documento.");
    if (files.Any(f => f.Length > UploadHelpers.MaxFileSizeBytes))
        return Results.BadRequest("Cada arquivo deve ter no m�ximo 20 MB.");

    // 1. Hash SHA-256 do conte�do (idempot�ncia: mesmo arquivo = mesmo documento)
    // Validação de segurança: Magic Numbers para garantir que é PDF, PNG ou JPEG
    foreach (var file in files)
    {
        using var stream = file.OpenReadStream();
        var buffer = new byte[4];
        await stream.ReadAsync(buffer, 0, 4, ct);
        var hex = BitConverter.ToString(buffer).Replace("-", "");
        
        bool isJpeg = hex.StartsWith("FFD8FF");
        bool isPng = hex == "89504E47";
        bool isPdf = hex == "25504446";
        
        if (!isJpeg && !isPng && !isPdf)
        {
            return Results.BadRequest("Formato de arquivo inválido. Apenas PDF, JPG e PNG são permitidos.");
        }
    }

    var fileHash = await UploadHelpers.ComputeUploadHashAsync(files, ct);

    // 1.1 Esse mesmo arquivo j� foi recusado como inv�lido? Recusa na hora, sem gastar Cloudinary/OCR/IA.
    var rejectedMsg = await cache.GetStringAsync(SaudeMemora.Api.Workers.DocumentProcessingWorker.RejectedHashKey(userId, fileHash), ct);
    if (rejectedMsg != null)
        return Results.UnprocessableEntity(new { status = "rejeitado", invalidDocument = true, message = rejectedMsg });

    // 2. Atalho de idempot�ncia: j� existe? N�o gasta Cloudinary/OCR/IA de novo.
    var existingDoc = await docRepo.GetByHashAsync(userId, fileHash);
    if (existingDoc != null)
    {
        // Se o processamento anterior falhou, reenviar o mesmo arquivo funciona como "tentar novamente"
        if (existingDoc.Status == "failed" && await docRepo.RequeueFailedAsync(existingDoc.Id!, userId))
        {
            await UploadHelpers.InvalidateDocumentListCachesAsync(cache, userId);
            return Results.Accepted($"/api/documents/{existingDoc.Id}",
                new { id = existingDoc.Id, status = "pending", progress = 25, duplicate = true, message = "Documento recolocado na fila de processamento." });
        }

        return Results.Ok(new { id = existingDoc.Id, status = existingDoc.Status, progress = existingDoc.Progress, duplicate = true, message = "Documento j� existente." });
    }

    // 3. Upload pro Cloudinary (com limpeza se qualquer p�gina falhar, para n�o deixar �rf�os)
    var uploaded = new List<(string imageUrl, string publicId)>();
    try
    {
        foreach (var file in files)
        {
            await using var stream = file.OpenReadStream();
            uploaded.Add(await storage.UploadImageAsync(stream, file.FileName));
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[Upload] Falha no Cloudinary para o usu�rio {UserId}. Limpando {Count} arquivo(s) j� enviados.", userId, uploaded.Count);
        await UploadHelpers.DeleteUploadedAsync(storage, uploaded.Select(u => u.publicId), logger);
        return Results.Problem("Falha ao armazenar os arquivos. Tente novamente.", statusCode: StatusCodes.Status502BadGateway);
    }

    // 4. Salvar no MongoDB como Pending (insert at�mico protegido pelo �ndice �nico)
    var docRecord = new RegistroDocumento
    {
        PacienteId = userId,
        FileHash = fileHash,
        UrlImagens = uploaded.Select(u => u.imageUrl).ToList(),
        IdPublicos = uploaded.Select(u => u.publicId).ToList(),
        Titulo = "Documento em Processamento",
        Tipo = docTipo,
        Status = "pending",
        Progress = 25, // 25% = Arquivo recebido e no Cloudinary
        CriadoEm = DateTime.UtcNow
    };

    RegistroDocumento savedDoc;
    bool created;
    try
    {
        (savedDoc, created) = await docRepo.CreateOrGetByHashAsync(docRecord);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[Upload] Falha ao salvar documento no Mongo. Limpando arquivos do Cloudinary.");
        await UploadHelpers.DeleteUploadedAsync(storage, docRecord.IdPublicos, logger);
        return Results.Problem("Falha ao registrar o documento. Tente novamente.", statusCode: StatusCodes.Status500InternalServerError);
    }

    if (!created)
    {
        // Request concorrente (ex: duplo clique) inseriu primeiro: descarta nossas imagens duplicadas
        await UploadHelpers.DeleteUploadedAsync(storage, docRecord.IdPublicos, logger);
        return Results.Ok(new { id = savedDoc.Id, status = savedDoc.Status, progress = savedDoc.Progress, duplicate = true, message = "Documento j� existente." });
    }

    await UploadHelpers.InvalidateDocumentListCachesAsync(cache, userId);

    return Results.Accepted($"/api/documents/{savedDoc.Id}",
        new { id = savedDoc.Id, status = savedDoc.Status, progress = savedDoc.Progress, duplicate = false, message = "Documento recebido na fila de processamento!" });
}).RequireAuthorization().RequireRateLimiting("upload");

// Recoloca na fila um documento cujo processamento falhou (bot�o "Tentar novamente")
app.MapPost("/api/documents/{id}/retry", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    if (!await repo.RequeueFailedAsync(id, userId))
    {
        var doc = await repo.GetByIdAsync(id);
        if (doc == null || doc.PacienteId != userId) return Results.NotFound();
        return Results.Conflict(new { id, status = doc.Status, message = "Apenas documentos com falha podem ser reprocessados." });
    }

    await UploadHelpers.InvalidateDocumentListCachesAsync(cache, userId);
    return Results.Accepted($"/api/documents/{id}", new { id, status = "pending", progress = 25 });
}).RequireAuthorization();


// Lista todos os documentos do paciente autenticado
app.MapGet("/api/documents", async (ClaimsPrincipal user, IDocumentRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = $"documents_v3_{userId}";
    var cached = await cache.GetStringAsync(cacheKey);
    if (cached != null) return Results.Content(cached, "application/json");

    var docs = await repo.GetAllByPacienteIdAsync(userId);

    var result = docs.Select(d => new
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
        progress = d.Progress,
        errorMessage = d.ErrorMessage,
        criadoEm = d.CriadoEm,
        revisaoPendente = d.RevisaoPendente
    }).OrderByDescending(d => d.criadoEm).ToList();

    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    await cache.SetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
    return Results.Ok(result);
}).RequireAuthorization();


// Contagens de documentos por tipo (para m�tricas do dashboard)
app.MapGet("/api/documents/count", async (ClaimsPrincipal user, IDocumentRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = $"documents_count_v3_{userId}";
    var cached = await cache.GetStringAsync(cacheKey);
    if (cached != null) return Results.Content(cached, "application/json");

    var docs = await repo.GetAllByPacienteIdAsync(userId);
    var list = docs.ToList();

    var result = new
    {
        total = list.Count,
        exames = list.Count(d => d.Tipo == "exame"),
        receitas = list.Count(d => d.Tipo == "receita"),
        laudos = list.Count(d => d.Tipo == "laudo"),
        receitasAtivas = list.Count(d => d.Tipo == "receita" && d.Status == "pronto")
    };

    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    await cache.SetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
    return Results.Ok(result);
}).RequireAuthorization();

// Busca documento por ID
app.MapGet("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IImageStorageService storage, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null)
    {
        // Documento recusado pelo worker (n�o � m�dico/ileg�vel): foi removido, mas informamos o motivo ao dono
        var marker = await cache.GetStringAsync(SaudeMemora.Api.Workers.DocumentProcessingWorker.RejectedDocKey(id));
        if (marker != null)
        {
            using var json = System.Text.Json.JsonDocument.Parse(marker);
            if (json.RootElement.GetProperty("userId").GetString() == userId)
                return Results.Ok(new { id, status = "rejeitado", invalidDocument = true, errorMessage = json.RootElement.GetProperty("message").GetString() });
        }
        return Results.NotFound();
    }
    if (doc.PacienteId != userId) return Results.NotFound();

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
        nomeExame = doc.NomeExame,
        tipoExame = doc.TipoExame,
        resultado = doc.Resultado,
        especialidade = doc.Especialidade,
        tipoClinico = doc.TipoClinico,
        conteudo = doc.Conteudo,
        conclusoes = doc.Conclusoes,
        observacoes = doc.Observacoes,
        urlImagens = doc.UrlImagens,
        textoExtraido = doc.TextoExtraido,
        conteudoIndentado = doc.ConteudoIndentado,
        resultadosExame = doc.ResultadosExame,
        revisaoPendente = doc.RevisaoPendente,
        camposBaixaConfianca = doc.CamposBaixaConfianca,
        progress = doc.Progress,
        errorMessage = doc.ErrorMessage,
        criadoEm = doc.CriadoEm
    });
}).RequireAuthorization();

// Editar um documento
app.MapPut("/api/documents/{id}", async (
    string id,
    [Microsoft.AspNetCore.Mvc.FromBody] DocumentUpdateDto updateDto,
    ClaimsPrincipal user,
    IDocumentRepository repo,
    IPacienteRepository pacienteRepo,
    IFichaMedicaRepository fichaRepo,
    IAlertaMedicamentoService alertaService,
    Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
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
    doc.NomeExame = updateDto.NomeExame ?? doc.NomeExame;
    doc.TipoExame = updateDto.TipoExame ?? doc.TipoExame;
    doc.Resultado = updateDto.Resultado ?? doc.Resultado;
    doc.Especialidade = updateDto.Especialidade ?? doc.Especialidade;
    doc.TipoClinico = updateDto.TipoClinico ?? doc.TipoClinico;
    doc.Conteudo = updateDto.Conteudo ?? doc.Conteudo;
    doc.Conclusoes = updateDto.Conclusoes ?? doc.Conclusoes;
    doc.Observacoes = updateDto.Observacoes ?? doc.Observacoes;
    doc.TextoExtraido = updateDto.TextoExtraido ?? doc.TextoExtraido;

    if (!string.IsNullOrWhiteSpace(updateDto.Tipo) && new[] { "exame", "receita", "laudo" }.Contains(updateDto.Tipo))
        doc.Tipo = updateDto.Tipo;

    if (updateDto.Medicamentos != null)
    {
        doc.Medicamentos = updateDto.Medicamentos.Select(m => new SaudeMemora.Domain.Entities.MedicamentoDocumento
        {
            Nome = m.Nome ?? string.Empty,
            Dosagem = m.Dosagem ?? string.Empty,
            Horario = m.Horario ?? string.Empty
        }).ToList();
    }

    if (updateDto.ConteudoIndentado != null)
    {
        doc.ConteudoIndentado = updateDto.ConteudoIndentado.Select(item => new SaudeMemora.Domain.Entities.LinhaIndentadaDocumento
        {
            Tipo = item.Tipo ?? string.Empty,
            Texto = item.Texto ?? string.Empty,
            Chave = item.Chave ?? string.Empty,
            Valor = item.Valor ?? string.Empty
        }).ToList();
    }

    if (updateDto.ResultadosExame != null)
    {
        doc.ResultadosExame = updateDto.ResultadosExame.Select(r =>
        {
            var status = r.Status;
            // Se o usu�rio passar um valor num�rico e refer�ncias, recalculamos o status (caso ele esteja indefinido ou n�o, para garantir consist�ncia)
            if (r.Valor.HasValue && r.RefMin.HasValue && r.RefMax.HasValue)
            {
                if (r.Valor < r.RefMin) status = "baixo";
                else if (r.Valor > r.RefMax) status = "alto";
                else status = "normal";
            }
            return new SaudeMemora.Domain.Entities.ResultadoExameItem
            {
                Nome = r.Nome ?? "",
                NomeNormalizado = r.NomeNormalizado ?? "",
                Valor = r.Valor,
                ValorTexto = r.ValorTexto ?? "",
                Unidade = r.Unidade ?? "",
                RefMin = r.RefMin,
                RefMax = r.RefMax,
                ReferenciaTexto = r.ReferenciaTexto ?? "",
                Status = status ?? "indefinido",
                Confianca = r.Confianca
            };
        }).ToList();
    }

    // Medicamentos e tipo podem mudar durante a edi��o. Recalculamos avisos para
    // que nenhum alerta exibido fique associado aos dados anteriores.
    if (!doc.RevisaoPendente)
    {
        var paciente = await pacienteRepo.GetByIdAsync(userId);
        if (paciente?.ConsentimentoIa?.Aceito == true)
        {
            var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
            doc.Alertas = await alertaService.GerarAlertasAsync(doc, ficha ?? new SaudeMemora.Domain.Entities.FichaMedica());
        }
        else
        {
            doc.Alertas = new List<SaudeMemora.Domain.Entities.AlertaDocumento>();
        }
    }

    await repo.UpdateAsync(doc);
    await cache.RemoveAsync($"documents_v3_{userId}");
    return Results.Ok(new { message = "Documento atualizado com sucesso." });
}).RequireAuthorization();

// Exclui documento por ID (e remove do Cloudinary)
app.MapDelete("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IImageStorageService storage, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
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
    await cache.RemoveAsync($"documents_v3_{userId}");
    await cache.RemoveAsync($"documents_count_v3_{userId}");
    return Results.Ok(new { message = "Documento deletado com sucesso." });
}).RequireAuthorization();

// �"?�"?�"? Relatório Endpoints �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

app.MapGet("/api/reports/generate", async (int? months, ClaimsPrincipal user, IPacienteRepository repo, IDocumentRepository docRepo, IFichaMedicaRepository fichaRepo, IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<Program> logger) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null || paciente.ConsentimentoIa?.Aceito != true)
        return Results.Json(new { message = "consentimento_necessario" }, statusCode: 403);

    var ficha = await fichaRepo.GetByPacienteIdAsync(userId);
    var allDocs = await docRepo.GetAllByPacienteIdAsync(userId);

    int m = months ?? 6;
    if (m <= 0) m = 6;
    if (m > 120) m = 120; // limite de 10 anos
    var limitData = DateTime.UtcNow.AddMonths(-m);
    var recentDocs = allDocs.Where(d => d.CriadoEm >= limitData).ToList();

    var idadeStr = paciente?.DataNascimento ?? "Não informada";

    var prompt = $@"
Você é um médico especialista montando um dossiê clínico (prontuário resumido) para outro médico ler antes da consulta.
Aqui estão os dados do paciente:

[Perfil]:
Idade/DataNascimento: {idadeStr}, Sexo: {paciente?.Sexo}

[Ficha Médica]:
Tipo Sanguíneo: {ficha?.TipoSanguineo}
Alergias: {string.Join(", ", ficha?.Alergias ?? new List<string>())}
Doenças Crônicas: {string.Join(", ", ficha?.DoencasCronicas ?? new List<string>())}

[Ficha Médica]:
Histórico Familiar: {ficha?.HistoricoFamiliar}
Cirurgias: {ficha?.Cirurgias}
Fuma: {ficha?.Fuma}, Bebe: {ficha?.Bebe}
Hábitos: {ficha?.HabitosGerais}
Obs: {ficha?.Observacoes}

[Documentos e Exames Recentes (últimos {m} meses)]:
";
    foreach (var doc in recentDocs)
    {
        prompt += $"\n- {doc.Data} | {doc.Tipo.ToUpper()} | {doc.Titulo}: {doc.Resumo} | Diagnóstico: {doc.Diagnostico}";
        if (doc.Medicamentos != null && doc.Medicamentos.Count > 0)
        {
            prompt += $" | Remédios: {string.Join(", ", doc.Medicamentos.Select(med => med.Nome + " " + med.Dosagem))}";
        }
    }

    prompt += "\n\nCrie um relatório médico coeso, profissional e bem formatado em Markdown destacando os pontos principais, evolução e estado atual. Seja direto.";

    var geminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? config["Gemini:ApiKey"];
    if (string.IsNullOrEmpty(geminiKey)) return Results.BadRequest("GEMINI_API_KEY não configurada.");

    using var http = httpClientFactory.CreateClient();
    var payload = new
    {
        model = "gemini-3.8-flash",
        messages = new[] { new { role = "user", content = prompt } },
        temperature = 0.3
    };

    var req = new HttpRequestMessage(HttpMethod.Post, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    req.Headers.Add("Authorization", $"Bearer {geminiKey}");
    req.Content = System.Net.Http.Json.JsonContent.Create(payload);

    var res = await http.SendAsync(req);
    if (!res.IsSuccessStatusCode)
    {
        var error = await res.Content.ReadAsStringAsync();
        logger.LogError("Erro da IA ao gerar relatório: {Error}", error);
        return Results.Json(new { message = "Falha ao gerar relatório", detail = error }, statusCode: 502);
    }

    var json = await res.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
    var report = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

    return Results.Ok(new { Report = report });
}).RequireAuthorization();

app.Run();

// �"?�"?�"? DTOs auxiliares �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

public record MedicamentoContinuoDto(string Nome, string Dosagem, string Horario);

public record PerfilMedicoDto(
    string? TipoSanguineo,
    bool? DoadorOrgaos,
    List<string>? Alergias,
    List<string>? DoencasCronicas,
    List<MedicamentoContinuoDto>? MedicamentosContinuos
);

public record ContatoDto(string? Telefone, string? Endereco);

public record PerfilUpdateDto(string? Nome, string? DataNascimento, string? Email, string? PlanoSaude, string? NumeroCarteirinha);

public class DocumentUpdateDto
{
    public string? Titulo { get; set; }
    public string? Tipo { get; set; }
    public string? Medico { get; set; }
    public string? Clinica { get; set; }
    public string? Data { get; set; }
    public string? Resumo { get; set; }
    public string? Diagnostico { get; set; }
    public string? Crm { get; set; }
    public string? NomeExame { get; set; }
    public string? TipoExame { get; set; }
    public string? Resultado { get; set; }
    public string? Especialidade { get; set; }
    public string? TipoClinico { get; set; }
    public string? Conteudo { get; set; }
    public string? Conclusoes { get; set; }
    public string? Observacoes { get; set; }
    public string? TextoExtraido { get; set; }
    public List<MedicamentoDocumentoUpdateDto>? Medicamentos { get; set; }
    public List<LinhaIndentadaDocumentoUpdateDto>? ConteudoIndentado { get; set; }
    public List<ResultadoExameUpdateDto>? ResultadosExame { get; set; }
}

public class MedicamentoDocumentoUpdateDto
{
    public string? Nome { get; set; }
    public string? Dosagem { get; set; }
    public string? Horario { get; set; }
}

public class LinhaIndentadaDocumentoUpdateDto
{
    public string? Tipo { get; set; }
    public string? Texto { get; set; }
    public string? Chave { get; set; }
    public string? Valor { get; set; }
}

public class ResultadoExameUpdateDto
{
    public string? Nome { get; set; }
    public string? NomeNormalizado { get; set; }
    public double? Valor { get; set; }
    public string? ValorTexto { get; set; }
    public string? Unidade { get; set; }
    public double? RefMin { get; set; }
    public double? RefMax { get; set; }
    public string? ReferenciaTexto { get; set; }
    public string? Status { get; set; }
    public double Confianca { get; set; } = 1.0;
}

// ??? Helpers de Upload ??????????????????????????????????????????????????????

static class UploadHelpers
{
    public const int MaxFilesPerUpload = 10;
    public const long MaxFileSizeBytes = 20L * 1024 * 1024; // 20 MB (mesmo limite exibido no frontend)

    /// <summary>
    /// SHA-256 de cada arquivo, combinados em ordem num SHA-256 final.
    /// Hash por arquivo evita ambiguidade de concatena��o; a ordem importa (s�o p�ginas).
    /// </summary>
    public static async Task<string> ComputeUploadHashAsync(IReadOnlyList<IFormFile> files, CancellationToken ct)
    {
        using var combined = System.Security.Cryptography.IncrementalHash.CreateHash(System.Security.Cryptography.HashAlgorithmName.SHA256);
        foreach (var file in files)
        {
            await using var stream = file.OpenReadStream();
            var fileDigest = await System.Security.Cryptography.SHA256.HashDataAsync(stream, ct);
            combined.AppendData(fileDigest);
        }
        return Convert.ToHexString(combined.GetHashAndReset()).ToLowerInvariant();
    }

    /// <summary>Remove imagens do Cloudinary sem propagar exce��es (best-effort).</summary>
    public static async Task DeleteUploadedAsync(IImageStorageService storage, IEnumerable<string> publicIds, ILogger logger)
    {
        foreach (var publicId in publicIds.Where(p => !string.IsNullOrWhiteSpace(p)))
        {
            try { await storage.DeleteImageAsync(publicId); }
            catch (Exception ex) { logger.LogWarning(ex, "[Cloudinary] N�o foi poss�vel remover {PublicId}", publicId); }
        }
    }

    public static async Task InvalidateDocumentListCachesAsync(IDistributedCache cache, string userId)
    {
        await cache.RemoveAsync($"documents_v3_{userId}");
        await cache.RemoveAsync($"documents_count_v3_{userId}");
    }
}
