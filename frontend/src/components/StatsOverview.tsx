"use client";

export function StatsOverview() {
  // These will be populated with real data from contracts
  const stats = [
    {
      label: "Total Value Locked",
      value: "$2,450,000",
      change: "+12.5%",
      icon: "💰",
      trend: "up",
    },
    {
      label: "Your Deposits",
      value: "$12,500",
      change: "+8.2%",
      icon: "📈",
      trend: "up",
    },
    {
      label: "Active Loans",
      value: "3",
      change: "+1",
      icon: "🏦",
      trend: "up",
    },
    {
      label: "Trust Score",
      value: "850",
      change: "Excellent",
      icon: "⭐",
      trend: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="card-premium group hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">{stat.icon}</div>
            <div
              className={`badge ${
                stat.trend === "up" ? "badge-success" : "badge-warning"
              }`}
            >
              {stat.change}
            </div>
          </div>

          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {stat.label}
          </h3>

          <p className="text-3xl font-bold gradient-text mb-2 group-hover:animate-pulse">
            {stat.value}
          </p>

          <div className="flex items-center space-x-2">
            <div className="w-full bg-dark-800 rounded-full h-2">
              <div
                className="bg-cyan-gradient h-2 rounded-full transition-all duration-1000"
                style={{ width: `${85 - index * 15}%` }}
              ></div>
            </div>
          </div>

          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  );
}
