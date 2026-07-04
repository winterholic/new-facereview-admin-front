import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signIn, getMe } from 'api/auth';
import HeaderToken from 'api/HeaderToken';
import TextInput from 'components/TextInput/TextInput';
import { useAuthStore } from 'store/authStore';

import './loginPage.scss';

const LoginPage = (): ReactElement => {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: loginData } = await signIn({ email, password });
      setToken(loginData.access_token);
      HeaderToken.set(loginData.access_token);

      const { data: me } = await getMe();
      if (me.role !== 'ADMIN') {
        clearAuth();
        toast.error('관리자 권한이 없습니다.');
        return;
      }

      setUser({ user_id: me.user_id, user_name: me.name });
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      clearAuth();
      toast.error('로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-page__panel" onSubmit={handleSubmit}>
        <img src="/logo.svg" alt="" className="login-page__logo" />
        <h1 className="login-page__title font-title-large">FaceReview Admin</h1>
        <TextInput
          label="이메일"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextInput
          label="비밀번호"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button
          type="submit"
          className="login-page__submit font-label-large"
          disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
