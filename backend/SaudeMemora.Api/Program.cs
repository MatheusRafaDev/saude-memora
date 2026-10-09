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
using SaudeMemora.Api.Helpers;
using SaudeMemora.Api.Middlewares;
using SaudeMemora.Api.Filters;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using DotNetEnv;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.AspNetCore.HttpOverrides;

// Load .env variables
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Ensure configuration provider reads from environment variables
builder.Configuration.AddEnvironmentVariables();



// Add services to the container.
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
// SignalR removido

builder.Services.AddOpenApi();

builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IPacienteRepository, PacienteRepository>();
builder.Services.AddScoped<IFichaMedicaRepository, FichaMedicaRepository>();
builder.Services.AddScoped<IChatHistoryRepository, ChatHistoryRepository>();
builder.Services.AddScoped<ISistemaLogRepository, SistemaLogRepository>();
builder.Services.AddScoped<IImageStorageService, CloudinaryStorageService>();
builder.Services.AddScoped<IAlertaMedicamentoService, AlertaMedicamentoService>();
builder.Services.AddScoped<IMedicamentoCatalogoRepository, MedicamentoCatalogoRepository>();
builder.Services.AddScoped<IMedicamentoCatalogoService, MedicamentoCatalogoService>();
builder.Services.AddScoped<ICid10CatalogoRepository, Cid10CatalogoRepository>();
builder.Services.AddScoped<ICid10CatalogoService, Cid10CatalogoService>();
builder.Services.AddScoped<ICnesCatalogoRepository, CnesCatalogoRepository>();
builder.Services.AddScoped<ICnesCatalogoService, CnesCatalogoService>();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterPacienteDto>();

builder.Services.AddHttpClient();
builder.Services.AddHttpClient<IOcrAiService, DocumentProcessingService>();

var bularioOptions = builder.Configuration.GetSection(BularioApiOptions.SectionName).Get<BularioApiOptions>()
    ?? new BularioApiOptions();

bularioOptions.BaseUrl = Environment.GetEnvironmentVariable("BULARIO_API_BASE_URL")
    ?? bularioOptions.BaseUrl;
bularioOptions.PageSize = int.TryParse(Environment.GetEnvironmentVariable("BULARIO_API_PAGE_SIZE"), out var pageSize)
    ? pageSize
    : bularioOptions.PageSize;
bularioOptions.RequestTimeoutSeconds = int.TryParse(Environment.GetEnvironmentVariable("BULARIO_API_TIMEOUT_SECONDS"), out var timeoutSeconds)
    ? timeoutSeconds
    : bularioOptions.RequestTimeoutSeconds;

builder.Services.AddSingleton(bularioOptions);
builder.Services.AddHttpClient<IMedicamentoApiService, MedicamentoApiService>((serviceProvider, client) =>
{
    client.BaseAddress = new Uri(bularioOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(bularioOptions.RequestTimeoutSeconds);
    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Guest");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36");
    client.DefaultRequestHeaders.Referrer = new Uri("https://consultas.anvisa.gov.br/");
});

builder.Services.AddHostedService<DocumentProcessingWorker>();
builder.Services.AddHostedService<AccountCleanupWorker>();
builder.Services.AddHostedService<KeepAliveWorker>();

// CORS
var corsOriginsStr = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173,https://localhost:5173,http://127.0.0.1:5173,https://127.0.0.1:5173";
var allowedOrigins = CorsSettings.ParseAllowedOrigins(corsOriginsStr);
if (allowedOrigins.Length == 0)
    throw new InvalidOperationException("CORS_ALLOWED_ORIGINS ou FRONTEND_URL deve conter pelo menos uma origem segura. Nenhum fallback wildcard é permitido em produção.");

builder.Services.AddCors(options =>
{
    options.AddPolicy("SaudeMemoraCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// JWT Authentication

// JWT: falhar no startup se não houver secret
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new InvalidOperationException("JWT_SECRET_KEY ausente ou curta (mín. 32 chars).");

bool IsSecureRequest(HttpContext context)
{
    if (context.Request.IsHttps)
        return true;

    var forwardedProto = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
    return string.Equals(forwardedProto, "https", StringComparison.OrdinalIgnoreCase);
}

TimeSpan ParseJwtLifetime(IConfiguration config)
{
    var jwtExpiresInStr = Environment.GetEnvironmentVariable("JWT_EXPIRES_IN")?.Trim()?.ToLowerInvariant() ?? config["JwtSettings:ExpiresIn"]?.Trim()?.ToLowerInvariant();
    if (string.IsNullOrEmpty(jwtExpiresInStr))
        return TimeSpan.FromDays(7);

    if (jwtExpiresInStr.EndsWith("h") && double.TryParse(jwtExpiresInStr.TrimEnd('h'), out var hours))
        return TimeSpan.FromHours(hours);

    if (jwtExpiresInStr.EndsWith("d") && double.TryParse(jwtExpiresInStr.TrimEnd('d'), out var days))
        return TimeSpan.FromDays(days);

    if (double.TryParse(jwtExpiresInStr, out var rawDays))
        return TimeSpan.FromDays(rawDays);

    return TimeSpan.FromDays(7);
}

void SetAuthCookie(HttpContext context, string jwt, TimeSpan expiresIn)
{
    var cookieSecure = IsSecureRequest(context) || string.Equals(Environment.GetEnvironmentVariable("COOKIE_SECURE") ?? "false", "true", StringComparison.OrdinalIgnoreCase);
    var cookieSameSite = Environment.GetEnvironmentVariable("COOKIE_SAME_SITE") ?? (IsSecureRequest(context) ? "None" : "Lax");
    var sameSiteMode = cookieSameSite switch
    {
        "None" => SameSiteMode.None,
        "Strict" => SameSiteMode.Strict,
        _ => SameSiteMode.Lax
    };

    if (sameSiteMode == SameSiteMode.None && !cookieSecure)
    {
        sameSiteMode = SameSiteMode.Lax;
    }

    context.Response.Cookies.Append("auth_token", jwt, new CookieOptions
    {
        HttpOnly = true,
        SameSite = sameSiteMode,
        Secure = cookieSecure,
        Expires = DateTimeOffset.UtcNow.Add(expiresIn),
        IsEssential = true,
        Path = "/"
    });
}

string CreateJwtToken(Paciente paciente, IConfiguration config)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var secret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? config["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT_SECRET_KEY is missing.");
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? config["JwtSettings:Issuer"];
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? config["JwtSettings:Audience"];
    var securityKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secret));
    var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, paciente.Id ?? string.Empty),
            new Claim(ClaimTypes.Email, paciente.Email),
            new Claim(ClaimTypes.Name, paciente.Nome),
            new Claim("SecurityStamp", paciente.SecurityStamp ?? string.Empty)
        }),
        Expires = DateTime.UtcNow.Add(ParseJwtLifetime(config)),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        SigningCredentials = credentials
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}

