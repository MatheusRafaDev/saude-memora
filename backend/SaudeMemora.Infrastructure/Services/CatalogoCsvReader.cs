using System.Text;

namespace SaudeMemora.Infrastructure.Services;

public static class CatalogoCsvReader
{
    public static async IAsyncEnumerable<string[]> ReadAsync(
        Stream stream,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (stream is null) throw new ArgumentNullException(nameof(stream));
        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        using var reader = new StreamReader(
            stream,
            Encoding.GetEncoding(1252),
            detectEncodingFromByteOrderMarks: true,
            bufferSize: 8192,
            leaveOpen: true);

        var record = new List<string>();
        var field = new StringBuilder();
        var inQuotes = false;
        var line = 1;
        var buffer = new char[1];

        while (true)
        {
            var charactersRead = await reader.ReadAsync(buffer.AsMemory(), cancellationToken);
            if (charactersRead == 0)
            {
                break;
            }

            var value = buffer[0];
            if (value == '\r')
            {
                var nextCharacter = reader.Peek();
                if (nextCharacter == '\n')
                {
                    reader.Read();
                }

                if (inQuotes)
                {
                    field.Append('\r');
                    if (nextCharacter == '\n') field.Append('\n');
                }
                else
                {
                    record.Add(field.ToString());
                    field.Clear();
                    yield return record.ToArray();
                    record.Clear();
                }

                line++;
                continue;
            }

            if (value == '\n')
            {
                if (inQuotes)
                {
                    field.Append('\n');
                }
                else
                {
                    record.Add(field.ToString());
                    field.Clear();
                    yield return record.ToArray();
                    record.Clear();
                }

                line++;
                continue;
            }

            if (value == '"')
            {
                if (inQuotes && field.Length > 0 && field[^1] == '"')
                {
                    field.Length--;
                }
                else if (inQuotes || field.Length == 0)
                {
                    inQuotes = !inQuotes;
                }
                else
                {
                    field.Append(value);
                }

                continue;
            }

            if (value == ';' && !inQuotes)
            {
                record.Add(field.ToString());
                field.Clear();
            }
            else
            {
                field.Append(value);
            }
        }

        if (inQuotes)
        {
            throw new InvalidDataException($"CSV unterminado na linha {line}.");
        }

        if (field.Length > 0 || record.Count > 0)
        {
            record.Add(field.ToString());
            yield return record.ToArray();
        }
    }
}
