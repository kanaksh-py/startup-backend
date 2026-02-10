const blockedProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

const verifyStartup = (email, website) => {
    const emailDomain = email.split('@')[1];
    const websiteDomain = website
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .split('/')[0];

    if (blockedProviders.includes(emailDomain)) return false;

    return true;
    };

export default verifyStartup;
