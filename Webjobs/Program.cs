using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using StockEdSim.Api.Services;
using StockEdSim.Api.Db;
using StockEdSim.Api.Model;

class Program
{
    static IConfiguration _configuration;
    static AppDbContext _dbContext;
    static IMapper _mapper;

    static async Task Main(string[] args)
    {
        InitializeServices();

        DateTime nextRunTime = CalculateNextRunTime();

        while (true)
        {
            var currentTime = DateTime.UtcNow;
            if (currentTime > nextRunTime)
            {
                await CalculateTotalPortfoliosAsync();

                nextRunTime = CalculateNextRunTime();
            }

            Thread.Sleep(TimeSpan.FromMinutes(1));
        }
    }

    private static DateTime CalculateNextRunTime()
    {
        TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
        DateTime currentEst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, easternZone);
        DateTime nextMidnightEst = currentEst.Date.AddDays(1);

        return TimeZoneInfo.ConvertTimeToUtc(nextMidnightEst, easternZone);
    }

    private static async Task CalculateTotalPortfoliosAsync()
    {
        using var marketService = new MarketService(_configuration, _dbContext, _mapper);

        var allUsers = _dbContext.Users.Include(u => u.Stocks).Include(u => u.Transactions)
            .Include(u => u.UserClasses).ThenInclude(uc => uc.Class).ThenInclude(c => c.ClassBalances).ToList();

        var newPortfolios = new List<Portfolio>();

        foreach (var user in allUsers)
        {
            foreach (var userClass in user.UserClasses)
            {
                var stocksOfClassSymbols = userClass.Class.Stocks.Select(x => x.StockSymbol);
                var getServiceResult = await marketService.GetBulkStockQuotesAsync(string.Join(",", stocksOfClassSymbols));

                if (getServiceResult != null && getServiceResult.IsSuccess && getServiceResult.Data != null)
                {
                    decimal portfolioValue = 0;

                    foreach (var stock in userClass.Class.Stocks)
                    {
                        var currentStockPrice = (decimal?)getServiceResult.Data.FirstOrDefault(x => x.Symbol == stock.StockSymbol)?.Price ?? 0;
                        portfolioValue += currentStockPrice * stock.Amount;
                    }

                    newPortfolios.Add(new Portfolio()
                    {
                        Id = Guid.NewGuid(),
                        CalculatedDate = DateTime.UtcNow,
                        ClassId = userClass.ClassId,
                        UserId = userClass.UserId,
                        Valuation = portfolioValue 
                    });
                }
            }
        }

        _dbContext.Portfolio.AddRange(newPortfolios);
        await _dbContext.SaveChangesAsync();

        Console.WriteLine("WebJob task executed at " + DateTime.UtcNow);

        _dbContext.Dispose();
        InitializeDbContext();
    }

    private static void InitializeServices()
    {
        _configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .Build();

        InitializeDbContext();

        var mapperConfiguration = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(AppDomain.CurrentDomain.GetAssemblies());
        });
        _mapper = mapperConfiguration.CreateMapper();
    }

    private static void InitializeDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_configuration.GetConnectionString("DefaultConnection"))
            .Options;

        _dbContext = new AppDbContext(options);
    }
}

