export enum PaymentMethod {
  SepaDirectDebit = 'sepa_direct_debit',
  CreditCard = 'credit_card',
  GooglePay = 'google_pay',
  ApplePay = 'apple_pay',
  BankTransfer = 'bank_transfer'
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = Object.values(PaymentMethod);

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.SepaDirectDebit]: 'SEPA direct debit',
  [PaymentMethod.CreditCard]: 'Credit card',
  [PaymentMethod.GooglePay]: 'Google Pay',
  [PaymentMethod.ApplePay]: 'Apple Pay',
  [PaymentMethod.BankTransfer]: 'Bank transfer'
};
