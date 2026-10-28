using Microsoft.Extensions.Configuration;
using SaudeMemora.Infrastructure.Services;
using Xunit;

namespace SaudeMemora.Tests;

public class CloudinaryStorageServiceTests
{
    private CloudinaryStorageService CreateService(bool configured = true)
    {
        var settings = new Dictionary<string, string?>();
        if (configured)
        {
            settings["CloudinarySettings:CloudName"] = "test-cloud";
            settings["CloudinarySettings:ApiKey"] = "123456789";
            settings["CloudinarySettings:ApiSecret"] = "test-secret-key-12345";
        }
        var config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        return new CloudinaryStorageService(config);
    }

    [Fact]
    public void GetSignedUrl_WhenNotConfigured_ThrowsInvalidOperationException()
    {
        var service = CreateService(configured: false);
        Assert.Throws<InvalidOperationException>(() => service.GetSignedUrl("test-id"));
    }

    [Fact]
    public void GetSignedUrl_WhenConfigured_ReturnsSignedUrl()
    {
        var service = CreateService();
        var url = service.GetSignedUrl("saude-memora/doc123");

        Assert.NotNull(url);
        Assert.Contains("test-cloud", url);
        Assert.Contains("saude-memora/doc123", url);
        Assert.Contains("/image/authenticated/", url);
    }

    [Fact]
    public void GetOcrOptimizedUrl_WhenConfigured_IncludesTransformationParameters()
    {
        var service = CreateService();
        var url = service.GetOcrOptimizedUrl("saude-memora/doc123");

        Assert.NotNull(url);
        Assert.Contains("test-cloud", url);
        Assert.Contains("saude-memora/doc123", url);
        Assert.Contains("c_limit", url);
        Assert.Contains("w_1600", url);
        Assert.Contains("q_80", url);
        Assert.Contains("f_jpg", url);
    }

    [Theory]
    [InlineData("https://res.cloudinary.com/test-cloud/image/authenticated/s--abc123--/v1/saude-memora/ew6xztm0eyvgywkx1v36")]
    [InlineData("https://res.cloudinary.com/test-cloud/image/authenticated/s--abc123--/v1/saude-memora/ew6xztm0eyvgywkx1v36.jpg")]
    [InlineData("https://res.cloudinary.com/test-cloud/image/authenticated/s--abc123--/saude-memora/ew6xztm0eyvgywkx1v36")]
    public void GetOcrOptimizedUrlFromUrl_ExtractsPublicIdAndAppliesTransformation(string originalUrl)
    {
        var service = CreateService();
        var ocrUrl = service.GetOcrOptimizedUrlFromUrl(originalUrl);

        Assert.NotNull(ocrUrl);
        Assert.Contains("c_limit", ocrUrl);
        Assert.Contains("w_1600", ocrUrl);
        Assert.Contains("saude-memora/ew6xztm0eyvgywkx1v36", ocrUrl);
    }

    [Fact]
    public void GetOcrOptimizedUrlFromUrl_WhenAlreadyOptimized_DoesNotTransformAgain()
    {
        var service = CreateService();
        var alreadyOptimized = "https://res.cloudinary.com/test-cloud/image/authenticated/s--sig--/c_limit,w_1600/v1/saude-memora/doc1";
        var result = service.GetOcrOptimizedUrlFromUrl(alreadyOptimized);

        Assert.Equal(alreadyOptimized, result);
    }

    [Fact]
    public void GetOcrOptimizedUrlFromUrl_WhenNonCloudinaryUrl_ReturnsOriginal()
    {
        var service = CreateService();
        var externalUrl = "https://example.com/medical-doc.jpg";
        var result = service.GetOcrOptimizedUrlFromUrl(externalUrl);

        Assert.Equal(externalUrl, result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void GetOcrOptimizedUrlFromUrl_WhenNullOrWhitespace_ReturnsSame(string? input)
    {
        var service = CreateService();
        var result = service.GetOcrOptimizedUrlFromUrl(input!);

        Assert.Equal(input, result);
    }
}
