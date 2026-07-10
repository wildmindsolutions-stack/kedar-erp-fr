import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  light?: boolean;
}

const sizes = {
  sm: { img: 36, text: 'text-sm', sub: 'text-[10px]' },
  md: { img: 44, text: 'text-lg', sub: 'text-xs' },
  lg: { img: 72, text: 'text-2xl', sub: 'text-sm' },
};

export function BrandLogo({
  size = 'md',
  showText = true,
  subtitle = 'ERP System',
  className,
  light = false,
}: BrandLogoProps) {
  const s = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/images/logo.png"
        alt="Kedar Foundation"
        width={s.img}
        height={s.img}
        className={cn('shrink-0 rounded-full object-cover', size === 'lg' && 'border-2 border-kedar-gold/40')}
        priority
      />
      {showText && (
        <div className="min-w-0">
          <p
            className={cn(
              'font-semibold leading-tight',
              s.text,
              light ? 'text-kedar-gold' : 'text-kedar-gold',
            )}
          >
            Kedar Enterprise
          </p>
          {subtitle && (
            <p
              className={cn(
                s.sub,
                light ? 'text-white/60' : 'text-white/60',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
