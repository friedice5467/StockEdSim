using StockEdSim.Api.Model;
using StockEdSim.Api.Model.Dto;

namespace StockEdSim.Api.Services.Abstract
{
    public interface IMarketService
    {
        Task<ServiceResult<string>> BuyStock(Stock stockPurchase, Guid classId);
        Task<ServiceResult<string>> GetAllStockSymbolsAsync();
        Task<ServiceResult<List<ClassDTO>>> GetClassesData(Guid userId);
        Task<ServiceResult<DashboardData>> GetDashboardData(Guid userId);
        Task<ServiceResult<string>> GetStockCandlesAsync(string symbol);
        Task<ServiceResult<decimal?>> GetStockQuoteAsync(string symbol);
        Task<ApplicationUser?> GetStudent(Guid studentId);
        Task<ServiceResult<Class>> CreateClassroomAsync(ClassDTO createClass, Guid teacherId);
        Task<ServiceResult<Dictionary<Guid, List<StudentData>>>> GetStudentsAcrossMyClasses(Guid teacherId);
        Task<ServiceResult<ClassDTO>> JoinClassById(Guid userId, Guid classId);
        Task<ServiceResult<string>> SellStock(Stock stockSale, Guid classId);
    }
}