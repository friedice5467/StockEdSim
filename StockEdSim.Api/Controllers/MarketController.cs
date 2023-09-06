namespace StockEdSim.Api.Controllers
{
    using System;
    using System.Net.Http;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Configuration;
    using Microsoft.AspNetCore.Authorization;
    using StockEdSim.Api.Model;
    using StockEdSim.Api.Db;
    using Microsoft.EntityFrameworkCore;
    using Newtonsoft.Json.Linq;
    using System.Security.Claims;

    namespace YourNamespace.Controllers
    {
        [Route("api/[controller]")]
        [ApiController]
        [Authorize]
        public class MarketController : ControllerBase
        {
            private readonly string _finnhubKey = string.Empty;
            private static readonly HttpClient client = new HttpClient();
            private readonly AppDbContext _context; 

            public MarketController(IConfiguration configuration, AppDbContext context)
            {
                _finnhubKey = configuration["Finnhub:Key"];
                _context = context;
            }

            [HttpGet("symbols")]
            public async Task<IActionResult> GetAllStockSymbols()
            {
                var url = $"https://finnhub.io/api/v1/stock/symbol?exchange=US&token={_finnhubKey}";

                HttpResponseMessage response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return Ok(content);
                }

                return BadRequest("Error fetching stock symbols.");
            }

            [HttpGet("candle/{symbol}")]
            public async Task<IActionResult> GetStockCandles(string symbol)
            {
                var oneYearAgo = DateTimeOffset.UtcNow.AddYears(-1).ToUnixTimeSeconds();
                var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

                var url = $"https://finnhub.io/api/v1/stock/candle?symbol={symbol}&resolution=D&from={oneYearAgo}&to={now}&token={_finnhubKey}";

                HttpResponseMessage response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return Ok(content);
                }

                return BadRequest("Error fetching stock candles.");
            }

            [HttpPost("buy")]
            public async Task<IActionResult> BuyStock([FromBody] Stock stockPurchase)
            {
                var student = await _context.Users.FindAsync(stockPurchase.StudentId);
                if (student == null)
                {
                    return BadRequest("Student not found.");
                }

                var currentStockPrice = await GetStockQuote(stockPurchase.StockSymbol);
                if (!currentStockPrice.HasValue)
                {
                    return BadRequest("Error fetching stock price.");
                }

                if (student.Balance < currentStockPrice.Value * stockPurchase.Amount)
                {
                    return BadRequest("Insufficient funds.");
                }

                student.Balance -= currentStockPrice.Value * stockPurchase.Amount;

                var existingStock = await _context.Stocks.FindAsync(stockPurchase.StudentId, stockPurchase.StockSymbol);
                if (existingStock != null)
                {
                    existingStock.Amount += stockPurchase.Amount;
                    _context.Stocks.Update(existingStock);
                }
                else
                {
                    _context.Stocks.Add(stockPurchase);
                }

                await _context.SaveChangesAsync();

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(), 
                    StudentId = stockPurchase.StudentId,
                    StockSymbol = stockPurchase.StockSymbol,
                    Amount = stockPurchase.Amount,
                    PriceAtTransaction = currentStockPrice ?? 0,
                    TransactionDate = DateTime.UtcNow  
                };

                if (!await LogTransaction(transaction))
                {
                    return BadRequest("Error logging the buy transaction.");
                }

                return Ok("Stock purchased successfully.");
            }

            [HttpPost("sell")]
            public async Task<IActionResult> SellStock([FromBody] Stock stockSale)
            {
                var student = await _context.Users.FindAsync(stockSale.StudentId);
                if (student == null)
                {
                    return BadRequest("Student not found.");
                }

                var currentStockPrice = await GetStockQuote(stockSale.StockSymbol);
                if (!currentStockPrice.HasValue)
                {
                    return BadRequest("Error fetching stock price.");
                }

                var existingStock = await _context.Stocks.FindAsync(stockSale.StudentId, stockSale.StockSymbol);
                if (existingStock == null || existingStock.Amount < stockSale.Amount)
                {
                    return BadRequest("Not enough stock to sell.");
                }

                student.Balance += currentStockPrice.Value * stockSale.Amount;
                existingStock.Amount -= stockSale.Amount;

                if (existingStock.Amount == 0)
                {
                    _context.Stocks.Remove(existingStock);
                }
                else
                {
                    _context.Stocks.Update(existingStock);
                }

                await _context.SaveChangesAsync();

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(), 
                    StudentId = stockSale.StudentId,
                    StockSymbol = stockSale.StockSymbol,
                    Amount = stockSale.Amount,
                    PriceAtTransaction = currentStockPrice ?? 0,
                    TransactionDate = DateTime.UtcNow 
                };

                if (!await LogTransaction(transaction))
                {
                    return BadRequest("Error logging the sell transaction.");
                }

                return Ok("Stock sold successfully.");
            }

            private async Task<double?> GetStockQuote(string symbol)
            {
                var url = $"https://finnhub.io/api/v1/quote?symbol={symbol}&token={_finnhubKey}";

                HttpResponseMessage response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var data = JObject.Parse(content);
                    return data["c"].ToObject<double>();
                }

                return null;
            }

            [Authorize(Roles = "Admin,Teacher")]
            [HttpGet("myclasses/students")]
            public async Task<IActionResult> GetStudentsAcrossMyClasses()
            {
                var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var tryParse = Guid.TryParse(checkThis, out Guid teacherId);

                var classes = await _context.Classes.Where(c => c.TeacherId == teacherId).ToListAsync();

                var result = new Dictionary<Guid, List<StudentData>>();

                foreach (var classItem in classes)
                {
                    var studentData = await _context.UserClasses
                                    .Where(uc => uc.ClassId == classItem.Id)
                                    .Select(uc => new StudentData
                                    {
                                        StudentId = uc.UserId,
                                        StudentName = uc.User.FullName,
                                        Profit = _context.Transactions
                                                         .Where(t => t.StudentId == uc.UserId)
                                                         .Sum(t => t.PriceAtTransaction * t.Amount),
                                        TransactionsCount = _context.Transactions
                                                         .Where(t => t.StudentId == uc.UserId)
                                                         .Count()
                                    })
                                    .OrderByDescending(s => s.Profit)
                                    .ThenByDescending(s => s.TransactionsCount)
                                    .ToListAsync();

                    result.Add(classItem.Id, studentData);
                }

                return Ok(result);
            }

            private async Task<bool> LogTransaction(Transaction transaction)
            {
                if (transaction == null || string.IsNullOrWhiteSpace(transaction.StockSymbol))
                {
                    return false;
                }

                _context.Transactions.Add(transaction);
                await _context.SaveChangesAsync();
                return true;
            }

        }
    }

}
