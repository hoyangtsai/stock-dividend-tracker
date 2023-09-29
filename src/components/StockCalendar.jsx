import { useState, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list';
import enLocale from '@fullcalendar/core/locales/en-gb'
import twLocale from '@fullcalendar/core/locales/zh-tw'
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/perspective.css';
import useSWR from 'swr'
import { useSelector } from 'react-redux';
import LoadingMask from '@/components/LoadingMask';
import randomColor from 'randomcolor';

const HOST = 'https://ntp.tshy.me/stock-service';

const fetcher = (url) => fetch(url).then(r => r.json());

const StockCalendar = ({ symbol }) => {
  const stockWatchList = useSelector((state) => state.stock.watchList);

  const [events, setEvents] = useState([]);

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

  const { data: resp, error, isLoading } = useSWR(symbol != '' ? `${HOST}/stock/${symbol}` : null, fetcher);

  useMemo(() => {    
    if (!resp?.data || events.some(item => item.symbol == symbol)) return;
    
    const { data } = resp;

    const aColor = randomColor({
      luminosity: 'dark',
    });

    let eventDates = [];
    for (const r of data) {
      const {
        CashExDividendTradingDate, CashEarningsDistribution, CashStatutorySurplus, 
        StockExDividendTradingDate, StockEarningsDistribution, StockStatutorySurplus } = r;
      
      // twice parseFloat is to remove tailing zeros
      let roundCash = parseFloat(
            parseFloat((CashEarningsDistribution * 10000 + CashStatutorySurplus * 10000) / 10000).toFixed(4)),
          roundStock = parseFloat(
            parseFloat((StockEarningsDistribution * 10000 + StockStatutorySurplus * 10000) / 10000).toFixed(4));    
      let title = stockWatchList[symbol]?.name || '';
      if (CashEarningsDistribution == 0 &&
        (StockEarningsDistribution > 0 || StockStatutorySurplus > 0)) {
        eventDates.push({
          title: `${title}除權`,
          start: StockExDividendTradingDate,
          description: `配股:${roundStock}`,
          symbol: symbol,
          color: aColor,
        });
      } else if (
        StockEarningsDistribution == 0 &&
        (CashEarningsDistribution > 0 || CashStatutorySurplus > 0)) {
        
        eventDates.push({
          title: `${title}除息`,
          start: CashExDividendTradingDate,
          description: `現金:${roundCash}`,
          symbol: symbol,
          color: aColor,
        });
      } else if (
          (CashEarningsDistribution > 0 || CashStatutorySurplus > 0) &&
          (StockEarningsDistribution > 0 || StockStatutorySurplus > 0)) {
        eventDates.push({
          title: `${title}除權息`,
          start: CashExDividendTradingDate,
          description: `現金:${roundCash}, 配股:${roundStock}`,
          symbol: symbol,
          color: aColor,
        });
      }
    }

    setEvents((prev) => [...prev, ...eventDates]);
  }, [events, resp]);

  return (
    <div className="relative">
      <LoadingMask isVisible={isLoading} />
      <div className="relative z-10">
        <FullCalendar
          height={480}
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
  )
}

export default StockCalendar