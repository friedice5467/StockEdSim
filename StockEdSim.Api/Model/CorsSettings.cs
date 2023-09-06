namespace StockEdSim.Api.Model
{
    public class CorsSettings
    {
        public string[] Origins { get; set; }
        public string[] Methods { get; set; }
        public string[] Headers { get; set; }
    }
}