// Rate limit
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("register", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("login", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("refresh", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("passwordRecovery", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 3, Window = TimeSpan.FromMinutes(10) }));
    o.AddPolicy("passwordReset", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
    o.AddPolicy("auth", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));

    o.AddPolicy("upload", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));

    o.AddPolicy("emergencia", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));

    o.AddPolicy("chat", ctx => System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
        ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? NetworkHelpers.GetIpKey(ctx),
        _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    
    var trustedProxies = Environment.GetEnvironmentVariable("TRUSTED_PROXIES");
    if (!string.IsNullOrWhiteSpace(trustedProxies))
    {
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
        foreach (var proxy in trustedProxies.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (System.Net.IPAddress.TryParse(proxy, out var ip))
                options.KnownProxies.Add(ip);
            else if (proxy.Contains('/'))
            {
                var parts = proxy.Split('/');
                if (parts.Length == 2 && System.Net.IPAddress.TryParse(parts[0], out var netIp) && int.TryParse(parts[1], out var prefix))
                    options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(netIp, prefix));
            }
        }
    }
    else
    {
        options.ForwardLimit = 1;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    }
});

var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? builder.Configuration["JwtSettings:Issuer"];
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? builder.Configuration["JwtSettings:Audience"];
if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new InvalidOperationException("JWT_ISSUER ausente. Configure a issuer do JWT antes de iniciar a API.");
if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new InvalidOperationException("JWT_AUDIENCE ausente. Configure a audience do JWT antes de iniciar a API.");
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
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = JwtTokenReader.GetJwtTokenFromRequest(context.Request);
                if (!string.IsNullOrWhiteSpace(token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var userManager = context.HttpContext.RequestServices.GetRequiredService<IPacienteRepository>();
                var cache = context.HttpContext.RequestServices.GetRequiredService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
                var userId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                var stamp = context.Principal?.FindFirstValue("SecurityStamp");

                if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(stamp))
                {
                    context.Fail("Token sem identidade válida.");
                    return;
                }

                var cachedStamp = await cache.SafeGetStringAsync($"secstamp_{userId}");
                if (cachedStamp == null)
                {
                    var user = await userManager.GetByIdAsync(userId);
                    if (user != null)
                    {
                        cachedStamp = user.IsDeleting ? "DELETED" : user.SecurityStamp;
                        await cache.SafeSetStringAsync($"secstamp_{userId}", cachedStamp ?? string.Empty, new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60) });
                    }
                }


                if (cachedStamp == null || cachedStamp == "DELETED" || cachedStamp != stamp)
                {
                    context.Fail("Security stamp inválido ou conta excluída.");
                }
            }
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
app.UseExceptionHandler();
app.UseForwardedHeaders();

