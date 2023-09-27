using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using StockEdSim.Api.Model;
using System.Security.Claims;

namespace StockEdSim.Api.Hubs
{
    [Authorize]
    public class MarketHub : Hub
    {
        public async Task NotifyUser(string userId, string serializedData)
        {
            await Clients.User(userId).SendAsync("ReceiveUpdate", serializedData);
        }
        public async Task NotifyAll(ServiceResult<object> data)
        {
            await Clients.All.SendAsync("ReceiveGlobalUpdate", data);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await base.OnDisconnectedAsync(exception);
        }

    }
}
