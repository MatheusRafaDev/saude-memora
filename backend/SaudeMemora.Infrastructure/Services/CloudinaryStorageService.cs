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