// Cria índices do MongoDB uma única vez no startup (fila + idempotência).
// Roda em background para não atrasar o startup se o Mongo estiver inacessível.
_ = Task.Run(async () =>
{
    var dbContext = app.Services.GetRequiredService<MongoDbContext>();
    var token = app.Lifetime.ApplicationStopping;

    try { await DocumentRepository.EnsureIndexesAsync(dbContext, token); }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção Documentos"); }

    try { await PacienteRepository.EnsureIndexesAsync(dbContext, token); }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção Pacientes"); }

    try { await FichaMedicaRepository.EnsureIndexesAsync(dbContext, token); }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção Fichas Médicas"); }

    try { await ChatHistoryRepository.EnsureIndexesAsync(dbContext, token); }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção ChatHistoricos"); }

    try { await SistemaLogRepository.EnsureIndexesAsync(dbContext, token); }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção Logs (TTL)"); }

    try
    {
        var catalogRepository = app.Services.GetRequiredService<IMedicamentoCatalogoRepository>();
        await catalogRepository.EnsureIndexesAsync(token);
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção MedicamentosCatalogo"); }

    try
    {
        using var scope = app.Services.CreateScope();
        var catalogRepository = scope.ServiceProvider.GetRequiredService<IMedicamentoCatalogoRepository>();
        if (await catalogRepository.ContarAsync(token) == 0)
        {
            var catalogPath = Path.Combine(app.Environment.ContentRootPath, "Data", "medicamentos.csv");
            if (!File.Exists(catalogPath))
            {
                app.Logger.LogError("[Medicamentos] Arquivo da base ANVISA não encontrado em {CatalogPath}.", catalogPath);
            }
            else
            {
                await using var catalogStream = File.OpenRead(catalogPath);
                var catalogService = scope.ServiceProvider.GetRequiredService<IMedicamentoCatalogoService>();
                var importResult = await catalogService.ImportarAsync(catalogStream, token);
                app.Logger.LogInformation(
                    "[Medicamentos] Base ANVISA inicializada: {Imported} registros importados, {Invalid} inválidos e {Duplicates} duplicados.",
                    importResult.RegistrosImportados,
                    importResult.RegistrosInvalidos,
                    importResult.RegistrosDuplicados);
            }
        }
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[Medicamentos] Falha ao inicializar o catálogo ANVISA"); }

    try
    {
        var cid10Repository = app.Services.GetRequiredService<ICid10CatalogoRepository>();
        await cid10Repository.EnsureIndexesAsync(token);
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção Cid10Catalogo"); }

    try
    {
        using var scope = app.Services.CreateScope();
        var catalogRepository = scope.ServiceProvider.GetRequiredService<ICid10CatalogoRepository>();
        if (await catalogRepository.ContarAsync(token) == 0)
        {
            var catalogPath = Environment.GetEnvironmentVariable("CID10_CATALOG_PATH")
                ?? Path.Combine(app.Environment.ContentRootPath, "Data", "CID-10-SUBCATEGORIAS.CSV");
            if (!File.Exists(catalogPath))
            {
                app.Logger.LogError("[CID-10] Arquivo do catálogo não encontrado em {CatalogPath}.", catalogPath);
            }
            else
            {
                await using var catalogStream = File.OpenRead(catalogPath);
                var catalogService = scope.ServiceProvider.GetRequiredService<ICid10CatalogoService>();
                var importResult = await catalogService.ImportarAsync(catalogStream, token);
                app.Logger.LogInformation(
                    "[CID-10] Catálogo inicializado: {Imported} registros importados, {Invalid} inválidos e {Duplicates} duplicados.",
                    importResult.RegistrosImportados,
                    importResult.RegistrosInvalidos,
                    importResult.RegistrosDuplicados);
            }
        }
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[CID-10] Falha ao inicializar o catálogo"); }

    try
    {
        var cnesRepository = app.Services.GetRequiredService<ICnesCatalogoRepository>();
        await cnesRepository.EnsureIndexesAsync(token);
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha ao criar índices da coleção CnesCatalogo"); }

    try
    {
        using var scope = app.Services.CreateScope();
        var catalogRepository = scope.ServiceProvider.GetRequiredService<ICnesCatalogoRepository>();
        if (await catalogRepository.ContarAsync(token) == 0)
        {
            var catalogPath = Environment.GetEnvironmentVariable("CNES_CATALOG_PATH");
            if (string.IsNullOrWhiteSpace(catalogPath))
            {
                app.Logger.LogWarning("[CNES] Catálogo vazio. Configure CNES_CATALOG_PATH ou importe a base pelo endpoint protegido.");
            }
            else if (!File.Exists(catalogPath))
            {
                app.Logger.LogError("[CNES] Arquivo do catálogo não encontrado em {CatalogPath}.", catalogPath);
            }
            else
            {
                await using var catalogStream = File.OpenRead(catalogPath);
                var catalogService = scope.ServiceProvider.GetRequiredService<ICnesCatalogoService>();
                var importResult = await catalogService.ImportarAsync(catalogStream, token);
                app.Logger.LogInformation(
                    "[CNES] Catálogo inicializado: {Imported} registros importados, {Invalid} inválidos e {Duplicates} duplicados.",
                    importResult.RegistrosImportados,
                    importResult.RegistrosInvalidos,
                    importResult.RegistrosDuplicados);
            }
        }
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[CNES] Falha ao inicializar o catálogo"); }
    
    try
    {
        var filter = Builders<Paciente>.Filter.Exists("securityStamp", false);
        var pacientes = await dbContext.Pacientes.Find(filter).ToListAsync(token);
        foreach(var p in pacientes)
        {
            await dbContext.Pacientes.UpdateOneAsync(
                Builders<Paciente>.Filter.Eq(x => x.Id, p.Id),
                Builders<Paciente>.Update.Set("securityStamp", Guid.NewGuid().ToString("N")),
                cancellationToken: token);
        }
        if (pacientes.Count > 0)
            app.Logger.LogInformation("[Mongo] Preenchido SecurityStamp em {Count} pacientes.", pacientes.Count);
    }
    catch (Exception ex) { app.Logger.LogError(ex, "[Mongo] Falha na migração do SecurityStamp"); }

    app.Logger.LogInformation("[Mongo] Processo de criação de índices concluído.");
});

// Configure the HTTP request pipeline.
app.MapOpenApi("/openapi/{documentName}.json");

app.UseCors("SaudeMemoraCors");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// --- Health / Ping
app.MapGet("/api/ping", () => Results.Ok(new { status = "ok", message = "pong", timestamp = DateTime.UtcNow })).AllowAnonymous();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow })).AllowAnonymous();

app.MapConsentimentoEndpoints();
app.MapReprocessamentoEndpoints();
app.MapRevisaoEndpoints();
app.MapAlertaEndpoints();
app.MapMedicamentoEndpoints();
app.MapMedicamentoCatalogoEndpoints();
app.MapCdosCatalogosEndpoints();
app.MapExamesEndpoints();
app.MapEmergenciaEndpoints();
app.MapChatEndpoints();

// MapHub removido

// --- Auth Endpoints

app.MapPost("/api/auth/register", async (RegisterPacienteDto dto, IPacienteRepository repo) =>
{
    dto.Email = dto.Email.ToLowerInvariant().Trim();
    var existing = await repo.GetByEmailAsync(dto.Email);
    if (existing != null)
    {
        return Results.BadRequest(new[] { "Email já cadastrado." });
    }

    var paciente = new Paciente
    {
        Nome = dto.Nome,
        DataNascimento = dto.DataNascimento,
        Sexo = dto.Sexo,
        Email = dto.Email,
        Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
        SecurityStamp = Guid.NewGuid().ToString("N")
    };

    try
    {
        await repo.CreateAsync(paciente);
    }
    catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
    {
        return Results.BadRequest(new[] { "Email já cadastrado." });
    }
    return Results.Ok(new { Message = "Paciente registrado com sucesso!" });
}).AddEndpointFilter<GlobalValidationFilter>().RequireRateLimiting("register");

app.MapPost("/api/auth/login", async (LoginPacienteDto dto, IPacienteRepository repo, IConfiguration config, HttpContext context) =>
{
    dto.Email = dto.Email.ToLowerInvariant().Trim();
    var paciente = await repo.GetByEmailAsync(dto.Email);
    if (paciente == null || paciente.IsDeleting)
    {
        BCrypt.Net.BCrypt.Verify(dto.Senha, "$2a$11$yKWev6D/v/mDpwK9y2m8.evF7U20l03B.v48v5N60/D7Q/r3v1E4O");
        return Results.BadRequest(new[] { "Email ou senha inválidos." });
    }

    if (!BCrypt.Net.BCrypt.Verify(dto.Senha, paciente.Senha))
    {
        return Results.BadRequest(new[] { "Email ou senha inválidos." });
    }

    var expiresIn = ParseJwtLifetime(config);
    var jwt = CreateJwtToken(paciente, config);
    SetAuthCookie(context, jwt, expiresIn);

    return Results.Ok(new {
        User = new { paciente.Id, paciente.Nome, paciente.Email }
    });
}).AddEndpointFilter<GlobalValidationFilter>().RequireRateLimiting("login");

app.MapPost("/api/auth/refresh", async (ClaimsPrincipal user, IPacienteRepository repo, IConfiguration config, HttpContext context) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrWhiteSpace(userId))
    {
        return Results.Unauthorized();
    }

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null || paciente.IsDeleting)
    {
        return Results.Unauthorized();
    }

    var currentStamp = user.FindFirstValue("SecurityStamp");
    if (string.IsNullOrWhiteSpace(currentStamp) || currentStamp != paciente.SecurityStamp)
    {
        return Results.Unauthorized();
    }

    var jwt = CreateJwtToken(paciente, config);
    SetAuthCookie(context, jwt, ParseJwtLifetime(config));

    return Results.Ok(new { User = new { paciente.Id, paciente.Nome, paciente.Email } });
}).RequireAuthorization().RequireRateLimiting("refresh");

app.MapPost("/api/auth/logout", async (
    ClaimsPrincipal user,
    IPacienteRepository repository,
    Microsoft.Extensions.Caching.Distributed.IDistributedCache cache,
    HttpContext context,
    CancellationToken cancellationToken) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    var stamp = user.FindFirstValue("SecurityStamp");
    if (user.Identity?.IsAuthenticated == true)
    {
        await AuthSessionRevocation.RevokeAsync(
            userId ?? string.Empty,
            stamp ?? string.Empty,
            repository,
            cache,
            cancellationToken);
    }

    var cookieSecure = IsSecureRequest(context) || string.Equals(Environment.GetEnvironmentVariable("COOKIE_SECURE") ?? "false", "true", StringComparison.OrdinalIgnoreCase);
    var cookieSameSite = Environment.GetEnvironmentVariable("COOKIE_SAME_SITE") ?? (IsSecureRequest(context) ? "None" : "Lax");
    var sameSiteMode = cookieSameSite switch
    {
        "None" => SameSiteMode.None,
        "Strict" => SameSiteMode.Strict,
        _ => SameSiteMode.Lax
    };

    if (sameSiteMode == SameSiteMode.None && !cookieSecure)
    {
        sameSiteMode = SameSiteMode.Lax;
    }

    context.Response.Cookies.Delete("auth_token", new CookieOptions
    {
        HttpOnly = true,
        SameSite = sameSiteMode,
        Secure = cookieSecure,
        Path = "/"
    });

    return Results.Ok(new { Message = "Logout realizado com sucesso." });
});

