import React from 'react';

type ButtonVariant = 'generate' | 'next' | 'submit' | 'close' |'uploadImage';

interface ButtonProps {

  variant: ButtonVariant;
  label?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  generate: `flex items-center uw:text-3xl uw:py-5 uw:gap-4 justify-center gap-1 bg-orange-600 hover:bg-orange-700 py-1 text-white rounded-md transition-colors cursor-pointer `,
  next:     'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer',
  submit:   'bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer',
  close:    'bg-red-500 hover:bg-red-600 text-white cursor-pointer',
  uploadImage: 'flex items-center justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-1 px-1 bg-white rounded-md transition-colors cursor-pointer'
};

/**
 * A reusable button component with Tailwind CSS variants.
 * Accepts either `children` or `label` as content.
 */
export const Button: React.FC<ButtonProps> = ({
  variant,
  label,
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  const variantClass = variantClasses[variant];
  const combinedClasses = ` ${variantClass} ${className}`.trim();
  const content = children ?? label;

  return (
    <button
      type={variant === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      className={combinedClasses}
      disabled={disabled}
    >
      {content}
    </button>
  );
};
