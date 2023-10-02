using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StockEdSim.Api.Model.Dto;
using StockEdSim.Api.Services.Abstract;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using StockEdSim.Api.Hubs;
using System.Text.Json;

namespace StockEdSim.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MarketController : ControllerBase
    {
        private readonly IHubContext<MarketHub> _marketHubContext;
        private readonly IMarketService _marketService;

        public MarketController(IHubContext<MarketHub> marketHubContext, IMarketService marketService)
        {
            _marketHubContext = marketHubContext ?? throw new ArgumentNullException(nameof(marketHubContext));
            _marketService = marketService ?? throw new ArgumentNullException(nameof(marketService));
        }

        [HttpGet("symbols")]
        public async Task<IActionResult> GetAllStockSymbols()
        {
            var result = await _marketService.GetAllStockSymbolsAsync();
            if (result.IsSuccess)
                return Ok(result.Data);

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpGet("candle/{symbol}")]
        public async Task<IActionResult> GetStockCandles([FromRoute] string symbol)
        {
            var result = await _marketService.GetStockCandlesAsync(symbol);
            if (result.IsSuccess)
                return Ok(result.Data);

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpGet("bulkQuote/{symbols}")]
        public async Task<IActionResult> GetBulkQuotes([FromRoute] string symbols)
        {
            var result = await _marketService.GetBulkStockQuotesAsync(symbols);
            if (result.IsSuccess)
                return Ok(result.Data);

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpPost("buy/{classId}")]
        public async Task<IActionResult> BuyStock([FromBody] StockDTO stockPurchase, [FromRoute] Guid classId)
        {
            var result = await _marketService.BuyStock(stockPurchase, classId);
            if (result.IsSuccess)
            {
                var userId = GetUserGuid();
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpPost("sell/{classId}")]
        public async Task<IActionResult> SellStock([FromBody] StockDTO stockSale, [FromRoute] Guid classId)
        {
            var result = await _marketService.SellStock(stockSale, classId);
            if (result.IsSuccess)
            {
                var userId = GetUserGuid();
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [Authorize(Roles = "Admin,Teacher")]
        [HttpPost("myclasses/createClass")]
        public async Task<IActionResult> CreateClassroom([FromBody] ClassDTO createClass)
        {
            var userId = GetUserGuid();
            var result = await _marketService.CreateClassroomAsync(createClass, userId);
            if (result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }
            return BadRequest(result.Message);
        }


        [Authorize(Roles = "Admin,Teacher")]
        [HttpGet("myclasses/students")]
        public async Task<IActionResult> GetStudentsAcrossMyClasses()
        {
            var userId = GetUserGuid();
            var result = await _marketService.GetStudentsAcrossMyClasses(userId);
            if (result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpGet("myprofile/dashboard")]
        public async Task<IActionResult> GetDashboardData()
        {
            var userId = GetUserGuid();
            var result = await _marketService.GetDashboardData(userId);
            if (result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }    

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpGet("myprofile/GetClasses")]
        public async Task<IActionResult> GetClassesData()
        {
            var userId = GetUserGuid();
            var result = await _marketService.GetClassesData(userId);
            if (result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpPost("joinClass/{classId}")]
        public async Task<IActionResult> JoinClassById([FromRoute] Guid classId)
        {
            var userId = GetUserGuid();
            var result = await _marketService.JoinClassById(userId, classId);
            if (result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }

            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpGet("myprofile/getPortfolioValue/{classId}")]
        public async Task<IActionResult> GetPortfolioValues([FromRoute] Guid classId)
        {
            var userId = GetUserGuid();
            var result = await _marketService.GetPortfolioByIds(userId, classId);
            if(result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }
            return StatusCode((int)result.StatusCode, result.Message);
        }

        [HttpGet("leaderboards/{classId}")]
        public async Task<IActionResult> GetLeaderboards([FromRoute] Guid classId)
        {
            var userId = GetUserGuid();
            var result = await _marketService.GetLeaderboardDataByClassId(classId);
            if(result.IsSuccess)
            {
                var serializedResult = JsonSerializer.Serialize(result);
                await _marketHubContext.Clients.User(userId.ToString()).SendAsync("ReceiveUpdate", serializedResult);
                return Ok();
            }
            return StatusCode((int)result.StatusCode, result.Message);
        }


        private Guid GetUserGuid()
        {
            var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var check = Guid.TryParse(checkThis, out Guid userId);
            if (!check)
                throw new Exception("User does not exist");

            return userId;
        }
    }
}
