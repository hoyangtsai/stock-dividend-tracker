import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './counterSlice';
import { Button } from '@/components/ui/button';

const Counter = () => {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => dispatch(increment())}>Increment</Button>
      <Button onClick={() => dispatch(decrement())}>Decrement</Button>
    </div>
  );
};

export default Counter;
