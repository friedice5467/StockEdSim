using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StockEdSim.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddedClassIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ClassId",
                table: "Transactions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClassId",
                table: "Stocks",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_ClassId",
                table: "Transactions",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_ClassId",
                table: "Stocks",
                column: "ClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_Classes_ClassId",
                table: "Stocks",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Classes_ClassId",
                table: "Transactions",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_Classes_ClassId",
                table: "Stocks");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Classes_ClassId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_ClassId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Stocks_ClassId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "Stocks");
        }
    }
}
