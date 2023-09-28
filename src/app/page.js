'use client';

import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from "lodash";
import { AutoComplete } from "@/components/AutoComplete"
import { useState, useCallback, useEffect } from "react"
import { setWatchList } from '@/features/stock/stockSlice';

const FUGLE_API = process.env.NEXT_PUBLIC_FUGLE_API_KEY;
const FUGLE_END_POINT = process.env.NEXT_PUBLIC_FUGLE_END_POINT;
import StockCalendar from '@/components/StockCalendar';

const getQuotesByMarket = async (market) => {
  const res = await fetch(`${FUGLE_END_POINT}/snapshot/quotes/${market}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': FUGLE_API,
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  const response = await res.json();
  const { data } = response;
  return data;
};

export default function Home() {
  const [isLoading, setLoading] = useState(false)
  const [stockOptionList, setStockOptionList] = useState([])
  const [allStocks, setAllStocks] = useState([])

  const stockWatchList = useSelector((state) => state.stock.watchList);
  const dispatch = useDispatch();
  const [currentSymbol, setCurrentSymbol] = useState('');

  useEffect(() => {
    // fetch all TSE stocks
    async function setAllStock() {
      setLoading(true);
      try {
        const tseStocks = await getQuotesByMarket('TSE');
        const otcStocks = await getQuotesByMarket('OTC');
        setAllStocks([...tseStocks, ...otcStocks]);
      } catch (error) {
        throw new Error(error);
      } finally {
        setLoading(false);
      }
    }
    setAllStock();
  }, []);

  const setStockOptions = useCallback((value) => {
    const matchedStock = allStocks.filter(((item) => item.symbol.includes(value) || item.name.includes(value)));
    if (matchedStock.length > 0) {
      const resultList = matchedStock.map((item) => {
        return { value: item.symbol, label: `${item.symbol} - ${item.name}`, ...item }
      });
      setStockOptionList(resultList);
    } else {
      setStockOptionList([]);
    }
  }, [allStocks]);

  const handleInputValueChange = useCallback((value) => {
    if (value) {
      setStockOptions(value);
    } else {
      setStockOptionList([]);
      setCurrentSymbol('');
    }
  }, [setStockOptions]);

  const debounceInputValueChange = useMemo(
    () => debounce(handleInputValueChange, 250)
  , [handleInputValueChange]);

  const handleItemSelected = useCallback(async (option) => {
    dispatch(setWatchList(option));
    setCurrentSymbol(option?.symbol || '');
  }, [dispatch]);

  return (
    <div>
      <div className="mx-auto my-12 max-w-[33.75rem] px-6 text-black antialiased sm:my-32">
        <h1 className="text-2xl text-base-content">追蹤股票除權息</h1>
        <div className="flex flex-col gap-4 mt-8">
          <AutoComplete
            options={stockOptionList}
            emptyMessage="查無結果..."
            placeholder="搜尋上市上櫃股票"
            isLoading={isLoading}
            value={stockWatchList[currentSymbol]?.label}
            onInputValueChange={debounceInputValueChange}
            onItemSelected={handleItemSelected}
          />
          <span className="text-sm text-base-content">選擇的股票:
            {stockWatchList[currentSymbol]?.label}
          </span>
        </div>
      </div>
      <div className="mx-auto p-4 max-w-4xl">
        <StockCalendar symbol={currentSymbol} />
      </div>
    </div>
  )
}

