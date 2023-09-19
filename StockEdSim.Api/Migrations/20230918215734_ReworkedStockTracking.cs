using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StockEdSim.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReworkedStockTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CurrentBalanceAfterTransaction",
                table: "Transactions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "NetProfit",
                table: "Transactions",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "Type",
                table: "Transactions",
                type: "smallint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PurchaseDate",
                table: "Stocks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "PurchasePrice",
                table: "Stocks",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentBalanceAfterTransaction",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "NetProfit",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "PurchaseDate",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "PurchasePrice",
                table: "Stocks");
        }
    }
}
