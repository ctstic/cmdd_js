import { http } from '../utils/request';

/** 登录接口 POST /api/auth/signin */
export async function signin(data: API_AUTH.LoginParams) {
  return http.post<API_AUTH.LoginResult>('/api/auth/signin', data, { needToken: false });
}
