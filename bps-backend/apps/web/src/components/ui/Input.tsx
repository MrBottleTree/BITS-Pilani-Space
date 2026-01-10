interface InputProps {
    placeholder: string;
    className?: string; 
    onChange: (e: any) => void;
}

export function Input({ placeholder, className, onChange }: InputProps) {
    return (
        <input 
            type="text" 
            placeholder={placeholder} 
            className={className}
            onChange={onChange}
        />
    )
}