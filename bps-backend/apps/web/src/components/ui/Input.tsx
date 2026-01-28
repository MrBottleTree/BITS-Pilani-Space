interface InputProps {
    placeholder: string;
    className?: string; 
    type?: 'text' | 'password' | 'email';
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ placeholder, className, type = 'text', value, onChange }: InputProps) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            className={className}
            value={value}
            onChange={onChange}
        />
    )
}