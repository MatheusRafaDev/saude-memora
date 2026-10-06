using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using SaudeMemora.Application.Interfaces;

namespace SaudeMemora.Infrastructure.Services;

public class CloudinaryStorageService : IImageStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryStorageService(IConfiguration config)
    {
        var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME") ?? config["CloudinarySettings:CloudName"];
        var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY") ?? config["CloudinarySettings:ApiKey"];
        var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET") ?? config["CloudinarySettings:ApiSecret"];

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<(string imageUrl, string publicId)> UploadImageAsync(Stream stream, string fileName)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, stream),
            Folder = "saude-memora",
            Type = "authenticated"
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            throw new Exception($"Erro no Cloudinary: {uploadResult.Error.Message}");
        }

        return (uploadResult.SecureUrl.ToString(), uploadResult.PublicId);
    }

    public string? GetSignedUrl(string publicId)
    {
        if (string.IsNullOrEmpty(publicId)) return null;

        // AuthToken usa API fluente: Duration/Expiration são métodos, não propriedades
        var token = new AuthToken(_cloudinary.Api.Account.ApiSecret)
            .Duration(900); // 15 minutos em segundos

        return _cloudinary.Api.UrlImgUp
                             .Action("image")
                             .ResourceType("image")
                             .Type("authenticated")
                             .Secure(true)
                             .AuthToken(token)
                             .BuildUrl(publicId);
    }

    public async Task DeleteImageAsync(string publicId)
    {
        var deletionParams = new DeletionParams(publicId)
        {
            Type = "authenticated",
            ResourceType = ResourceType.Image
        };
        var result = await _cloudinary.DestroyAsync(deletionParams);
        if (result.Result != "ok" && result.Result != "not found")
        {
            Console.Error.WriteLine($"[Cloudinary Delete Error] Failed to delete {publicId}: {result.Result}");
        }
    }
}
