import useSWR from 'swr'

const HOST = '//ntp.tshy.me/stock-service';

const fetcher = (url) => fetch(url).then(r => r.json());

const useStock = (symbol) => {
  const { data, error, isLoading } = useSWR(`${HOST}/stock/${symbol}`, fetcher)

  if (error) return error
  if (isLoading) return isLoading
 
  return data
}

export default useStock