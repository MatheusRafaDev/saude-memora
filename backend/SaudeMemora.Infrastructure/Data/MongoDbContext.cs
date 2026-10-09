using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using SaudeMemora.Domain.Entities;

namespace SaudeMemora.Infrastructure.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING")
            ?? configuration["MongoDbSettings:ConnectionString"]
            ?? "mongodb://localhost:27017";

        var databaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME")
            ?? configuration["MongoDbSettings:DatabaseName"]
            ?? "saudeMemora";

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("MONGODB_CONNECTION_STRING ausente. Configure a string de conexão do MongoDB antes de iniciar a API.");

        if (string.IsNullOrWhiteSpace(databaseName))
            throw new InvalidOperationException("MONGODB_DATABASE_NAME ausente. Configure o nome do banco MongoDB antes de iniciar a API.");

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<RegistroDocumento> Documentos => _database.GetCollection<RegistroDocumento>("Documentos");
    public IMongoDatabase Database => _database;
    public IMongoCollection<ChatHistorico> ChatHistoricos => _database.GetCollection<ChatHistorico>("ChatHistoricos");
    public IMongoCollection<Paciente> Pacientes => _database.GetCollection<Paciente>("Pacientes");
    public IMongoCollection<FichaMedica> FichaMedicas => _database.GetCollection<FichaMedica>("FichaMedicas");
    public IMongoCollection<MedicamentoCatalogo> MedicamentosCatalogo => _database.GetCollection<MedicamentoCatalogo>("MedicamentosCatalogo");
    public IMongoCollection<Cid10Registro> Cid10Catalogo => _database.GetCollection<Cid10Registro>("Cid10Catalogo");
    public IMongoCollection<CnesRegistro> CnesCatalogo => _database.GetCollection<CnesRegistro>("CnesCatalogo");
    public IMongoCollection<SistemaLog> Logs => _database.GetCollection<SistemaLog>("Logs");
}
