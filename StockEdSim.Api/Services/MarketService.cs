using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using StockEdSim.Api.Db;
using StockEdSim.Api.Model;
using StockEdSim.Api.Model.Dto;
using StockEdSim.Api.Services.Abstract;
using System.Net;

namespace StockEdSim.Api.Services
{
    public class MarketService : IMarketService, IDisposable
    {
        private readonly string _finnhubKey = string.Empty;
        private readonly string _fmpKey = string.Empty;
        private static readonly HttpClient client = new();
        private readonly AppDbContext _dbcontext;
        private readonly IMapper _mapper;

        public MarketService(IConfiguration configuration, AppDbContext dbContext, IMapper mapper)
        {
            _finnhubKey = configuration["Finnhub:Key"];
            _fmpKey = configuration["Fmp:Key"];
            _dbcontext = dbContext;
            _mapper = mapper;
        }

        #region Third Party Finhubb
        public async Task<ServiceResult<string>> GetAllStockSymbolsAsync()
        {
            var url = $"https://finnhub.io/api/v1/stock/symbol?exchange=US&token={_finnhubKey}";
            HttpResponseMessage response = await client.GetAsync(url);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return ServiceResult<string>.Success(data: await response.Content.ReadAsStringAsync());
            }

            return ServiceResult<string>.Failure($"Failed to fetch stock symbols. Error: {response.StatusCode}");
        }

        public async Task<ServiceResult<string>> GetStockCandlesAsync(string symbol)
        {
            var oneYearAgo = DateTimeOffset.UtcNow.AddYears(-1).ToUnixTimeSeconds();
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var url = $"https://finnhub.io/api/v1/stock/candle?symbol={symbol}&resolution=D&from={oneYearAgo}&to={now}&token={_finnhubKey}";
            HttpResponseMessage response = await client.GetAsync(url);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return ServiceResult<string>.Success(data: await response.Content.ReadAsStringAsync());
            }

