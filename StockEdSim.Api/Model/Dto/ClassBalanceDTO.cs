using System.Text.Json.Serialization;

namespace StockEdSim.Api.Model.Dto
{
    public class ClassBalanceDTO
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        [JsonPropertyName("classId")]
        public Guid ClassId { get; set; }
        [JsonPropertyName("balance")]
        public decimal Balance { get; set; }
    }
}
