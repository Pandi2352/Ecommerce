import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
}

interface CategoryContextValue {
  categories: Category[];
  flatCategories: Category[];
  loading: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  refetch: () => void;
}

const CategoryContext = createContext<CategoryContextValue>({
  categories: [],
  flatCategories: [],
  loading: true,
  selectedCategory: null,
  setSelectedCategory: () => {},
  refetch: () => {},
});

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
    axios
      .get<{ data: Category[] }>(`${apiUrl}/categories?tree=true`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCategories(list);
        setFlatCategories(flatten(list));
      })
      .catch((err) => {
        console.warn('Failed to load categories:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        flatCategories,
        loading,
        selectedCategory,
        setSelectedCategory,
        refetch: fetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => useContext(CategoryContext);

function flatten(list: Category[]): Category[] {
  let result: Category[] = [];
  for (const cat of list) {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flatten(cat.children));
    }
  }
  return result;
}
