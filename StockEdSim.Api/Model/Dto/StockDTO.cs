using System.Text.Json.Serialization;

namespace StockEdSim.Api.Model.Dto
{
    public class StockDTO
    {
        [JsonPropertyName("stockSymbol")]
        public string StockSymbol { get; set; }
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }
        [JsonPropertyName("purchasePrice")]
        public decimal PurchasePrice { get; set; }
        [JsonPropertyName("purchaseDate")]
        public DateTime PurchaseDate { get; set; }
        [JsonPropertyName("studentId")]
        public Guid StudentId { get; set; }
        [JsonPropertyName("classId")]
        public Guid ClassId { get; set; }

    }
}
