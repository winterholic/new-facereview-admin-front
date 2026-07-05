import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import HeaderToken from 'api/HeaderToken';
import './styles/main.scss';

// NOTE: zustand persist의 localStorage rehydration은 완전히 동기적이지 않아서(마이크로태스크
// 경유), React Query가 마운트 직후 쏘는 첫 요청이 헤더 복원보다 먼저 나가 매번 새로고침마다
// 401→reissue가 한 번씩 발생했음(실측 확인). React가 렌더링을 시작하기 전, 여기서 localStorage를
// 직접 동기적으로 읽어 Authorization 헤더를 먼저 채워둔다 — zustand 자체 rehydration 타이밍에
// 의존하지 않는 확실한 방법.
try {
  const raw = localStorage.getItem('admin-auth-storage');
  const accessToken = raw ? JSON.parse(raw)?.state?.access_token : null;
  if (accessToken) {
    HeaderToken.set(accessToken);
  }
} catch {
  // 손상된 값이면 그냥 무시 — 401 인터셉터가 정상적으로 재발급 처리함
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
