using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StockEdSim.Api.Model;
using StockEdSim.Api.Db;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System.Security.Claims;
using StockEdSim.Api.Model.Dto;
using AutoMapper;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MarketController : ControllerBase
{
    private readonly string _finnhubKey = string.Empty;
    private static readonly HttpClient client = new HttpClient();
    private readonly AppDbContext _dbcontext;
    private readonly IMapper _mapper;

    public MarketController(IConfiguration configuration, AppDbContext context, IMapper mapper)
    {
        _finnhubKey = configuration["Finnhub:Key"];
        _dbcontext = context;
        _mapper = mapper;
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
        var student = await _dbcontext.Users.FindAsync(stockPurchase.StudentId);
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

        var existingStock = await _dbcontext.Stocks.FindAsync(stockPurchase.StudentId, stockPurchase.StockSymbol);
        if (existingStock != null)
        {
            existingStock.Amount += stockPurchase.Amount;
            _dbcontext.Stocks.Update(existingStock);
        }
        else
        {
            _dbcontext.Stocks.Add(stockPurchase);
        }

        await _dbcontext.SaveChangesAsync();

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
        var student = await _dbcontext.Users.FindAsync(stockSale.StudentId);
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

        var existingStock = await _dbcontext.Stocks.FindAsync(stockSale.StudentId, stockSale.StockSymbol);
        if (existingStock == null || existingStock.Amount < stockSale.Amount)
        {
            return BadRequest("Not enough stock to sell.");
        }

        balance.Balance += (decimal)currentStockPrice.Value * (decimal)stockSale.Amount;
        existingStock.Amount -= stockSale.Amount;

        if (existingStock.Amount == 0)
        {
            _dbcontext.Stocks.Remove(existingStock);
        }
        else
        {
            _dbcontext.Stocks.Update(existingStock);
        }

        await _dbcontext.SaveChangesAsync();

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

    private async Task<decimal?> GetStockQuote(string symbol)
    {
        var url = $"https://finnhub.io/api/v1/quote?symbol={symbol}&token={_finnhubKey}";

        HttpResponseMessage response = await client.GetAsync(url);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            var data = JObject.Parse(content);
            return data["c"].ToObject<decimal>();
        }

        return null;
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost("myclasses/createClass")]
    public async Task<IActionResult> CreateClassroom([FromBody] ClassDTO createClass)
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid teacherId);
        if (!check)
            return BadRequest("User does not exist");

        var newClass = new Class()
        {
            Id = Guid.NewGuid(),
            ClassName = createClass.ClassName,
            TeacherId = teacherId,
            DefaultBalance = createClass.DefaultBalance
        };

        await _dbcontext.Classes.AddAsync(newClass);
        await _dbcontext.SaveChangesAsync(); 

        return Ok(newClass);
    }


    [Authorize(Roles = "Admin,Teacher")]
    [HttpGet("myclasses/students")]
    public async Task<IActionResult> GetStudentsAcrossMyClasses()
    {
        var checkThis = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var check = Guid.TryParse(checkThis, out Guid teacherId);
        if (!check)
            return BadRequest("User does not exist");

        var classes = await _dbcontext.Classes.Where(c => c.TeacherId == teacherId).ToListAsync();

        var result = new Dictionary<Guid, List<StudentData>>();

        foreach (var classItem in classes)
        {
            var studentData = await _dbcontext.UserClasses
                            .Where(uc => uc.ClassId == classItem.Id)
                            .Select(uc => new StudentData
                            {
                                StudentId = uc.UserId,
                                StudentName = uc.User.FullName ?? string.Empty,
                                Profit = _dbcontext.Transactions
                                                 .Where(t => t.StudentId == uc.UserId)
                                                 .Sum(t => t.PriceAtTransaction * t.Amount),
                                TransactionsCount = _dbcontext.Transactions
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

        var data = await _dbcontext.Users.Where(u => u.Id == guidId)
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

        var classes = await _dbcontext.UserClasses
            .Where(uc => uc.UserId == guidId)
            .Include(uc => uc.Class)
                .ThenInclude(c => c.ClassBalances)
            .Select(uc => uc.Class)
            .ToListAsync();

        var classesDTO = _mapper.Map<List<ClassDTO>>(classes);

        return Ok(classesDTO);
    }

    [HttpPost("joinClass/{classId}")]
    public async Task<IActionResult> JoinClassById([FromRoute] Guid classId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out Guid userId))
            return BadRequest("Invalid user ID");

        if (_dbcontext.UserClasses.Any(x => x.UserId == userId && x.ClassId == classId))
            return BadRequest("User already joined the class");

        var targetClass = await _dbcontext.Classes.FindAsync(classId);
        if (targetClass == null)
            return NotFound("Class not found");

        using (var transaction = _dbcontext.Database.BeginTransaction())
        {
            try
            {
                var balance = new ClassBalance
                {
                    UserId = userId,
                    ClassId = classId,
                    Balance = targetClass.DefaultBalance
                };

                await _dbcontext.ClassBalances.AddAsync(balance);

                var userClass = new UserClass
                {
                    ClassId = classId,
                    UserId = userId
                };

                await _dbcontext.UserClasses.AddAsync(userClass);

                await _dbcontext.SaveChangesAsync();

                transaction.Commit();
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                return BadRequest($"An error occurred while joining the class, {ex.Message}");
            }
        }

        var userClasses = _dbcontext.Users
            .Include(u => u.UserClasses)
                .ThenInclude(uc => uc.Class)
                    .ThenInclude(c => c.ClassBalances)
            .Where(u => u.Id == userId)
            .SelectMany(u => u.UserClasses.Select(uc => uc.Class))
            .ToList();

        var userClassesDTO = _mapper.Map<List<ClassDTO>>(userClasses);

        return Ok(userClassesDTO);
    }

    private async Task<bool> LogTransaction(Transaction transaction)
    {
        if (transaction == null || string.IsNullOrWhiteSpace(transaction.StockSymbol))
        {
            return false;
        }

        _dbcontext.Transactions.Add(transaction);
        await _dbcontext.SaveChangesAsync();
        return true;
    }
}

