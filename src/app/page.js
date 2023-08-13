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

const FUGLE_API = process.env.NEXT_PUBLIC_FUGLE_API_KEY;
const FUGLE_END_POINT = process.env.NEXT_PUBLIC_FUGLE_END_POINT;

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

  const getLastSelectedStock = () => {
    if (Object.keys(stockWatchList).length === 0) return '';

    const keys = Object.keys(stockWatchList);
    return stockWatchList[keys[keys.length - 1]]?.label;
  }
    
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

  const getStockInfo = async (symbol) => {
    // if (symbol) {
    //   const res = await fetch(`http://127.0.0.1:5000/stock/${symbol}`);
    //   if (!res.ok) {
    //     throw new Error('Failed to fetch');
    //   }
    //   const response = await res.json();
    //   const { data } = response;
    //   console.log('data :>> ', data);
    // }
  }

  const handleStockSearchChange = debounce((value) => {
    if (value) {
      setStockOptions(value);
    } else {
      setStockOptionList([]);
    }
  }, 500);

  const handleStockItemSelected = useCallback((option) => {
    dispatch(setWatchList(option));
    getStockInfo(option?.symbol);
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
        <h1 className="text-2xl">追蹤股票除權息</h1>
        <div className="flex flex-col gap-4 mt-8">
          <AutoComplete
            options={stockOptionList}
            emptyMessage="查無結果..."
            placeholder="搜尋股票"
            isLoading={isLoading}
            value={getLastSelectedStock()}
            onInputValueChange={handleStockSearchChange}
            onItemSelected={handleStockItemSelected}
          />
          <span className="text-sm">選擇的股票:
            {getLastSelectedStock()}
          </span>
        </div>
      </div>
      <div className="mx-auto p-4 max-w-4xl">
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
          eventColor="green"
          events={events}
          eventDidMount={handleCalMount}
        />
      </div>
    </div>
  )
}

