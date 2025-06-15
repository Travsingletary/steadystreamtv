
import { Link } from "react-router-dom";

interface NavItem {
  name: string;
  href: string;
}

interface NavLinksProps {
  items: NavItem[];
}

export const NavLinks = ({ items }: NavLinksProps) => {
  return (
    <div className="ml-10 flex items-baseline space-x-4">
      {items.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {item.name}
        </a>
      ))}
    </div>
  );
};
