// const TokenKey = 'token';

// export function getToken() {
//   const token = localStorage.getItem(TokenKey);
//   if (token === null) {
//     window.location.replace('/login');
//   }
//   return 'Bearer ' + token;
// }

// export function setToken(token: string) {
//   localStorage.setItem(TokenKey, token);
// }

// export function removeToken() {
//   localStorage.removeItem(TokenKey);
// }
const TokenKey = 'token'

export function getToken(): string {
  const token = localStorage.getItem(TokenKey)

  if (!token) {
    window.location.replace('/login')
    // 抛出错误确保类型安全，避免返回 undefined
    throw new Error('Authentication token not found')
  }

  return `Bearer ${token}`
}

export function setToken(token: string): void {
  localStorage.setItem(TokenKey, token)
}

export function removeToken(): void {
  localStorage.removeItem(TokenKey)
}
