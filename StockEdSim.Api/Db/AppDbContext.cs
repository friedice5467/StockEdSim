using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StockEdSim.Api.Model;

namespace StockEdSim.Api.Db
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        { }

        public DbSet<Class> Classes { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<UserClass> UserClasses { get; set; }
        public DbSet<Portfolio> Portfolio { get; set; }
        public DbSet<ClassBalance> ClassBalances { get; set; }
        public DbSet<ApiKey> ApiKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Class>()
                .HasOne(c => c.Teacher)
                .WithMany(t => t.TaughtClasses)
                .HasForeignKey(c => c.TeacherId);

            modelBuilder.Entity<Stock>()
                .HasOne(s => s.Class)
                .WithMany(c => c.Stocks)
                .HasForeignKey(c => c.ClassId);

            modelBuilder.Entity<Portfolio>()
                .HasOne(p => p.User)
                .WithMany(u => u.Portfolios)
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<Portfolio>()
                .HasOne(p => p.Class)
                .WithMany(c => c.Portfolios)
                .HasForeignKey(p => p.ClassId);

            modelBuilder.Entity<Transaction>()
                .HasOne(s => s.Class)
                .WithMany(c => c.Transactions)
                .HasForeignKey(c => c.ClassId);

            modelBuilder.Entity<UserClass>()
                .HasKey(uc => new { uc.UserId, uc.ClassId });

            modelBuilder.Entity<UserClass>()
                .HasOne(uc => uc.User)
                .WithMany(u => u.UserClasses) 
                .HasForeignKey(uc => uc.UserId);

            modelBuilder.Entity<UserClass>()
                .HasOne(uc => uc.Class)
                .WithMany(c => c.UserClasses) 
                .HasForeignKey(uc => uc.ClassId);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(u => u.Transactions)
                .WithOne(t => t.Student)
                .HasForeignKey(t => t.StudentId);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(u => u.Stocks)
                .WithOne(s => s.Student)
                .HasForeignKey(s => s.StudentId);

            modelBuilder.Entity<ClassBalance>()
                .HasOne(cb => cb.User)
                .WithMany(u => u.ClassBalances)
                .HasForeignKey(cb => cb.UserId);

            modelBuilder.Entity<ClassBalance>()
            .HasOne(cb => cb.Class)
            .WithMany(c => c.ClassBalances)
            .HasForeignKey(cb => cb.ClassId);
        }
    }

}
