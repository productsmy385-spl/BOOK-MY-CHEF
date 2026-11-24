import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export default function Brand({ to = '/', suffix }) {
  return (
    <Link to={to} className="flex items-center gap-2 shrink-0" aria-label="Book My Chef home">
      <span className="w-8 h-8 rounded-md bg-navy text-white flex items-center justify-center">
        <ChefHat className="w-[18px] h-[18px]" aria-hidden />
      </span>
      <span className="font-heading font-bold text-[16px] text-ink tracking-tight">
        Book My Chef{suffix && <span className="text-muted font-medium"> · {suffix}</span>}
      </span>
    </Link>
  );
}
