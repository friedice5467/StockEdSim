using Newtonsoft.Json;

namespace StockEdSim.Api.Model
{
    public class FmpStockModel
    {
        [JsonProperty("symbol")]
        public string Symbol { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("price")]
        public double Price { get; set; }

        [JsonProperty("changesPercentage")]
        public double ChangesPercentage { get; set; }

        [JsonProperty("change")]
        public double Change { get; set; }

        [JsonProperty("dayLow")]
        public double DayLow { get; set; }

        [JsonProperty("dayHigh")]
        public double DayHigh { get; set; }

        [JsonProperty("yearHigh")]
        public double YearHigh { get; set; }

        [JsonProperty("yearLow")]
        public double YearLow { get; set; }

        [JsonProperty("marketCap")]
        public double MarketCap { get; set; }

        [JsonProperty("priceAvg50")]
        public double PriceAvg50 { get; set; }

        [JsonProperty("priceAvg200")]
        public double PriceAvg200 { get; set; }

        [JsonProperty("volume")]
        public int Volume { get; set; }

        [JsonProperty("avgVolume")]
        public int AvgVolume { get; set; }

        [JsonProperty("exchange")]
        public string Exchange { get; set; }

        [JsonProperty("open")]
        public double Open { get; set; }

        [JsonProperty("previousClose")]
        public double PreviousClose { get; set; }

        [JsonProperty("eps")]
        public double Eps { get; set; }

        [JsonProperty("pe")]
        public double Pe { get; set; }

        [JsonProperty("earningsAnnouncement")]
        public DateTime EarningsAnnouncement { get; set; }

        [JsonProperty("sharesOutstanding")]
        public long SharesOutstanding { get; set; }

        [JsonProperty("timestamp")]
        public int Timestamp { get; set; }
    }


}
