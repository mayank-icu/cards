import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered animations
 * Elements animate when they come into viewport
 */
export const useScrollAnimation = (options = {}) => {
    const {
        threshold = 0.1, // Trigger when 10% of element is visible
        rootMargin = '0px 0px -50px 0px', // Trigger slightly before element enters viewport
        triggerOnce = true, // Only animate once
    } = options;

    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [threshold, rootMargin, triggerOnce]);

    return [elementRef, isVisible];
};

/**
 * Batch scroll animation for multiple elements
 * Used for grids and lists
 */
export const useScrollAnimationBatch = (itemCount, options = {}) => {
    const {
        threshold = 0.1,
        rootMargin = '0px 0px -50px 0px',
        triggerOnce = true,
        staggerDelay = 0.1, // Delay between each item animation
    } = options;

    const containerRef = useRef(null);
    const [visibleItems, setVisibleItems] = useState(new Set());

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const items = Array.from(container.children);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const index = items.indexOf(entry.target);
                    if (entry.isIntersecting) {
                        setVisibleItems((prev) => new Set([...prev, index]));
                        if (triggerOnce) {
                            observer.unobserve(entry.target);
                        }
                    } else if (!triggerOnce) {
                        setVisibleItems((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(index);
                            return newSet;
                        });
                    }
                });
            },
            { threshold, rootMargin }
        );

        items.forEach((item) => observer.observe(item));

        return () => {
            items.forEach((item) => observer.unobserve(item));
        };
    }, [itemCount, threshold, rootMargin, triggerOnce]);

    return [containerRef, visibleItems];
};

export default useScrollAnimation;
