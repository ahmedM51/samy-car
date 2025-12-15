export enum ContractType {
  Promise = 'إيصال أمانة',
  Installment = 'عقد تقسيط مباشر',
  PromiseAndInstallment = 'شيكات بنكية'
}

export enum PaymentStatus {
  Pending = 'مطلوب دفعه',
  Paid = 'تم السداد',
  Overdue = 'متأخر'
}

export interface InventoryItem {
  id: string;
  type: string;
  model: string;
  plateNumber: string;
  vin: string; // chassis number
  price: number;
  status: 'available' | 'sold';
}

export interface Investor {
  id: string;
  name: string;
  idNumber: string;
  idExpiry?: string;
  phone: string;
  email?: string;
  balance: number;
}

export interface Buyer {
  id: string;
  name: string;
  idNumber: string;
  idExpiry: string; // Required ID expiry date
  phone: string;
  job?: string;
  address?: string;
  email: string; // Required email
}

export interface Installment {
  id: string;
  contractId: string;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paidDate?: string;
}

export interface InstallmentContract {
  id: string;
  manualId: string; // Paper contract number
  type: ContractType;
  createdAt: string;
  buyerId: string;
  guarantorId?: string; // Optional guarantor
  investorId: string;
  inventoryIds: string[];
  totalItemValue: number; // Cost of items
  serviceFee: number; // Profit/Service fee
  totalAmount: number; // Total debt
  status: 'active' | 'closed';
  notes?: string;
}

export interface TitleTransferContract {
  id: string;
  manualId: string;
  createdAt: string;
  sellerName: string;
  sellerIdNumber: string;
  buyerName: string;
  buyerIdNumber: string;
  vehicleType: string;
  vehicleModel: string;
  plateNumber: string;
  vin: string;
  price: number;
  serviceFees: number;
}

export interface ShowroomItem {
  id: string;
  ownerName: string;
  ownerPhone: string;
  type: string;
  plateNumber: string;
  previousPrice: number;
  sellingPrice: number;
  condition: string;
  status: 'received' | 'sold' | 'returned';
  entryDate: string;
}

// Helper type for full contract details view
export interface ContractWithDetails extends InstallmentContract {
  buyer: Buyer;
  investor: Investor;
  installments: Installment[];
}