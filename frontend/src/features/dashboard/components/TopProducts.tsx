interface Product {
  rank: number;
  name: string;
  image: string;
  sold: string;
  revenue: string;
}

// Placeholder demo data — replaced by real product media in Sprint 4 (Products).
const products: Product[] = [
  {
    rank: 1,
    name: 'Floral Maxi Dress',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=80&h=80&q=80',
    sold: '1,245 sold',
    revenue: '₹2,499',
  },
  {
    rank: 2,
    name: 'Denim Jacket',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=80&h=80&q=80',
    sold: '982 sold',
    revenue: '₹3,299',
  },
  {
    rank: 3,
    name: 'Leather Tote Bag',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=80&h=80&q=80',
    sold: '653 sold',
    revenue: '₹4,999',
  },
  {
    rank: 4,
    name: 'Classic White Sneakers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=80&h=80&q=80',
    sold: '529 sold',
    revenue: '₹3,999',
  },
  {
    rank: 5,
    name: 'Oversized Cotton Tee',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=80&h=80&q=80',
    sold: '425 sold',
    revenue: '₹899',
  },
];

export function TopProducts() {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text">Top Selling Products</h3>
        <button className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer">
          View All
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 space-y-3.5">
        {products.map((prod) => (
          <div
            key={prod.rank}
            className="flex items-center justify-between group hover:bg-bg/40 rounded-md p-1 transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-bg text-[10px] font-bold text-text-secondary border border-border/40">
                {prod.rank}
              </span>
              
              {/* Product Image */}
              <img
                src={prod.image}
                alt={prod.name}
                className="h-8.5 w-8.5 rounded-md border border-border object-cover bg-bg shrink-0"
              />

              {/* Product Info */}
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-text group-hover:text-indigo-500 transition-colors">
                  {prod.name}
                </span>
                <span className="text-[10px] font-semibold text-text-secondary mt-1">
                  {prod.sold}
                </span>
              </div>
            </div>

            {/* Price Info */}
            <div className="font-mono text-xs font-bold text-text text-right">
              {prod.revenue}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