app.MapPost("/api/auth/forgot-password", async (ForgotPasswordDto dto, IPacienteRepository repo, IConfiguration config, ILogger<Program> logger, HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    if (string.IsNullOrWhiteSpace(dto.Email))
        return Results.BadRequest(new[] { "O e-mail é obrigatório." });

    dto.Email = dto.Email.ToLowerInvariant().Trim();
    var paciente = await repo.GetByEmailAsync(dto.Email);
    if (paciente == null)
    {
        return Results.Ok(new { Message = "Se o e-mail estiver cadastrado, você receberá um link de recuperação." });
    }

    var token = Guid.NewGuid().ToString("N");
    var tokenHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    
    paciente.ResetPasswordToken = tokenHash;
    paciente.ResetPasswordExpiry = DateTime.UtcNow.AddHours(1);

    await repo.UpdateAsync(paciente);

    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";
    var resetLink = $"{frontendUrl}/reset-password?token={token}";

    var brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY");
    var brevoFromEmail = Environment.GetEnvironmentVariable("BREVO_FROM_EMAIL") ?? "nao-responda@saudememora.com.br";

    if (string.IsNullOrEmpty(brevoApiKey))
    {
        logger.LogWarning("BREVO_API_KEY não configurada. O e-mail de redefinição não foi enviado para {Email}.", dto.Email);
        return Results.Ok(new { Message = "Se o e-mail estiver cadastrado, você receberá um link de recuperação." });
    }

    try
    {
        using var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("api-key", brevoApiKey);
        client.DefaultRequestHeaders.Add("accept", "application/json");

        var payload = new
        {
            sender = new { name = "SaúdeMemora", email = brevoFromEmail },
            to = new[] { new { email = paciente.Email, name = paciente.Nome } },
            subject = "Recuperação de Senha - SaúdeMemora",
            htmlContent = $@"
                <div style='font-family: sans-serif; padding: 20px;'>
                    <h2>Recuperação de Senha</h2>
                    <p>Você solicitou a recuperação da sua senha no SaúdeMemora.</p>
                    <p>Clique no link abaixo para criar uma nova senha. O link é válido por 1 hora.</p>
                    <a href='{resetLink}' style='display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 20px;'>Redefinir minha senha</a>
                </div>
            "
        };

        var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);

        if (response.IsSuccessStatusCode)
        {
            logger.LogInformation("Email de recuperação enviado via Brevo para {Email}", paciente.Email);
        }
        else
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            logger.LogError("Erro ao enviar email via Brevo para {Email}. Status: {Status}. Detalhes: {Error}", paciente.Email, response.StatusCode, errorBody);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao enviar e-mail de recuperação via Brevo para {Email}", paciente.Email);
    }

    return Results.Ok(new { Message = "Se o e-mail estiver cadastrado, você receberá um link de recuperação." });
}).AddEndpointFilter<GlobalValidationFilter>().RequireRateLimiting("passwordRecovery");

app.MapPost("/api/auth/reset-password", async (ResetPasswordDto dto, IPacienteRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.Senha))
        return Results.BadRequest(new[] { "Dados inválidos." });

    if (dto.Senha.Length < 8)
        return Results.BadRequest(new[] { "A nova senha deve ter no mínimo 8 caracteres." });

    var tokenHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(dto.Token)));
    var paciente = await repo.GetByResetTokenAsync(tokenHash);
    
    if (paciente == null || paciente.ResetPasswordExpiry == null || paciente.ResetPasswordExpiry < DateTime.UtcNow)
    {
        return Results.BadRequest(new[] { "O link de recuperação é inválido ou expirou." });
    }

    paciente.Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
    paciente.ResetPasswordToken = null;
    paciente.ResetPasswordExpiry = null;
    paciente.SecurityStamp = Guid.NewGuid().ToString("N");

    await repo.UpdateAsync(paciente);
    await cache.SafeRemoveAsync($"secstamp_{paciente.Id}");

    return Results.Ok(new { Message = "Sua senha foi redefinida com sucesso." });
}).AddEndpointFilter<GlobalValidationFilter>().RequireRateLimiting("passwordReset");

//  Paciente Endpoints 

// Retorna o perfil médico completo do paciente autenticado
app.MapGet("/api/pacientes/me", async (ClaimsPrincipal user, IPacienteRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = $"paciente_v2_{userId}";
    var cached = await cache.SafeGetStringAsync(cacheKey);
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
        paciente.ContatoEmergencia,
        UrlCarteirinha = !string.IsNullOrEmpty(paciente.IdPublicoCarteirinha) ? storage.GetSignedUrl(paciente.IdPublicoCarteirinha) : paciente.UrlCarteirinha
    };
    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    await cache.SafeSetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) /* Reduzido de 10 para 5 min para não exceder URL assinada (15m) */ });
    return Results.Ok(result);
}).RequireAuthorization();

// Atualiza informações do paciente autenticado (Nome, DataNascimento, Email)
app.MapPatch("/api/pacientes/me/perfil", async (ClaimsPrincipal user, IPacienteRepository repo, PerfilUpdateDto dto, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (!string.IsNullOrWhiteSpace(dto.Nome)) paciente.Nome = dto.Nome;
    if (!string.IsNullOrWhiteSpace(dto.DataNascimento)) paciente.DataNascimento = dto.DataNascimento;
    if (dto.ContatoEmergencia != null) paciente.ContatoEmergencia = dto.ContatoEmergencia;
    
    if (!string.IsNullOrWhiteSpace(dto.Email) && !string.Equals(dto.Email, paciente.Email, StringComparison.OrdinalIgnoreCase))
    {
        if (string.IsNullOrWhiteSpace(dto.SenhaAtual) || !BCrypt.Net.BCrypt.Verify(dto.SenhaAtual, paciente.Senha))
        {
            return Results.BadRequest(new[] { "Senha atual incorreta ou não fornecida para alterar o e-mail." });
        }

        var newEmail = dto.Email.Trim().ToLowerInvariant();
        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(newEmail))
        {
            return Results.BadRequest(new[] { "O formato do e-mail é inválido." });
        }
        var existing = await repo.GetByEmailAsync(newEmail);
        if (existing != null && existing.Id != userId)
        {
            return Results.BadRequest(new[] { "Este e-mail já está em uso por outra conta." });
        }
        paciente.Email = newEmail;
        paciente.SecurityStamp = Guid.NewGuid().ToString("N"); // Invalidate tokens
    }
    if (dto.PlanoSaude != null) paciente.PlanoSaude = dto.PlanoSaude;
    if (dto.NumeroCarteirinha != null) paciente.NumeroCarteirinha = dto.NumeroCarteirinha;

    await repo.UpdateAsync(paciente);
    await cache.SafeRemoveAsync($"paciente_v2_{userId}");
    return Results.Ok(new { Message = "Perfil atualizado com sucesso." });
}).AddEndpointFilter<GlobalValidationFilter>().RequireAuthorization();

