export function useAuth() {
  const signOut = () => {
    sessionStorage.removeItem('auth_token');
    window.location.href = '/entrar';
  };

  return { signOut };
}
