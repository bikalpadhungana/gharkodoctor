import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const SEO = ({ title, description, keywords, canonicalPath }) => {
  const { lang } = useAuth();

  useEffect(() => {
    // Default titles based on language
    const defaultTitle = lang === 'ne'
      ? 'घरको डाक्टर | GharkoDoctor — घरमै डाक्टर र नर्स सेवा'
      : 'GharkoDoctor — Home Medical Visit & Nurse Service Nepal';

    const pageTitle = title ? `${title} | GharkoDoctor` : defaultTitle;
    document.title = pageTitle;

    // Meta description update
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }

    // Meta keywords update
    if (keywords) {
      let metaKw = document.querySelector('meta[name="keywords"]');
      if (metaKw) {
        metaKw.setAttribute('content', keywords);
      }
    }

    // Canonical link update
    if (canonicalPath) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', `https://gharkodoctor.com${canonicalPath}`);
      }
    }
  }, [title, description, keywords, canonicalPath, lang]);

  return null;
};