// Atualiza telefone e endereço do paciente autenticado
app.MapPatch("/api/pacientes/me/contato", async (ClaimsPrincipal user, IPacienteRepository repo, ContatoDto dto, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (dto.Telefone != null) paciente.Telefone = dto.Telefone;
    if (dto.Endereco != null) paciente.Endereco = dto.Endereco;
    if (dto.ContatoEmergencia != null) paciente.ContatoEmergencia = dto.ContatoEmergencia;

    await repo.UpdateAsync(paciente);
    await cache.SafeRemoveAsync($"paciente_v2_{userId}");
    return Results.Ok(new { Message = "Contato atualizado com sucesso." });
}).AddEndpointFilter<GlobalValidationFilter>().RequireAuthorization();

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

    if (file.Length > UploadHelpers.MaxFileSizeBytes)
        return Results.BadRequest("Cada arquivo deve ter no máximo 10 MB.");

    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (ext != ".pdf" && ext != ".jpg" && ext != ".jpeg" && ext != ".png")
        return Results.BadRequest("Extensão de arquivo não permitida. Use .pdf, .jpg ou .png.");

    using (var magicStream = file.OpenReadStream())
    {
        var buffer = new byte[4];
        _ = await magicStream.ReadAsync(buffer, 0, 4);
        var isPdf = buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46;
        var isJpeg = buffer[0] == 0xFF && buffer[1] == 0xD8;
        var isPng = buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47;
        
        if (!isPdf && !isJpeg && !isPng)
            return Results.BadRequest("Apenas arquivos PDF, PNG ou JPEG são permitidos.");
    }

    using var stream = file.OpenReadStream();
    var (url, id) = await storage.UploadImageAsync(stream, file.FileName);
    
    // IA Extração da Carteirinha
    try
    {
        var extracted = await ocr.ExtractCarteirinhaDataAsync(url, context.RequestAborted);
        var oldPublicId = paciente.IdPublicoCarteirinha;
        
        paciente.UrlCarteirinha = url;
        paciente.IdPublicoCarteirinha = id;
        
        if (!string.IsNullOrWhiteSpace(extracted.PlanoSaude)) 
            paciente.PlanoSaude = extracted.PlanoSaude;
            
        if (!string.IsNullOrWhiteSpace(extracted.NumeroCarteirinha)) 
            paciente.NumeroCarteirinha = extracted.NumeroCarteirinha;

        await repo.UpdateAsync(paciente);
        await cache.SafeRemoveAsync($"paciente_v2_{userId}");

        if (!string.IsNullOrEmpty(oldPublicId))
            try { await storage.DeleteImageAsync(oldPublicId); } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }

        return Results.Ok(new { 
            url = storage.GetSignedUrl(id),
            planoSaude = paciente.PlanoSaude,
            numeroCarteirinha = paciente.NumeroCarteirinha
        });
    }
    catch (Exception ex)
    {
        try { await storage.DeleteImageAsync(id); } catch { }
        app.Logger.LogError(ex, "Erro ao processar carteirinha para usuário {UserId}", userId);
        return Results.Problem("Falha ao processar carteirinha.", statusCode: 500);
    }
}).RequireAuthorization().RequireRateLimiting("upload").DisableAntiforgery().WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(10L * 1024 * 1024));

app.MapDelete("/api/pacientes/me/carteirinha", async (ClaimsPrincipal user, IPacienteRepository repo, IImageStorageService storage, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (!string.IsNullOrEmpty(paciente.IdPublicoCarteirinha))
        try { await storage.DeleteImageAsync(paciente.IdPublicoCarteirinha); } catch (Exception ex) { Console.Error.WriteLine("[Ignored Exception] " + ex.Message); }

    paciente.UrlCarteirinha = null;
    paciente.IdPublicoCarteirinha = null;
    await repo.UpdateAsync(paciente);
    await cache.SafeRemoveAsync($"paciente_v2_{userId}");

    return Results.Ok();
}).RequireAuthorization();

// Exclui a conta do paciente e todos os seus dados em cascata
app.MapDelete("/api/pacientes/me", async ([FromBody] DeleteAccountDto dto, ClaimsPrincipal user, IPacienteRepository repo, IDocumentRepository docRepo, IFichaMedicaRepository fichaRepo, IImageStorageService storage, ISistemaLogRepository logRepo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (string.IsNullOrWhiteSpace(dto.Senha))
    {
        return Results.BadRequest(new { message = "Senha incorreta." });
    }

    if (!BCrypt.Net.BCrypt.Verify(dto.Senha, paciente.Senha))
    {
        return Results.BadRequest(new { message = "Senha incorreta." });
    }

    // Em vez de apagar tudo sincronicamente, marca para exclusão
    paciente.IsDeleting = true;
    paciente.SecurityStamp = Guid.NewGuid().ToString("N"); // Invalida tokens atuais
    paciente.TokenEmergencia = null;
    paciente.TokenEmergenciaExpiraEm = null;
    await repo.UpdateAsync(paciente);

    // Limpa caches
    await cache.SafeRemoveAsync($"paciente_v2_{userId}");
    await cache.SafeRemoveAsync($"ficha_v2_{userId}");
    await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(userId));
    await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(userId));
    await cache.SafeRemoveAsync($"secstamp_{userId}");
    await cache.SafeRemoveAsync($"ficha_user_{userId}");

    return Results.Ok(new { message = "Sua conta foi agendada para exclusão e será removida em breve." });
}).AddEndpointFilter<GlobalValidationFilter>().RequireAuthorization();

// --- Logs Endpoints

// --- Ficha Médica Endpoints

app.MapGet("/api/ficha-medica/me", async (ClaimsPrincipal user, IFichaMedicaRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = $"ficha_v2_{userId}";
    var cached = await cache.SafeGetStringAsync(cacheKey);
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
    await cache.SafeSetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) /* Reduzido de 10 para 5 min para não exceder URL assinada (15m) */ });
    return Results.Ok(result);
}).RequireAuthorization();

