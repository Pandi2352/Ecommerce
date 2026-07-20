export { ProductsPage } from './ProductsPage';
export { ProductEditorPage } from './ProductEditorPage';
export {
  useProducts,
  useProductStats,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchProductStats,
  bulkProducts,
} from './api';
export type {
  Product,
  ProductInput,
  ProductStats,
  ProductsFilters,
  ProductStatus,
  ProductVariant,
  VariantOption,
} from './api';
