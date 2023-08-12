'use client';
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

const FUGLE_API = process.env.NEXT_PUBLIC_FUGLE_API_KEY;
const FUGLE_END_POINT = process.env.NEXT_PUBLIC_FUGLE_END_POINT;

const getTSEStocks = async () => {
  const res = await fetch(`${FUGLE_END_POINT}/snapshot/quotes/TSE`, {
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
  const [stock, setStock] = useState('')
  const [stockList, setStockList] = useState([])
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

  useEffect(() => {
    async function setAllStock() {
      setLoading(true);
      try {
        const allStocks = await getTSEStocks();
        setAllStocks(allStocks);
      } catch (error) {
        throw new Error(error);
      } finally {
        setLoading(false);
      }
    }
    setAllStock();
  }, []);

  const setStockOptions = (code) => {
    const matchedStock = allStocks.filter(((item) => item.symbol.includes(code)));
    if (matchedStock.length > 0) {
      const resultList = matchedStock.map((item) => {
        return { value: item.symbol, label: `${item.symbol} - ${item.name}` }
      });
      setStockList(resultList);
    } else {
      setStockList([]);
    }
  }

  // const getStockInfo = async (code) => {
  // }

  const handleStockSearchChange = debounce((value) => {
    if (value) {
      setStockOptions(value);
    } else {
      setStockList([]);
    }
  }, 500);

  const handleStockItemSelected = useCallback((option) => {
    setStock(option);
  }, []);

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

  if (stock) {

  }

  return (
    <div>
      <div className="mx-auto my-12 max-w-[33.75rem] px-6 text-black antialiased sm:my-32">
        <h1 className="text-2xl">追蹤股票除權息</h1>
        <div className="flex flex-col gap-4 mt-8">
          <AutoComplete
            options={stockList}
            emptyMessage="查無結果..."
            placeholder="搜尋股票"
            isLoading={isLoading}
            value={stock}
            onInputValueChange={handleStockSearchChange}
            onItemSelected={handleStockItemSelected}
          />
          <span className="text-sm">選擇的股票: {stock?.label ? stock.label : "尚未選擇"}</span>
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

