export const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) return 'Password must contain at least one special character';
    return null;
};

export const generateStrongPassword = () => {
    const length = 12;
    const charset = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        number: '0123456789',
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let password = '';
    // Ensure at least one of each required type
    password += charset.upper[Math.floor(Math.random() * charset.upper.length)];
    password += charset.lower[Math.floor(Math.random() * charset.lower.length)];
    password += charset.number[Math.floor(Math.random() * charset.number.length)];
    password += charset.special[Math.floor(Math.random() * charset.special.length)];

    const allChars = Object.values(charset).join('');
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};
