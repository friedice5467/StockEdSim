using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StockEdSim.Api.Model;
using StockEdSim.Api.Db;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System.Security.Claims;

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
    public async Task<IActionResult> GetStockCandles([FromRoute]string symbol)
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

    [HttpPost("buy/{classId}")]
    public async Task<IActionResult> BuyStock([FromBody] Stock stockPurchase, [FromRoute] string classId)
    {
        var student = await _context.Users.FindAsync(stockPurchase.StudentId);
        if (student == null)
        {
            return BadRequest("Student not found.");
        }
        var balance = student.ClassBalances.FirstOrDefault(x => x.ClassId == Guid.Parse(classId));
        if (balance == null)
        {
            return BadRequest("Student does not have a balance for this class");
        }

        var currentStockPrice = await GetStockQuote(stockPurchase.StockSymbol);
        if (!currentStockPrice.HasValue)
        {
            return BadRequest("Error fetching stock price.");
        }

        if (balance.Balance < (decimal)currentStockPrice.Value * (decimal)stockPurchase.Amount)
        {
            return BadRequest("Insufficient funds.");
        }

        balance.Balance -= (decimal)currentStockPrice.Value * (decimal)stockPurchase.Amount;

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

    [HttpPost("sell/{classId}")]
    public async Task<IActionResult> SellStock([FromBody] Stock stockSale, [FromRoute] string classId)
    {
        var student = await _context.Users.FindAsync(stockSale.StudentId);
        if (student == null)
        {
            return BadRequest("Student not found.");
        }
        var balance = student.ClassBalances.FirstOrDefault(x => x.ClassId == Guid.Parse(classId));
        if (balance == null)
        {
            return BadRequest("Student does not have a balance for this class");
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

        balance.Balance += (decimal)currentStockPrice.Value * (decimal)stockSale.Amount;
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
    [HttpGet("myclasses/createClass")]
    public async Task<IActionResult> CreateClassroom([FromBody] Class createClass)
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid teacherId);
        if (!check)
            return BadRequest("User does not exist");

        await _context.Classes.AddAsync(new Class()
        {
            Id = Guid.NewGuid(),
            ClassName = createClass.ClassName,
            TeacherId = teacherId,
        });

        return Ok(createClass);
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpGet("myclasses/students")]
    public async Task<IActionResult> GetStudentsAcrossMyClasses()
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid teacherId);
        if (!check)
            return BadRequest("User does not exist");

        var classes = await _context.Classes.Where(c => c.TeacherId == teacherId).ToListAsync();

        var result = new Dictionary<Guid, List<StudentData>>();

        foreach (var classItem in classes)
        {
            var studentData = await _context.UserClasses
                            .Where(uc => uc.ClassId == classItem.Id)
                            .Select(uc => new StudentData
                            {
                                StudentId = uc.UserId,
                                StudentName = uc.User.FullName ?? string.Empty,
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

    [HttpGet("myprofile/dashboard")]
    public async Task<IActionResult> GetDashboardData()
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid guidId);
        if (!check) 
            return BadRequest("invalid user ID");

        var data = await _context.Users.Where(u => u.Id == guidId)
            .Select(u => new DashboardData
            {
                Stocks = u.Stocks.ToList(),
                Transactions = u.Transactions.ToList(),
                Classes = u.UserClasses.Select(x => x.Class).ToList(),
            }).ToListAsync();

        return Ok(data);
    }

    [HttpGet("myprofile/GetClasses")]
    public async Task<IActionResult> GetClassesData()
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid guidId);
        if (!check)
            return BadRequest("invalid user ID");

        var classes = await _context.UserClasses
            .Where(uc => uc.UserId == guidId)
            .SelectMany(uc => new List<Class>()
            {
                uc.Class
            })
            .ToListAsync();

        return Ok(classes);
    }

    [HttpPost("joinClass/{classId}")]
    public async Task<IActionResult> JoinClassById([FromRoute] string classId)
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid userId);
        if (!check)
            return BadRequest("invalid user ID");

        var getExisting = _context.ClassBalances.Where(x => x.UserId == userId && x.ClassId == Guid.Parse(classId));
        ClassBalance bal = new();
        if (getExisting.Any())
        {
            return BadRequest("User already joined the class");
        }
        else
        {
            bal = new() 
            { 
                UserId = userId,
                ClassId = Guid.Parse(classId),
                Balance = _context.Classes.FirstOrDefault(x => x.Id == Guid.Parse(classId))?.DefaultBalance ?? new ClassBalance().Balance
            };
            await _context.ClassBalances.AddAsync(bal);
            _context.SaveChanges();
        }
        return Ok(bal);
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

