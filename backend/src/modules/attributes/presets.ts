import type { AttributeType } from '@ecommerce/shared';

export interface PresetAttribute {
  key: string;
  label: string;
  type: AttributeType;
  options?: string[];
  unit?: string;
  group?: string;
  filterable?: boolean;
}

export interface ShopPreset {
  id: string;
  label: string;
  description: string;
  /** Suggested variant option axes (used by the product form in a later stage). */
  variantOptions: string[];
  attributes: PresetAttribute[];
}

/** Ships as data — clone + apply a preset to seed a shop's product fields. */
export const SHOP_PRESETS: ShopPreset[] = [
  {
    id: 'fashion',
    label: 'Fashion / Apparel',
    description: 'Clothing — size & colour variants, fabric and fit specs.',
    variantOptions: ['Size', 'Color'],
    attributes: [
      { key: 'material', label: 'Material', type: 'text', group: 'Specs', filterable: true },
      { key: 'fit', label: 'Fit', type: 'select', options: ['Slim', 'Regular', 'Relaxed', 'Oversized'], group: 'Specs', filterable: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Women', 'Men', 'Unisex', 'Kids'], group: 'Specs', filterable: true },
      { key: 'pattern', label: 'Pattern', type: 'text', group: 'Specs' },
      { key: 'care', label: 'Care instructions', type: 'textarea', group: 'Care' },
    ],
  },
  {
    id: 'footwear',
    label: 'Footwear',
    description: 'Shoes — size (and width) variants, material and closure specs.',
    variantOptions: ['Size', 'Width'],
    attributes: [
      { key: 'material', label: 'Material', type: 'text', group: 'Specs', filterable: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Women', 'Men', 'Unisex', 'Kids'], group: 'Specs', filterable: true },
      { key: 'closure', label: 'Closure', type: 'select', options: ['Lace-up', 'Slip-on', 'Velcro', 'Buckle'], group: 'Specs' },
      { key: 'sole', label: 'Sole', type: 'text', group: 'Specs' },
    ],
  },
  {
    id: 'electronics',
    label: 'Electronics',
    description: 'Gadgets — colour/storage variants, brand and warranty specs.',
    variantOptions: ['Color', 'Storage'],
    attributes: [
      { key: 'brand', label: 'Brand', type: 'text', group: 'General', filterable: true },
      { key: 'model', label: 'Model', type: 'text', group: 'General' },
      { key: 'warranty_months', label: 'Warranty', type: 'number', unit: 'months', group: 'General' },
      { key: 'power', label: 'Power', type: 'text', unit: 'W', group: 'Specs' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', group: 'Specs' },
    ],
  },
  {
    id: 'grocery',
    label: 'Grocery / FMCG',
    description: 'Consumables — size/pack variants, brand and nutrition specs.',
    variantOptions: ['Size', 'Pack'],
    attributes: [
      { key: 'brand', label: 'Brand', type: 'text', group: 'General', filterable: true },
      { key: 'expiry', label: 'Best before', type: 'date', group: 'General' },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea', group: 'Nutrition' },
      { key: 'veg', label: 'Vegetarian', type: 'boolean', group: 'Nutrition', filterable: true },
    ],
  },
  {
    id: 'blank',
    label: 'Blank',
    description: 'Start with no fields and build your own.',
    variantOptions: [],
    attributes: [],
  },
];

export const getPreset = (id: string): ShopPreset | undefined => SHOP_PRESETS.find((p) => p.id === id);
