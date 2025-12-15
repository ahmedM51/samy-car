import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';

interface CompanySettingsData {
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

const STORAGE_KEY = 'companySettings';

const CompanySettings: React.FC = () => {
  const [form, setForm] = useState<CompanySettingsData>({
    companyName: '',
    logoUrl: '',
    taxNumber: '',
    phone: '',
    email: '',
    showName: true,
    showLogo: true,
    showTaxNumber: true,
    showPhone: true,
    showEmail: true,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CompanySettingsData>;
        setForm(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load company settings', error);
    }
  }, []);

  const handleChange = (field: keyof CompanySettingsData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save company settings', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">إعدادات الشركة</h1>
          <p className="text-slate-500 mt-1 text-sm">
            ضبط بيانات الشركة والتحكم في ظهورها في المطبوعات لاحقاً
          </p>
        </div>
        {saved && (
          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            تم الحفظ
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="مثال: معرض أحمد للسيارات"
                value={form.companyName}
                onChange={handleChange('companyName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرابط الخاص بالشعار</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-left dir-ltr"
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={handleChange('logoUrl')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-left dir-ltr"
                placeholder="الرقم الضريبي"
                value={form.taxNumber}
                onChange={handleChange('taxNumber')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-left dir-ltr"
                placeholder="01xxxxxxxxx"
                value={form.phone}
                onChange={handleChange('phone')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-left dir-ltr"
                placeholder="info@company.com"
                value={form.email}
                onChange={handleChange('email')}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-2">
            <h2 className="text-lg font-bold text-slate-800 mb-3">الظهور في المطبوعات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.showName}
                  onChange={handleChange('showName')}
                />
                <span>إظهار اسم الشركة في العقود والمطبوعات</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.showLogo}
                  onChange={handleChange('showLogo')}
                />
                <span>إظهار الشعار</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.showTaxNumber}
                  onChange={handleChange('showTaxNumber')}
                />
                <span>إظهار الرقم الضريبي</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.showPhone}
                  onChange={handleChange('showPhone')}
                />
                <span>إظهار رقم الجوال</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.showEmail}
                  onChange={handleChange('showEmail')}
                />
                <span>إظهار البريد الإلكتروني</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="px-6 py-2 font-bold">
              حفظ الإعدادات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
