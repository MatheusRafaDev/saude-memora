using System.Text.RegularExpressions;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

public class CloudinaryStorageService : IImageStorageService
{
    private readonly Cloudinary? _cloudinary;
    private readonly bool _isConfigured;

    public CloudinaryStorageService(IConfiguration config)
    {
        var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME") ?? config["CloudinarySettings:CloudName"];
        var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY") ?? config["CloudinarySettings:ApiKey"];
        var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET") ?? config["CloudinarySettings:ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloudName) || string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(apiSecret))
        {
            _cloudinary = null;
            _isConfigured = false;
            return;
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _isConfigured = true;
    }

    private Cloudinary GetCloudinaryOrThrow()
    {
        if (!_isConfigured || _cloudinary == null)
        {
            throw new InvalidOperationException("Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET antes de usar upload/imagens.");
        }

        return _cloudinary;
    }

    public async Task<(string imageUrl, string publicId)> UploadImageAsync(Stream stream, string fileName)
    {
        var cloudinary = GetCloudinaryOrThrow();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, stream),
            Folder = "saude-memora",
            Type = "authenticated"
        };

        var uploadResult = await cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            throw new Exception($"Erro no Cloudinary: {uploadResult.Error.Message}");
        }

        return (uploadResult.SecureUrl.ToString(), uploadResult.PublicId);
    }

    public string? GetSignedUrl(string publicId)
    {
        if (string.IsNullOrEmpty(publicId)) return null;

        var cloudinary = GetCloudinaryOrThrow();

        return cloudinary.Api.UrlImgUp
                         .Action("image")
                         .ResourceType("image")
                         .Type("authenticated")
                         .Secure(true)
                         .Signed(true)
                         .BuildUrl(publicId);
    }

    /// <summary>
    /// Gera URL assinada com transformação reduzida (máx 1600px largura, qualidade 80, jpg)
    /// garantindo que o arquivo fique bem abaixo do teto de 1.5MB do plano gratuito do OCR.space.
    /// </summary>
    public string? GetOcrOptimizedUrl(string publicId)
    {
        if (string.IsNullOrEmpty(publicId)) return null;

        var cloudinary = GetCloudinaryOrThrow();

        return cloudinary.Api.UrlImgUp
                         .Action("image")
                         .ResourceType("image")
                         .Type("authenticated")
                         .Transform(new Transformation().Width(1600).Crop("limit").Quality(80).FetchFormat("jpg"))
                         .Secure(true)
                         .Signed(true)
                         .BuildUrl(publicId);
    }

    private static readonly Regex CloudinaryVersionRegex = new(@"/v\d+/(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?|#|$)", RegexOptions.Compiled);
    private static readonly Regex CloudinaryAuthRegex = new(@"/image/(?:authenticated|upload)/(?:s--[^/]+--/)?(?:[a-zA-Z0-9_,]+:[^/]+/|[a-zA-Z0-9_,]+/)*?([^?#]+?)(?:\.[a-zA-Z0-9]+)?(?:\?|#|$)", RegexOptions.Compiled);

    public string GetOcrOptimizedUrlFromUrl(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return imageUrl;

        // Se já foi transformada ou não é Cloudinary, mantém a URL original
        if (imageUrl.Contains("c_limit") || imageUrl.Contains("w_1600") || !imageUrl.Contains("cloudinary.com"))
            return imageUrl;

        var vMatch = CloudinaryVersionRegex.Match(imageUrl);
        string? publicId = vMatch.Success ? vMatch.Groups[1].Value : null;

        if (string.IsNullOrEmpty(publicId))
        {
            var authMatch = CloudinaryAuthRegex.Match(imageUrl);
            if (authMatch.Success)
            {
                publicId = authMatch.Groups[1].Value;
            }
        }

        if (!string.IsNullOrEmpty(publicId))
        {
            var optimized = GetOcrOptimizedUrl(publicId);
            if (!string.IsNullOrEmpty(optimized))
                return optimized;
        }

        return imageUrl;
    }

    public async Task DeleteImageAsync(string publicId)
    {
        var cloudinary = GetCloudinaryOrThrow();

        var deletionParams = new DeletionParams(publicId)
        {
            Type = "authenticated",
            ResourceType = ResourceType.Image
        };
        var result = await cloudinary.DestroyAsync(deletionParams);
        if (result.Result != "ok" && result.Result != "not found")
        {
            Console.Error.WriteLine($"[Cloudinary Delete Error] Failed to delete {publicId}: {result.Result}");
        }
    }
}
