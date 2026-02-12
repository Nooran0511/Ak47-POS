import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar,
  X,
  Check,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/Layout/Header';
import { getExpenses, addExpense, deleteExpense, refreshData } from '@/store/dataStore';
import { formatCurrency, CURRENCY_SYMBOL } from '@/utils/currency';
import type { Expense } from '@/types';
import { cn } from '@/utils/cn';

export function Expenses() {
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Refresh expenses on mount and listen for updates
  useEffect(() => {
    refreshData();
    setLocalExpenses(getExpenses());
    
    const handleDataUpdate = () => {
      setLocalExpenses(getExpenses());
    };
    
    window.addEventListener('dataStoreUpdate', handleDataUpdate);
    return () => window.removeEventListener('dataStoreUpdate', handleDataUpdate);
  }, []);

  const handleOpenModal = () => {
    setFormData({
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setDeleteConfirm(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addExpense({
      title: formData.title,
      amount: parseFloat(formData.amount),
      date: formData.date,
      notes: formData.notes,
    });
    
    setLocalExpenses(getExpenses());
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (deleteConfirm === id) {
      deleteExpense(id);
      setLocalExpenses(getExpenses());
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleRefresh = () => {
    refreshData();
    setLocalExpenses(getExpenses());
  };

  const totalExpenses = localExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const todayExpenses = localExpenses.filter(exp => 
    exp.date === new Date().toISOString().split('T')[0]
  );
  const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Sort expenses by date (newest first)
  const sortedExpenses = [...localExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <Header 
        title="Expense Management" 
        subtitle="Track and manage business expenses"
        action={
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />
      
      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(todayTotal)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{todayExpenses.length} transactions</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <DollarSign size={20} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(totalExpenses)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{localExpenses.length} transactions</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <FileText size={20} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">All Expenses</h2>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <DollarSign size={18} className="text-red-600" />
                      </div>
                      <span className="font-medium text-gray-900">{expense.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(expense.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {expense.notes || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          deleteConfirm === expense.id
                            ? "text-red-600 bg-red-50"
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        )}
                      >
                        {deleteConfirm === expense.id ? <Check size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedExpenses.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No expenses recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g., Ingredient Purchase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({CURRENCY_SYMBOL})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
