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
                .ForMember(dest => dest.ClassBalances, opt => opt.MapFrom(src => src.ClassBalances));

            CreateMap<ClassBalance, ClassBalanceDTO>();
        }
    }
}