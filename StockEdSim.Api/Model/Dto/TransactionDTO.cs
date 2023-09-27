using System.Text.Json.Serialization;

namespace StockEdSim.Api.Model.Dto
{
    public class TransactionDTO
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        [JsonPropertyName("stockSymbol")]
        public string StockSymbol { get; set; }
        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }
        [JsonPropertyName("priceAtTransaction")]
        public decimal PriceAtTransaction { get; set; }
        [JsonPropertyName("transactionDate")]
        public DateTime TransactionDate { get; set; }
        [JsonPropertyName("type")]
        public TransactionType Type { get; set; }
        [JsonPropertyName("currentBalanceAfterTransaction")]
        public decimal CurrentBalanceAfterTransaction { get; set; }
        [JsonPropertyName("netProfit")]
        public decimal? NetProfit { get; set; }
        [JsonPropertyName("studentId")]
        public Guid StudentId { get; set; }
        [JsonPropertyName("classId")]
        public Guid ClassId { get; set; }
    }
}