app.MapPatch("/api/ficha-medica/me", async (ClaimsPrincipal user, IFichaMedicaRepository repo, UpdateFichaMedicaDto dto, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var ficha = await repo.GetByPacienteIdAsync(userId);
    if (ficha == null)
    {
        var newFicha = new FichaMedica
        {
            PacienteId = userId,
            HistoricoFamiliar = dto.HistoricoFamiliar ?? string.Empty,
            Cirurgias = dto.Cirurgias ?? string.Empty,
            Fuma = dto.Fuma ?? false,
            Bebe = dto.Bebe ?? false,
            HabitosGerais = dto.HabitosGerais ?? string.Empty,
            Observacoes = dto.Observacoes ?? string.Empty,
            Condicoes = dto.Condicoes ?? new List<CondicaoMedica>(),
            OutrasDoencas = dto.OutrasDoencas ?? string.Empty,
            TipoSanguineo = dto.TipoSanguineo,
            DoadorOrgaos = dto.DoadorOrgaos ?? false,
            Alergias = dto.Alergias ?? new List<string>(),
            DoencasCronicas = dto.DoencasCronicas ?? new List<string>(),
            MedicamentosContinuos = dto.MedicamentosContinuos ?? new List<string>()
        };
        await repo.CreateAsync(newFicha);
        await cache.SafeRemoveAsync($"ficha_v2_{userId}");
        return Results.Ok(newFicha);
    }
    // Atualização parcial (PATCH): só atualiza os campos enviados
    if (dto.HistoricoFamiliar != null) ficha.HistoricoFamiliar = dto.HistoricoFamiliar;
    if (dto.Cirurgias != null) ficha.Cirurgias = dto.Cirurgias;
    if (dto.Fuma.HasValue) ficha.Fuma = dto.Fuma.Value;
    if (dto.Bebe.HasValue) ficha.Bebe = dto.Bebe.Value;
    if (dto.HabitosGerais != null) ficha.HabitosGerais = dto.HabitosGerais;
    if (dto.Observacoes != null) ficha.Observacoes = dto.Observacoes;
    if (dto.OutrasDoencas != null) ficha.OutrasDoencas = dto.OutrasDoencas;
    if (dto.TipoSanguineo != null) ficha.TipoSanguineo = dto.TipoSanguineo;
    if (dto.DoadorOrgaos.HasValue) ficha.DoadorOrgaos = dto.DoadorOrgaos.Value;
    if (dto.Alergias != null) ficha.Alergias = dto.Alergias;
    if (dto.DoencasCronicas != null) ficha.DoencasCronicas = dto.DoencasCronicas;
    if (dto.MedicamentosContinuos != null) ficha.MedicamentosContinuos = dto.MedicamentosContinuos;
    if (dto.Condicoes != null) ficha.Condicoes = dto.Condicoes;
    ficha.UpdatedAt = DateTime.UtcNow;
    
    await repo.UpdateAsync(ficha);
    await cache.SafeRemoveAsync($"ficha_v2_{userId}");
    return Results.Ok(ficha);
}).AddEndpointFilter<GlobalValidationFilter>().RequireAuthorization();

//  Document Endpoints 

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
        return Results.BadRequest("Formato inválido. Esperado multipart/form-data.");

    var ct = context.RequestAborted;
    var form = await context.Request.ReadFormAsync(ct);
    var files = form.Files.Where(f => f.Length > 0).ToList();
    var docTipo = form["documentType"].ToString();
    if (string.IsNullOrWhiteSpace(docTipo)) docTipo = form["type"].ToString();
    var tiposValidos = new[] { "exame", "receita", "laudo", "atestado", "vacina", "encaminhamento", "relatorio", "outro" };
docTipo = docTipo.ToLowerInvariant().Trim();
if (!tiposValidos.Contains(docTipo)) docTipo = "outro";

    if (files.Count == 0) return Results.BadRequest("Nenhum arquivo válido.");
    if (files.Count > UploadHelpers.MaxFilesPerUpload)
        return Results.BadRequest($"Máximo de {UploadHelpers.MaxFilesPerUpload} arquivos por documento.");
    if (files.Any(f => f.Length > UploadHelpers.MaxFileSizeBytes))
        return Results.BadRequest("Cada arquivo deve ter no máximo 10 MB.");

    // 1. Hash SHA-256 do conteúdo (idempotência: mesmo arquivo = mesmo documento)
    // Validação de segurança: Magic Numbers para garantir que é PDF, PNG ou JPEG
    foreach (var file in files)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".pdf" && ext != ".jpg" && ext != ".jpeg" && ext != ".png")
            return Results.BadRequest("Extensão de arquivo não permitida. Use .pdf, .jpg ou .png.");

        using var stream = file.OpenReadStream();
        var buffer = new byte[4];
        _ = await stream.ReadAsync(buffer, 0, 4, ct);
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

    // 1.1 Esse mesmo arquivo já foi recusado como inválido? Recusa na hora, sem gastar Cloudinary/OCR/IA.
    var rejectedMsg = await cache.SafeGetStringAsync(SaudeMemora.Api.Workers.DocumentProcessingWorker.RejectedHashKey(userId, fileHash), ct);
    if (rejectedMsg != null)
        return Results.UnprocessableEntity(new { status = "rejeitado", invalidDocument = true, message = rejectedMsg });

    // 2. Atalho de idempotência: já existe? Não gasta Cloudinary/OCR/IA de novo.
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

        return Results.Ok(new { id = existingDoc.Id, status = existingDoc.Status, progress = existingDoc.Progress, duplicate = true, message = "Documento já existente." });
    }

    // 3. Upload pro Cloudinary (com limpeza se qualquer página falhar, para não deixar órfãos)
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
        logger.LogError(ex, "[Upload] Falha no Cloudinary para o usuário {UserId}. Limpando {Count} arquivo(s) já enviados.", userId, uploaded.Count);
        await UploadHelpers.DeleteUploadedAsync(storage, uploaded.Select(u => u.publicId), logger);
        return Results.Problem("Falha ao armazenar os arquivos. Tente novamente.", statusCode: StatusCodes.Status502BadGateway);
    }

    // 4. Salvar no MongoDB como Pending (insert atômico protegido pelo índice único)
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
        return Results.Ok(new { id = savedDoc.Id, status = savedDoc.Status, progress = savedDoc.Progress, duplicate = true, message = "Documento já existente." });
    }

    await UploadHelpers.InvalidateDocumentListCachesAsync(cache, userId);

    return Results.Accepted($"/api/documents/{savedDoc.Id}",
        new { id = savedDoc.Id, status = savedDoc.Status, progress = savedDoc.Progress, duplicate = false, message = "Documento recebido na fila de processamento!" });
}).RequireAuthorization().RequireRateLimiting("upload").DisableAntiforgery().WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(UploadHelpers.MaxFilesPerUpload * UploadHelpers.MaxFileSizeBytes + 500_000));

// Recoloca na fila um documento cujo processamento falhou (botão "Tentar novamente")
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
}).RequireAuthorization().RequireRateLimiting("upload");


