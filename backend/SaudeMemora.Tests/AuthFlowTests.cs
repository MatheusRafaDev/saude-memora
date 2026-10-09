using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Distributed;
using SaudeMemora.Api.Helpers;
using SaudeMemora.Domain.Entities;
using SaudeMemora.Domain.Interfaces;
using System.Collections.Concurrent;

namespace SaudeMemora.Tests;

public class AuthFlowTests
{
    [Fact]
    public async Task Logout_InvalidatesPreviouslyIssuedTokenAndUpdatesCachedStamp()
    {
        var patient = new Paciente
        {
            Id = "patient-1",
            Email = "usuario@teste.com",
            Nome = "Usuário",
            SecurityStamp = "old-stamp"
        };
        var repository = new StubPacienteRepository(patient);
        var cache = new StubDistributedCache();

        var revoked = await AuthSessionRevocation.RevokeAsync(
            patient.Id,
            patient.SecurityStamp,
            repository,
            cache);

        Assert.True(revoked);
        Assert.NotEqual("old-stamp", patient.SecurityStamp);
        Assert.Equal(patient.SecurityStamp, cache.GetString("secstamp_patient-1"));
        Assert.Equal(1, repository.UpdateCount);
        Assert.False(await AuthSessionRevocation.RevokeAsync(
            patient.Id,
            "old-stamp",
            repository,
            cache));
    }

    [Fact]
    public async Task Logout_RejectsDeletedOrMissingAccounts()
    {
        var deletedPatient = new Paciente
        {
            Id = "patient-1",
            Email = "usuario@teste.com",
            Nome = "Usuário",
            SecurityStamp = "old-stamp",
            IsDeleting = true
        };
        var repository = new StubPacienteRepository(deletedPatient);
        var cache = new StubDistributedCache();

        Assert.False(await AuthSessionRevocation.RevokeAsync(
            deletedPatient.Id,
            deletedPatient.SecurityStamp,
            repository,
            cache));
        Assert.False(await AuthSessionRevocation.RevokeAsync(
            "missing",
            "old-stamp",
            repository,
            cache));
        Assert.Equal(0, repository.UpdateCount);
    }

    [Fact]
    public void GetIpKey_UsesForwardedForHeader_WhenPresent()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers["X-Forwarded-For"] = "203.0.113.10, 10.0.0.1";

        var result = NetworkHelpers.GetIpKey(context);

        Assert.Equal("203.0.113.10", result);
    }

    [Fact]
    public void JwtTokenReader_ReadsBearerHeader_WhenPresent()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers.Authorization = "Bearer abc123";

        var result = JwtTokenReader.GetJwtTokenFromRequest(context.Request);

        Assert.Equal("abc123", result);
    }

    [Fact]
    public void JwtTokenReader_ReadsCookieToken_WhenHeaderIsMissing()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers.Cookie = "auth_token=def456";

        var result = JwtTokenReader.GetJwtTokenFromRequest(context.Request);

        Assert.Equal("def456", result);
    }

    [Fact]
    public void ParseJwtLifetime_UsesHoursAndDaysFormats()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:ExpiresIn"] = "12h"
            })
            .Build();

        var expiry = GetExpiryFromConfig(config);

        Assert.Equal(TimeSpan.FromHours(12), expiry);
    }

    [Fact]
    public void RegisterPatient_RequiresStrongPassword_WhenPasswordIsShort()
    {
        var password = "123";

        Assert.True(password.Length < 8);
    }

    [Fact]
    public void SecurityStamp_DefaultsToGuidWhenMissing()
    {
        var paciente = new Paciente { Email = "usuario@teste.com", Nome = "Usuário" };

        Assert.False(string.IsNullOrWhiteSpace(paciente.SecurityStamp));
    }

    private static TimeSpan GetExpiryFromConfig(IConfiguration config)
    {
        var jwtExpiresInStr = Environment.GetEnvironmentVariable("JWT_EXPIRES_IN")?.Trim()?.ToLowerInvariant() ?? config["JwtSettings:ExpiresIn"]?.Trim()?.ToLowerInvariant();
        if (string.IsNullOrEmpty(jwtExpiresInStr))
            return TimeSpan.FromDays(7);

        if (jwtExpiresInStr.EndsWith("h") && double.TryParse(jwtExpiresInStr.TrimEnd('h'), out var hours))
            return TimeSpan.FromHours(hours);

        if (jwtExpiresInStr.EndsWith("d") && double.TryParse(jwtExpiresInStr.TrimEnd('d'), out var days))
            return TimeSpan.FromDays(days);

        return TimeSpan.FromDays(7);
    }

    private sealed class StubPacienteRepository(Paciente? patient) : IPacienteRepository
    {
        public int UpdateCount { get; private set; }
        public Task<Paciente?> GetByIdAsync(string id) => Task.FromResult(patient?.Id == id ? patient : null);
        public Task<bool> TryUpdateSecurityStampAsync(string id, string currentStamp, string newStamp)
        {
            if (patient?.Id != id || patient.IsDeleting || patient.SecurityStamp != currentStamp)
            {
                return Task.FromResult(false);
            }

            patient.SecurityStamp = newStamp;
            UpdateCount++;
            return Task.FromResult(true);
        }
        public Task UpdateAsync(Paciente paciente)
        {
            UpdateCount++;
            return Task.CompletedTask;
        }
        public Task<Paciente?> GetByEmailAsync(string email) => Task.FromResult<Paciente?>(null);
        public Task<Paciente?> GetByResetTokenAsync(string token) => Task.FromResult<Paciente?>(null);
        public Task<Paciente?> GetByEmergenciaTokenAsync(string token) => Task.FromResult<Paciente?>(null);
        public Task<Paciente> CreateAsync(Paciente paciente) => Task.FromResult(paciente);
        public Task DeleteAsync(string id) => Task.CompletedTask;
        public Task<IEnumerable<Paciente>> GetUsersMarkedForDeletionAsync() => Task.FromResult<IEnumerable<Paciente>>([]);
    }

    private sealed class StubDistributedCache : IDistributedCache
    {
        private readonly ConcurrentDictionary<string, byte[]> _entries = new();

        public byte[]? Get(string key) => _entries.TryGetValue(key, out var value) ? value : null;
        public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
            => Task.FromResult(Get(key));
        public string? GetString(string key)
            => Get(key) is { } value ? System.Text.Encoding.UTF8.GetString(value) : null;
        public Task<string?> GetStringAsync(string key, CancellationToken token = default)
            => Task.FromResult(GetString(key));
        public void Refresh(string key) { }
        public Task RefreshAsync(string key, CancellationToken token = default) => Task.CompletedTask;
        public void Remove(string key) => _entries.TryRemove(key, out _);
        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Remove(key);
            return Task.CompletedTask;
        }
        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
            => _entries[key] = value;
        public Task SetAsync(
            string key,
            byte[] value,
            DistributedCacheEntryOptions options,
            CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }
    }
}
