namespace SaudeMemora.Application.Interfaces;

public interface IImageStorageService
{
    Task<(string imageUrl, string publicId)> UploadImageAsync(Stream stream, string fileName);
    Task DeleteImageAsync(string publicId);
}
