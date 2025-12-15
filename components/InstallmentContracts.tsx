import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { ContractType, InstallmentContract, Buyer, InventoryItem, Investor, PaymentStatus, Installment, ShowroomItem } from '../types';
import { Button } from './ui/Button';
import { Plus, Eye, CheckCircle, FileText, Calendar, DollarSign, User, Printer, Loader2, AlertCircle } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface CompanySettings {
  companyName: string;
  logoUrl: string;
  taxNumber: string;
  phone: string;
  email: string;
  showName: boolean;
  showLogo: boolean;
  showTaxNumber: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

const COMPANY_SETTINGS_KEY = 'companySettings';

const InstallmentContracts = () => {
  const [contracts, setContracts] = useState<InstallmentContract[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewContract, setViewContract] = useState<InstallmentContract | null>(null);
  const [viewInstallments, setViewInstallments] = useState<Installment[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Payment Confirmation State
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  
  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    manualId: '',
    type: ContractType.Installment,
    buyerId: '',
    guarantorId: '',
    investorId: '',
    selectedInventoryIds: [] as string[],
    itemValue: 0,
    serviceFee: 0,
    months: 12,
    saleMode: 'installment', // 'installment' | 'credit'
    creditDueDate: '',       // used when saleMode === 'credit'
  });

  // Data for Selects
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showroomItems, setShowroomItems] = useState<ShowroomItem[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  // Load company settings for print header
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPANY_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompanySettings;
        setCompanySettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load company settings', error);
    }
  }, []);

  // Print Logic: Wait for render, generate barcode, then print
  useEffect(() => {
    if (isPrinting && viewContract) {
      console.log('PRINT_EFFECT_START', { contractId: viewContract.id, manualId: viewContract.manualId });
      // 1. Generate Barcode locally using JsBarcode
      // Use setTimeout to ensure the <svg> is in the DOM
      const timer = setTimeout(() => {
        try {
            JsBarcode("#barcode", viewContract.manualId || viewContract.id, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 16,
                font: "Cairo"
            });
        } catch (error) {
            console.error("Barcode generation failed", error);
        }

        // 2. Trigger Print
        // Note: some sandboxes block window.print(). If this is ignored, 
        // the user at least sees the print layout if we were to show it,
        // but here it is hidden. We just rely on browser capability.
        console.log('CALLING_WINDOW_PRINT');
        window.print();
      }, 500);

      const handleAfterPrint = () => {
        console.log('AFTER_PRINT');
        setIsPrinting(false);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting, viewContract]);

  const refreshData = async () => {
    try {
      const c = await db.getContracts();
      setContracts(c);
      
      const b = await db.getBuyers();
      setBuyers(b);
      
      const inv = await db.getInventory();
      setInventory(inv.filter(i => i.status === 'available'));

      const show = await db.getShowroomItems();
      setShowroomItems(show.filter(s => s.status === 'received'));
      
      const invest = await db.getInvestors();
      setInvestors(invest);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    // Basic validation
    if (!formData.buyerId || !formData.investorId || formData.selectedInventoryIds.length === 0) {
      alert("لازم تختار الزبون، الممول، وعربية واحدة على الأقل!");
      return;
    }

    // Ensure numeric values
    const itemVal = Number(formData.itemValue);
    const serviceFee = Number(formData.serviceFee);
    
    if (isNaN(itemVal) || isNaN(serviceFee)) {
        alert("تأكد من صحة الأرقام (سعر التكلفة والربح)");
        return;
    }

    const totalAmount = itemVal + serviceFee;
    const contractId = Date.now().toString();
    const createdAt = new Date().toISOString();

    // Generate Installments
    const newInstallments: Installment[] = [];
    if (formData.saleMode === 'credit') {
      // عقد أجل: قسط واحد بكامل المبلغ في تاريخ يتم تحديده
      if (!formData.creditDueDate) {
        alert('من فضلك حدد تاريخ استحقاق عقد الأجل');
        return;
      }

      const due = new Date(formData.creditDueDate);
      if (isNaN(due.getTime())) {
        alert('تاريخ الاستحقاق غير صالح');
        return;
      }

      newInstallments.push({
        id: `${contractId}_1`,
        contractId,
        dueDate: due.toISOString(),
        amount: totalAmount,
        status: PaymentStatus.Pending,
      });
    } else {
      // عقد تقسيط: توزيع المبلغ على عدد من الشهور
      const months = formData.months || 1;
      const monthlyAmount = Math.ceil(totalAmount / months);
      
      for (let i = 1; i <= months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        newInstallments.push({
          id: `${contractId}_${i}`,
          contractId: contractId,
          dueDate: date.toISOString(),
          amount: monthlyAmount,
          status: PaymentStatus.Pending
        });
      }
    }

    const newContract: InstallmentContract = {
      id: contractId,
      manualId: formData.manualId,
      type: formData.type,
      createdAt,
      buyerId: formData.buyerId,
      guarantorId: formData.guarantorId,
      investorId: formData.investorId,
      inventoryIds: formData.selectedInventoryIds,
      totalItemValue: itemVal,
      serviceFee: serviceFee,
      totalAmount,
      status: 'active'
    };

    try {
        await db.addContract(newContract, newInstallments);
        setIsModalOpen(false);
        await refreshData();
        resetForm();
        alert("تم اعتماد العقد بنجاح");
    } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء حفظ العقد. راجع المدخلات.");
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      manualId: '',
      type: ContractType.Installment,
      buyerId: '',
      guarantorId: '',
      investorId: '',
      selectedInventoryIds: [],
      itemValue: 0,
      serviceFee: 0,
      months: 12,
      saleMode: 'installment',
      creditDueDate: '',
    });
  };

  const openDetails = async (contract: InstallmentContract) => {
    setViewContract(contract);
    // تحميل أحدث بيانات الأقساط
    const installments = await db.getInstallmentsByContract(contract.id);
    setViewInstallments(installments);
  };

  // 1. Opens the confirmation modal
  const promptPayment = (instId: string) => {
    setConfirmPaymentId(instId);
  };

  // 2. Executes the payment
  const executePayment = async () => {
    if (!confirmPaymentId) return;
    
    setIsPaying(true);
    try {
      await db.payInstallment(confirmPaymentId);
      
      // تحديث البيانات المحلية في المودال فوراً
      if (viewContract) {
        const updated = await db.getInstallmentsByContract(viewContract.id);
        setViewInstallments(updated);
      }
      // تحديث البيانات العامة في الخلفية
      await refreshData();
      setConfirmPaymentId(null);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تسجيل الدفع");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    if (!viewContract) {
      console.warn('HANDLE_PRINT_WITHOUT_CONTRACT');
      return;
    }
    console.log('HANDLE_PRINT_CLICKED', { contractId: viewContract.id, manualId: viewContract.manualId });
    setIsPrinting(true);
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          إدارة عقود التقسيط
        </h1>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-100">
          <Plus className="w-5 h-5 ml-2" />
          إنشاء عقد جديد
        </Button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">رقم الملف</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">نوع العقد</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">اسم العميل</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">إجمالي المديونية</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {contracts.map((contract, index) => {
              const buyer = buyers.find(b => b.id === contract.buyerId);
              return (
                <tr key={contract.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-700">{contract.manualId || contract.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-medium">{contract.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">{buyer?.name || 'غير معروف'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-700 text-lg">
                    {contract.totalAmount.toLocaleString()} <span className="text-xs text-emerald-500">ج.م</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                      ساري
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => openDetails(contract)} 
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1 rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              );
            })}
            {contracts.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        لا توجد عقود مسجلة حتى الآن. ابدأ بإضافة عقد جديد.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="bg-slate-800 p-4 sticky top-0 z-10 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    فتح ملف تقسيط - خطوة {step} من 4
                 </h2>
                 <div className="flex gap-1">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-2 w-8 rounded-full ${step >= s ? 'bg-primary' : 'bg-slate-600'}`} />
                    ))}
                 </div>
            </div>
            
            <div className="p-8 space-y-6 flex-1">
                {step === 1 && (
                <div className="space-y-6">
                    <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">رقم العقد / الملف (الورقي)</label>
                    <div className="relative">
                        <FileText className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            className="block w-full pr-10 rounded-lg border-2 border-slate-300 p-3 focus:border-primary focus:ring-0 text-lg font-bold text-slate-900" 
                            placeholder="مثال: 1055"
                            value={formData.manualId}
                            onChange={e => setFormData({...formData, manualId: e.target.value})}
                        />
                    </div>
                    </div>
                    <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">نوع الضمانات</label>
                    <select 
                        className="block w-full rounded-lg border-2 border-slate-300 p-3 text-lg text-slate-800 font-medium focus:border-primary"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as ContractType})}
                    >
                        {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    </div>
                </div>
                )}

                {step === 2 && (
                <div className="space-y-6">
                    <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">الزبون (المشتري)</label>
                    <div className="relative">
                        <User className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                        <select 
                            className="block w-full pr-10 rounded-lg border-2 border-slate-300 p-3 text-lg text-slate-800 font-medium focus:border-primary"
                            value={formData.buyerId}
                            onChange={e => setFormData({...formData, buyerId: e.target.value})}
                        >
                            <option value="">اختار الزبون...</option>
                            {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    </div>
                    <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">الضامن (اختياري)</label>
                    <select 
                        className="block w-full rounded-lg border-2 border-slate-300 p-3 text-lg text-slate-800 font-medium focus:border-primary"
                        value={formData.guarantorId}
                        onChange={e => setFormData({...formData, guarantorId: e.target.value})}
                    >
                        <option value="">اختار الضامن...</option>
                        {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    </div>
                </div>
                )}

                {step === 3 && (
                <div className="space-y-6">
                    <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">العربية (من المعرض أو المخزون)</label>
                    <select 
                        multiple
                        className="block w-full rounded-lg border-2 border-slate-300 p-2 h-40 text-slate-800 font-medium focus:border-primary"
                        value={formData.selectedInventoryIds}
                        onChange={e => {
                        const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                        
                        // Calculate total value from inventory AND showroom
                        let totalVal = 0;
                        selected.forEach(id => {
                            const invItem = inventory.find(i => i.id === id);
                            if (invItem) {
                                totalVal += invItem.price;
                            } else {
                                const showItem = showroomItems.find(s => s.id === id);
                                if (showItem) totalVal += Number(showItem.sellingPrice);
                            }
                        });
                        
                        setFormData({
                            ...formData, 
                            selectedInventoryIds: selected,
                            itemValue: totalVal 
                        });
                        }}
                    >
                        {inventory.length > 0 && <optgroup label="مخزون المعرض (ملك)">
                            {inventory.map(i => (
                            <option key={i.id} value={i.id} className="p-2 border-b border-slate-100 hover:bg-blue-50 cursor-pointer">
                                {i.type} {i.model} - <span className="font-bold">{i.price.toLocaleString()} ج.م</span>
                            </option>
                            ))}
                        </optgroup>}
                        {showroomItems.length > 0 && <optgroup label="أمانات / بيع للغير">
                             {showroomItems.map(s => (
                            <option key={s.id} value={s.id} className="p-2 border-b border-slate-100 hover:bg-purple-50 cursor-pointer text-purple-900">
                                {s.type} (أمانة) - <span className="font-bold">{Number(s.sellingPrice).toLocaleString()} ج.م</span>
                            </option>
                            ))}
                        </optgroup>}
                    </select>
                    <p className="text-xs text-blue-600 mt-2 font-bold bg-blue-50 p-2 rounded inline-block">💡 معلومة: عشان تختار أكتر من عربية دوس على زرار Ctrl وانت بتختار</p>
                    </div>
                    <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">الممول (صاحب رأس المال)</label>
                    <select 
                        className="block w-full rounded-lg border-2 border-slate-300 p-3 text-lg text-slate-800 font-medium focus:border-primary"
                        value={formData.investorId}
                        onChange={e => setFormData({...formData, investorId: e.target.value})}
                    >
                        <option value="">اختار الممول...</option>
                        {investors.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (رصيد: {inv.balance.toLocaleString()})</option>)}
                    </select>
                    </div>
                </div>
                )}

                {step === 4 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-base font-bold text-slate-800 mb-2">نوع العقد</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              className="text-primary focus:ring-primary"
                              checked={formData.saleMode === 'installment'}
                              onChange={() => setFormData({ ...formData, saleMode: 'installment' })}
                            />
                            <span>بيع بالتقسيط (أقساط شهرية)</span>
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              className="text-primary focus:ring-primary"
                              checked={formData.saleMode === 'credit'}
                              onChange={() => setFormData({ ...formData, saleMode: 'credit' })}
                            />
                            <span>بيع بالآجل (دفعة واحدة في تاريخ محدد)</span>
                          </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1">ثمن الكاش (التكلفة)</label>
                        <div className="relative">
                            <DollarSign className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
                            <input 
                                type="number" 
                                className="block w-full pr-9 rounded-lg border border-slate-200 bg-slate-100 p-3 font-bold text-slate-600"
                                value={formData.itemValue}
                                readOnly
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">الربح / الفائدة</label>
                        <div className="relative">
                            <Plus className="absolute right-3 top-3 text-emerald-600 w-4 h-4" />
                            <input 
                            type="number" 
                            className="block w-full pr-9 rounded-lg border-2 border-emerald-500 p-3 font-bold text-slate-900 focus:ring-emerald-500"
                            value={formData.serviceFee}
                            onChange={e => setFormData({...formData, serviceFee: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    </div>
                    {formData.saleMode === 'installment' && (
                      <div>
                          <label className="block text-base font-bold text-slate-800 mb-2">مدة التقسيط (شهور)</label>
                          <div className="relative">
                              <Calendar className="absolute right-3 top-3 text-slate-500 w-5 h-5" />
                              <input 
                                  type="number" 
                                  className="block w-full pr-10 rounded-lg border-2 border-slate-300 p-3 text-lg font-bold text-slate-900"
                                  value={formData.months}
                                  onChange={e => setFormData({...formData, months: Number(e.target.value)})}
                              />
                          </div>
                      </div>
                    )}

                    {formData.saleMode === 'credit' && (
                      <div>
                          <label className="block text-base font-bold text-slate-800 mb-2">تاريخ استحقاق عقد الآجل</label>
                          <div className="relative">
                              <Calendar className="absolute right-3 top-3 text-slate-500 w-5 h-5" />
                              <input 
                                  type="date" 
                                  className="block w-full pr-10 rounded-lg border-2 border-slate-300 p-3 text-lg font-bold text-slate-900"
                                  value={formData.creditDueDate}
                                  onChange={e => setFormData({ ...formData, creditDueDate: e.target.value })}
                              />
                          </div>
                      </div>
                    )}
                    
                    <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                            <span className="text-slate-300">الإجمالي بالفوائد:</span>
                            <span className="text-2xl font-bold text-emerald-400">{(Number(formData.itemValue) + Number(formData.serviceFee)).toLocaleString()} ج.م</span>
                        </div>
                        {formData.saleMode === 'installment' ? (
                          <div className="flex justify-between items-center">
                              <span className="text-slate-300">قيمة القسط الشهري:</span>
                              <span className="text-xl font-bold text-white">{Math.ceil((Number(formData.itemValue) + Number(formData.serviceFee)) / (formData.months || 1)).toLocaleString()} ج.م</span>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <span className="text-slate-300">عقد بيع بالآجل - دفعة واحدة مستحقة في:</span>
                              <span className="text-lg font-bold text-white">
                                {formData.creditDueDate 
                                  ? new Date(formData.creditDueDate).toLocaleDateString('ar-EG')
                                  : 'لم يتم تحديد التاريخ بعد'}
                              </span>
                          </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between rounded-b-2xl">
                {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>السابق</Button>
                ) : (
                    <Button variant="danger" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
                )}
                
                {step < 4 ? (
                    <Button onClick={() => setStep(step + 1)}>التالي</Button>
                ) : (
                    <Button onClick={handleCreate} className="px-8 text-lg shadow-lg shadow-emerald-200">اعتماد العقد النهائي</Button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-80 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-slate-800 text-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold">تفاصيل العقد: <span className="text-emerald-400 font-mono">{viewContract.manualId}</span></h2>
                <p className="text-slate-400 text-sm">{viewContract.type}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                   <Printer size={18} />
                   طباعة العقد
                </button>
                <button onClick={() => setViewContract(null)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                   إغلاق
                </button>
              </div>
            </div>

            {/* Screen View Content */}
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">اسم العميل</p>
                    <p className="text-xl font-extrabold text-slate-900">{buyers.find(b => b.id === viewContract.buyerId)?.name}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">الممول</p>
                    <p className="text-lg font-bold text-slate-800">{investors.find(i => i.id === viewContract.investorId)?.name}</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">إجمالي المتبقي</p>
                    <p className="text-2xl font-extrabold text-red-600">
                    {viewInstallments.filter(i => i.status !== 'تم السداد').reduce((acc, c) => acc + c.amount, 0).toLocaleString()} <span className="text-sm text-red-400">ج.م</span>
                    </p>
                </div>
                </div>

                <h3 className="font-bold text-xl text-slate-800 mb-4 border-r-4 border-primary pr-3">جدول سداد الأقساط</h3>
                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                    <tr>
                        <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">#</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">تاريخ الاستحقاق</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">قيمة القسط</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">الحالة</th>
                        <th className="px-6 py-3 text-right text-sm font-bold text-slate-700">تحصيل</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {viewInstallments.map((inst, idx) => (
                        <tr key={inst.id} className={inst.status === 'تم السداد' ? 'bg-emerald-50' : 'hover:bg-slate-50'}>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 font-bold">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{new Date(inst.dueDate).toLocaleDateString('ar-EG')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{inst.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">
                            {inst.status === 'تم السداد' ? 
                            <span className="text-emerald-700 flex items-center gap-1 font-bold bg-emerald-100 px-2 py-1 rounded-md w-fit"><CheckCircle size={16} /> تم السداد ({new Date(inst.paidDate!).toLocaleDateString('ar-EG')})</span> 
                            : <span className="text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded-md">مطلوب دفعه</span>
                            }
                        </td>
                        <td className="px-6 py-4 text-sm">
                            {inst.status !== 'تم السداد' && (
                                <Button 
                                    size="sm" 
                                    onClick={() => promptPayment(inst.id)} 
                                    className="bg-slate-800 hover:bg-slate-900 min-w-[120px]"
                                >
                                    استلام النقدية
                                </Button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>

          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {confirmPaymentId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 no-print">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-primary animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4 text-slate-800">
                    <AlertCircle className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-bold">تأكيد الاستلام</h3>
                </div>
                <p className="text-slate-600 mb-6 font-medium">
                    هل أنت متأكد من استلام المبلغ نقداً؟ سيتم تغيير حالة القسط إلى "تم السداد".
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setConfirmPaymentId(null)} disabled={isPaying}>
                        إلغاء
                    </Button>
                    <Button onClick={executePayment} disabled={isPaying} className="min-w-[100px]">
                        {isPaying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'تأكيد العملية'}
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Print Portal - Renders ONLY when printing state is true, inside #print-root */}
      {isPrinting && viewContract && createPortal(

        <div className="p-8 max-w-[210mm] mx-auto bg-white text-black print-content" dir="rtl">
             {/* Print Header */}
             <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-amber-800">
               <div className="text-right max-w-[60%]">
                 {companySettings && (
                   <div className="mb-3 text-sm text-slate-700">
                     {companySettings.showLogo && companySettings.logoUrl && (
                       <div className="mb-2 flex justify-end">
                         <img
                           src={companySettings.logoUrl}
                           alt={companySettings.companyName || 'شعار الشركة'}
                           className="h-16 max-w-[140px] object-contain inline-block"
                         />
                       </div>
                     )}
                     {companySettings.showName && companySettings.companyName && (
                       <p className="font-extrabold text-lg text-amber-900">{companySettings.companyName}</p>
                     )}
                     {companySettings.showTaxNumber && companySettings.taxNumber && (
                       <p className="text-xs">الرقم الضريبي: {companySettings.taxNumber}</p>
                     )}
                     {(companySettings.showPhone && companySettings.phone) && (
                       <p className="text-xs">جوال: {companySettings.phone}</p>
                     )}
                     {(companySettings.showEmail && companySettings.email) && (
                       <p className="text-xs dir-ltr text-right">{companySettings.email}</p>
                     )}
                   </div>
                 )}
                 <h1 className="text-3xl font-extrabold mb-2 text-amber-900">فاتورة بيع بالآجل</h1>
                 <p className="text-lg font-bold">تاريخ التحرير: {new Date(viewContract.createdAt).toLocaleDateString('ar-EG')}</p>
                 <p className="text-lg font-bold">رقم الملف: <span className="font-mono text-2xl">{viewContract.manualId}</span></p>
               </div>
               <div className="text-left">
                  {/* SVG Container for JsBarcode */}
                  <svg id="barcode" className="h-20"></svg>
               </div>
             </div>

             {/* Vehicle Details Grid */}
             <div className="mb-6 border-2 border-amber-800 rounded-lg overflow-hidden">
               <table className="w-full border-collapse text-sm">
                 <thead className="bg-amber-50 border-b-2 border-amber-800 -webkit-print-color-adjust-exact">
                   <tr>
                     <th className="border border-amber-800 p-2 text-center">نوع السيارة</th>
                     <th className="border border-amber-800 p-2 text-center">الموديل</th>
                     <th className="border border-amber-800 p-2 text-center">رقم الهيكل</th>
                     <th className="border border-amber-800 p-2 text-center">رقم اللوحة</th>
                     <th className="border border-amber-800 p-2 text-center">البديل</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     <td className="border border-amber-800 p-3 min-h-[26px]"></td>
                     <td className="border border-amber-800 p-3 min-h-[26px]"></td>
                     <td className="border border-amber-800 p-3 min-h-[26px]"></td>
                     <td className="border border-amber-800 p-3 min-h-[26px]"></td>
                     <td className="border border-amber-800 p-3 min-h-[26px]"></td>
                   </tr>
                 </tbody>
               </table>
             </div>

             {/* Parties */}
             <div className="space-y-4 mb-6">
               <div className="border-2 border-amber-800 p-4 rounded-lg bg-white">
                 <h3 className="font-bold text-lg mb-3 text-amber-900">الطرف الأول البائع</h3>
                 <div className="space-y-2 text-sm">
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">الاسم:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block">
                       {investors.find(i => i.id === viewContract.investorId)?.name || ''}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">رقم الهوية:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block"></span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">جوال:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block"></span>
                   </div>
                 </div>
               </div>

               <div className="border-2 border-amber-800 p-4 rounded-lg bg-white">
                 <h3 className="font-bold text-lg mb-3 text-amber-900">الطرف الثاني المشتري</h3>
                 <div className="space-y-2 text-sm">
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">الاسم:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block">
                       {buyers.find(b => b.id === viewContract.buyerId)?.name || ''}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">رقم الهوية:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block">
                       {buyers.find(b => b.id === viewContract.buyerId)?.idNumber || ''}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">جوال:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block">
                       {buyers.find(b => b.id === viewContract.buyerId)?.phone || ''}
                     </span>
                   </div>
                 </div>
               </div>

               <div className="border-2 border-amber-800 p-4 rounded-lg bg-white">
                 <h3 className="font-bold text-lg mb-3 text-amber-900">الكفيل</h3>
                 <div className="space-y-2 text-sm">
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">الاسم:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block">
                       {viewContract.guarantorId ? (buyers.find(b => b.id === viewContract.guarantorId)?.name || '') : ''}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">رقم الهوية:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block"></span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-28 font-bold">جوال:</span>
                     <span className="flex-1 border-b border-amber-800 min-h-[22px] inline-block"></span>
                   </div>
                 </div>
               </div>
             </div>

             {/* Financials */}
             <div className="mb-6 border-2 border-amber-800 rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-amber-50 border-b-2 border-amber-800 -webkit-print-color-adjust-exact">
                    <tr>
                      <th className="border border-amber-800 p-2 text-center">ثمن الكاش</th>
                      <th className="border border-amber-800 p-2 text-center">الربح / الفائدة</th>
                      <th className="border border-amber-800 p-2 text-center">إجمالي المبلغ</th>
                      <th className="border border-amber-800 p-2 text-center">مدة التقسيط (شهور)</th>
                      <th className="border border-amber-800 p-2 text-center">قيمة القسط الشهري</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-amber-800 p-2 text-center">
                        {viewContract.totalItemValue.toLocaleString()} ج.م
                      </td>
                      <td className="border border-amber-800 p-2 text-center">
                        {viewContract.serviceFee.toLocaleString()} ج.م
                      </td>
                      <td className="border border-amber-800 p-2 text-center">
                        {viewContract.totalAmount.toLocaleString()} ج.م
                      </td>
                      <td className="border border-amber-800 p-2 text-center">
                        {viewInstallments.length}
                      </td>
                      <td className="border border-amber-800 p-2 text-center">
                        {viewInstallments[0]?.amount.toLocaleString()} ج.م
                      </td>
                    </tr>
                  </tbody>
                </table>
             </div>

             {/* Installments Table */}
             <h3 className="font-bold text-lg mb-2 border-r-4 border-amber-800 pr-2">جدول الأقساط المستحقة:</h3>
             <table className="w-full border-collapse border border-amber-800 mb-12 text-sm">
                <thead className="bg-amber-50 -webkit-print-color-adjust-exact">
                  <tr>
                    <th className="border border-amber-800 p-2 text-center text-black">#</th>
                    <th className="border border-amber-800 p-2 text-center text-black">تاريخ الاستحقاق</th>
                    <th className="border border-amber-800 p-2 text-center text-black">القيمة</th>
                    <th className="border border-amber-800 p-2 text-center w-1/3 text-black">توقيع الاستلام / ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInstallments.map((inst, idx) => (
                    <tr key={inst.id}>
                      <td className="border border-amber-800 p-2 text-center font-bold font-mono text-black">{idx + 1}</td>
                      <td className="border border-amber-800 p-2 text-center font-bold text-black">{new Date(inst.dueDate).toLocaleDateString('ar-EG')}</td>
                      <td className="border border-amber-800 p-2 text-center font-bold text-black">{inst.amount.toLocaleString()}</td>
                      <td className="border border-amber-800 p-2"></td>
                    </tr>
                  ))}
                </tbody>
             </table>

             {/* Signatures */}
             <div className="flex justify-between mt-16 px-10 break-inside-avoid">
                <div className="text-center w-1/3">
                    <p className="font-bold mb-10 text-xl text-black">توقيع الطرف الأول</p>
                    <div className="border-b-2 border-amber-800"></div>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold mb-10 text-xl text-black">توقيع الطرف الثاني</p>
                    <div className="border-b-2 border-amber-800"></div>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold mb-10 text-xl text-black">توقيع الكفيل</p>
                    <div className="border-b-2 border-amber-800"></div>
                </div>
             </div>

             <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                نسخة إلكترونية - تم طباعتها بتاريخ {new Date().toLocaleString('ar-EG')}
             </div>
        </div>,
        document.getElementById('print-root') as HTMLElement
      )}
    </div>
  );
};

export default InstallmentContracts;