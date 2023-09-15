using StockEdSim.Api.Model.Dto;

namespace StockEdSim.Api.Model
{
    public class DashboardData
    {
        public List<StockDTO> Stocks { get; set; }
        public List<TransactionDTO> Transactions { get; set; }
        public List<ClassDTO> Classes { get; set; }
    }
}
