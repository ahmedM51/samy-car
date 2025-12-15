import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { InventoryItem, Investor, Buyer } from '../types';
import { Button } from './ui/Button';
import { Wallet, Car, Users, PlusCircle, X, Phone, User, CreditCard, Hash, DollarSign, MapPin, Briefcase, FileText, Download, Mail, Calendar } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<'investors' | 'inventory' | 'buyers'>('investors');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);

  // Modal State
  const [modalType, setModalType] = useState<'investor' | 'inventory' | 'buyer' | null>(null);

  // Forms State
  const [investorForm, setInvestorForm] = useState({ name: '', phone: '', idNumber: '', idExpiry: '', email: '', balance: '' });
  const [inventoryForm, setInventoryForm] = useState({ type: '', model: '', plateNumber: '', vin: '', price: '' });
  const [buyerForm, setBuyerForm] = useState({ name: '', phone: '', idNumber: '', idExpiry: '', job: '', address: '', email: '' });

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [invData, inventoryData, buyersData] = await Promise.all([
        db.getInvestors(),
        db.getInventory(),
        db.getBuyers()
      ]);
      setInvestors(invData);
      setInventory(inventoryData);
      setBuyers(buyersData);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setInvestorForm({ name: '', phone: '', idNumber: '', idExpiry: '', email: '', balance: '' });
    setInventoryForm({ type: '', model: '', plateNumber: '', vin: '', price: '' });
    setBuyerForm({ name: '', phone: '', idNumber: '', idExpiry: '', job: '', address: '', email: '' });
  };

  const handleSaveInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorForm.name || !investorForm.balance) return;
    
    await db.addInvestor({
      id: Date.now().toString(),
      name: investorForm.name,
      phone: investorForm.phone || '-',
      idNumber: investorForm.idNumber || '-',
      idExpiry: investorForm.idExpiry || undefined,
      email: investorForm.email || undefined,
      balance: Number(investorForm.balance)
    });
    
    closeModal();
    refresh();
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryForm.type || !inventoryForm.price) return;

    await db.addInventory({
      id: Date.now().toString(),
      type: inventoryForm.type,
      model: inventoryForm.model || '-',
      plateNumber: inventoryForm.plateNumber || 'جديد',
      vin: inventoryForm.vin || '-',
      price: Number(inventoryForm.price),
      status: 'available'
    });

    closeModal();
    refresh();
  };

  const handleSaveBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerForm.name || !buyerForm.phone) return;

    await db.addBuyer({
      id: Date.now().toString(),
      name: buyerForm.name,
      phone: buyerForm.phone,
      idNumber: buyerForm.idNumber || '-',
      idExpiry: buyerForm.idExpiry || undefined,
      job: buyerForm.job || '',
      address: buyerForm.address || '',
      email: buyerForm.email || undefined
    });

    closeModal();
    refresh();
  };

  const handleExportBuyers = () => {
    if (buyers.length === 0) {
      alert("لا يوجد بيانات لتصديرها");
      return;
    }

    // Define CSV headers
    const headers = ["الاسم", "رقم التليفون", "الرقم القومي", "الوظيفة", "العنوان"];
    
    // Map data to CSV rows
    const rows = buyers.map(b => [
      `"${b.name}"`, 
      `"${b.phone}"`,
      `"${b.idNumber}"`,
      `"${b.job || ''}"`,
      `"${b.address || ''}"`
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    // Create Blob with BOM for Arabic support
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `buyers_list_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reusable Input Component
  const InputField = ({ label, icon: Icon, ...props }: any) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          className="block w-full pr-10 border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm p-2 border"
          {...props}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">التقارير والإعدادات</h1>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-300 bg-white rounded-t-lg px-2 pt-2 overflow-x-auto">
        <button
          className={`flex items-center gap-2 py-3 px-6 font-bold text-lg transition-colors border-b-4 rounded-t-md whitespace-nowrap ${
            activeTab === 'investors' 
            ? 'text-emerald-700 border-emerald-600 bg-emerald-50' 
            : 'text-slate-600 border-transparent hover:text-slate-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('investors')}
        >
          <Wallet className="w-5 h-5" />
          حسابات الممولين
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-6 font-bold text-lg transition-colors border-b-4 rounded-t-md whitespace-nowrap ${
            activeTab === 'inventory' 
            ? 'text-blue-700 border-blue-600 bg-blue-50' 
            : 'text-slate-600 border-transparent hover:text-slate-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          <Car className="w-5 h-5" />
          جرد المخزون
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-6 font-bold text-lg transition-colors border-b-4 rounded-t-md whitespace-nowrap ${
            activeTab === 'buyers' 
            ? 'text-purple-700 border-purple-600 bg-purple-50' 
            : 'text-slate-600 border-transparent hover:text-slate-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('buyers')}
        >
          <Users className="w-5 h-5" />
          دليل العملاء
        </button>
      </div>

      <div className="bg-white rounded-b-lg shadow-md border border-gray-200 min-h-[400px]">
        {loading ? (
            <div className="p-10 text-center text-gray-500">جاري تحميل البيانات...</div>
        ) : (
            <>
                {/* Investors Tab */}
                {activeTab === 'investors' && (
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">قائمة الممولين والشركاء</h2>
                        <p className="text-slate-500 mt-1">إدارة رؤوس الأموال والأرصدة</p>
                    </div>
                    <Button onClick={() => setModalType('investor')} size="md" className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        إضافة ممول جديد
                    </Button>
                    </div>
                    
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                        <tr className="text-right">
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">الاسم</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">رقم التليفون</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">الرقم القومي</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">تاريخ انتهاء الهوية</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">البريد الإلكتروني</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">رصيد المحفظة</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {investors.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{inv.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">{inv.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">{inv.idNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">{inv.idExpiry || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs dir-ltr text-right">{inv.email || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-lg font-bold text-emerald-700 font-mono bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                {inv.balance.toLocaleString()} ج.م
                                </span>
                            </td>
                            </tr>
                        ))}
                        {investors.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا يوجد بيانات</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">جرد المخزون</h2>
                        <p className="text-slate-500 mt-1">العربيات الموجودة فعلياً وتكلفتها</p>
                    </div>
                    <Button onClick={() => setModalType('inventory')} size="md" className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        إضافة عربية جديدة
                    </Button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                        <tr className="text-right">
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">السيارة</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">بيانات الترخيص</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">سعر التكلفة</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">الحالة</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-bold text-slate-900">{item.type}</div>
                                <div className="text-sm text-slate-500">{item.model}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-700 font-mono">شاسيه: {item.vin}</div>
                                <div className="text-sm text-slate-700 font-mono">نمر: {item.plateNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                                {item.price.toLocaleString()} ج.م
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === 'available' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {item.status === 'available' ? 'متاحة للبيع' : 'تم بيعها'}
                                </span>
                            </td>
                            </tr>
                        ))}
                        {inventory.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">المخزون فارغ</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}

                {/* Buyers Tab */}
                {activeTab === 'buyers' && (
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">دليل العملاء</h2>
                        <p className="text-slate-500 mt-1">بيانات العملاء للتواصل والاستعلام</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExportBuyers} variant="outline" size="md" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            تصدير CSV
                        </Button>
                        <Button onClick={() => setModalType('buyer')} size="md" className="flex items-center gap-2">
                            <PlusCircle className="w-4 h-4" />
                            تسجيل عميل جديد
                        </Button>
                    </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                        <tr className="text-right">
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">الاسم</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">التليفون</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">بيانات شخصية</th>
                            <th className="px-6 py-4 text-sm font-extrabold text-slate-700 uppercase">العنوان</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {buyers.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{b.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-mono dir-ltr text-right">{b.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                <div>{b.idNumber}</div>
                                {b.job && <div className="text-xs text-slate-400">{b.job}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 truncate max-w-xs" title={b.address}>
                                {b.address || '-'}
                            </td>
                            </tr>
                        ))}
                        {buyers.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا يوجد عملاء</td></tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}
            </>
        )}
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {modalType === 'investor' && 'إضافة ممول جديد'}
                {modalType === 'inventory' && 'إضافة سيارة للمخزون'}
                {modalType === 'buyer' && 'تسجيل بيانات عميل'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {modalType === 'investor' && (
                <form onSubmit={handleSaveInvestor}>
                  <InputField label="اسم الممول" icon={User} required value={investorForm.name} onChange={(e: any) => setInvestorForm({...investorForm, name: e.target.value})} placeholder="الاسم ثلاثي" />
                  <InputField label="رقم الموبايل" icon={Phone} value={investorForm.phone} onChange={(e: any) => setInvestorForm({...investorForm, phone: e.target.value})} placeholder="01xxxxxxxxx" />
                  <InputField label="الرقم القومي" icon={CreditCard} value={investorForm.idNumber} onChange={(e: any) => setInvestorForm({...investorForm, idNumber: e.target.value})} placeholder="14 رقم" />
                  <InputField label="تاريخ انتهاء الهوية" icon={Calendar} type="date" value={investorForm.idExpiry} onChange={(e: any) => setInvestorForm({...investorForm, idExpiry: e.target.value})} />
                  <InputField label="البريد الإلكتروني" icon={Mail} type="email" value={investorForm.email} onChange={(e: any) => setInvestorForm({...investorForm, email: e.target.value})} placeholder="email@example.com" />
                  <InputField label="رصيد المحفظة الافتتاحي" icon={DollarSign} required type="number" value={investorForm.balance} onChange={(e: any) => setInvestorForm({...investorForm, balance: e.target.value})} placeholder="المبلغ بالجنيه" />
                  <Button type="submit" className="w-full mt-4">حفظ البيانات</Button>
                </form>
              )}

              {modalType === 'inventory' && (
                <form onSubmit={handleSaveInventory}>
                  <InputField label="نوع السيارة" icon={Car} required value={inventoryForm.type} onChange={(e: any) => setInventoryForm({...inventoryForm, type: e.target.value})} placeholder="مثال: تويوتا كورولا" />
                  <InputField label="الموديل / السنة" icon={Hash} value={inventoryForm.model} onChange={(e: any) => setInventoryForm({...inventoryForm, model: e.target.value})} placeholder="مثال: 2024" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="رقم اللوحة" icon={FileText} value={inventoryForm.plateNumber} onChange={(e: any) => setInventoryForm({...inventoryForm, plateNumber: e.target.value})} placeholder="أ ب ج 1 2 3" />
                    <InputField label="رقم الشاسيه" icon={Hash} value={inventoryForm.vin} onChange={(e: any) => setInventoryForm({...inventoryForm, vin: e.target.value})} placeholder="آخر 6 أرقام" />
                  </div>
                  <InputField label="سعر التكلفة (الشراء)" icon={DollarSign} required type="number" value={inventoryForm.price} onChange={(e: any) => setInventoryForm({...inventoryForm, price: e.target.value})} placeholder="المبلغ الفعلي" />
                  <Button type="submit" className="w-full mt-4">إضافة للمخزون</Button>
                </form>
              )}

              {modalType === 'buyer' && (
                <form onSubmit={handleSaveBuyer}>
                  <InputField label="اسم العميل" icon={User} required value={buyerForm.name} onChange={(e: any) => setBuyerForm({...buyerForm, name: e.target.value})} placeholder="الاسم رباعي" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="رقم الموبايل" icon={Phone} required value={buyerForm.phone} onChange={(e: any) => setBuyerForm({...buyerForm, phone: e.target.value})} placeholder="01xxxxxxxxx" />
                    <InputField label="الرقم القومي" icon={CreditCard} value={buyerForm.idNumber} onChange={(e: any) => setBuyerForm({...buyerForm, idNumber: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="تاريخ انتهاء الهوية" icon={Calendar} type="date" value={buyerForm.idExpiry} onChange={(e: any) => setBuyerForm({...buyerForm, idExpiry: e.target.value})} />
                    <InputField label="البريد الإلكتروني" icon={Mail} type="email" value={buyerForm.email} onChange={(e: any) => setBuyerForm({...buyerForm, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  <InputField label="الوظيفة" icon={Briefcase} value={buyerForm.job} onChange={(e: any) => setBuyerForm({...buyerForm, job: e.target.value})} />
                  <InputField label="العنوان" icon={MapPin} value={buyerForm.address} onChange={(e: any) => setBuyerForm({...buyerForm, address: e.target.value})} placeholder="العنوان بالتفصيل" />
                  <Button type="submit" className="w-full mt-4">تسجيل العميل</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;