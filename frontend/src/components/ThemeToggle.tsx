import React from 'react';
import { useTheme } from 'next-themes';
import { Switch } from '@nextui-org/react';
import { SunIcon, MoonIcon } from 'lucide-react';


const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();
    console.log("Current theme:", theme);
    return (
        <Switch
            checked={theme === 'dark'}
            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
            size="lg"
            color="secondary"
            startContent={<SunIcon />}
            endContent={<MoonIcon />}
        />
    );
};

export default ThemeToggle;