// Lista todos os documentos do paciente autenticado
app.MapGet("/api/documents", async (ClaimsPrincipal user, IDocumentRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = DocumentRepository.UserDocumentsCacheKey(userId);
    string? cached = null;
    try { cached = await cache.SafeGetStringAsync(cacheKey); } catch (Exception ex) { Console.Error.WriteLine("[Cache Ignorado] " + ex.Message); }
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
        cid = d.Cid,
        cnes = d.Cnes,
        medicamentos = (d.Medicamentos ?? new()).Select(m => new { m.Nome, m.Dosagem, m.Horario }),
        nomeExame = d.NomeExame,
        tipoExame = d.TipoExame,
        resultadosExame = (d.ResultadosExame ?? new()).Select(r => new { r.Nome, r.NomeNormalizado }),
        urlImagens = d.IdPublicos != null ? d.IdPublicos
            .Select(idPublico => storage.GetSignedUrl(idPublico) ?? string.Empty)
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .ToList() : new List<string>(),
        progress = d.Progress,
        errorMessage = d.ErrorMessage,
        criadoEm = d.CriadoEm,
        revisaoPendente = d.RevisaoPendente,
        alertas = d.Alertas ?? new(),
        revisadoEm = d.RevisadoEm
    }).OrderByDescending(d => d.criadoEm).ToList();

    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    try { await cache.SafeSetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) /* Reduzido de 10 para 5 min para não exceder URL assinada (15m) */ }); } catch (Exception ex) { Console.Error.WriteLine("[Cache Ignorado] " + ex.Message); }
    return Results.Ok(result);
}).RequireAuthorization();


// Contagens de documentos por tipo (para métricas do dashboard)
app.MapGet("/api/documents/count", async (ClaimsPrincipal user, IDocumentRepository repo, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var cacheKey = DocumentRepository.UserDocumentCountCacheKey(userId);
    var cached = await cache.SafeGetStringAsync(cacheKey);
    if (cached != null) return Results.Content(cached, "application/json");

    var docs = await repo.GetAllByPacienteIdAsync(userId);
    var list = docs.ToList();

    var result = new
    {
        total = list.Count,
        exames = list.Count(d => d.Tipo == "exame"),
        receitas = list.Count(d => d.Tipo == "receita"),
        laudos = list.Count(d => d.Tipo == "laudo"),
        atestados = list.Count(d => d.Tipo == "atestado"),
        vacinas = list.Count(d => d.Tipo == "vacina"),
        encaminhamentos = list.Count(d => d.Tipo == "encaminhamento"),
        relatorios = list.Count(d => d.Tipo == "relatorio"),
        outros = list.Count(d => d.Tipo == "outro"),
        receitasAtivas = list.Count(d => d.Tipo == "receita" && d.Status == "pronto" && 
            (string.IsNullOrEmpty(d.Data) || 
             (DateTime.TryParseExact(d.Data, "dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dt) 
              && dt >= DateTime.Today.AddDays(-30))))
    };

    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
    await cache.SafeSetStringAsync(cacheKey, System.Text.Json.JsonSerializer.Serialize(result, jsonOpts), new Microsoft.Extensions.Caching.Distributed.DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) /* Reduzido de 10 para 5 min para não exceder URL assinada (15m) */ });
    return Results.Ok(result);
}).RequireAuthorization();

// Busca documento por ID
app.MapGet("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IImageStorageService storage, IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
        return Results.BadRequest(new { error = "O identificador do documento é inválido." });

    var doc = await repo.GetByIdAsync(id);
    if (doc == null)
    {
        // Documento recusado pelo worker (não é médico/ilegível): foi removido, mas informamos o motivo ao dono
        string? marker = null;
        try { marker = await cache.SafeGetStringAsync(SaudeMemora.Api.Workers.DocumentProcessingWorker.RejectedDocKey(id)); } catch (Exception ex) { Console.Error.WriteLine("[Cache Ignorado] " + ex.Message); }
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
        cid = doc.Cid,
        cnes = doc.Cnes,
        medicamentos = (doc.Medicamentos ?? new()).Select(m => new { m.Nome, m.Dosagem, m.Horario }),
        nomeExame = doc.NomeExame,
        tipoExame = doc.TipoExame,
        resultado = doc.Resultado,
        especialidade = doc.Especialidade,
        tipoClinico = doc.TipoClinico,
        conteudo = doc.Conteudo,
        conclusoes = doc.Conclusoes,
        observacoes = doc.Observacoes,
        urlImagens = doc.IdPublicos != null ? doc.IdPublicos
            .Select(idPublico => storage.GetSignedUrl(idPublico) ?? string.Empty)
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .ToList() : new List<string>(),
        textoExtraido = doc.TextoExtraido,
        conteudoIndentado = doc.ConteudoIndentado ?? new(),
        resultadosExame = doc.ResultadosExame ?? new(),
        revisaoPendente = doc.RevisaoPendente,
        camposBaixaConfianca = doc.CamposBaixaConfianca ?? new(),
        progress = doc.Progress,
        errorMessage = doc.ErrorMessage,
        criadoEm = doc.CriadoEm,
        alertas = doc.Alertas ?? new(),
        revisadoEm = doc.RevisadoEm
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

    if (!string.IsNullOrWhiteSpace(updateDto.Data))
    {
        var culture = System.Globalization.CultureInfo.InvariantCulture;
        if (DateTime.TryParseExact(updateDto.Data, "dd/MM/yyyy", culture,
                System.Globalization.DateTimeStyles.None, out _))
        {
            // formato canônico — mantém
        }
        else if (DateTime.TryParseExact(updateDto.Data, "yyyy-MM-dd", culture,
                System.Globalization.DateTimeStyles.None, out var dtIso))
        {
            // converte para dd/MM/yyyy ao salvar
            updateDto.Data = dtIso.ToString("dd/MM/yyyy", culture);
        }
        else
        {
            return Results.BadRequest(new { error = "A data informada é inválida. Utilize dd/MM/yyyy ou yyyy-MM-dd." });
        }
    }

    doc.Titulo = updateDto.Titulo ?? doc.Titulo;
    doc.Medico = updateDto.Medico ?? doc.Medico;
    doc.Clinica = updateDto.Clinica ?? doc.Clinica;
    doc.Data = updateDto.Data ?? doc.Data;
    doc.Resumo = updateDto.Resumo ?? doc.Resumo;
    doc.Diagnostico = updateDto.Diagnostico ?? doc.Diagnostico;
    doc.Crm = updateDto.Crm ?? doc.Crm;
    doc.Cid = updateDto.Cid ?? doc.Cid;
    doc.Cnes = updateDto.Cnes ?? doc.Cnes;
    doc.NomeExame = updateDto.NomeExame ?? doc.NomeExame;
    doc.TipoExame = updateDto.TipoExame ?? doc.TipoExame;
    doc.Resultado = updateDto.Resultado ?? doc.Resultado;
    doc.Especialidade = updateDto.Especialidade ?? doc.Especialidade;
    doc.TipoClinico = updateDto.TipoClinico ?? doc.TipoClinico;
    doc.Conteudo = updateDto.Conteudo ?? doc.Conteudo;
    doc.Conclusoes = updateDto.Conclusoes ?? doc.Conclusoes;
    doc.Observacoes = updateDto.Observacoes ?? doc.Observacoes;
    doc.TextoExtraido = updateDto.TextoExtraido ?? doc.TextoExtraido;

    if (!string.IsNullOrWhiteSpace(updateDto.Tipo) && new[] { "exame", "receita", "laudo", "atestado", "vacina", "encaminhamento", "relatorio", "outro" }.Contains(updateDto.Tipo))
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
            // Se o usuário passar um valor numérico e referências, recalculamos o status (caso ele esteja indefinido ou não, para garantir consistência)
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

    // Medicamentos e tipo podem mudar durante a edição. Recalculamos avisos para
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
    await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(userId));
    await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(userId));
    return Results.Ok(new { message = "Documento atualizado com sucesso." });
}).AddEndpointFilter<GlobalValidationFilter>().RequireAuthorization();

