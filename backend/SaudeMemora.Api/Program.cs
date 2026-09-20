using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SaudeMemora.Application.DTOs;
using SaudeMemora.Application.Interfaces;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using SaudeMemora.Infrastructure.Data;
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
builder.Services.AddScoped<IImageStorageService, CloudinaryStorageService>();

builder.Services.AddValidatorsFromAssemblyContaining<RegisterPacienteDto>();

builder.Services.AddHttpClient();
builder.Services.AddScoped<IOcrAiService, GeminiOcrService>();

// CORS
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?.Split(',') ?? new[] { "http://localhost:3000" };

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

// ─── Auth Endpoints ────────────────────────────────────────────────────────

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
        return Results.BadRequest(new[] { "Email já cadastrado." });
    }

    // Verifica se CPF já existe
    var existingCpf = await repo.GetByCpfAsync(dto.Cpf);
    if (existingCpf != null)
    {
        return Results.BadRequest(new[] { "CPF já cadastrado." });
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
        return Results.BadRequest(new[] { "Email ou senha inválidos." });
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

// ─── Paciente Endpoints ────────────────────────────────────────────────────

// Retorna o perfil médico completo do paciente autenticado
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
        paciente.TipoSanguineo,
        paciente.DoadorOrgaos,
        paciente.Alergias,
        paciente.DoencasCronicas,
        MedicamentosContinuos = paciente.MedicamentosContinuos.Select(m => new
        {
            name = m.Nome,
            dosage = m.Dosagem,
            schedule = m.Horario
        })
    });
}).RequireAuthorization();

// Atualiza o perfil médico do paciente autenticado
app.MapPatch("/api/pacientes/me/perfil", async (ClaimsPrincipal user, IPacienteRepository repo, PerfilMedicoDto dto) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var paciente = await repo.GetByIdAsync(userId);
    if (paciente == null) return Results.NotFound();

    if (dto.TipoSanguineo != null) paciente.TipoSanguineo = dto.TipoSanguineo;
    if (dto.DoadorOrgaos.HasValue) paciente.DoadorOrgaos = dto.DoadorOrgaos.Value;
    if (dto.Alergias != null) paciente.Alergias = dto.Alergias;
    if (dto.DoencasCronicas != null) paciente.DoencasCronicas = dto.DoencasCronicas;
    if (dto.MedicamentosContinuos != null)
        paciente.MedicamentosContinuos = dto.MedicamentosContinuos.Select(m => new MedicamentoContinuo
        {
            Nome = m.Nome,
            Dosagem = m.Dosagem,
            Horario = m.Horario
        }).ToList();

    await repo.UpdateAsync(paciente);
    return Results.Ok(new { Message = "Perfil atualizado com sucesso." });
}).RequireAuthorization();

// Atualiza telefone e endereço do paciente autenticado
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

// ─── Document Endpoints ────────────────────────────────────────────────────

