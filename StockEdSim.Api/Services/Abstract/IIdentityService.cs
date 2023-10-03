using StockEdSim.Api.Model;

namespace StockEdSim.Api.Services.Abstract
{
    public interface IIdentityService
    {
        Task<ServiceResult<string>> LoginAsync(LoginModel model);
        Task<ServiceResult<string>> RegisterAsync(RegisterModel model);
        Task<ServiceResult<string>> UpdateNameAsync(string name, Guid userId);
        Task<ServiceResult<string>> UpdateProfileImg(IFormFile imageFile, Guid userId);
    }
}