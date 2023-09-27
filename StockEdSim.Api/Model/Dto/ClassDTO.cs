using System.Text.Json.Serialization;

namespace StockEdSim.Api.Model.Dto
{
    public class ClassDTO
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        [JsonPropertyName("className")]
        public string ClassName { get; set; }
        [JsonPropertyName("teacherId")]
        public Guid TeacherId { get; set; }
        [JsonPropertyName("defaultBalance")]
        public decimal DefaultBalance { get; set; } = 20000.00M;
        [JsonPropertyName("classBalances")]
        public IEnumerable<ClassBalanceDTO> ClassBalances { get; set; }
        [JsonPropertyName("stocks")]
        public IEnumerable<StockDTO> Stocks { get; set; }
        [JsonPropertyName("transactions")]
        public IEnumerable<TransactionDTO> Transactions { get; set; }
    }
}
