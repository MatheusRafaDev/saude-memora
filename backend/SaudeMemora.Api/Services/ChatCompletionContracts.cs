namespace SaudeMemora.Api.Services;

public sealed record ChatMessage(
    string Role,
    string? Content,
    IReadOnlyList<ChatToolCall>? ToolCalls = null,
    string? ToolCallId = null);

public sealed record ChatToolCall(string Id, string Name, string Arguments);

public sealed record ChatCompletionRequest(
    string Model,
    IReadOnlyList<ChatMessage> Messages,
    bool EnableTools,
    int MaxInputTokens,
    int MaxOutputTokens,
    string CorrelationId);

public sealed record ChatUsage(int? PromptTokens, int? CompletionTokens, int? TotalTokens);

public sealed record ChatCompletionResult(
    string? Content,
    IReadOnlyList<ChatToolCall> ToolCalls,
    ChatUsage Usage);

public interface IChatCompletionClient
{
    Task<ChatCompletionResult> CompleteAsync(ChatCompletionRequest request, CancellationToken cancellationToken);
}

public sealed class ChatProviderException : Exception
{
    public ChatProviderException(string message, int? statusCode = null, Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
    }

    public int? StatusCode { get; }
}

public sealed class ChatContextBudgetExceededException : Exception
{
    public ChatContextBudgetExceededException(int estimatedTokens, int maxTokens)
        : base($"Estimated input is {estimatedTokens} tokens; configured budget is {maxTokens}.")
    {
        EstimatedTokens = estimatedTokens;
        MaxTokens = maxTokens;
    }

    public int EstimatedTokens { get; }
    public int MaxTokens { get; }
}

public sealed record PatientDocumentExcerpt(string Id, string Title, string Date, string Type, string Excerpt);

public sealed record ChatToolExecutionResult(string Content, IReadOnlyList<PatientDocumentExcerpt> Documents);

public sealed record ChatAnswer(string Response, IReadOnlyList<string> CitationIds);

public sealed record PatientChatTurnResult(ChatCompletionResult Completion, IReadOnlyList<PatientDocumentExcerpt> RetrievedDocuments);
