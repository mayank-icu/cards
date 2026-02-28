import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ customCrumbs }) => {
    const location = useLocation();
    const paths = location.pathname.split('/').filter(p => p);

    // If customCrumbs provided, use them. Else auto-generate.
    const crumbs = customCrumbs || [
        { name: 'Home', path: '/' },
        { name: 'Cards', path: '/cards' },
        ...paths.slice(0, 1).map(p => ({
            name: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '),
            path: `/${p}/create`
        }))
    ];

    return (
        <nav aria-label="Breadcrumb" style={{ padding: '20px 20px 0', maxWidth: '1200px', margin: '0 auto' }}>
            <ol style={{
                display: 'flex',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                alignItems: 'center',
                fontSize: '0.9rem',
                color: '#6c757d'
            }}>
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <li key={crumb.path} style={{ display: 'flex', alignItems: 'center' }}>
                            {isLast ? (
                                <span style={{ color: '#495057', fontWeight: '500' }} aria-current="page">
                                    {crumb.name}
                                </span>
                            ) : (
                                <>
                                    <Link
                                        to={crumb.path}
                                        style={{ color: '#667eea', textDecoration: 'none' }}
                                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                    >
                                        {crumb.name}
                                    </Link>
                                    <ChevronRight size={14} style={{ margin: '0 8px', color: '#adb5bd' }} />
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
