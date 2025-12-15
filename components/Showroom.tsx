import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { ShowroomItem } from '../types';
import { Button } from './ui/Button';
import { Car, Key, Tag, User, Phone, FileText, DollarSign } from 'lucide-react';

const Showroom = () => {
  const [items, setItems] = useState<ShowroomItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ShowroomItem>>({
    status: 'received',
    ownerName: '',
    ownerPhone: '',
    type: '',
    plateNumber: '',
    previousPrice: 0,
    sellingPrice: 0,
    condition: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await db.getShowroomItems();
    setItems(data);
  }

  const handleSave = async () => {
    // Validation
    if (!formData.ownerName || !formData.plateNumber || !formData.type || !formData.sellingPrice) {
      alert("من فضلك أكمل البيانات الأساسية: (اسم المالك، نوع العربية، رقم اللوحة، وسعر البيع)");
      return;
    }
    
    try {
      const newItem: ShowroomItem = {
        id: Date.now().toString(),
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone || '-',
        type: formData.type,
        plateNumber: formData.plateNumber,
        previousPrice: Number(formData.previousPrice) || 0,
        sellingPrice: Number(formData.sellingPrice),
        condition: formData.condition || '-',
        status: 'received',
        entryDate: new Date().toISOString()
      };
      
      await db.addShowroomItem(newItem);
      await fetchData();
      setIsModalOpen(false);
      // Reset Form
      setFormData({
        status: 'received',
        ownerName: '',
        ownerPhone: '',
        type: '',
        plateNumber: '',
        previousPrice: 0,
        sellingPrice: 0,
        condition: ''
      });
      alert("تم حفظ العربية في المعرض بنجاح");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Car className="w-8 h-8 text-primary" />
            إدارة المعرض (الأمانات)
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>تسجيل دخول عربية</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow relative overflow-hidden">
            {item.status === 'sold' && <div className="absolute top-0 left-0 bg-green-500 text-white px-8 py-1 text-sm font-bold -rotate-45 transform -translate-x-8 translate-y-4">مباعة</div>}
            
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-slate-400" />
                  {item.type}
              </h3>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                item.status === 'received' ? 'bg-blue-100 text-blue-800' : 
                item.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {item.status === 'received' ? 'متاحة للبيع' : item.status === 'sold' ? 'اتباعت' : 'رجعت لصاحبها'}
              </span>
            </div>
            <div className="space-y-3 text-sm">
                <p className="text-slate-600 flex justify-between">
                    <span className="flex items-center gap-1"><FileText size={16}/> اللوحة:</span> 
                    <span className="font-mono font-bold bg-slate-100 px-2 rounded text-slate-900">{item.plateNumber}</span>
                </p>
                <p className="text-slate-600 flex justify-between">
                    <span className="flex items-center gap-1"><User size={16}/> المالك:</span>
                    <span className="font-bold text-slate-800">{item.ownerName}</span>
                </p>
                <p className="text-slate-600 flex justify-between">
                    <span className="flex items-center gap-1"><Phone size={16}/> تليفون:</span>
                    <span className="font-mono text-slate-800">{item.ownerPhone}</span>
                </p>
                <p className="text-slate-600 flex justify-between items-center">
                    <span className="flex items-center gap-1"><DollarSign size={16}/> مطلوب:</span>
                    <span className="font-extrabold text-emerald-600 text-lg bg-emerald-50 px-2 rounded">{Number(item.sellingPrice).toLocaleString()} ج.م</span>
                </p>
                {Number(item.previousPrice) > 0 && (
                   <p className="text-slate-400 flex justify-between items-center text-xs">
                     <span>صافي للمالك:</span>
                     <span>{Number(item.previousPrice).toLocaleString()} ج.م</span>
                   </p>
                )}
                <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-50 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    دخلت المعرض: {new Date(item.entryDate).toLocaleDateString('ar-EG')}
                </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
                لا توجد سيارات في المعرض حالياً
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold mb-6 text-slate-800 border-b pb-4">استلام عربية جديدة (أمانة/بيع)</h2>
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم صاحب العربية <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الموبايل</label>
                  <input 
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.ownerPhone}
                    onChange={e => setFormData({...formData, ownerPhone: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">نوع العربية والموديل <span className="text-red-500">*</span></label>
                  <input 
                    placeholder="مثلاً: لانسر شارك 2016" 
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم اللوحة <span className="text-red-500">*</span></label>
                  <input 
                    placeholder="أ ب ج 1 2 3" 
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.plateNumber}
                    onChange={e => setFormData({...formData, plateNumber: e.target.value})}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">صافي لصاحبها</label>
                    <input 
                    type="number"
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.previousPrice || ''}
                    onChange={e => setFormData({...formData, previousPrice: Number(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">سعر البيع <span className="text-red-500">*</span></label>
                    <input 
                    type="number"
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.sellingPrice || ''}
                    onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                    />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات الحالة</label>
                  <textarea 
                    placeholder="فبريكا؟ فيها رش؟" 
                    className="w-full border-2 border-slate-300 p-2 rounded-lg focus:border-primary text-slate-900 font-medium"
                    value={formData.condition}
                    onChange={e => setFormData({...formData, condition: e.target.value})}
                  />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
                <Button onClick={handleSave}>حفظ في المعرض</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Showroom;