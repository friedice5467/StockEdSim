﻿namespace StockEdSim.Api.Model
{
    public class Stock
    {
        public Guid Id { get; set; }
        public string StockSymbol { get; set; }
        public double Amount { get; set; }  
        public Guid StudentId { get; set; } 
        public virtual ApplicationUser Student { get; set; }
    }

}