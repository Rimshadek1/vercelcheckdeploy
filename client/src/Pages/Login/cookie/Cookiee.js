import React, { useState } from 'react';
import Cookies from 'js-cookie';
import './cookie.css'

const CookieConsent = () => {
    const [showBanner, setShowBanner] = useState(!Cookies.get('cookieConsent'));

    const acceptCookies = () => {
        Cookies.set('cookieConsent', 'true', { expires: 365 });
        setShowBanner(false);
    };

    return (
        showBanner && (
            <div className="cookie-consent">
                <p>This website uses cookies to ensure you get the best experience.</p>
                <button className='btn btn-warning' onClick={acceptCookies}>Accept All Cookies In Settings</button>
            </div>
        )
    );
};

export default CookieConsent;
