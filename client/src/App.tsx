import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { Draft } from './screens/Draft';
import { ReadyCheck } from './screens/ReadyCheck';
import { Match } from './screens/Match';
import { Result } from './screens/Result';
import { ToastStack, ConnectionBanner } from './components/ui/Toast';
import { useGameStore } from './store/useGameStore';

function App() {
  const phase = useGameStore((s) => s.phase);
  const matchData = useGameStore((s) => s.matchData);
  const viewingResult = useGameStore((s) => s.viewingResult);

  let screen;
  if (phase === 'HOME') screen = <Home />;
  else if (phase === 'LOBBY') screen = <Lobby />;
  else if (phase === 'DRAFTING') screen = <Draft />;
  else if (phase === 'READY_CHECK') screen = <ReadyCheck />;
  else if (matchData && !viewingResult) screen = <Match />;
  else if (matchData && viewingResult) screen = <Result />;
  else screen = <Lobby />;

  return (
    <>
      <ConnectionBanner />
      {screen}
      <ToastStack />
    </>
  );
}

export default App;
