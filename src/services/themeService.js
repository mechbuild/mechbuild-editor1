const ThemeService = {
    getTheme() {
        return {
            palette: {
                mode: 'dark',
                primary: {
                    main: '#90caf9',
                },
                secondary: {
                    main: '#f48fb1',
                },
            },
        };
    },

    toggleTheme() {
        // Tema değiştirme mantığı buraya gelecek
        console.log('Theme toggled');
    }
};

export default ThemeService; 