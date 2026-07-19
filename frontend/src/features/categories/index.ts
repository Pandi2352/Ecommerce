// Public surface of the categories feature.
export { CategoriesPage } from './CategoriesPage';
export {
  useCategories,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './api';
export type { Category, CategoryInput } from './api';
