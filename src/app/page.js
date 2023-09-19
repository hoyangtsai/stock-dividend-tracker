'use client';

import { useDispatch, useSelector } from 'react-redux';
import { debounce } from "lodash";
import { AutoComplete } from "@/components/autocomplete"
import { useState, useCallback, useEffect } from "react"
import React from 'react'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list';
import enLocale from '@fullcalendar/core/locales/en-gb'
import twLocale from '@fullcalendar/core/locales/zh-tw'
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/perspective.css';
import { setWatchList } from '@/features/stock/stockSlice';
import usePrevious from '@/lib/hooks/usePrevious';
import LoadingMask from '@/components/LoadingMask';

const FUGLE_API = process.env.NEXT_PUBLIC_FUGLE_API_KEY;
const FUGLE_END_POINT = process.env.NEXT_PUBLIC_FUGLE_END_POINT;

const HOST = 'https://ntp.tshy.me/stock-service';

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
  const [events, setEvents] = useState([
    { title: 'event 1-1', start: '2023-07-01' },
    { 
      title: 'event 1-2',
      start: '2023-07-02',
      color: 'blue',
      description: 'description for Repeating Event'
    },
    { 
      title: 'event 2-1',
      start: '2023-07-06',
      color: 'purple',
      description: 'description for Repeating Event'
    },
    { title: 'event 2-2', start: '2023-07-07', },
  ]);
  const stockWatchList = useSelector((state) => state.stock.watchList);
  const dispatch = useDispatch();
  const [currentSymbol, setCurrentSymbol] = useState('');
  const lastSymbol = usePrevious(currentSymbol);
  const [isFetching, setIsFetching] = useState(false);

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

  const setStockOptions = (value) => {
    const matchedStock = allStocks.filter(((item) => item.symbol.includes(value) || item.name.includes(value)));
    if (matchedStock.length > 0) {
      const resultList = matchedStock.map((item) => {
        return { value: item.symbol, label: `${item.symbol} - ${item.name}`, ...item }
      });
      setStockOptionList(resultList);
    } else {
      setStockOptionList([]);
    }
  }

  // getStockInfo
  useEffect(() => {
    // const controller = new AbortController();
    // const signal = controller.signal;

    const getStockInfo = async (symbol) => {
      if (symbol) {
        setIsFetching(true);
        try {
          const res = await fetch(`${HOST}/stock/${symbol}`);
          if (!res.ok) {
            throw new Error('Failed to fetch');
          }
          const response = await res.json();
          const { data } = response;
          console.log('data :>> ', data);
    
          let eventDates = [];
          for (const rec of data) {
            const { CashExDividendTradingDate, CashEarningsDistribution, StockEarningsDistribution } = rec;
            
            eventDates.push({
              title: `${stockWatchList[currentSymbol]?.name || '' }除權息`,
              start: CashExDividendTradingDate,
              description: `現金:${CashEarningsDistribution}, 配股:${StockEarningsDistribution}`,
            })
          }
          setEvents(eventDates);
        } catch (e) {
          console.log('fetch StockInfo Error:', e);
          // console.log('signal.aborted:', signal.aborted);
        } finally {
          setIsFetching(false);
        }
      }
    };
  
    if (lastSymbol !== currentSymbol) {
      getStockInfo(currentSymbol);
    }

    return () => {
      // controller.abort();
    }
  }, [lastSymbol, currentSymbol])
  

  const handleStockSearchChange = debounce((value) => {
    if (value) {
      setStockOptions(value);
    } else {
      setStockOptionList([]);
    }
  }, 500);

  const handleStockItemSelected = useCallback(async (option) => {
    dispatch(setWatchList(option));
    console.log('option :>> ', option);
    setCurrentSymbol(option?.symbol || '');
  }, [dispatch]);

  const handleCalMount = useCallback((item) => {
    const { description = '' } = item?.event?.extendedProps;
    if (description) {
      tippy(item.el, {
        trigger: 'mouseenter',
        content: description,
        animation: 'perspective',
      })
    }
  }, []);

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
            onInputValueChange={handleStockSearchChange}
            onItemSelected={handleStockItemSelected}
          />
          <span className="text-sm text-base-content">選擇的股票:
            {stockWatchList[currentSymbol]?.label}
          </span>
        </div>
      </div>
      <div className="mx-auto p-4 max-w-4xl relative">
        <LoadingMask isVisible={isFetching} />
        <div className="relative z-10">
          <FullCalendar
            plugins={[ interactionPlugin, multiMonthPlugin, listPlugin ]}
            initialView="multiMonthYearGrid"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'multiMonthYearGrid,multiMonthYearStack,listYear'
            }}
            views={{
              multiMonthYearGrid: {
                type: 'multiMonthYear',
                buttonText: '網格'
              },
              multiMonthYearStack: {
                type: 'multiMonthYear',
                buttonText: '堆疊',
                multiMonthMaxColumns: 1
              },
              listYear: {
                buttonText: '列表顯示'
              },
            }}
            locale={twLocale}
            locales={[enLocale, twLocale]}
            events={events}
            eventDidMount={handleCalMount}
          />
        </div>
      </div>
    </div>
  )
}