            return ServiceResult<string>.Failure($"Failed to fetch candle data. Error: {response.StatusCode}");
        }

        public async Task<ServiceResult<List<FmpStockModel>>> GetBulkStockQuotesAsync(string symbols)
        {
            var url = $"https://financialmodelingprep.com/api/v3/quote/{symbols}?apikey={_fmpKey}";
            HttpResponseMessage response = await client.GetAsync(url);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return ServiceResult<List<FmpStockModel>>.Success(data: JsonConvert.DeserializeObject<List<FmpStockModel>>(await response.Content.ReadAsStringAsync()));
            }

            return ServiceResult<List<FmpStockModel>>.Failure($"Failed to fetch stock data. Error: {response.StatusCode}");
        }

        public async Task<ServiceResult<decimal?>> GetStockQuoteAsync(string symbol)
        {
            var url = $"https://finnhub.io/api/v1/quote?symbol={symbol}&token={_finnhubKey}";
            HttpResponseMessage response = await client.GetAsync(url);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(content);
                return ServiceResult<decimal?>.Success(data: data["c"].ToObject<decimal?>());
            }

            return ServiceResult<decimal?>.Failure($"Failed to fetch stock quote. Error: {response.StatusCode}");
        }
        #endregion

        public async Task<ApplicationUser?> GetStudent(Guid studentId)
        {
            return await _dbcontext.Users.FindAsync(studentId);
        }

        public async Task<ServiceResult<List<ClassDTO>>> BuyStock(StockDTO stockPurchase, Guid classId)
        {
            var student = await _dbcontext.Users.Include(x => x.ClassBalances).FirstOrDefaultAsync(u => u.Id == stockPurchase.StudentId);
            if (student == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Student not found.", statusCode: HttpStatusCode.NotFound);
            }

            var balance = student.ClassBalances.FirstOrDefault(x => x.ClassId == classId);
            if (balance == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Student does not have a balance for this class", statusCode: HttpStatusCode.BadRequest);
            }

            var currentStockPrice = await GetStockQuoteAsync(stockPurchase.StockSymbol);
            if (!currentStockPrice.Data.HasValue)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error fetching stock price.", statusCode: HttpStatusCode.ServiceUnavailable);
            }

            if (balance.Balance < currentStockPrice.Data.Value * stockPurchase.Amount)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Insufficient funds.", statusCode: HttpStatusCode.BadRequest);
            }

            balance.Balance -= currentStockPrice.Data.Value * stockPurchase.Amount;

            var newStock = new Stock()
            {
                Id = Guid.NewGuid(),
                Amount = stockPurchase.Amount,
                StockSymbol = stockPurchase.StockSymbol,
                StudentId = stockPurchase.StudentId,
                ClassId = stockPurchase.ClassId,
                PurchasePrice = currentStockPrice.Data.Value, 
                PurchaseDate = DateTime.UtcNow 
            };
            _dbcontext.Stocks.Add(newStock);

            await _dbcontext.SaveChangesAsync();

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                StudentId = stockPurchase.StudentId,
                StockSymbol = stockPurchase.StockSymbol,
                Amount = stockPurchase.Amount,
                PriceAtTransaction = currentStockPrice.Data ?? 0,
                TransactionDate = DateTime.UtcNow,
                ClassId = stockPurchase.ClassId,
                Type = TransactionType.Buy,
                CurrentBalanceAfterTransaction = balance.Balance
            };

            if (!await LogTransaction(transaction))
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error logging the buy transaction.", statusCode: HttpStatusCode.InternalServerError);
            }

            return await GetDashboardData(student.Id);
        }

        public async Task<ServiceResult<List<ClassDTO>>> SellStock(StockDTO stockSale, Guid classId)
        {
            var student = await _dbcontext.Users.Include(x => x.ClassBalances).FirstOrDefaultAsync(u => u.Id == stockSale.StudentId);
            if (student == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Student not found.", statusCode: HttpStatusCode.NotFound);
            }

            var balance = student.ClassBalances.FirstOrDefault(x => x.ClassId == classId);
            if (balance == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Student does not have a balance for this class", statusCode: HttpStatusCode.BadRequest);
            }

            var stocksToSell = await _dbcontext.Stocks
                .Where(stock => stock.StudentId == stockSale.StudentId && stock.StockSymbol == stockSale.StockSymbol)
                .OrderBy(stock => stock.PurchaseDate)
                .ToListAsync();

            if (stocksToSell.Sum(s => s.Amount) < stockSale.Amount)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Not enough stock to sell.", statusCode: HttpStatusCode.BadRequest);
            }

            var currentStockPrice = await GetStockQuoteAsync(stockSale.StockSymbol);
            if (!currentStockPrice.Data.HasValue)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error fetching stock price.", statusCode: HttpStatusCode.ServiceUnavailable);
            }

            balance.Balance += currentStockPrice.Data.Value * stockSale.Amount;

            decimal totalProfit = 0;
            decimal amountToSell = stockSale.Amount;
            decimal totalSold = 0; 

            foreach (var stock in stocksToSell)
            {
                if (amountToSell <= 0) break;

                var sellingFromThisStock = Math.Min(stock.Amount, amountToSell);

                totalProfit += (currentStockPrice.Data.Value - stock.PurchasePrice) * sellingFromThisStock;
                totalSold += sellingFromThisStock; 

                stock.Amount -= sellingFromThisStock;
                if (stock.Amount == 0)
                {
                    _dbcontext.Stocks.Remove(stock);
                }
                else
                {
                    _dbcontext.Stocks.Update(stock);
                }

                amountToSell -= sellingFromThisStock;
            }

            decimal netAverageProfitPerStock = 0;
            if (totalSold > 0)
            {
                netAverageProfitPerStock = totalProfit / totalSold;
            }

            await _dbcontext.SaveChangesAsync();

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                StudentId = stockSale.StudentId,
                StockSymbol = stockSale.StockSymbol,
                Amount = stockSale.Amount,
                PriceAtTransaction = currentStockPrice.Data ?? 0,
                TransactionDate = DateTime.UtcNow,
                ClassId = stockSale.ClassId,
                Type = TransactionType.Sell,
                CurrentBalanceAfterTransaction = balance.Balance,
                NetProfit = netAverageProfitPerStock
            };

            if (!await LogTransaction(transaction))
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error logging the sell transaction.", statusCode: HttpStatusCode.InternalServerError);
            }

            return await GetDashboardData(student.Id);
        }

        public async Task<ServiceResult<Class>> CreateClassroomAsync(ClassDTO createClass, Guid teacherId)
        {
            var newClass = new Class()
            {
                Id = Guid.NewGuid(),
                ClassName = createClass.ClassName,
                TeacherId = teacherId,
                DefaultBalance = createClass.DefaultBalance
            };

            try
            {
                await _dbcontext.Classes.AddAsync(newClass);
                await _dbcontext.SaveChangesAsync();
                return ServiceResult<Class>.Success(data: newClass);
            }
            catch (Exception ex)
            {
                return ServiceResult<Class>.Failure($"Failed to create class. Error: {ex.Message}", statusCode: HttpStatusCode.InternalServerError);
            }
        }


        public async Task<ServiceResult<Dictionary<Guid, List<StudentDTO>>>> GetStudentsAcrossMyClasses(Guid teacherId)
        {
            var classes = await _dbcontext.Classes.Where(c => c.TeacherId == teacherId).ToListAsync();

            if (!classes.Any())
            {
                return ServiceResult<Dictionary<Guid, List<StudentDTO>>>.Failure("No classes found for this teacher.", statusCode: HttpStatusCode.NotFound);
            }

            var result = new Dictionary<Guid, List<StudentDTO>>();

            foreach (var classItem in classes)
            {
                var studentData = await _dbcontext.UserClasses
                                .Where(uc => uc.ClassId == classItem.Id)
                                .Select(uc => new StudentDTO
                                {
                                    Id = uc.UserId,
                                    FullName = uc.User.FullName ?? string.Empty,
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

            return ServiceResult<Dictionary<Guid, List<StudentDTO>>>.Success(data: result);
        }

        public async Task<ServiceResult<List<ClassDTO>>> GetDashboardData(Guid userId)
        {
            var user = await _dbcontext.Users
                .Include(u => u.Stocks)
                .Include(u => u.Transactions)
                .Include(u => u.UserClasses).ThenInclude(uc => uc.Class).ThenInclude(c => c.ClassBalances)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("User not found.", statusCode: HttpStatusCode.NotFound);
            }

            var data = _mapper.Map<List<ClassDTO>>(user.UserClasses.Select(x => x.Class));

            return ServiceResult<List<ClassDTO>>.Success(data: data);
        }

        public async Task<ServiceResult<List<ClassDTO>>> GetClassesData(Guid userId)
        {
            var classes = await _dbcontext.UserClasses
                .Where(uc => uc.UserId == userId)
                .Include(uc => uc.Class)
                    .ThenInclude(c => c.ClassBalances)
                .Select(uc => uc.Class)
                .ToListAsync();

            var classesDTO = _mapper.Map<List<ClassDTO>>(classes);

            if (!classesDTO.Any())
            {
                return ServiceResult<List<ClassDTO>>.Failure("No classes found for this user.", statusCode: HttpStatusCode.NotFound);
            }

            return ServiceResult<List<ClassDTO>>.Success(data: classesDTO);
        }

        public async Task<ServiceResult<List<ClassDTO>>> JoinClassById(Guid userId, Guid classId)
        {
            if (_dbcontext.UserClasses.Any(x => x.UserId == userId && x.ClassId == classId))
            {
                return ServiceResult<List<ClassDTO>>.Failure("User already joined the class", statusCode: HttpStatusCode.Conflict);
            }

            var targetClass = await _dbcontext.Classes.FindAsync(classId);
            if (targetClass == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Class not found", statusCode: HttpStatusCode.NotFound);
            }

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
                    return ServiceResult<List<ClassDTO>>.Failure($"An error occurred while joining the class, {ex.Message}");
                }
            }

            return await GetDashboardData(userId);
        }

        public async Task<ServiceResult<List<PortfolioDTO>>> GetPortfolioByIds(Guid userId, Guid classId)
        {
            var portfolioData = await _dbcontext.Portfolio.Where(x => x.UserId == userId && x.ClassId == classId).ToListAsync();
            if (portfolioData == null || !portfolioData.Any())
            {
                return ServiceResult<List<PortfolioDTO>>.Failure("Class not found", statusCode: HttpStatusCode.NotFound);
            }

            var data = _mapper.Map<List<PortfolioDTO>>(portfolioData);

            return ServiceResult<List<PortfolioDTO>>.Success(data: data);
        }

        public async Task<ServiceResult<List<StudentDTO>>> GetLeaderboardDataByClassId(Guid classId)
        {
            var currentClass = await _dbcontext.Classes.FindAsync(classId);
            if (currentClass == null)
            {
                return ServiceResult<List<StudentDTO>>.Failure("Class not found.", statusCode: HttpStatusCode.NotFound);
            }

            var targetRoleId = Guid.Parse("b3316c11-f46b-4e22-9a4d-091871b4f2df");

            var students = await _dbcontext.UserClasses
                .Where(uc => uc.ClassId == classId)
                .Include(uc => uc.User)
                    .ThenInclude(u => u.ProfileImage)
                .Include(uc => uc.User)
                    .ThenInclude(u => u.Portfolios.OrderByDescending(p => p.CalculatedDate))
                .Join(_dbcontext.UserRoles,
                      uc => uc.UserId,
                      ur => ur.UserId,
                      (uc, ur) => new { uc, ur })
                .Where(joined => joined.ur.RoleId == targetRoleId)
                .Select(u => u.uc)
                .Select(uc => uc.User)
                .ToListAsync();

            if (students == null || !students.Any())
            {
                return ServiceResult<List<StudentDTO>>.Failure("Students not found for class", statusCode: HttpStatusCode.NotFound);
            }

            var data = _mapper.Map<List<StudentDTO>>(students);

            foreach( var student in data)
            {
                student.Profit = (student.Portfolios.FirstOrDefault()?.Valuation ?? currentClass.DefaultBalance) - currentClass.DefaultBalance;
            }

            data = data.OrderByDescending(x => x.Profit).ToList();

            for (int i  = 0; i < data.Count; i++)
            {
                data[i].Rank = i + 1;
            }

            return ServiceResult<List<StudentDTO>>.Success(data: data);
        }

        private async Task<bool> LogTransaction(Transaction transaction)
        {
            try
            {
                _dbcontext.Transactions.Add(transaction);
                await _dbcontext.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public void Dispose()
        {
            _dbcontext.Dispose();
        }
    }
}
