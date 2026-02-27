import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Check, X, Loader } from 'lucide-react';
import { sanitizeSlug, validateSlug, checkSlugAvailability } from '../utils/slugUtils';
import './SlugInput.css';

const SlugInput = ({ value, onChange, cardType, onValidationChange }) => {
    const [slug, setSlug] = useState(value || '');
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState(null);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        setSlug(value || '');
    }, [value]);

    // Keep validation lightweight while typing.
    useEffect(() => {
        if (!slug) {
            setAvailable(null);
            setError('');
            onValidationChange?.(true);
            return;
        }

        const validation = validateSlug(slug);
        if (!validation.valid) {
            setError(validation.error);
            setAvailable(false);
            onValidationChange?.(false);
            return;
        }

        setError('');
        setAvailable(null);
        onValidationChange?.(true);
    }, [slug, onValidationChange]);

    const handleChange = useCallback((e) => {
        const sanitized = sanitizeSlug(e.target.value);
        setSlug(sanitized);
        onChange(sanitized);
    }, [onChange]);

    const runAvailabilityCheck = useCallback(async () => {
        if (!slug) return;

        const validation = validateSlug(slug);
        if (!validation.valid) return;

        setChecking(true);
        try {
            const isAvailable = await checkSlugAvailability(slug);
            setAvailable(isAvailable);
            onValidationChange?.(isAvailable);
            setError(isAvailable ? '' : 'This slug is already taken');
        } catch {
            setError('Error checking availability');
            setAvailable(false);
            onValidationChange?.(false);
        } finally {
            setChecking(false);
        }
    }, [slug, onValidationChange]);

    const handleBlur = useCallback(() => {
        setTouched(true);
        runAvailabilityCheck();
    }, [runAvailabilityCheck]);

    return (
        <div className="slug-input-container">
            <label className="slug-label">
                <Link2 size={16} />
                Custom URL (Optional)
            </label>
            <div className="slug-input-wrapper">
                <span className="slug-prefix">egreet.in/{cardType}/</span>
                <input
                    type="text"
                    className={`slug-input ${available === true ? 'available' : available === false ? 'unavailable' : ''}`}
                    placeholder="my-custom-url"
                    value={slug}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={50}
                />
                <div className="slug-status">
                    {checking && <Loader size={16} className="spin" />}
                    {!checking && available === true && <Check size={16} className="check" />}
                    {!checking && available === false && <X size={16} className="cross" />}
                </div>
            </div>
            {error && <p className="slug-error">{error}</p>}
            {!error && touched && available === null && slug && (
                <p className="slug-hint">Slug format looks good. Click outside to verify availability.</p>
            )}
            {available === true && <p className="slug-success">Available</p>}
        </div>
    );
};

export default React.memo(SlugInput);
