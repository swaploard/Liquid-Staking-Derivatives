import { create } from "zustand";

interface CollateralData {
  stETH: number;
  rETH: number;
  bETH: number;
  total: number;
}

interface BorrowedInfo {
  borrowableLimit: number;
  bETHToUSD: number;
  helthFactor: number;
  borrowedAmount: number;
}

interface VaultState {
  collateralData: CollateralData;
  borrowedInfo: BorrowedInfo;
  setCollateralData: (stETH: number, rETH: number, bETH: number, total: number) => void;
  setBorrowedInfo: (borrowableLimit: number, bETHToUSD: number, helthFactor: number, borrowedAmount: number) => void;
}

export const vaultStore = create<VaultState>((set) => ({
  collateralData: {
    stETH: 0,
    rETH: 0,
    bETH: 0,
    total: 0,
  },
  borrowedInfo: {
    borrowableLimit: 0,
    bETHToUSD: 0,
    helthFactor: 0,
    borrowedAmount: 0,
  },
  setCollateralData: (stETH, rETH, bETH, total) =>
    set((state) => ({
      collateralData: { ...state.collateralData, stETH, rETH, bETH, total },
    })),
  setBorrowedInfo: (borrowableLimit, bETHToUSD, helthFactor, borrowedAmount) =>
    set((state) => ({
      borrowedInfo: { ...state.borrowedInfo, borrowableLimit, bETHToUSD, helthFactor, borrowedAmount },
    })),
}));