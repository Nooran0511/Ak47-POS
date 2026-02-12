import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: number, updates: Partial<User>) => boolean;
  deleteUser: (id: number) => boolean;
  getUsers: () => User[];
}

// Default admin user only - no demo data
const defaultUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: defaultUsers,
      isAuthenticated: false,
      
      login: (username: string, password: string) => {
        const { users } = get();
        const user = users.find(
          u => u.username === username && u.password === password && u.status === 'active'
        );
        
        if (user) {
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      addUser: (userData: Omit<User, 'id'>) => {
        const { users } = get();
        const newUser: User = {
          ...userData,
          id: Math.max(0, ...users.map(u => u.id)) + 1,
          createdAt: new Date().toISOString(),
        };
        set({ users: [...users, newUser] });
        return newUser;
      },
      
      updateUser: (id: number, updates: Partial<User>) => {
        const { users } = get();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return false;
        
        const updatedUsers = [...users];
        updatedUsers[index] = { ...updatedUsers[index], ...updates };
        set({ users: updatedUsers });
        return true;
      },
      
      deleteUser: (id: number) => {
        const { users } = get();
        // Prevent deleting last admin
        const admins = users.filter(u => u.role === 'admin');
        const userToDelete = users.find(u => u.id === id);
        
        if (userToDelete?.role === 'admin' && admins.length <= 1) {
          return false;
        }
        
        set({ users: users.filter(u => u.id !== id) });
        return true;
      },
      
      getUsers: () => {
        return get().users;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
