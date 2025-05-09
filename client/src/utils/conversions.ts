const COINGECKO_ETH_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch(COINGECKO_ETH_PRICE_URL);
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    throw new Error('Failed to fetch ETH price');
  }
}

export async function usdToWei(usdAmount: number): Promise<bigint> {
  const ethPrice = await getEthPrice();
  const ethAmount = usdAmount / ethPrice;
  const weiAmount = BigInt(Math.floor(ethAmount * 1e18));
  return weiAmount;
}