using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using StockEdSim.Api.Db;
using StockEdSim.Api.Model;
using StockEdSim.Api.Model.Dto;
using StockEdSim.Api.Services.Abstract;
using System.Net;

namespace StockEdSim.Api.Services
{
    public class MarketService : IMarketService
    {
        private readonly string _finnhubKey = string.Empty;
        private static readonly HttpClient client = new();
        private readonly AppDbContext _dbcontext;
        private readonly IMapper _mapper;

        public MarketService(IConfiguration configuration, AppDbContext dbContext, IMapper mapper)
        {
            _finnhubKey = configuration["Finnhub:Key"];
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

            var existingStock = await _dbcontext.Stocks.FirstOrDefaultAsync(stock => stock.StudentId ==stockPurchase.StudentId && 
                                                        stock.StockSymbol == stockPurchase.StockSymbol && stock.ClassId == stockPurchase.ClassId);
            if (existingStock != null)
            {
                existingStock.Amount += stockPurchase.Amount;
                _dbcontext.Stocks.Update(existingStock);
            }
            else
            {
                var newStock = new Stock()
                {
                    Id = Guid.NewGuid(),
                    Amount = stockPurchase.Amount,
                    StockSymbol = stockPurchase.StockSymbol,
                    StudentId = stockPurchase.StudentId,
                    ClassId = stockPurchase.ClassId
                };
                _dbcontext.Stocks.Add(newStock);
            }

            await _dbcontext.SaveChangesAsync();

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                StudentId = stockPurchase.StudentId,
                StockSymbol = stockPurchase.StockSymbol,
                Amount = stockPurchase.Amount,
                PriceAtTransaction = currentStockPrice.Data ?? 0,
                TransactionDate = DateTime.UtcNow,
                ClassId = stockPurchase.ClassId
            };

            if (!await LogTransaction(transaction))
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error logging the buy transaction.", statusCode: HttpStatusCode.InternalServerError);
            }

            return await GetClassesData(student.Id);
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

            var existingStock = await _dbcontext.Stocks.FirstOrDefaultAsync(stock => stock.StudentId == stockSale.StudentId && stock.StockSymbol == stockSale.StockSymbol);
            if (existingStock == null || existingStock.Amount < stockSale.Amount)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Not enough stock to sell.", statusCode: HttpStatusCode.BadRequest);
            }

            var currentStockPrice = await GetStockQuoteAsync(stockSale.StockSymbol);
            if (!currentStockPrice.Data.HasValue)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error fetching stock price.", statusCode: HttpStatusCode.ServiceUnavailable);
            }

            balance.Balance += currentStockPrice.Data.Value * stockSale.Amount;

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
                Amount = -stockSale.Amount,  
                PriceAtTransaction = currentStockPrice.Data ?? 0,
                TransactionDate = DateTime.UtcNow,
                ClassId = stockSale.ClassId
            };

            if (!await LogTransaction(transaction))
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error logging the sell transaction.", statusCode: HttpStatusCode.InternalServerError);
            }

            return await GetClassesData(student.Id);
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


        public async Task<ServiceResult<Dictionary<Guid, List<StudentData>>>> GetStudentsAcrossMyClasses(Guid teacherId)
        {
            var classes = await _dbcontext.Classes.Where(c => c.TeacherId == teacherId).ToListAsync();

            if (!classes.Any())
            {
                return ServiceResult<Dictionary<Guid, List<StudentData>>>.Failure("No classes found for this teacher.", statusCode: HttpStatusCode.NotFound);
            }

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

            return ServiceResult<Dictionary<Guid, List<StudentData>>>.Success(data: result);
        }

        public async Task<ServiceResult<DashboardData>> GetDashboardData(Guid userId)
        {
            var user = await _dbcontext.Users
                .Include(u => u.Stocks)
                .Include(u => u.Transactions)
                .Include(u => u.UserClasses).ThenInclude(uc => uc.Class)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return ServiceResult<DashboardData>.Failure("User not found.", statusCode: HttpStatusCode.NotFound);
            }

            var data = new DashboardData
            {
                Stocks = _mapper.Map<List<StockDTO>>(user.Stocks),
                Transactions = _mapper.Map<List<TransactionDTO>>(user.Transactions),
                Classes = _mapper.Map<List<ClassDTO>>(user.UserClasses.Select(x => x.Class))
            };

            return ServiceResult<DashboardData>.Success(data: data);
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

            var userClasses = _dbcontext.Users
                .Include(u => u.UserClasses)
                    .ThenInclude(uc => uc.Class)
                        .ThenInclude(c => c.ClassBalances)
                .Where(u => u.Id == userId)
                .SelectMany(u => u.UserClasses.Select(uc => uc.Class))
                .ToList();

            var userClassDTO = _mapper.Map<List<ClassDTO>>(userClasses);

            if (userClassDTO == null)
            {
                return ServiceResult<List<ClassDTO>>.Failure("Error retrieving joined class details.", statusCode: HttpStatusCode.InternalServerError);
            }

            return ServiceResult<List<ClassDTO>>.Success(data: userClassDTO);
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
    }
}
