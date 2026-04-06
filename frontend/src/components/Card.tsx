interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
    return (
        <div
            className={`rounded-xl border border-gray-200 bg-white ${className}`}
        >
            {children}
        </div>
    );
}
