import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Printer,
  Download,
  X,
  Check,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { useAuthStore } from '@/store/authStore';
import { 
  getProducts,
  createInvoice, 
  searchProducts,
  refreshData
} from '@/store/dataStore';
import { formatCurrency, CURRENCY_SYMBOL } from '@/utils/currency';
import type { CartItem, PaymentMethod, Product } from '@/types';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function Invoice() {
  const { user } = useAuthStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Refresh products on mount
  useEffect(() => {
    refreshData();
    setProducts(getProducts());
    
    const handleDataUpdate = () => {
      setProducts(getProducts());
    };
    
    window.addEventListener('dataStoreUpdate', handleDataUpdate);
    return () => window.removeEventListener('dataStoreUpdate', handleDataUpdate);
  }, []);

  const activeProducts = products.filter(p => p.status === 'active');
  const filteredProducts = searchQuery 
    ? searchProducts(searchQuery).filter(p => p.status === 'active')
    : activeProducts;

  const addToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stockQuantity < 1) return;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) return item;
        if (newQuantity > item.product.stockQuantity) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmInvoice = () => {
    const items = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const invoice = createInvoice(
      items,
      paymentMethod,
      user?.id || 0,
      user?.name || 'Unknown'
    );

    setCurrentInvoice(invoice);
    setCart([]);
    setShowConfirmModal(false);
    setShowInvoiceModal(true);
    
    // Refresh products to get updated stock
    setProducts(getProducts());
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - AK47 Shawarma Stop</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              width: 80mm; 
              padding: 8mm 5mm;
              font-size: 11px;
              line-height: 1.4;
              background: white;
            }
            .invoice-container { width: 100%; }
            .header { text-align: center; margin-bottom: 12px; }
            .logo { 
              width: 40px; 
              height: 40px; 
              background: #000; 
              color: #FACC15; 
              font-weight: bold; 
              font-size: 14px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              margin-bottom: 8px;
            }
            .restaurant-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
            .tagline { font-size: 10px; color: #666; margin-top: 2px; }
            .divider { border-top: 1px dashed #333; margin: 10px 0; }
            .divider-double { border-top: 2px solid #000; margin: 10px 0; }
            .info-section { margin-bottom: 10px; }
            .info-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 10px; }
            .info-label { color: #666; }
            .info-value { font-weight: bold; }
            .items-header { 
              display: flex; 
              font-weight: bold; 
              font-size: 10px; 
              padding: 6px 0;
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
              background: #f5f5f5;
              margin: 0 -5mm;
              padding: 6px 5mm;
            }
            .items-header .item-name { flex: 1; }
            .items-header .item-qty { width: 30px; text-align: center; }
            .items-header .item-price { width: 50px; text-align: right; }
            .items-header .item-total { width: 60px; text-align: right; }
            .item-row { 
              display: flex; 
              padding: 5px 0; 
              font-size: 10px;
              border-bottom: 1px dotted #ddd;
            }
            .item-row .item-name { flex: 1; font-weight: 500; }
            .item-row .item-qty { width: 30px; text-align: center; }
            .item-row .item-price { width: 50px; text-align: right; color: #666; }
            .item-row .item-total { width: 60px; text-align: right; font-weight: bold; }
            .totals-section { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
            .grand-total { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0;
              font-size: 14px; 
              font-weight: bold;
              border-top: 2px solid #000;
              margin-top: 5px;
            }
            .payment-badge {
              display: inline-block;
              background: #f0f0f0;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 9px;
              text-transform: uppercase;
            }
            .footer { text-align: center; margin-top: 15px; }
            .thank-you { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
            .visit-again { font-size: 10px; color: #666; }
            .powered-by { font-size: 8px; color: #999; margin-top: 12px; letter-spacing: 0.5px; }
            .stars { color: #FACC15; font-size: 14px; letter-spacing: 2px; margin: 8px 0; }
            @media print { 
              body { width: 80mm; padding: 5mm; }
              @page { margin: 0; size: 80mm auto; }
            }
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
    }, 250);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      unit: 'mm',
      format: [80, canvas.height * 80 / canvas.width + 10],
    });
    
    const imgWidth = 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`invoice-${currentInvoice?.invoiceNumber}.pdf`);
  };

  // Group products by category
  const categories = [...new Set(filteredProducts.map(p => p.category))];

  return (
    <div>
      <Header 
        title="Point of Sale" 
        subtitle="Create and manage invoices"
      />
      
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            {/* Products by Category */}
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{category}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts
                      .filter(p => p.category === category)
                      .map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product.id)}
                          disabled={product.stockQuantity < 1 || product.status === 'inactive'}
                          className={cn(
                            "bg-white p-4 rounded-xl border-2 text-left transition-all",
                            product.stockQuantity > 0 && product.status === 'active'
                              ? "border-gray-100 hover:border-yellow-400 hover:shadow-md active:scale-98"
                              : "border-gray-100 opacity-50 cursor-not-allowed"
                          )}
                        >
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-gray-900">{formatCurrency(product.salePrice)}</span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              product.stockQuantity < 10 
                                ? "bg-red-100 text-red-600" 
                                : "bg-gray-100 text-gray-500"
                            )}>
                              {product.stockQuantity}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)] sticky top-4">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-900 rounded-t-xl">
              <ShoppingCart className="text-yellow-400" size={20} />
              <h2 className="font-semibold text-white">Current Order</h2>
              <span className="ml-auto bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Cart is empty</p>
                  <p className="text-sm">Click products to add</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-500">{formatCurrency(item.product.salePrice)} each</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(item.product.salePrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t border-gray-100 space-y-4 bg-gray-50 rounded-b-xl">
              {/* Payment Method */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all",
                      paymentMethod === 'cash'
                        ? "border-yellow-400 bg-yellow-50 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <Banknote size={16} />
                    <span className="text-sm font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('online_bank')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all",
                      paymentMethod === 'online_bank'
                        ? "border-yellow-400 bg-yellow-50 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <CreditCard size={16} />
                    <span className="text-sm font-medium">Online</span>
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold text-lg transition-all",
                  cart.length > 0
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-400/30"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-yellow-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Invoice</h2>
              <p className="text-gray-500 mt-1">Review the order details before confirming</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items</span>
                <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment</span>
                <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Staff</span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmInvoice}
                className="flex-1 px-4 py-2.5 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && currentInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-900">
              <h2 className="font-semibold text-white">Invoice Generated</h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4 bg-gray-100">
              {/* Professional Thermal Invoice */}
              <div 
                ref={invoiceRef}
                className="bg-white p-5 mx-auto shadow-sm"
                style={{ width: '300px', fontFamily: "'Courier New', monospace" }}
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-black rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-lg">AK</span>
                  </div>
                  <h1 className="text-base font-bold uppercase tracking-wider">AK47 Shawarma Stop</h1>
                  <p className="text-[10px] text-gray-500 mt-1">Premium Shawarma & Fast Food</p>
                  <p className="text-[10px] text-gray-500">Tel: 0300-1234567</p>
                </div>

                <div className="border-t border-dashed border-gray-400 my-3"></div>

                {/* Invoice Details */}
                <div className="text-xs space-y-1.5 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice No:</span>
                    <span className="font-bold">{currentInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span>{format(new Date(currentInvoice.createdAt), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span>{format(new Date(currentInvoice.createdAt), 'hh:mm a')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cashier:</span>
                    <span>{currentInvoice.staffName}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-400 my-3"></div>

                {/* Items Header */}
                <div className="flex text-[10px] font-bold py-2 bg-gray-100 px-2 -mx-2 mb-2">
                  <span className="flex-1">ITEM</span>
                  <span className="w-7 text-center">QTY</span>
                  <span className="w-14 text-right">PRICE</span>
                  <span className="w-16 text-right">TOTAL</span>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {currentInvoice.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex text-xs py-1 border-b border-dotted border-gray-200">
                      <span className="flex-1 pr-1 leading-tight">{item.productName}</span>
                      <span className="w-7 text-center">{item.quantity}</span>
                      <span className="w-14 text-right text-gray-500">{item.unitPrice}</span>
                      <span className="w-16 text-right font-medium">{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-400 my-3"></div>

                {/* Totals */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>{CURRENCY_SYMBOL} {currentInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] uppercase">
                      {currentInvoice.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-black my-3"></div>

                {/* Grand Total */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold">GRAND TOTAL:</span>
                  <span className="text-lg font-bold">{CURRENCY_SYMBOL} {currentInvoice.total.toLocaleString()}</span>
                </div>

                <div className="border-t border-dashed border-gray-400 my-3"></div>

                {/* Footer */}
                <div className="text-center">
                  <p className="text-xs font-bold mb-1">★ Thank You! ★</p>
                  <p className="text-[10px] text-gray-500">Please visit again</p>
                  <p className="text-[10px] text-gray-400 mt-3">━━━━━━━━━━━━━━━━━━━━</p>
                  <p className="text-[9px] text-gray-400 mt-2 tracking-wide">Powered by SixSenses</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                <Printer size={18} />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
