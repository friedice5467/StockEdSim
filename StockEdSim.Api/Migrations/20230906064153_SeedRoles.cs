using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StockEdSim.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("INSERT INTO \"AspNetRoles\" (\"Id\", \"Name\", \"NormalizedName\") VALUES ('4bf32edf-0eb0-4e27-9466-210efcb45a4a', 'Admin', 'ADMIN')");
            migrationBuilder.Sql("INSERT INTO \"AspNetRoles\" (\"Id\", \"Name\", \"NormalizedName\") VALUES ('e460db29-6aa2-4ee3-b6c9-036f06a11f5c', 'Teacher', 'TEACHER')");
            migrationBuilder.Sql("INSERT INTO \"AspNetRoles\" (\"Id\", \"Name\", \"NormalizedName\") VALUES ('b3316c11-f46b-4e22-9a4d-091871b4f2df', 'Student', 'STUDENT')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"AspNetRoles\" WHERE \"Id\" IN ('4bf32edf-0eb0-4e27-9466-210efcb45a4a', 'e460db29-6aa2-4ee3-b6c9-036f06a11f5c', 'b3316c11-f46b-4e22-9a4d-091871b4f2df')");
        }
    }
}
