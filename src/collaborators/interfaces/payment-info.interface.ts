export interface BankAccountInfo {
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode: string;
  routingNumber?: string;
  iban?: string;
}

export interface PaypalInfo {
  email: string;
  accountId?: string;
}

export interface CryptoWalletInfo {
  walletAddress: string;
  network: 'ETH' | 'BTC' | 'USDT';
}

export type PaymentInfo = {
  preferredMethod: 'bankAccount' | 'paypal' | 'crypto';
  bankAccount?: BankAccountInfo;
  paypal?: PaypalInfo;
  cryptoWallet?: CryptoWalletInfo;
  currency: string;
  taxResidenceCountry: string;
};
