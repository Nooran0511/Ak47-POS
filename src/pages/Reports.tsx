import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Calendar,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Printer,
  RefreshCw,
  FileSpreadsheet,
  Filter,
  Users,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { getReportData, refreshData } from '@/store/dataStore';
import { formatCurrency } from '@/utils/currency';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import jsPDF from 'jspdf';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
type ReportType = 'summary' | 'products' | 'invoices' | 'expenses' | 'staff';

export function Reports() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('last7days');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'online_bank'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh data when component mounts
  useEffect(() => {
    refreshData();
    
    // Listen for data updates
    const handleDataUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('dataStoreUpdate', handleDataUpdate);
    return () => window.removeEventListener('dataStoreUpdate', handleDataUpdate);
  }, []);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(format(yesterday, 'yyyy-MM-dd'));
        setEndDate(format(yesterday, 'yyyy-MM-dd'));
        break;
      case 'last7days':
        setStartDate(format(subDays(today, 6), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'last30days':
        setStartDate(format(subDays(today, 29), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'thisMonth':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
    }
  };

  // Get report data with refresh key to force re-render
  const reportData = getReportData(startDate, endDate);

  // Filter invoices by payment method
  const filteredInvoices = paymentFilter === 'all' 
    ? reportData.invoices 
    : reportData.invoices.filter(inv => inv.paymentMethod === paymentFilter);

  // Recalculate summary based on filters
  const filteredSummary = {
    ...reportData.summary,
    totalSales: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
    totalOrders: filteredInvoices.length,
  };

  // Staff performance data
  const staffPerformance: Record<string, { orders: number; revenue: number }> = {};
  filteredInvoices.forEach(inv => {
    if (!staffPerformance[inv.staffName]) {
      staffPerformance[inv.staffName] = { orders: 0, revenue: 0 };
    }
    staffPerformance[inv.staffName].orders += 1;
    staffPerformance[inv.staffName].revenue += inv.total;
  });

  const staffData = Object.entries(staffPerformance).map(([name, data]) => ({
    name,
    ...data
  })).sort((a, b) => b.revenue - a.revenue);

  const chartData = {
    labels: reportData.dailyBreakdown.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'Sales',
        data: reportData.dailyBreakdown.map(d => d.sales),
        backgroundColor: '#FACC15',
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: reportData.dailyBreakdown.map(d => d.expenses),
        backgroundColor: '#EF4444',
        borderRadius: 4,
      },
    ],
  };

  const paymentChartData = {
    labels: ['Cash', 'Online Bank'],
    datasets: [
      {
        data: [reportData.summary.cashSales, reportData.summary.onlineSales],
        backgroundColor: ['#22C55E', '#3B82F6'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: { usePointStyle: true }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: Rs. ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'Rs. ' + (value / 1000).toFixed(0) + 'K';
          }
        }
      }
    },
  };

  // Generate PDF using jsPDF directly (more reliable)
  const handleDownloadPDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;
      
      // Header
      pdf.setFillColor(250, 204, 21); // Yellow
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AK47 Shawarma Stop', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const reportTitle = reportTypes.find(t => t.value === reportType)?.label || 'Report';
      pdf.text(reportTitle, pageWidth / 2, 23, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(`Period: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`, pageWidth / 2, 30, { align: 'center' });
      
      yPos = 45;

      // Summary Cards
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPos, 45, 25, 'F');
      pdf.rect(57, yPos, 45, 25, 'F');
      pdf.rect(104, yPos, 45, 25, 'F');
      pdf.rect(151, yPos, 45, 25, 'F');
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Total Sales', 32.5, yPos + 8, { align: 'center' });
      pdf.text('Total Expenses', 79.5, yPos + 8, { align: 'center' });
      pdf.text('Net Profit', 126.5, yPos + 8, { align: 'center' });
      pdf.text('Total Orders', 173.5, yPos + 8, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rs. ${filteredSummary.totalSales.toLocaleString()}`, 32.5, yPos + 18, { align: 'center' });
      pdf.text(`Rs. ${reportData.summary.totalExpenses.toLocaleString()}`, 79.5, yPos + 18, { align: 'center' });
      pdf.text(`Rs. ${reportData.summary.netProfit.toLocaleString()}`, 126.5, yPos + 18, { align: 'center' });
      pdf.text(`${filteredSummary.totalOrders}`, 173.5, yPos + 18, { align: 'center' });
      
      yPos += 35;

      // Table Header
      const drawTableHeader = (headers: string[], colWidths: number[]) => {
        pdf.setFillColor(50, 50, 50);
        pdf.rect(10, yPos, pageWidth - 20, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        
        let xPos = 12;
        headers.forEach((header, i) => {
          pdf.text(header, xPos, yPos + 7);
          xPos += colWidths[i];
        });
        yPos += 12;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
      };

      // Draw table row
      const drawTableRow = (data: string[], colWidths: number[], isAlt: boolean = false) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        if (isAlt) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(10, yPos - 5, pageWidth - 20, 8, 'F');
        }
        
        pdf.setFontSize(9);
        let xPos = 12;
        data.forEach((cell, i) => {
          const text = cell.length > 30 ? cell.substring(0, 27) + '...' : cell;
          pdf.text(text, xPos, yPos);
          xPos += colWidths[i];
        });
        yPos += 8;
      };

      // Product Sales Table
      if (reportType === 'summary' || reportType === 'products') {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Product Sales Summary', 10, yPos);
        yPos += 8;
        
        const headers = ['#', 'Product Name', 'Qty Sold', 'Avg Price', 'Revenue'];
        const colWidths = [12, 70, 30, 35, 40];
        drawTableHeader(headers, colWidths);
        
        reportData.productSummary.forEach((product, index) => {
          const avgPrice = product.quantity > 0 ? Math.round(product.revenue / product.quantity) : 0;
          drawTableRow([
            (index + 1).toString(),
            product.name,
            product.quantity.toString(),
            `Rs. ${avgPrice.toLocaleString()}`,
            `Rs. ${product.revenue.toLocaleString()}`
          ], colWidths, index % 2 === 1);
        });
        
        yPos += 5;
      }

      // Invoice Details Table
      if (reportType === 'invoices') {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Invoice Details (${filteredInvoices.length} invoices)`, 10, yPos);
        yPos += 8;
        
        const headers = ['Invoice #', 'Date', 'Cashier', 'Items', 'Payment', 'Total'];
        const colWidths = [30, 25, 30, 50, 25, 30];
        drawTableHeader(headers, colWidths);
        
        filteredInvoices.forEach((inv, index) => {
          const itemsList = inv.items.map(item => `${item.productName} x${item.quantity}`).join(', ');
          drawTableRow([
            inv.invoiceNumber,
            format(new Date(inv.createdAt), 'dd/MM/yy'),
            inv.staffName,
            itemsList,
            inv.paymentMethod === 'cash' ? 'Cash' : 'Online',
            `Rs. ${inv.total.toLocaleString()}`
          ], colWidths, index % 2 === 1);
        });
        
        yPos += 5;
      }

      // Expenses Table
      if (reportType === 'expenses') {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Expenses Details (${reportData.expenses.length} entries)`, 10, yPos);
        yPos += 8;
        
        const headers = ['#', 'Date', 'Title', 'Notes', 'Amount'];
        const colWidths = [12, 30, 50, 55, 40];
        drawTableHeader(headers, colWidths);
        
        reportData.expenses.forEach((exp, index) => {
          drawTableRow([
            (index + 1).toString(),
            format(new Date(exp.date), 'dd/MM/yyyy'),
            exp.title,
            exp.notes || '-',
            `Rs. ${exp.amount.toLocaleString()}`
          ], colWidths, index % 2 === 1);
        });
        
        yPos += 5;
      }

      // Staff Performance Table
      if (reportType === 'staff') {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Staff Performance (${staffData.length} staff)`, 10, yPos);
        yPos += 8;
        
        const headers = ['#', 'Staff Name', 'Total Orders', 'Total Revenue', 'Avg Order Value'];
        const colWidths = [12, 50, 35, 45, 45];
        drawTableHeader(headers, colWidths);
        
        staffData.forEach((staff, index) => {
          const avgOrder = staff.orders > 0 ? Math.round(staff.revenue / staff.orders) : 0;
          drawTableRow([
            (index + 1).toString(),
            staff.name,
            staff.orders.toString(),
            `Rs. ${staff.revenue.toLocaleString()}`,
            `Rs. ${avgOrder.toLocaleString()}`
          ], colWidths, index % 2 === 1);
        });
        
        yPos += 5;
      }

      // Daily Breakdown for Summary
      if (reportType === 'summary' && reportData.dailyBreakdown.length > 0) {
        if (yPos > 200) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Daily Breakdown', 10, yPos);
        yPos += 8;
        
        const headers = ['Date', 'Orders', 'Sales', 'Expenses', 'Profit'];
        const colWidths = [45, 30, 40, 40, 40];
        drawTableHeader(headers, colWidths);
        
        reportData.dailyBreakdown.forEach((day, index) => {
          drawTableRow([
            format(new Date(day.date), 'MMM dd, yyyy'),
            day.orders.toString(),
            `Rs. ${day.sales.toLocaleString()}`,
            `Rs. ${day.expenses.toLocaleString()}`,
            `Rs. ${day.profit.toLocaleString()}`
          ], colWidths, index % 2 === 1);
        });
      }

      // Footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        pdf.text('Powered by SixSenses', pageWidth / 2, 295, { align: 'center' });
      }

      // Save PDF
      pdf.save(`AK47-${reportType}-Report-${startDate}-to-${endDate}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    let csvContent = '';
    const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
    
    if (reportType === 'summary' || reportType === 'products') {
      // Product Sales Report
      csvContent = BOM + 'Product Sales Report\n';
      csvContent += `Report Period: ${format(new Date(startDate), 'dd/MM/yyyy')} to ${format(new Date(endDate), 'dd/MM/yyyy')}\n\n`;
      csvContent += 'Sr No,Product Name,Category,Quantity Sold,Unit Price (Rs),Total Revenue (Rs)\n';
      
      reportData.productSummary.forEach((product, index) => {
        const avgPrice = product.quantity > 0 ? Math.round(product.revenue / product.quantity) : 0;
        csvContent += `${index + 1},"${product.name}","-",${product.quantity},${avgPrice},${product.revenue}\n`;
      });
      
      csvContent += `\n,,,Total,,"${reportData.summary.totalSales}"\n`;
    }
    
    if (reportType === 'invoices') {
      // Invoices Report
      csvContent = BOM + 'Invoice Details Report\n';
      csvContent += `Report Period: ${format(new Date(startDate), 'dd/MM/yyyy')} to ${format(new Date(endDate), 'dd/MM/yyyy')}\n\n`;
      csvContent += 'Invoice No,Date,Time,Cashier,Items,Payment Method,Total (Rs)\n';
      
      filteredInvoices.forEach(inv => {
        const itemsList = inv.items.map(item => `${item.productName} x${item.quantity}`).join(' | ');
        const paymentMethod = inv.paymentMethod === 'cash' ? 'Cash' : 'Online Bank';
        csvContent += `"${inv.invoiceNumber}","${format(new Date(inv.createdAt), 'dd/MM/yyyy')}","${format(new Date(inv.createdAt), 'hh:mm a')}","${inv.staffName}","${itemsList}","${paymentMethod}",${inv.total}\n`;
      });
      
      csvContent += `\n,,,,,,Total: ${filteredSummary.totalSales}\n`;
    }
    
    if (reportType === 'expenses') {
      // Expenses Report
      csvContent = BOM + 'Expenses Report\n';
      csvContent += `Report Period: ${format(new Date(startDate), 'dd/MM/yyyy')} to ${format(new Date(endDate), 'dd/MM/yyyy')}\n\n`;
      csvContent += 'Sr No,Date,Title,Notes,Amount (Rs)\n';
      
      reportData.expenses.forEach((exp, index) => {
        csvContent += `${index + 1},"${format(new Date(exp.date), 'dd/MM/yyyy')}","${exp.title}","${exp.notes || '-'}",${exp.amount}\n`;
      });
      
      csvContent += `\n,,,Total,${reportData.summary.totalExpenses}\n`;
    }
    
    if (reportType === 'staff') {
      // Staff Performance Report
      csvContent = BOM + 'Staff Performance Report\n';
      csvContent += `Report Period: ${format(new Date(startDate), 'dd/MM/yyyy')} to ${format(new Date(endDate), 'dd/MM/yyyy')}\n\n`;
      csvContent += 'Sr No,Staff Name,Total Orders,Total Revenue (Rs),Avg Order Value (Rs)\n';
      
      staffData.forEach((staff, index) => {
        const avgOrder = staff.orders > 0 ? Math.round(staff.revenue / staff.orders) : 0;
        csvContent += `${index + 1},"${staff.name}",${staff.orders},${staff.revenue},${avgOrder}\n`;
      });
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AK47-${reportType}-Report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>AK47 Shawarma Stop - Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1, h2, h3 { margin: 0 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .summary-card { display: inline-block; padding: 15px; margin: 5px; background: #f9f9f9; border-radius: 8px; min-width: 150px; }
            .summary-value { font-size: 24px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const presets: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const reportTypes: { value: ReportType; label: string; icon: React.ReactNode }[] = [
    { value: 'summary', label: 'Summary Report', icon: <FileText size={16} /> },
    { value: 'products', label: 'Product Sales', icon: <ShoppingCart size={16} /> },
    { value: 'invoices', label: 'Invoice Details', icon: <DollarSign size={16} /> },
    { value: 'expenses', label: 'Expenses Report', icon: <TrendingDown size={16} /> },
    { value: 'staff', label: 'Staff Performance', icon: <Users size={16} /> },
  ];

  return (
    <div>
      <Header 
        title="Sales Reports" 
        subtitle="Generate and download detailed business reports"
      />
      
      <div className="p-8">
        {/* Filters Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          {/* Report Type Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-gray-500" />
              <span className="font-medium text-gray-700">Report Type:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    reportType === type.value
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-gray-500" />
              <span className="font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetChange(preset.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    datePreset === preset.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Filter (for invoice report) */}
          {(reportType === 'invoices' || reportType === 'summary') && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-gray-500" />
                <span className="font-medium text-gray-700">Payment Method:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    paymentFilter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Payments
                </button>
                <button
                  onClick={() => setPaymentFilter('cash')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    paymentFilter === 'cash'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Banknote size={16} />
                  Cash Only
                </button>
                <button
                  onClick={() => setPaymentFilter('online_bank')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    paymentFilter === 'online_bank'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CreditCard size={16} />
                  Online Only
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Download PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <FileSpreadsheet size={18} />
              Download Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
            >
              <Printer size={18} />
              Print Report
            </button>
            <button
              onClick={() => {
                refreshData();
                setRefreshKey(prev => prev + 1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors ml-auto"
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8" key={refreshKey}>
          {/* Report Header */}
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-lg">AK</span>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">AK47 Shawarma Stop</h1>
                <p className="text-gray-500 text-sm">{reportTypes.find(t => t.value === reportType)?.label}</p>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              Report Period: <strong>{format(new Date(startDate), 'MMMM dd, yyyy')}</strong> to <strong>{format(new Date(endDate), 'MMMM dd, yyyy')}</strong>
            </p>
            <p className="text-gray-400 text-sm mt-1">Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
          </div>

          {/* Summary Cards - Always show */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign size={18} />
                <span className="text-sm font-medium">Total Sales</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(filteredSummary.totalSales)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <TrendingDown size={18} />
                <span className="text-sm font-medium">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.totalExpenses)}</p>
            </div>
            <div className={`${reportData.summary.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'} rounded-xl p-4`}>
              <div className={`flex items-center gap-2 ${reportData.summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'} mb-2`}>
                <TrendingUp size={18} />
                <span className="text-sm font-medium">Net Profit</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.netProfit)}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <ShoppingCart size={18} />
                <span className="text-sm font-medium">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{filteredSummary.totalOrders}</p>
            </div>
          </div>

          {/* Payment Methods & Charts - For Summary Report */}
          {reportType === 'summary' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
                  <div className="h-48">
                    <Doughnut 
                      data={paymentChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }} 
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Cash Payments
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(reportData.summary.cashSales)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Online Bank Payments
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(reportData.summary.onlineSales)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Average Order Value</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(filteredSummary.totalOrders > 0 ? filteredSummary.totalSales / filteredSummary.totalOrders : 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Profit Margin</span>
                      <span className={`font-semibold ${reportData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.summary.totalSales > 0 
                          ? ((reportData.summary.netProfit / reportData.summary.totalSales) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Orders per Day</span>
                      <span className="font-semibold text-gray-900">
                        {reportData.dailyBreakdown.length > 0 
                          ? (filteredSummary.totalOrders / reportData.dailyBreakdown.length).toFixed(1)
                          : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-600">Revenue per Day</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(reportData.dailyBreakdown.length > 0 
                          ? filteredSummary.totalSales / reportData.dailyBreakdown.length
                          : 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales vs Expenses Chart */}
              {reportData.dailyBreakdown.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Sales vs Expenses Chart</h3>
                  <div className="h-80 bg-gray-50 rounded-xl p-4">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Product Sales Summary */}
          {(reportType === 'summary' || reportType === 'products') && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} />
                Product Sales Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product Name</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty Sold</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.productSummary.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{product.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {formatCurrency(product.quantity > 0 ? product.revenue / product.quantity : 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                    {reportData.productSummary.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No sales data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {reportData.productSummary.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan={2} className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {reportData.productSummary.reduce((sum, p) => sum + p.quantity, 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">-</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatCurrency(reportData.summary.totalSales)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          {reportType === 'invoices' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} />
                Invoice Details ({filteredInvoices.length} invoices)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cashier</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(invoice.createdAt), 'dd/MM/yyyy hh:mm a')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{invoice.staffName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="max-w-xs">
                            {invoice.items.map((item, idx) => (
                              <span key={idx} className="inline-block bg-gray-100 rounded px-2 py-0.5 text-xs mr-1 mb-1">
                                {item.productName} ×{item.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.paymentMethod === 'cash' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {invoice.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                      </tr>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No invoices found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredInvoices.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan={5} className="px-4 py-3 text-sm text-gray-900">Grand Total</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatCurrency(filteredSummary.totalSales)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Expenses Report */}
          {reportType === 'expenses' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown size={18} />
                Expenses Details ({reportData.expenses.length} entries)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.expenses.map((expense, index) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {format(new Date(expense.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{expense.notes || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                    {reportData.expenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No expenses found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {reportData.expenses.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan={4} className="px-4 py-3 text-sm text-gray-900">Total Expenses</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {formatCurrency(reportData.summary.totalExpenses)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Staff Performance Report */}
          {reportType === 'staff' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={18} />
                Staff Performance ({staffData.length} staff members)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Staff Name</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Orders</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Revenue</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffData.map((staff, index) => (
                      <tr key={staff.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{staff.name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{staff.orders}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          {formatCurrency(staff.revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {formatCurrency(staff.orders > 0 ? staff.revenue / staff.orders : 0)}
                        </td>
                      </tr>
                    ))}
                    {staffData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No staff data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Breakdown - For Summary */}
          {reportType === 'summary' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={18} />
                Daily Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sales</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expenses</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.dailyBreakdown.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {format(new Date(day.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{day.orders}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(day.sales)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">{formatCurrency(day.expenses)}</td>
                        <td className={`px-4 py-3 text-sm text-right font-semibold ${day.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(day.profit)}
                        </td>
                      </tr>
                    ))}
                    {reportData.dailyBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {reportData.dailyBreakdown.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{reportData.summary.totalOrders}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(reportData.summary.totalSales)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</td>
                        <td className={`px-4 py-3 text-sm text-right ${reportData.summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {formatCurrency(reportData.summary.netProfit)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              This report was generated automatically by the AK47 Shawarma Stop POS System
            </p>
            <p className="text-gray-400 text-xs mt-2">Powered by SixSenses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
