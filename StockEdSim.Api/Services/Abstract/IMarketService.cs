using StockEdSim.Api.Model;
using StockEdSim.Api.Model.Dto;

namespace StockEdSim.Api.Services.Abstract
{
    public interface IMarketService
    {
        
        Task<ServiceResult<string>> GetAllStockSymbolsAsync();
        Task<ServiceResult<List<ClassDTO>>> GetClassesData(Guid userId);
        Task<ServiceResult<List<ClassDTO>>> GetDashboardData(Guid userId);
        Task<ServiceResult<string>> GetStockCandlesAsync(string symbol);
        Task<ServiceResult<List<FmpStockModel>>> GetBulkStockQuotesAsync(string symbols);
        Task<ServiceResult<decimal?>> GetStockQuoteAsync(string symbol);
        Task<ApplicationUser?> GetStudent(Guid studentId);
        Task<ServiceResult<List<ClassDTO>>> BuyStock(StockDTO stockPurchase, Guid classId);
        Task<ServiceResult<List<ClassDTO>>> SellStock(StockDTO stockSale, Guid classId);
        Task<ServiceResult<Class>> CreateClassroomAsync(ClassDTO createClass, Guid teacherId);
        Task<ServiceResult<Dictionary<Guid, List<StudentDTO>>>> GetStudentsAcrossMyClasses(Guid teacherId);
        Task<ServiceResult<List<ClassDTO>>> JoinClassById(Guid userId, Guid classId);
        Task<ServiceResult<List<PortfolioDTO>>> GetPortfolioByIds(Guid userId, Guid classId);
    }
}