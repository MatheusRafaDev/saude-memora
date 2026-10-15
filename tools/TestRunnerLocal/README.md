# TestRunnerLocal

Executor de testes local, **fora da solução** (`backend/SaudeMemora.slnx`).

## Para que serve

O `dotnet test` depende do VSTest, que conversa com o `testhost` por *named pipes*.
Em ambientes com sandbox restritiva (onde a criação de pipes é negada), o teste
falha com `Win32Exception (5): Acesso negado` antes de executar qualquer caso — mesmo
que os testes compilen normalmente.

Este utilitário invoca os **mesmos métodos de teste** por reflexão, dentro do próprio
processo, para permitir verificação local nesses ambientes. Ele respeita `[Fact]`,
`[Theory]`/`[InlineData]` e cria uma instância nova por teste, como o xUnit faz.

## Uso

```powershell
dotnet run --project tools/TestRunnerLocal/TestRunnerLocal.csproj
```

Código de saída `0` quando tudo passa; `1` quando há falha (com o nome do teste e a
exceção). Testes `[Theory]` sem `[InlineData]` são reportados como ignorados.

## Limites

- Não substitui o `dotnet test`: **a CI usa `dotnet test`** e é a fonte da verdade.
- Não implementa `[ClassFixture]`, `[Collection]`, `MemberData` nem *skip*; testes que
  dependam desses recursos apareceram como ignorados ou falhariam aqui.
- Roda tudo em sequência, no mesmo processo.