// Exclui documento por ID (e remove do Cloudinary)
app.MapDelete("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IImageStorageService storage, Microsoft.Extensions.Caching.Distributed.IDistributedCache cache) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null || doc.PacienteId != userId) return Results.NotFound();

    await repo.DeleteAsync(id);

    if (doc.IdPublicos != null && doc.IdPublicos.Any())
    {
        foreach (var publicId in doc.IdPublicos)
        {
            if (!string.IsNullOrWhiteSpace(publicId))
            {
                try { await storage.DeleteImageAsync(publicId); }
                catch (Exception ex) { Console.WriteLine($"[Cloudinary] Erro ao deletar: {ex.Message}"); }
            }
        }
    }
    await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(userId));
    await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(userId));
    return Results.Ok(new { message = "Documento deletado com sucesso." });
}).RequireAuthorization();

//  Relatório Endpoints 

app.MapGet("/api/reports/generate", async (int? months, ClaimsPrincipal user, IPacienteRepository repo, IDocumentRepository docRepo, IFichaMedicaRepository fichaRepo, IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<Program> logger) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null || paciente.ConsentimentoIa?.Aceito != true)
        return Results.Json(new { message = "consentimento_necessario" }, statusCode: 403);

    var culture = System.Globalization.CultureInfo.InvariantCulture;
    var allDocs = await docRepo.GetAllByPacienteIdAsync(userId);

    int m = months ?? 6;
    if (m <= 0) m = 6;
    if (m > 120) m = 120;
    var limitData = DateTime.UtcNow.AddMonths(-m);

    // Filtra por data do documento (parseada) com fallback para CriadoEm
    var recentDocs = allDocs.Where(d =>
    {
        if (!string.IsNullOrEmpty(d.Data) &&
            DateTime.TryParseExact(d.Data, "dd/MM/yyyy", culture,
                System.Globalization.DateTimeStyles.None, out var docDate))
            return docDate >= limitData;
        return d.CriadoEm >= limitData;
    }).ToList();

    // Envia idade em vez de data de nascimento
    int idadePaciente = 0;
    if (DateTime.TryParse(paciente?.DataNascimento, out var nascimento))
    {
        idadePaciente = DateTime.Today.Year - nascimento.Year;
        if (nascimento.Date > DateTime.Today.AddYears(-idadePaciente)) idadePaciente--;
    }

    var ficha = await fichaRepo.GetByPacienteIdAsync(userId);

    var prompt = $@"
Você é um médico especialista montando um dossiê clínico (prontuário resumido) para outro médico ler antes da consulta.
Aqui estão os dados do paciente:

[Perfil]:
Idade: {idadePaciente} anos, Sexo: {paciente?.Sexo}

[Ficha Médica]:
Tipo Sanguíneo: {ficha?.TipoSanguineo}
Alergias: {string.Join(", ", ficha?.Alergias ?? new List<string>())}
Doenças Crônicas: {string.Join(", ", ficha?.DoencasCronicas ?? new List<string>())}
Medicamentos Contínuos: {string.Join(", ", ficha?.MedicamentosContinuos ?? new List<string>())}
Histórico Familiar: {ficha?.HistoricoFamiliar}
Cirurgias: {ficha?.Cirurgias}
Fuma: {ficha?.Fuma}, Bebe: {ficha?.Bebe}
Hábitos: {ficha?.HabitosGerais}
Obs: {ficha?.Observacoes}

[Documentos e Exames Recentes (últimos {m} meses)]:
";
    foreach (var doc in recentDocs)
    {
        var tipo = string.IsNullOrEmpty(doc.Tipo) ? "DOCUMENTO" : doc.Tipo.ToUpperInvariant();
        prompt += $"\n- {doc.Data} | {tipo} | {doc.Titulo}: {doc.Resumo} | Diagnóstico: {doc.Diagnostico}";
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
        return Results.Json(new { message = "Falha ao gerar relatório. Tente novamente mais tarde." }, statusCode: 502);
    }

    var json = await res.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
    var report = json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

    return Results.Ok(new { Report = report });
}).RequireAuthorization().RequireRateLimiting("chat");

app.Run();

//  DTOs auxiliares 

public record MedicamentoContinuoDto(string Nome, string Dosagem, string Horario);

public record PerfilMedicoDto(
    string? TipoSanguineo,
    bool? DoadorOrgaos,
    List<string>? Alergias,
    List<string>? DoencasCronicas,
    List<MedicamentoContinuoDto>? MedicamentosContinuos
);

public record ContatoDto(string? Telefone, string? Endereco, string? ContatoEmergencia);

public record PerfilUpdateDto(string? Nome, string? DataNascimento, string? Email, string? PlanoSaude, string? NumeroCarteirinha, string? SenhaAtual, string? ContatoEmergencia);
public record DeleteAccountDto(string Senha);

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
    public string? Cid { get; set; }
    public string? Cnes { get; set; }
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

// --- Helpers de Upload

static class UploadHelpers
{
    public const int MaxFilesPerUpload = 10;
    public const long MaxFileSizeBytes = 10L * 1024 * 1024; // 10 MB (mesmo limite exibido no frontend)

    /// <summary>
    /// SHA-256 de cada arquivo, combinados em ordem num SHA-256 final.
    /// Hash por arquivo evita ambiguidade de concatenação; a ordem importa (são páginas).
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

    /// <summary>Remove imagens do Cloudinary sem propagar exceções (best-effort).</summary>
    public static async Task DeleteUploadedAsync(IImageStorageService storage, IEnumerable<string> publicIds, ILogger logger)
    {
        foreach (var publicId in publicIds.Where(p => !string.IsNullOrWhiteSpace(p)))
        {
            try { await storage.DeleteImageAsync(publicId); }
            catch (Exception ex) { logger.LogWarning(ex, "[Cloudinary] Não foi possível remover {PublicId}", publicId); }
        }
    }

    public static async Task InvalidateDocumentListCachesAsync(IDistributedCache cache, string userId)
    {
        await cache.SafeRemoveAsync(DocumentRepository.UserDocumentsCacheKey(userId));
        await cache.SafeRemoveAsync(DocumentRepository.UserDocumentCountCacheKey(userId));
    }
}
