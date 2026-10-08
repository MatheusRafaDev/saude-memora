using System.Xml.Linq;
using System.Xml;

namespace SaudeMemora.Infrastructure.Services;

public static class CatalogoXmlReader
{
    public static async IAsyncEnumerable<Dictionary<string, string>> ReadRowsAsync(
        Stream stream,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (stream is null) throw new ArgumentNullException(nameof(stream));
        if (stream.CanSeek) stream.Position = 0;

        var settings = new XmlReaderSettings
        {
            Async = true,
            DtdProcessing = DtdProcessing.Prohibit,
            XmlResolver = null,
            IgnoreComments = true,
            IgnoreWhitespace = true
        };

        using var reader = XmlReader.Create(stream, settings);
        while (await reader.ReadAsync())
        {
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "Row") continue;

            using var subtree = reader.ReadSubtree();
            var row = await XDocument.LoadAsync(subtree, LoadOptions.None, cancellationToken);
            if (row?.Root is null)
            {
                continue;
            }

            yield return row.Root.Elements()
                .ToDictionary(
                    element => element.Name.LocalName,
                    element => element.Value,
                    StringComparer.OrdinalIgnoreCase);
        }
    }
}
