interface ButtonProps {
    label: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export function Button({ label, onClick, className, disabled }: ButtonProps) {
    return (
        <button 
            onClick={onClick} 
            className={className} 
            disabled={disabled}
        >
            {label}
        </button>
    )
}