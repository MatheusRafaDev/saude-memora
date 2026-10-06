using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SaudeMemora.Api.Hubs;

[Authorize]
public class DocumentHub : Hub
{
    // Hub methods can be added here if the client needs to send messages to the server.
    // For now, it's used to push notifications from the server to the client.
}