// Processa upload de novo documento com OCR
app.MapPost("/api/documents/upload", async (HttpContext context, ClaimsPrincipal user, IDocumentRepository docRepo, IImageStorageService storage, IOcrAiService ocr) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    if (!context.Request.HasFormContentType)
        return Results.BadRequest("Formato inválido. Esperado multipart/form-data.");

    var form = await context.Request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    var docType = form["type"].ToString();

    if (file == null || file.Length == 0)
        return Results.BadRequest("Nenhum arquivo enviado.");

    if (string.IsNullOrWhiteSpace(docType))
        docType = "receita"; // fallback padrao

    // 1. Upload pro Cloudinary
    using var stream = file.OpenReadStream();
    var (imageUrl, publicId) = await storage.UploadImageAsync(stream, file.FileName);

    // 2. Extração de Dados via Gemini (OCR AI)
    var extractedData = await ocr.ExtractDocumentDataAsync(imageUrl, docType);

    // 3. Salvar no MongoDB
    var docRecord = new DocumentRecord
    {
        PatientId = userId,
        ImageUrl = imageUrl,
        PublicId = publicId,
        Title = extractedData.Title,
        Type = docType,
        Status = "pronto", // poderia ser "processando" e usar webhooks se fosse fila
        Doctor = extractedData.Doctor,
        Clinic = extractedData.Clinic,
        Date = extractedData.Date,
        Summary = extractedData.Summary,
        Diagnosis = extractedData.Diagnosis,
        ExtractedText = extractedData.ExtractedText,
        CreatedAt = DateTime.UtcNow,
        Medicines = extractedData.Medicines.Select(m => new DocumentMedicine 
        { 
            Name = m.Name, 
            Dosage = m.Dosage 
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

    var docs = await repo.GetAllByPatientIdAsync(userId);

    return Results.Ok(docs.Select(d => new
    {
        id = d.Id,
        title = d.Title,
        type = d.Type,
        status = d.Status,
        doctor = d.Doctor,
        clinic = d.Clinic,
        date = d.Date,
        summary = d.Summary,
        diagnosis = d.Diagnosis,
        medicines = d.Medicines.Select(m => new { name = m.Name, dosage = m.Dosage }),
        imageUrl = d.ImageUrl,
        createdAt = d.CreatedAt
    }).OrderByDescending(d => d.createdAt));
}).RequireAuthorization();

// Contagens de documentos por tipo (para métricas do dashboard)
app.MapGet("/api/documents/count", async (ClaimsPrincipal user, IDocumentRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var docs = await repo.GetAllByPatientIdAsync(userId);
    var list = docs.ToList();

    return Results.Ok(new
    {
        total = list.Count,
        exames = list.Count(d => d.Type == "exame"),
        receitas = list.Count(d => d.Type == "receita"),
        laudos = list.Count(d => d.Type == "laudo"),
        receitasAtivas = list.Count(d => d.Type == "receita" && d.Status == "pronto")
    });
}).RequireAuthorization();

// Busca documento por ID
app.MapGet("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null || doc.PatientId != userId) return Results.NotFound();

    return Results.Ok(new
    {
        id = doc.Id,
        title = doc.Title,
        type = doc.Type,
        status = doc.Status,
        doctor = doc.Doctor,
        clinic = doc.Clinic,
        date = doc.Date,
        summary = doc.Summary,
        diagnosis = doc.Diagnosis,
        medicines = doc.Medicines.Select(m => new { name = m.Name, dosage = m.Dosage }),
        imageUrl = doc.ImageUrl,
        extractedText = doc.ExtractedText,
        createdAt = doc.CreatedAt
    });
}).RequireAuthorization();

// Exclui documento por ID (e remove do Cloudinary)
app.MapDelete("/api/documents/{id}", async (string id, ClaimsPrincipal user, IDocumentRepository repo, IImageStorageService storage) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Results.Unauthorized();

    var doc = await repo.GetByIdAsync(id);
    if (doc == null || doc.PatientId != userId) return Results.NotFound();

    // Remove imagem do Cloudinary (se existir)
    if (!string.IsNullOrWhiteSpace(doc.PublicId) && doc.PublicId != "mock_public_id_12345")
    {
        try { await storage.DeleteImageAsync(doc.PublicId); }
        catch (Exception ex) { Console.WriteLine($"[Cloudinary] Erro ao deletar imagem: {ex.Message}"); }
    }

    await repo.DeleteAsync(id);
    return Results.Ok(new { message = "Documento deletado com sucesso." });
}).RequireAuthorization();

app.Run();

// ─── DTOs auxiliares ───────────────────────────────────────────────────────

public record MedicamentoContinuoDto(string Nome, string Dosagem, string Horario);

public record PerfilMedicoDto(
    string? TipoSanguineo,
    bool? DoadorOrgaos,
    List<string>? Alergias,
    List<string>? DoencasCronicas,
    List<MedicamentoContinuoDto>? MedicamentosContinuos
);

public record ContatoDto(string? Telefone, string? Endereco);
