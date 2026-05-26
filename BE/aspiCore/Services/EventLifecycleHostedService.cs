using Microsoft.Extensions.DependencyInjection;

namespace aspiCore.Services
{
    public class EventLifecycleHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EventLifecycleHostedService> _logger;

        public EventLifecycleHostedService(IServiceScopeFactory scopeFactory, ILogger<EventLifecycleHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<IDangKyService>();
                    var processed = await service.ProcessLifecycleAsync();
                    if (processed > 0)
                    {
                        _logger.LogInformation("Lifecycle job processed {Count} ended events.", processed);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lifecycle job failed");
                }

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }
}
