import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { TitleTransferContract } from '../types';
import { Button } from './ui/Button';
import { FileSignature } from 'lucide-react';

const TitleTransferContracts = () => {
  const [contracts, setContracts] = useState<TitleTransferContract[]>([]);
  const [formData, setFormData] = useState<Partial<TitleTransferContract>>({});
  const [showForm, setShowForm] = useState(false);
  const [viewContract, setViewContract] = useState<TitleTransferContract | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-print when a contract is selected for printing
  useEffect(() => {
    if (isPrinting && viewContract) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);

      const handleAfterPrint = () => {
        setIsPrinting(false);
        setViewContract(null);
      };

      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting, viewContract]);

  const fetchData = async () => {
    const data = await db.getTitleTransfers();
    setContracts(data);
  }

  const handlePrint = (contract: TitleTransferContract) => {
    setViewContract(contract);
    setIsPrinting(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newContract = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    } as TitleTransferContract;

    await db.addTitleTransfer(newContract);
    await fetchData();
    setShowForm(false);
    setFormData({});
  };

  const InputGroup = ({ label, prop, type="text" }: {label: string, prop: keyof TitleTransferContract, type?: string}) => (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-1">{label}</label>
      <input
        type={type}
        required
        className="mt-1 block w-full rounded-md border-2 border-slate-300 p-2 focus:ring-primary focus:border-primary text-slate-900 font-medium"
        value={formData[prop] as string || ''}
        onChange={(e) => setFormData({...formData, [prop]: e.target.value})}
      />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileSignature className="w-8 h-8 text-primary" />
            عقود البيع والتوكيلات
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : 'تسجيل عقد / توكيل جديد'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-bold text-lg border-b border-slate-200 pb-2 text-primary">بيانات العقد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InputGroup label="رقم المحضر / العقد" prop="manualId" />
               <InputGroup label="قيمة البيع (في العقد)" prop="price" type="number" />
               <InputGroup label="عمولة / مصاريف إدارية" prop="serviceFees" type="number" />
            </div>

            <h3 className="font-bold text-lg border-b border-slate-200 pb-2 pt-4 text-primary">بيانات العربية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputGroup label="الماركة" prop="vehicleType" />
              <InputGroup label="الموديل" prop="vehicleModel" />
              <InputGroup label="رقم النمر (اللوحة)" prop="plateNumber" />
              <InputGroup label="رقم الشاسيه" prop="vin" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-extrabold text-slate-800 text-lg mb-2">البائع (صاحب الرخصة)</h4>
                <InputGroup label="الاسم رباعي" prop="sellerName" />
                <InputGroup label="الرقم القومي" prop="sellerIdNumber" />
              </div>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-extrabold text-slate-800 text-lg mb-2">المشتري</h4>
                <InputGroup label="الاسم رباعي" prop="buyerName" />
                <InputGroup label="الرقم القومي" prop="buyerIdNumber" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="px-8">حفظ العقد</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم العقد</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase">البائع</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase">المشتري</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase">العربية</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase">السعر</th>
              <th className="px-6 py-4 text-right text-sm font-bold uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {contracts.map((c, idx) => (
              <tr key={c.id} className={`hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-700">{c.manualId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-medium">{c.sellerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-medium">{c.buyerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{c.vehicleType} - <span className="font-bold">{c.plateNumber}</span></td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-700">{Number(c.price).toLocaleString()} ج.م</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => handlePrint(c)}>
                    طباعة
                  </Button>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">مفيش عقود متسجلة لسه</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Print Portal - عقد نقل / بيع كما في النموذج الورقي */}
      {isPrinting && viewContract && createPortal(
        <div className="p-8 max-w-[210mm] mx-auto bg-white text-black print-content" dir="rtl">
          {/* Header */}
          <div className="mb-4 pb-3 border-b-2 border-gray-800 flex justify-between items-start">
            <div className="text-right">
              <h1 className="text-2xl font-extrabold mb-2 text-gray-900">عقد بيع ونقل ملكية سيارة</h1>
              <p className="text-base font-bold">تاريخ التحرير: {new Date(viewContract.createdAt).toLocaleDateString('ar-EG')}</p>
              <p className="text-base font-bold">رقم العقد / المحضر: <span className="font-mono text-xl">{viewContract.manualId}</span></p>
            </div>
          </div>

          {/* Vehicle Details Table */}
          <div className="mb-4 border-2 border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-800 -webkit-print-color-adjust-exact">
                <tr>
                  <th className="border border-gray-800 p-2 text-center">نوع السيارة</th>
                  <th className="border border-gray-800 p-2 text-center">الموديل</th>
                  <th className="border border-gray-800 p-2 text-center">رقم اللوحة</th>
                  <th className="border border-gray-800 p-2 text-center">البديل</th>
                  <th className="border border-gray-800 p-2 text-center">رقم الهيكل</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-3 min-h-[26px] text-center">{viewContract.vehicleType}</td>
                  <td className="border border-gray-800 p-3 min-h-[26px] text-center">{viewContract.vehicleModel}</td>
                  <td className="border border-gray-800 p-3 min-h-[26px] text-center">{viewContract.plateNumber}</td>
                  <td className="border border-gray-800 p-3 min-h-[26px]"></td>
                  <td className="border border-gray-800 p-3 min-h-[26px] text-center">{viewContract.vin}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Parties */}
          <div className="space-y-3 mb-4">
            <div className="border-2 border-gray-800 p-4 rounded-lg bg-white">
              <h3 className="font-bold text-lg mb-3 text-gray-900">الطرف الأول البائع ..</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-16 font-bold">الاسم</span>
                  <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block">{viewContract.sellerName}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-bold">رقم الهوية</span>
                    <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block">{viewContract.sellerIdNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 font-bold">تاريخها ومصدرها</span>
                    <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 font-bold">جوال</span>
                    <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-800 p-4 rounded-lg bg-white">
              <h3 className="font-bold text-lg mb-3 text-gray-900">الطرف الثاني المشتري ..</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-16 font-bold">الاسم</span>
                  <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block">{viewContract.buyerName}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-bold">رقم الهوية</span>
                    <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block">{viewContract.buyerIdNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 font-bold">تاريخها ومصدرها</span>
                    <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 font-bold">جوال</span>
                    <span className="flex-1 border-b border-gray-800 min-h-[22px] inline-block"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions & Financial Box */}
          <div className="flex gap-6 mb-6">
            <div className="flex-1 space-y-3 text-sm leading-relaxed">
              <p>
                ١- يقر الطرف الأول البائع بأنه باع سيارته الموضحة أعلاه للطرف الثاني المشتري، واستلم كامل قيمة البيع المتفق عليها،
                ولا يحق له الرجوع على الطرف الثاني بأي مطالبة مالية بعد ذلك.
              </p>
              <p>
                ٢- يقر الطرف الثاني المشتري بأنه عاين السيارة معاينة تامة نافية للجهالة، وقبلها بالحالة الراهنة، وأن أي مخالفات أو
                غرامات أو التزامات على السيارة قبل تاريخ هذا العقد تكون مسؤولية الطرف الأول وحده.
              </p>
              <p>
                ٣- يلتزم الطرفان الحضور لإتمام إجراءات نقل الملكية لدى الجهات المختصة، كما يلتزم الطرف الثاني بسداد الرسوم
                المستحقة لنقل الملكية وما قد يطرأ من مصروفات نظامية.
              </p>
            </div>

            <div className="w-56 border-2 border-gray-800 rounded-lg overflow-hidden text-sm">
              <div className="bg-gray-100 text-center font-bold py-2 border-b border-gray-800 -webkit-print-color-adjust-exact">
                قيمة المبايعة
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-bold">رسوم المرور</td>
                    <td className="border border-gray-800 px-2 py-1"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-bold">رسوم</td>
                    <td className="border border-gray-800 px-2 py-1"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-bold">الضريبة</td>
                    <td className="border border-gray-800 px-2 py-1"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-bold">الصافي</td>
                    <td className="border border-gray-800 px-2 py-1 text-center font-bold">{Number(viewContract.price).toLocaleString()} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sale place checkboxes */}
          <div className="flex items-center gap-6 mb-8 text-sm font-bold">
            <label className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 border border-gray-800"></span>
              تمت المبايعة
            </label>
            <label className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 border border-gray-800"></span>
              داخل المعرض
            </label>
            <label className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 border border-gray-800"></span>
              خارج المعرض
            </label>
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-8 px-8">
            <div className="text-center w-1/3">
              <p className="font-bold mb-6">الطرف الأول البائع</p>
              <div className="border-b border-gray-800 mb-4"></div>
              <div className="border-b border-gray-800"></div>
            </div>
            <div className="text-center w-1/3">
              <p className="font-bold mb-6">الطرف الثاني المشتري</p>
              <div className="border-b border-gray-800 mb-4"></div>
              <div className="border-b border-gray-800"></div>
            </div>
            <div className="text-center w-1/3">
              <p className="font-bold mb-6">الطرف الثالث المعرض</p>
              <div className="border-b border-gray-800 mb-4"></div>
              <div className="border-b border-gray-800"></div>
            </div>
          </div>
        </div>,
        document.getElementById('print-root') as HTMLElement
      )}
    </div>
  );
};

export default TitleTransferContracts;