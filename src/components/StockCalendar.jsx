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

const HOST = 'https://ntp.tshy.me/stock-service';

const dummy = [
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
];

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

    let eventDates = [];
    for (const r of data) {
      const { CashExDividendTradingDate, CashEarningsDistribution, StockExDividendTradingDate, StockEarningsDistribution } = r;
      
      let roundCash = (Math.round(CashEarningsDistribution * 10000) / 10000),
          roundStock = (Math.round(StockEarningsDistribution * 10000) / 10000);

      if (CashEarningsDistribution == 0 && StockEarningsDistribution > 0) {
        eventDates.push({
          title: `${stockWatchList[symbol]?.name || '' }除權`,
          start: StockExDividendTradingDate,
          description: `配股:${roundStock}`,
          symbol: symbol,
        });
      } else if (StockEarningsDistribution == 0 && CashEarningsDistribution > 0) {
        eventDates.push({
          title: `${stockWatchList[symbol]?.name || '' }除息`,
          start: CashExDividendTradingDate,
          description: `現金:${roundCash}`,
          symbol: symbol,
        });
      } else if (CashEarningsDistribution > 0 && StockEarningsDistribution > 0) {
        eventDates.push({
          title: `${stockWatchList[symbol]?.name || '' }除權息`,
          // title: `除權息`,
          start: CashExDividendTradingDate,
          description: `現金:${roundCash}, 配股:${roundStock}`,
          symbol: symbol,
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