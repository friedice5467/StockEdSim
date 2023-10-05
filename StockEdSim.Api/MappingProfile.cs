using AutoMapper;
using StockEdSim.Api.Model.Dto;
using StockEdSim.Api.Model;

namespace StockEdSim.Api
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Class, ClassDTO>()
                .ForMember(dest => dest.ClassBalances, opt => opt.MapFrom(src => src.ClassBalances))
                .ForMember(dest => dest.Stocks, opt => opt.MapFrom(src => src.Stocks))
                .ForMember(dest => dest.Transactions, opt => opt.MapFrom(src => src.Transactions));

            CreateMap<ClassBalance, ClassBalanceDTO>();

            CreateMap<Transaction, TransactionDTO>();

            CreateMap<Stock, StockDTO>();

            CreateMap<Portfolio, PortfolioDTO>();

            CreateMap<ApplicationUser, StudentDTO>()
                .ForMember(dest => dest.ProfileImg, opt => opt.MapFrom(src => src.ProfileImage.ImageUrl));
        }
    }
}