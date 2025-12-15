import { supabase } from './supabase';
import { 
  InventoryItem, Investor, Buyer, InstallmentContract, 
  Installment, ShowroomItem, TitleTransferContract, 
  PaymentStatus 
} from '../types';

// دالة مساعدة للتحقق من أخطاء الجداول المفقودة والصلاحيات
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.code === '42P01') {
    // Table undefined
    alert(`عاجل: الجداول غير موجودة في قاعدة البيانات.\n\nالحل:\n1. اذهب إلى صفحة "الرئيسية" في القائمة.\n2. انسخ كود SQL المعروض في المربع الأسود.\n3. اذهب إلى مشروعك في Supabase > SQL Editor.\n4. الصق الكود واضغط Run.`);
  } else if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('violates row-level security policy')) {
    // RLS Violation
    alert(`عاجل: مشكلة في الصلاحيات (RLS).\nقاعدة البيانات تمنع الحفظ لأن سياسات الحماية مفعلة.\n\nالحل:\n1. اذهب إلى صفحة "الرئيسية".\n2. انسخ كود SQL.\n3. شغله في Supabase SQL Editor لتعطيل القيود.`);
  } else if (error.code === '23505') {
    // Unique violation
    alert(`خطأ: تكرار في البيانات (${context}).\nيبدو أن هذا العنصر مسجل بالفعل برقم تعريفي موجود مسبقاً.`);
  } else if (error.code === '23503') {
    // Foreign key violation
    alert(`خطأ: بيانات مرتبطة غير موجودة.\nأنت تحاول إضافة بيانات تعتمد على سجل آخر غير موجود (مثلاً: بيع لعميل غير مسجل).\nتأكد من تسجيل الأطراف (العميل/الممول) أولاً.`);
  } else {
    alert(`حدث خطأ غير متوقع أثناء ${context}:\n${error.message || JSON.stringify(error)}`);
  }
};

