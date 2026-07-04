import api from './index';

export const setAuthToken = (token: string | null): void => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const HeaderToken = {
  set: setAuthToken,
};

export default HeaderToken;
