using System.Reflection;
using Xunit;

// Executor de testes local.
//
// Motivo: o VSTest precisa de named pipes para falar com o testhost, o que é bloqueado
// em ambientes com sandbox restritiva. Este runner invoca os mesmos métodos de teste
// por reflexão, no mesmo processo, para permitir verificação local.
// A CI usa `dotnet test` normalmente — este utilitário não faz parte da solução.

var assembly = typeof(SaudeMemora.Tests.CorsSettingsTests).Assembly;
var tiposDeTeste = assembly.GetTypes()
    .Where(t => t.IsClass && !t.IsAbstract && t.Namespace?.StartsWith("SaudeMemora.Tests") == true)
    .OrderBy(t => t.Name)
    .ToList();

var total = 0;
var passou = 0;
var falhas = new List<(string Nome, Exception Erro)>();
var ignorados = new List<string>();

foreach (var tipo in tiposDeTeste)
{
    var metodos = tipo.GetMethods(BindingFlags.Public | BindingFlags.Instance)
        .Where(m => m.GetCustomAttributes().Any(a => a is FactAttribute or TheoryAttribute))
        .OrderBy(m => m.Name)
        .ToList();

    if (metodos.Count == 0) continue;

    foreach (var metodo in metodos)
    {
        var theory = metodo.GetCustomAttributes().Any(a => a is TheoryAttribute);

        if (theory)
        {
            var inlineData = metodo.GetCustomAttributes<InlineDataAttribute>().ToList();
            if (inlineData.Count == 0)
            {
                ignorados.Add($"{tipo.Name}.{metodo.Name} (Theory sem InlineData)");
                continue;
            }

            foreach (var dado in inlineData)
            {
                total++;
                var argumentos = dado.GetData(metodo).Single();
                var nome = $"{tipo.Name}.{metodo.Name}({string.Join(", ", argumentos.Select(d => d?.ToString() ?? "null"))})";
                if (Executar(tipo, metodo, argumentos, out var erro)) passou++;
                else falhas.Add((nome, erro!));
            }
        }
        else
        {
            total++;
            var nome = $"{tipo.Name}.{metodo.Name}";
            if (Executar(tipo, metodo, null, out var erro)) passou++;
            else falhas.Add((nome, erro!));
        }
    }
}

Console.WriteLine();
Console.WriteLine($"Total: {total}  Passou: {passou}  Falhou: {falhas.Count}  Ignorados: {ignorados.Count}");

foreach (var ignorado in ignorados)
{
    Console.WriteLine($"  IGNORADO {ignorado}");
}

foreach (var (nome, erro) in falhas)
{
    Console.WriteLine();
    Console.WriteLine($"FALHOU {nome}");
    Console.WriteLine($"  {erro.GetType().Name}: {erro.Message}");
    if (erro.InnerException is not null)
    {
        Console.WriteLine($"  interno: {erro.InnerException.GetType().Name}: {erro.InnerException.Message}");
    }
}

return falhas.Count == 0 ? 0 : 1;

static bool Executar(Type tipo, MethodInfo metodo, object[]? argumentos, out Exception? erro)
{
    erro = null;

    // Cada teste roda em uma instância nova, como o xUnit faz por padrão.
    try
    {
        var instancia = Activator.CreateInstance(tipo);
        var resultado = metodo.Invoke(instancia, argumentos);

        if (resultado is Task task)
        {
            task.GetAwaiter().GetResult();
        }

        if (instancia is IDisposable disposable)
        {
            disposable.Dispose();
        }

        return true;
    }
    catch (TargetInvocationException ex)
    {
        erro = ex.InnerException ?? ex;
        return false;
    }
    catch (Exception ex)
    {
        erro = ex;
        return false;
    }
}