class RealDB {
  
  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> { 
    const { data, error } = await supabase.from('inventory').select('*');
    if (error) {
      console.error("Error fetching inventory", error);
      if (error.code === '42P01') return []; 
    }
    return (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      model: item.model,
      plateNumber: item.plate_number,
      vin: item.vin,
      price: item.price,
      status: item.status
    }));
  }

  async addInventory(item: InventoryItem) { 
    const { error } = await supabase.from('inventory').insert({
      id: item.id,
      type: item.type,
      model: item.model,
      plate_number: item.plateNumber,
      vin: item.vin,
      price: item.price,
      status: item.status
    });
    if (error) handleError(error, 'إضافة عربية');
  }

  // Helper to update vehicle status regardless of table (Inventory or Showroom)
  async updateVehicleStatus(id: string, status: 'available' | 'sold') {
    // 1. Check if it's in Inventory
    const { data: invData } = await supabase.from('inventory').select('id').eq('id', id);
    
    if (invData && invData.length > 0) {
        // It's an inventory item
        const { error } = await supabase.from('inventory').update({ status }).eq('id', id);
        if (error) handleError(error, 'تحديث حالة العربية (مخزون)');
    } else {
        // 2. Try Showroom
        // Map status: available -> received, sold -> sold
        const showroomStatus = status === 'available' ? 'received' : 'sold';
        const { error: showError } = await supabase.from('showroom').update({ status: showroomStatus }).eq('id', id);
        if (showError) handleError(showError, 'تحديث حالة العربية (معرض)');
    }
  }

  // --- Investors ---
  async getInvestors(): Promise<Investor[]> { 
    const { data, error } = await supabase.from('investors').select('*');
    if (error && error.code === '42P01') console.error('Investors table missing');
    return (data || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      idNumber: i.id_number,
      idExpiry: i.id_expiry,
      phone: i.phone,
      email: i.email,
      balance: i.balance
    }));
  }

  async addInvestor(item: Investor) {
    const { error } = await supabase.from('investors').insert({
      id: item.id,
      name: item.name,
      id_number: item.idNumber,
      id_expiry: item.idExpiry,
      phone: item.phone,
      email: item.email,
      balance: item.balance
    });
    if (error) handleError(error, 'إضافة ممول');
  }

  async updateInvestorBalance(id: string, amountChange: number) {
    const { data, error: fetchError } = await supabase.from('investors').select('balance').eq('id', id).single();
    
    if (fetchError) {
      handleError(fetchError, 'جلب رصيد الممول');
      return;
    }

    if (data) {
      const newBalance = Number(data.balance) - amountChange;
      const { error: updateError } = await supabase.from('investors').update({ balance: newBalance }).eq('id', id);
      if (updateError) handleError(updateError, 'تحديث رصيد الممول');
    }
  }

  // --- Buyers ---
  async getBuyers(): Promise<Buyer[]> { 
    const { data, error } = await supabase.from('buyers').select('*');
    if (error && error.code === '42P01') console.error('Buyers table missing');
    return (data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      idNumber: b.id_number,
      idExpiry: b.id_expiry,
      phone: b.phone,
      job: b.job,
      address: b.address,
      email: b.email
    }));
  }

  async addBuyer(item: Buyer) {
    const { error } = await supabase.from('buyers').insert({
      id: item.id,
      name: item.name,
      id_number: item.idNumber,
      id_expiry: item.idExpiry,
      phone: item.phone,
      job: item.job,
      address: item.address,
      email: item.email
    });
    if (error) handleError(error, 'إضافة عميل');
  }

  // --- Contracts ---
  async getContracts(): Promise<InstallmentContract[]> { 
    const { data, error } = await supabase.from('contracts').select('*');
    if (error) {
        console.error('Error fetching contracts', error);
        return [];
    }
    return (data || []).map((c: any) => ({
      id: c.id,
      manualId: c.manual_id,
      type: c.type,
      createdAt: c.created_at,
      buyerId: c.buyer_id,
      guarantorId: c.guarantor_id,
      investorId: c.investor_id,
      inventoryIds: c.inventory_ids || [],
      totalItemValue: c.total_item_value,
      serviceFee: c.service_fee,
      totalAmount: c.total_amount,
      status: c.status,
      notes: c.notes
    }));
  }

  async addContract(contract: InstallmentContract, installments: Installment[]) {
    // 1. Insert Contract
    const { error: cErr } = await supabase.from('contracts').insert({
      id: contract.id,
      manual_id: contract.manualId,
      type: contract.type,
      created_at: contract.createdAt,
      buyer_id: contract.buyerId,
      guarantor_id: contract.guarantorId,
      investor_id: contract.investorId,
      inventory_ids: contract.inventoryIds,
      total_item_value: contract.totalItemValue,
      service_fee: contract.serviceFee,
      total_amount: contract.totalAmount,
      status: contract.status
    });

    if (cErr) {
      handleError(cErr, 'إنشاء العقد');
      return;
    }

    // 2. Insert Installments
    const mappedInstallments = installments.map(i => ({
      id: i.id,
      contract_id: i.contractId,
      due_date: i.dueDate,
      amount: i.amount,
      status: i.status
    }));

    const { error: iErr } = await supabase.from('installments').insert(mappedInstallments);
    if (iErr) {
        handleError(iErr, 'إنشاء الأقساط');
        return;
    }

    // 3. Update Inventory OR Showroom
    for (const invId of contract.inventoryIds) {
      await this.updateVehicleStatus(invId, 'sold');
    }

    // 4. Update Investor (Deduct cost from balance)
    await this.updateInvestorBalance(contract.investorId, contract.totalItemValue);
  }

  // --- Installments ---
  async getInstallmentsByContract(contractId: string): Promise<Installment[]> {
    const { data } = await supabase.from('installments')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true });
    
    return (data || []).map((i: any) => ({
      id: i.id,
      contractId: i.contract_id,
      dueDate: i.due_date,
      amount: i.amount,
      status: i.status,
      paidDate: i.paid_date
    }));
  }

  async getAllInstallments(): Promise<Installment[]> {
    const { data } = await supabase.from('installments').select('*');
    return (data || []).map((i: any) => ({
      id: i.id,
      contractId: i.contract_id,
      dueDate: i.due_date,
      amount: i.amount,
      status: i.status,
      paidDate: i.paid_date
    }));
  }
  
  async payInstallment(id: string) {
    const { error } = await supabase.from('installments').update({
      status: PaymentStatus.Paid,
      paid_date: new Date().toISOString()
    }).eq('id', id);
    
    if(error) handleError(error, 'تحصيل القسط');
  }

  // --- Showroom ---
  async getShowroomItems(): Promise<ShowroomItem[]> { 
    const { data, error } = await supabase.from('showroom').select('*');
    if (error && error.code === '42P01') console.error('Showroom table missing');
    return (data || []).map((s: any) => ({
      id: s.id,
      ownerName: s.owner_name,
      ownerPhone: s.owner_phone,
      type: s.type,
      plateNumber: s.plate_number,
      previousPrice: s.previous_price,
      sellingPrice: s.selling_price,
      condition: s.condition,
      status: s.status,
      entryDate: s.entry_date
    }));
  }

  async addShowroomItem(item: ShowroomItem) {
    const { error } = await supabase.from('showroom').insert({
      id: item.id,
      owner_name: item.ownerName,
      owner_phone: item.ownerPhone,
      type: item.type,
      plate_number: item.plateNumber,
      previous_price: item.previousPrice,
      selling_price: item.sellingPrice,
      condition: item.condition,
      status: item.status,
      entry_date: item.entryDate
    });
    if (error) handleError(error, 'إضافة للمعرض');
  }

  // --- Title Transfers ---
  async getTitleTransfers(): Promise<TitleTransferContract[]> { 
    const { data, error } = await supabase.from('title_transfers').select('*');
    if (error && error.code === '42P01') console.error('Title Transfers table missing');
    return (data || []).map((t: any) => ({
      id: t.id,
      manualId: t.manual_id,
      createdAt: t.created_at,
      sellerName: t.seller_name,
      sellerIdNumber: t.seller_id_number,
      buyerName: t.buyer_name,
      buyerIdNumber: t.buyer_id_number,
      vehicleType: t.vehicle_type,
      vehicleModel: t.vehicle_model,
      plateNumber: t.plate_number,
      vin: t.vin,
      price: t.price,
      serviceFees: t.service_fees
    }));
  }

  async addTitleTransfer(item: TitleTransferContract) {
    const { error } = await supabase.from('title_transfers').insert({
      id: item.id,
      manual_id: item.manualId,
      created_at: item.createdAt,
      seller_name: item.sellerName,
      seller_id_number: item.sellerIdNumber,
      buyer_name: item.buyerName,
      buyer_id_number: item.buyerIdNumber,
      vehicle_type: item.vehicleType,
      vehicle_model: item.vehicleModel,
      plate_number: item.plateNumber,
      vin: item.vin,
      price: item.price,
      service_fees: item.serviceFees
    });
    if (error) handleError(error, 'عقد توكيل/بيع');
  }
}

export const db = new RealDB();