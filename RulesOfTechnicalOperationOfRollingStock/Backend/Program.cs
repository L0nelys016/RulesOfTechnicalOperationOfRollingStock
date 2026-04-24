using Backend.Business.Exceptions;
using Protection;
using Protection.Core.Data;

#pragma warning disable CS0219 // Variable is assigned but its value is never used
#pragma warning disable CS8321 // The local function is declared but never used

const int GUARDANT_MISSING_EXIT_CODE = 21;

var builder = WebApplication.CreateBuilder(args);

#if !DEBUG
try
{
    InitializeProtection();
}
catch (GuardantProtectionException ex)
{
    Console.Error.WriteLine($"GUARDANT_ERROR: {ex.Message}");
    Environment.Exit(GUARDANT_MISSING_EXIT_CODE);
    return;
}
#endif

// Диагностика строки подключения при старте
var rawConn = builder.Configuration.GetConnectionString("DefaultConnection");
if (
    !string.IsNullOrEmpty(rawConn)
    && (
        rawConn.Contains("host=", StringComparison.OrdinalIgnoreCase)
        || rawConn.Contains("database=", StringComparison.OrdinalIgnoreCase)
    )
)
{
    var envConn = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
    Console.WriteLine("[Backend] Диагностика: обнаружена строка в формате PostgreSQL.");
    Console.WriteLine(
        "[Backend] Значение (первые 80 символов): {0}",
        rawConn.Length > 80 ? rawConn[..80] + "..." : rawConn
    );
    Console.WriteLine(
        "[Backend] ConnectionStrings__DefaultConnection в env: {0}",
        !string.IsNullOrEmpty(envConn) ? "ЗАДАНА (источник!)" : "не задана"
    );
}

// Настройка URLs для подключения
string? configuredUrls =
    Environment.GetEnvironmentVariable("BACKEND_URL")
    ?? Environment.GetEnvironmentVariable("ASPNETCORE_URLS")
    ?? builder.Configuration["urls"];
if (!string.IsNullOrWhiteSpace(configuredUrls))
{
    builder.WebHost.UseUrls(configuredUrls);
}

var app = builder.Build();

app.Run();

static void InitializeProtection()
{
    ProtectionManager protectionManager = new ProtectionManager();
    ProtectionResponse protectionResult = protectionManager.CheckProtection().Item1;

    if (protectionResult != ProtectionResponse.Ok)
    {
        throw new GuardantProtectionException(
            "Ключ Guardant не найден или защита не пройдена. Необходимо вставить ключ и перезапустить приложение."
        );
    }
}
