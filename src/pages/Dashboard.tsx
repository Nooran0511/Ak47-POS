import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  Package,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { 
  getDashboardStats, 
  getBestSellingProducts, 
  getSalesChartData,
  getProducts,
  refreshData 
} from '@/store/dataStore';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refresh data on mount and listen for updates
  useEffect(() => {
    refreshData();
    
    const handleDataUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('dataStoreUpdate', handleDataUpdate);
    
    // Also refresh periodically (every 30 seconds)
    const interval = setInterval(() => {
      refreshData();
      setRefreshKey(prev => prev + 1);
    }, 30000);
    
    return () => {
      window.removeEventListener('dataStoreUpdate', handleDataUpdate);
      clearInterval(interval);
    };
  }, []);

  const stats = getDashboardStats();
  const bestSelling = getBestSellingProducts();
  const salesChartData = getSalesChartData();
  const products = getProducts();
  const lowStockProducts = products.filter(p => p.stockQuantity < 10 && p.status === 'active');

  const statCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats.todaySales),
      icon: <DollarSign className="text-green-500\" size={24} />,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: <ShoppingCart className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      title: "Today's Expenses",
      value: formatCurrency(stats.todayExpenses),
      icon: <TrendingDown className="text-red-500" size={24} />,
      bgColor: 'bg-red-50',
      iconBg: 'bg-red-100',
    },
    {
      title: "Net Profit",
      value: formatCurrency(stats.todayProfit),
      icon: <TrendingUp className={stats.todayProfit >= 0 ? 'text-yellow-500' : 'text-red-500'} size={24} />,
      bgColor: stats.todayProfit >= 0 ? 'bg-yellow-50' : 'bg-red-50',
      iconBg: stats.todayProfit >= 0 ? 'bg-yellow-100' : 'bg-red-100',
    },
  ];

  const barChartData = {
    labels: salesChartData.labels,
    datasets: [
      {
        label: 'Daily Sales',
        data: salesChartData.data,
        backgroundColor: '#FACC15',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Sales: Rs. ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return 'Rs. ' + (value / 1000).toFixed(0) + 'K';
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutData = {
    labels: bestSelling.map(p => p.name),
    datasets: [
      {
        data: bestSelling.map(p => p.quantity),
        backgroundColor: [
          '#FACC15',
          '#22C55E',
          '#3B82F6',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
    },
  };

  return (
    <div key={refreshKey}>
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's your business overview."
        action={
          <button
            onClick={() => {
              refreshData();
              setRefreshKey(prev => prev + 1);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />
      
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={cn(
                "rounded-xl p-6 transition-all hover:shadow-md",
                card.bgColor
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", card.iconBg)}>
                  {card.icon}
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Last 7 Days Sales</h3>
            <div className="h-72">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Best Selling Products */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Best Selling Products</h3>
            {bestSelling.length > 0 ? (
              <div className="h-72">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No sales data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="text-red-500" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-red-800">Low Stock Warning</h3>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {lowStockProducts.length} items
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center gap-3 bg-white p-3 rounded-lg"
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Package className="text-red-500" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-red-600">Only {product.stockQuantity} left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Total Products</h4>
            <p className="text-3xl font-bold text-gray-900">{products.length}</p>
            <p className="text-sm text-green-600 mt-1">
              {products.filter(p => p.status === 'active').length} active
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Order Value</h4>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.todayOrders > 0 ? stats.todaySales / stats.todayOrders : 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Based on today</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Profit Margin</h4>
            <p className={cn(
              "text-3xl font-bold",
              stats.todayProfit >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {stats.todaySales > 0 
                ? ((stats.todayProfit / stats.todaySales) * 100).toFixed(1) 
                : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Today's margin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
